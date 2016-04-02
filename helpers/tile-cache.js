var http = require('http')
var fs = require('fs')
var mkdirp = require('mkdirp')
var queue = []

function lon2tile (lon, zoom) {
  return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)))
}

function lat2tile (lat, zoom) {
  return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)))
}

function run_queue () {
  console.log('' + queue.length + ' tiles remaining')
  var f = queue.shift()
  if (f) {
    f()
  } else {
    console.log('Nothing more to do.')
  }
}

function fetch (dir, src_url, target_file, cb) {
  var queueable = function () {
    console.log(src_url + '->' + target_file)
    mkdirp(dir, function (err) {
      var file = fs.createWriteStream(target_file)
      http.get(src_url, function (response) {
        response.pipe(file)
        file.on('finish', function () {
          file.close(cb) // close() is async, call cb after close completes.
          run_queue()
        })
      }).on('error', function (err) { // Handle errors
        fs.unlink(target_file) // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message)
        run_queue()
      })
    })
  }
  queue.push(queueable)
}

module.exports.pyramid_urls = function (from_lon, from_lat, to_lon, to_lat, start_zoom, end_zoom) {
  var tiles_needed = 0
  for (var zoom = start_zoom;zoom <= end_zoom;zoom++) { // # Bing maps max zoom is 19
    console.log('Calculating tiles for zoom level ' + zoom)
    var from_y_tile = lat2tile(from_lat, zoom)
    var to_y_tile = lat2tile(to_lat, zoom)
    if (to_y_tile < from_y_tile) {
      var tmp = from_y_tile
      from_y_tile = to_y_tile
      to_y_tile = tmp
    }
    var from_x_tile = lon2tile(from_lon, zoom)
    var to_x_tile = lon2tile(to_lon, zoom)
    if (to_x_tile < from_x_tile) {
      tmp = from_x_tile
      from_x_tile = to_x_tile
      to_x_tile = tmp
    }
    console.log('Need tiles from {' + zoom + '}/{' + from_x_tile + '}/{' + from_y_tile + '} to {' + zoom + '}/{' + to_x_tile + '}/{' + to_y_tile + '}')
    for (var xx = from_x_tile;xx <= to_x_tile;xx++) {
      for (var yy = from_y_tile;yy <= to_y_tile;yy++) {
        // src_url = "http://a.tile.openstreetmap.org/"+zoom+"/"+xx+"/"+yy+".png"
        var src_url = 'http://a.tile.openstreetmap.fr/hot/' + zoom + '/' + xx + '/' + yy + '.png'
        // This doesn't work, Google will throttle
        // src_url = "http://mt0.google.com/vt/lyrs=s@169000000&hl=en&x="+xx+"&y="+yy+"&z="+zoom+"&s=Ga"
        var target_file = './Monitoring/Maps/Tiles/' + zoom + '/' + xx + '/' + yy + '.png'
        var dir = './Monitoring/Maps/Tiles/' + zoom + '/' + xx
        fetch(dir, src_url, target_file, function (err) {
          if (err) console.error(err)
        })
      }
    }
    var count = Math.abs(to_y_tile - from_y_tile + 1) * Math.abs(to_x_tile - from_x_tile + 1)
    console.log('  ... which is ' + count + ' tiles')
    tiles_needed = tiles_needed + count
    console.log('  ... which is ' + tiles_needed + ' tiles overall')
    console.log('  ... which is about ' + (tiles_needed * 50) + ' KiB, ' + Math.round((tiles_needed * 50) / 1000) + ' MiB, ' + Math.round((tiles_needed * 50) / 1000000) + ' GiB')
  }
  run_queue()
}
