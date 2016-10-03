(function(app) {
  const ipc = app.ipc
  const loading = app.loading
  const t = app.t
  const t_exists = app.t_exists

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
        html += '<button id="dataDirectoryChooserBtn" ' +
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

    app.enableCopyPaste('#settings_form input[type="text"]')

    $("#dataDirectoryChooserBtn").click(function() {
      ipc.send('select_data_directory')
    })

    ipc.send('list_map_layers')
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

  ipc.send('settings_list')

  $(document).ready(function() {
    $("#saveSettingsBtn").on('click', function() {
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
    })
  })

})(window.app)

