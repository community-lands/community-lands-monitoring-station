var settings = require('../helpers/settings')
var ServerEvents = require('../helpers/server-events')

var archiver = require('archiver')
var moment = require('moment')
var fs = require('fs')
var http = require('http')

function ensureConfigured (req, res, next, cont) {
  var cl_server = settings.getCommunityLandsServer()
  var cl_token = settings.getCommunityLandsToken()

  if (cl_server && cl_token)
    cont(req, res, next)
  else
    res.json({error: 500, code: 'community_lands_not_configured', message: 'Please configure community lands server and/or token in settings.'})
}

function lastSubmission (req, res, next) {
  ensureConfigured(req, res, next, function () {
    getLastSubmissionDate(function (date) {
      res.json({date: date})
    })
  })
}

function saveFilter (req, res, next) {
  ensureConfigured(req, res, next, function () {
    var post = req.body
    var headers = {
      'Content-length': post.length,
      'Content-type': 'application/json'
    }
    var clReq = http.request(getCLRequestOpts('POST', '/maps'), clCallback(res), headers)
    clReq.write(JSON.stringify(post))
    clReq.end()
  })
}

function uploadSubmissions (req, res, next) {
  ensureConfigured(req, res, next, function () {
    getLastSubmissionDate(function (date) {
      uploadSubmissionsSince(req, res, next, date)
    })
  })
}

function uploadAllSubmissions (req, res, next) {
  uploadSubmissionsSince(req, res, next, null)
}

function uploadSubmissionsSince (req, res, next, since) {
  var dir = settings.getSubmissionsDirectory()

  var opts = { expand: true, src: ['**/*'], dest: '/Submissions', cwd: dir }
  if (since != null) {
    opts['filter'] = function (path) {
      var stats = fs.statSync(path)
      if (stats.isFile())
        return stats.mtime >= since
      else
        return true
    }
  }

  var interval;

  var clReq = http.request(getCLRequestOpts('POST', '/submissions'), clCallback(res))
  clReq.on('error', function (e) {
    res.json({error: true, code: 'community_lands_not_configured', message: 'Could not make connection to Community Lands'})
  })
  var archive = archiver.create('zip', {})
  archive.on('end', function() { 
    if (interval) {
      clearInterval(interval);
      interval = null;
      ServerEvents.emit('cl_upload_progress', true);
    }
  });

  interval = setInterval(function() {
    try {
      if (clReq.connection) {
        ServerEvents.emit('cl_upload_progress', false, clReq.connection._bytesDispatched);
      }
    } catch (e) {
      console.log("Not ready to report upload status: " + e);
    }
  }, 250);

  archive.pipe(clReq)
  archive.bulk(opts)
  archive.finalize()
}

function clCallback (res) {
  return function (clRes) {
    var clData = ''
    clRes.on('data', function (d) {
      clData += d
    })
    clRes.on('end', function () {
      var status = clRes.statusCode
      var result;
      try {
        result = JSON.parse(clData)
      } catch (err) {
        res.status(422).json({error: true, code: 'unknown', status: 422, message: err.message})
      }
      if (result) {
        if (status >= 200 && status <= 299)
          res.status(status).json(result)
        else if (status >= 400 && status <= 499)
          res.status(400).json({error: true, code: 'client_error', status: status, message: result.message });
        else if (status >= 500 && status <= 599)
          res.status(500).json({error: true, code: 'server_error', status: status, message: result.message });
        else
          res.status(status).json({error: true, code: 'unknown', status: status})
      } else
        res.status(status).json({error: true, code: 'unknown', status: status})
    })
    clRes.on('error', function(err) {
      res.status(500).json({error: true, code: 'comm_failure', status: 1001, ex: err, message: err.message});
    });
  }
}

function getLastSubmissionDate (callback) {
  http.request(getCLRequestOpts('GET', '/status'), function (statusRes) {
    var jsonStr = ''
    statusRes.on('data', function (d) {
      jsonStr += d
    })
    statusRes.on('end', function () {
      if (statusRes.statusCode == 200) {
        var json = JSON.parse(jsonStr)
        if (json.error == false && json.entity.found)
          callback(moment(json.entity.last_modified))
        else
          callback(null)
      }
    })
  }).on('error', function (e) {
    callback(null)
  }).end()
}

function getCLRequestOpts (method, path, headers) {
  var opts = {
    host: settings.getCommunityLandsServer(),
    path: '/api/v1/' + settings.getCommunityLandsToken() + path,
    method: method
  }
  if (headers) {
    for (var key in headers)
      opts[key] = headers[key]
  }
  if (settings.getCommunityLandsPort())
    opts['port'] = settings.getCommunityLandsPort()
  return opts
}

module.exports = {
  backup: uploadSubmissions,
  resync: uploadAllSubmissions,
  lastBackup: lastSubmission,
  saveFilter: saveFilter

}
