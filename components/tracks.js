const path = require('path'),
  async = require('async'),
  fs = require('fs-extra'),
  glob = require('glob'),
  dialog = require('electron').dialog,
  unzip = require('unzip2');

function bind(app) {
  const ipc = app.ipc;
  const settings = app.settings;

  ipc.on('tracks_list', function (event, arg) {
    var pattern = path.join(settings.getTracksDirectory(), "**", "*.+(gpx|csv)");
    glob(pattern, { matchBase: true, nodir: true, nocase: true }, function(err, matches) {
      var result = {}
      if (!err) {
        for (var i = 0; i < matches.length; i++) {
          var dir = matches[i];
          var file = path.basename(dir);
          var folder = path.basename(path.dirname(dir));
          var list = result[folder] || []
          list.push(file)
          result[folder] = list
        }
      }
      event.sender.send('has_tracks_list', result);
    });
  });

  ipc.on('select_track_data', function (event, arg) {
    var options = {
      properties: ['openFile', 'multiSelections'],
      filters: [ { name: 'ZIP', extensions: ['zip'] } ]
    }
    dialog.showOpenDialog(app.getMainWindow(), options, function (arr) {
      if (arr !== undefined) {
        var destDir = settings.getTracksDirectory()
        var parallels = arr.map(function (value) {
          return unzipTrackData(value, destDir);
        });
        async.parallel(parallels, function (err, result) {
          event.sender.send('has_select_track_data', { errors: false })
        });
      }
    })
  })

  //TODO: Use chokizar
  var TracksDir = settings.getTracksDirectory();
  try {
    fs.ensureDirSync(TracksDir);
  } catch (e) { // It's ok
  }
  try {
    fs.watch(TracksDir, { recursive: true }, function() {
      app.getMainWindow().send('tracks_list_changed');
    });
  } catch (e) { //It's ok
  }

}

function unzipTrackData(source, target) {
  return function (cb) {
    fs.createReadStream(source)
      .pipe(unzip.Extract({ path: target }))
      .on('close', function() {
        cb()
      });
  }
}

module.exports = {
  bind: bind
}
