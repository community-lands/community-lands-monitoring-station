// Detect IP, set up defaults for configuration variables if not set
var os = require('os');
var ifaces = os.networkInterfaces();

console.log("CONFIGURATION SETTINGS")
console.log("----------------------")

process.env.port = process.env.port || '3000'
console.log("Port number to use for the local web server")
console.log("  port: " + process.env.port)
process.env.directory = process.env.directory || '.'
console.log("Where your Monitoring folder lives")
console.log("  directory: " + process.env.directory)
process.env.station = process.env.station || 'DEMO'
console.log("Name of this monitoring station")
console.log("(and its station-specific folder under Monitoring)")
console.log("  station: " + process.env.station)
process.env.shared_secret = process.env.shared_secret || 'demo'
console.log("The secret password for ODK users who connect to this station")
console.log("(User ID should be a pseudonymous agent or device number you make up)")
console.log("  shared_secret: " + process.env.shared_secret)

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    process.env.baseUrl = process.env.baseUrl || ('http://'+iface.address+':'+process.env.port)
    console.log("Base URL to set in ODK Connect and similar tools")
    console.log("  baseUrl: "+process.env.baseUrl)
    console.log("Base URL for viewing maps -- put this in your browser")
    console.log("  "+process.env.baseUrl+"/mapfilter")
  });
});

console.log("")

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser')
var passport = require('passport');
var Strategy = require('passport-http').DigestStrategy;
var db = require('./db');

var FormSubmissionMiddleware = require('openrosa-form-submission-middleware')
var ProcessSubmission = require('./middlewares/process-submission')
var SaveMedia = require('./middlewares/save-media')
var AppendGeoJSON = require ('./middlewares/append-geojson')

var storage = require('./helpers/community-storage')
var forms = require('./controllers/forms')
var error = require('./controllers/error-handler')

// Configure the Digest strategy for use by Passport.
//
// The Digest strategy requires a `secret`function, which is used to look up
// user.  The function must invoke `cb` with the user object as well as the
// user's password as known by the server.  The password is used to compute a
// hash, and authentication will fail if the computed value does not match that
// of the request.  The user object will be set at `req.user` in route handlers
// after authentication.
passport.use(new Strategy({ qop: 'auth' },
  function(username, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      return cb(null, user, user.password);
    })
  }));

// Create a new Express application.
var app = express();
var fs = require('fs');

app.use(morgan('dev'));

app.use('/mapfilter',express.static('mapfilter'));
app.use('/monitoring-files',express.static('Monitoring'));

app.get('/',
  passport.authenticate('digest', { session: false }),
  function(req, res) {
    res.json({ username: req.user.username, email: req.user.emails[0].value });
  });

// curl -v --user jack:secret --digest "http://127.0.0.1:3000/hello?name=World&x=y"
app.get('/hello',
  function(req, res, next) {
    res.json({ message: 'Hello, ' + req.query.name, from: req.user.username });
  });

// curl -v -d "name=World" --user jack:secret --digest http://127.0.0.1:3000/hello
app.post('/hello',
  passport.authenticate('digest', { session: false }),
  bodyParser,
  function(req, res) {
    res.json({ message: 'Hello, ' + req.body.name, from: req.user.username });
  });

app.get('/map', function(req, res, next) {
  storage.getMap('Monitoring.geojson', function(err, data) {
    res.json(JSON.parse(data));
  });
});

app.get('/json/Monitoring.json', function(req, res, next) {
  storage.getMap('Monitoring.geojson', function(err, data) {
    res.json(JSON.parse(data).features);
  });
});


app.get('/files', function(req, res, next) {
  list.getFormUrls(function(err, files) {
    if (err)
      next(err)
    else {
      res.json(files);
    }
  });
});

app.get('/formList', forms.index)

app.get('/forms', forms.index)
app.get('/forms/:id', forms.show)

app.head('/submission',
  passport.authenticate('digest', { session: false }),
  FormSubmissionMiddleware())

app.post('/submission',
  passport.authenticate('digest', { session: false }),
  FormSubmissionMiddleware(),
  ProcessSubmission(),
  SaveMedia(),
  AppendGeoJSON(),
  forms.create);

app.use(error)

var port = process.env.port
app.listen(port);
console.log('Listening on port %s', port)
