/* eslint-env browser, jquery */
/* FIXME: these globals can and should be done with requires */
/* global t */

var statusIcons = {
  success: 'check-circle',
  warning: 'exclamation-circle',
  danger: 'times-circle',
  info: 'info-circle'
}

/**
 * Call on a loading screen being displayed to update
 * the status line
 *
 * Options - a status message (string) or a hash:
 * - heading: change the heading message
 * - status: change the status message
 *
 */
exports.updateLoadingScreen = (opts) => {
  var options
  if (typeof opts === 'string') {
    options = { status: opts }
  } else {
    options = opts
  }

  if (options['heading']) {
    jQuery('#loading .modal-title').html(options.heading)
  }

  if (options['status']) {
    jQuery('#loading-status').html(options.status)
  }
}

/**
 * Display the loading screen
 *
 * Options - a heading message (string) or a hash:
 * - heading: the heading message (default t('progress.loading'))
 * - status: the status message (default blank)
 */
exports.showLoadingScreen = (opts) => {
  var options

  if (opts !== undefined && typeof opts === 'string') {
    options = { heading: opts }
  } else {
    options = opts || {}
    options['heading'] = options['heading'] || t('progress.loading')
    options['status'] = options['status'] || null
  }

  exports.updateLoadingScreen(options)

  $('#loading-status').html('')
  $('#loading').modal('show')
}

exports.hideLoadingScreen = () => {
  $('#loading').modal('hide')
}

/**
 * Options:
 * - dismissable: Place a close button on this alert (default true)
 * - timeout: when dismissable is true, true to auto-dismiss the alert, false otherwise (default true)
 * - type: One of "success", "info", "warning" or "danger" (defaults to "success")
 */
exports.showStatus = (message, opts) => {
  var options = opts || {}
  options['type'] = options['type'] || 'success'
  if (options.type === 'error') {
    options.type = 'danger'
  }

  var dismissable = options['dismissable'] !== false
  var html = ''

  var status = $('#status')

  html += '<div role="alert" class="alert alert-' + options.type
  if (dismissable) {
    html += ' alert-dismissable fade in'
  }
  html += '">'

  if (dismissable) {
    html += '<button type="button" class="close" data-dismiss="alert" ' +
      'aria-label="Close"><span aria-hidden="true">&times;</span></button>'
  }

  if (options['icon'] !== false) {
    var icon = (typeof options['icon'] === 'string') ? options.icon : statusIcons[options.type]
    html += '<i class="fa fa-' + icon + '"></i>&nbsp;'
  }

  html += message

  html += '</div>'

  status.html(html)

  status.show()
  $('html body').animate({ scrollTop: 0 })

  if (dismissable && options['timeout'] !== false) {
    var timeout = (typeof options['timeout'] === 'number') ? options.timeout : 3000
    setTimeout(function () {
      $('#status .alert').alert('close')
    }, timeout)
  }
}

exports.showRestart = (message) => {
  var status = $('#restartRequiredMessage')
  status.html(message)

  $('#restartRequiredModal').modal('show');
}
