var config = require('./build_config')

module.exports = {
  dir: '.',
  arch: 'x64',
  platform: 'darwin',
  icon: config.APP_ICON_PATH + '/community-lands.icns',
  ignore: config.IGNORE,
  out: 'dist',
  tmpdir: false,
  electronVersion: config.ELECTRON_VERSION,
  'app-version': config.APP_VERSION,
  'build-version': '1.0.0',
  prune: true,
  overwrite: true,
  'app-bundle-id': config.APP_BUNDLE_ID
}
