var settings = require('../helpers/settings')
var tiles = require('../helpers/tile-layers')

var fs = require('fs'),
  path = require('path')

function listTileLayers (req, res, next) {
  tiles.get(function(err, md) {
    if (err) {
      res.json(500, {
        message: err.message,
        error: err
      })
    } else {
      var names = []
      Object.keys(md).forEach(function(file) {
        var stats = md[file]
        if (stats.valid) {
          var uri = '/monitoring-files/Maps/Tiles/' + file
          names.push({name: file, uri: uri, format: stats.format});
        }
      });
      names.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0 });
      res.json(names)
    }
  })
}

module.exports = {
  listTileLayers: listTileLayers
}
