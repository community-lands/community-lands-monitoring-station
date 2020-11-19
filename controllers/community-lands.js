var settings = require('../helpers/settings')
var ServerEvents = require('../helpers/server-events')
var Chunker = require('../helpers/chunked-uploader')

var archiver = require('archiver')
var unzip = require('unzip2')
var moment = require('moment')
var fs = require('fs-extra')
var http = require('http')
var path = require('path')
var tmp = require('tmp')

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
      res.json({date: date.submissions})
    })
  })
}

function lastWebsite (req, res, next) {
  ensureConfigured(req, res, next, function () {
    getLastSubmissionDate(function (date) {
      res.json({date: date.website})
    })
  })
}

function uploadStatus (req, res, next) {
  ensureConfigured(req, res, next, function () {
    getLastSubmissionDate(function (date) {
      res.json(date)
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
      uploadSubmissionsSince(req, res, next, date.submissions)
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

  tmp.file(function(err, path, fd, cleanupCallback) {
    var archive = archiver.create('zip', {})
    archive.on('end', function() {
      var size = archive.pointer()
      var mode = settings.getCommunityLandsUploadMode() || 'simple'
      if (mode.indexOf('chunked') === 0 && size > Chunker.getChunkSize(mode)) {
        uploadChunked(path, mode, res)
      } else {
        uploadUnchunked(path, res)
      }
    });

    archive.pipe(fs.createWriteStream(path))
    archive.bulk([ opts ])
    archive.finalize()
  })
}

function uploadChunked(file, mode, res) {
  var progressListener = function (data) {
    ServerEvents.emit('cl_upload_progress', false, data);
  }
  var options = {
    file: file,
    mode: mode,
    progress: progressListener,
    getRequestOptions: function(method, path) {
      return getCLRequestOpts(method, path)
    }
  }

  Chunker.run(options, function (err, result) {
    if (err) {
      res.json({ error: true, code: err.error })
    } else {
      validateCLResponse(result.response, result.body, res)
    }
  })
}

function uploadUnchunked(file, res) {
  var interval;

  var clReq = http.request(getCLRequestOpts('POST', '/upload'), clCallback(res))
  clReq.on('error', function (e) {
    res.json({error: true, code: 'community_lands_not_configured', message: 'Could not make connection to Community Lands'})
  })
  clReq.on('response', function () {
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

  var stream = fs.createReadStream(file)
  stream.pipe(clReq)
}

function clCallback (res) {
  return function (clRes) {
    var error = false
    var clData = ''
    clRes.on('data', function (d) {
      clData += d
    })
    clRes.on('end', function () {
      if (error)
        return;
      validateCLResponse(clRes, clData, res)
    })
    clRes.on('error', function(err) {
      error = true
      res.status(500).json({error: true, code: 'comm_failure', status: 1001, ex: err, message: err.message});
    });
  }
}

function getLastSubmissionDate (callback) {
  http.request(getCLRequestOpts('GET', '/status'), function (statusRes) {
    var jsonStr = ''
    statusRes.on('data', function (d) {
      jsonStr += d
    }).on('end', function () {
      var status = { submissions: null, website: null }
      if (statusRes.statusCode == 200) {
        var json = JSON.parse(jsonStr)

        if (json.error == false) {
          if (json.entity.submissions) {
            if (json.entity.submissions && json.entity.submissions.found)
              status.submissions = moment(json.entity.submissions.last_modified)
            else if (json.entity.last_modified)
              status.submissions = moment(json.entity.last_modified)

            callback(status)
          } else
            callback(status)
        }
      } else
        callback(status)
    })
  }).on('error', function (e) {
    callback({ submissions: null, website: null })
  }).end()
}

function getCLRequestOpts (method, path, headers) {
  var opts = {
    host: settings.getCommunityLandsServer(),
    path: '/api/v2/' + settings.getCommunityLandsToken() + path,
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

function validateCLResponse(clRes, clData, res) {
  var status = clRes.statusCode
  var result;
  var parseError = false
  try {
    result = JSON.parse(clData)
  } catch (err) {
    parseError = err.message
  }
  if (parseError) {
    res.status(422).json({error: true, code: 'unknown', status: 422, message: parseError})
  } else if (result) {
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
}

module.exports = {
  saveFilter: saveFilter,
  Submissions: {
    backup: uploadSubmissions,
    resync: uploadAllSubmissions,
    lastBackup: lastSubmission
  },
  Content: {
    lastBackup: uploadStatus
  }
}
