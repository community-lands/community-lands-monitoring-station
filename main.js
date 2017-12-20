if (require('electron-squirrel-startup')) return;

/** Setup Globals */
const electron = require('electron')
const app = electron.app // Module to control application life.
const BrowserWindow = electron.BrowserWindow // Module to create native browser window.
const Menu = electron.Menu

/** Set the current directory */
process.env.directory = process.env.directory || app.getAppPath()

/** Configure Monitoring Station server and initialize settings */
require('./server')
const settings = require('./helpers/settings')
const i18n = require('./helpers/locale.js')

/** Add Components to support electron app */
const context = {
  ipc: electron.ipcMain,
  settings: settings,
  getMainWindow: function() { return mainWindow; }
}
require('./components/filters').bind(context);
require('./components/forms').bind(context);
require('./components/import_export').bind(context);
require('./components/settings').bind(context).setDefaults({
  shared_secret: 'demo',
  mapLayer: null,
  mapZoom: null,
  mapCenterLat: null,
  mapCenterLong: null,
  tiles: settings.getDefaultTilesDirectory(),
  tracks: settings.getTracksDirectory(),
  community_lands_upload: 'simple'
}).setHidden(['tiles_directories']);
require('./components/tracks').bind(context);
require('./components/upload').bind(context).saveWebsite(false);

const Tiles = require('./components/tiles'); //We need this later
Tiles.bind(context);

/** Show the application */

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  // Ensure tiles are ready for first use
  Tiles.refresh(function() { });

  // Create the browser window.
  mainWindow = new BrowserWindow({minWidth: 400, minHeight: 400})

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html?locale=' + (settings.getLocale() || 'en'))

  // Open the DevTools.
  // mainWindow.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // Create the Application's main menu
  var template = [{
    label: i18n.t('menu.application'),
    submenu: [
        { label: i18n.t('menu.about'), selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: i18n.t('menu.quit'), accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: i18n.t('menu.edit'),
    submenu: [
        { label: i18n.t('menu.undo'), accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: i18n.t('menu.redo'), accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: i18n.t('menu.cut'), accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: i18n.t('menu.copy'), accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: i18n.t('menu.paste'), accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: i18n.t('menu.select_all'), accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];
  if (settings.isDevMode()) {
    template.push({
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
})
