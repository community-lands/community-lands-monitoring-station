(function(app) {

  const loading = app.loading
  const ipc = app.ipc
  const t = app.t

  function importFilesOverwrite () {
    loading.showLoadingScreen(t('progress.importing'))
    ipc.send('import_files', { mode: 'overwrite' })
  }

  function importFilesMerge () {
    loading.showLoadingScreen(t('progress.importing'))
    ipc.send('import_files', { mode: 'merge' })
  }

  ipc.on('has_import_files', function (evt, result) {
    loading.hideLoadingScreen()
    if (result.error) {
      loading.showStatus(t('error.' + result.code), { type: 'error' })
    } else {
      loading.showStatus(t('text.import_success'), { timeout: 5000 })
    }
  })

  $(document).ready(function() {
    $("#importFilesMergeBtn").click(importFilesMerge)
    $("#importFilesOverwriteBtn").click(importFilesOverwrite)
  })


})(window.app)
