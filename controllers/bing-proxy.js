var settings = require('../helpers/settings')

var fs = require('fs-extra')
var path = require('path')
var request = require('request')
var url = require('url')

var BING_ROOT = path.join(settings.getGlobalMapsDirectory(), 'Bing')

function prepare(req, res, next) {
  fs.access(BING_ROOT, fs.F_OK | fs.R_OK | fs.W_OK, function(err) {
    if (err && err.code == 'ENOENT') {
      fs.mkdir(BING_ROOT, function(err2) {
        next(err);
      });
    } else
      next(err);
  });
}

function handleProxy(req, res) {
  var tileUrl = decodeURIComponent(req.param('url'))
  var fileName = tileUrl.match(/\/([^\/]*.jpe?g)/)[1]
  var pathName = path.join(BING_ROOT, fileName)
  try {
    var stats = fs.statSync(pathName)
    if (stats.size < 100) {
      fs.unlinkSync(pathName)
      throw new Error('Found truncated file')
    }
    var stream = fs.createReadStream(pathName)
    console.log('cached: ' + pathName)
    stream.pipe(res)
  } catch (err) {
    console.log('downloading: ' + fileName)
    try{
      var r = request
        .get({
          timeout: 10000,
          uri: tileUrl
        })
        .on('error', function (fetch_err) {
          console.log(fetch_err)
          res.status(500)
        })
      try {
        cachefile = fs.createWriteStream(pathName)
        r.pipe(cachefile)
      } catch (err) {
        console.log('error saving tile, streaming it anyway')
        console.log(err)
      }
      r.pipe(res)
    } catch (err) {
      console.log('error saving or streaming tile')
      console.log(err)
    }
  }
}

function handleMetadata(req, res) {
  var metadataUrl = decodeURIComponent(req.param('url'))
  request
    .get(metadataUrl)
    .on('error', function (fetch_err) {
      console.log("Could not fetch metadata. Sending fake Bing metadata.")
      var parsedMetadataUrl = url.parse(metadataUrl, true)
      var cbid = parsedMetadataUrl.query.jsonp
      var metadata = fs.readFileSync(path.join(path.dirname(__dirname), 'application', 'offline-metadata.js'), 'utf8')
      res.send(metadata.replace('_bing_metadata_mapfilter',cbid))
    })
    .pipe(res)
}

module.exports = {
  prepare: prepare,
  proxy: handleProxy,
  metadata: handleMetadata
}
