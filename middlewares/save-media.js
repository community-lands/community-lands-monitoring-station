var extend = require('xtend')
var fs = require('fs')
var path = require('path')
var persistFs = require('../helpers/persist-fs')
//var updateFileRef = require('../helpers/update-file-ref')

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
    console.log('Received %s media files with submission', req.files.length)

    var taskCount = 0
    var s3bucket = req.params.s3bucket
    var index = 1

    req.files.forEach(function (file) {
      var storeOptions = {
        filesystem: {
          path: req.submission.location
        },
        filename: req.submission.instanceId + '_' + index + path.extname(file.originalFilename), //file.originalFilename,
        s3bucket: s3bucket,
        file: file
      }

      index++

      store(fs.createReadStream(file.path), storeOptions, function onSave (err, url) {
        if (err) onError(err)
        // store a reference to where the file is now stored on the file object
        file.url = (req.submission.location + storeOptions.filename).replace('/Community Lands Data/Monitoring/','')
        req.submission.json["properties"]["photos"]["picture"] = file.url
        //updateFileRef(req.submission.json, file)
        taskCount++
        // Quick and dirty check whether we have processed all the files
        if (taskCount < req.files.length) return
        cleanupFiles()
        next()
      })
    })

    function onError (err) {
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
          if (err) console.error('Error deleting file %s', file.path)
        })
      })
    }
  }
}

module.exports = SaveMedia
