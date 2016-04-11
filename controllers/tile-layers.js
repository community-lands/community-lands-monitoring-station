var settings = require('../helpers/settings')

var fs = require('fs')

const TILES_FOLDER = settings.getTilesDirectory()

function listTileLayers (req, res, next) {
  fs.readdir(TILES_FOLDER, function (err, files) {
    if (err) {
      res.json(500, {
        message: err.message,
        error: err
      })
    } else {
      var names = []
      for (var index in files) {
        names.push({name: files[index]})
      }
      res.json(names)
    }
  })
}

module.exports = {
  listTileLayers: listTileLayers
}
