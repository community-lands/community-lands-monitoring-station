const path = require('path'),
  dialog = require('electron').dialog;

const workspaces = require('../helpers/workspaces')

function bind(app) {
  const ipc = app.ipc;
  const settings = app.settings;

  ipc.on('show_configuration', function (event, arg) {
    try {
      var _defaults = settings.getDefaults()
      var _results = {
        'directory': settings.getDataDirectory() || _defaults.data_directory,
        'station': settings.getStation() || _defaults.station,
        'baseUrl': settings.getBaseUrl(),
        'shared_secret': settings.getSharedSecret(),
        'locale': settings.getLocale() || _defaults.locale,
        'community_lands': !(settings.getCommunityLandsServer() === undefined || settings.getCommunityLandsToken() === undefined),
        'tiles': settings.getDefaultTilesDirectory(),
        'tracks': settings.getTracksDirectory()
      }
      console.log(_results)
      event.sender.send('has_configuration', _results)
    } catch (err) {
      event.sender.send('has_configuration', [])
    }
  })

  ipc.on('select_data_directory', function (event, arg) {
    var options = {
      properties: ['openDirectory'],
      defaultPath: settings.getDataDirectory()
    }
    dialog.showOpenDialog(app.getMainWindow(), options, function (folder) {
      if (folder) {
        event.sender.send('has_select_data_directory', folder)
      }
    })
  })

  ipc.on('settings_list', function (event, arg) {
    settings.get(function(err, selected) {
      var defaults = settings.getDefaults();
      var workspaces = settings.getWorkspaces();
      if (!err && selected) {
        for (var key in selected)
          defaults[key] = selected[key]
      }
      workspaces.current = settings.getWorkspace();
      event.sender.send('has_settings_list', {settings: defaults, workspaces: workspaces});
    })
  })

  ipc.on('settings_save', function (event, arg) {
    settings.patch(arg, function (err) {
      if (err) {
        event.sender.send('has_settings_save', '{"error",true, "code":"could_not_save_settings", "message":"Could not save settings file"}')
      } else {
        event.sender.send('has_settings_save', '{"error":false}')
      }
    })
  })

  ipc.on('workspace_create', function (event, arg) {
    workspaces.create(arg, function(err, result) {
      if (err)
        event.sender.send('on_workspace_changed', err);
      else
        event.sender.send('on_workspace_changed', { error: false, result_message: 'workspace_created', workspace: result });
    });
  });

  ipc.on('workspace_change', function (event, arg) {
    workspaces.setCurrent(arg, function(err, result) {
      if (err)
        event.sender.send('on_workspace_changed', err);
      else
        event.sender.send('on_workspace_changed', { error: false, result_message: 'workspace_changed' });
    });
  });

  ipc.on('workspace_delete', function (event, arg) {
    workspaces.remove(arg, function(err, result) {
      if (err)
        event.sender.send('on_workspace_changed', err);
      else
        event.sender.send('on_workspace_changed', { error: false, result_message: 'workspace_deleted', workspace: arg });
    });
  });

}

module.exports = {
  bind: bind
}
