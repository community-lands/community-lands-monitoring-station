require('dotenv').load()

var archiver = require('archiver');
var moment = require('moment');
var fs = require('fs');
var http = require('http');

function lastSubmission(req, res, next) {
  var cl_server = process.env.community_lands_server // || default_server
  var cl_token = process.env.community_lands_token

  if (cl_server == null || cl_token == null)
    res.json({error: 500, message: 'Please configure community lands server and/or token in settings.'});
  else {
    getLastSubmissionDate(function(date) {
      res.json({date: date});
    });
  }
}

function uploadSubmissions(req, res, next) {
  var cl_server = process.env.community_lands_server // || default_server
  var cl_token = process.env.community_lands_token

  if (cl_server == null || cl_token == null)
    res.json({error: 500, message: 'Please configure community lands server and/or token in settings.'});
  else {
    getLastSubmissionDate(function(date) {
      uploadSubmissionsSince(req, res, next, date);
    });
  }
}

function uploadAllSubmissions(req, res, next) {
  uploadSubmissionsSince(req, res, next, null);
}

function uploadSubmissionsSince(req, res, next, since) {
  var dir = process.env.directory + "/Monitoring/" + process.env.station + "/Submissions";

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

  var clCallback = function(clRes) {
    var clData = '';
    clRes.on('data', function(d) {
      clData += d;
    });
    clRes.on('end', function() {
      if (res.statusCode >= 200 && res.statusCode <= 299)
        res.json(JSON.parse(clData));
      else
        res.json(JSON.parse({error: true, code: res.statusCode}))
    });
  };
  var clReq = http.request(getCLRequestOpts('POST', '/submissions'), clCallback);

  var archive = archiver.create('zip', {});

  archive.pipe(clReq);
  archive.bulk(opts);
  archive.finalize();
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
  }).end();
}

function getCLRequestOpts(method, path) {
  var opts = {
    host: process.env.community_lands_server,
    path: '/api/v1/' + process.env.community_lands_token + path,
    method: method
  }
  if (process.env.community_lands_port != undefined)
    opts['port'] = process.env.community_lands_port
  return opts;
}

module.exports = {

  backup: uploadSubmissions,
  resync: uploadAllSubmissions,
  lastBackup: lastSubmission

}
