require('dotenv').load()

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

var PREFIX = process.env.data_directory
var ROOT_PATH = PREFIX + '/Monitoring'
var GLOBAL_FORMS = ROOT_PATH + '/Forms'
var GLOBAL_MAPS = ROOT_PATH + '/Maps'

function getFormUrls (cb) {
  var local_forms = ROOT_PATH + '/' + process.env.station + '/Forms'
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
          links[i] = process.env.baseUrl + '/forms/' + files[i]
        }
        cb(err, links)
      }
    })
  })
}

function getForm (file, cb) {
  var local_forms = ROOT_PATH + '/' + process.env.station + '/Forms'
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
  var mapFile = GLOBAL_MAPS + '/' + file
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
  var mapFile = GLOBAL_MAPS + '/' + file
  fs.writeFile(mapFile, data, function (err) {
    cb(err)
  })
}

module.exports = {
  getFormUrls: getFormUrls,
  getForm: getForm,
  getMap: getMap,
  saveMap: saveMap
}
