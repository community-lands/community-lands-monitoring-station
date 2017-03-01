const fs = require('fs-extra'),
  path = require('path'),
  glob = require('glob'),
  async = require('async')

const CACHE_FILE = '.metadata-cache.json'

var CACHED_JSON = null;

var settings = require('./settings.js')

/**
 * Return a status of this tileset, whether it is in good condition 
 * or has problems. If problems, return error codes in a list
 */
function inspect(cb) {
  load(function(err, model) {
    if (model)
      cb(null, model)
    else {
      fs.readdir(settings.getTilesDirectory(), function(err, folders) {
        if (!err) {
          var parallels = {}
          for (var i = 0; i < folders.length; i++) {
            var dir = folders[i]
            if (dir.indexOf('.') == 0)
              continue;

            var stat = fs.statSync(path.join(settings.getTilesDirectory(), dir));
            if (!stat.isDirectory())
              parallels[dir] = processInvalid(dir, false, 'files_in_tiles_folder')
            else if (isInt(dir))
              parallels[dir] = processInvalid(dir, true, 'numeric_folder_in_tiles_folder')
            else
              parallels[dir] = processResult(dir)
          }

          async.parallel(parallels, function(err2, metadata) {
            if (err2)
              cb(err2)
            else {
              save(metadata);
              cb(null, metadata);
            }
          })
        } else
          cb(err)
      });
    }
  });
}

/**
 * Clear the cache and re-write the metadata file
 */
function reinspect(cb) {
  CACHED_JSON = null;
  fs.unlink(getFileLocation(), function() {
    inspect(cb);
  });
}

function getFormat(tileSet, cb) {
  var opts = { matchBase: true, nodir: true, nocase: true }
  var callback = function(err, matches) {
    if (matches.length == 1)
      cb({
        found: true,
        format: matches[0].format.substring(1),
        extension: matches[0].format,
        directory_count: matches[0].dirs
      })
    else
      cb({found: false })
  };

  var folder = path.join(settings.getTilesDirectory(), tileSet);
  var supported = ['jpg', 'jpeg', 'png']

  var status = null;
  var fmt = supported.join('|')
  var g = new glob.Glob(path.join(folder, '**', '*.+(' + supported.join('|') + ')'), opts, callback);
  g.on('match', function(match) {
    var value = match.substring(folder.length + 1)
    found = { format: path.extname(value), dirs: value.split(path.sep).length }
    g.abort(); //Only need one
  });
  g.on('abort', function() {
    callback(null, [ found ]);
  });

}

function processResult(tileSet) {
  return function(cb) {
    getFormat(tileSet, function(result) {
      var valid = result.found && result.directory_count == 3
      var obj = { valid: valid, eligible: true }
      if (valid) {
        obj.format = result.format;
        obj.extension = result.extension;
      } else {
        obj.errors = []
        if (!result.found)
          obj.errors.push('no_supported_files_found');
        if (result.directory_count && result.directory_count != 3)
          obj.errors.push('invalid_directory_structure');
      }
      cb(null, obj);
    });
  };
}

function processInvalid(tileSet, isDir, error) {
  return function(cb) {
    cb(null, { valid: false, eligible: isDir, errors: [ error ] });
  };
}


function save(model) {
  CACHED_JSON = JSON.parse(JSON.stringify(model));
  fs.writeFileSync(getFileLocation(), JSON.stringify(model), 'utf8');
}

function load(cb) {
  if (CACHED_JSON)
    cb(null, JSON.parse(JSON.stringify(CACHED_JSON)))
  else {
    fs.readFile(getFileLocation(), 'utf8', function(err, text) {
      if (err)
        cb(err)
      else {
        try {
          cb(err, CACHED_JSON = JSON.stringify(model))
        } catch (e) {
          cb(e);
        }
      }
    });
  }
}

function getFileLocation() {
  return path.join(settings.getGlobalMapsDirectory(), CACHE_FILE)
}

function isInt(value) {
  var check = parseInt(value)
  return (!isNaN(value) && (check | 0) === check)
}

module.exports = {
  get: inspect,
  refresh: reinspect
}
