var settings = require('../helpers/settings')

var fs = require('fs')
var path = require('path')
var moment = require('moment')

const FILTERS_FOLDER = settings.getFiltersDirectory()

function saveFilter (req, res, next) {
  var name = moment().format('YYYYMMDDHHmmss')
  var json = req.body
  fs.writeFile(path.join(FILTERS_FOLDER, name), JSON.stringify(json), function (err) {
    if (err) {
      res.json({error: true, code: 'save_failed', message: 'File did not save'})
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
    bingMetadata: '/bing-metadata',
    tiles: {
      url: '/tileLayers',
      tilesPath: '/monitoring-files/Maps/Tiles'
    }
  };
  data['tracks'] = {
    url: '/tracks',
    soundsPath: '/sounds',
    iconPath: '/mapfilter'
  }
  if (process.env.mapLayer)
    data['baseLayer'] = process.env.mapLayer
  var mapFilterSettings = settings.getMapFilterSettings();
  if (mapFilterSettings.mapZoom) {
    try {
      data['mapZoom'] = parseInt(mapFilterSettings.mapZoom, 10)
    } catch (e) {}
  }
  if (mapFilterSettings.mapCenterLat) {
    try {
      data['mapCenterLat'] = parseFloat(mapFilterSettings.mapCenterLat)
    } catch (e) {}
  }
  if (mapFilterSettings.mapCenterLong) {
    try {
      data['mapCenterLong'] = parseFloat(mapFilterSettings.mapCenterLong)
    } catch (e) {}
  }
  var filter = req.query.filter
  if (filter) {
    var file = path.join(settings.getFiltersDirectory(), filter)
    fs.access(file, fs.F_OK | fs.R_OK, function (err) {
      if (err) {
        res.json(data)
      } else {
        fs.readFile(file, 'utf8', function (err, contents) {
          var filterJson = JSON.parse(contents)
          data['filters'] = filterJson.value
          if (filterJson.baseLayer)
            data['baseLayer'] = filterJson.baseLayer
          if (filterJson.zoom)
            data['mapZoom'] = filterJson.zoom
          if (filterJson.latitude)
            data['mapCenterLat'] = filterJson.latitude
          if (filterJson.longitude)
            data['mapCenterLong'] = filterJson.longitude
          res.json(data)
        })
      }
    })
  } else {
    res.json(data)
  }
}

function exists(path) {
  try {
    fs.accessSync(path, fs.F_OK | fs.R_OK);
  } catch (err) {
    return false;
  }
  return true;
}

module.exports = {
  listFilters: listFilters,
  saveFilter: saveFilter,
  config: config

}
