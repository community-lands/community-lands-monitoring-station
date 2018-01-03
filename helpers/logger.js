const winston = require('winston')

const level = process.env.LOG_LEVEL || 'debug'
const settings = require('./settings')
const path = require('path'),
  fs = require('fs-extra')

LOGGER = null

function initLogger() {
  LOGGER = new winston.Logger({
    transports: [
      createConsoleLogger(),
      createFileLogger()
    ]
  })
  return LOGGER
}

function createConsoleLogger() {
  return new winston.transports.Console({
    level: level,
    timestamp: function () {
      return (new Date()).toISOString();
    }
  })
}

function createFileLogger() {
  const logDir = path.join(settings.getRootPath(), 'Logs')
  fs.ensureDirSync(logDir)
  return new winston.transports.File({
    level: level,
    timestamp: function () {
      return (new Date()).toISOString();
    },
    filename: path.join(logDir, 'debug.log'),
    maxFiles: 10,
    maxsize: 50 * 1024 * 1024,
    tailable: true,
    zippedArchive: true
  })
}

module.exports = (function() {
  return LOGGER ? LOGGER : initLogger()
})()
