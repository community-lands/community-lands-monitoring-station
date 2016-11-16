/* eslint-env browser, jquery */
/* FIXME: This module still pollutes global namespace for backwards
   compatibility. */
const QueryString = (
  function () {
    var query_string = {}
    var query = window.location.search.substring(1)
    var vars = query.split('&')
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=')
      if (typeof query_string[pair[0]] === 'undefined') {
        query_string[pair[0]] = decodeURIComponent(pair[1])
      } else if (typeof query_string[pair[0]] === 'string') {
        var arr = [ query_string[pair[0]], decodeURIComponent(pair[1]) ]
        query_string[pair[0]] = arr
      } else {
        query_string[pair[0]].push(decodeURIComponent(pair[1]))
      }
    }
    return query_string
  }()
)

const locale = { _current: 'en' }

window.QueryString = QueryString

locale.current = function (_) {
  if (!arguments.length) return locale._current
  if (locale[_] !== undefined) locale._current = _
  else if (locale[_.split('-')[0]]) locale._current = _.split('-')[0]
  else if (locale[_.split('_')[0]]) locale._current = _.split('_')[0]
  return locale
}

locale.init = function () {
  var loc = null
  var windowLoc = window.location.pathname
  for (var prop in locale) {
    if (typeof prop === 'string' && prop.length === 2 &&
      locale.hasOwnProperty(prop)) {
      var token = '/' + prop
      if (windowLoc.startsWith(token + '/') || windowLoc === token) {
        loc = prop
        break
      }
    }
  }
  if (loc == null) {
    if (QueryString.locale !== undefined) {
      loc = QueryString.locale
    } else {
      var language = window.navigator.userLanguage || window.navigator.language
      loc = language
    }
  }
  if (loc == null || loc === '') {
    loc = 'en'
  }
  return locale.current(loc)
}

window.t_exists = function (s, loc) {
  loc = loc || locale._current
  if (!s) return false

  var path = s.split('.').reverse()
  var rep = locale[loc]

  while (rep !== undefined && path.length) rep = rep[path.pop()]

  return rep !== undefined
}
/* TODO: for backwards compatibility, we still define these functions
   in the window namespace ("window.foo = () => {}") -- but also expose them
   as exports so code going forward can use these features as a module.
   Eventually, take away the global usages. */
if (typeof exports !== 'undefined') { exports.t_exists = window.t_exists }

window.t = function (s, o, loc) {
  loc = loc || locale._current
  if (!s) return s

  var path = s.split('.').reverse()
  var rep = locale[loc]

  while (rep !== undefined && path.length) rep = rep[path.pop()]

  if (rep !== undefined) {
    if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k])
    return rep
  } else {
    var missing = () => {
      var m = s.replace(/_/g, ' ')
      return m
    }

    if (loc !== 'en') {
      missing()
      return window.t(s, o, 'en')
    }

    if (o && 'default' in o) {
      return o['default']
    }

    if (/\s/.exec(s) || !/\./.exec(s)) {
      return s
    }

    return toTitleCase(s.split('.').pop())
  }

  function toTitleCase (s) {
    s = s || ''
    return s.replace(/_/g, ' ').replace(/(^[a-z])|(\s[a-z])/g,
      function (s) {
        return s.toUpperCase()
      })
  }
}
if (typeof exports !== 'undefined') { exports.t = window.t }

locale.en = require('./data/en')
locale.es = require('./data/es')
locale.fr = require('./data/fr')
locale.init()

window.locale = locale
