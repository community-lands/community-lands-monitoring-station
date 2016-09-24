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
function updateLoadingScreen (opts) {
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
/* TODO: for backwards compatibility, we still define these functions
   in the global namespace ("function foo(){}") -- but also expose them
   as exports so code going forward can use these features as a module.
   Eventually, take away the global usages. */
if (typeof exports !== 'undefined') {
  exports.updateLoadingScreen = updateLoadingScreen
}

/**
 * Display the loading screen
 *
 * Options - a heading message (string) or a hash:
 * - heading: the heading message (default t('progress.loading'))
 * - status: the status message (default blank)
 */
function showLoadingScreen (opts) {
  var options

  if (opts !== undefined && typeof opts === 'string') {
    options = { heading: opts }
  } else {
    options = opts || {}
    options['heading'] = options['heading'] || t('progress.loading')
    options['status'] = options['status'] || null
  }

  updateLoadingScreen(options)

  $('#loading-status').html('')
  $('#loading').modal('show')
}
if (typeof exports !== 'undefined') {
  exports.showLoadingScreen = showLoadingScreen
}

function hideLoadingScreen () {
  $('#loading').modal('hide')
}
if (typeof exports !== 'undefined') {
  exports.hideLoadingScreen = hideLoadingScreen
}

/**
 * Options:
 * - dismissable: Place a close button on this alert (default true)
 * - timeout: when dismissable is true, true to auto-dismiss the alert, false otherwise (default true)
 * - type: One of "success", "info", "warning" or "danger" (defaults to "success")
 */
function showStatus (message, opts) {
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
if (typeof exports !== 'undefined') {
  exports.showStatus = showStatus
}
