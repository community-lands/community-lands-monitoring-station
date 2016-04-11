var storage = require('../helpers/community-storage.js')

var MAP = 'Monitoring.geojson';

/**
 * Converts form xml in `req.body` to json, adds meta data, attaches data to
 * `req.submission`
 */
function AppendGeoJSON (options) {
  return function (req, res, next) {
    if (req.submission && req.submission.geojson) {
      console.log("Received a GeoJSON submission");

      storage.getMap(MAP, function(err, data) {
        if (err) return next(err);
        var features = JSON.parse(data);
        features["features"].push(req.submission.json)
        storage.saveMap(MAP, JSON.stringify(features), function(err) {
          if (err) return next(err);
          next();
        });
      });
    } else
      next();
  }
}

module.exports = AppendGeoJSON
