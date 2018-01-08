const path = require('path'),
  async = require('async'),
  fs = require('fs-extra'),
  glob = require('glob'),
  dialog = require('electron').dialog,
  watcher = require('chokidar');

const Tiles = require('../helpers/tile-layers.js');

var TilesWatcherTimeout = null;
var TilesWatcher = null;

var context;
var settings;

function bind(app) {
  context = app;
  settings = app.settings;

  const ipc = app.ipc;

  ipc.on('tiles_list', function (event, arg) {
    listTiles(function(err, result) {
      if (!err)
        event.sender.send('has_tiles_list', result);
    });
  });

  ipc.on('list_map_layers', function (event, arg) {
    listTiles(function(err, result) {
      if (err)
        event.sender.send('has_list_map_layers', [])
      else {
        event.sender.send('has_list_map_layers', result.tiles.filter(function(value) {
          return value.valid;
        }).map(function(value) {
          return {name: value.name, value: value.key + ''}
        }));
      }
    });
  });

  ipc.on('tiles_add_directory', function (event) {
    var options = {
      properties: ['openDirectory'],
      defaultPath: settings.getDataDirectory()
    }
    dialog.showOpenDialog(app.getMainWindow(), options, function (folders) {
      if (folders) {
        var folder = folders[0];
        var existing = settings.getTilesDirectories();
        if (existing.indexOf(folder) >= 0)
          event.sender.send('show_status', { message: 'errors.duplicate_tiles_folder', options: { type: 'error' } });
        else {
          var current = process.env.tiles_directories;
          if (!current)
            current = folder;
          else
            current += ';' + folder;
          settings.patch({ tiles_directories: current }, function (err) {
            if (!err) {
              process.env.tiles_directories = current;
              setupTilesWatcher();
              refreshTiles();
            }
          });
        }
      }
    });
  });

  ipc.on('tiles_remove_directory', function (event, args) {
    var current = (process.env.tiles_directories || '').split(";")
    var idx = current.indexOf(args.directory)
    if (idx > -1)
      delete current[idx]
    var result = ''
    for (var i = 0; i < current.length; i++) {
      if (current[i]) {
        if (!result)
          result = current[i]
        else
          result += ';' + current[i]
      }
    }
    settings.patch({ tiles_directories: result }, function (err) {
      if (!err) {
        process.env.tiles_directories = result;
        setupTilesWatcher();
        refreshTiles();
      }
    });
  });

  setupTilesWatcher();
}

function setupTilesWatcher() {
  if (TilesWatcher)
    TilesWatcher.close();

  TilesWatcher = new watcher.FSWatcher({
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
    persistent: true,
    depth: 1
  });

  var TilesDirs = settings.getTilesDirectories();
  for (var i in TilesDirs) {
    var TilesDir = TilesDirs[i];
    if (TilesDir == settings.getDefaultTilesDirectory()) {
      try {
        fs.ensureDirSync(TilesDir)
      } catch (e) { // It's ok
      }
    }
    try {
      TilesWatcher.add(TilesDir)
    } catch (e) { // It's ok
    }
  }
  TilesWatcher.on('raw', function(evt, path) {
    if (TilesWatcherTimeout)
      clearTimeout(TilesWatcherTimeout)
    TilesWatcherTimeout = setTimeout(refreshTiles, 2500);
  });
}

function refreshTiles(cb) {
  var callback;
  if (cb)
    callback = cb;
  else
    callback = function() { context.getMainWindow().send('tiles_list_changed'); }
  Tiles.refresh(callback);
}

function listTiles(cb) {
  Tiles.get(function(err, md) {
    if (err) {
      /*
       * Probably in cases of major error, should reset any custom installed
       * tile directories and start fresh
       */
      cb(err)
    } else {
      var warnFiles = warnFolders = false;
      var result = { error: false, tiles: [], warnings: [], directories: [] };
      Object.keys(md).forEach(function(file) {
        var stats = md[file];
        if (!stats.eligible)
          warnFiles = true;
        else {
          result.tiles.push(stats);
        }
      });
      if (warnFiles)
        result.warnings.push("error.files_in_tiles_folder")
      result.tiles.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0 });
      result.directories = settings.getTilesDirectories().map(function(value) {
        var available = false;
        try {
          fs.accessSync(value, fs.F_OK | fs.R_OK); //only need to read
          available = true;
        } catch (e) { //Directory unavailable
        }
        return {
          available: available,
          directory: value,
          isDefault: value == settings.getDefaultTilesDirectory()
        }
      });

      cb(null, result);
    }
  });
}


module.exports = {
  bind: bind,
  refresh: refreshTiles
}
