/* eslint-env browser, jquery */

const locale = require('./application/locale')

const electron = require('electron')
const ipc = electron.ipcRenderer
const shell = electron.shell

window.app = {
  loading: require('./application/loading'),
  version: getAppVersion().version,
  t: locale.t,
  t_exists: locale.t_exists,
  electron: electron,
  ipc: ipc,
  enableCopyPaste: require('./application/client-modules/menu').enableCopyPaste
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
    configuration.baseUrl + '/mapfilter?locale=' +
    configuration.locale + '">' + configuration.baseUrl + '/mapfilter</a>'
  document.getElementById('webUrl').innerHTML = '<a id="webUrlLink" href="' +
    configuration.baseUrl + '/website' +
    '">' + configuration.baseUrl + '/website</a>'
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

  require('./application/client-modules/cms')
  require('./application/client-modules/settings')
  require('./application/client-modules/map-filters')
  require('./application/client-modules/forms')
  require('./application/client-modules/backup')
  require('./application/client-modules/community-lands')
  require('./application/client-modules/import')
  require('./application/client-modules/tiles')
  require('./application/client-modules/tracks')
})

ipc.send('show_configuration')

