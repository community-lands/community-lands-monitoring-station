(function(app) {
  const ipc = app.ipc

  ipc.on('has_tiles_list', function (evt, result) {
    document.getElementById('tiles_listing').innerHTML = ''
    if (!result.error) {
      var content = ''
      var tiles = result.tiles
      var i
      var line_height = (20 / 14)
      if (tiles.length > 0) {
        content = '<h5>' + t('title.saved_tiles') + '</h5>'
        content += '<table class="table table-condensed">'
        for (i in tiles) {
          content += '<tr>'
          if (tiles[i].valid)
            content += '<td width="30px" align="middle"><i style="line-height:'+line_height+'" class="text-success fa fa-check"></i></td>'
          else
            content += '<td width="30px" align="middle"><i style="line-height:'+line_height+'" class="text-danger fa fa-warning"></i></td>'
          content += '<td>' + tiles[i].name + '</td>'
          if (tiles[i].valid)
            content += '<td></td>'
          else {
            var errors = []
            for (var k = 0; k < tiles[i].errors.length; k++)
              errors.push(t('error.' + tiles[i].errors[k]))
            content += '<td><span class="text-warning small">' + errors.join("; ") + '</span></td>'
          }
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
      var tilesDirectoriesHTML = '<table class="table table-condensed small">';
      for (i in result.directories) {
        var dir = result.directories[i]
        tilesDirectoriesHTML += '<tr>'
        tilesDirectoriesHTML += '<td>'
        tilesDirectoriesHTML += '<div class="btn btn-xs"><i class="' + (dir.available ? 'fa fa-check text-success' : 'fa fa-question text-warning') + '"></div>'
        tilesDirectoriesHTML += '</td>'
        tilesDirectoriesHTML += '<td>' + dir.directory + '</td>'
        tilesDirectoriesHTML += '<td align="right">'
        if (!dir.isDefault) {
          tilesDirectoriesHTML += '<div class="btn btn-xs tilesDirectoryRemoveBtn" data-directory="' + dir.directory + '">'
          tilesDirectoriesHTML += '<i class="fa fa-remove"></i>'
          tilesDirectoriesHTML += '</div>'
        }
        tilesDirectoriesHTML += '</td>'
        tilesDirectoriesHTML += '</tr>'
      }
      tilesDirectoriesHTML += '</table>';
      document.getElementById('tiles_folder').innerHTML = tilesDirectoriesHTML;

      var els = document.getElementsByClassName('tilesDirectoryRemoveBtn');
      for (var i in els) {
        els[i].onclick = function() {
          if (confirm(t('confirm.removeTilesDirectory')))
            ipc.send('tiles_remove_directory', { directory: this.getAttribute('data-directory') });
        }
      }
    }
  })

  ipc.on('tiles_list_changed', function() {
    ipc.send('tiles_list');
    ipc.send('list_map_layers');
  });

  ipc.send('tiles_list')

  $(document).ready(function() {
    $("#tilesDirectoryChooserBtn").click(function() {
      ipc.send('tiles_add_directory');
    });
  });

})(window.app)
