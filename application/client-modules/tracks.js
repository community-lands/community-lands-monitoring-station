(function(app) {

  var ipc = app.ipc

  ipc.on('has_select_track_data', function (evt, result) {
    loading.showStatus(t('text.upload_success'));
  })

  ipc.on('has_tracks_list', function(evt, result) {
    var html = '<table class="table table-condensed">'
    html += '<tr><th><span data-translate="title.tracks_list_directory">Directory</span></th>'
    html += '<th><span data-translate="title.tracks_list_file">File</span></th></tr>'
    for (var folder in result)
      for (var i = 0; i < result[folder].length; i++)
        html += '<tr><td>' + folder + '</td><td>' + result[folder][i] + '</td></tr>'
    html += '</table>'
    $('#track_listing').html(html)
  })

  ipc.on('tracks_list_changed', function(evt, result) {
    ipc.send('tracks_list')
  })

  $(document).ready(function() {
    $("#trackDataChooserBtn").click(function() {
      ipc.send('select_track_data')
    })
  })

  ipc.send('tracks_list')

})(window.app)
