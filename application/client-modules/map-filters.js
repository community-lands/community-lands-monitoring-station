(function(app) {
  const ipc = app.ipc
  const config = app.config
  const t = app.t

  ipc.on('filter_list_changed', function (evt, result) {
    ipc.send('filter_list')
  })

  ipc.on('has_filter_list', function (evt, result) {
    document.getElementById('saved-filters').innerHTML = ''
    var json = JSON.parse(result)
    if (!json.error) {
      var filters = json.filters
      if (filters.length > 0) {
        var content = '<h5>' + t('title.saved_filters') + '</h5>'
        content += '<table class="table table-condensed">'
        for (var index in filters) {
          content += '<tr>'
          content += '<td><a class="map-link" href="' + config.localUrl +
            '/mapfilter?locale=' + config.locale + '&filter=' +
            filters[index].id + '">' +
            filters[index].name + '</a></td>'
          content += '<td align="right"><div data-filter="' + filters[index].id +
            '" class="delete-filter btn btn-small">' +
            '<i class="fa fa-remove"/></div></td>'
          content += '</tr>'
        }
        content += '</table>'
        document.getElementById('saved-filters').innerHTML = content
        var i
        var els = document.getElementsByClassName('map-link')
        for (i in els) {
          els[i].onclick = function (event) {
            event.preventDefault()
            shell.openExternal(this.getAttribute('href'))
          }
        }
        var dels = document.getElementsByClassName('delete-filter')
        for (i in dels) {
          dels[i].onclick = function () {
            var filter = this.getAttribute('data-filter')
            if (confirm(t('confirm.delete_filter'))) {
              ipc.send('filter_delete', filter)
            }
          }
        }
      }
    }
  })

  ipc.send('filter_list')


})(window.app)
