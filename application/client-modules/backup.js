(function(app) {
  const ipc = app.ipc
  const t = app.t
  const loading = app.loading
  const config = app.config

  ipc.on('has_last_backup', function (evt, result) {
    var json = JSON.parse(result)
    if (json.date) {
      document.getElementById('last_backup').innerHTML = '<p>' +
        t('prompt.last_backup') + '<a id="lastBackupLink" href="javascript:void(0)">' +
        new Date(json.date) + '</a></p>'

      $("#lastBackupLink").click(openBackupFolder)
    }
  })

  ipc.on('backup_submissions_complete', function (evt, json) {
    loading.hideLoadingScreen()
    if (json.error) {
      alert(t('error.' + json.code))
    } else if (!json.cancelled) {
      loading.showStatus(t('text.backup_complete') +
        '<br/>' + t('prompt.open') +
        '<a id="backup_file" href="javascript:void(0);" ' +
        'data-location="' + json.location + '">' + json.location +
        '</a>', { timeout: false })

      $("#backup_file").click(openBackupFile)

      ipc.send('check_last_backup')
    }
  })

  function backupFiles (cb) {
    loading.showLoadingScreen(t('progress.saving'))
    ipc.send('backup_submissions', cb)
  }

  function openBackupFolder () {
    if (config) {
      app.electron.shell.showItemInFolder(config.directory + '/Monitoring/' + config.station +
        '/Backup')
    }
  }

  function openBackupFile () {
    var file = document.getElementById('backup_file')
      .getAttribute('data-location')
    app.electron.shell.showItemInFolder(file)
  }

  ipc.send('check_last_backup')

  $(document).ready(function() {
    $("#backupSimpleBtn").click(function() {
      backupFiles();
    })
    $("#backupUSBBtn").click(function() {
      backupFiles(true);
    })
  })

})(window.app)
