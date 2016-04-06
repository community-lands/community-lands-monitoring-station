var settings = require('../helpers/settings')

var archiver = require('archiver')
var moment = require('moment')
var path = require('path')
var fs = require('fs')

const BACKUP_FOLDER = settings.getBackupDirectory()
const HISTORY_FILE = path.join(BACKUP_FOLDER, '.backup_history.json')

function prepare (req, res, next, cont) {
  fs.mkdir(BACKUP_FOLDER, function (err) {
    cont(req, res, next)
  })
}

function lastBackup (req, res, next) {
  prepare(req, res, next, function () {
    fs.access(HISTORY_FILE, fs.F_OK | fs.R_OK | fs.W_OK, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          res.json({date: null})
        } else {
          res.json({error: 500, e: err, message: 'Failed to read disk properly for backup.'})
        }
      } else {
        fs.readFile(HISTORY_FILE, 'utf8', function (err, data) {
          res.json(JSON.parse(data))
        })
      }
    })
  })
}

function runBackup (req, res, next) {
  prepare(req, res, next, function () {
    var date = new Date()
    var file = settings.getStation() + '_backup_' + moment(date).format('YYYYMMDDHHmm') + '.zip'

    var dir = settings.getSubmissionsDirectory()
    var opts = { expand: true, src: ['**/*'], dest: '/Submissions', cwd: dir }

    var output = fs.createWriteStream(BACKUP_FOLDER + '/' + file)
    output.on('close', function () {
      fs.writeFile(HISTORY_FILE, JSON.stringify({date: date}), 'utf8', function () {
        res.json({message: 'Data saved successfully', file: file, location: BACKUP_FOLDER + '/' + file})
      })
    })
    output.on('error', function (err) {
      res.json({error: 500, message: 'Failed to write backup'})
    })

    var archive = archiver.create('zip', {})
    archive.pipe(output)
    archive.bulk(opts)
    archive.finalize()
  })
}

module.exports = {
  backup: runBackup,
  lastBackup: lastBackup

}
