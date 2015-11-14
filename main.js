var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

var fs = require('fs');
var ipc = require('ipc');
var server = require('./server')

ipc.on('show_configuration', function(event, arg) {
  try{
    list = fs.readdirSync('.');
    _results = [];
    _results.push("station:"+process.env.station)
    _results.push("baseUrl:"+process.env.baseUrl)
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      var file = list[_i];
      _results.push(file);
    }
    event.sender.send('has_configuration', _results);
  } catch (err) {
    event.sender.send('has_configuration', []);
  }
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 400, height: 400});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Open the DevTools.
  // mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
