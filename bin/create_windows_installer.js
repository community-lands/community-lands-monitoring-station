var path = require('path')
var electronInstaller = require('electron-winstaller')
var config = require('./build_config')
var rimraf = require('rimraf')

var distFolder = path.join(__dirname, '..', 'dist')
var cleanName = config.APP_NAME.replace(/\s/g, '_')
var buildName = cleanName + '_v' + config.APP_VERSION
var arch = 'x64'
var installerFolder = path.join(distFolder, 'installer-win-' + arch)

function createConfiguration () {
  var buildFolder = path.join(distFolder, config.APP_FILE_NAME+'-win32-' + arch)

  return {
    appDirectory: buildFolder,
    outputDirectory: installerFolder,

    usePackageJson: false,

    description: config.APP_DESCRIPTION,
    authors: config.APP_TEAM,
    name: cleanName,
    exe: config.APP_FILE_NAME + '.exe',
    setupExe: buildName + '_Windows.exe',
    setupIcon: path.join(config.APP_ICON_PATH, 'community-lands.ico'),
    iconUrl: 'http://www.communitylands.org/system/icons/community-lands.ico',
    version: config.APP_VERSION,
    title: config.APP_NAME
  }
}

function createInstaller () {
  var cfg = createConfiguration()
  electronInstaller.createWindowsInstaller(cfg)
    .then(function () {
      console.log("Installer created successfully:")
      console.log(path.join(cfg.outputDirectory, cfg.setupExe))
    }).catch(function (e) {
      console.error(e.message)
      console.log(e);
    })
}

console.log('gonna clear', installerFolder)
rimraf(installerFolder, function (err) {
  if (err) throw err
  createInstaller()
})
