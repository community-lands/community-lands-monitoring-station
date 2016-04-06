require('dotenv').load()

var fs = require('fs')
var path = require('path')
var moment = require('moment')

var PREFIX = process.env.data_directory
var ROOT_PATH = path.join(PREFIX, 'Monitoring')
var FILTERS_FOLDER = path.join(ROOT_PATH, process.env.station, 'Filters')

function saveFilter (req, res, next) {
  var name = moment().format('YYYYMMDDHHmmss')
  var json = req.body
  fs.writeFile(path.join(FILTERS_FOLDER, name), JSON.stringify(json), function (err) {
    if (err) {
      res.json({error: true, message: 'File did not save'})
    } else {
      res.json({error: false, message: 'Save successful'})
    }
  })
}

function listFilters (req, res, next) {
  fs.readdir(FILTERS_FOLDER, function (err, files) {
    var names = []
    for (var index in files) {
      names.push({id: files[index], name: JSON.parse(fs.readFileSync(path.join(FILTERS_FOLDER, files[index]), 'utf8')).name})
    }
    res.json({filters: names})
  })
}

function config (req, res, next) {
  var data = {
    canSaveFilters: true,
    saveFilterTargets: [
      { name: 'Local', path: '/mapfilter/filters/local', value: 'local' }
    ],
    bingProxy: '/bing-proxy',
    bingMetadata: '/bing-metadata'
  };
  if (process.env.mapZoom) {
    try {
      data['mapZoom'] = parseInt(process.env.mapZoom, 10)
    } catch (e) {}
  }
  if (process.env.mapCenterLat) {
    try {
      data['mapCenterLat'] = parseFloat(process.env.mapCenterLat)
    } catch (e) {}
  }
  if (process.env.mapCenterLong) {
    try {
      data['mapCenterLong'] = parseFloat(process.env.mapCenterLong)
    } catch (e) {}
  }
  var filter = req.query.filter
  if (filter) {
    var file = path.join(process.env.data_directory, 'Monitoring', process.env.station, 'Filters', filter)
    fs.access(file, fs.F_OK | fs.R_OK, function (err) {
      if (err) {
        res.json(data)
      } else {
        fs.readFile(file, 'utf8', function (err, contents) {
          data['filters'] = JSON.parse(contents).value
          res.json(data)
        })
      }
    })
  } else {
    res.json(data)
  }
}

module.exports = {
  listFilters: listFilters,
  saveFilter: saveFilter,
  config: config

}
