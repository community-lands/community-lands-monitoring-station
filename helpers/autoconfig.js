// Required for Electron to find initial config
process.env.directory = process.env.directory || '.'
process.chdir(process.env.directory)

require('./settings').load()

// Detect IP, set up defaults for configuration variables if not set
var os = require('os')
var ifaces = os.networkInterfaces()

console.log('CONFIGURATION SETTINGS')
console.log('----------------------')

process.env.port = process.env.port || '3000'
console.log('Port number to use for the local web server')
console.log('  port: ' + process.env.port)
process.env.data_directory = process.env.data_directory || process.env.directory
console.log('Where your Monitoring folder lives')
console.log('  directory: ' + process.env.data_directory)
process.env.station = process.env.station || 'DEMO'
console.log('Name of this monitoring station')
console.log('(and its station-specific folder under Monitoring)')
console.log('  station: ' + process.env.station)
process.env.shared_secret = process.env.shared_secret || 'demo'
console.log('The secret password for ODK users who connect to this station')
console.log('(User ID should be a pseudonymous agent or device number you make up)')
console.log('  shared_secret: ' + process.env.shared_secret)

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
    console.log('Base URL to set in ODK Connect and similar tools')
    console.log('  baseUrl: ' + process.env.baseUrl)
    console.log('Base URL for viewing maps -- put this in your browser')
    console.log('  ' + process.env.baseUrl + '/mapfilter')
  })
})

console.log('')
