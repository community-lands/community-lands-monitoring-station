const fs = require('fs-extra'),
  path = require('path'),
  glob = require('glob'),
  klaw = require('klaw'),
  t2   = require('through2'),
  async = require('async')

const ServerEvents = require('../helpers/server-events')

const CACHE_FILE = '.metadata-cache.json'

var CACHED_JSON = null;

var settings = require('./settings.js')

var callbackQueue = {
  loading: false,
  queue: []
};

/**
 * Return a status of this tileset, whether it is in good condition
 * or has problems. If problems, return error codes in a list
 */
function inspect(cb) {
  callbackQueue.queue.push(cb);
  process.nextTick(doInspect);
}

function doInspect() {
  if (callbackQueue.loading)
    return;

  callbackQueue.loading = true;
  load(function(err, model) {
    if (model) {
      onInspectComplete(err, model)
    } else {
      var parallels = {};
      var dirs = settings.getTilesDirectories();
      for (var idx in dirs) {
        var directory = dirs[idx];
        parallels[directory] = inspectDirectory(directory);
      }

      async.parallel(parallels, function(err2, result) {
        if (err2)
          onInspectComplete(err2)
        else {
          var metadata = {}
          for (var directory in result) {
            for (var name in result[directory]) {
              var key = generateKey(path.join(directory, name));
              var value = result[directory][name];
              value['key'] = key;
              value['name'] = name;
              value['directory'] = directory;
              metadata[key] = value;
            }
          }
          save(metadata)
          onInspectComplete(null, metadata)
        }
      });
    }
  });
}

function inspectDirectory(directory) {
  return function(cb) {
    fs.readdir(directory, function(err, folders) {
      if (!err) {
        var parallels = {}
        for (var i = 0; i < folders.length; i++) {
          var dir = folders[i]
          if (dir.indexOf('.') == 0)
            continue;

          var stat = fs.statSync(path.join(directory, dir));
          if (!stat.isDirectory())
            parallels[dir] = processInvalid(directory, dir, false, 'files_in_tiles_folder')
          else if (isInt(dir))
            parallels[dir] = processInvalid(directory, dir, true, 'numeric_folder_in_tiles_folder')
          else
            parallels[dir] = processResult(directory, dir)
        }

        async.parallel(parallels, function(err2, metadata) {
          if (err2)
            cb(err)
          else {
            cb(null, metadata)
          }
        })
      } else if (err.code == 'ENOENT') { //Folder gone, no big deal
        cb(null, {})
      } else { //Unknown error
        cb(err)
      }
    });
  };
}

function generateKey(str) {
  var hash = 0, i = 0, len = str.length;
  while (i < len)
    hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
  return (hash + 2147483647) + 1;
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

function onInspectComplete(err, model) {
  var cb = null;
  while ((cb = callbackQueue.queue.shift()) != null)
    cb.call(this, err, model);
  callbackQueue.loading = false;
}

function getFormat(directory, tileSet, cb) {
  checkFormatWithKlaw(directory, tileSet, cb)
}

function checkFormatWithGlob(directory, tileSet, cb) {
  var callback = function(err, matches) {
    if (matches && matches.length == 1)
      cb({
        found: true,
        format: matches[0].format.substring(1),
        extension: matches[0].format,
        directory_count: matches[0].dirs
      })
    else
      cb({found: false })
  };

  var folder = path.join(directory, tileSet);
  var supported = ['jpg', 'jpeg', 'png']

  var status = null;
  var fmt = supported.join('|')
  var pattern = path.join('**', '*.+(' + supported.join('|') + ')')

  var opts = { matchBase: true, nodir: true, nocase: true, root: folder, silent: true }

  var g = new glob.Glob('/' + pattern, opts, callback);
  g.on('match', function(match) {
    var value = match.substring(folder.length + 1)
    found = { format: path.extname(value), dirs: value.split('/').length }
    g.abort(); //Only need one
  });
  g.on('abort', function() {
    callback(null, [ found ]);
  });
}

function checkFormatWithKlaw(directory, tileSet, cb) {
  var callback = function(err, matches) {
    if (matches && matches.length == 1)
      cb({
        found: true,
        format: matches[0].format.substring(1),
        extension: matches[0].format,
        directory_count: matches[0].dirs
      })
    else
      cb({found: false })
  };

  var folder = path.join(directory, tileSet);
  var supported = ['jpg', 'jpeg', 'png']

  var status = null;
  var found = null;

  var fmt = supported.join('|')
  var pattern = new RegExp('^.*\.(' + supported.join('|') + ')$', 'i')

  var dirFilter = t2.obj(function (item, enc, next) {
    var basename = path.basename(item.path)
    if (!item.stats.isDirectory() && !(basename[0] === '.')) this.push(item)
    next()
  })

  var regexFilter = t2.obj(function (item, enc, next) {
    var basename = path.basename(item.path)
    if (item.path.match(pattern)) this.push(item)
    next()
  })

  var finder = t2.obj(function (item, enc, next) {
    if (!found) {
      var value = item.path.substring(folder.length + 1)
      found =  {
        format: path.extname(item.path),
        dirs: value.split(path.sep).length
      }
      /**
       * FIXME: This does not stop immediately! Perhaps a
       * node upgrade to >8 will allow for this via close.
       * For now, this is the best we can do...
       */
      this.destroy()
    }
    next()
  })

  klaw(folder, { queueMethod: 'pop' })
    .pipe(dirFilter)
    .pipe(regexFilter)
    .pipe(finder)
    .on('close', function() {
      callback(null, [ found ])
    })
}

function processResult(directory, tileSet) {
  return function(cb) {
    getFormat(directory, tileSet, function(result) {
      var valid = result.found && result.directory_count == 3
      var obj = { directory: directory, valid: valid, eligible: true }
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

function processInvalid(directory, tileSet, isDir, error) {
  return function(cb) {
    cb(null, { directory: directory, valid: false, eligible: isDir, errors: [ error ] });
  };
}


function save(model) {
  CACHED_JSON = JSON.parse(JSON.stringify(model));
  fs.writeFileSync(getFileLocation(), JSON.stringify(model), 'utf8');
  ServerEvents.emit('tl_after_reinspect', CACHED_JSON);
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
          cb(err, CACHED_JSON = JSON.parse(text))
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
