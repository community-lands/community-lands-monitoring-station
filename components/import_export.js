const path = require('path'),
  http = require('http'),
  fs = require('fs-extra'),
  dialog = require('electron').dialog,
  unzip = require('unzip2');

const GeoJson = require('../helpers/rebuild-geojson')

function bind(app) {
  const ipc = app.ipc;
  const settings = app.settings;

  ipc.on('import_files', function(event, args) {
    var options = {
      properties: ['openFile'],
      filters: [ { name: 'ZIP', extensions: ['zip'] } ]
    };

    dialog.showOpenDialog(app.getMainWindow(), options, function(file) {
      if (file) {
        var source = '' + file;
        var target = path.dirname(settings.getSubmissionsDirectory());

        var complete = function(err) {
          if (err) {
            event.sender.send('has_import_files', { error: true, code: 'import_delete_failed', ex: err });
          } else {
            try {
              fs.createReadStream(source)
              .pipe(unzip.Extract({ path: target }))
              .on('close', function() {
                GeoJson.generate(function(err_json, details) {
                  if (err_json)
                    event.sender.send('has_import_files', err_json);
                  else
                    event.sender.send('has_import_files', { error: false, details: details });
                });
              });
            } catch (e) {
              event.sender.send('has_import_files', { error: true, code: 'import_unzip_failed', ex: e });
            }
          }
        };

        if (args.mode == 'merge')
          complete(null);
        else
          fs.emptydir(path.join(target, 'Submissions'), complete);
      } else {
        event.sender.send('has_import_files', { error: true, code: 'import_cancelled' });
      }
    });
  });

  ipc.on('backup_submissions', function (event, arg) {
    var options = {
      hostname: settings.localhost,
      port: settings.getPort() || 3000,
      path: '/save/all',
      method: 'GET'
    }
    http.request(options, function (res) {
      var data = ''
      res.on('data', function (chunk) {
        data += chunk
      })
      res.on('end', function () {
        result = JSON.parse(data);
        result['cb'] = arg;
        result['cancelled'] = false;
        if (arg) {
          options = {
            defaultPath: result.location
          }
          dialog.showSaveDialog(app.getMainWindow(), options, function(filename) {
            if (filename && result.location != filename) {
              fs.copy(result.location, filename, function(err) {
                if (err) {
                  result['error'] = true;
                  result['code'] = 'backup_failed';
                } else {
                  result.location = filename;
                }
                event.sender.send('backup_submissions_complete', result);
              });
            } else {
              result['cancelled'] = result.location == filename;
              event.sender.send('backup_submissions_complete', result);
            }
          });
        } else {
          event.sender.send('backup_submissions_complete', result)
        }
      })
    }).on('error', function (e) {
      event.sender.send('backup_submissions_complete',{"error":true, "code":"could_not_connect", "message":"Could not connect to server"})
    }).end()
  })

  ipc.on('check_last_backup', function (event, arg) {
    var options = {
      hostname: settings.localhost,
      port: settings.getPort() || 3000,
      path: '/save/status',
      method: 'GET'
    }
    http.request(options, function (res) {
      var data = ''
      res.on('data', function (chunk) {
        data += chunk
      })
      res.on('end', function () {
        event.sender.send('has_last_backup', data)
      })
    }).end()
  })

}

module.exports = {
  bind: bind
}
