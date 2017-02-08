var utils = require('community-lands-software-utils')

utils.Builder.configure({
  APP_BUNDLE_ID: 'org.community-lands.monitoring-station',
  APP_DISPLAY_NAME: 'Community Lands Monitoring Station'
})

if (process.argv.length >= 3)
  if (process.argv[2] == 'all') {
    utils.Builder.dist('mac');
    utils.Builder.dist('windows');
  } else
    utils.Builder.dist(process.argv[2] || 'mac');
else
  console.log("USAGE: Pass platform windows|mac");
