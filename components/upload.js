const path = require('path'),
  http = require('http');

const ServerEvents = require('../helpers/server-events')

function bind(app) {
  const ipc = app.ipc;
  const settings = app.settings;

  ipc.on('community_lands_backup', function(event, arg) {
    if (settings.getCommunityLandsServer()) {
      var options = {
        hostname: 'localhost',
        port: settings.getPort() || 3000,
        path: '/communitylands/latest?submissions=true&website=true',
        method: 'GET'
      }
      http.request(options, function (res) {
        var data = ''
        res.on('data', function (chunk) {
          data += chunk
        })
        res.on('end', function () {
          event.sender.send('has_community_lands_backup', data)
        })
      }).on('error', function (e) {
        event.sender.send('has_community_lands_backup', '{"error":true, "code":"could_not_connect", "message":"Could not connect to server"}')
      }).end()
    } else {
      event.sender.send('has_community_lands_backup', '{"error":true, "code":"community_lands_not_configured", "message":"Community Lands connection not configured"}')
    }
  })

  ipc.on('community_lands_status', function (event, arg) {
    if (settings.getCommunityLandsServer()) {
      var options = {
        hostname: 'localhost',
        port: settings.getPort() || 3000,
        path: '/communitylands/status',
        method: 'GET'
      }
      http.request(options, function (res) {
        var data = ''
        res.on('data', function (chunk) {
          data += chunk
        })
        res.on('end', function () {
          event.sender.send('has_community_lands_status', data)
        })
      }).on('error', function (e) {
        event.sender.send('has_community_lands_status', null)
      }).end()
    } else {
      event.sender.send('has_community_lands_status', null)
    }
  })

  ipc.on('community_lands_online', function (event, arg) {
    event.sender.send('has_community_lands_online', arg)
  })

  ServerEvents.on('cl_upload_progress', function(done, bytes) {
    if (done)
      app.getMainWindow().send('cl_upload_progress', { status: 'waiting' });
    else {
      var value = bytes, units = 'B';
      if (bytes < 1024) {
        //Do nothing
      } else if (bytes < (1024 * 1024)) {
        value = bytes / 1024;
        units = 'KB';
      } else {
        value = bytes / (1024 * 1024);
        units = 'MB';
      }
      value = +value.toFixed(2);
      app.getMainWindow().send('cl_upload_progress', { status: 'uploading', progress: value + ' ' + units });
    }
  });
}

module.exports = {
  bind: bind
}
