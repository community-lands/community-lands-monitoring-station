var extend = require('xtend')
var fs = require('fs')
var path = require('path')
var persistFs = require('../helpers/persist-fs')
var async = require('async')

const logger = require('../helpers/logger')

var defaults = {
  store: 'fs'
}

/**
 * openrosa-form-submission middleware saves the files to `tmp` and attaches
 * a `files` object to `req`, with properties `file.path`, `file.headers` and
 * `file.size` see https://github.com/andrewrk/node-multiparty/#file-name-file
 *
 * This middleware saves each file to the chosen storage.
 */
function SaveMedia (options) {
  var store

  options = extend(defaults, options)

  store = persistFs

  return function (req, res, next) {
    if (!req.files.length) return next()
    if (!req.submission) return next(new Error('no form submission found'))
    logger.info('Received %s media files with submission', req.files.length)
    logger.info(req.submission.json)

    var s3bucket = req.params.s3bucket

    var tasks = req.files.map(function (indexOrFile, maybeFile) {
      return function (cb) {
        var index = 1
        var file = indexOrFile
        if (maybeFile) {
          index = indexOrFile
          file = maybeFile
        }
        var storeOptions = {
          filesystem: {
            path: req.submission.location
          },
          filename: req.submission.instanceId + '_' + index + path.extname(file.originalFilename), //file.originalFilename,
          s3bucket: s3bucket,
          file: file
        }

        logger.info('Attempt to store media %s...', file.originalFilename)

        store(fs.createReadStream(file.path), storeOptions, function onSave (err, url) {
          if (err) {
            cb(err)
          } else {
            // store a reference to where the file is now stored on the file object

            file.url = (req.submission.location + storeOptions.filename).replace(/.*Monitoring/,'')
            if (req.submission.json["properties"]["photos"]) {
              req.submission.json["properties"]["photos"]["picture"] = file.url
            } else {
              if (req.submission.json["properties"]["picture"]) {
                req.submission.json["properties"]["picture"] = file.url
              }
            }
            index++
            cb(null, index)
          }
        })
      }
    })

    async.waterfall(tasks, function (err, result) {
      if (err)
        onError(err)
      else {
        cleanupFiles()
        next()
      }
    })

    function onError (err) {
      logger.error('Failed to save media.', { error: err })
      cleanupFiles()
      next(err)
    }

    /**
     * The form submission middleware saves all the files to disk
     * Now we have stored them we must delete the temp files or disk
     * space will quickly fill up.
     */
    function cleanupFiles () {
      req.files.forEach(function (file) {
        fs.unlink(file.path, function (err) {
          if (err) logger.error('Error deleting file %s', file.path)
        })
      })
    }
  }
}

module.exports = SaveMedia
