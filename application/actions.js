/* eslint-env browser, jquery */

const locale = require('./application/lib/locale')

const electron = require('electron')
const ipc = electron.ipcRenderer
const shell = electron.shell

window.app = {
  loading: require('./application/lib/loading'),
  version: getAppVersion().version,
  t: locale.t,
  t_exists: locale.t_exists,
  electron: electron,
  ipc: ipc,
  enableCopyPaste: require('./application/shared-modules/menu').enableCopyPaste
}

function getAppVersion() {
  var version
  try {
    version = require('./application/data/version')
  } catch (e) {
    version = { version: 'Beta' }
  }
  return version
}

ipc.on('has_configuration', function (evt, configuration) {
  window.app.config = configuration

  document.getElementById('baseUrl').innerHTML = configuration.baseUrl
  document.getElementById('shared_secret').innerHTML =
    configuration.shared_secret
  document.getElementById('mapUrl').innerHTML = '<a id="mapUrlLink" href="' +
    configuration.localUrl + '/mapfilter?locale=' +
    configuration.locale + '">' + configuration.localUrl + '/mapfilter</a>'
  document.getElementById('webUrl').innerHTML = '<a id="webUrlLink" href="' +
    configuration.localUrl + '/website' +
    '">' + configuration.localUrl + '/website</a>'
  document.getElementById('form_folder').innerHTML = configuration.directory +
    '/Monitoring/' + configuration.station + '/Forms'
  document.getElementById('track_folder').innerHTML = configuration.tracks
  document.getElementById('tiles_folder').innerHTML = configuration.tiles
  if (configuration.community_lands === true) {
    document.getElementById('community_lands_content').className = ''
  }
  document.getElementById('mapUrlLink').onclick = function (evt) {
    evt.preventDefault()
    shell.openExternal(this.getAttribute('href'))
  }
  document.getElementById('webUrlLink').onclick = function (evt) {
    evt.preventDefault()
    shell.openExternal(this.getAttribute('href'))
  }

  $('#software-version').text(app.version)

  require('./application/shared-modules/settings')
  require('./application/shared-modules/map-filters')
  require('./application/client-modules/forms')
  require('./application/shared-modules/backup')
  require('./application/shared-modules/community-lands')
  require('./application/shared-modules/import')
  require('./application/client-modules/tiles')
  require('./application/client-modules/tracks')
})

ipc.send('show_configuration')
