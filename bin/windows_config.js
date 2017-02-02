var config = require('./build_config')

module.exports = {
  dir: '.',
  arch: 'x64',
  platform: 'win32',
  icon: config.APP_ICON_PATH + '/community-lands.ico',
  ignore: config.IGNORE,
  out: 'dist',
  electronVersion: config.ELECTRON_VERSION,
  'app-version': config.APP_VERSION,
  prune: true,
  overwrite: true,
  asar: true,
  'version-string': {
    ProductName: config.APP_NAME,
    CompanyName: config.APP_TEAM
  }
}
