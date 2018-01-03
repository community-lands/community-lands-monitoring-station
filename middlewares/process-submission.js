const settings = require('../helpers/settings'),
  logger = require('../helpers/logger')

var xform2json = require('xform-to-json')
var extend = require('xtend')
var fmt = require('moment')
var path = require('path')

var defaults = {
  geojson: true
}

var SUBMISSIONS = settings.getSubmissionsDirectory()

/**
 * Converts form xml in `req.body` to json, adds meta data, attaches data to
 * `req.submission`
 */
function ProcessSubmission (options) {
  return function (req, res, next) {
    if (!req.body.length) {
      return next(new Error('No form submission found'))
    }

    logger.info('Received xml submission')

    options = extend(defaults, options)

    options.meta = extend(options.meta, {
      deviceId: req.query.deviceID,
      submissionTime: new Date()
    })

    xform2json(req.body, options, function (err, form) {
      if (err) return next(err)
      var meta = options.geojson ? form.properties.meta : form.meta
      var date = fmt().format('YYYY-MM-DD')

      req.submission = {
        json: form,
        geojson: options.geojson,
        xml: req.body,
        date: date,
        location: path.join(SUBMISSIONS, req.user.username, date) + '/',
        formId: meta.formId,
        instanceId: meta.instanceId.replace(/^uuid:/, '')
      }

      logger.info('Processed xml submission as json: %s', req.submission.instanceId)
      next()
    })
  }
}

module.exports = ProcessSubmission
