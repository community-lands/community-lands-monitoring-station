require('dotenv').load()

var fs = require('fs')
var path = require('path')

var PREFIX = process.env.data_directory
var ROOT_PATH = path.join(PREFIX, 'Monitoring')
var TILES_FOLDER = path.join(path.join(ROOT_PATH, 'Maps'), 'Tiles')

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
