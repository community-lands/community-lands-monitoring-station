var settings = require('../helpers/settings')

var fs = require('fs-extra')
var path = require('path')
var parse = require('csv-parse/lib/sync')
var uuid = require('uuid')

var TRACKS_FOLDER = settings.getTracksDirectory()

function importColumbus (file, callback) {
  console.log('Importing ' + file)
  var guts = fs.readFileSync(file, 'utf8')
  console.log('Importing ' + file + ' (' + (guts.split(/\r\n|\r|\n/).length) + ' lines)')
  var records = parse(guts)

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
    if (e['tag'] === 'V' || e['tag'] === 'C') {
      var instance_uuid = uuid.v1()
      var name = 'Columbus Waypoint'
      if (e['tag'] === 'V') {
        name = 'Columbus Voice Memo'
      }
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
      var properties = {
        'meta': {
          instanceId: 'uuid:' + instance_uuid,
          instanceName: name,
          formId: 'monitoring_form_v1',
          version: 1.0,
          submissionTime: (e['date'] + e['time']),
          deviceId: 'Columbus V900'
        }
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
    } else {
      // creation of track polylines is broken
    }
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
