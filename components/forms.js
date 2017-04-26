const path = require('path'),
  readline = require('readline'),
  async = require('async'),
  settings = require('../helpers/settings'),
  fs = require('fs-extra'),
  dialog = require('electron').dialog

function bind(app) {
  const ipc = app.ipc;
  ipc.on('form_delete', function (event, arg) {
    var folder = settings.getUserFormsDirectory()
    fs.readdir(folder, function (err, files) {
      if (err) {
        event.sender.send('has_form_delete')
      } else {
        var found = false
        for (var i in files) {
          if (files[i] === arg) {
            fs.unlinkSync(path.join(folder, files[i]))
            event.sender.send('has_form_delete')
            found = true
            break
          }
        }
        if (!found)
          event.sender.send('has_form_delete')
      }
    })
  })

  ipc.on('form_list', function (event, arg) {
    var folder = settings.getUserFormsDirectory();
    fs.readdir(folder, function (err, files) {
      var data = { forms: [] }
      if (err) {
        event.sender.send('has_form_list', data)
      } else {
        var parallels = files.map(createFormReader);
        async.parallel(parallels, function(a_err, results) {
          var data = { forms: [] }
          if (!a_err) {
            for (var key in results)
              data.forms.push(results[key])
            data.forms.sort(function(a, b) {
              var l = a.name.toLowerCase();
              var r = b.name.toLowerCase();
              return l < r ? -1 : l > r ? 1 : 0;
            });
          }
          event.sender.send('has_form_list', data);
        });
      }
    })
  })

  ipc.on('select_form', function (event, arg) {
    var options = {
      properties: ['openFile', 'multiSelections'],
      filters: [ { name: 'XML', extensions: ['xml'] } ]
    }
    dialog.showOpenDialog(app.getMainWindow(), options, function (arr) {
      if (arr !== undefined) {
        var destDir = settings.getUserFormsDirectory()
        var uploaded = {
          count: arr.length,
          names: []
        }
        for (var index in arr) {
          var source = arr[index]
          var filename = path.basename(source)
          var target = path.join(destDir, filename)
          fs.copySync(source, target)
          uploaded.names.push(filename)
        }
        event.sender.send('has_select_form', uploaded)
      }
    })
  })
}

/*
 * Cheating a bit here -- instead of reading the entire file and parsing the
 * XML, going to read line-by-line instead until I find the interesting line,
 * then break early if possible.
 */
function createFormReader(key) {
  return function(cb) {
    var reader = readline.createInterface({
      input: fs.createReadStream(path.join(settings.getUserFormsDirectory(), key)),
      terminal: true
    });
    var item = { file: key, name: key };
    reader.on('line', function (input) {
      var line = input.trim();
      if (line.startsWith("<h:title")) {
        item.name = line.substring("<h:title>".length, line.indexOf("</h:title>"));
        /*
         * FIXME: Hack to close the input stream early and stop reading extra
         * information. Would like a better solution. For now, simulate terminal
         * input of Ctrl+C/D
         */
        reader.write(null, { ctrl: true, name: require('os').platform() == 'win32' ? 'd' : 'c' })
      }
    });
    reader.on('close', function () {
      cb(null, item);
    });
  }
}


module.exports = {
  bind: bind
}
