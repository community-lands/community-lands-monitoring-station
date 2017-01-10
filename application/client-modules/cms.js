/* eslint-env browser, jquery */

(function(app) {
  const ipc = app.ipc
  const loading = app.loading
  const t = app.t

  const saveTemplate = () => {
    loading.showLoadingScreen(t('progress.saving_template'))
    ipc.send('save_template', {
      template: $('#select_website_template').val(),
      community: $('#website_community').val(),
      year: $('#website_year').val()
    })
  }

  ipc.on('has_saved_template', function (evt, result) {
    loading.hideLoadingScreen()
  })

  ipc.on('has_templates_list', function(evt, result) {
    var options = ''
    for (var idx in result) {
      var template = result[idx]
      options += '<option value="' + template.id + '">' + template.properties.template_name + '</option>'
    }
    if (options == '')
      $('#web_template_section').hide()
    else
      $('#select_website_template').html(options)
  })

  ipc.send('templates_list')

  $(document).ready(function () {
    $('#cmsSaveTemplateButton').on('click', saveTemplate)
  })
})(window.app)
