(function(app) {

  const ipc = app.ipc
  const t = app.t

  ipc.on('has_select_form', function (evt, result) {
    ipc.send('form_list')
  })

  ipc.on('has_form_delete', function (evt, result) {
    ipc.send('form_list')
  })

  ipc.on('has_form_list', function (evt, result) {
    var forms = result.forms
    if (forms.length > 0) {
      var content = '<h5>' + t('title.my_monitoring_forms') +
        '</h5><table class="table table-condensed">'
      for (var index in forms) {
        content += '<tr>' +
          '<td><span>' + forms[index].name +
          '</span> <span style="color:#999">(' + forms[index].file +
          ')</span></td><td align="right"><div data-form="' +
          forms[index].file +
          '" class="delete-form btn btn-small">' +
          '<i class="fa fa-remove"/></div></td></tr>'
      }
      content += '</table>'
      document.getElementById('form_listing').innerHTML = content
      var els = document.getElementsByClassName('delete-form')
      for (index in els) {
        els[index].onclick = function () {
          var form = this.getAttribute('data-form')
          if (confirm(t('confirm.delete_form'))) {
            ipc.send('form_delete', form)
          }
        }
      }
    } else {
      document.getElementById('form_listing').innerHTML = ''
    }
  })

  ipc.send('form_list')

  $(document).ready(function() {
    $("#formChooserBtn").click(function() {
      ipc.send('select_form')
    })
  })

})(window.app)
