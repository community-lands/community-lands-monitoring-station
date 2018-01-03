// Saves a file to the local filesystem

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var stream = require('stream')

const logger = require('./logger')

module.exports = function (data, options, callback) {
  var filename = options.filesystem.path + options.filename
  mkdirp(path.dirname(filename), function (err) {
    if (err) logger.error('PersistFS failed to mkdirp at %s', filename, { error: err })
    if (data instanceof stream.Readable) {
      var fileStream = fs.createWriteStream(filename)
      data.pipe(fileStream)
      data.on('end', callback)
    } else {
      logger.info('writing to ' + filename)
      fs.writeFile(filename, data, callback)
    }
  })
}
