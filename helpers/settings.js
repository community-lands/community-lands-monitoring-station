const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');

var ENV = path.join(path.dirname(__dirname), '.env')
var LOCATION = null;

function load() {
  dotenv.load();

  LOCATION = path.join(getDataDirectory(), 'Monitoring', '.settings');

  var settings_contents = null;
  try {
    settings_contents = fs.readFileSync(LOCATION, 'utf8');
  } catch (err) {
    console.log("Notice: No local settings saved at " + LOCATION);
  }

  if (settings_contents) {
    console.log("Notice: Loading local settings");
    var settings = dotenv.parse(settings_contents)
    Object.keys(settings).forEach(function(key) {
      process.env[key] = settings[key];
    });
  }

  console.log("");
}

function get(cb) {
  var parser = function(data) {
    var values = dotenv.parse(data);
    values['data_directory'] = values['data_directory'] || getDataDirectory();
    cb(null, values);
  };
  fs.readFile(LOCATION, 'utf8', function (err, data) {
    if (err) {
      fs.readFile(ENV, 'utf8', function(err, data) {
        if (err) {
          cb(err, null)
        } else 
          parser(data);
      });
    } else {
      parser(data);
    }
  });
}

function save(settings, cb) {
  if (LOCATION) {
    var properties = ''
    Object.keys(settings).forEach(function(key) {
      if (settings[key]) {
        properties += key + '=' + settings[key]
        properties += '\r\n'
      }
      //Live-update env on save? Don't think so quite yet...
      //process.env[key] = settings[key]
    });
    fs.writeFile(LOCATION, properties, 'utf8', function(err) {
      if (err)
        cb({error: true, code: 'saved_failed', message: 'Could not save settings', ex: err})
      else if (settings['data_directory']) {
        var key = 'data_directory';
        fs.writeFile(ENV, key + '=' + settings[key], 'utf8', function(err) {
          if (err)
            cb({error: true, code: 'saved_failed', message: 'Could not save application settings', ex: err});
          else
            cb();
        });
      } else
        cb();
    });
  } else
    cb({error: true, code: 'fatal', message: 'No location set for settings'});
}

function getDefaultSettings() {
  return {
    data_directory: path.dirname(ENV),
    station: 'DEMO',
    locale: 'en',
    community_lands_server: 'www.communitylands.org',
    community_lands_port: 80,
    community_lands_token: null,
    port: 3000,
    shared_secret: 'demo',
    mapLayer: null,
    mapZoom: null,
    mapCenterLat: null,
    mapCenterLong: null
  };
}

function getRootPath() {
  return path.join(getDataDirectory(), 'Monitoring');
}

function getBackupDirectory() {
  return path.join(getRootPath(), getStation(), 'Backup');
}

function getSubmissionsDirectory() {
  return path.join(getRootPath(), getStation(), 'Submissions');
}

function getDataDirectory() {
  return process.env.data_directory || process.env.directory;
}

function getBaseUrl() {
  return process.env.baseUrl;
}

function getStation() {
  return process.env.station;
}

function getCommunityLandsServer() {
  return process.env.community_lands_server;
}

function getCommunityLandsToken() {
  return process.env.community_lands_token;
}

function getCommunityLandsPort() {
  return process.env.community_lands_port;
}

function getFiltersDirectory() {
  return path.join(getRootPath(), getStation(), 'Filters')
}

function mapFilter() {
  return {
    mapZoom: process.env.mapZoom,
    mapCenterLat: process.env.mapCenterLat,
    mapCenterLong: process.env.mapCenterLong
  };
}

function getTilesDirectory() {
  return path.join(getRootPath(), 'Maps', 'Tiles');
}

function getGlobalMapsDirectory() {
  return path.join(getRootPath(), 'Maps');
}

function getGlobalFormsDirectory() {
  return path.join(getRootPath(), 'Forms');
}

function getTracksDirectory() {
  return path.join(getRootPath(), 'Tracks');
}

function getUserFormsDirectory() {
  return path.join(getRootPath(), getStation(), 'Forms');
}

function getWebsiteContentDirectory() {
  return path.join(getRootPath(), getStation(), 'content')
}

function getSharedSecret() {
  return process.env.shared_secret;
}

function getSharedUsername() {
  return process.env.shared_username;
}

function getPort() {
  return process.env.port;
}

function getLocale() {
  return process.env.locale;
}

function isDevMode() {
  return process.env.dev_mode == 'true'
}

module.exports = {

  load: load,
  get: get,
  save: save,
  defaults: getDefaultSettings(),
  getDataDirectory: getDataDirectory,
  getBackupDirectory: getBackupDirectory,
  getSubmissionsDirectory: getSubmissionsDirectory,
  getBaseUrl: getBaseUrl,
  getStation: getStation,
  getCommunityLandsServer: getCommunityLandsServer,
  getCommunityLandsToken: getCommunityLandsToken,
  getCommunityLandsPort: getCommunityLandsPort,
  getFiltersDirectory: getFiltersDirectory,
  getMapFilterSettings: mapFilter,
  getTilesDirectory: getTilesDirectory,
  getGlobalMapsDirectory: getGlobalMapsDirectory,
  getGlobalFormsDirectory: getGlobalFormsDirectory,
  getTracksDirectory: getTracksDirectory,
  getUserFormsDirectory: getUserFormsDirectory,
  getWebsiteContentDirectory: getWebsiteContentDirectory,
  getSharedSecret: getSharedSecret,
  getSharedUsername: getSharedUsername,
  getRootPath: getRootPath,
  getPort: getPort,
  getLocale: getLocale,
  isDevMode: isDevMode

}
