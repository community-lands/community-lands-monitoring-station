(function(app) {
  const ipc = app.ipc
  const loading = app.loading
  const t = app.t
  const t_exists = app.t_exists

  ipc.on('has_settings_list', function (evt, entity) {
    //Initialize workspace form
    var wslist = ''
    for (var wki in entity.workspaces.workspaces) {
      var cur_ws = entity.workspaces.workspaces[wki];
      var selector, actions;
      actions = '<div class="btn-workspace-open-folder btn btn-sm btn-link" data-directory="' + cur_ws.directory + '"><i class="fa fa-eye"></i></div>';
      if (cur_ws.id == entity.workspaces.current.id) {
        selector = '<div class="btn btn-sm btn-link"><i class="fa fa-check-circle text-success"></i></div>';

      } else {
        selector = '<div class="btn-workspace-choose btn btn-sm btn-link" data-name="' + cur_ws.name + '" data-id="' + cur_ws.id + '">';
        selector += '<i class="fa fa-check-circle-o"></i>';
        selector += '</div>';

        actions += '<div class="btn-workspace-delete btn btn-sm btn-link" data-id="' + cur_ws.id + '"><i class="fa fa-times"></i></div>'
      }
      wslist += '<tr><td>' + selector + '</td><td>' + cur_ws.name + '</td>' + 
        '<td>' + cur_ws.directory + '</td>' + 
        '<td align="right" style="min-width:100px">' + actions + '</td></tr>';
    }
    document.getElementById("workspace-table-body").innerHTML = wslist;

    var wsopts = document.getElementsByClassName("btn-workspace-choose")
    for (var wki in wsopts) {
      wsopts[wki].onclick = function() {
        var el = this;
        if (confirm(t('confirm.change_workspace') + ": " + el.getAttribute('data-name'))) {
          loading.showLoadingScreen(t('progress.saving'))
          ipc.send('workspace_change', { id: el.getAttribute('data-id') });
        }
      }
    }
    wsopts = document.getElementsByClassName("btn-workspace-delete")
    for (var wki in wsopts) {
      wsopts[wki].onclick = function() {
        var el = this;
        if (confirm(t('confirm.delete_workspace'))) {
          loading.showLoadingScreen(t('progress.saving'))
          ipc.send('workspace_delete', { id: el.getAttribute('data-id') });
        }
      };
    }
    wsopts = document.getElementsByClassName("btn-workspace-open-folder")
    for (var wki in wsopts) {
      wsopts[wki].onclick = function() {
        var el = this;
        app.electron.shell.openItem(el.getAttribute('data-directory'));
      };
    }

    // Initialize settings form
    var settings = entity.settings;
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
          { name: t('language.es'), value: 'es' },
          { name: t('language.fr'), value: 'fr' }
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
        html += '<div class="col-xs-12">'
        html += '<input id="' + item_id + '" type="text" data-key="' + key +
          '" class="form-control" value="' + settings[key] + '" readonly />'
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
    html = '<form id="form-settings">'
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

    // Disabled, moved to workspace
    /*$("#dataDirectoryChooserBtn").click(function() {
      ipc.send('select_data_directory')
    })*/

    $("#workspaceDirectoryChooserBtn").click(function() {
      ipc.send('select_data_directory')
    });

    ipc.send('list_map_layers')
  })

  ipc.on('has_select_data_directory', function (evt, folder) {
    document.getElementById('workspace-form-directory').value = folder
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
      );
      loading.showRestart(t('message.settings_saved'));
    }
  })

  ipc.on('on_workspace_changed', function (evt, json) {
    loading.hideLoadingScreen();
    if (json.error)
      loading.showStatus(t('error.' + json.code), { type: 'error' })
    else {
      loading.showStatus(t('message.' + json.result_message), { type: 'warning', timeout: false });
      loading.showRestart(t('message.' + json.result_message));
    }
  });

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

  function getFormValues(formId) {
    var object = {};
    $("#" + formId + " .key-value").each(function() {
      var el = $(this);
      var key = $(this).data('key');
      var value = $(this).val();
      if (value !== 'null' && value !== '' && value !== null)
        object[key] = value;
    });
    return object;
  }

  $(document).ready(function() {
    $("#saveNewWorkspaceBtn").on('click', function() {
      loading.showLoadingScreen(t('progress.saving'));
      ipc.send('workspace_create', getFormValues("form-new-workspace"));

    });
    $("#saveSettingsBtn").on('click', function() {
      loading.showLoadingScreen(t('progress.saving'))
      ipc.send('settings_save', getFormValues("form-settings"));
    })
  })

})(window.app)

