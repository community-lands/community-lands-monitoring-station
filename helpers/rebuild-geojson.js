var settings = require('./settings')

var fs       = require('fs')
var path     = require('path')
var glob     = require('glob')
var storage  = require('./community-storage')

const MAP    = 'Monitoring.geojson'

/*
 * Callback here should expect err as first param, or null, 
 * and detail object as second param with individual success 
 * and failure counts for each imported geojson file, and a 
 * total.
 */
function run(cb) {
  storage.getMap(MAP, function(err_storage, data) {
    if (err_storage)
      cb({error: true, code: 'unknown', ex: err_storage})
    else {
      glob(path.join(settings.getSubmissionsDirectory(), "**/*.geojson"), function(err_glob, files) {
        if (err_glob)
          cb({error: true, code: 'unknown', ex: err_glob})
        else {
          var stats = {
            success: 0,
            failed: 0,
            total: files.length
          }
          var Features = []
          for (var i in files) {
            try {
              Features.push(JSON.parse(fs.readFileSync(files[i], 'utf8')))
              stats.success += 1
            } catch (err_ignore) {
              //Don't stop for one failed file, but don't accept file 
              //that can't be found or parsed. Maybe the file itself 
              //gets deleted here??
              stats.failed += 1
            }
          }
          var json = JSON.parse(data)
          json['features'] = Features
          storage.saveMap(MAP, json, function(err) {
            if (err)
              cb({error: true, code: 'unknown', ex: err})
            else
              cb(null, stats)
          });
        }
      });
    }
  });
}


module.exports = {

  generate: run

}
