/* eslint-env browser, jquery */

const locale = require('./application/locale')
const t = locale.t
const t_exists = locale.t_exists

const loading = require('./application/loading')

try {
  window.appVersion = require('./application/data/version')
} catch (e) {
  window.appVersion = { version: 'Beta' }
}

const electron = require('electron')
const ipc = electron.ipcRenderer
const shell = electron.shell
const remote = electron.remote
const {Menu, MenuItem} = remote

require('./application/cms')

const menu = new Menu()
menu.append(new MenuItem({
  label: t('menu.cut'),
  role: 'cut',
  accelerator: 'CmdOrCtrl+X'
}))
menu.append(new MenuItem({
  label: t('menu.copy'),
  role: 'copy',
  accelerator: 'CmdOrCtrl+C'
}))
menu.append(new MenuItem({
  label: t('menu.paste'),
  role: 'paste',
  accelerator: 'CmdOrCtrl+V'
}))
menu.append(new MenuItem({
  label: t('menu.select'),
  role: 'selectall',
  accelerator: 'CmdOrCtrl+A'
}))
var config = null
var updateOnlineStatus = function () {
  ipc.send('community_lands_online', navigator.onLine)
}
ipc.on('backup_submissions_complete', function (evt, json) {
  loading.hideLoadingScreen()
  if (json.error) {
    alert(t('error.' + json.code))
  } else if (!json.cancelled) {
    loading.showStatus(t('text.backup_complete') +
      '<br/>' + t('prompt.open') +
      '<a id="backup_file" href="javascript:openBackupFile();" ' +
      'data-location="' + json.location + '">' + json.location +
      '</a>', { timeout: false })
    ipc.send('check_last_backup')
  }
})
ipc.on('has_last_backup', function (evt, result) {
  var json = JSON.parse(result)
  if (json.date) {
    document.getElementById('last_backup').innerHTML = '<p>' +
      t('prompt.last_backup') + '<a href="javascript:openBackupFolder();">' +
      new Date(json.date) + '</a></p>'
  }
})
ipc.on('has_select_form', function (evt, result) {
  ipc.send('form_list')
})
ipc.on('has_form_delete', function (evt, result) {
  ipc.send('form_list')
})
ipc.on('has_form_list', function (evt, result) {
  var forms = result.forms
  if (forms.length > 0) {
    var content = '<h5>' + t('title.my_monitoring_forms') +
      '</h5><table class="table table-condensed">'
    for (var index in forms) {
      content += '<tr>' +
        '<td><span>' + forms[index].name +
        '</span> <span style="color:#999">(' + forms[index].file +
        ')</span></td><td align="right"><div data-form="' +
        forms[index].file +
        '" class="delete-form btn btn-small">' +
        '<i class="fa fa-remove"/></div></td></tr>'
    }
    content += '</table>'
    document.getElementById('form_listing').innerHTML = content
    var els = document.getElementsByClassName('delete-form')
    for (index in els) {
      els[index].onclick = function () {
        var form = this.getAttribute('data-form')
        if (confirm(t('confirm.delete_form'))) {
          ipc.send('form_delete', form)
        }
      }
    }
  } else {
    document.getElementById('form_listing').innerHTML = ''
  }
})
ipc.on('has_tiles_list', function (evt, result) {
  document.getElementById('tiles_listing').innerHTML = ''
  if (!result.error) {
    var content = ''
    var tiles = result.tiles
    var i
    if (tiles.length > 0) {
      content = '<h5>' + t('title.saved_tiles') + '</h5>'
      content += '<table class="table table-condensed">'
      for (i in tiles) {
        content += '<tr>'
        content += '<td>' + tiles[i] + '</td>'
        content += '</tr>'
      }
      content += '</table>'
    }
    if (result.warnings && result.warnings.length > 0) {
      content += '<div style="margin-top: 10px">'
      for (i in result.warnings) {
        var warning = result.warnings[i]
        content += '<div class="text-warning"><i class="fa fa-warning">' +
          '</i> <span>' + t(warning) + '</span></div>'
      }
      content += '</div>'
    }
    document.getElementById('tiles_listing').innerHTML = content
  }
})
ipc.on('has_filter_list', function (evt, result) {
  document.getElementById('saved-filters').innerHTML = ''
  var json = JSON.parse(result)
  if (!json.error) {
    var filters = json.filters
    if (filters.length > 0) {
      var content = '<h5>' + t('title.saved_filters') + '</h5>'
      content += '<table class="table table-condensed">'
      for (var index in filters) {
        content += '<tr>'
        content += '<td><a class="map-link" href="' + config.baseUrl +
          '/mapfilter?locale=' + config.locale + '&filter=' +
          filters[index].id + '">' +
          filters[index].name + '</a></td>'
        content += '<td align="right"><div data-filter="' + filters[index].id +
          '" class="delete-filter btn btn-small">' +
          '<i class="fa fa-remove"/></div></td>'
        content += '</tr>'
      }
      content += '</table>'
      document.getElementById('saved-filters').innerHTML = content
      var i
      var els = document.getElementsByClassName('map-link')
      for (i in els) {
        els[i].onclick = function (event) {
          event.preventDefault()
          shell.openExternal(this.getAttribute('href'))
        }
      }
      var dels = document.getElementsByClassName('delete-filter')
      for (i in dels) {
        dels[i].onclick = function () {
          var filter = this.getAttribute('data-filter')
          if (confirm(t('confirm.delete_filter'))) {
            ipc.send('filter_delete', filter)
          }
        }
      }
    }
  }
})
ipc.on('filter_list_changed', function (evt, result) {
  ipc.send('filter_list')
})
ipc.on('has_community_lands_online', function (evt, status) {
  if (status === true || status === 'true') {
    ipc.send('community_lands_status')
  } else {
    document.getElementById('connection_status').innerHTML = t('text.offline')
    document.getElementById('community_lands_sync_date').innerHTML =
      t('text.unavailable')
  }
})
ipc.on('has_community_lands_status', function (evt, result) {
  document.getElementById('connection_status').innerHTML = t('text.online')
  if (result !== null && result !== '') {
    var json = JSON.parse(result)
    if (json.date) {
      document.getElementById('community_lands_sync_date').innerHTML =
        new Date(json.date)
    } else {
      document.getElementById('community_lands_sync_date').innerHTML =
        t('text.unavailable')
    }
  } else {
    document.getElementById('community_lands_sync_date').innerHTML =
      t('text.unavailable')
  }
})
ipc.on('has_community_lands_backup', function (evt, result) {
  loading.hideLoadingScreen()
  var json = JSON.parse(result)
  var html = ''
  if (json.error) {
    html += t('text.upload_failed')
    if (json.code) {
      html += ' ' + t('error.' + json.code)
    } else if (json.message) {
      html += ' ' + json.message
    }
  } else {
    html += t('text.upload_success')
    html += ' '
    html += t('text.files_uploaded')
    html += ' '
    html += json.entity.files_uploaded
  }
  loading.showStatus(html, {
    type: json.error ? 'error' : 'success', timeout: 10000
  })
  ipc.send('community_lands_status')
})
ipc.on('has_settings_list', function (evt, settings) {
  var sections = {
    general: '',
    mapfilter: '',
    communitylands: '',
    advanced: ''
  }
  var section_keys = {
    mapLayer: 'mapfilter',
    mapZoom: 'mapfilter',
    mapCenterLat: 'mapfilter',
    mapCenterLong: 'mapfilter',
    community_lands_token: 'communitylands',
    community_lands_server: 'advanced',
    community_lands_port: 'advanced',
    port: 'advanced'
  }
  var html, key
  for (key in settings) {
    html = sections[section_keys[key] || 'general']
    var item_id = 'settings-form-' + key
    html += '<div class="form-group">'
    html += '<label for="' + item_id + '">' + t('prompt.settings.' + key) +
      '</label>'
    var options
    if (key === 'locale') {
      options = [
        { name: t('language.en'), value: 'en' },
        { name: t('language.es'), value: 'es' }
      ]
      html += '<select id="' + item_id +
        '" class="form-control key-value" data-key="' + key + '">'
      for (var k = 0; k < options.length; k++) {
        var opt = options[k]
        html += '<option value="' + opt.value + '"'
        if (opt.value === settings[key]) {
          html += ' selected'
        }
        html += '>' + opt.name + '</option>'
      }
      html += '</select>'
    } else if (key === 'mapLayer') {
      options = [ { name: 'Bing', value: 'null' } ]
      html += '<select id="' + item_id +
        '" class="form-control key-value" data-key="' + key +
        '" data-value="' + settings[key] + '">'
      html += '<option value="null" selected>Bing</option>'
      html += '</select>'
    } else if (key === 'data_directory') {
      html += '<div class="row">'
      html += '<div class="col-xs-4">'
      html += '<button onclick="javascript:chooseDataDirectory();" ' +
        'class="form-control btn btn-small btn-default">' +
        t('button.choose') + '</button>'
      html += '</div><div class="col-xs-8">'
      html += '<input id="' + item_id + '" type="text" data-key="' + key +
        '" class="form-control key-value" value="' + settings[key] + '" />'
      html += '</div></div>'
    } else if (key === 'mapZoom') {
      html += '<input id="' + item_id + '" type="number" data-key="' + key +
        '" class="form-control key-value" '
      if (settings[key]) {
        html += 'value="' + settings[key] + '"'
      }
      html += ' min="1" max="18" />'
    } else {
      html += '<input id="' + item_id + '" type="text" data-key="' + key +
        '" class="form-control key-value" '
      if (settings[key]) {
        html += 'value="' + settings[key] + '"'
      }
      html += ' />'
    }
    if (t_exists('help.settings.' + key)) {
      html += '<span class="help-block">' + t('help.settings.' + key) +
        '</span>'
    }
    html += '</div>'
    sections[section_keys[key] || 'general'] = html
  }
  html = '<form>'
  for (key in sections) {
    if (sections[key] !== '') {
      html += '<h4>'
      html += t('subtitle.settings.' + key)
      html += '</h4>'
      html += '<div class="well">' + sections[key] + '</div>'
    }
  }
  html += '</form>'
  document.getElementById('settings_form').innerHTML = html
  enableCopyPaste('#settings_form input[type="text"]')
  ipc.send('list_map_layers')
})
ipc.on('has_list_map_layers', function (evt, layers) {
  var el = document.getElementById('settings-form-mapLayer')
  var defaultLayer = el.getAttribute('data-value')
  if (layers.length > 0) {
    layers.unshift({
      name: 'Bing', value: 'null'
    })
    var html = ''
    for (var i = 0; i < layers.length; i++) {
      var opt = layers[i]
      html += '<option value="' + opt.value + '"'
      if (opt.value === defaultLayer) {
        html += ' selected'
      }
      html += '>' + opt.name + '</option>'
    }
    el.innerHTML = html
  }
})
ipc.on('has_configuration', function (evt, configuration) {
  config = configuration
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
})
ipc.on('has_select_data_directory', function (evt, folder) {
  document.getElementById('settings-form-data_directory').value = folder
})
ipc.on('has_settings_save', function (evt, result) {
  loading.hideLoadingScreen()
  var json = JSON.parse(result)
  if (json.error) {
    loading.showStatus(t('error.' + json.code), { type: 'error' })
  } else {
    loading.showStatus(
      t('message.settings_saved'),
      { timeout: false, type: 'warning' }
    )
  }
})
ipc.on('has_import_files', function (evt, result) {
  loading.hideLoadingScreen()
  if (result.error) {
    loading.showStatus(t('error.' + result.code), { type: 'error' })
  } else {
    loading.showStatus(t('text.import_success'), { timeout: 5000 })
  }
})
ipc.on('cl_upload_progress', function (evt, result) {
  if (result.status === 'uploading') {
    loading.updateLoadingScreen(t('progress.importing') + ' <br/> &gt; ' +
      result.progress + '...')
  } else {
    loading.updateLoadingScreen(t('progress.importing') + ' <br/> &gt; ' +
      t('progress.' + result.status) +
      ' <i class="fa fa-spinner fa-pulse fa-fw"></i>')
  }
})

