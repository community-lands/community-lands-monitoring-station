var path = require('path')

var pkg = require('../package.json')

var APP_VERSION = pkg.version
var APP_TEAM = 'Community Lands'
var APP_NAME = pkg.productName
var APP_DISPLAY_NAME = 'Community Lands Monitoring Station'

module.exports = {
  APP_COPYRIGHT: 'Copyright © 2017 ' + APP_TEAM,
  APP_ICON_PATH: path.dirname(__dirname),
  APP_DESCRIPTION: pkg.description,
  APP_NAME: APP_NAME,
  APP_FILE_NAME: APP_NAME,
  APP_DISPLAY_NAME: APP_DISPLAY_NAME,
  APP_TEAM: APP_TEAM,
  APP_VERSION: APP_VERSION,
  APP_WINDOW_TITLE: APP_DISPLAY_NAME,
  APP_BUNDLE_ID: 'org.communitylands.monitoring-station',

  ELECTRON_VERSION: pkg.devDependencies.electron,

  ROOT_PATH: path.dirname(__dirname),

  IGNORE:  [
    /^\/dist/,
    /^\/bin/,
    /^\/builds/,
    /^\/build-full.sh/,
    /^\/templates\/*/,
    /^\/website\/*/,
    /^\/\.DS_Store/,
    /^\/\.env/,
    /^\/community-lands\.ic*/
  ],

  servers: {
    http: {
      host: 'localhost',
      port: process.env.port
    }
  }
}
