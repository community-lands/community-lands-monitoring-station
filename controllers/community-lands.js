require('dotenv').load()

var archiver = require('archiver');
var moment = require('moment');
var fs = require('fs');
var http = require('http');

function ensureConfigured(req, res, next, cont) {
  var cl_server = process.env.community_lands_server // || default_server
  var cl_token = process.env.community_lands_token

  if (cl_server == null || cl_token == null)
    res.json({error: 500, message: 'Please configure community lands server and/or token in settings.'});
  else
    cont(req, res, next);
}

function lastSubmission(req, res, next) {
  ensureConfigured(req, res, next, function() {
    getLastSubmissionDate(function(date) {
      res.json({date: date});
    });
  });
}

function saveFilter(req, res, next) {
  ensureConfigured(req, res, next, function() {
    var post = req.body;
    var headers = {
      'Content-length': post.length,
      'Content-type': 'application/json'
    }
    var clReq = http.request(getCLRequestOpts('POST', '/maps'), clCallback(res), headers);
    clReq.write(JSON.stringify(post));
    clReq.end();
  });
}

function uploadSubmissions(req, res, next) {
  ensureConfigured(req, res, next, function() {
    getLastSubmissionDate(function(date) {
      uploadSubmissionsSince(req, res, next, date);
    });
  });
}

function uploadAllSubmissions(req, res, next) {
  uploadSubmissionsSince(req, res, next, null);
}

function uploadSubmissionsSince(req, res, next, since) {
  var dir = process.env.data_directory + "/Monitoring/" + process.env.station + "/Submissions";

  var opts = { expand: true, src: ['**/*'], dest: '/Submissions', cwd: dir }
  if (since != null) {
    opts['filter'] = function(path) {
      var stats = fs.statSync(path);
      if (stats.isFile())
        return stats.mtime >= since
      else
        return true;
    }
  }

  var clReq = http.request(getCLRequestOpts('POST', '/submissions'), clCallback(res));
  clReq.on('error', function(e) {
    res.json({error: true, code: 1001, message: "Could not make connection to Community Lands"});
  });
  var archive = archiver.create('zip', {});

  archive.pipe(clReq);
  archive.bulk(opts);
  archive.finalize();
}

function clCallback(res) {
  return function(clRes) {
    var clData = '';
    clRes.on('data', function(d) {
      clData += d;
    });
    clRes.on('end', function() {
      if (res.statusCode >= 200 && res.statusCode <= 299)
        res.json(JSON.parse(clData));
      else
        res.json({error: true, code: res.statusCode});
    });
  };
}

function getLastSubmissionDate(callback) {
  http.request(getCLRequestOpts('GET', '/status'), function(statusRes) {
    var jsonStr = '';
    statusRes.on('data', function(d) {
      jsonStr += d;
    });
    statusRes.on('end', function() {
      if (statusRes.statusCode == 200) {
        var json = JSON.parse(jsonStr);
        if (json.error == false && json.entity.found)
          callback(moment(json.entity.last_modified));
        else
          callback(null);
      }
    });
  }).on('error', function(e) {
    callback(null);
  }).end();
}

function getCLRequestOpts(method, path, headers) {
  var opts = {
    host: process.env.community_lands_server,
    path: '/api/v1/' + process.env.community_lands_token + path,
    method: method
  }
  if (headers != undefined) {
    for (var key in headers)
      opts[key] = headers[key]
  }
  if (process.env.community_lands_port != undefined)
    opts['port'] = process.env.community_lands_port
  return opts;
}

module.exports = {

  backup: uploadSubmissions,
  resync: uploadAllSubmissions,
  lastBackup: lastSubmission,
  saveFilter: saveFilter

}
