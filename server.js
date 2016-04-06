require('./helpers/autoconfig')

var express = require('express')
var fs = require('fs-extra')
var morgan = require('morgan')
var bodyParser = require('body-parser')
var passport = require('passport')
var Strategy = require('passport-http').DigestStrategy
var request = require('request')
var db = require('./db')
var url = require('url')

// var tile_cache = require('./helpers/tile-cache')
// tile_cache.pyramid_urls(-76.3605,-9.4491,-72.757,-6.1078, 1, 13)

var FormSubmissionMiddleware = require('openrosa-form-submission-middleware')
var ProcessSubmission = require('./middlewares/process-submission')
var SaveMedia = require('./middlewares/save-media')
var AppendGeoJSON = require('./middlewares/append-geojson')

var storage = require('./helpers/community-storage')
var forms = require('./controllers/forms')
var error = require('./controllers/error-handler')
var CommunityLands = require('./controllers/community-lands')
var MapFilter = require('./controllers/map-filter')

var TileLayers = require('./controllers/tile-layers')

var Backup = require('./controllers/backup')

// Configure the Digest strategy for use by Passport.
//
// The Digest strategy requires a `secret`function, which is used to look up
// user.  The function must invoke `cb` with the user object as well as the
// user's password as known by the server.  The password is used to compute a
// hash, and authentication will fail if the computed value does not match that
// of the request.  The user object will be set at `req.user` in route handlers
// after authentication.
passport.use(new Strategy({ qop: 'auth' },
  function (username, cb) {
    db.users.findByUsername(username, function (err, user) {
      if (err) { return cb(err) }
      if (!user) { return cb(null, false) }
      return cb(null, user, user.password)
    })
  }))

// Create a new Express application.
var app = express()
var path = require('path')

app.use(morgan('dev'))

app.use('/mapfilter', express.static(__dirname + '/mapfilter'))
app.get('/mapfilter/json/mapfilter-config.json', MapFilter.config)
app.get('/mapfilter/filters', MapFilter.listFilters)
app.post('/mapfilter/filters/local', bodyParser.json(), MapFilter.saveFilter)

app.get('/bing-metadata/:url', function (req, res) {
  var metadataUrl = decodeURIComponent(req.param('url'))
  request
    .get(metadataUrl)
    .on('error', function (fetch_err) {
      console.log("Could not fetch metadata. Sending fake Bing metadata.")
      var parsedMetadataUrl = url.parse(metadataUrl, true)
      var cbid = parsedMetadataUrl.query.jsonp
      var metadata = fs.readFileSync('offline-metadata.js', 'utf8')
      res.send(metadata.replace('_bing_metadata_mapfilter',cbid))
    })
    .pipe(res)
})

app.get('/bing-proxy/:url', function (req, res) {
  var tileUrl = decodeURIComponent(req.param('url'))
  var fileName = tileUrl.match(/\/([^\/]*.jpe?g)/)[1]
  var pathName = 'Monitoring' + '/Maps/Bing/' + fileName
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
    var r = request
      .get(tileUrl)
      .on('error', function (fetch_err) {
        console.log(fetch_err)
        res.status(500)
      })
    r.pipe(fs.createWriteStream(pathName))
    r.pipe(res)
  }
})

app.use('/monitoring-files', express.static(path.join(process.env.data_directory, 'Monitoring')))

app.get('/',
  function (req, res) {
    res.redirect('/mapfilter')
  })

var handleError = function (err, res) {
  res.status(500)
  res.render('error', {
    message: err.message,
    error: err
  })
}

app.get('/map', function (req, res, next) {
  storage.getMap('Monitoring.geojson', function (err, data) {
    if (err) {
      handleError(err, res)
    } else {
      res.json(JSON.parse(data))
    }
  })
})

app.get('/json/Monitoring.json', function (req, res, next) {
  storage.getMap('Monitoring.geojson', function (err, data) {
    if (err) {
      handleError(err, res)
    } else {
      res.json(JSON.parse(data).features)
    }
  })
})

app.get('/formList', forms.index)

app.get('/forms', forms.index)
app.get('/forms/:id', forms.show)

app.get('/backup/latest', CommunityLands.backup)
app.get('/backup/all', CommunityLands.resync)
app.get('/backup/status', CommunityLands.lastBackup)

app.get('/save/all', Backup.backup)
app.get('/save/status', Backup.lastBackup)

app.get('/tileLayers', TileLayers.listTileLayers)

app.post('/filters', bodyParser.json(), CommunityLands.saveFilter)

app.head('/submission',
  passport.authenticate('digest', { session: false }),
  FormSubmissionMiddleware())

app.post('/submission',
  passport.authenticate('digest', { session: false }),
  FormSubmissionMiddleware(),
  ProcessSubmission(),
  SaveMedia(),
  AppendGeoJSON(),
  forms.create)

app.use(error)

var port = process.env.port
app.listen(port)
console.log('Listening on port %s', port)