ipc.send('show_configuration')
ipc.send('check_last_backup')
ipc.send('form_list')
ipc.send('filter_list')
ipc.send('settings_list')
ipc.send('tiles_list')

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

updateOnlineStatus()

/* FIXME: convert this to a module and export this functionality. The
   window.foo = foo declarations here are redundant, but make the linter
   happy so it's easier to see brokenness.
 */

function communityLandsUpload () {
  if (navigator.onLine) {
    loading.showLoadingScreen(t('progress.uploading'))
    ipc.send('community_lands_backup')
  } else {
    alert(t('alert.no_internet'))
  }
}
window.communityLandsUpload = communityLandsUpload

function backupFiles (cb) {
  loading.showLoadingScreen(t('progress.saving'))
  ipc.send('backup_submissions', cb)
}
window.backupFiles = backupFiles

function importFilesOverwrite () {
  loading.showLoadingScreen(t('progress.importing'))
  ipc.send('import_files', { mode: 'overwrite' })
}
window.importFilesOverwrite = importFilesOverwrite

function importFilesMerge () {
  loading.showLoadingScreen(t('progress.importing'))
  ipc.send('import_files', { mode: 'merge' })
}
window.importFilesMerge = importFilesMerge

function openBackupFile () {
  var file = document.getElementById('backup_file')
    .getAttribute('data-location')
  shell.showItemInFolder(file)
}
window.openBackupFile = openBackupFile

