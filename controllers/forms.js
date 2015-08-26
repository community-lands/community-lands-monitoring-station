require('dotenv').load()

var storage = require('../helpers/community-storage.js')
var createFormList = require('openrosa-formlist')
var persistFs = require('../helpers/persist-fs')
var fmt = require('moment')

var PREFIX = process.env.directory || ''
var ROOT_PATH = PREFIX + '/Community Lands Data/Monitoring'
var SUBMISSIONS = ROOT_PATH + '/' + process.env.station + '/Submissions'

function getForm(req, res, next) {
  storage.getForm(req.params.id, function(err, xml) {
    if (err)
      next(err)
    else {
      res.set('X-OpenRosa-Version', '1.0')
      res.set('Content-Type', 'text/xml').status(200).send(xml)
    }
  });
}

function getForms(req, res, next) {
  storage.getFormUrls(function(err, files) {
    if (err)
      next(err)
    else {
      var opts = {
        headers: {
          'User-Agent': 'file-odk'
        }
      }
      createFormList(files, opts, function(err, xml) {
        if (err)
          next(err)
        else {
          res.set('X-OpenRosa-Version', '1.0')
          res.set('Content-type', 'text/xml; charset=utf-8')
          res.status(200).send(xml)
        }
      });
    }
  });
}

function createForm(req, res, next) {
  var submission = req.submission
  var user = req.user.username
  var date = fmt().format('YYYY-MM-DD')
  var ext = submission.geojson ? '.geojson' : '.json'
  var filename = user + '/' + date + '/' + submission.instanceId + ext
  var json = JSON.stringify(submission.json, null, '  ')

  var options = {
    filesystem: {
      path: SUBMISSIONS + '/'
    },
    filename: filename
  }
  persistFs(json, options, function(err) {
    if (err)
      next(err)
    else
      res.status(201).send({
        saved: filename
      })
  });
}

module.exports = {
  show: getForm,
  index: getForms,
  create: createForm
}
