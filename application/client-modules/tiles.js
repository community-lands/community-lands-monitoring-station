(function(app) {
  const ipc = app.ipc

  ipc.on('has_tiles_list', function (evt, result) {
    document.getElementById('tiles_listing').innerHTML = ''
    if (!result.error) {
      var content = ''
      var tiles = result.tiles
      var i
      if (tiles.length > 0) {
        content = '<h5>' + t('title.saved_tiles') + '</h5>'
        content += '<table class="table table-condensed">'
        for (i in tiles) {
          content += '<tr>'
          content += '<td>' + tiles[i] + '</td>'
          content += '</tr>'
        }
        content += '</table>'
      }
      if (result.warnings && result.warnings.length > 0) {
        content += '<div style="margin-top: 10px">'
        for (i in result.warnings) {
          var warning = result.warnings[i]
          content += '<div class="text-warning"><i class="fa fa-warning">' +
            '</i> <span>' + t(warning) + '</span></div>'
        }
        content += '</div>'
      }
      document.getElementById('tiles_listing').innerHTML = content
    }
  })

  ipc.send('tiles_list')

})(window.app)
