(function() {
  const electron = require('electron')
  const remote = electron.remote
  const {Menu, MenuItem} = remote

  const menu = new Menu()
  menu.append(new MenuItem({
    label: t('menu.cut'),
    role: 'cut',
    accelerator: 'CmdOrCtrl+X'
  }))
  menu.append(new MenuItem({
    label: t('menu.copy'),
    role: 'copy',
    accelerator: 'CmdOrCtrl+C'
  }))
  menu.append(new MenuItem({
    label: t('menu.paste'),
    role: 'paste',
    accelerator: 'CmdOrCtrl+V'
  }))
  menu.append(new MenuItem({
    label: t('menu.select'),
    role: 'selectall',
    accelerator: 'CmdOrCtrl+A'
  }))

  exports.enableCopyPaste = function (selection) {
    $(selection).each(function (index, el) {
      el.addEventListener('contextmenu', function (e) {
        e.preventDefault()
        menu.popup(remote.getCurrentWindow())
        return false
      }, false)
    })
  }

})()
