var settings = require('./settings')

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

const GLOBAL_FORMS = settings.getGlobalFormsDirectory()
const GLOBAL_MAPS = settings.getGlobalMapsDirectory()

function getFormUrls (cb) {
  var local_forms = settings.getUserFormsDirectory()
  fs.readdir(GLOBAL_FORMS, function (err, global) {
    fs.readdir(local_forms, function (err2, local) {
      if (err) {
        cb(err)
      } else if (err2) {
        cb(err2)
      } else {
        var files = global.concat(local)
        var links = []
        for (var i = 0; i < files.length; i++) {
          links[i] = settings.getBaseUrl() + '/forms/' + files[i]
        }
        cb(err, links)
      }
    })
  })
}

function getForm (file, cb) {
  var local_forms = settings.getUserFormsDirectory()
  fs.readFile(local_forms + '/' + file, function (err, data) {
    if (err) {
      fs.readFile(GLOBAL_FORMS + '/' + file, function (err2, data2) {
        cb(err2, data2)
      })
    } else {
      cb(err, data)
    }
  })
}

function getMap (file, cb) {
  var mapFile = path.join(GLOBAL_MAPS, file)
  fs.exists(mapFile, function (exists) {
    if (exists) {
      fs.readFile(mapFile, function (err, data) {
        cb(err, data)
      })
    } else {
      mkdirp(path.dirname(mapFile), function (err) {
        if (err) {
          cb(err)
        } else {
          var blank = '{ "type": "FeatureCollection", "features": [] }'
          fs.writeFile(mapFile, blank, function (err) {
            if (err) {
              cb(err)
            } else {
              getMap(file, cb)
            }
          })
        }
      })
    }
  })
}

function saveMap (file, data, cb) {
  var contents = data
  if (typeof(data) != 'string')
    contents = JSON.stringify(data, null, 2)
  var mapFile = path.join(GLOBAL_MAPS, file)
  fs.writeFile(mapFile, contents, function (err) {
    cb(err)
  })
}

module.exports = {
  getFormUrls: getFormUrls,
  getForm: getForm,
  getMap: getMap,
  saveMap: saveMap
}
