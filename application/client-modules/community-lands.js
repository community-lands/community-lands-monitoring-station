(function(app) {

  const loading = app.loading
  const ipc = app.ipc
  const t = app.t

  function communityLandsUpload () {
    if (navigator.onLine) {
      loading.showLoadingScreen(t('progress.uploading'))
      ipc.send('community_lands_backup', { submissions: true, website: true })
    } else {
      alert(t('alert.no_internet'))
    }
  }

  function updateOnlineStatus() {
    ipc.send('community_lands_online', navigator.onLine)
  }

  ipc.on('cl_upload_progress', function (evt, result) {
    if (result.status === 'uploading') {
      loading.updateLoadingScreen(t('progress.importing') + ' <br/> &gt; ' +
        result.progress + '...')
    } else {
      loading.updateLoadingScreen(t('progress.importing') + ' <br/> &gt; ' +
        t('progress.' + result.status) +
        ' <i class="fa fa-spinner fa-pulse fa-fw"></i>')
    }
  })

  ipc.on('has_community_lands_online', function (evt, status) {
    if (status === true || status === 'true') {
      ipc.send('community_lands_status')
    } else {
      document.getElementById('connection_status').innerHTML = t('text.offline')
      document.getElementById('community_lands_sync_date').innerHTML =
        t('text.unavailable')
    }
  })

  ipc.on('has_community_lands_status', function (evt, result) {
    document.getElementById('connection_status').innerHTML = t('text.online')
    if (result !== null && result !== '') {
      var json = JSON.parse(result)
      if (json.submissions && json.website) {
        var date = json.submissions > json.website ? json.submissions : json.website
        document.getElementById('community_lands_sync_date').innerHTML =
          new Date(date)
      } else if (json.submissions) {
        document.getElementById('community_lands_sync_date').innerHTML =
          new Date(json.submissions)
      } else if (json.website) {
        document.getElementById('community_lands_sync_date').innerHTML =
          new Date(json.website)
      } else {
        document.getElementById('community_lands_sync_date').innerHTML =
          t('text.unavailable')
      }
    } else {
      document.getElementById('community_lands_sync_date').innerHTML =
        t('text.unavailable')
    }
  })

  ipc.on('has_community_lands_backup', function (evt, result) {
    loading.hideLoadingScreen()
    var json = JSON.parse(result)
    var html = ''
    if (json.error) {
      html += t('text.upload_failed')
      if (json.code) {
        html += ' ' + t('error.' + json.code)
      } else if (json.message) {
        html += ' ' + json.message
      }
    } else {
      html += t('text.upload_success')
      html += ' '
      html += t('text.files_uploaded')
      html += ' '
      html += json.entity.submissions_uploaded + json.entity.website_uploaded
    }
    loading.showStatus(html, {
      type: json.error ? 'error' : 'success', timeout: 10000
    })
    ipc.send('community_lands_status')
  })

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  updateOnlineStatus()

  $(document).ready(function() {
    $("#communityLandsUploadBtn").click(communityLandsUpload)
  })

})(window.app)
