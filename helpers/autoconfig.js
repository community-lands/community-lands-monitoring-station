var settings = require('./settings');
settings.load()

const logger = require('./logger');

// Detect IP, set up defaults for configuration variables if not set
var os = require('os')
var ifaces = os.networkInterfaces()

logger.info('CONFIGURATION SETTINGS')
logger.info('----------------------')

process.env.port = settings.getPort() || '3000'
logger.info('Port number to use for the local web server')
logger.info('  port: ' + process.env.port)
process.env.data_directory = settings.getDataDirectory();
logger.info('Where your Monitoring folder lives')
logger.info('  directory: ' + process.env.data_directory)
process.env.station = settings.getStation() || 'DEMO'
logger.info('Name of this monitoring station')
logger.info('(and its station-specific folder under Monitoring)')
logger.info('  station: ' + process.env.station)
process.env.shared_secret = settings.getSharedSecret() || 'demo'
logger.info('The secret password for ODK users who connect to this station')
logger.info('(User ID should be a pseudonymous agent or device number you make up)')
logger.info('  shared_secret: ' + process.env.shared_secret)

process.env.community_lands_token = process.env.community_lands_token || 'test_token'
process.env.community_lands_server = process.env.community_lands_server || 'www.communitylands.org'
process.env.community_lands_port = process.env.community_lands_port || '80'

Object.keys(ifaces).forEach(function (ifname) {
  ifaces[ifname].forEach(function (iface) {
    if (iface.family !== 'IPv4' || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return
    }

    process.env.baseUrl = process.env.baseUrl || ('http://' + iface.address + ':' + process.env.port)
    logger.info('Base URL to set in ODK Connect and similar tools')
    logger.info('  baseUrl: ' + process.env.baseUrl)
    logger.info('Base URL for viewing maps -- put this in your browser')
    logger.info('  ' + process.env.baseUrl + '/mapfilter')
  })
})

process.env.baseUrl = process.env.baseUrl || ('http://' + settings.localhost + ':' + process.env.port)

logger.info('')
