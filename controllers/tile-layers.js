var settings = require('../helpers/settings')

var fs = require('fs'),
  path = require('path')

function listTileLayers (req, res, next) {
  fs.readdir(settings.getTilesDirectory(), function (err, files) {
    if (err) {
      res.json(500, {
        message: err.message,
        error: err
      })
    } else {
      var names = []
      for (var index in files) {
        var file = files[index];
        var stats = fs.statSync(path.join(settings.getTilesDirectory(), file));
        if (stats.isDirectory() && !isInt(file))
          var uri = '/monitoring-files/Maps/Tiles/' + file
          names.push({name: file, uri: uri});
      }
      names.sort(function(a, b) { return a < b ? -1 : a > b ? 1 : 0 });
      res.json(names)
    }
  })
}

function isInt(value) {
  var check = parseInt(value)
  return (!isNaN(value) && (check | 0) === check)
}

module.exports = {
  listTileLayers: listTileLayers
}
