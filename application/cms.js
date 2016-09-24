/* eslint-env browser, jquery */

const electron = require('electron')
const ipc = electron.ipcRenderer
const loading = require('./loading.js')
const t = require('./locale.js').t

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
