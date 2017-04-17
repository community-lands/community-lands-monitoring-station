const path = require('path'),
  http = require('http'),
  fs = require('fs-extra');

function bind(app) {
  const ipc = app.ipc;
  const settings = app.settings;

  ipc.on('filter_list', function (event, arg) {
    var options = {
      hostname: 'localhost',
      port: settings.getPort() || 3000,
      path: '/mapfilter/filters',
      method: 'GET'
    }
    http.request(options, function (res) {
      var data = ''
      res.on('data', function (chunk) {
        data += chunk
      })
      res.on('end', function () {
        event.sender.send('has_filter_list', data)
      })
    }).on('error', function (e) {
      event.sender.send('has_filter_list', '{"error":true, "code":"could_not_connect", "message":"Could not connect to server"}')
    }).end()
  })

  ipc.on('filter_delete', function (event, arg) {
    var options = {
      hostname: 'localhost',
      port: settings.getPort() || 3000,
      path: '/mapfilter/filters/local/' + arg,
      method: 'DELETE'
    }
    http.request(options, function (res) {
      var data = ''
      res.on('data', function (chunk) {
        data += chunk
      })
      res.on('end', function() {
        event.sender.send('filter_list_changed', data);
      })
    }).on('error', function (e) {
      event.sender.send('filter_list_changed');
    }).end()
  })

  var FiltersDir = settings.getFiltersDirectory()
  try {
    fs.mkdirpSync(FiltersDir)
  } catch (e) { // It's ok
  }
  try {
    fs.watch(FiltersDir, function (evt, filename) {
      app.getMainWindow().send('filter_list_changed');
    })
  } catch (e) { // It's ok
  }

}


module.exports = {
  bind: bind
}
