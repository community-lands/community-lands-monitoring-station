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

  $(function () {
    $('#cmsSaveTemplateButton').on('click', saveTemplate)
  })
})(window.app)
