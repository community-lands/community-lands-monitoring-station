var settings = require('../helpers/settings')

var fs = require('fs-extra')
var path = require('path')
var parse = require('csv-parse/lib/sync')

var TRACKS_FOLDER = path.join(settings.getRootPath(), 'Tracks')

function importColumbus (file, callback) {
  console.log('Importing ' + file)
  var guts = fs.readFileSync(file, 'utf8')
  console.log('Importing ' + file + ' (' + (guts.split(/\r\n|\r|\n/).length) + ' lines)')
  var records = parse(guts)
  var polyline = []
  var ptime = ''

  for (var _i = 0, _len = records.length; _i < _len; _i++) {
    var row = records[_i]
    var e = {}
    e['tag'] = row[1]
    e['date'] = row[2]
    e['time'] = row[3]
    e['latitude'] = row[4]
    e['longitude'] = row[5]
    e['height'] = row[6]
    e['speed'] = row[7]
    e['heading'] = row[8]
    e['vox'] = row[9]
    var float_coordinates = []
    var long = e['longitude']
    if (long.match(/E/)) {
      float_coordinates.push(parseFloat(long.replace(/[^0-9\.]+/g, '')))
    } else {
      float_coordinates.push(-parseFloat(long.replace(/[^0-9\.]+/g, '')))
    }
    var lat = e['latitude']
    if (lat.match(/N/)) {
      float_coordinates.push(parseFloat(lat.replace(/[^0-9\.]+/g, '')))
    } else {
      float_coordinates.push(-parseFloat(lat.replace(/[^0-9\.]+/g, '')))
    }
    float_coordinates.push(-parseFloat(e['height']))
    if (e['tag'] === 'V' || e['tag'] === 'C') {
      var name = 'Columbus Waypoint'
      if (e['tag'] === 'V') {
        name = 'Columbus Voice Memo'
      }
      var properties = {
        name: name,
        time: (e['date'] + ' ' + e['time'])
      }
      if (e['tag'] === 'V') {
        properties['voice_memo'] = e['vox'].replace('\u0000', '.WAV')
      }
      var geometry = {
        'type': 'Point',
        'coordinates': float_coordinates
      }
      var feature = {
        'type': 'Feature',
        'geometry': geometry,
        'properties': properties
      }
      callback(feature)
    } else if (e['tag'] === 'T') {
      polyline.push(float_coordinates)
      ptime = e['date'] + ' ' + e['time']
    }
  }

  console.log(polyline)
  if (polyline.length > 2) {
    console.log('rendering a track polyline')
    geometry = {
      'type': 'LineString',
      'coordinates': polyline
    }
    properties = {
      name: 'Columbus Track',
      time: ptime
    }
    feature = {
      'type': 'Feature',
      'geometry': geometry,
      'properties': properties
    }
    console.log(feature)
    callback(feature)
  }
}

function tracks (req, res) {
  var COLUMBUS_FOLDER = path.join(TRACKS_FOLDER, 'Columbus')
  var feature_collection_all = {
    'type': 'FeatureCollection',
    features: []
  }
  var files = fs.readdirSync(COLUMBUS_FOLDER)
  for (var index in files) {
    var name = '' + files[index]
    if (name.toLowerCase().endsWith('.csv')) {
      importColumbus(path.join(COLUMBUS_FOLDER, name), function (feature) {
        console.log(feature)
        feature_collection_all['features'].push(feature)
      })
    }
  }
  res.json(feature_collection_all)
}

function sounds (req, res) {
  var COLUMBUS_FOLDER = path.join(TRACKS_FOLDER, 'Columbus')
  var stream = fs.createReadStream(path.join(COLUMBUS_FOLDER, req.param('file')))
  stream.pipe(res)
}

module.exports = {
  tracks: tracks,
  sounds: sounds
}
