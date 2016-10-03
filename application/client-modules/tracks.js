(function(app) {

  ipc.on('has_select_track_data', function (evt, result) {
    loading.showStatus(t('text.upload_success'));
  })

  $(document).ready(function() {
    $("#trackDataChooserBtn").click(function() {
      ipc.send('select_track_data')
    })
  })

})(window.app)
