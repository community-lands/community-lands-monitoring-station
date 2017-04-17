var settings = require('../helpers/settings')
var tiles = require('../helpers/tile-layers')
var ServerEvents = require('../helpers/server-events')

var fs = require('fs'),
  path = require('path')

var CACHED_JSON = null;

ServerEvents.on('tl_after_reinspect', function(json) {
  CACHED_JSON = json;
});

function listTileLayers (req, res, next) {
  getTilesInfo(function(err, md) {
    if (err) {
      res.json(500, {
        message: err.message,
        error: err
      })
    } else {
      var names = []
      Object.keys(md).forEach(function(id) {
        var stats = md[id]
        if (stats.valid) {
          var uri;
          if (stats.directory == settings.getDefaultTilesDirectory())
            uri = '/monitoring-files/Maps/Tiles/' + stats.name;
          else
            uri = '/map-tiles/' + id
          names.push({name: stats.name, key: stats.key, uri: uri, format: stats.format});
        };
      });
      names.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0 });
      res.json(names)
    }
  })
}

function getTile (req, res, next) {
  getTilesInfo(function(err, md) {
    if (err)
      res.send(500)
    else {
      var id = req.params['id'], file = req.params['0']
      if (!file)
        res.send(404)
      else if (md[id]) {
        var stats = md[id]
        var filePath = path.join(stats.directory, stats.name, file)
        var contentType = 'image/' + (stats.format == 'png' ? 'png' : 'jpeg');

        res.type(contentType).sendFile(filePath);
      }
      else
        res.send(404)
    }
  });
}

/**
 * Performance boost
 */
function getTilesInfo(cb) {
  if (CACHED_JSON)
    cb(null, CACHED_JSON)
  else {
    tiles.get(function(err, data) {
      if (!err)
        CACHED_JSON = data;
      cb(err, data);
    });
  }
}

module.exports = {
  listTileLayers: listTileLayers,
  getTile: getTile
}