function openBackupFolder () {
  if (config) {
    shell.showItemInFolder(config.directory + '/Monitoring/' + config.station +
      '/Backup')
  }
}
window.openBackupFolder = openBackupFolder

function selectForm () {
  ipc.send('select_form')
}
window.selectForm = selectForm

function translatePage () {
  var tags = ['h4', 'h5', 'div', 'span', 'b', 'button']
  for (var i = 0; i < tags.length; i++) {
    var els = document.getElementsByTagName(tags[i])
    for (var k = 0; k < els.length; k++) {
      if (els[k].getAttribute('data-translate')) {
        els[k].innerHTML = window.t(els[k].getAttribute('data-translate'))
      }
    }
  }
}
window.selectForm = translatePage

function chooseDataDirectory () {
  ipc.send('select_data_directory')
}
window.chooseDataDirectory = chooseDataDirectory

function saveSettings () {
  loading.showLoadingScreen(t('progress.saving'))
  var els = document.getElementsByClassName('key-value')
  var object = {}
  for (var i = 0; i < els.length; i++) {
    var el = els[i]
    var key = el.getAttribute('data-key')
    if (el.value !== 'null' && el.value !== '') {
      object[key] = el.value
    }
  }
  ipc.send('settings_save', object)
}
window.saveSettings = saveSettings

function enableCopyPaste (selection) {
  $(selection).each(function (index, el) {
    el.addEventListener('contextmenu', function (e) {
      e.preventDefault()
      menu.popup(remote.getCurrentWindow())
      return false
    }, false)
  })
}
window.enableCopyPaste = enableCopyPaste
