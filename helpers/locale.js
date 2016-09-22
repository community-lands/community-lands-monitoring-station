const settings = require('./settings'),
  fs = require('fs'),
  path = require('path');

const DEFAULT_LOCALE = 'en';

const locale = init();

function init() {
  var l = {}

  var files = fs.readdirSync(path.join(path.dirname(__dirname), 'application', 'data'));
  for (var index in files) {
    var file = files[index];
    if (path.extname(file) == '.json') {
      var lang = path.basename(file, '.json');
      if ('version' != lang)
        l[lang] = require('../application/data/' + lang);
    }
  }

  return l;
}

function current() {
  return settings.getLocale() || DEFAULT_LOCALE;
}

function t(s, o, loc) {
  loc = loc || current();
  if (!s) return s;

  var path = s.split(".").reverse(),
      rep = locale[loc];

  while (rep !== undefined && path.length) rep = rep[path.pop()];

  if (rep !== undefined) {
    if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
    return rep;
  } else {
    if (loc !== DEFAULT_LOCALE) {
        missing(s)
        return t(s, o, DEFAULT_LOCALE);
    }

    if (o && 'default' in o) {
        return o['default'];
    }

    if (/\s/.exec(s) || !/\./.exec(s)) {
        return s
    }

    return toTitleCase(s.split(".").pop());
  }
}

function missing(s) {
  var missing = s.replace(/_/g, " ");
  //if (typeof console !== "undefined") console.error(missing);
  return missing;
}


function toTitleCase(s) {
  s = s || "";
  return s.replace(/_/g, " ").replace(/(^[a-z])|(\s[a-z])/g, function(s) { return s.toUpperCase(); });
}

module.exports = {
  t: t,
  current: current
}
