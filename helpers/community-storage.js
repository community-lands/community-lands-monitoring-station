require('dotenv').load();

var fs = require('fs')

var PREFIX = process.env.directory || ''
var ROOT_PATH = PREFIX + '/Community Lands Data/Monitoring'
var GLOBAL_FORMS = ROOT_PATH + '/Forms'

function getFormUrls(cb) {
  var local_forms = ROOT_PATH + '/' + process.env.station + '/Forms'
  fs.readdir(GLOBAL_FORMS, function(err, global) {
    fs.readdir(local_forms, function(err2, local) {
      if (err)
        cb(err)
      else if (err2)
        cb(err2)
      else {
        var files = global.concat(local)
        var links = []
        for (i = 0; i < files.length; i++) {
          links[i] = process.env.baseUrl + '/forms/' + files[i]
        }
        cb(err, links)
      }
    });
  });
}

function getForm(file, cb) {
  var local_forms = ROOT_PATH + '/' + process.env.station + '/Forms'
  fs.readFile(local_forms + '/' + file, function(err, data) {
    if (err)
      fs.readFile(GLOBAL_FORMS + '/' + file, function(err2, data2) {
        cb(err2, data2)
      });
    else
      cb(err, data)
  });
}

module.exports = {
  getFormUrls: getFormUrls,
  getForm: getForm
}
