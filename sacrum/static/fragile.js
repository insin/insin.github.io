;(function() {
  var modules = {}
  function require(name) {
    return modules[name]
  }
  require.define = function(rs, fn) {
    var module = {}
      , exports = {}
    module.exports = exports
    fn(module, exports, require)
    if (Object.prototype.toString.call(rs) == '[object Array]') {
      for (var i = 0, l = rs.length; i < l; i++) {
        modules[rs[i]] = module.exports
      }
    }
    else {
      modules[rs] = module.exports
    }
  }

require.define(["./is","isomorph/is"], function(module, exports, require) {
var toString = Object.prototype.toString

// Type checks

function isArray(o) {
  return toString.call(o) == '[object Array]'
}

function isBoolean(o) {
  return toString.call(o) == '[object Boolean]'
}

function isDate(o) {
  return toString.call(o) == '[object Date]'
}

function isError(o) {
  return toString.call(o) == '[object Error]'
}

function isFunction(o) {
  return toString.call(o) == '[object Function]'
}

function isNumber(o) {
  return toString.call(o) == '[object Number]'
}

function isObject(o) {
  return toString.call(o) == '[object Object]'
}

function isRegExp(o) {
  return toString.call(o) == '[object RegExp]'
}

function isString(o) {
  return toString.call(o) == '[object String]'
}

// Content checks

function isEmpty(o) {
  for (var prop in o) {
    return false
  }
  return true
}

module.exports = {
  Array: isArray
, Boolean: isBoolean
, Date: isDate
, Empty: isEmpty
, Error: isError
, Function: isFunction
, NaN: isNaN
, Number: isNumber
, Object: isObject
, RegExp: isRegExp
, String: isString
}
})

require.define(["./array","isomorph/array"], function(module, exports, require) {
var is = require('./is')

var splice = Array.prototype.splice

/**
 * Flattens an Array in-place, replacing any Arrays it contains with their
 * contents, and flattening their contents in turn.
 */
function flatten(arr) {
  for (var i = 0, l = arr.length, current; i < l; i++) {
    current = arr[i]
    if (is.Array(current)) {
      // Make sure we loop to the Array's new length
      l += current.length - 1
      // Replace the current item with its contents
      splice.apply(arr, [i, 1].concat(current))
      // Stay on the current index so we continue looping at the first
      // element of the array we just spliced in or removed.
      i--
    }
  }
  // We flattened in-place, but return for chaining
  return arr
}

module.exports = {
  flatten: flatten
}
})

require.define(["./format","isomorph/format"], function(module, exports, require) {
var is = require('./is')
  , slice = Array.prototype.slice
  , formatRegExp = /%[%s]/g
  , formatObjRegExp = /({{?)(\w+)}/g

/**
 * Replaces %s placeholders in a string with positional arguments.
 */
function format(s) {
  return formatArr(s, slice.call(arguments, 1))
}

/**
 * Replaces %s placeholders in a string with array contents.
 */
function formatArr(s, a) {
  var i = 0
  return s.replace(formatRegExp, function(m) { return m == '%%' ? '%' : a[i++] })
}

/**
 * Replaces {propertyName} placeholders in a string with object properties.
 */
function formatObj(s, o) {
  return s.replace(formatObjRegExp, function(m, b, p) { return b.length == 2 ? m.slice(1) : o[p] })
}

var units = 'kMGTPEZY'
  , stripDecimals = /\.00$|0$/

/**
 * Formats bytes as a file size with the appropriately scaled units.
 */
function fileSize(bytes, threshold) {
  threshold = Math.min(threshold || 768, 1024)
  var i = -1
    , unit = 'bytes'
    , size = bytes
  while (size > threshold && i < units.length) {
    size = size / 1024
    i++
  }
  if (i > -1) {
    unit = units.charAt(i) + 'B'
  }
  return size.toFixed(2).replace(stripDecimals, '') + ' ' + unit
}

module.exports = {
  format: format
, formatArr: formatArr
, formatObj: formatObj
, fileSize: fileSize
}
})

require.define(["./func","isomorph/func"], function(module, exports, require) {
var slice = Array.prototype.slice

/**
 * Binds a function with a call context and (optionally) some partially applied
 * arguments.
 */
function bind(fn, ctx) {
  var partial = (arguments.length > 2 ? slice.call(arguments, 2) : null)
  var f = function() {
    var args = (partial ? partial.concat(slice.call(arguments)) : arguments)
    return fn.apply(ctx, args)
  }
  f.__func__ = fn
  f.__context__ = ctx
  return f
}

module.exports = {
  bind: bind
}
})

require.define(["./object","isomorph/object"], function(module, exports, require) {
/**
 * Callbound version of Object.prototype.hasOwnProperty(), ready to be called
 * with an object and property name.
 */
var hasOwn = (function() {
  var hasOwnProperty = Object.prototype.hasOwnProperty
  return function(obj, prop) { return hasOwnProperty.call(obj, prop) }
})()

/**
 * Copies own properties from any given objects to a destination object.
 */
function extend(dest) {
  for (var i = 1, l = arguments.length, src; i < l; i++) {
    src = arguments[i]
    if (src) {
      for (var prop in src) {
        if (hasOwn(src, prop)) {
          dest[prop] = src[prop]
        }
      }
    }
  }
  return dest
}

/**
 * Makes a constructor inherit another constructor's prototype without
 * having to actually use the constructor.
 */
function inherits(childConstructor, parentConstructor) {
  var F = function() {}
  F.prototype = parentConstructor.prototype
  childConstructor.prototype = new F()
  childConstructor.prototype.constructor = childConstructor
  return childConstructor
}

/**
 * Creates an Array of [property, value] pairs from an Object.
 */
function items(obj) {
  var items = []
  for (var prop in obj) {
    if (hasOwn(obj, prop)) {
      items.push([prop, obj[prop]])
    }
  }
  return items
}

/**
 * Creates an Object from an Array of [property, value] pairs.
 */
function fromItems(items) {
  var obj = {}
  for (var i = 0, l = items.length, item; i < l; i++) {
    item = items[i]
    obj[item[0]] = item[1]
  }
  return obj
}

/**
 * Creates a lookup Object from an Array, coercing each item to a String.
 */
function lookup(arr) {
  var obj = {}
  for (var i = 0, l = arr.length; i < l; i++) {
    obj[''+arr[i]] = true
  }
  return obj
}

/**
 * If the given object has the given property, returns its value, otherwise
 * returns the given default value.
 */
function get(obj, prop, defaultValue) {
  return (hasOwn(obj, prop) ? obj[prop] : defaultValue)
}

module.exports = {
  hasOwn: hasOwn
, extend: extend
, inherits: inherits
, items: items
, fromItems: fromItems
, lookup: lookup
, get: get
}
})

require.define(["./re","isomorph/re"], function(module, exports, require) {
var is = require('./is')

/**
 * Finds all matches againt a RegExp, returning captured groups if present.
 */
function findAll(re, str, flags) {
  if (!is.RegExp(re)) {
    re = new RegExp(re, flags)
  }
  var match = null
    , matches = []
  while ((match = re.exec(str)) !== null) {
    switch (match.length) {
      case 1:
        matches.push(match[0])
        break
      case 2:
        matches.push(match[1])
        break
      default:
        matches.push(match.slice(1))
    }
    if (!re.global) {
      break
    }
  }
  return matches
}

module.exports = {
  findAll: findAll
}
})

require.define(["./querystring","isomorph/querystring"], function(module, exports, require) {
var is = require('./is')

/**
 * Creates an Object from a query string, providing values for names which are
 * present more than once as an Array.
 */
function parse(query) {
  var obj = {}
  if (query.length < 2) {
    return obj
  }
  var params = query.substring(1).split('&')
  for (var i = 0, l = params.length; i < l; i++) {
    var parts = params[i].split('=')
      , name = parts[0]
      , value = decodeURIComponent(parts[1])
    if (obj.hasOwnProperty(name)) {
      if (is.Array(obj[name])) {
        obj[name].push(value)
      }
      else {
        obj[name] = [obj[name], value]
      }
    }
    else {
      obj[name] = value
    }
  }
  return obj
}

/**
 * Creates a query string from an Object, expecting names with multiple values
 * to be specified as an Array.
 */
function stringify(obj) {
  var params = []
  for (var name in obj) {
    if (is.Array(obj[name])) {
      for (var a = obj[name], i = 0, l = a.length; i < l; i++) {
        params.push(name + '=' + encodeURIComponent(a[i]))
      }
    }
    else {
      params.push(name + '=' + encodeURIComponent(obj[name]))
    }
  }
  return params.join('&')
}

module.exports = {
  parse: parse
, stringify: stringify
}
})

require.define(["./copy","isomorph/copy"], function(module, exports, require) {
var is = require('./is')

/* This file is part of OWL JavaScript Utilities.

OWL JavaScript Utilities is free software: you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public License
as published by the Free Software Foundation, either version 3 of
the License, or (at your option) any later version.

OWL JavaScript Utilities is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with OWL JavaScript Utilities.  If not, see
<http://www.gnu.org/licenses/>.
*/

// Re-usable constructor function used by clone()
function Clone() {}

// Clone objects, skip other types
function clone(target) {
  if (typeof target == 'object') {
    Clone.prototype = target
    return new Clone()
  }
  else {
    return target
  }
}

// Shallow Copy
function copy(target) {
  if (typeof target != 'object') {
    // Non-objects have value semantics, so target is already a copy
    return target
  }
  else {
    var value = target.valueOf()
    if (target != value) {
      // the object is a standard object wrapper for a native type, say String.
      // we can make a copy by instantiating a new object around the value.
      return new target.constructor(value)
    }
    else {
      // We have a normal object. If possible, we'll clone the original's
      // prototype (not the original) to get an empty object with the same
      // prototype chain as the original. If just copy the instance properties.
      // Otherwise, we have to copy the whole thing, property-by-property.
      if (target instanceof target.constructor && target.constructor !== Object) {
        var c = clone(target.constructor.prototype)

        // Give the copy all the instance properties of target. It has the same
        // prototype as target, so inherited properties are already there.
        for (var property in target) {
          if (target.hasOwnProperty(property)) {
            c[property] = target[property]
          }
        }
      }
      else {
        var c = {}
        for (var property in target) {
          c[property] = target[property]
        }
      }

      return c
    }
  }
}

// Deep Copy
var deepCopiers = []

function DeepCopier(config) {
  for (var key in config) {
    this[key] = config[key]
  }
}

DeepCopier.prototype = {
  constructor: DeepCopier

  // Determines if this DeepCopier can handle the given object.
, canCopy: function(source) { return false }

  // Starts the deep copying process by creating the copy object. You can
  // initialize any properties you want, but you can't call recursively into the
  // DeepCopyAlgorithm.
, create: function(source) {}

  // Completes the deep copy of the source object by populating any properties
  // that need to be recursively deep copied. You can do this by using the
  // provided deepCopyAlgorithm instance's deepCopy() method. This will handle
  // cyclic references for objects already deepCopied, including the source
  // object itself. The "result" passed in is the object returned from create().
, populate: function(deepCopyAlgorithm, source, result) {}
}

function DeepCopyAlgorithm() {
  // copiedObjects keeps track of objects already copied by this deepCopy
  // operation, so we can correctly handle cyclic references.
  this.copiedObjects = []
  var thisPass = this
  this.recursiveDeepCopy = function(source) {
    return thisPass.deepCopy(source)
  }
  this.depth = 0
}
DeepCopyAlgorithm.prototype = {
  constructor: DeepCopyAlgorithm

, maxDepth: 256

  // Add an object to the cache.  No attempt is made to filter duplicates; we
  // always check getCachedResult() before calling it.
, cacheResult: function(source, result) {
    this.copiedObjects.push([source, result])
  }

  // Returns the cached copy of a given object, or undefined if it's an object
  // we haven't seen before.
, getCachedResult: function(source) {
    var copiedObjects = this.copiedObjects
    var length = copiedObjects.length
    for ( var i=0; i<length; i++ ) {
      if ( copiedObjects[i][0] === source ) {
        return copiedObjects[i][1]
      }
    }
    return undefined
  }

  // deepCopy handles the simple cases itself: non-objects and object's we've
  // seen before. For complex cases, it first identifies an appropriate
  // DeepCopier, then calls applyDeepCopier() to delegate the details of copying
  // the object to that DeepCopier.
, deepCopy: function(source) {
    // null is a special case: it's the only value of type 'object' without
    // properties.
    if (source === null) return null

    // All non-objects use value semantics and don't need explict copying
    if (typeof source != 'object') return source

    var cachedResult = this.getCachedResult(source)

    // We've already seen this object during this deep copy operation so can
    // immediately return the result. This preserves the cyclic reference
    // structure and protects us from infinite recursion.
    if (cachedResult) return cachedResult

    // Objects may need special handling depending on their class. There is a
    // class of handlers call "DeepCopiers" that know how to copy certain
    // objects. There is also a final, generic deep copier that can handle any
    // object.
    for (var i=0; i<deepCopiers.length; i++) {
      var deepCopier = deepCopiers[i]
      if (deepCopier.canCopy(source)) {
        return this.applyDeepCopier(deepCopier, source)
      }
    }
    // The generic copier can handle anything, so we should never reach this
    // line.
    throw new Error('no DeepCopier is able to copy ' + source)
  }

  // Once we've identified which DeepCopier to use, we need to call it in a
  // very particular order: create, cache, populate.This is the key to detecting
  // cycles. We also keep track of recursion depth when calling the potentially
  // recursive populate(): this is a fail-fast to prevent an infinite loop from
  // consuming all available memory and crashing or slowing down the browser.
, applyDeepCopier: function(deepCopier, source) {
    // Start by creating a stub object that represents the copy.
    var result = deepCopier.create(source)

    // We now know the deep copy of source should always be result, so if we
    // encounter source again during this deep copy we can immediately use
    // result instead of descending into it recursively.
    this.cacheResult(source, result)

    // Only DeepCopier.populate() can recursively deep copy.  o, to keep track
    // of recursion depth, we increment this shared counter before calling it,
    // and decrement it afterwards.
    this.depth++
    if (this.depth > this.maxDepth) {
      throw new Error("Exceeded max recursion depth in deep copy.")
    }

    // It's now safe to let the deepCopier recursively deep copy its properties
    deepCopier.populate(this.recursiveDeepCopy, source, result)

    this.depth--

    return result
  }
}

// Entry point for deep copy.
//   source is the object to be deep copied.
//   maxDepth is an optional recursion limit. Defaults to 256.
function deepCopy(source, maxDepth) {
  var deepCopyAlgorithm = new DeepCopyAlgorithm()
  if (maxDepth) {
    deepCopyAlgorithm.maxDepth = maxDepth
  }
  return deepCopyAlgorithm.deepCopy(source)
}

// Publicly expose the DeepCopier class
deepCopy.DeepCopier = DeepCopier

// Publicly expose the list of deepCopiers
deepCopy.deepCopiers = deepCopiers

// Make deepCopy() extensible by allowing others to register their own custom
// DeepCopiers.
deepCopy.register = function(deepCopier) {
  if (!(deepCopier instanceof DeepCopier)) {
    deepCopier = new DeepCopier(deepCopier)
  }
  deepCopiers.unshift(deepCopier)
}

// Generic Object copier
// The ultimate fallback DeepCopier, which tries to handle the generic case.
// This should work for base Objects and many user-defined classes.
deepCopy.register({
  canCopy: function(source) { return true }

, create: function(source) {
    if (source instanceof source.constructor) {
      return clone(source.constructor.prototype)
    }
    else {
      return {}
    }
  }

, populate: function(deepCopy, source, result) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        result[key] = deepCopy(source[key])
      }
    }
    return result
  }
})

// Array copier
deepCopy.register({
  canCopy: function(source) {
    return is.Array(source)
  }

, create: function(source) {
    return new source.constructor()
  }

, populate: function(deepCopy, source, result) {
    for (var i = 0; i < source.length; i++) {
      result.push(deepCopy(source[i]))
    }
    return result
  }
})

// Date copier
deepCopy.register({
  canCopy: function(source) {
    return is.Date(source)
  }

, create: function(source) {
    return new Date(source)
  }
})

// RegExp copier
deepCopy.register({
  canCopy: function(source) {
    return is.RegExp(source)
  }

, create: function(source) {
    return source
  }
})

module.exports = {
  DeepCopyAlgorithm: DeepCopyAlgorithm
, copy: copy
, clone: clone
, deepCopy: deepCopy
}
})

require.define(["./time","isomorph/time"], function(module, exports, require) {
var is = require('./is')

/**
 * Pads a number with a leading zero if necessary.
 */
function pad(number) {
  return (number < 10 ? '0' + number : number)
}

/**
 * Returns the index of item in list, or -1 if it's not in list.
 */
function indexOf(item, list) {
  for (var i = 0, l = list.length; i < l; i++) {
    if (item === list[i]) {
      return i
    }
  }
  return -1
}

/**
 * Maps directive codes to regular expression patterns which will capture the
 * data the directive corresponds to, or in the case of locale-dependent
 * directives, a function which takes a locale and generates a regular
 * expression pattern.
 */
var parserDirectives = {
  // Locale's abbreviated month name
  'b': function(l) { return '(' + l.b.join('|') + ')' }
  // Locale's full month name
, 'B': function(l) { return '(' + l.B.join('|') + ')' }
  // Locale's equivalent of either AM or PM.
, 'p': function(l) { return '(' + l.AM + '|' + l.PM + ')' }
, 'd': '(\\d\\d?)' // Day of the month as a decimal number [01,31]
, 'H': '(\\d\\d?)' // Hour (24-hour clock) as a decimal number [00,23]
, 'I': '(\\d\\d?)' // Hour (12-hour clock) as a decimal number [01,12]
, 'm': '(\\d\\d?)' // Month as a decimal number [01,12]
, 'M': '(\\d\\d?)' // Minute as a decimal number [00,59]
, 'S': '(\\d\\d?)' // Second as a decimal number [00,59]
, 'y': '(\\d\\d?)' // Year without century as a decimal number [00,99]
, 'Y': '(\\d{4})'  // Year with century as a decimal number
, '%': '%'         // A literal '%' character
}

/**
 * Maps directive codes to functions which take the date to be formatted and
 * locale details (if required), returning an appropriate formatted value.
 */
var formatterDirectives = {
  'a': function(d, l) { return l.a[d.getDay()] }
, 'A': function(d, l) { return l.A[d.getDay()] }
, 'b': function(d, l) { return l.b[d.getMonth()] }
, 'B': function(d, l) { return l.B[d.getMonth()] }
, 'd': function(d) { return pad(d.getDate(), 2) }
, 'H': function(d) { return pad(d.getHours(), 2) }
, 'M': function(d) { return pad(d.getMinutes(), 2) }
, 'm': function(d) { return pad(d.getMonth() + 1, 2) }
, 'S': function(d) { return pad(d.getSeconds(), 2) }
, 'w': function(d) { return d.getDay() }
, 'Y': function(d) { return d.getFullYear() }
, '%': function(d) { return '%' }
}

/** Test for hanging percentage symbols. */
var strftimeFormatCheck = /[^%]%$/

/**
 * A partial implementation of strptime which parses time details from a string,
 * based on a format string.
 * @param {String} format
 * @param {Object} locale
 */
function TimeParser(format, locale) {
  this.format = format
  this.locale = locale
  var cachedPattern = TimeParser._cache[locale.name + '|' + format]
  if (cachedPattern !== undefined) {
    this.re = cachedPattern[0]
    this.matchOrder = cachedPattern[1]
  }
  else {
    this.compilePattern()
  }
}

/**
 * Caches RegExps and match orders generated per locale/format string combo.
 */
TimeParser._cache = {}

TimeParser.prototype.compilePattern = function() {
  // Normalise whitespace before further processing
  var format = this.format.split(/(?:\s|\t|\n)+/).join(' ')
    , pattern = []
    , matchOrder = []
    , c
    , directive

  for (var i = 0, l = format.length; i < l; i++) {
    c = format.charAt(i)
    if (c != '%') {
      if (c === ' ') {
        pattern.push(' +')
      }
      else {
        pattern.push(c)
      }
      continue
    }

    if (i == l - 1) {
      throw new Error('strptime format ends with raw %')
    }

    c = format.charAt(++i)
    directive = parserDirectives[c]
    if (directive === undefined) {
      throw new Error('strptime format contains an unknown directive: %' + c)
    }
    else if (is.Function(directive)) {
      pattern.push(directive(this.locale))
    }
    else {
      pattern.push(directive)
    }

    if (c != '%') {
       matchOrder.push(c)
    }
  }

  this.re = new RegExp('^' + pattern.join('') + '$')
  this.matchOrder = matchOrder
  TimeParser._cache[this.locale.name + '|' + this.format] = [this.re, matchOrder]
}

/**
 * Attempts to extract date and time details from the given input.
 * @param {string} input
 * @return {Array.<number>}
 */
TimeParser.prototype.parse = function(input) {
  var matches = this.re.exec(input)
  if (matches === null) {
    throw new Error('Time data did not match format: data=' + input +
                    ', format=' + this.format)
  }

    // Default values for when more accurate values cannot be inferred
  var time = [1900, 1, 1, 0, 0, 0]
    // Matched time data, keyed by directive code
    , data = {}

  for (var i = 1, l = matches.length; i < l; i++) {
    data[this.matchOrder[i - 1]] = matches[i]
  }

  // Extract year
  if (data.hasOwnProperty('Y')) {
    time[0] = parseInt(data.Y, 10)
  }
  else if (data.hasOwnProperty('y')) {
    var year = parseInt(data.y, 10)
    if (year < 68) {
        year = 2000 + year
    }
    else if (year < 100) {
        year = 1900 + year
    }
    time[0] = year
  }

  // Extract month
  if (data.hasOwnProperty('m')) {
    var month = parseInt(data.m, 10)
    if (month < 1 || month > 12) {
      throw new Error('Month is out of range: ' + month)
    }
    time[1] = month
  }
  else if (data.hasOwnProperty('B')) {
    time[1] = indexOf(data.B, this.locale.B) + 1
  }
  else if (data.hasOwnProperty('b')) {
    time[1] = indexOf(data.b, this.locale.b) + 1
  }

  // Extract day of month
  if (data.hasOwnProperty('d')) {
    var day = parseInt(data.d, 10)
    if (day < 1 || day > 31) {
      throw new Error('Day is out of range: ' + day)
    }
    time[2] = day
  }

  // Extract hour
  if (data.hasOwnProperty('H')) {
    var hour = parseInt(data.H, 10)
    if (hour > 23) {
      throw new Error('Hour is out of range: ' + hour)
    }
    time[3] = hour
  }
  else if (data.hasOwnProperty('I')) {
    var hour = parseInt(data.I, 10)
    if (hour < 1 || hour > 12) {
      throw new Error('Hour is out of range: ' + hour)
    }

    // If we don't get any more information, we'll assume this time is
    // a.m. - 12 a.m. is midnight.
    if (hour == 12) {
        hour = 0
    }

    time[3] = hour

    if (data.hasOwnProperty('p')) {
      if (data.p == this.locale.PM) {
        // We've already handled the midnight special case, so it's
        // safe to bump the time by 12 hours without further checks.
        time[3] = time[3] + 12
      }
    }
  }

  // Extract minute
  if (data.hasOwnProperty('M')) {
    var minute = parseInt(data.M, 10)
    if (minute > 59) {
        throw new Error('Minute is out of range: ' + minute)
    }
    time[4] = minute
  }

  // Extract seconds
  if (data.hasOwnProperty('S')) {
    var second = parseInt(data.S, 10)
    if (second > 59) {
      throw new Error('Second is out of range: ' + second)
    }
    time[5] = second
  }

  // Validate day of month
  var day = time[2], month = time[1], year = time[0]
  if (((month == 4 || month == 6 || month == 9 || month == 11) &&
      day > 30) ||
      (month == 2 && day > ((year % 4 == 0 && year % 100 != 0 ||
                             year % 400 == 0) ? 29 : 28))) {
    throw new Error('Day is out of range: ' + day)
  }

  return time
}

var time  = {
  /** Default locale name. */
  defaultLocale: 'en'

  /** Locale details. */
, locales: {
    en: {
      name: 'en'
    , a: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    , A: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
          'Friday', 'Saturday']
    , AM: 'AM'
    , b: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
          'Oct', 'Nov', 'Dec']
    , B: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
          'August', 'September', 'October', 'November', 'December']
    , PM: 'PM'
    }
  }
}

/**
 * Retrieves the locale with the given code.
 * @param {string} code
 * @return {Object}
 */
var getLocale = time.getLocale = function(code) {
  if (code) {
    if (time.locales.hasOwnProperty(code)) {
      return time.locales[code]
    }
    else if (code.length > 2) {
      // If we appear to have more than a language code, try the
      // language code on its own.
      var languageCode = code.substring(0, 2)
      if (time.locales.hasOwnProperty(languageCode)) {
        return time.locales[languageCode]
      }
    }
  }
  return time.locales[time.defaultLocale]
}

/**
 * Parses time details from a string, based on a format string.
 * @param {string} input
 * @param {string} format
 * @param {string=} locale
 * @return {Array.<number>}
 */
var strptime = time.strptime = function(input, format, locale) {
  return new TimeParser(format, getLocale(locale)).parse(input)
}

/**
 * Convenience wrapper around time.strptime which returns a JavaScript Date.
 * @param {string} input
 * @param {string} format
 * @param {string=} locale
 * @return {date}
 */
time.strpdate = function(input, format, locale) {
  var t = strptime(input, format, locale)
  return new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5])
}

/**
 * A partial implementation of <code>strftime</code>, which formats a date
 * according to a format string. An Error will be thrown if an invalid
 * format string is given.
 * @param {date} date
 * @param {string} format
 * @param {string=} locale
 * @return {string}
 */
time.strftime = function(date, format, locale) {
  if (strftimeFormatCheck.test(format)) {
    throw new Error('strftime format ends with raw %')
  }
  locale = getLocale(locale)
  return format.replace(/(%.)/g, function(s, f) {
    var code = f.charAt(1)
    if (typeof formatterDirectives[code] == 'undefined') {
      throw new Error('strftime format contains an unknown directive: ' + f)
    }
    return formatterDirectives[code](date, locale)
  })
}

module.exports = time
})

require.define(["./url","isomorph/url"], function(module, exports, require) {
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
  var o = parseUri.options
    , m = o.parser[o.strictMode ? "strict" : "loose"].exec(str)
    , uri = {}
    , i = 14

  while (i--) uri[o.key[i]] = m[i] || ""

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2
  })

  return uri
}

parseUri.options = {
  strictMode: false
, key: ['source','protocol','authority','userInfo','user','password','host','port','relative','path','directory','file','query','anchor']
, q: {
    name: 'queryKey'
  , parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  }
, parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
  , loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
}

// makeURI 1.2.2 - create a URI from an object specification; compatible with
// parseURI (http://blog.stevenlevithan.com/archives/parseuri)
// (c) Niall Smart <niallsmart.com>
// MIT License
function makeUri(u) {
  var uri = ''
  if (u.protocol) {
    uri += u.protocol + '://'
  }
  if (u.user) {
    uri += u.user
  }
  if (u.password) {
    uri += ':' + u.password
  }
  if (u.user || u.password) {
    uri += '@'
  }
  if (u.host) {
    uri += u.host
  }
  if (u.port) {
    uri += ':' + u.port
  }
  if (u.path) {
    uri += u.path
  }
  var qk = u.queryKey
  var qs = []
  for (var k in qk) {
    if (!qk.hasOwnProperty(k)) {
      continue
    }
    var v = encodeURIComponent(qk[k])
    k = encodeURIComponent(k)
    if (v) {
      qs.push(k + '=' + v)
    }
    else {
      qs.push(k)
    }
  }
  if (qs.length > 0) {
    uri += '?' + qs.join('&')
  }
  if (u.anchor) {
    uri += '#' + u.anchor
  }
  return uri
}

module.exports = {
  parseUri: parseUri
, makeUri: makeUri
}
})

require.define("isomorph", function(module, exports, require) {
module.exports = {
  is: require('./is')
, array: require('./array')
, func: require('./func')
, object: require('./object')
, format: require('./format')
, re: require('./re')
, querystring: require('./querystring')
, copy: require('./copy')
, time: require('./time')
, url: require('./url')
}})

require.define("Concur", function(module, exports, require) {
var is = require('isomorph/is')
  , object = require('isomorph/object')

/**
 * Mixes in properties from one object to another. If the source object is a
 * Function, its prototype is mixed in instead.
 */
function mixin(dest, src) {
  if (is.Function(src)) {
    object.extend(dest, src.prototype)
  }
  else {
    object.extend(dest, src)
  }
}

/**
 * Applies mixins specified as a __mixin__ property on the given properties
 * object, returning an object containing the mixed in properties.
 */
function applyMixins(properties) {
  var mixins = properties.__mixin__
  if (!is.Array(mixins)) {
    mixins = [mixins]
  }
  var mixedProperties = {}
  for (var i = 0, l = mixins.length; i < l; i++) {
    mixin(mixedProperties, mixins[i])
  }
  delete properties.__mixin__
  return object.extend(mixedProperties, properties)
}

/**
 * Inherits another constructor's prototype and sets its prototype and
 * constructor properties in one fell swoop.
 *
 * If a child constructor is not provided via prototypeProps.constructor,
 * a new constructor will be created.
 */
function inheritFrom(parentConstructor, prototypeProps, constructorProps) {
  // Get or create a child constructor
  var childConstructor
  if (prototypeProps && object.hasOwn(prototypeProps, 'constructor')) {
    childConstructor = prototypeProps.constructor
  }
  else {
    childConstructor = function() {
      parentConstructor.apply(this, arguments)
    }
  }

  // Base constructors should only have the properties they're defined with
  if (parentConstructor !== Concur) {
    // Inherit the parent's prototype
    object.inherits(childConstructor, parentConstructor)
    childConstructor.__super__ = parentConstructor.prototype
  }

  // Add prototype properties, if given
  if (prototypeProps) {
    object.extend(childConstructor.prototype, prototypeProps)
  }

  // Add constructor properties, if given
  if (constructorProps) {
    object.extend(childConstructor, constructorProps)
  }

  return childConstructor
}

/**
 * Namespace and dummy constructor for initial extension.
 */
var Concur = module.exports = function() {}

/**
 * Creates or uses a child constructor to inherit from the the call
 * context, which is expected to be a constructor.
 */
Concur.extend = function(prototypeProps, constructorProps) {
  // If the constructor being inherited from has a __meta__ function somewhere
  // in its prototype chain, call it to customise prototype and constructor
  // properties before they're used to set up the new constructor's prototype.
  if (typeof this.prototype.__meta__ != 'undefined') {
    // Property objects must always exist so properties can be added to
    // and removed from them.
    prototypeProps = prototypeProps || {}
    constructorProps = constructorProps || {}
    this.prototype.__meta__(prototypeProps, constructorProps)
  }

  // If any mixins are specified, mix them into the property objects
  if (prototypeProps && object.hasOwn(prototypeProps, '__mixin__')) {
    prototypeProps = applyMixins(prototypeProps)
  }
  if (constructorProps && object.hasOwn(constructorProps, '__mixin__')) {
    constructorProps = applyMixins(constructorProps)
  }

  // Set up and return the new child constructor
  var childConstructor = inheritFrom(this,
                                     prototypeProps,
                                     constructorProps)
  childConstructor.extend = this.extend
  return childConstructor
}
})

require.define("urlresolve", function(module, exports, require) {
var is = require('isomorph/is')
  , func = require('isomorph/func')
  , format = require('isomorph/format')
  , re = require('isomorph/re')

var slice = Array.prototype.slice

/**
 * Thrown when a URLResolver fails to resolve a URL against known URL patterns.
 */
function Resolver404(path, tried) {
  this.path = path
  this.tried = tried || null
}
Resolver404.prototype.toString = function() {
  return 'Resolver404 on ' + this.path
}

/**
 * Thrown when a URL can't be reverse matched.
 */
function NoReverseMatch(message) {
  this.message = message
}
NoReverseMatch.prototype.toString = function() {
  return 'NoReverseMatch: ' + this.message
}

/**
 * Holds details of a successful URL resolution.
 */
function ResolverMatch(func, args, urlName) {
  this.func = func
  this.args = args
  this.urlName = urlName
}

var namedParamRE = /:([\w\d]+)/g
  , escapeRE = /[-[\]{}()*+?.,\\^$|#\s]/g

/**
 * Converts a url pattern to source for a RegExp which matches the specified URL
 * fragment, capturing any named parameters.
 *
 * Also stores the names of parameters in the call context object for reference
 * when reversing.
 */
function patternToRE(pattern) {
  pattern = pattern.replace(escapeRE, '\\$&')
  // Store the names of any named parameters
  this.namedParams = re.findAll(namedParamRE, pattern)
  if (this.namedParams.length) {
    // The pattern has some named params, so replace them with appropriate
    // capturing groups.
    pattern = pattern.replace(namedParamRE, '([^\/]*)')
  }
  return pattern
}

/**
 * Associates a URL pattern with a callback function, generating a RegExp which
 * will match the pattern and capture named parameters.
 */
function URLPattern(pattern, callback, name) {
  this.pattern = pattern
  // Only full matches are accepted when resolving, so anchor to start and end
  // of the input.
  this.regex = new RegExp('^' + patternToRE.call(this, pattern) + '$')

  if (is.Function(callback)) {
    this.callback = callback
    this.callbackName = null
  }
  else {
    this.callback = null
    this.callbackName = callback
  }

  this.name = name
}

URLPattern.prototype.toString = function() {
  return format.formatObj('[object URLPattern] <{name} "{pattern}">', this)
}

/**
 * Retrieves a named view function for this pattern from a context object,
 * binding it to the object.
 */
URLPattern.prototype.addContext = function(context) {
  if (!context || !this.callbackName) {
    return
  }
  this.callback = func.bind(context[this.callbackName], context)
}

/**
 * Resolves a URL fragment against this pattern, returning matched details if
 * resolution succeeds.
 */
URLPattern.prototype.resolve = function(path) {
  var match = this.regex.exec(path)
  if (match) {
    return new ResolverMatch(this.callback, match.slice(1), this.name)
  }
}

/**
 * Resolves a list of URL patterns when a root URL pattern is matched.
 */
function URLResolver(pattern, urlPatterns) {
  this.pattern = pattern
  // Resolvers start by matching a prefix, so anchor to start of the input
  this.regex = new RegExp('^' + patternToRE.call(this, pattern))
  this.urlPatterns = urlPatterns || []
  this._reverseLookups = null
}

URLResolver.prototype.toString = function() {
  return format.formatObj('[object URLResolver] <{pattern}>', this)
}

/**
 * Populates expected argument and pattern information for use when reverse
 * URL lookups are requested.
 */
URLResolver.prototype._populate = function() {
  var lookups = {}
    , urlPattern
    , pattern
  for (var i = this.urlPatterns.length - 1; i >= 0; i--) {
    urlPattern = this.urlPatterns[i]
    pattern = urlPattern.pattern
    if (urlPattern instanceof URLResolver) {
      var reverseLookups = urlPattern.getReverseLookups()
      for (var name in reverseLookups) {
        var revLookup = reverseLookups[name]
          , revLookupParams = revLookup[0]
          , revLookupPattern = revLookup[1]
        lookups[name] = [urlPattern.namedParams.concat(revLookupParams),
                         pattern + revLookupPattern]
      }
    }
    else if (urlPattern.name !== null) {
      lookups[urlPattern.name] = [urlPattern.namedParams, pattern]
    }
  }
  this._reverseLookups = lookups
}

/**
 * Getter for reverse lookup information, which populates the first time it's
 * called.
 */
URLResolver.prototype.getReverseLookups = function() {
  if (this._reverseLookups === null) {
    this._populate()
  }
  return this._reverseLookups
}

/**
 * Resolves a view function to handle the given path.
 */
URLResolver.prototype.resolve = function(path) {
  var tried = []
    , match = this.regex.exec(path)
  if (match) {
    var args = match.slice(1)
      , subPath = path.substring(match[0].length)
      , urlPattern
      , subMatch
    for (var i = 0, l = this.urlPatterns.length; i < l; i++) {
      urlPattern = this.urlPatterns[i]
      try {
        subMatch = urlPattern.resolve(subPath)
        if (subMatch) {
          // Add any arguments which were captured by this instance's own path
          // RegExp.
          subMatch.args = args.concat(subMatch.args)
          return subMatch
        }
        tried.push([urlPattern])
      }
      catch (e) {
        if (!(e instanceof Resolver404)) throw e
        var subTried = e.tried
        if (subTried !== null) {
          for (var j = 0, k = subTried.length; j < k; j++) {
            tried.push([urlPattern, subTried[j]])
          }
        }
        else {
          tried.push([urlPattern])
        }
      }
    }
    throw new Resolver404(subPath, tried)
  }
  throw new Resolver404(path)
}

/**
 * Performs a reverse lookup for a named URL pattern with given arguments,
 * constructing a URL fragment if successful.
 */
URLResolver.prototype.reverse = function(name, args) {
  args = args || []
  var lookup = this.getReverseLookups()[name]
  if (lookup) {
    var expectedArgs = lookup[0]
      , pattern = lookup[1]
    if (args.length != expectedArgs.length) {
      throw new NoReverseMatch(format.format(
          'URL pattern named "%s" expects %s argument%s, but got %s: [%s]'
        , name
        , expectedArgs.length
        , expectedArgs.length == 1 ? '' : 's'
        , args.length
        , args.join(', ')
        ))
    }
    return format.formatArr(pattern.replace(namedParamRE, '%s'), args)
  }
  throw new NoReverseMatch(format.format(
      'Reverse for "%s" with arguments [%s] not found.'
    , name
    , args.join(', ')
    ))
}


// -------------------------------------------------------------- Public API ---

/**
 * Creates a list of URL patterns, which can be specified using the url function
 * or an array with the same contents as that function's arguments.
 *
 * View names can be specified as strings to be looked up from a context object
 * (usually a Views instance), which should be passed as the first argument,
 * otherwise, it should be null.
 */
function patterns(context) {
  var args = slice.call(arguments, 1)
    , patternList = []
    , pattern
  for (var i = 0, l = args.length; i < l; i++) {
    pattern = args[i]
    if (is.Array(pattern)) {
      pattern = url.apply(null, pattern)
      pattern.addContext(context)
    }
    else if (pattern instanceof URLPattern) {
      pattern.addContext(context)
    }
    patternList.push(pattern)
  }
  return patternList
}

/**
 * Creates a URL pattern or roots a list of patterns to the given pattern if
 * a list of views.
 */
function url(pattern, view, name) {
  if (is.Array(view)) {
    return new URLResolver(pattern, view)
  }
  else {
    if (is.String(view)) {
      if (!view) {
        throw new Error('Empty URL pattern view name not permitted (for pattern ' + pattern + ')')
      }
    }
    return new URLPattern(pattern, view, name)
  }
}

/**
 * Initialises a URLResolver with the given URL patterns and provides a
 * convenience interface for using it repeatedly.
 */
function getResolver(patterns) {
  var resolver = new URLResolver('/', patterns)
  return {
    patterns: patterns
  , resolver: resolver
    /** Resolves a given URL. */
  , resolve: function(path) {
      return resolver.resolve(path)
    }
    /**
     * Reverse-resolves the URL pattern with the given name and arguments,
     * returning a URL.
     */
  , reverse: function(name, args, prefix) {
      args = args || []
      prefix = prefix || '/'
      return prefix + resolver.reverse(name, args)
    }
  }
}

module.exports = {
  version: '0.0.4'
, url: url
, patterns: patterns
, getResolver: getResolver
, URLPattern: URLPattern
, URLResolver: URLResolver
, ResolverMatch: ResolverMatch
, Resolver404: Resolver404
, NoReverseMatch: NoReverseMatch
}
})

require.define(["./dombuilder/core","./core"], function(module, exports, require) {
var is = require('isomorph/is')
  , object = require('isomorph/object')
  , array = require('isomorph/array')

// Native functions
var toString = Object.prototype.toString
  , slice = Array.prototype.slice
  , splice = Array.prototype.splice

/**
 * @const
 * @type {boolean}
 */
var JQUERY_AVAILABLE = (typeof jQuery != 'undefined')

/**
 * Attribute names corresponding to event handlers.
 * @const
 * @type {Object.<string, boolean>}
 */
var EVENT_ATTRS = (JQUERY_AVAILABLE
    ? jQuery.attrFn
    : object.lookup(('blur focus focusin focusout load resize scroll unload ' +
                     'click dblclick mousedown mouseup mousemove mouseover ' +
                     'mouseout mouseenter mouseleave change select submit ' +
                     'keydown keypress keyup error').split(' '))
    )

/**
 * Element name for fragments.
 * @const
 * @type {string}
 */
var FRAGMENT_NAME = '#document-fragment'

/**
 * Regular Expression which parses out tag names with optional id and class
 * definitions as part of the tag name.
 * @const
 * @type {RegExp}
 */
var BUILD_TAG_RE = new RegExp(
      '^([a-z][a-z0-9]*)?'               // tag name
    + '(?:#([a-z][-:\\w]*))?'            // id, excluding leading '#'
    + '(?:\\.([-\\w]+(?:\\.[-\\w]+)*))?' // class(es), excluding leading '.'
    , 'i'
    )

/**
 * Tag names defined in the HTML 4.01 Strict and Frameset DTDs and new elements
 * from HTML5.
 * @const
 * @type {Array.<string>}
 */
var TAG_NAMES = ('a abbr acronym address area article aside audio b bdi bdo big ' +
    'blockquote body br button canvas caption cite code col colgroup command ' +
    'datalist dd del details dfn div dl dt em embed fieldset figcaption figure ' +
    'footer form frame frameset h1 h2 h3 h4 h5 h6 hr head header hgroup html i ' +
    'iframe img input ins kbd keygen label legend li link map mark meta meter ' +
    'nav noscript ' /* :) */ + 'object ol optgroup option output p param pre ' +
    'progress q rp rt ruby samp script section select small source span strong ' +
    'style sub summary sup table tbody td textarea tfoot th thead time title tr ' +
    'track tt ul var video wbr').split(' ')

/**
 * Cross-browser means of setting innerHTML on a DOM Element.
 * @param {Element} el
 * @param {string} html
 */
var setInnerHTML = (JQUERY_AVAILABLE
    ? function(el, html) {
        jQuery(el).html(html)
      }
    : function(el, html) {
        try {
          el.innerHTML = html
        }
        catch (e) {
          var div = document.createElement('div')
          div.innerHTML = html
          while (el.firstChild)
            el.removeChild(el.firstChild)
          while (div.firstChild)
            el.appendChild(div.firstChild)
        }
      }
    )

// ---------------------------------------------------------- Core utilities ---

/**
 * Distinguishes between Objects which represent attributes and Objects which
 * are created by output modes as elements.
 * @param {*} o the potential Object to be checked.
 * @param {?string=} mode the current mode being used to create content.
 * @return {boolean} false if given something which is not an Object or is an
 *    Object created by an ouput mode.
 */
function isPlainObject(o, mode) {
  return (!!o &&
          toString.call(o) == '[object Object]' &&
          (!mode || !DOMBuilder.modes[mode].isModeObject(o)))
}

/**
 * Distinguishes between Arrays which represent elements and Arrays which
 * represent their contents.
 * @param {*} o the potential Array to be checked.
 * @return {boolean} false if given something which is not an Array or is an
 *    Array which represents an element.
 */
function isPlainArray(o) {
  return (toString.call(o) == '[object Array]' &&
          typeof o.isElement == 'undefined')
}

/**
 * Adds a property to an Array indicating that it represents an element.
 * @param {Array} a
 * @return {Array} the given array.
 */
function elementArray(a) {
  a.isElement = true
  return a
}

// ---------------------------------- Element Creation Convenience Functions ---

/**
 * Creates on Object containing element creation functions with the given fixed
 * mode, if one is given.
 * @param {?string=} mode
 * @return {Object.<string, Function>}
 */
function createElementFunctions(mode) {
  var obj = {}
  for (var i = 0, tag; tag = TAG_NAMES[i]; i++) {
    obj[tag.toUpperCase()] = createElementFunction(tag, mode)
  }
  return obj
}

/**
 * Creates a function which, when called, uses DOMBuilder to create an element
 * with the given tagName.
 *
 * The resulting function will also have a map function which calls
 * DOMBuilder.map with the given tagName and mode, if one is provided.
 *
 * @param {string} tag
 * @param {?string=} fixedMode
 * @return {function(...[*])}
 */
function createElementFunction(tag, fixedMode) {
  var elementFunction = function() {
    if (!arguments.length) {
      var mode = (typeof fixedMode != 'undefined'
                  ? fixedMode
                  : DOMBuilder.mode)
      // Short circuit if there are no arguments, to avoid further
      // argument inspection.
      if (mode) {
        return DOMBuilder.modes[mode].createElement(tag, {}, [])
      }
      return elementArray([tag])
    }
    else {
      return createElementFromArguments(tag, fixedMode, slice.call(arguments))
    }
  }

  elementFunction.map = function() {
    return mapElementFromArguments(tag, fixedMode, slice.call(arguments))
  }

  return elementFunction
}

/**
 * Normalises a list of arguments in order to create a new element using
 * DOMBuilder.createElement. Supported argument formats are:
 *
 * (attributes, child1, ...)
 *    an attributes object followed by an arbitrary number of children.
 * (attributes, [child1, ...])
 *    an attributes object and an Array of children.
 * (child1, ...)
 *    an arbitrary number of children.
 * ([child1, ...])
 *    an Array of children.
 *
 * At least one argument *must* be provided.
 *
 * @param {string} tagName
 * @param {string|null|undefined} fixedMode
 * @param {Array} args
 * @return {*}
 */
function createElementFromArguments(tagName, fixedMode, args) {
  var attributes
    , children
      // The short circuit in createElementFunction ensures we will
      // always have at least one argument when called via element creation
      // functions.
    , argsLength = args.length
    , firstArg = args[0]

  if (argsLength === 1 && isPlainArray(firstArg)) {
    children = firstArg // ([child1, ...])
  }
  else if (isPlainObject(firstArg, (typeof fixedMode != 'undefined'
                                    ? fixedMode
                                    : DOMBuilder.mode))) {
    attributes = firstArg
    children = (argsLength == 2 && isPlainArray(args[1])
                ? args[1]        // (attributes, [child1, ...])
                : args.slice(1)) // (attributes, child1, ...)
  }
  else {
    children = args // (child1, ...)
  }

  return DOMBuilder.createElement(tagName, attributes, children, fixedMode)
}

/**
 * Normalises a list of arguments in order to create new elements using
 * DOMBuilder.map.
 * @param {string} tagName
 * @param {string|null|undefined} fixedMode
 * @param {Array} args
 * @return {Array}
 */
function mapElementFromArguments(tagName, fixedMode, args) {
  if (isPlainArray(args[0])) { // (items, func)
    var defaultAttrs = {}
      , items = args[0]
      , func = (is.Function(args[1]) ? args[1] : null)
  }
  else { // (attrs, items, func)
    var defaultAttrs = args[0]
      , items = args[1]
      , func = (is.Function(args[2]) ? args[2] : null)
  }

  return DOMBuilder.map(tagName, defaultAttrs, items, func, fixedMode)
}

/**
 * Creates an object with loops status details based on the current index and
 * total length.
 * @param {number} i
 * @param {number} l
 * @return {Object}
 */
function loopStatus(i, l) {
  return {
    index: i
  , first: i == 0
  , last: i == l - 1
  }
}

// === DOMBuilder API ==========================================================

var DOMBuilder = {
  version: '2.1.1'

// ------------------------------------------------------------------- Modes ---

  /**
   * Determines which mode content creation functions will operate in by
   * default.
   * @type {string}
   */
, mode: null

  /**
   * Additional modes registered using addMode.
   * @type {Object.<string, Object>}
   */
, modes: {}

  /**
   * Adds a new mode and exposes an API for it on the DOMBuilder object with the
   * mode's name.
   * @param {Object} mode
   */
, addMode: function(mode) {
    mode = object.extend({
      isModeObject: function() { return false; }, api: {}, apply: {}
    }, mode)
    // Store the mode for later use of its content creation functions
    this.modes[mode.name] = mode
    // Expose mode-specific element creation functions and the mode's exported
    // API as a DOMBuilder.<mode name> property.
    this[mode.name] = object.extend(createElementFunctions(mode.name), mode.apply)
    // If there is no default mode set, use the first mode added as the default
    if (this.mode === null) {
      this.mode = mode.name
    }
  }

  /**
   * Calls a function using DOMBuilder temporarily in the given mode and
   * returns its output. Any additional arguments provided will be passed to
   * the function when it is called.
   * @param {string} mode
   * @param {Function} func
   * @return {*}
   */
, withMode: function(mode, func) {
    var originalMode = this.mode
    this.mode = mode
    try {
      return func.apply(null, slice.call(arguments, 2))
    }
    finally {
      this.mode = originalMode
    }
  }

  /**
   * Element creation functions which create contents according to
   * DOMBuilder.mode.
   * @type {Object.<string, Object>}
   */
, elements: createElementFunctions()

  /**
   * Element creation functions which create nested Array contents.
   * @type {Object.<string, Object>}
   */
, array: createElementFunctions(null)

  /**
   * Adds element functions to a given context Object. If a valid mode argument
   * is given, mode-specific element functions are added, as well as any
   * additional functions specified for application by the mode.
   * @param {Object} context
   * @param {string=} mode
   * @return {Object} the object the functions were added to.
   */
, apply: function(context, mode) {
    if (mode && this.modes[mode]) {
      object.extend(context, this[mode])
    }
    else {
      object.extend(context, this.elements)
    }
    return context
  }

// -------------------------------------------------------- Content Creation ---

  /**
   * Generates content from a nested list using the given output mode.
   * @param {Array} content
   * @param {string=} mode
   * @return {*}
   */
, build: function(content, mode) {
    // Default to the configured output mode if called without one
    mode = mode || this.mode

    var tagName = content[0]
      , isFragment = (tagName == FRAGMENT_NAME)
      , attrs = (!isFragment && isPlainObject(content[1], mode)
                 ? content[1]
                 : null)
      , childStartIndex = (attrs === null ? 1 : 2)
      , l = content.length
      , children = []
      , item

    // Extract id and classes from tagName for non-fragment elements, defaulting
    // the tagName to 'div' if none was specified.
    if (!isFragment) {
      if (attrs === null) {
        attrs = {}
      }
      var tagParts = BUILD_TAG_RE.exec(tagName)
      if (!tagParts) {
        throw new Error(tagName + ' is not a valid tag definition')
      }
      tagName = tagParts[1] || 'div'
      if (tagParts[2]) {
        attrs.id = tagParts[2]
      }
      if (tagParts[3]) {
        attrs['class'] = tagParts[3].replace(/\./g, ' ')
      }
    }

    // Build child contents first
    for (var i = childStartIndex; i < l; i++) {
      item = content[i]
      if (is.Array(item)) {
        children.push(this.build(item, mode))
      }
      else {
        children.push(item)
      }
    }

    // Build the current element
    return (isFragment
            ? this.modes[mode].fragment(children)
            : this.modes[mode].createElement(tagName, attrs, children))
  }

  /**
   * Creates an element with the given tag name and, optionally, the given
   * attributes and children.
   * @param {string} tagName
   * @param {Object} attributes
   * @param {Array} children
   * @param {string=} mode
   */
, createElement: function(tagName, attributes, children, mode) {
    attributes = attributes || {}
    children = children || []
    mode = (typeof mode != 'undefined' ? mode : this.mode)
    if (mode) {
      array.flatten(children)
      return this.modes[mode].createElement(tagName, attributes, children)
    }
    else {
      var arrayOutput = [tagName]
      for (var attr in attributes) {
        arrayOutput.push(attributes)
        break
      }
      if (children.length) {
        arrayOutput = arrayOutput.concat(children)
      }
      return elementArray(arrayOutput)
    }
  }

  /**
   * Creates a Text Node with the given text.
   */
, textNode: function(text, mode) {
    mode = (typeof mode != 'undefined' ? mode : this.mode)
    return this.modes[mode].textNode(text)
  }

  /**
   * Creates an element for (potentially) every item in a list.
   * @param {string} tagName
   * @param {Object} defaultAttrs
   * @param {Array} items
   * @param {Function=} func
   * @param {string=} mode
   */
, map: function(tagName, defaultAttrs, items, func, mode) {
    var results = []
    for (var i = 0, l = items.length, attrs, children; i < l; i++) {
      attrs = object.extend({}, defaultAttrs)
      // If we were given a mapping function, call it and use the
      // return value as the contents, unless the function specifies
      // that the item shouldn't generate an element by explicity
      // returning null.
      if (func != null) {
        if (typeof mode != 'undefined') {
          children = DOMBuilder.withMode(mode, func, items[i], attrs,
                                         loopStatus(i, l))
        }
        else {
          children = func(items[i], attrs, loopStatus(i, l))
        }
        if (children === null) {
          continue
        }
      }
      else {
        // If we weren't given a mapping function, use the item as the
        // contents.
        var children = items[i]
      }

      // Ensure children are in an Array, as required by createElement
      if (!isPlainArray(children)) {
        children = [children]
      }

      results.push(this.createElement(tagName, attrs, children, mode))
    }
    return results
  }

  /**
   * Creates a fragment with the given children. Supported argument formats are:
   * @param {...[*]} args
   * @return {*}
   */
, fragment: (function() {
    var fragment = function() {
      var children
      if (arguments.length === 1 &&
          isPlainArray(arguments[0])) {
        children = arguments[0] // ([child1, ...])
      }
      else {
        children = slice.call(arguments) // (child1, ...)
      }

      if (this.mode) {
        // Inline the contents of any child Arrays
        array.flatten(children)
        return this.modes[this.mode].fragment(children)
      }
      else {
        return elementArray([FRAGMENT_NAME].concat(children))
      }
    }

    /**
     * Creates a fragment wrapping content created for every item in a
     * list.
     * @param {Array} items
     * @param {Function=} func
     */
    fragment.map = function(items, func) {
      // If we weren't given a mapping function, the user may as well just
      // have created a fragment directly, as we're just wrapping content
      // here, not creating it.
      if (!is.Function(func)) {
        return DOMBuilder.fragment(items)
      }

      var results = []
      for (var i = 0, l = items.length, children; i < l; i++) {
        // Call the mapping function and add the return value to the
        // fragment contents, unless the function specifies that the item
        // shouldn't generate content by explicity returning null.
        children = func(items[i], loopStatus(i, l))
        if (children === null) {
          continue
        }
        results = results.concat(children)
      }
      return DOMBuilder.fragment(results)
    }

    return fragment
  })()

  /* Exposes utilities for use in mode plugins. */
, util: {
    EVENT_ATTRS: EVENT_ATTRS
  , FRAGMENT_NAME: FRAGMENT_NAME
  , JQUERY_AVAILABLE: JQUERY_AVAILABLE
  , TAG_NAMES: TAG_NAMES
  , setInnerHTML: setInnerHTML
  }
}

module.exports = DOMBuilder
})

require.define("./dombuilder/dom", function(module, exports, require) {
var DOMBuilder =require('./core')
  , object = require('isomorph/object')

var document = window.document
  // DOMBuilder utilities
  , EVENT_ATTRS = DOMBuilder.util.EVENT_ATTRS
  , JQUERY_AVAILABLE = DOMBuilder.util.JQUERY_AVAILABLE
  , setInnerHTML = DOMBuilder.util.setInnerHTML

/**
 * Cross-browser means of creating a DOM Element with attributes.
 * @param {string} tagName
 * @param {Object} attributes
 * @return {Element}
 */
var createElement = (JQUERY_AVAILABLE
    ? function(tagName, attributes) {
        if (object.hasOwn(attributes, 'innerHTML')) {
          var html = attributes.innerHTML
          delete attributes.innerHTML
          return jQuery('<' + tagName + '>', attributes).html(html).get(0)
        }
        else {
          return jQuery('<' + tagName + '>', attributes).get(0)
        }
      }
    : (function() {
        var attrFix = {
              tabindex: 'tabIndex'
            }
          , propFix = {
              tabindex: 'tabIndex'
            , readonly: 'readOnly'
            , 'for': 'htmlFor'
            , 'class': 'className'
            , maxlength: 'maxLength'
            , cellspacing: 'cellSpacing'
            , cellpadding: 'cellPadding'
            , rowspan: 'rowSpan'
            , colspan: 'colSpan'
            , usemap: 'useMap'
            , frameborder: 'frameBorder'
            , contenteditable: 'contentEditable'
            }
          , nodeName = function(elem, name) {
              return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase()
            }
          , support = (function() {
              var div = document.createElement('div')
              div.setAttribute('className', 't')
              div.innerHTML = '<span style="color:silver">s<span>'
              var span = div.getElementsByTagName('span')[0]
              var input = document.createElement('input')
              input.value = 't'
              input.setAttribute('type', 'radio')
              return {
                style: /silver/.test(span.getAttribute('style'))
              , getSetAttribute: div.className != 't'
              , radioValue: input.value == 't'
              }
            })()
          , formHook
          // Hook for boolean attributes
          , boolHook = function(elem, value, name) {
              var propName
              if (value !== false) {
                // value is true since we know at this point it's type boolean and not false
                // Set boolean attributes to the same name and set the DOM property
                propName = propFix[name] || name
                if (propName in elem) {
                  // Only set the IDL specifically if it already exists on the element
                  elem[propName] = true
                }
                elem.setAttribute(name, name.toLowerCase())
              }
              return name
            }
          , attrHooks = {
              type: function(elem, value) {
                if (!support.radioValue && value == 'radio' && nodeName(elem, 'input')) {
                  // Setting the type on a radio button after the value resets the value in IE6-9
                  // Reset value to its default in case type is set after value
                  var val = elem.value
                  elem.setAttribute('type', value)
                  if (val) {
                    elem.value = val
                  }
                  return value
                }
              }
              // Use the value property for back compat
              // Use the formHook for button elements in IE6/7
            , value: function(elem, value, name) {
                if (formHook && nodeName(elem, 'button')) {
                  return formHook(elem, value, name)
                }
                // Does not return so that setAttribute is also used
                elem.value = value
              }
            }
          , rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i
          , rinvalidChar = /\:|^on/

        // IE6/7 do not support getting/setting some attributes with get/setAttribute
        if (!support.getSetAttribute) {
          // propFix is more comprehensive and contains all fixes
          attrFix = propFix

          // Use this for any attribute on a form in IE6/7
          formHook = attrHooks.name = attrHooks.title = function(elem, value, name) {
            // Check form objects in IE (multiple bugs related)
            // Only use nodeValue if the attribute node exists on the form
            var ret = elem.getAttributeNode(name)
            if (ret) {
              ret.nodeValue = value
              return value
            }
          }

          // Set width and height to auto instead of 0 on empty string( Bug #8150 )
          // This is for removals
          attrHooks.width = attrHooks.height = function(elem, value) {
            if (value === '') {
              elem.setAttribute(name, 'auto')
              return value
            }
          }
        }

        if (!support.style) {
          attrHooks.style = function(elem, value) {
            return (elem.style.cssText = ''+value)
          }
        }

        function setAttr(elem, name, value) {
          // Fallback to prop when attributes are not supported
          if (!('getAttribute' in elem)) {
            // Inlined version of the relevant bits of prop
            name = propFix[name] || name
            if (value !== undefined) {
              return (elem[name] = value)
            }
            return
          }

          var ret, hook
          // Normalize the name if needed
          name = attrFix[name] || name
          hook = attrHooks[name]

          if (!hook) {
            // Use boolHook for boolean attributes
            if (rboolean.test(name)) {
              hook = boolHook
            }
            // Use formHook for forms and if the name contains certain characters
            else if (formHook && name != 'className' &&
              (nodeName(elem, 'form') || rinvalidChar.test(name))) {
              hook = formHook
            }
          }

          if (value !== undefined) {
            if (hook && (ret = hook(elem, value, name)) !== undefined) {
              return ret
            }
            else {
              elem.setAttribute(name, ''+value)
              return value
            }
          }
        }

        return function(tagName, attributes) {
          var el = document.createElement(tagName)
            , name
            , value
          if (object.hasOwn(attributes, 'innerHTML')) {
              setInnerHTML(el, attributes.innerHTML)
              delete attributes.innerHTML
          }
          for (name in attributes) {
            value = attributes[name]
            if (EVENT_ATTRS[name]) {
              el['on' + name] = value
            }
            else {
              setAttr(el, name, value)
            }
          }
          return el
        }
      })()
    )

DOMBuilder.addMode({
  name: 'dom'
, createElement: function(tagName, attributes, children) {
    var hasInnerHTML = object.hasOwn(attributes, 'innerHTML')
    // Create the element and set its attributes and event listeners
    var el = createElement(tagName, attributes)

    // If content was set via innerHTML, we're done...
    if (!hasInnerHTML) {
      // ...otherwise, append children
      for (var i = 0, l = children.length, child; i < l; i++) {
        child = children[i]
        if (child && child.nodeType) {
          el.appendChild(child)
        }
        else {
          el.appendChild(document.createTextNode(''+child))
        }
      }
    }
    return el
  }
, textNode: function(text) {
    return document.createTextNode(text)
  }
, fragment: function(children) {
    var fragment = document.createDocumentFragment()
    for (var i = 0, l = children.length, child; i < l; i++) {
      child = children[i]
      if (child.nodeType) {
        fragment.appendChild(child)
      }
      else {
        fragment.appendChild(document.createTextNode(''+child))
      }
    }
    return fragment
  }
, isModeObject: function(obj) {
    return !!obj.nodeType
  }
, api: {
    createElement: createElement
  }
})
})

require.define("./dombuilder/html", function(module, exports, require) {
var DOMBuilder = require('./core')
  , object = require('isomorph/object')

// Native functions
var splice = Array.prototype.splice
// DOMBuilder utilities
var EVENT_ATTRS = DOMBuilder.util.EVENT_ATTRS
  , FRAGMENT_NAME = DOMBuilder.util.FRAGMENT_NAME
  , JQUERY_AVAILABLE = DOMBuilder.util.JQUERY_AVAILABLE
  , TAG_NAMES = DOMBuilder.util.TAG_NAMES
  , setInnerHTML = DOMBuilder.util.setInnerHTML

/**
 * Lookup for known tag names.
 * @const
 * @type {Object.<string, boolean>}
 */
var TAG_NAME_LOOKUP = object.lookup(TAG_NAMES)

/**
 * Lookup for tags defined as EMPTY in the HTML 4.01 Strict and Frameset DTDs
 * and in the HTML5 spec.
 * @const
 * @type {Object.<string, boolean>}
 */
var EMPTY_TAGS = object.lookup(('area base br col command embed frame hr input img ' +
                                'keygen link meta param source track wbr').split(' '))

/**
 * Cross-browser event registration.
 * @param {string} id
 * @param {string} event
 * @param {Function} handler
 */
var addEvent = (JQUERY_AVAILABLE
    ? function(id, event, handler) {
        jQuery('#' + id)[event](handler)
      }
    : function(id, event, handler) {
        document.getElementById(id)['on' + event] = handler
      }
    )

// ----------------------------------------------------------- HTML Escaping ---

/**
 * String subclass which marks the given string as safe for inclusion
 * without escaping.
 * @constructor
 * @extends {String}
 * @param {string} value
 */
function SafeString(value) {
  this.value = value;
}
object.inherits(SafeString, String)

/**
 * @return {string}
 */
SafeString.prototype.toString = SafeString.prototype.valueOf = function() {
  return this.value
}

/**
 * Marks a string as safe
 * @param {string} value
 * @return {SafeString}
 */
function markSafe(value) {
  return new SafeString(value)
}

/**
 * Determines if a string is safe.
 * @param {string|SafeString} value
 * @return {boolean}
 */
function isSafe(value) {
  return (value instanceof SafeString)
}

/**
 * Escapes sensitive HTML characters.
 * @param {string} s
 * @return {string}
 */
var escapeHTML = (function() {
  var amp = /&/g, lt = /</g, gt = />/g, quot = /"/g, apos = /'/g
  return function(s) {
    return s.replace(amp, '&amp;')
             .replace(lt, '&lt;')
              .replace(gt, '&gt;')
               .replace(quot,'&quot;')
                .replace(apos, '&#39;')
  }
})()

/**
 * If the given input is a SafeString, returns its value; otherwise, coerces
 * to String and escapes.
 * @param {*} html
 * @return {string}
 */
function conditionalEscape(html) {
  if (html instanceof SafeString) {
    return html.value
  }
  return escapeHTML(''+html)
}

// ------------------------------------------------------- Mock DOM Elements ---

/**
 * Partially emulates a DOM Node for HTML generation.
 * @constructor
 * @param {Array=} childNodes initial child nodes.
 */
function HTMLNode(childNodes) {
  /**
   * @type {Array}
   */
  this.childNodes = childNodes || []

  // Ensure any MockFragment contents are inlined, as if this object's child
  // nodes were appended one-by-one.
  this._inlineFragments()

  /**
   * @type {?HTMLNode|string}
   */
  this.firstChild = this.childNodes.length ? this.childNodes[0] : null
}
object.inherits(HTMLNode, Object)

/**
 * Replaces any MockFragment objects in child nodes with their own
 * child nodes and empties the fragment.
 * @private
 */
HTMLNode.prototype._inlineFragments = function() {
  for (var i = 0, l = this.childNodes.length, child; i < l; i++) {
    child = this.childNodes[i]
    if (child instanceof MockFragment) {
      // Replace the fragment with its contents
      splice.apply(this.childNodes, [i, 1].concat(child.childNodes))
      // Clear the fragment on append, as per DocumentFragment
      child._clear()
    }
  }
}

/**
 * Emulates appendChild, inserting fragment child node contents and
 * emptying the fragment if one is given.
 * @param {HTMLNode|string} node
 */
HTMLNode.prototype.appendChild = function(node) {
  if (node instanceof MockFragment) {
    this.childNodes = this.childNodes.concat(node.childNodes)
    // Clear the fragment on append, as per DocumentFragment
    node._clear()
  }
  else {
    this.childNodes.push(node)
  }
  if (this.firstChild === null) {
    this.firstChild = this.childNodes[0]
  }
}

/**
 * Emulates cloneNode so cloning of MockFragment objects works
 * as expected.
 * @param {boolean} deep
 * @return {HTMLNode}
 */
HTMLNode.prototype.cloneNode = function(deep) {
  var clone = this._clone();
  if (deep === true)
  {
    for (var i = 0, l = this.childNodes.length, node; i < l; i++) {
      node = this.childNodes[i]
      if (node instanceof MockElement) {
        node = node.cloneNode(deep)
      }
      if (i === 0) {
        clone.firstChild = node
      }
      clone.childNodes.push(node)
    }
  }
  return clone
}

/**
 * @return {boolean}
 */
HTMLNode.prototype.hasChildNodes = function() {
  return !!this.childNodes.length
}

/**
 * Removes and returns a child node, or throws an exception if this node doesn't
 * contain it.
 * @param {HTMLNode|string} child the child to be removed,
 * @return {HTMLNode|string}
 */
HTMLNode.prototype.removeChild = function(child) {
  if (this.firstChild !== null && child === this.firstChild) {
    this.firstChild = this.childNodes.length > 1 ? this.childNodes[1] : null
    return this.childNodes.shift()
  }
  for (var i = 1, l = this.childNodes.length; i < l; i++) {
    if (child === this.childNodes[i]) {
      return this.childNodes.splice(i, 1)[0]
    }
  }
  throw new Error('Node was not found')
}

/**
 * Creates the object to be used for deep cloning.
 * @protected
 */
HTMLNode.prototype._clone = function() {
  return new Node()
}

/**
 * Partially emulates a DOM Element for HTML generation.
 * @constructor
 * @extends {HTMLNode}
 * @param {string} tagName
 * @param {Object=} attributes
 * @param {Array=} childNodes
 */
function MockElement(tagName, attributes, childNodes) {
  HTMLNode.call(this, childNodes)
  /** @type {string} */
  this.tagName = this.nodeName = tagName.toLowerCase()
  /** @type {Object} */
  this.attributes = attributes || {}
}
object.inherits(MockElement, HTMLNode)
/** @type {number} */
MockElement.eventTrackerId = 1
/** @type {number} */
MockElement.prototype.nodeType = 1
/**
 * @protected
 * @return {MockElement}
 */
MockElement.prototype._clone = function() {
  return new MockElement(this.tagName, object.extend({}, this.attributes))
}

/**
 * Creates an HTML representation of an MockElement.
 *
 * If true is passed as an argument and any event attributes are found, this
 * method will ensure the resulting element has an id so  the handlers for the
 * event attributes can be registered after the element has been inserted into
 * the document via innerHTML.
 *
 * If necessary, a unique id will be generated.
 *
 * @param {boolean=} trackEvents
 * @return {string}
 */
MockElement.prototype.toString = function(trackEvents) {
  trackEvents = (typeof trackEvents != 'undefined' ? trackEvents : false)
  var tagName = (TAG_NAME_LOOKUP[this.tagName]
                 ? this.tagName
                 : conditionalEscape(this.tagName))
      // Opening tag
    , parts = ['<' + tagName]
    , attr
  // Tag attributes
  for (attr in this.attributes) {
    // innerHTML is a special case, as we can use it to (perhaps
    // inadvisedly) specify entire contents as a string.
    if (attr === 'innerHTML') {
      continue
    }
    // Don't create attributes which wouldn't make sense in HTML mode when the
    // DOM is available - they can be dealt with after insertion using
    // addEvents().
    if (EVENT_ATTRS[attr]) {
      if (trackEvents === true && !this.eventsFound) {
        /** @type {boolean|undefined} */
        this.eventsFound = true;
      }
      continue
    }
    parts.push(' ' + conditionalEscape(attr.toLowerCase()) + '="' +
               conditionalEscape(this.attributes[attr]) + '"')
  }
  if (this.eventsFound && !object.hasOwn(this.attributes, 'id')) {
    // Ensure an id is present so we can grab this element later
    this.id = '__DB' + MockElement.eventTrackerId++ + '__'
    parts.push(' id="' + this.id + '"')
  }
  parts.push('>')

  if (EMPTY_TAGS[tagName]) {
    return parts.join('')
  }

  // If innerHTML was given, use it exclusively for the contents
  if (object.hasOwn(this.attributes, 'innerHTML')) {
    parts.push(this.attributes.innerHTML)
  }
  else {
    for (var i = 0, l = this.childNodes.length, node; i < l; i++) {
      node = this.childNodes[i];
      if (node instanceof MockElement || node instanceof SafeString) {
        parts.push(node.toString(trackEvents))
      }
      else {
        // Coerce to string and escape
        parts.push(escapeHTML(''+node))
      }
    }
  }

  // Closing tag
  parts.push('</' + tagName + '>')
  return parts.join('')
}

/**
 * If event attributes were found when toString(true) was called, this
 * method will retrieve the resulting DOM Element by id, attach event handlers
 * to it and call addEvents on any MockElement children.
 */
MockElement.prototype.addEvents = function() {
  if (this.eventsFound) {
    var id = (object.hasOwn(this.attributes, 'id')
              ? conditionalEscape(this.attributes.id)
              : this.id)
      , attr;
    for (attr in this.attributes) {
      if (EVENT_ATTRS[attr]) {
        addEvent(id, attr, this.attributes[attr])
      }
    }
    delete this.eventsFound
    delete this.id
  }

  for (var i = 0, l = this.childNodes.length, node; i < l; i++) {
    node = this.childNodes[i]
    if (node instanceof MockElement) {
      node.addEvents()
    }
  }
}

/**
 * @param {Element} el
 */
MockElement.prototype.insertWithEvents = function(el) {
  setInnerHTML(el, this.toString(true))
  this.addEvents()
}

/**
 * Partially emulates a DOM DocumentFragment for HTML generation.
 * @constructor
 * @extends {HTMLNode}
 * @param {Array=} childNodes
 */
function MockFragment(childNodes) {
  HTMLNode.call(this, childNodes)
}
object.inherits(MockFragment, HTMLNode)

/**
 * Clears the fragment after its contents been appended to another Node.
 */
MockFragment.prototype._clear = function() {
  this.childNodes = []
  this.firstChild = null
}
/**
 * @protected
 * @return {MockFragment}
 */
MockFragment.prototype._clone = function() {
  return new MockFragment()
};
/** @type {number} */
MockFragment.prototype.nodeType = 11
/** @type {string} */
MockFragment.prototype.nodeName = FRAGMENT_NAME

/**
 * Creates an HTML representation of an MockFragment.
 *
 * If true is passed as an argument, it will be passed on to
 * any child MockElements when their toString() is called.
 *
 * @param {boolean=} trackEvents
 * @return {string}
 */
MockFragment.prototype.toString = function(trackEvents) {
  trackEvents = (typeof trackEvents != 'undefined' ? trackEvents : false)
  var parts = []
  // Contents
  for (var i = 0, l = this.childNodes.length, node; i < l; i++) {
    node = this.childNodes[i];
    if (node instanceof MockElement || node instanceof SafeString) {
      parts.push(node.toString(trackEvents))
    }
    else {
      // Coerce to string and escape
      parts.push(escapeHTML(''+node))
    }
  }

  return parts.join('')
}

/**
 * Calls addEvents() on any MockElement children.
 */
MockFragment.prototype.addEvents = function() {
  for (var i = 0, l = this.childNodes.length, node; i < l; i++) {
    node = this.childNodes[i]
    if (node instanceof MockElement) {
      node.addEvents()
    }
  }
}

/**
 * @param {Element} el
 */
MockFragment.prototype.insertWithEvents = function(el) {
  setInnerHTML(el, this.toString(true))
  this.addEvents()
}

// === Register mode plugin ====================================================

DOMBuilder.addMode({
  name: 'html'
, createElement: function(tagName, attributes, children) {
    return new MockElement(tagName, attributes, children)
  }
, textNode: function(text) {
    return text
  }
, fragment: function(children) {
    return new MockFragment(children)
  }
, isModeObject: function(obj) {
    return (obj instanceof HTMLNode ||
            obj instanceof SafeString)
  }
, api: {
    escapeHTML: escapeHTML
  , conditionalEscape: conditionalEscape
  , isSafe: isSafe
  , markSafe: markSafe
  , SafeString: SafeString
  , HTMLNode: HTMLNode
  , MockElement: MockElement
  , MockFragment: MockFragment
  }
, apply: {
    isSafe: isSafe
  , markSafe: markSafe
  }
})
})

require.define("./dombuilder/template", function(module, exports, require) {
var DOMBuilder = require('./core')
  , Concur = require('Concur')
  , is = require('isomorph/is')
  , object = require('isomorph/object')
  , array = require('isomorph/array')

// Native functions
var slice = Array.prototype.slice
  , toString = Object.prototype.toString

/** Separator used for object lookups. */
var VAR_LOOKUP_SEPARATOR = '.'
/** RegExp for specifying the loop variable for a ForNode. */
var FOR_RE = /( in )([\.\w_]+)$/
/** Separator for specifying multiple variable names to be unpacked. */
var UNPACK_SEPARATOR_RE = /, ?/
/** RegExp for template variables. */
var VARIABLE_RE = /{{(.*?)}}/
/** RegExp for trimming whitespace. */
var TRIM_RE = /^\s+|\s+$/g
/** Context key for block inheritance context. */
var BLOCK_CONTEXT_KEY = 'blockContext'
/** Document Type Definitions. */
var DOCTYPES = {
      4: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
    , 5: '<!DOCTYPE html>'
    }

/** Template lookup. */
var templates = {}

/**
 * Creates a lookup object from a list of BlockNodes by name, asserting that
 * their names are unique.
 */
function blockLookup(blocks) {
  var lookup = {}
    , block
  for (var i = 0; block = blocks[i]; i++) {
    if (typeof lookup[block.name] != 'undefined') {
      throw new TemplateSyntaxError("Block with name '" + block.name +
                                    "' appears more than once.")
    }
    lookup[block.name] = block
  }
  return lookup
}

/**
 * Searches a TemplateNode (or an object which looks like one) for contents
 * which are instances of the given node type.
 */
function findNodesByType(contents, nodeType) {
  var nodes = []
  for (var i = 0, l = contents.length, node; i < l; i++) {
    node = contents[i]
    if (node instanceof nodeType) {
      nodes.push(node)
    }
    if (node instanceof TemplateNode && typeof node.contents != 'undefined') {
      nodes.push.apply(nodes, findNodesByType(node.contents, nodeType))
    }
  }
  return nodes
}

/**
 * Some browser implementations of String.prototype.split don't include matches
 * from capturing RegExps.
 */
var splitBits = (function() {
  var memo = {}
  return function(expr, re) {
    if (!re.global) {
      if (!object.hasOwn(memo, re.source)) {
        memo[re.source] = new RegExp(re.source, 'g')
      }
      re = memo[re.source]
    }
    var bits = []
      , match
      , lastIndex
      , lastLastIndex = 0
      , lastLength
    while (match = re.exec(expr)) {
      lastIndex = match.index + match[0].length
      if (lastIndex > lastLastIndex) {
        bits.push(expr.slice(lastLastIndex, match.index))
        if (match.length > 1 && match.index < expr.length) {
          bits.push.apply(bits, match.slice(1))
        }
        lastLength = match[0].length
        lastLastIndex = lastIndex
      }
      if (re.lastIndex === match.index) {
        re.lastIndex++
      }
    }
    bits.push(expr.slice(lastLastIndex))
    return bits
  }
})()

/**
 * Escapes a string for inclusion in generated code where strings use double
 * quotes as delimiters.
 */
function escapeString(s) {
  return s.replace('\\', '\\\\').replace('"', '\\"')
}

/**
 * Default rendering for a list of template contents.
 */
function render(contents, context) {
  var results = []
  for (var i = 0, l = contents.length, content; i < l; i++) {
    content = contents[i]
    if (content && (content instanceof TemplateNode ||
                    is.Function(content.render))) {
      results.push(content.render(context))
    }
    else {
      results.push(content)
    }
  }
  return results
}

// -------------------------------------------------------------- Exceptions ---

/**
 * Thrown when pop() is called too many times on a Context.
 */
function ContextPopError() {
  this.message = 'pop() was called more times than push()'
}
object.inherits(ContextPopError, Error)

/**
 * Thrown when a Variable cannot be resolved.
 */
function VariableNotFoundError(message) {
  this.message = message
}
object.inherits(VariableNotFoundError, Error)

/**
 * Thrown when expressions cannot be parsed or otherwise invalid contents are
 * detected.
 */
function TemplateSyntaxError(message) {
  this.message = message
}
object.inherits(TemplateSyntaxError, Error)

/**
 * Thrown when a named template cannot be found.
 */
function TemplateNotFoundError(message) {
  this.message = message
}
object.inherits(TemplateNotFoundError, Error)

// --------------------------------- Template Lookup / Convenience Rendering ---

/**
 * Renders a template with the given name (or list of names).
 */
function renderTemplate(name, context) {
  var template
  if (is.Array(name)) {
    template = selectTemplate(name)
  }
  else {
    template = getTemplate(name)
  }
  return template.render(context)
}

/**
 * Retrieves a template by name, throwing a TemplateNotFoundError if no such
 * template exists.
 */
function getTemplate(name) {
  if (typeof templates[name] == 'undefined') {
    throw new TemplateNotFoundError(name)
  }
  return templates[name]
}

/**
 * Returns the first template which exists from the given list of template
 * names.
 */
function selectTemplate(names) {
  var notFound = []
  for (var i = 0, l = names.length; i < l; i++) {
    try {
      return getTemplate(names[i])
    }
    catch (e) {
      notFound.push(names[i])
    }
  }
  throw new TemplateNotFoundError(notFound.join(', '))
}

// ----------------------------------------------------------------- Context ---

/**
 * A quick shimplementation of FilterExpression to allow IfNodes to perform
 * existence checks on variables. A full implementation which implements filters
 * will be coming once I've decided on the appropriate design for it.
 */
function FilterExpression(expr) {
  this.variable = new Variable(expr)
}

FilterExpression.prototype.resolve = FilterExpression.prototype.render = function(context, ignoreFailures) {
  var current
  if (this.variable instanceof Variable) {
    try {
      current = this.variable.resolve(context)
    }
    catch (e) {
      if (!(e instanceof VariableNotFoundError)) throw e
      if (ignoreFailures) {
        current = null
      }
      else {
        // Emulate what currently happens if a Variable is not found if this
        // shim is used without passing the ignoreFailures parameter.
        throw e
      }
    }
  }
  else {
    current = this.variable
  }
  return current
}

/**
 * Resolves variable expressions based on a context, supporting object property
 * lookups specified with '.' separators.
 */
function Variable(expr, callFunctions) {
  this.expr = expr
  this.callFunctions = (typeof callFunctions != 'undefined' ? callFunctions: true)
}

Variable.prototype.resolve = Variable.prototype.render = function(context) {
  // First lookup is in the context
  var bits = this.expr.split(VAR_LOOKUP_SEPARATOR)
    , bit = bits.shift()
    , current = context.get(bit)
  if (!context.hasKey(bit)) {
    throw new VariableNotFoundError('Could not find [' + bit +
                                    '] in ' + context)
  }
  else if (is.Function(current) && this.callFunctions) {
    current = current()
  }

  // Any further lookups are against current object properties
  if (bits.length) {
    var l = bits.length
      , next
    for (var i = 0; i < l; i++) {
      bit = bits[i]
      if (current == null || typeof current[bit] == 'undefined') {
        throw new VariableNotFoundError('Could not find [' + bit +
                                        '] in ' + current)
      }
      next = current[bit]
      // Call functions with the current object as context
      if (is.Function(next) && this.callFunctions) {
        current = next.call(current)
      }
      else {
        current = next
      }
    }
  }

  return current
}

/**
 * Manages a stack of objects holding template context variables and rendering
 * context.
 */
function Context(initial) {
  if (!(this instanceof Context)) return new Context(initial)
  this.stack = [initial || {}]
  this.renderContext = new RenderContext()
}

Context.prototype.push = function(context) {
  this.stack.push(context || {})
}

Context.prototype.pop = function() {
  if (this.stack.length == 1) {
    throw new ContextPopError()
  }
  return this.stack.pop()
}

Context.prototype.set = function(name, value) {
  this.stack[this.stack.length - 1][name] = value
}

/**
 * Adds multiple items to the current context object, where names and values are
 * provided as lists.
 */
Context.prototype.zip = function(names, values) {
  var top = this.stack[this.stack.length - 1]
    , l = Math.min(names.length, values.length)
  for (var i = 0; i < l; i++) {
    top[names[i]] = values[i]
  }
}

/**
 * Gets variables, checking all context objects from top to bottom.
 *
 * Returns undefined for variables which are not set, to distinguish from
 * variables which are set, but are null.
 */
Context.prototype.get = function(name, d) {
  for (var i = this.stack.length - 1; i >= 0; i--) {
    if (object.hasOwn(this.stack[i], name)) {
      return this.stack[i][name]
    }
  }
  return d !== undefined ? d : null
}

/**
 * Determines if a particular key is set in the context.
 */
Context.prototype.hasKey = function(name) {
  for (var i = 0, l = this.stack.length; i < l; i++) {
    if (object.hasOwn(this.stack[i], name)) {
      return true
    }
  }
  return false
}

/**
 * Context specific to template rendering.
 */
function RenderContext(initial) {
  this.stack = [initial || {}]
}
object.inherits(RenderContext, Context)

RenderContext.prototype.get = function(name, d) {
  var top = this.stack[this.stack.length - 1]
  if (object.hasOwn(top, name)) {
    return top[name]
  }
  return d !== undefined ? d : null
}

RenderContext.prototype.hasKey = function(name) {
  return object.hasOwn(this.stack[this.stack.length - 1], name)
}

/**
 * Context for block inheritance at render time.
 *
 * Each block in the current template being rendered is added to a First In,
 * First Out queue spcific to its block name. As rendering proceeds up through
 * inherited templates, the blocks which were most deeply defined will be at the
 * head of their respective queues when the root template starts rendering block
 * contents.
 */
function BlockContext() {
  this.blocks = {} // FIFO queues by block name
}

BlockContext.prototype.addBlocks = function(blocks) {
  for (var name in blocks) {
    if (typeof this.blocks[name] != 'undefined') {
      this.blocks[name].unshift(blocks[name])
    }
    else {
      this.blocks[name] = [blocks[name]]
    }
  }
}

BlockContext.prototype.push = function(name, block) {
  this.blocks[name].push(block)
}

BlockContext.prototype.pop = function(name) {
  if (typeof this.blocks[name] != 'undefined' &&
      this.blocks[name].length) {
    return this.blocks[name].pop()
  }
  return null
}

BlockContext.prototype.getBlock = function(name) {
  if (typeof this.blocks[name] != 'undefined') {
    var blocks = this.blocks[name]
    if (blocks.length) {
      return blocks[blocks.length - 1]
    }
  }
  return null
}

//  --------------------------------------------------------------- Template ---

function Template(props, contents) {
  if (is.String(props)) {
    this.name = props
  }
  else {
    this.name = props.name
    this.parent = props.extend || null
  }
  this.contents = contents
  this.blocks = blockLookup(findNodesByType(contents, BlockNode))

  // Ensure any top level contents which need to be wrapped are processed
  TemplateNode.prototype.parseContents.call(this)
  // Add ourselves to the template lookup
  templates[this.name] = this
}

/**
 * Creates a new rendering context and renders the template.
 */
Template.prototype.render = function(context) {
  // Allow plain objects to be passed in as context
  if (!(context instanceof Context)) {
    context = Context(context)
  }
  context.renderContext.push()
  try {
    return this._render(context)
  }
  finally {
    context.renderContext.pop()
  }
}

/**
 * Rendering implementation - adds blocks to rendering context and either calls
 * render on a parent template, or renders contents if this is a top-level
 * template.
 */
Template.prototype._render = function(context) {
  if (!context.renderContext.hasKey(BLOCK_CONTEXT_KEY)) {
    context.renderContext.set(BLOCK_CONTEXT_KEY, new BlockContext())
  }
  var blockContext = context.renderContext.get(BLOCK_CONTEXT_KEY)
  blockContext.addBlocks(this.blocks)
  if (this.parent) {
    // Call _render directly to add to the current render context
    return getTemplate(this.parent)._render(context)
  }
  else {
    // Top-level template - render contents
    return DOMBuilder.fragment(render(this.contents, context))
  }
}

// ---------------------------------------------------------- Template Nodes ---

/**
 * Base for template content nodes.
 */
var TemplateNode = Concur.extend({
  constructor: function(contents) {
    this.contents = contents || []
    if (this.contents.length) {
      this.parseContents()
    }
  }
})

/**
 * Wraps any contents which can be specified without a Node for convenience with
 * an appropriate Node.
 */
TemplateNode.prototype.parseContents = function() {
  for (var i = 0, l = this.contents.length, node; i < l; i++) {
    node = this.contents[i]
    // Strings which contain template variables should be wrapped in a TextNode
    if (is.String(node) && VARIABLE_RE.test(node)) {
      this.contents[i] = new TextNode(node)
    }
  }
}

/**
 * A named section which may be overridden by child templates.
 */
function BlockNode(name, contents) {
  this.name = is.String(name) ? name : name.name
  TemplateNode.call(this, contents)
}
object.inherits(BlockNode, TemplateNode)

BlockNode.prototype.render = function(context) {
  var blockContext = context.renderContext.get(BLOCK_CONTEXT_KEY)
    , results, push, block
  context.push()
  if (blockContext === null) {
    context.set('block', this)
    results = render(this.contents, context)
  }
  else {
    push = block = blockContext.pop(this.name)
    if (block === null) {
      block = this
    }
    block = new BlockNode(block.name, block.contents)
    block.context = context
    context.set('block', block)
    results = render(block.contents, context)
    if (push !== null) {
      blockContext.push(this.name, push)
    }
  }
  context.pop()
  return results
}

BlockNode.prototype['super'] = function(context) {
  var renderContext = this.context.renderContext
  if (renderContext.hasKey(BLOCK_CONTEXT_KEY) &&
      renderContext.get(BLOCK_CONTEXT_KEY).getBlock(this.name) !== null) {
    return this.render(this.context)
  }
  return ''
}

/**
 * Includes the contents of another template, optionally with some extra
 * context variables.
 */
function IncludeNode(template, extraContext, only) {
  this.template = template
  this.extraContext = extraContext || {}
  this.only = only || false
}
object.inherits(IncludeNode, TemplateNode)

IncludeNode.prototype.render = function(context) {
  var templateName = (this.template instanceof Variable
                      ? this.template.resolve(context)
                      : this.template)
    , template = (is.Array(templateName)
                  ? selectTemplate(templateName)
                  : getTemplate(templateName))
    , extraContext = {}
    , name
    , value
  // Create a copy of extra context, resolving any variables
  for (name in this.extraContext) {
    value = this.extraContext[name]
    extraContext[name] = (value instanceof Variable
                          ? value.resolve(context)
                          : value)
  }
  if (this.only) {
    return template.render(extraContext)
  }
  else {
    context.push(extraContext)
    var results = template.render(context)
    context.pop()
    return results
  }
}

/**
 * An HTML element and its contents.
 */
function ElementNode(tagName, attributes, contents) {
  this.tagName = tagName
  this.attributes = object.extend({}, attributes)
  this.dynamicAttrs = false
  // Attributes which contain template variables should be wrapped in a TextNode
  for (var name in this.attributes) {
    var attr = this.attributes[name]
    if (is.String(attr) && VARIABLE_RE.test(attr)) {
      this.attributes[name] = new TextNode(attr)
      if (!this.dynamicAttrs) {
        this.dynamicAttrs = true
      }
    }
    else if ((attr instanceof TemplateNode || attr instanceof Variable) &&
             !this.dynamicAttrs) {
      this.dynamicAttrs = true
    }
  }
  TemplateNode.call(this, contents)
}
object.inherits(ElementNode, TemplateNode)

ElementNode.prototype.render = function(context) {
  return DOMBuilder.createElement(this.tagName,
                                  (this.dynamicAttrs
                                   ? this.renderAttributes(context)
                                   : this.attributes),
                                  render(this.contents, context))
}

ElementNode.prototype.renderAttributes = function(context) {
  var attributes = {}, name, attr, result
  for (name in this.attributes) {
    attr = this.attributes[name]
    if (attr instanceof TemplateNode) {
      result = attr.render(context)
      if (is.Array(result)) {
        result = array.flatten(result).join('')
      }
      attributes[name] = result
    }
    else if (attr instanceof Variable) {
      attributes[name] = attr.resolve(context)
    }
    else {
      attributes[name] = attr
    }
  }
  return attributes
}

/**
 * Supports looping over a list obtained from the context, creating new
 * context variables with list contents and calling render on all its
 * contents.
 */
function ForNode(expr, contents) {
  this._parseExpr(expr)
  this.emptyContents = ((contents.length &&
                         contents[contents.length - 1] instanceof EmptyNode)
                        ? contents.pop().contents
                        : [])
  TemplateNode.call(this, contents)
}
object.inherits(ForNode, TemplateNode)

ForNode.prototype._parseExpr = function(expr) {
  var bits = splitBits(expr, FOR_RE)
  if (bits.length != 4 || bits[1] != ' in ' || bits[3] !== '') {
    throw new TemplateSyntaxError('Invalid ForNode expression: ' + expr)
  }
  this.loopVars = bits[0].split(UNPACK_SEPARATOR_RE)
  this.listVar = new Variable(bits[2])
}

ForNode.prototype.render = function(context) {
  var list = this.listVar.resolve(context)
    , results = []
    , forloop = {parentloop: context.get('forloop', {})}
    , l = list.length
    , item
  if (list.length < 1) {
    return render(this.emptyContents, context)
  }
  context.push()
  context.set('forloop', forloop)
  for (var i = 0; i < l; i++) {
    item = list[i]
    // Set current item(s) in context variable(s)
    if (this.loopVars.length === 1) {
      context.set(this.loopVars[0], item)
    }
    else {
      context.zip(this.loopVars, item)
    }
    // Update loop status variables
    forloop.counter = i + 1
    forloop.counter0 = i
    forloop.revcounter = l - i
    forloop.revcounter0 = l - i - 1
    forloop.first = (i === 0)
    forloop.last = (i === l - 1)
    // Render contents
    results.push.apply(results, render(this.contents, context))
  }
  context.pop()
  return results
}

/**
 * Provides content for a ForNode if its list of items is empty. Instances of
 * this node will be ignored unless they are the last node in a ForNode's
 * content.
 */
function EmptyNode(contents) {
  TemplateNode.call(this, contents)
}
object.inherits(EmptyNode, TemplateNode)
EmptyNode.prototype.render = function(context) {
  return []
}

/**
 * Executes a boolean test using variables obtained from the context,
 * calling render on its contents if the result is true. If the last content
 * item is an ElseNode, its contents will be rendered if the test is false.
 */
function IfNode(expr, contents) {
  if (is.Function(expr)) {
    this.test = expr
  }
  else {
    this.test = this._parseExpr(expr)
  }
  this.elseContents = ((contents.length &&
                        contents[contents.length - 1] instanceof ElseNode)
                       ? contents.pop().contents
                       : [])
  TemplateNode.call(this, contents)
}
object.inherits(IfNode, TemplateNode)

IfNode.prototype._parseExpr = (function() {
  var ops = object.lookup('( ) && || == === <= < >= > != !== !! !'.split(' '))
    , opsRE = /(\(|\)|&&|\|\||={2,3}|<=|<|>=|>|!={1,2}|!{1,2})/
    , numberRE = /^-?(?:\d+(?:\.\d+)?|(?:\d+)?\.\d+)$/
    , quotes = object.lookup(['"', "'"])
    , isQuotedString = function(s) {
        var q = s.charAt(0)
        return (s.length > 1 &&
                typeof quotes[q] != 'undefined' &&
                s.lastIndexOf(q) == s.length - 1)
      }
  return function(expr) {
    var code = ['return (']
      , bits = splitBits(expr, opsRE)
    for (var i = 0, l = bits.length, bit; i < l; i++) {
      bit = bits[i]
      if (typeof ops[bit] != 'undefined') {
        code.push(bit)
      }
      else {
        bit = bit.replace(TRIM_RE, '')
        if (bit) {
          if (numberRE.test(bit) || isQuotedString(bit)) {
            code.push(bit)
          }
          else {
            code.push('new FilterExpression("' + escapeString(bit) + '").resolve(c, true)')
          }
        }
      }
    }
    code.push(');')
    try {
      var func = new Function('c', 'FilterExpression', code.join(' '))
      return function(context) {
        return func(context, FilterExpression)
      }
    }
    catch (e) {
      throw new TemplateSyntaxError('Invalid $if expression (' + e.message +
                                    '): ' + expr)
    }
  }
})()

IfNode.prototype.render = function(context) {
  return render(this.test(context) ? this.contents : this.elseContents, context)
}

/**
 * Provides content for an IfNode when its test returns ``false``. Instances of
 * this node will be ignored unless they are the last node in an IfNodes's
 * content.
 */
function ElseNode(contents) {
  TemplateNode.call(this, contents)
}
object.inherits(ElseNode, TemplateNode)
ElseNode.prototype.render = function(context) {
  return []
}

/**
 * Wraps static text context and text context which contains template variable
 * definitions to be inserted at render time.
 */
function TextNode(text) {
  this.dynamic = VARIABLE_RE.test(text)
  if (this.dynamic) {
    this.func = this._parseExpr(text)
  }
  else {
    this.text = text
  }
}
object.inherits(TextNode, TemplateNode)

/**
 * Creates a function which accepts context and performs replacement by
 * variable resolution on the given expression.
 */
TextNode.prototype._parseExpr = function(expr) {
  var code = ['var a = []']
    , bits = splitBits(expr, VARIABLE_RE)
  for (var i = 0, l = bits.length, bit; i < l; i++) {
    bit = bits[i]
    if (i % 2) {
      code.push('a.push(new Variable("' +
                escapeString(bit.replace(TRIM_RE, '')) +
                '").resolve(c))')
    }
    else if (bit) {
      code.push('a.push("' + escapeString(bit) + '")')
    }
  }
  code.push('return a')
  var func = new Function('c', 'Variable', code.join(';'))
  return function(context) {
    return func(context, Variable)
  }
}

TextNode.prototype.render = function(context) {
  return (this.dynamic ? this.func(context) : [this.text])
}

/**
 * Cycles over a list of values, producing the next value on each render.
 */
function CycleNode(values, options) {
  this.values = values
  options = object.extend({as: null, silent: false}, options || {})
  this.variableName = options.as
  this.silent = options.silent
  // Generate a unique id for each CycleNode
  this.id = 'cycle' + CycleNode.cycleId++
}
object.inherits(CycleNode, TemplateNode)

CycleNode.cycleId = 1

CycleNode.prototype.render = function(context) {
  var nextIndex = context.renderContext.get(this.id, 0)
    , value = this.values[nextIndex]
  context.renderContext.set(this.id, (nextIndex + 1) % this.values.length)
  if (value instanceof Variable) {
    value = value.resolve(context)
  }
  if (this.variableName) {
    context.set(this.variableName, value)
  }
  if (this.silent) {
    return []
  }
  return value
}

function DoctypeNode(version) {
  this.version = version || 5
}
object.inherits(DoctypeNode, TemplateNode)
DoctypeNode.prototype.render = function(context) {
  var doctype = DOCTYPES[this.version] || ''
  return (DOMBuilder.html ? DOMBuilder.html.markSafe(doctype) : doctype)
}

// === Register mode plugin ====================================================

DOMBuilder.addMode({
  name: 'template'
, createElement: function(tagName, attributes, children) {
    return new ElementNode(tagName, attributes, children)
  }
, textNode: function(text) {
    return text
  }
, fragment: function(children) {
    return children
  }
, isModeObject: function(obj) {
    return (obj instanceof TemplateNode || obj instanceof Variable)
  }
, api: {
    DOCTYPES: DOCTYPES
  , templates: templates
  , ContextPopError: ContextPopError
  , VariableNotFoundError: VariableNotFoundError
  , TemplateSyntaxError: TemplateSyntaxError
  , TemplateNotFoundError: TemplateNotFoundError
  , renderTemplate: renderTemplate
  , getTemplate: getTemplate
  , selectTemplate: selectTemplate
  , FilterExpression: FilterExpression
  , Variable: Variable
  , Context: Context
  , RenderContext: RenderContext
  , BlockContext: BlockContext
  , Template: Template
  , TemplateNode: TemplateNode
  , BlockNode: BlockNode
  , IncludeNode: IncludeNode
  , ElementNode: ElementNode
  , ForNode: ForNode
  , EmptyNode: EmptyNode
  , IfNode: IfNode
  , ElseNode: ElseNode
  , TextNode: TextNode
  , CycleNode: CycleNode
  }
, apply: {
    Context: Context
  , renderTemplate: renderTemplate
  , $template: function(props) {
      return new Template(props, array.flatten(slice.call(arguments, 1)))
    }
  , $doctype: function(version) {
      return new DoctypeNode(version)
    }
  , $block: function(name) {
      return new BlockNode(name, array.flatten(slice.call(arguments, 1)))
    }
  , $include: function(template, extraContext, only) {
      return new IncludeNode(template, extraContext, only)
    }
  , $var: function(expr) {
      return new Variable(expr)
    }
  , $func: function(expr) {
      return new Variable(expr, false)
    }
  , $text: function(expr) {
      return new TextNode(expr)
    }
  , $for: function(props) {
      return new ForNode(props, array.flatten(slice.call(arguments, 1)))
    }
  , $empty: function() {
      return new EmptyNode(array.flatten(slice.call(arguments)))
    }
  , $if: function(expr) {
      return new IfNode(expr, array.flatten(slice.call(arguments, 1)))
    }
  , $else: function() {
      return new ElseNode(array.flatten(slice.call(arguments)))
    }
  , $cycle: function(values, options) {
      return new CycleNode(values, options)
    }
  }
})
})

require.define("DOMBuilder", function(module, exports, require) {
var DOMBuilder = require('./dombuilder/core')
require('./dombuilder/dom')
require('./dombuilder/html')
require('./dombuilder/template')
module.exports = DOMBuilder
})

require.define("punycode", function(module, exports, require) {
/*! http://mths.be/punycode by @mathias */
;(function(root) {

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Detect free variables `define`, `exports`, `module` and `require` */
	freeDefine = typeof define == 'function' && typeof define.amd == 'object' &&
		define.amd && define,
	freeExports = typeof exports == 'object' && exports,
	freeModule = typeof module == 'object' && module,
	freeRequire = typeof require == 'function' && require,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexPunycode = /^xn--/,

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process.',
		'ucs2decode': 'UCS-2(decode): illegal sequence',
		'ucs2encode': 'UCS-2(encode): illegal value',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var glue = '.';
		return map(string.split(glue), fn).join(glue);
	}

	/**
	 * Creates an array containing the decimal code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if ((value & 0xF800) == 0xD800) {
				extra = string.charCodeAt(counter++);
				if ((value & 0xFC00) != 0xD800 || (extra & 0xFC00) != 0xDC00) {
					error('ucs2decode');
				}
				value = ((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
			}
			output.push(value);
		}
		return output;
	}

	/**
	 * Creates a string based on an array of decimal code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of decimal code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if ((value & 0xF800) == 0xD800) {
				error('ucs2encode');
			}
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic (decimal) code point.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		return codePoint - 48 < 10
			? codePoint - 22
			: codePoint - 65 < 26
				? codePoint - 65
				: codePoint - 97 < 26
					? codePoint - 97
					: base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if flag is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a basic code point to lowercase is `flag` is falsy, or to
	 * uppercase if `flag` is truthy. The code point is unchanged if it's
	 * caseless. The behavior is undefined if `codePoint` is not a basic code
	 * point.
	 * @private
	 * @param {Number} codePoint The numeric value of a basic code point.
	 * @returns {Number} The resulting basic code point.
	 */
	function encodeBasic(codePoint, flag) {
		codePoint -= (codePoint - 97 < 26) << 5;
		return codePoint + (!flag && codePoint - 65 < 26) << 5;
	}

	/**
	 * Converts a Punycode string of ASCII code points to a string of Unicode
	 * code points.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII code points.
	 * @returns {String} The resulting string of Unicode code points.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    length,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode code points to a Punycode string of ASCII
	 * code points.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode code points.
	 * @returns {String} The resulting Punycode string of ASCII code points.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.0.0',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to decimal Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	if (freeExports) {
		if (freeModule && freeModule.exports == freeExports) {
			// in Node.js or Ringo 0.8+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or Ringo 0.7-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else if (freeDefine) {
		// via curl.js or RequireJS
		define('punycode', punycode);
	} else {
		// in a browser or Rhino
		root.punycode = punycode;
	}

}(this));})

require.define("./errors", function(module, exports, require) {
var Concur = require('Concur')
  , is = require('isomorph/is')
  , object = require('isomorph/object')

/**
 * A validation error, containing a list of messages. Single messages
 * (e.g. those produced by validators may have an associated error code
 * and parameters to allow customisation by fields.
 */
var ValidationError = Concur.extend({
  constructor: function(message, kwargs) {
    if (!(this instanceof ValidationError)) return new ValidationError(message, kwargs)
    kwargs = object.extend({code: null, params: null}, kwargs)
    if (is.Array(message)) {
      this.messages = message
    }
    else {
      this.code = kwargs.code
      this.params = kwargs.params
      this.messages = [message]
    }
  }
})

ValidationError.prototype.toString = function() {
  return ('ValidationError: ' + this.messages.join('; '))
}

module.exports = {
  ValidationError: ValidationError
}
})

require.define("./ipv6", function(module, exports, require) {
var object = require('isomorph/object')

var errors = require('./errors')

var ValidationError = errors.ValidationError

var hexRE = /^[0-9a-f]+$/

/**
 * Cleans a IPv6 address string.
 *
 *  Validity is checked by calling isValidIPv6Address() - if an invalid address
 *  is passed, a ValidationError is thrown.
 *
 * Replaces the longest continious zero-sequence with '::' and removes leading
 * zeroes and makes sure all hextets are lowercase.
 */
function cleanIPv6Address(ipStr, kwargs) {
  kwargs = object.extend({
    unpackIPv4: false, errorMessage: 'This is not a valid IPv6 address'
  }, kwargs)

  var bestDoublecolonStart = -1
    , bestDoublecolonLen = 0
    , doublecolonStart = -1
    , doublecolonLen = 0

  if (!isValidIPv6Address(ipStr)) {
    throw ValidationError(kwargs.errorMessage)
  }

  // This algorithm can only handle fully exploded IP strings
  ipStr = _explodeShorthandIPstring(ipStr)
  ipStr = _sanitiseIPv4Mapping(ipStr)

  // If needed, unpack the IPv4 and return straight away
  if (kwargs.unpackIPv4) {
    var ipv4Unpacked = _unpackIPv4(ipStr)
    if (ipv4Unpacked) {
      return ipv4Unpacked
    }
  }

  var hextets = ipStr.split(':')

  for (var i = 0, l = hextets.length; i < l; i++) {
    // Remove leading zeroes
    hextets[i] = hextets[i].replace(/^0+/, '')
    if (hextets[i] == '') {
      hextets[i] = '0'
    }

    // Determine best hextet to compress
    if (hextets[i] == '0') {
      doublecolonLen += 1
      if (doublecolonStart == -1) {
        // Start a sequence of zeros
        doublecolonStart = i
      }
      if (doublecolonLen > bestDoublecolonLen) {
        // This is the longest sequence so far
        bestDoublecolonLen = doublecolonLen
        bestDoublecolonStart = doublecolonStart
      }
    }
    else {
      doublecolonLen = 0
      doublecolonStart = -1
    }
  }

  // Compress the most suitable hextet
  if (bestDoublecolonLen > 1) {
    var bestDoublecolonEnd = bestDoublecolonStart + bestDoublecolonLen
    // For zeros at the end of the address
    if (bestDoublecolonEnd == hextets.length) {
      hextets.push('')
    }
    hextets.splice(bestDoublecolonStart, bestDoublecolonLen, '')
    // For zeros at the beginning of the address
    if (bestDoublecolonStart == 0) {
      hextets.unshift('')
    }
  }

  return hextets.join(':').toLowerCase()
}

/**
 * Sanitises IPv4 mapping in a expanded IPv6 address.
 *
 * This converts ::ffff:0a0a:0a0a to ::ffff:10.10.10.10.
 * If there is nothing to sanitise, returns an unchanged string.
 */
function _sanitiseIPv4Mapping(ipStr) {
  if (ipStr.toLowerCase().indexOf('0000:0000:0000:0000:0000:ffff:') != 0) {
    // Not an ipv4 mapping
    return ipStr
  }

  var hextets = ipStr.split(':')

  if (hextets[hextets.length - 1].indexOf('.') != -1) {
    // Already sanitized
    return ipStr
  }

  var ipv4Address = [
    parseInt(hextets[6].substring(0, 2), 16)
  , parseInt(hextets[6].substring(2, 4), 16)
  , parseInt(hextets[7].substring(0, 2), 16)
  , parseInt(hextets[7].substring(2, 4), 16)
  ].join('.')

  return hextets.slice(0, 6).join(':') +  ':' + ipv4Address
}

/**
 * Unpacks an IPv4 address that was mapped in a compressed IPv6 address.
 *
 * This converts 0000:0000:0000:0000:0000:ffff:10.10.10.10 to 10.10.10.10.
 * If there is nothing to sanitize, returns null.
 */
function _unpackIPv4(ipStr) {
  if (ipStr.toLowerCase().indexOf('0000:0000:0000:0000:0000:ffff:') != 0) {
    return null
  }

  var hextets = ipStr.split(':')
  return hextets.pop()
}

/**
 * Determines if we have a valid IPv6 address.
 */
function isValidIPv6Address(ipStr) {
  var validateIPv4Address = require('./validators').validateIPv4Address

  // We need to have at least one ':'
  if (ipStr.indexOf(':') == -1) {
    return false
  }

  // We can only have one '::' shortener
  if (String_count(ipStr, '::') > 1) {
    return false
  }

  // '::' should be encompassed by start, digits or end
  if (ipStr.indexOf(':::') != -1) {
    return false
  }

  // A single colon can neither start nor end an address
  if ((ipStr.charAt(0) == ':' && ipStr.charAt(1) != ':') ||
      (ipStr.charAt(ipStr.length - 1) == ':' &&
       ipStr.charAt(ipStr.length - 2) != ':')) {
    return false
  }

  // We can never have more than 7 ':' (1::2:3:4:5:6:7:8 is invalid)
  if (String_count(ipStr, ':') > 7) {
    return false
  }

  // If we have no concatenation, we need to have 8 fields with 7 ':'
  if (ipStr.indexOf('::') == -1 && String_count(ipStr, ':') != 7) {
    // We might have an IPv4 mapped address
    if (String_count(ipStr, '.') != 3) {
      return false
    }
  }

  ipStr = _explodeShorthandIPstring(ipStr)

  // Now that we have that all squared away, let's check that each of the
  // hextets are between 0x0 and 0xFFFF.
  var hextets = ipStr.split(':')
  for (var i = 0, l = hextets.length, hextet; i < l; i++) {
    hextet = hextets[i]
    if (String_count(hextet, '.') == 3) {
      // If we have an IPv4 mapped address, the IPv4 portion has to
      // be at the end of the IPv6 portion.
      if (ipStr.split(':').pop() != hextet) {
        return false
      }
      try {
        validateIPv4Address.__call__(hextet)
      }
      catch (e) {
        if (!(e instanceof ValidationError)) {
          throw e
        }
        return false
      }
    }
    else {
      if (!hexRE.test(hextet)) {
        return false
      }
      var intValue = parseInt(hextet, 16)
      if (isNaN(intValue) || intValue < 0x0 || intValue > 0xFFFF) {
        return false
      }
    }
  }

  return true
}

/**
 * Expands a shortened IPv6 address.
 */
function _explodeShorthandIPstring(ipStr) {
  if (!_isShortHand(ipStr)) {
    // We've already got a longhand ipStr
    return ipStr
  }

  var newIp = []
    , hextets = ipStr.split('::')

  // If there is a ::, we need to expand it with zeroes to get to 8 hextets -
  // unless there is a dot in the last hextet, meaning we're doing v4-mapping
  var fillTo = (ipStr.split(':').pop().indexOf('.') != -1) ? 7 : 8

  if (hextets.length > 1) {
    var sep = hextets[0].split(':').length + hextets[1].split(':').length
    newIp = hextets[0].split(':')
    for (var i = 0, l = fillTo - sep; i < l; i++) {
      newIp.push('0000')
    }
    newIp = newIp.concat(hextets[1].split(':'))
  }
  else {
    newIp = ipStr.split(':')
  }

  // Now need to make sure every hextet is 4 lower case characters.
  // If a hextet is < 4 characters, we've got missing leading 0's.
  var retIp = []
  for (var i = 0, l = newIp.length; i < l; i++) {
    retIp.push(zeroPadding(newIp[i], 4) + newIp[i].toLowerCase())
  }
  return retIp.join(':')
}

/**
 * Determines if the address is shortened.
 */
function _isShortHand(ipStr) {
  if (String_count(ipStr, '::') == 1) {
    return true
  }
  var parts = ipStr.split(':')
  for (var i = 0, l = parts.length; i < l; i++) {
    if (parts[i].length < 4) {
      return true
    }
  }
  return false
}

// Utilities

function zeroPadding(str, length) {
  if (str.length >= length) {
    return ''
  }
  return new Array(length - str.length + 1).join('0')
}

function String_count(str, subStr) {
  return str.split(subStr).length - 1
}

module.exports = {
  cleanIPv6Address: cleanIPv6Address
, isValidIPv6Address: isValidIPv6Address
}
})

require.define(["./validators","validators"], function(module, exports, require) {
var Concur = require('Concur')
  , is = require('isomorph/is')
  , format = require('isomorph/format').formatObj
  , punycode = require('punycode')
  , url = require('isomorph/url')

var errors = require('./errors')
  , ipv6 = require('./ipv6')

var ValidationError = errors.ValidationError
  , isValidIPv6Address = ipv6.isValidIPv6Address

var EMPTY_VALUES = [null, undefined, '']

var isEmptyValue = function(value) {
  for (var i = 0, l = EMPTY_VALUES.length; i < l; i++) {
    if (value === EMPTY_VALUES[i]) {
      return true
    }
  }
  return false
}

function isCallable(o) {
  return (is.Function(o) || is.Function(o.__call__))
}

/**
 * Calls a validator, which may be a function or an objects with a
 * __call__ method, with the given value.
 */
function callValidator(v, value) {
  if (is.Function(v)) {
    v(value)
  }
  else if (is.Function(v.__call__)) {
    v.__call__(value)
  }
}

// See also http://tools.ietf.org/html/rfc2822#section-3.2.5
var EMAIL_RE = new RegExp(
      "(^[-!#$%&'*+/=?^_`{}|~0-9A-Z]+(\\.[-!#$%&'*+/=?^_`{}|~0-9A-Z]+)*"                                // Dot-atom
    + '|^"([\\001-\\010\\013\\014\\016-\\037!#-\\[\\]-\\177]|\\\\[\\001-\\011\\013\\014\\016-\\177])*"' // Quoted-string
    + ')@((?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+[A-Z]{2,6}\\.?$)'                                 // Domain
    + '|\\[(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)){3}\\]$'              // Literal form, ipv4 address (SMTP 4.1.3)
    , 'i'
    )
  , SLUG_RE = /^[-\w]+$/
  , IPV4_RE = /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/
  , COMMA_SEPARATED_INT_LIST_RE = /^[\d,]+$/

/**
 * Validates that input matches a regular expression.
 */
var RegexValidator = Concur.extend({
  constructor: function(regex, message, code) {
    if (!(this instanceof RegexValidator)) return new RegexValidator(regex, message, code)
    if (regex) {
      this.regex = regex
    }
    if (message) {
      this.message = message
    }
    if (code) {
      this.code = code
    }
    if (is.String(this.regex)) {
      this.regex = new RegExp(this.regex)
    }
  }
, regex: ''
, message: 'Enter a valid value.'
, code: 'invalid'
, __call__: function(value) {
    if (!this.regex.test(value)) {
      throw ValidationError(this.message, {code: this.code})
    }
  }
})

/**
 * Validates that input looks like a valid URL.
 */
var URLValidator = RegexValidator.extend({
  constructor:function() {
    if (!(this instanceof URLValidator)) return new URLValidator()
    RegexValidator.call(this)
  }
, regex: new RegExp(
    '^(?:http|ftp)s?://'                              // http:// or https://
  + '(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+' // Domain...
  + '(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|'
  + 'localhost|'                                      // localhost...
  + '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})'      // ...or IP
  + '(?::\\d+)?'                                      // Optional port
  + '(?:/?|[/?]\\S+)$'
  , 'i'
  )
, message: 'Enter a valid URL.'
, __call__: function(value) {
    try {
      RegexValidator.prototype.__call__.call(this, value)
    }
    catch (e) {
      if (!(e instanceof ValidationError) || !value) {
        throw e
      }

      // Trivial case failed - try for possible IDN domain
      var urlFields = url.parseUri(value)
      try {
        urlFields.host = punycode.toASCII(urlFields.host)
      }
      catch (ue) {
        throw e
      }
      value = url.makeUri(urlFields)
      RegexValidator.prototype.__call__.call(this, value)
    }
  }
})

var EmailValidator = RegexValidator.extend({
  constructor: function(regex, message, code) {
    if (!(this instanceof EmailValidator)) return new EmailValidator(regex, message, code)
    RegexValidator.call(this, regex, message, code)
  }
, __call__ : function(value) {
    try {
      RegexValidator.prototype.__call__.call(this, value)
    }
    catch (e) {
      if (!(e instanceof ValidationError) ||
          !value ||
          value.indexOf('@') == -1) {
        throw e
      }

      // Trivial case failed - try for possible IDN domain-part
      var parts = value.split('@')
      try {
        parts[parts.length - 1] = punycode.toASCII(parts[parts.length - 1])
      }
      catch (ue) {
        throw e
      }
      RegexValidator.prototype.__call__.call(this, parts.join('@'))
    }
  }
})

/** Validates that input looks like a valid URL. */
var validateURL = URLValidator()

/** Validates that input looks like a valid e-mail address. */
var validateEmail =
    EmailValidator(EMAIL_RE,
      'Enter a valid e-mail address.',
      'invalid')

/** Validates that input is a valid slug. */
var validateSlug =
    RegexValidator(SLUG_RE,
      'Enter a valid "slug" consisting of letters, numbers, underscores or hyphens.',
      'invalid')

/** Validates that input is a valid IPv4 address. */
var validateIPv4Address =
    RegexValidator(IPV4_RE,
      'Enter a valid IPv4 address.',
      'invalid')

/** Validates that input is a valid IPv6 address. */
function validateIPv6Address(value) {
  if (!isValidIPv6Address(value)) {
    throw ValidationError('Enter a valid IPv6 address.', {code: 'invalid'})
  }
}

/** Validates that input is a valid IPv4 or IPv6 address. */
function validateIPv46Address(value) {
  try {
    validateIPv4Address.__call__(value)
  }
  catch (e) {
    if (!(e instanceof ValidationError)) {
      throw e
    }

    if (!isValidIPv6Address(value)) {
      throw ValidationError('Enter a valid IPv4 or IPv6 address.', {code: 'invalid'})
    }
  }
}

var ipAddressValidatorMap = {
  both: {validators: [validateIPv46Address], message: 'Enter a valid IPv4 or IPv6 address.'}
, ipv4: {validators: [validateIPv4Address], message: 'Enter a valid IPv4 address.'}
, ipv6: {validators: [validateIPv6Address], message: 'Enter a valid IPv6 address.'}
}

/**
 * Depending on the given parameters returns the appropriate validators for
 * a GenericIPAddressField.
 */
function ipAddressValidators(protocol, unpackIPv4) {
  if (protocol != 'both' && unpackIPv4) {
    throw new Error('You can only use unpackIPv4 if protocol is set to "both"')
  }
  protocol = protocol.toLowerCase()
  if (typeof ipAddressValidatorMap[protocol] == 'undefined') {
    throw new Error('The protocol "' + protocol +'" is unknown')
  }
  return ipAddressValidatorMap[protocol]
}

/** Validates that input is a comma-separated list of integers. */
var validateCommaSeparatedIntegerList =
    RegexValidator(COMMA_SEPARATED_INT_LIST_RE,
      'Enter only digits separated by commas.',
      'invalid')

/**
 * Base for validators which compare input against a given value.
 */
var BaseValidator = Concur.extend({
  constructor: function(limitValue) {
    if (!(this instanceof BaseValidator)) return new BaseValidator(limitValue)
    this.limitValue = limitValue
  }
, compare: function(a, b) { return a !== b }
, clean: function(x) { return x }
, message: 'Ensure this value is {limitValue} (it is {showValue}).'
, code: 'limitValue'
, __call__: function(value) {
    var cleaned = this.clean(value)
      , params = {limitValue: this.limitValue, showValue: cleaned}
    if (this.compare(cleaned, this.limitValue)) {
      throw ValidationError(format(this.message, params),
                            {code: this.code, params: params})
    }
  }
})

/**
 * Validates that input is less than or equal to a given value.
 */
var MaxValueValidator = BaseValidator.extend({
  constructor: function(limitValue) {
    if (!(this instanceof MaxValueValidator)) return new MaxValueValidator(limitValue)
    BaseValidator.call(this, limitValue)
  }
, compare: function(a, b) { return a > b }
, message: 'Ensure this value is less than or equal to {limitValue}.'
, code: 'maxValue'
})

/**
 * Validates that input is greater than or equal to a given value.
 */
var MinValueValidator = BaseValidator.extend({
  constructor: function(limitValue) {
    if (!(this instanceof MinValueValidator)) return new MinValueValidator(limitValue)
    BaseValidator.call(this, limitValue)
  }
, compare: function(a, b) { return a < b }
, message: 'Ensure this value is greater than or equal to {limitValue}.'
, code: 'minValue'
})

/**
 * Validates that input is at least a given length.
 */
var MinLengthValidator = BaseValidator.extend({
  constructor: function(limitValue) {
    if (!(this instanceof MinLengthValidator)) return new MinLengthValidator(limitValue)
    BaseValidator.call(this, limitValue)
  }
, compare: function(a, b) { return a < b }
, clean: function(x) { return x.length }
, message: 'Ensure this value has at least {limitValue} characters (it has {showValue}).'
, code: 'minLength'
})

/**
 * Validates that input is at most a given length.
 */
var MaxLengthValidator = BaseValidator.extend({
  constructor: function(limitValue) {
    if (!(this instanceof MaxLengthValidator)) return new MaxLengthValidator(limitValue)
    BaseValidator.call(this, limitValue)
  }
, compare: function(a, b) { return a > b }
, clean: function(x) { return x.length }
, message: 'Ensure this value has at most {limitValue} characters (it has {showValue}).'
, code: 'maxLength'
})

module.exports = {
  EMPTY_VALUES: EMPTY_VALUES
, isEmptyValue: isEmptyValue
, isCallable: isCallable
, callValidator: callValidator
, RegexValidator: RegexValidator
, URLValidator: URLValidator
, EmailValidator: EmailValidator
, validateURL: validateURL
, validateEmail: validateEmail
, validateSlug: validateSlug
, validateIPv4Address: validateIPv4Address
, validateIPv6Address: validateIPv6Address
, validateIPv46Address: validateIPv46Address
, ipAddressValidators: ipAddressValidators
, validateCommaSeparatedIntegerList: validateCommaSeparatedIntegerList
, BaseValidator: BaseValidator
, MaxValueValidator: MaxValueValidator
, MinValueValidator: MinValueValidator
, MaxLengthValidator: MaxLengthValidator
, MinLengthValidator: MinLengthValidator
, ValidationError: ValidationError
, ipv6: ipv6
}
})

require.define("./util", function(module, exports, require) {
var Concur = require('Concur')
  , DOMBuilder = require('DOMBuilder')
  , is = require('isomorph/is')
  , object = require('isomorph/object')

var DEFAULT_DATE_INPUT_FORMATS = [
      '%Y-%m-%d'              // '2006-10-25'
    , '%m/%d/%Y', '%m/%d/%y'  // '10/25/2006', '10/25/06'
    , '%b %d %Y', '%b %d, %Y' // 'Oct 25 2006', 'Oct 25, 2006'
    , '%d %b %Y', '%d %b, %Y' // '25 Oct 2006', '25 Oct, 2006'
    , '%B %d %Y', '%B %d, %Y' // 'October 25 2006', 'October 25, 2006'
    , '%d %B %Y', '%d %B, %Y' // '25 October 2006', '25 October, 2006'
    ]
  , DEFAULT_TIME_INPUT_FORMATS = [
      '%H:%M:%S' // '14:30:59'
    , '%H:%M'    // '14:30'
    ]
  , DEFAULT_DATETIME_INPUT_FORMATS = [
      '%Y-%m-%d %H:%M:%S' // '2006-10-25 14:30:59'
    , '%Y-%m-%d %H:%M'    // '2006-10-25 14:30'
    , '%Y-%m-%d'          // '2006-10-25'
    , '%m/%d/%Y %H:%M:%S' // '10/25/2006 14:30:59'
    , '%m/%d/%Y %H:%M'    // '10/25/2006 14:30'
    , '%m/%d/%Y'          // '10/25/2006'
    , '%m/%d/%y %H:%M:%S' // '10/25/06 14:30:59'
    , '%m/%d/%y %H:%M'    // '10/25/06 14:30'
    , '%m/%d/%y'          // '10/25/06'
    ]

/**
 * Allows an Array, an object with an __iter__ method or a function which
 * returns one be used when ultimately expecting an Array.
 */
function iterate(o) {
  if (is.Array(o)) {
    return o
  }
  if (is.Function(o)) {
    o = o()
  }
  if (o != null && is.Function(o.__iter__)) {
    o = o.__iter__()
  }
  return o || []
}

/**
 * Converts 'firstName' and 'first_name' to 'First name', and
 * 'SHOUTING_LIKE_THIS' to 'SHOUTING LIKE THIS'.
 */
var prettyName = (function() {
  var capsRE = /([A-Z]+)/g
    , splitRE = /[ _]+/
    , trimRE = /(^ +| +$)/g
    , allCapsRE = /^[A-Z][A-Z0-9]+$/

  return function(name) {
    // Prefix sequences of caps with spaces and split on all space
    // characters.
    var parts = name.replace(capsRE, ' $1').split(splitRE)

    // If we had an initial cap...
    if (parts[0] === '') {
      parts.splice(0, 1)
    }

    // Give the first word an initial cap and all subsequent words an
    // initial lowercase if not all caps.
    for (var i = 0, l = parts.length; i < l; i++) {
      if (i == 0) {
        parts[0] = parts[0].charAt(0).toUpperCase() +
                   parts[0].substr(1)
      }
      else if (!allCapsRE.test(parts[i])) {
        parts[i] = parts[i].charAt(0).toLowerCase() +
                   parts[i].substr(1)
      }
    }

    return parts.join(' ')
  }
})()

/**
 * Creates an object representing the data held in a form.
 *
 * @param form a form object or a <code>String</code> specifying a form's
 *        <code>name</code> or <code>id</code> attribute. If a
 *        <code>String</code> is given, name is tried before id when attempting
 *        to find the form.
 *
 * @return an object representing the data present in the form. If the form
 *         could not be found, this object will be empty.
 */
function formData(form) {
  var data = {}
  if (is.String(form)) {
    form = document.forms[form] || document.getElementById(form)
  }
  if (!form) {
    return data
  }

  for (var i = 0, l = form.elements.length; i < l; i++) {
    var element = form.elements[i]
      , type = element.type
      , value = null

    // Retrieve the element's value (or values)
    if (type == 'hidden' || type == 'password' || type == 'text' ||
        type == 'textarea' || ((type == 'checkbox' ||
                                type == 'radio') && element.checked)) {
      value = element.value
    }
    else if (type == 'select-one') {
      value = element.options[element.selectedIndex].value
    }
    else if (type == 'select-multiple') {
      value = []
      for (var j = 0, m = element.options.length; j < m; j++) {
        if (element.options[j].selected) {
          value[value.length] = element.options[j].value
        }
      }
      if (value.length == 0) {
        value = null
      }
    }

    // Add any value obtained to the data object
    if (value !== null) {
      if (object.hasOwn(data, element.name)) {
        if (is.Array(data[element.name])) {
          data[element.name] = data[element.name].concat(value)
        }
        else {
          data[element.name] = [data[element.name], value]
        }
      }
      else {
        data[element.name] = value
      }
    }
  }

  return data
}

/**
 * Coerces to string and strips leading and trailing spaces.
 */
function strip(s) {
  return (''+s).replace(/(^\s+|\s+$)/g, '')
}

/**
 * A collection of errors that knows how to display itself in various formats.
 *
 * This object's properties are the field names, and corresponding values are
 * the errors.
 *
 * @constructor
 */
var ErrorObject = Concur.extend({
  constructor: function(errors) {
    if (!(this instanceof ErrorObject)) return new ErrorObject(errors)
    this.errors = errors || {}
  }
})

ErrorObject.prototype.set = function(name, error) {
  this.errors[name] = error
}

ErrorObject.prototype.get = function(name) {
  return this.errors[name]
}

ErrorObject.prototype.toString = function() {
  return ''+this.defaultRendering()
}

ErrorObject.prototype.defaultRendering = function() {
  return this.asUL()
}

/**
 * Determines if any errors are present.
 *
 * @return {Boolean} <code>true</code> if this object has had any properties
 *                   set, <code>false</code> otherwise.
 */
ErrorObject.prototype.isPopulated = function() {
  for (var name in this.errors) {
    if (object.hasOwn(this.errors, name)) {
      return true
    }
  }
  return false
}

/**
 * Displays error details as a list.
 */
ErrorObject.prototype.asUL = function() {
  var items = []
  for (var name in this.errors) {
    if (object.hasOwn(this.errors, name)) {
      items.push(DOMBuilder.createElement('li', {},
                     [name, this.errors[name].defaultRendering()]))
    }
  }
  if (!items.length) {
    return DOMBuilder.fragment()
  }
  return DOMBuilder.createElement('ul', {'class': 'errorlist'}, items)
}

/**
 * Displays error details as text.
 */
ErrorObject.prototype.asText = function() {
  var items = []
  for (var name in this.errors) {
    if (object.hasOwn(this.errors, name)) {
      items.push('* ' + name)
      var errorList = this.errors[name]
      for (var i = 0, l = errorList.errors.length; i < l; i++) {
        items.push('  * ' + errorList.errors[i])
      }
    }
  }
  return items.join('\n')
}

/**
 * A list of errors which knows how to display itself in various formats.
 *
 * @param {Array} [errors] a list of errors.
 * @constructor
 */
var ErrorList = Concur.extend({
  constructor: function(errors) {
    if (!(this instanceof ErrorList)) return new ErrorList(errors)
    this.errors = errors || []
  }
})

ErrorList.prototype.toString = function() {
  return ''+this.defaultRendering()
}

ErrorList.prototype.defaultRendering = function() {
  return this.asUL()
}

/**
 * Adds errors from another ErrorList.
 *
 * @param {ErrorList} errorList an ErrorList whose errors should be added.
 */
ErrorList.prototype.extend = function(errorList) {
  this.errors = this.errors.concat(errorList.errors)
}

/**
 * Displays errors as a list.
 */
ErrorList.prototype.asUL = function() {
  return DOMBuilder.createElement('ul', {'class': 'errorlist'},
      DOMBuilder.map('li', {}, this.errors))
}

/**
 * Displays errors as text.
 */
ErrorList.prototype.asText = function() {
  var items = []
  for (var i = 0, l = this.errors.length; i < l; i++) {
    items.push('* ' + this.errors[i])
  }
  return items.join('\n')
}

/**
 * Determines if any errors are present.
 *
 * @return {Boolean} <code>true</code> if this object contains any errors
 *                   <code>false</code> otherwise.
 */
ErrorList.prototype.isPopulated = function() {
  return this.errors.length > 0
}

module.exports = {
  DEFAULT_DATE_INPUT_FORMATS: DEFAULT_DATE_INPUT_FORMATS
, DEFAULT_TIME_INPUT_FORMATS: DEFAULT_TIME_INPUT_FORMATS
, DEFAULT_DATETIME_INPUT_FORMATS: DEFAULT_DATETIME_INPUT_FORMATS
, ErrorObject: ErrorObject
, ErrorList: ErrorList
, formData: formData
, iterate: iterate
, prettyName: prettyName
, strip: strip
}
})

require.define("./widgets", function(module, exports, require) {
var Concur = require('Concur')
  , DOMBuilder = require('DOMBuilder')
  , is = require('isomorph/is')
  , format = require('isomorph/format').formatObj
  , object = require('isomorph/object')
  , time = require('isomorph/time')

var util = require('./util')

/**
 * Some widgets are made of multiple HTML elements -- namely, RadioSelect.
 * This represents the "inner" HTML element of a widget.
 */
var SubWidget = Concur.extend({
  constructor: function(parentWidget, name, value, kwargs) {
    if (!(this instanceof SubWidget)) {
      return new SubWidget(parentWidget, name, value, kwargs)
    }
    this.parentWidget = parentWidget
    this.name = name
    this.value = value
    kwargs = object.extend({attrs: null, choices: []}, kwargs)
    this.attrs = kwargs.attrs
    this.choices = kwargs.choices
  }
})

SubWidget.prototype.toString = function() {
  return ''+this.render()
}

SubWidget.prototype.render = function() {
  var kwargs = {attrs: this.attrs}
  if (this.choices.length) {
    kwargs.choices = this.choices
  }
  return this.parentWidget.render(this.name, this.value, kwargs)
}

/**
 * An HTML form widget.
 * @constructor
 * @param {Object=} kwargs
 */
var Widget = Concur.extend({
  constructor: function(kwargs) {
    kwargs = object.extend({attrs: null}, kwargs)
    this.attrs = object.extend({}, kwargs.attrs)
  }
  /** Determines whether this corresponds to an <input type="hidden">. */
, isHidden: false
  /** Determines whether this widget needs a multipart-encoded form. */
, needsMultipartForm: false
, isRequired: false
})

/**
 * Yields all "subwidgets" of this widget. Used only by RadioSelect to
 * allow access to individual <input type="radio"> buttons.
 *
 * Arguments are the same as for render().
 */
Widget.prototype.subWidgets = function(name, value, kwargs) {
  return [SubWidget(this, name, value, kwargs)]
}

/**
 * Returns this Widget rendered as HTML.
 *
 * The 'value' given is not guaranteed to be valid input, so subclass
 * implementations should program defensively.
 */
Widget.prototype.render = function(name, value, kwargs) {
  throw new Error('Constructors extending must implement a render() method.')
}

/**
 * Helper function for building an attribute dictionary.
 */
Widget.prototype.buildAttrs = function(extraAttrs, kwargs) {
  var attrs = object.extend({}, this.attrs, kwargs, extraAttrs)
  return attrs
}

/**
 * Retrieves a value for this widget from the given data.
 *
 * @param {Object} data form data.
 * @param {Object} files file data.
 * @param {String} name the field name to be used to retrieve data.
 *
 * @return a value for this widget, or <code>null</code> if no value was
 *         provided.
 */
Widget.prototype.valueFromData = function(data, files, name) {
  return object.get(data, name, null)
}

/**
 * Determines if data has changed from initial.
 */
Widget.prototype._hasChanged = function(initial, data) {
  // For purposes of seeing whether something has changed, null is the same
  // as an empty string, if the data or inital value we get is null, replace
  // it with ''.
  var dataValue = (data === null ? '' : data)
  var initialValue = (initial === null ? '' : initial)
  return (''+initialValue != ''+dataValue)
}

/**
 * Determines the HTML <code>id</code> attribute of this Widget for use by a
 * <code>&lt;label&gt;</code>, given the id of the field.
 *
 * This hook is necessary because some widgets have multiple HTML elements and,
 * thus, multiple ids. In that case, this method should return an ID value that
 * corresponds to the first id in the widget's tags.
 *
 * @param {String} id a field id.
 *
 * @return the id which should be used by a <code>&lt;label&gt;</code> for this
 *         Widget.
 */
Widget.prototype.idForLabel = function(id) {
  return id
}

/**
 * An HTML <input> widget.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var Input = Widget.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new Input(kwargs)
    Widget.call(this, kwargs)
  }
  /** The type attribute of this input. */
, inputType: null
})

Input.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null}, kwargs)
  if (value === null) {
    value = ''
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {type: this.inputType,
                                                  name: name})
  if (value !== '') {
    // Only add the value attribute if value is non-empty
    finalAttrs.value = value
  }
  return DOMBuilder.createElement('input', finalAttrs)
}

/**
 * An HTML <input type="text"> widget.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var TextInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new TextInput(kwargs)
    Input.call(this, kwargs)
  }
, inputType: 'text'
})

/**
 * An HTML <input type="password"> widget.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var PasswordInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new PasswordInput(kwargs)
    kwargs = object.extend({renderValue: false}, kwargs)
    Input.call(this, kwargs)
    this.renderValue = kwargs.renderValue
  }
, inputType: 'password'
})

PasswordInput.prototype.render = function(name, value, kwargs) {
  if (!this.renderValue) {
    value = ''
  }
  return Input.prototype.render.call(this, name, value, kwargs)
}

/**
 * An HTML <input type="hidden"> widget.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var HiddenInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new HiddenInput(kwargs)
    Input.call(this, kwargs)
  }
, inputType: 'hidden'
, isHidden: true
})

/**
 * A widget that handles <input type="hidden"> for fields that have a list of
 * values.
 * @constructor
 * @extends {HiddenInput}
 * @param {Object=} kwargs
 */
var MultipleHiddenInput = HiddenInput.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new MultipleHiddenInput(kwargs)
    HiddenInput.call(this, kwargs)
  }
})

MultipleHiddenInput.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null}, kwargs)
  if (value === null) {
    value = []
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {type: this.inputType,
                                                  name: name})
    , id = object.get(finalAttrs, 'id', null)
    , inputs = []
  for (var i = 0, l = value.length; i < l; i++) {
    var inputAttrs = object.extend({}, finalAttrs, {value: value[i]})
    if (id) {
      // An ID attribute was given. Add a numeric index as a suffix
      // so that the inputs don't all have the same ID attribute.
      inputAttrs.id = format('{id}_{i}', {id: id, i: i})
    }
    inputs.push(DOMBuilder.createElement('input', inputAttrs))
  }
  return DOMBuilder.fragment(inputs)
}

MultipleHiddenInput.prototype.valueFromData = function(data, files, name) {
  if (typeof data[name] != 'undefined') {
    return [].concat(data[name])
  }
  return null
}

/**
 * An HTML <input type="file"> widget.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var FileInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new FileInput(kwargs)
    Input.call(this, kwargs)
  }
, inputType: 'file'
, needsMultipartForm: true
})

FileInput.prototype.render = function(name, value, kwargs) {
  return Input.prototype.render.call(this, name, null, kwargs)
}

/**
 * File widgets take data from <code>files</code>, not <code>data</code>.
 */
FileInput.prototype.valueFromData = function(data, files, name) {
  return object.get(files, name, null)
}

FileInput.prototype._hasChanged = function(initial, data) {
  if (data === null) {
    return false
  }
  return true
}

var FILE_INPUT_CONTRADICTION = {}

/**
 * @constructor
 * @extends {FileInput}
 * @param {Object=} kwargs
 */
var ClearableFileInput = FileInput.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new ClearableFileInput(kwargs)
    FileInput.call(this, kwargs)
  }
, initialText: 'Currently'
, inputText: 'Change'
, clearCheckboxLabel: 'Clear'
})

/**
 * Given the name of the file input, return the name of the clear checkbox
 * input.
 */
ClearableFileInput.prototype.clearCheckboxName = function(name) {
  return name + '-clear'
}

/**
 * Given the name of the clear checkbox input, return the HTML id for it.
 */
ClearableFileInput.prototype.clearCheckboxId = function(name) {
  return name + '_id'
}

ClearableFileInput.prototype.render = function(name, value, kwargs) {
  var input = FileInput.prototype.render.call(this, name, value, kwargs)
  if (value && typeof value.url != 'undefined') {
    var contents = [
      this.initialText, ': '
    , DOMBuilder.createElement('a', {href: value.url}, [''+value]), ' '
    ]
    if (!this.isRequired) {
      var clearCheckboxName = this.clearCheckboxName(name)
      var clearCheckboxId = this.clearCheckboxId(clearCheckboxName)
      contents = contents.concat([
        CheckboxInput().render(
            clearCheckboxName, false, {attrs: {'id': clearCheckboxId}})
      , ' '
      , DOMBuilder.createElement('label', {'for': clearCheckboxId},
                                 [this.clearCheckboxLabel])
      ])
    }
    contents = contents.concat([
      DOMBuilder.createElement('br')
    , this.inputText, ': '
    , input
    ])
    return DOMBuilder.fragment(contents)
  }
  else {
      return input
  }
}

ClearableFileInput.prototype.valueFromData = function(data, files, name) {
  var upload = FileInput.prototype.valueFromData(data, files, name)
  if (!this.isRequired &&
      CheckboxInput().valueFromData(data, files,
                                    this.clearCheckboxName(name))) {
    if (upload) {
      // If the user contradicts themselves (uploads a new file AND
      // checks the "clear" checkbox), we return a unique marker
      // object that FileField will turn into a ValidationError.
      return FILE_INPUT_CONTRADICTION
    }
    // false signals to clear any existing value, as opposed to just null
    return false
  }
  return upload
}

/**
 * A <input type="text"> which, if given a Date object to display, formats it as
 * an appropriate date String.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var DateInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new DateInput(kwargs)
    kwargs = object.extend({format: null}, kwargs)
    Input.call(this, kwargs)
    if (kwargs.format !== null) {
      this.format = kwargs.format
    }
    else {
      this.format = util.DEFAULT_DATE_INPUT_FORMATS[0]
    }
  }
, inputType: 'text'
})

DateInput.prototype._formatValue = function(value) {
  if (is.Date(value)) {
    return time.strftime(value, this.format)
  }
  return value
}

DateInput.prototype.render = function(name, value, kwargs) {
  value = this._formatValue(value)
  return Input.prototype.render.call(this, name, value, kwargs)
}

DateInput.prototype._hasChanged = function(initial, data) {
  return Input.prototype._hasChanged.call(this, this._formatValue(initial), data)
}

/**
 * A <input type="text"> which, if given a Date object to display, formats it as
 * an appropriate datetime String.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var DateTimeInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new DateTimeInput(kwargs)
    kwargs = object.extend({format: null}, kwargs)
    Input.call(this, kwargs)
    if (kwargs.format !== null) {
      this.format = kwargs.format
    }
    else {
      this.format = util.DEFAULT_DATETIME_INPUT_FORMATS[0]
    }
  }
, inputType: 'text'
})

DateTimeInput.prototype._formatValue = function(value) {
  if (is.Date(value)) {
    return time.strftime(value, this.format)
  }
  return value
}

DateTimeInput.prototype.render = function(name, value, kwargs) {
  value = this._formatValue(value)
  return Input.prototype.render.call(this, name, value, kwargs)
}

DateTimeInput.prototype._hasChanged = function(initial, data) {
  return Input.prototype._hasChanged.call(this, this._formatValue(initial), data)
}

/**
 * A <input type="text"> which, if given a Date object to display, formats it as
 * an appropriate time String.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var TimeInput = Input.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new TimeInput(kwargs)
    kwargs = object.extend({format: null}, kwargs)
    Input.call(this, kwargs)
    if (kwargs.format !== null) {
      this.format = kwargs.format
    }
    else {
      this.format = util.DEFAULT_TIME_INPUT_FORMATS[0]
    }
  }
, inputType: 'text'
})

TimeInput.prototype._formatValue = function(value) {
  if (is.Date(value)) {
    return time.strftime(value, this.format)
  }
  return value
}

TimeInput.prototype.render = function(name, value, kwargs) {
  value = this._formatValue(value)
  return Input.prototype.render.call(this, name, value, kwargs)
}

TimeInput.prototype._hasChanged = function(initial, data) {
  return Input.prototype._hasChanged.call(this, this._formatValue(initial), data)
}

/**
 * An HTML <textarea> widget.
 *
 * @param {Object} [kwargs] configuration options, as specified in
 *                          {@link Widget}.
 * @config {Object} [attrs] HTML attributes for the rendered widget. Default
 *                          rows and cols attributes will be used if not
 *                          provided.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var Textarea = Widget.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new Textarea(kwargs)
    // Ensure we have something in attrs
    kwargs = object.extend({attrs: null}, kwargs)
    // Provide default 'cols' and 'rows' attributes
    kwargs.attrs = object.extend({rows: '10', cols: '40'}, kwargs.attrs)
    Widget.call(this, kwargs)
  }
})

Textarea.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null}, kwargs)
  if (value === null) {
    value = ''
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {name: name})
  return DOMBuilder.createElement('textarea', finalAttrs, [value])
}

var defaultCheckTest = function(value) {
  return (value !== false &&
          value !== null &&
          value !== '')
}

/**
 * An HTML <input type="checkbox"> widget.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var CheckboxInput = Widget.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new CheckboxInput(kwargs)
    kwargs = object.extend({checkTest: defaultCheckTest}, kwargs)
    Widget.call(this, kwargs)
    this.checkTest = kwargs.checkTest
  }
})

CheckboxInput.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null}, kwargs)
  var checked
  try {
    checked = this.checkTest(value)
  }
  catch (e) {
    // Silently catch exceptions
    checked = false
  }

  var finalAttrs = this.buildAttrs(kwargs.attrs, {type: 'checkbox',
                                                  name: name})
  if (value !== '' && value !== true && value !== false && value !== null &&
      value !== undefined) {
    // Only add the value attribute if value is non-empty
    finalAttrs.value = value
  }
  if (checked) {
    finalAttrs.checked = 'checked'
  }
  return DOMBuilder.createElement('input', finalAttrs)
}

CheckboxInput.prototype.valueFromData = function(data, files, name) {
  if (typeof data[name] == 'undefined') {
    //  A missing value means False because HTML form submission does not
    // send results for unselected checkboxes.
    return false
  }
  var value = data[name]
    , values = {'true': true, 'false': false}
  // Translate true and false strings to boolean values
  if (is.String(value)) {
    value = object.get(values, value.toLowerCase(), value)
  }
  return value
}

CheckboxInput.prototype._hasChanged = function(initial, data) {
  // Sometimes data or initial could be null or '' which should be the same
  // thing as false.
  return (Boolean(initial) != Boolean(data))
}

/**
 * An HTML <select> widget.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var Select = Widget.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new Select(kwargs)
    kwargs = object.extend({choices: []}, kwargs)
    Widget.call(this, kwargs)
    this.choices = kwargs.choices || []
  }
, allowMultipleSelected: false
})

/**
 * Renders the widget.
 *
 * @param {String} name the field name.
 * @param selectedValue the value of an option which should be marked as
 *                      selected, or <code>null</code> if no value is selected -
 *                      will be normalised to a <code>String</code> for
 *                      comparison with choice values.
 * @param {Object} [attrs] additional HTML attributes for the rendered widget.
 * @param {Array} [choices] choices to be used when rendering the widget, in
 *                          addition to those already held by the widget itself.
 *
 * @return a <code>&lt;select&gt;</code> element.
 */
Select.prototype.render = function(name, selectedValue, kwargs) {
  kwargs = object.extend({attrs: null, choices: []}, kwargs)
  if (selectedValue === null) {
    selectedValue = ''
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {name: name})
  var options = this.renderOptions(kwargs.choices, [selectedValue])
  options.push('\n')
  return DOMBuilder.createElement('select', finalAttrs, options)
}

Select.prototype.renderOptions = function(choices, selectedValues) {
  // Normalise to strings
  var selectedValuesLookup = {}
  // We don't duck type passing of a String, as index access to characters isn't
  // part of the spec.
  var selectedValueString = (is.String(selectedValues))
  for (var i = 0, l = selectedValues.length; i < l; i++) {
    selectedValuesLookup[''+(selectedValueString ?
                             selectedValues.charAt(i) :
                             selectedValues[i])] = true
  }

  var options = []
    , finalChoices = util.iterate(this.choices).concat(choices || [])
  for (var i = 0, l = finalChoices.length; i < l; i++) {
    if (is.Array(finalChoices[i][1])) {
      var optgroupOptions = []
        , optgroupChoices = finalChoices[i][1]
      for (var j = 0, k = optgroupChoices.length; j < k; j++) {
        optgroupOptions.push('\n')
        optgroupOptions.push(this.renderOption(selectedValuesLookup,
                                               optgroupChoices[j][0],
                                               optgroupChoices[j][1]))
      }
      options.push('\n')
      optgroupOptions.push('\n')
      options.push(DOMBuilder.createElement(
          'optgroup', {label: finalChoices[i][0]}, optgroupOptions))
    }
    else {
      options.push('\n')
      options.push(this.renderOption(selectedValuesLookup,
                                     finalChoices[i][0],
                                     finalChoices[i][1]))
    }
  }
  return options
}

Select.prototype.renderOption = function(selectedValuesLookup, optValue,
                                         optLabel) {
  optValue = ''+optValue
  var attrs = {value: optValue}
  if (typeof selectedValuesLookup[optValue] != 'undefined') {
    attrs['selected'] = 'selected'
    if (!this.allowMultipleSelected) {
      // Only allow for a single selection with this value
      delete selectedValuesLookup[optValue]
    }
  }
  return DOMBuilder.createElement('option', attrs, [optLabel])
}

/**
 * A <select> widget intended to be used with NullBooleanField.
 * @constructor
 * @extends {Select}
 * @param {Object=} kwargs
 */
var NullBooleanSelect = Select.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new NullBooleanSelect(kwargs)
    kwargs = kwargs || {}
    // Set or overrride choices
    kwargs.choices = [['1', 'Unknown'], ['2', 'Yes'], ['3', 'No']]
    Select.call(this, kwargs)
  }
})

NullBooleanSelect.prototype.render = function(name, value, kwargs) {
  if (value === true || value == '2') {
      value = '2'
  }
  else if (value === false || value == '3') {
      value = '3'
  }
  else {
      value = '1'
  }
  return Select.prototype.render.call(this, name, value, kwargs)
}

NullBooleanSelect.prototype.valueFromData = function(data, files, name) {
  var value = null
  if (typeof data[name] != 'undefined') {
    var dataValue = data[name]
    if (dataValue === true || dataValue == 'True' || dataValue == 'true' ||
        dataValue == '2') {
      value = true
    }
    else if (dataValue === false || dataValue == 'False' ||
             dataValue == 'false' || dataValue == '3') {
      value = false
    }
  }
  return value
}

NullBooleanSelect.prototype._hasChanged = function(initial, data) {
  // For a NullBooleanSelect, null (unknown) and false (No)
  //are not the same
  if (initial !== null) {
      initial = Boolean(initial)
  }
  if (data !== null) {
      data = Boolean(data)
  }
  return initial != data
}

/**
 * An HTML <select> widget which allows multiple selections.
 * @constructor
 * @extends {Select}
 * @param {Object=} kwargs
 */
var SelectMultiple = Select.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new SelectMultiple(kwargs)
    Select.call(this, kwargs)
  }
, allowMultipleSelected: true
})

/**
 * Renders the widget.
 *
 * @param {String} name the field name.
 * @param {Array} selectedValues the values of options which should be marked as
 *                               selected, or <code>null</code> if no values
 *                               are selected - these will be normalised to
 *                               <code>String</code>s for comparison with choice
 *                               values.
 * @param {Object} [attrs] additional HTML attributes for the rendered widget.
 * @param {Array} [choices] choices to be used when rendering the widget, in
 *                          addition to those already held by the widget itself.
 *
 * @return a <code>&lt;select&gt;</code> element which allows multiple
 *         selections.
 */
SelectMultiple.prototype.render = function(name, selectedValues, kwargs) {
  kwargs = object.extend({attrs: null, choices: []}, kwargs)
  if (selectedValues === null) {
    selectedValues = []
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {name: name,
                                                  multiple: 'multiple'})
    , options = this.renderOptions(kwargs.choices, selectedValues)
  options.push('\n')
  return DOMBuilder.createElement('select', finalAttrs, options)
}

/**
 * Retrieves values for this widget from the given data.
 *
 * @param {Object} data form data.
 * @param {Object} files file data.
 * @param {String} name the field name to be used to retrieve data.
 *
 * @return {Array} values for this widget, or <code>null</code> if no values
 *                 were provided.
 */
SelectMultiple.prototype.valueFromData = function(data, files, name) {
  if (typeof data[name] != 'undefined') {
    return [].concat(data[name])
  }
  return null
}

SelectMultiple.prototype._hasChanged = function(initial, data) {
  if (initial === null) {
    initial = []
  }
  if (data === null) {
    data = []
  }
  if (initial.length != data.length) {
    return true
  }
  var dataLookup = object.lookup(data)
  for (var i = 0, l = initial.length; i < l; i++) {
    if (typeof dataLookup[''+initial[i]] == 'undefined') {
      return true
    }
  }
  return false
}

/**
 * An object used by RadioFieldRenderer that represents a single
 * <input type="radio">.
 * @constructor
 * @param {string} name
 * @param {string} value
 * @param {Object} attrs
 * @param {Array} choice
 * @param {number} index
 */
var RadioInput = SubWidget.extend({
  constructor: function(name, value, attrs, choice, index) {
    if (!(this instanceof RadioInput)) return new RadioInput(name, value, attrs, choice, index)
    this.name = name
    this.value = value
    this.attrs = attrs
    this.choiceValue = ''+choice[0]
    this.choiceLabel = choice[1]
    this.index = index
  }
})

RadioInput.prototype.toString = function() {
  return ''+this.render()
}

/**
 * Renders a <label> enclosing the radio widget and its label text.
 */
RadioInput.prototype.render = function(name, value, kwargs) {
  name = name || this.name
  value = value || this.value
  var attrs = object.extend({attrs: this.attrs}, kwargs).attrs
  var labelAttrs = {}
  if (typeof attrs.id != 'undefined') {
    labelAttrs['for'] = attrs.id + '_' + this.index
  }
  return DOMBuilder.createElement('label', labelAttrs,
                                  [this.tag(), ' ', this.choiceLabel])
}

RadioInput.prototype.isChecked = function() {
  return this.value === this.choiceValue
}

/**
 * Renders the <input type="radio"> portion of the widget.
 */
RadioInput.prototype.tag = function() {
  var finalAttrs = object.extend({}, this.attrs, {
    type: 'radio', name: this.name, value: this.choiceValue
  })
  if (typeof finalAttrs.id != 'undefined') {
    finalAttrs.id = finalAttrs.id + '_' + this.index
  }
  if (this.isChecked()) {
    finalAttrs.checked = 'checked'
  }
  return DOMBuilder.createElement('input', finalAttrs)
}

/**
 * An object used by {@link RadioSelect} to enable customisation of radio
 * widgets.
 * @constructor
 * @param {string} name
 * @param {string} value
 * @param {Object} attrs
 * @param {Array} choices
 */
var RadioFieldRenderer = Concur.extend({
  constructor: function(name, value, attrs, choices) {
    if (!(this instanceof RadioFieldRenderer)) return RadioFieldRenderer(name, value, attrs, choices)
    this.name = name
    this.value = value
    this.attrs = attrs
    this.choices = choices
  }
})

RadioFieldRenderer.prototype.__iter__ = function() {
  return this.radioInputs()
}

RadioFieldRenderer.prototype.radioInputs = function() {
  var inputs = []
  for (var i = 0, l = this.choices.length; i < l; i++) {
    inputs.push(RadioInput(this.name, this.value,
                           object.extend({}, this.attrs),
                           this.choices[i], i))
  }
  return inputs
}

RadioFieldRenderer.prototype.radioInput = function(i) {
  if (i >= this.choices.length) {
    throw new Error('Index out of bounds')
  }
  return RadioInput(this.name, this.value, object.extend({}, this.attrs),
                    this.choices[i], i)
}

/**
 * Outputs a &lt;ul&gt; for this set of radio fields.
 */
RadioFieldRenderer.prototype.render = function() {
  var inputs = this.radioInputs()
  var items = []
  for (var i = 0, l = inputs.length; i < l; i++) {
      items.push('\n')
      items.push(DOMBuilder.createElement('li', {}, [inputs[i].render()]))
  }
  items.push('\n')
  return DOMBuilder.createElement('ul', {}, items)
}

/**
 * Renders a single select as a list of <input type="radio"> elements.
 * @constructor
 * @extends {Select}
 * @param {Object=} kwargs
 */
var RadioSelect = Select.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new RadioSelect(kwargs)
    kwargs = object.extend({renderer: null}, kwargs)
    // Override the default renderer if we were passed one
    if (kwargs.renderer !== null) {
      this.renderer = kwargs.renderer
    }
    Select.call(this, kwargs)
  }
, renderer: RadioFieldRenderer
})

RadioSelect.prototype.subWidgets = function(name, value, kwargs) {
  return util.iterate(this.getRenderer(name, value, kwargs))
}

/**
 * @return an instance of the renderer to be used to render this widget.
 */
RadioSelect.prototype.getRenderer = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null, choices: []}, kwargs)
  value = (value === null ? '' : ''+value)
  var finalAttrs = this.buildAttrs(kwargs.attrs)
    , choices = util.iterate(this.choices).concat(kwargs.choices || [])
  return new this.renderer(name, value, finalAttrs, choices)
}

RadioSelect.prototype.render = function(name, value, kwargs) {
  return this.getRenderer(name, value, kwargs).render()
}

/**
 * RadioSelect is represented by multiple <input type="radio"> fields,
 * each of which has a distinct ID. The IDs are made distinct by a '_X'
 * suffix, where X is the zero-based index of the radio field. Thus, the
 * label for a RadioSelect should reference the first one ('_0').
 */
RadioSelect.prototype.idForLabel = function(id) {
  if (id) {
      id += '_0'
  }
  return id
}

/**
 * Multiple selections represented as a list of <input type="checkbox"> widgets.
 * @constructor
 * @extends {SelectMultiple}
 * @param {Object=} kwargs
 */
var CheckboxSelectMultiple = SelectMultiple.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new CheckboxSelectMultiple(kwargs)
    SelectMultiple.call(this, kwargs)
  }
})

CheckboxSelectMultiple.prototype.render = function(name, selectedValues, kwargs) {
  kwargs = object.extend({attrs: null, choices: []}, kwargs)
  if (selectedValues === null) {
    selectedValues = []
  }
  var hasId = (kwargs.attrs !== null && typeof kwargs.attrs.id != 'undefined')
    , finalAttrs = this.buildAttrs(kwargs.attrs)
    , selectedValuesLookup = object.lookup(selectedValues)
    , checkTest = function(value) {
        return (typeof selectedValuesLookup[''+value] != 'undefined')
      }
    , items = []
    , finalChoices = util.iterate(this.choices).concat(kwargs.choices)
  for (var i = 0, l = finalChoices.length; i < l; i++) {
    var optValue = '' + finalChoices[i][0]
      , optLabel = finalChoices[i][1]
      , checkboxAttrs = object.extend({}, finalAttrs)
      , labelAttrs = {}
    // If an ID attribute was given, add a numeric index as a suffix, so
    // that the checkboxes don't all have the same ID attribute.
    if (hasId) {
      object.extend(checkboxAttrs, {id: kwargs.attrs.id + '_' + i})
      labelAttrs['for'] = checkboxAttrs.id
    }

    var cb = CheckboxInput({attrs: checkboxAttrs, checkTest: checkTest})
    items.push('\n')
    items.push(
        DOMBuilder.createElement('li', {},
            [DOMBuilder.createElement('label', labelAttrs,
                                      [cb.render(name, optValue), ' ',
                                       optLabel])]))
  }
  items.push('\n')
  return DOMBuilder.createElement('ul', {}, items)
}

CheckboxSelectMultiple.prototype.idForLabel = function(id) {
  if (id) {
    id += '_0'
  }
  return id
}

/**
 * A widget that is composed of multiple widgets.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var MultiWidget = Widget.extend({
  constructor: function(widgets, kwargs) {
    if (!(this instanceof Widget)) return new MultiWidget(widgets, kwargs)
    this.widgets = []
    for (var i = 0, l = widgets.length; i < l; i++) {
      this.widgets.push(widgets[i] instanceof Widget
                        ? widgets[i]
                        : new widgets[i])
    }
    Widget.call(this, kwargs)
  }
})

/**
 * This method is different than other widgets', because it has to figure out
 * how to split a single value for display in multiple widgets.
 *
 * If the given value is NOT a list, it will first be "decompressed" into a list
 * before it is rendered by calling the {@link MultiWidget#decompress} method.
 *
 * Each value in the list is rendered  with the corresponding widget -- the
 * first value is rendered in the first widget, the second value is rendered in
 * the second widget, and so on.
 *
 * @param {String} name the field name.
 * @param value a list of values, or a normal value (e.g., a <code>String</code>
 *              that has been "compressed" from a list of values.
 * @param {Object} [attrs] additional HTML attributes for the rendered widget.
 *
 * @return a rendered collection of widgets.
 */
MultiWidget.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null}, kwargs)
  if (!(is.Array(value))) {
    value = this.decompress(value)
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs)
    , id = (typeof finalAttrs.id != 'undefined' ? finalAttrs.id : null)
    , renderedWidgets = []
  for (var i = 0, l = this.widgets.length; i < l; i++) {
    var widget = this.widgets[i]
      , widgetValue = null
    if (typeof value[i] != 'undefined') {
      widgetValue = value[i]
    }
    if (id) {
      finalAttrs.id = id + '_' + i
    }
    renderedWidgets.push(
        widget.render(name + '_' + i, widgetValue, {attrs: finalAttrs}))
  }
  return this.formatOutput(renderedWidgets)
}

MultiWidget.prototype.idForLabel = function(id) {
  if (id) {
    id += '_0'
  }
  return id
}

MultiWidget.prototype.valueFromData = function(data, files, name) {
  var values = []
  for (var i = 0, l = this.widgets.length; i < l; i++) {
    values[i] = this.widgets[i].valueFromData(data, files, name + '_' + i)
  }
  return values
}

MultiWidget.prototype._hasChanged = function(initial, data) {
  if (initial === null) {
    initial = []
    for (var i = 0, l = data.length; i < l; i++) {
      initial.push('')
    }
  }
  else if (!(is.Array(initial))) {
    initial = this.decompress(initial)
  }

  for (var i = 0, l = this.widgets.length; i < l; i++) {
    if (this.widgets[i]._hasChanged(initial[i], data[i])) {
      return true
    }
  }
  return false
}

/**
 * Creates an element containing a given list of rendered widgets.
 *
 * This hook allows you to format the HTML design of the widgets, if needed.
 *
 * @param {Array} renderedWidgets a list of rendered widgets.
 * @return a fragment containing the rendered widgets.
 */
MultiWidget.prototype.formatOutput = function(renderedWidgets) {
  return DOMBuilder.fragment(renderedWidgets)
}

/**
 * Creates a list of decompressed values for the given compressed value.
 *
 * @param value a compressed value, which can be assumed to be valid, but not
 *              necessarily non-empty.
 *
 * @return a list of decompressed values for the given compressed value.
 */
MultiWidget.prototype.decompress = function(value) {
  throw new Error('MultiWidget subclasses must implement a decompress() method.')
}

/**
 * Splits Date input into two <input type="text"> elements.
 * @constructor
 * @extends {MultiWidget}
 * @param {Object=} kwargs
 */
var SplitDateTimeWidget = MultiWidget.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new SplitDateTimeWidget(kwargs)
    kwargs = object.extend({dateFormat: null, timeFormat: null}, kwargs)
    var widgets = [
      DateInput({attrs: kwargs.attrs, format: kwargs.dateFormat})
    , TimeInput({attrs: kwargs.attrs, format: kwargs.timeFormat})
    ]
    MultiWidget.call(this, widgets, kwargs.attrs)
  }
})

SplitDateTimeWidget.prototype.decompress = function(value) {
  if (value) {
    return [
      new Date(value.getFullYear(), value.getMonth(), value.getDate())
    , new Date(1900, 0, 1, value.getHours(), value.getMinutes(), value.getSeconds())
    ]
  }
  return [null, null]
}

/**
 * Splits Date input into two <input type="hidden"> elements.
 * @constructor
 * @extends {SplitDateTimeWidget}
 * @param {Object=} kwargs
 */
var SplitHiddenDateTimeWidget = SplitDateTimeWidget.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Widget)) return new SplitHiddenDateTimeWidget(kwargs)
    SplitDateTimeWidget.call(this, kwargs)
    for (var i = 0, l = this.widgets.length; i < l; i++) {
      this.widgets[i].inputType = 'hidden'
      this.widgets[i].isHidden = true
    }
  }
, isHidden: true
})

module.exports = {
  Widget: Widget
, Input: Input
, TextInput: TextInput
, PasswordInput: PasswordInput
, HiddenInput: HiddenInput
, MultipleHiddenInput: MultipleHiddenInput
, FileInput: FileInput
, FILE_INPUT_CONTRADICTION: FILE_INPUT_CONTRADICTION
, ClearableFileInput: ClearableFileInput
, Textarea: Textarea
, DateInput: DateInput
, DateTimeInput: DateTimeInput
, TimeInput: TimeInput
, CheckboxInput: CheckboxInput
, Select: Select
, NullBooleanSelect: NullBooleanSelect
, SelectMultiple: SelectMultiple
, RadioInput: RadioInput
, RadioFieldRenderer: RadioFieldRenderer
, RadioSelect: RadioSelect
, CheckboxSelectMultiple: CheckboxSelectMultiple
, MultiWidget: MultiWidget
, SplitDateTimeWidget: SplitDateTimeWidget
, SplitHiddenDateTimeWidget: SplitHiddenDateTimeWidget
}
})

require.define("./fields", function(module, exports, require) {
var Concur = require('Concur')
  , is = require('isomorph/is')
  , format = require('isomorph/format').formatObj
  , object = require('isomorph/object')
  , time = require('isomorph/time')
  , url = require('isomorph/url')
  , validators = require('validators')

var util = require('./util')
  , widgets = require('./widgets')

var ValidationError = validators.ValidationError
  , isEmptyValue = validators.isEmptyValue
  , Widget = widgets.Widget
  , cleanIPv6Address = validators.ipv6.cleanIPv6Address

/**
 * An object that is responsible for doing validation and normalisation, or
 * "cleaning", for example: an EmailField makes sure its data is a valid
 * e-mail address and makes sure that acceptable "blank" values all have the
 * same representation.
 * @constructor
 * @param {Object=} kwargs
 */
var Field = Concur.extend({
  constructor: function(kwargs) {
    kwargs = object.extend({
      required: true, widget: null, label: null, initial: null,
      helpText: null, errorMessages: null, showHiddenInitial: false,
      validators: [], extraClasses: null
    }, kwargs)
    this.required = kwargs.required
    this.label = kwargs.label
    this.initial = kwargs.initial
    this.showHiddenInitial = kwargs.showHiddenInitial
    this.helpText = kwargs.helpText || ''
    this.extraClasses = kwargs.extraClasses

    var widget = kwargs.widget || this.widget
    if (!(widget instanceof Widget)) {
      // We must have a Widget constructor, so construct with it
      widget = new widget()
    }
    // Let the widget know whether it should display as required
    widget.isRequired = this.required
    // Hook into this.widgetAttrs() for any Field-specific HTML attributes
    object.extend(widget.attrs, this.widgetAttrs(widget))
    this.widget = widget

    // Increment the creation counter and save our local copy
    this.creationCounter = Field.creationCounter++

    // Copy error messages for this instance into a new object and override
    // with any provided error messages.
    this.errorMessages =
        object.extend({}, this.defaultErrorMessages, kwargs.errorMessages || {})

    this.validators = this.defaultValidators.concat(kwargs.validators)
  }
  /** Default widget to use when rendering this type of Field. */
, widget: widgets.TextInput
  /** Default widget to use when rendering this type of field as hidden. */
, hiddenWidget: widgets.HiddenInput
  /** Default set of validators. */
, defaultValidators: []
  /** Default error messages. */
, defaultErrorMessages: {
    required: 'This field is required.'
  , invalid: 'Enter a valid value.'
  }
})

/**
 * Tracks each time a Field instance is created; used to retain order.
 */
Field.creationCounter = 0

Field.prototype.prepareValue = function(value) {
  return value
}

Field.prototype.toJavaScript = function(value) {
  return value
}

Field.prototype.validate = function(value) {
  if (this.required && isEmptyValue(value)) {
    throw ValidationError(this.errorMessages.required)
  }
}

Field.prototype.runValidators = function(value) {
  if (isEmptyValue(value)) {
    return
  }
  var errors = []
  for (var i = 0, l = this.validators.length; i < l; i++) {
    try {
      validators.callValidator(this.validators[i], value)
    }
    catch (e) {
      if (!(e instanceof ValidationError)) {
        throw e
      }

      if (typeof e.code != 'undefined' &&
          typeof this.errorMessages[e.code] != 'undefined' &&
          this.errorMessages[e.code] !== this.defaultErrorMessages[e.code]) {
        var message = this.errorMessages[e.code]
        if (typeof e.params != 'undefined') {
          message = format(message, e.params)
        }
        errors.push(message)
      }
      else {
        errors = errors.concat(e.messages)
      }
    }
  }
  if (errors.length > 0) {
    throw ValidationError(errors)
  }
}

/**
 * Validates the given value and returns its "cleaned" value as an appropriate
 * JavaScript object.
 *
 * Raises ValidationError for any errors.
 *
 * @param {String} value the value to be validated.
 */
Field.prototype.clean = function(value) {
  value = this.toJavaScript(value)
  this.validate(value)
  this.runValidators(value)
  return value
}

/**
 * Return the value that should be shown for this field on render of a bound
 * form, given the submitted POST data for the field and the initial data, if
 * any.
 *
 * For most fields, this will simply be data; FileFields need to handle it a bit
 * differently.
 */
Field.prototype.boundData = function(data, initial) {
  return data
}

/**
 * Specifies HTML attributes which should be added to a given widget for this
 * field.
 *
 * @param {Widget} widget a widget.
 * @return an object specifying HTML attributes that should be added to the
 *         given widget, based on this field.
 */
Field.prototype.widgetAttrs = function(widget) {
  return {}
}

/**
 * Django has dropped this method, but we still need to it perform the change
 * check for certain Field types.
 */
Field.prototype._hasChanged = function(initial, data) {
  return this.widget._hasChanged(initial, data)
}

/**
 * Validates that its input is a valid String.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var CharField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new CharField(kwargs)
    kwargs = object.extend({
      maxLength: null, minLength: null
    }, kwargs)
    this.maxLength = kwargs.maxLength
    this.minLength = kwargs.minLength
    Field.call(this, kwargs)
    if (this.minLength !== null) {
      this.validators.push(validators.MinLengthValidator(this.minLength))
    }
    if (this.maxLength !== null) {
      this.validators.push(validators.MaxLengthValidator(this.maxLength))
    }
  }
})

CharField.prototype.toJavaScript = function(value) {
  if (isEmptyValue(value)) {
    return ''
  }
  return ''+value
}

/**
 * If this field is configured to enforce a maximum length, adds a suitable
 * <code>maxlength</code> attribute to text input fields.
 *
 * @param {Widget} widget the widget being used to render this field's value.
 *
 * @return additional attributes which should be added to the given widget.
 */
CharField.prototype.widgetAttrs = function(widget) {
  var attrs = {}
  if (this.maxLength !== null && (widget instanceof widgets.TextInput ||
                                  widget instanceof widgets.PasswordInput)) {
    attrs.maxlength = this.maxLength.toString()
  }
  return attrs
}

/**
 * Validates that its input is a valid integer.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var IntegerField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new IntegerField(kwargs)
    kwargs = object.extend({
      maxValue: null, minValue: null
    }, kwargs)
    this.maxValue = kwargs.maxValue
    this.minValue = kwargs.minValue
    Field.call(this, kwargs)

    if (this.minValue !== null) {
      this.validators.push(validators.MinValueValidator(this.minValue))
    }
    if (this.maxValue !== null) {
      this.validators.push(validators.MaxValueValidator(this.maxValue))
    }
  }
})
IntegerField.prototype.defaultErrorMessages =
    object.extend({}, IntegerField.prototype.defaultErrorMessages, {
      invalid: 'Enter a whole number.'
    , maxValue: 'Ensure this value is less than or equal to {limitValue}.'
    , minValue: 'Ensure this value is greater than or equal to {limitValue}.'
    })

/**
 * Validates that Number() can be called on the input with a result that isn't
 * NaN and doesn't contain any decimal points.
 *
 * @param value the value to be val idated.
 * @return the result of Number(), or <code>null</code> for empty values.
 */
IntegerField.prototype.toJavaScript = function(value) {
  value = Field.prototype.toJavaScript.call(this, value)
  if (isEmptyValue(value)) {
    return null
  }
  value = Number(value)
  if (isNaN(value) || value.toString().indexOf('.') != -1) {
    throw ValidationError(this.errorMessages.invalid)
  }
  return value
}

/**
 * Validates that its input is a valid float.
 * @constructor
 * @extends {IntegerField}
 * @param {Object=} kwargs
 */
var FloatField = IntegerField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new FloatField(kwargs)
    IntegerField.call(this, kwargs)
  }
})
/** Float validation regular expression, as parseFloat() is too forgiving. */
FloatField.FLOAT_REGEXP = /^[-+]?(?:\d+(?:\.\d+)?|(?:\d+)?\.\d+)$/
FloatField.prototype.defaultErrorMessages =
    object.extend({}, FloatField.prototype.defaultErrorMessages, {
      invalid: 'Enter a number.'
    })

/**
 * Validates that the input looks like valid input for parseFloat() and the
 * result of calling it isn't NaN.
 *
 * @param value the value to be validated.
 *
 * @return a Number obtained from parseFloat(), or <code>null</code> for empty
 *         values.
 */
FloatField.prototype.toJavaScript = function(value) {
  value = Field.prototype.toJavaScript.call(this, value)
  if (isEmptyValue(value)) {
    return null
  }
  value = util.strip(value)
  if (!FloatField.FLOAT_REGEXP.test(value)) {
    throw ValidationError(this.errorMessages.invalid)
  }
  value = parseFloat(value)
  if (isNaN(value)) {
    throw ValidationError(this.errorMessages.invalid)
  }
  return value
}

/**
* Determines if data has changed from initial. In JavaScript, trailing zeroes
* in floats are dropped when a float is coerced to a String, so e.g., an
* initial value of 1.0 would not match a data value of '1.0' if we were to use
* the Widget object's _hasChanged, which checks coerced String values.
*
* @type Boolean
*/
FloatField.prototype._hasChanged = function(initial, data) {
  // For purposes of seeing whether something has changed, null is the same
  // as an empty string, if the data or inital value we get is null, replace
  // it with ''.
  var dataValue = (data === null ? '' : data)
  var initialValue = (initial === null ? '' : initial)
  return (parseFloat(''+data) != parseFloat(''+dataValue))
}

/**
 * Validates that its input is a decimal number.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var DecimalField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new DecimalField(kwargs)
    kwargs = object.extend({
      maxValue: null, minValue: null, maxDigits: null, decimalPlaces: null
    }, kwargs)
    this.maxValue = kwargs.maxValue
    this.minValue = kwargs.minValue
    this.maxDigits = kwargs.maxDigits
    this.decimalPlaces = kwargs.decimalPlaces
    Field.call(this, kwargs)

    if (this.minValue !== null) {
      this.validators.push(validators.MinValueValidator(this.minValue))
    }
    if (this.maxValue !== null) {
      this.validators.push(validators.MaxValueValidator(this.maxValue))
    }
  }
})
/** Decimal validation regular expression, in lieu of a Decimal type. */
DecimalField.DECIMAL_REGEXP = /^[-+]?(?:\d+(?:\.\d+)?|(?:\d+)?\.\d+)$/
DecimalField.prototype.defaultErrorMessages =
    object.extend({}, DecimalField.prototype.defaultErrorMessages, {
      invalid: 'Enter a number.'
    , maxValue: 'Ensure this value is less than or equal to {limitValue}.'
    , minValue: 'Ensure this value is greater than or equal to {limitValue}.'
    , maxDigits: 'Ensure that there are no more than {maxDigits} digits in total.'
    , maxDecimalPlaces: 'Ensure that there are no more than {maxDecimalPlaces} decimal places.'
    , maxWholeDigits: 'Ensure that there are no more than {maxWholeDigits} digits before the decimal point.'
    })

/**
 * DecimalField overrides the clean() method as it performs its own validation
 * against a different value than that given to any defined validators, due to
 * JavaScript lacking a built-in Decimal type. Decimal format and component size
 * checks will be performed against a normalised string representation of the
 * input, whereas Validators will be passed a float version of teh value for
 * min/max checking.
 * @param {string|Number} value
 * @return {string} a normalised version of the input.
 */
DecimalField.prototype.clean = function(value) {
  // Take care of empty, required validation
  Field.prototype.validate.call(this, value)
  if (isEmptyValue(value)) {
    return null
  }

  // Coerce to string and validate that it looks Decimal-like
  value = util.strip(''+value)
  if (!DecimalField.DECIMAL_REGEXP.test(value)) {
    throw ValidationError(this.errorMessages.invalid)
  }

  // In lieu of a Decimal type, DecimalField validates against a string
  // representation of a Decimal, in which:
  // * Any leading sign has been stripped
  var negative = false
  if (value.charAt(0) == '+' || value.charAt(0) == '-') {
    negative = (value.charAt(0) == '-')
    value = value.substr(1)
  }
  // * Leading zeros have been stripped from digits before the decimal point,
  //   but trailing digits are retained after the decimal point.
  value = value.replace(/^0+/, '')

  // Perform own validation
  var pieces = value.split('.')
    , wholeDigits = pieces[0].length
    , decimals = (pieces.length == 2 ? pieces[1].length : 0)
    , digits = wholeDigits + decimals
  if (this.maxDigits !== null && digits > this.maxDigits) {
    throw ValidationError(format(this.errorMessages.maxDigits,
                                 {maxDigits: this.maxDigits}))
  }
  if (this.decimalPlaces !== null && decimals > this.decimalPlaces) {
    throw ValidationError(format(this.errorMessages.maxDecimalPlaces,
                                 {maxDecimalPlaces: this.decimalPlaces}))
  }
  if (this.maxDigits !== null &&
      this.decimalPlaces !== null &&
      wholeDigits > (this.maxDigits - this.decimalPlaces)) {
    throw ValidationError(format(this.errorMessages.maxWholeDigits,
                                 {maxWholeDigits: (
                                  this.maxDigits - this.decimalPlaces)}))
  }

  // * Values which did not have a leading zero gain a single leading zero
  if (value.charAt(0) == '.') {
    value = '0' + value
  }
  // Restore sign if necessary
  if (negative) {
    value = '-' + value
  }

  // Validate against a float value - best we can do in the meantime
  this.runValidators(parseFloat(value))

  // Return the normalited String representation
  return value
}

/**
 * Base field for fields which validate that their input is a date or time.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var BaseTemporalField = Field.extend({
  constructor: function(kwargs) {
    kwargs = object.extend({inputFormats: null}, kwargs)
    Field.call(this, kwargs)
    if (kwargs.inputFormats !== null) {
      this.inputFormats = kwargs.inputFormats
    }
  }
})

/**
 * Validates that its input is a valid date or time.
 * @param {String|Date}
 * @return {Date}
 */
BaseTemporalField.prototype.toJavaScript = function(value) {
  if (!is.Date(value)) {
    value = util.strip(value)
  }
  if (is.String(value)) {
    for (var i = 0, l = this.inputFormats.length; i < l; i++) {
      try {
        return this.strpdate(value, this.inputFormats[i])
      }
      catch (e) {
        continue
      }
    }
  }
  throw ValidationError(this.errorMessages.invalid)
}

/**
 * Creates a Date from the given input if it's valid based on a format.
 * @param {String} value
 * @param {String} format
 * @return {Date}
 */
BaseTemporalField.prototype.strpdate = function(value, format) {
  return time.strpdate(value, format)
}

/**
 * Validates that its input is a date.
 * @constructor
 * @extends {BaseTemporalField}
 * @param {Object=} kwargs
 */
var DateField = BaseTemporalField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new DateField(kwargs)
    BaseTemporalField.call(this, kwargs)
  }
, widget: widgets.DateInput
, inputFormats: util.DEFAULT_DATE_INPUT_FORMATS
})
DateField.prototype.defaultErrorMessages =
    object.extend({}, DateField.prototype.defaultErrorMessages, {
      invalid: 'Enter a valid date.'
    })

/**
 * Validates that the input can be converted to a date.
 * @param {String|Date} value the value to be validated.
 * @return {?Date} a with its year, month and day attributes set, or null for
 *     empty values when they are allowed.
 */
DateField.prototype.toJavaScript = function(value) {
  if (isEmptyValue(value)) {
    return null
  }
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  return BaseTemporalField.prototype.toJavaScript.call(this, value)
}

/**
 * Validates that its input is a time.
 * @constructor
 * @extends {BaseTemporalField}
 * @param {Object=} kwargs
 */
var TimeField = BaseTemporalField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new TimeField(kwargs)
    BaseTemporalField.call(this, kwargs)
  }
, widget: widgets.TimeInput
, inputFormats: util.DEFAULT_TIME_INPUT_FORMATS
})
TimeField.prototype.defaultErrorMessages =
    object.extend({}, TimeField.prototype.defaultErrorMessages, {
      invalid: 'Enter a valid time.'
    })

/**
 * Validates that the input can be converted to a time.
 * @param {String|Date} value the value to be validated.
 * @return {?Date} a Date with its hour, minute and second attributes set, or
 *     null for empty values when they are allowed.
 */
TimeField.prototype.toJavaScript = function(value) {
  if (isEmptyValue(value)) {
    return null
  }
  if (value instanceof Date) {
    return new Date(1900, 0, 1, value.getHours(), value.getMinutes(), value.getSeconds())
  }
  return BaseTemporalField.prototype.toJavaScript.call(this, value)
}

/**
 * Creates a Date representing a time from the given input if it's valid based
 * on the format.
 * @param {String} value
 * @param {String} format
 * @return {Date}
 */
TimeField.prototype.strpdate = function(value, format) {
  var t = time.strptime(value, format)
  return new Date(1900, 0, 1, t[3], t[4], t[5])
}

/**
 * Validates that its input is a date/time.
 * @constructor
 * @extends {BaseTemporalField}
 * @param {Object=} kwargs
 */
var DateTimeField = BaseTemporalField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new DateTimeField(kwargs)
    BaseTemporalField.call(this, kwargs)
  }
, widget: widgets.DateTimeInput
, inputFormats: util.DEFAULT_DATETIME_INPUT_FORMATS
})
DateTimeField.prototype.defaultErrorMessages =
    object.extend({}, DateTimeField.prototype.defaultErrorMessages, {
      invalid: 'Enter a valid date/time.'
    })

/**
 * @param {String|Date|Array.<Date>}
 * @return {?Date}
 */
DateTimeField.prototype.toJavaScript = function(value) {
  if (isEmptyValue(value)) {
    return null
  }
  if (value instanceof Date) {
    return value
  }
  if (is.Array(value)) {
    // Input comes from a SplitDateTimeWidget, for example, so it's two
    // components: date and time.
    if (value.length != 2) {
      throw ValidationError(this.errorMessages.invalid)
    }
    if (isEmptyValue(value[0]) &&
        isEmptyValue(value[1])) {
      return null
    }
    value = value.join(' ')
  }
  return BaseTemporalField.prototype.toJavaScript.call(this, value)
}

/**
 * Validates that its input matches a given regular expression.
 * @constructor
 * @extends {CharField}
 * @param {{regexp|string}} regex
 * @param {Object=} kwargs
 */
var RegexField = CharField.extend({
  constructor: function(regex, kwargs) {
    if (!(this instanceof Field)) return new RegexField(regex, kwargs)
    CharField.call(this, kwargs)
    if (is.String(regex)) {
      regex = new RegExp(regex)
    }
    this.regex = regex
    this.validators.push(validators.RegexValidator(this.regex))
  }
})

/**
 * Validates that its input appears to be a valid e-mail address.
 * @constructor
 * @extends {CharField}
 * @param {Object=} kwargs
 */
var EmailField = CharField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new EmailField(kwargs)
    CharField.call(this, kwargs)
  }
, defaultValidators: [validators.validateEmail]
})
EmailField.prototype.defaultErrorMessages =
    object.extend({}, EmailField.prototype.defaultErrorMessages, {
      invalid: 'Enter a valid e-mail address.'
    })

EmailField.prototype.clean = function(value) {
  value = util.strip(this.toJavaScript(value))
  return CharField.prototype.clean.call(this, value)
}

/**
 * Validates that its input is a valid uploaded file.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var FileField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new FileField(kwargs)
    kwargs = object.extend({maxLength: null, allowEmptyFile: false}, kwargs)
    this.maxLength = kwargs.maxLength
    this.allowEmptyFile = kwargs.allowEmptyFile
    delete kwargs.maxLength
    Field.call(this, kwargs)
  }
, widget: widgets.ClearableFileInput
})
FileField.prototype.defaultErrorMessages =
    object.extend({}, FileField.prototype.defaultErrorMessages, {
      invalid: 'No file was submitted. Check the encoding type on the form.'
    , missing: 'No file was submitted.'
    , empty: 'The submitted file is empty.'
    , maxLength: 'Ensure this filename has at most {max} characters (it has {length}).'
    , contradicton: 'Please either submit a file or check the clear checkbox, not both.'
    })

FileField.prototype.toJavaScript = function(data, initial) {
  if (isEmptyValue(data)) {
    return null
  }
  // UploadedFile objects should have name and size attributes
  if (typeof data.name == 'undefined' || typeof data.size == 'undefined') {
    throw ValidationError(this.errorMessages.invalid)
  }

  var fileName = data.name
    , fileSize = data.size

  if (this.maxLength !== null && fileName.length > this.maxLength) {
    throw ValidationError(format(this.errorMessages.maxLength, {
                            max: this.maxLength
                          , length: fileName.length
                          }))
  }
  if (!fileName) {
    throw ValidationError(this.errorMessages.invalid)
  }
  if (!this.allowEmptyFile && !fileSize) {
    throw ValidationError(this.errorMessages.empty)
  }
  return data
}

FileField.prototype.clean = function(data, initial) {
  // If the widget got contradictory inputs, we raise a validation error
  if (data === widgets.FILE_INPUT_CONTRADICTION) {
    throw ValidationError(this.errorMessages.contradiction)
  }
  // false means the field value should be cleared; further validation is
  // not needed.
  if (data === false) {
    if (!this.required) {
      return false
    }
    // If the field is required, clearing is not possible (the widget
    // shouldn't return false data in that case anyway). False is not
    // in EMPTY_VALUES; if a False value makes it this far it should be
    // validated from here on out as null (so it will be caught by the
    // required check).
    data = null
  }
  if (!data && initial) {
    return initial
  }
  return CharField.prototype.clean.call(this, data)
}

FileField.prototype.boundData = function(data, initial) {
  if (data === null || data === widgets.FILE_INPUT_CONTRADICTION) {
    return initial
  }
  return data
}

/**
 * Validates that its input is a valid uploaded image.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var ImageField = FileField.extend({
constructor: function(kwargs) {
    if (!(this instanceof Field)) return new ImageField(kwargs)
    FileField.call(this, kwargs)
  }
})
ImageField.prototype.defaultErrorMessages =
    object.extend({}, ImageField.prototype.defaultErrorMessages, {
      invalidImage: 'Upload a valid image. The file you uploaded was either not an image or a corrupted image.'
    })

/**
 * Checks that the file-upload field data contains a valid image.
 */
ImageField.prototype.toJavaScript = function(data, initial) {
  var f = FileField.prototype.toJavaScript.call(this, data, initial)
  if (f === null) {
    return null
  }

  // TODO Plug in image processing code when running on the server

  return f
}

/**
 * Validates that its input appears to be a valid URL.
 * @constructor
 * @extends {CharField}
 * @param {Object=} kwargs
 */
var URLField = CharField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new URLField(kwargs)
    CharField.call(this, kwargs)
    this.validators.push(validators.URLValidator())
  }
})
URLField.prototype.defaultErrorMessages =
    object.extend({}, URLField.prototype.defaultErrorMessages, {
      invalid: 'Enter a valid URL.'
    , invalidLink: 'This URL appears to be a broken link.'
    })

URLField.prototype.toJavaScript = function(value) {
  if (value) {
    var urlFields = url.parseUri(value)
    if (!urlFields.protocol) {
      // If no URL protocol given, assume http://
      urlFields.protocol = 'http'
    }
    if (!urlFields.path) {
      // The path portion may need to be added before query params
      urlFields.path = '/'
    }
    value = url.makeUri(urlFields)
  }
  return CharField.prototype.toJavaScript.call(this, value)
}

/**
 * Normalises its input to a <code>Boolean</code> primitive.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var BooleanField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new BooleanField(kwargs)
    Field.call(this, kwargs)
  }
, widget: widgets.CheckboxInput
})

BooleanField.prototype.toJavaScript = function(value) {
  // Explicitly check for a 'false' string, which is what a hidden field will
  // submit for false. Also check for '0', since this is what RadioSelect will
  // provide. Because Boolean('anything') == true, we don't need to handle that
  // explicitly.
  if (is.String(value) && (value.toLowerCase() == 'false' || value == '0')) {
    value = false
  }
  else {
    value = Boolean(value)
  }
  value = Field.prototype.toJavaScript.call(this, value)
  if (!value && this.required) {
    throw ValidationError(this.errorMessages.required)
  }
  return value
}

/**
 * A field whose valid values are <code>null</code>, <code>true</code> and
 * <code>false</code>. Invalid values are cleaned to <code>null</code>.
 * @constructor
 * @extends {BooleanField}
 * @param {Object=} kwargs
 */
var NullBooleanField = BooleanField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new NullBooleanField(kwargs)
    BooleanField.call(this, kwargs)
  }
, widget: widgets.NullBooleanSelect
})

NullBooleanField.prototype.toJavaScript = function(value) {
  // Explicitly checks for the string 'True' and 'False', which is what a
  // hidden field will submit for true and false, and for '1' and '0', which
  // is what a RadioField will submit. Unlike the Booleanfield we also need
  // to check for true, because we are not using Boolean() function.
  if (value === true || value == 'True' || value == 'true' || value == '1') {
    return true
  }
  else if (value === false || value == 'False' || value == 'false' || value == '0') {
    return false
  }
  return null
}

NullBooleanField.prototype.validate = function(value) {}

/**
 * Validates that its input is one of a valid list of choices.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var ChoiceField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new ChoiceField(kwargs)
    kwargs = object.extend({choices: []}, kwargs)
    Field.call(this, kwargs)
    this.setChoices(kwargs.choices)
  }
, widget: widgets.Select
})
ChoiceField.prototype.defaultErrorMessages =
    object.extend({}, ChoiceField.prototype.defaultErrorMessages, {
      invalidChoice: 'Select a valid choice. {value} is not one of the available choices.'
    })
ChoiceField.prototype.choices = function() { return this._choices }
ChoiceField.prototype.setChoices = function(choices) {
  // Setting choices also sets the choices on the widget
  this._choices = this.widget.choices = choices
}

ChoiceField.prototype.toJavaScript = function(value) {
  if (isEmptyValue(value)) {
    return ''
  }
  return ''+value
}

/**
 * Validates that the given value is in this field's choices.
 */
ChoiceField.prototype.validate = function(value) {
  Field.prototype.validate.call(this, value)
  if (value && !this.validValue(value)) {
    throw ValidationError(
        format(this.errorMessages.invalidChoice, {value: value}))
  }
}

/**
 * Checks to see if the provided value is a valid choice.
 *
 * @param {String} value the value to be validated.
 */
ChoiceField.prototype.validValue = function(value) {
  var choices = this.choices()
  for (var i = 0, l = choices.length; i < l; i++) {
    if (is.Array(choices[i][1])) {
      // This is an optgroup, so look inside the group for options
      var optgroupChoices = choices[i][1]
      for (var j = 0, k = optgroupChoices.length; j < k; j++) {
        if (value === ''+optgroupChoices[j][0]) {
          return true
        }
      }
    }
    else if (value === ''+choices[i][0]) {
      return true
    }
  }
  return false
}

/**
 * A ChoiceField which returns a value coerced by some provided function.
 * @constructor
 * @extends {ChoiceField}
 * @param {Object=} kwargs
 */
var TypedChoiceField = ChoiceField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new TypedChoiceField(kwargs)
    kwargs = object.extend({
      coerce: function(val) { return val }, emptyValue: ''
    }, kwargs)
    this.coerce = kwargs.coerce
    this.emptyValue = kwargs.emptyValue
    delete kwargs.coerce
    delete kwargs.emptyValue
    ChoiceField.call(this, kwargs)
  }
})

TypedChoiceField.prototype.toJavaScript = function(value) {
  var value = ChoiceField.prototype.toJavaScript.call(this, value)
  ChoiceField.prototype.validate.call(this, value)
  if (value === this.emptyValue || isEmptyValue(value)) {
    return this.emptyValue
  }
  try {
    value = this.coerce(value)
  }
  catch (e) {
    throw ValidationError(
        format(this.errorMessages.invalidChoice, {value: value}))
  }
  return value
}

TypedChoiceField.prototype.validate = function(value) {}

/**
 * Validates that its input is one or more of a valid list of choices.
 * @constructor
 * @extends {ChoiceField}
 * @param {Object=} kwargs
 */
var MultipleChoiceField = ChoiceField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new MultipleChoiceField(kwargs)
    ChoiceField.call(this, kwargs)
  }
, widget: widgets.SelectMultiple
, hiddenWidget: widgets.MultipleHiddenInput
})
MultipleChoiceField.prototype.defaultErrorMessages =
    object.extend({}, MultipleChoiceField.prototype.defaultErrorMessages, {
      invalidChoice: 'Select a valid choice. {value} is not one of the available choices.'
    , invalidList: 'Enter a list of values.'
    })

MultipleChoiceField.prototype.toJavaScript = function(value) {
  if (!value) {
    return []
  }
  else if (!(is.Array(value))) {
    throw ValidationError(this.errorMessages.invalidList)
  }
  var stringValues = []
  for (var i = 0, l = value.length; i < l; i++) {
    stringValues.push(''+value[i])
  }
  return stringValues
}

/**
 * Validates that the input is a list and that each item is in this field's
 * choices.
 */
MultipleChoiceField.prototype.validate = function(value) {
  if (this.required && !value.length) {
    throw ValidationError(this.errorMessages.required)
  }
  for (var i = 0, l = value.length; i < l; i++) {
    if (!this.validValue(value[i])) {
      throw ValidationError(
          format(this.errorMessages.invalidChoice, {value: value[i]}))
    }
  }
}

/**
 * AMultipleChoiceField which returns values coerced by some provided function.
 * @constructor
 * @extends {MultipleChoiceField}
 * @param {Object=} kwargs
 */
var TypedMultipleChoiceField = MultipleChoiceField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new TypedMultipleChoiceField(kwargs)
    kwargs = object.extend({
      coerce: function(val) { return val }, emptyValue: []
    }, kwargs)
    this.coerce = kwargs.coerce
    this.emptyValue = kwargs.emptyValue
    delete kwargs.coerce
    delete kwargs.emptyValue
    MultipleChoiceField.call(this, kwargs)
  }
})

TypedMultipleChoiceField.prototype.toJavaScript = function(value) {
  value = MultipleChoiceField.prototype.toJavaScript.call(this, value)
  MultipleChoiceField.prototype.validate.call(this, value)
  if (value === this.emptyValue || isEmptyValue(value) ||
      (is.Array(value) && !value.length)) {
    return this.emptyValue
  }
  var newValue = []
  for (var i = 0, l = value.length; i < l; i++) {
    try {
      newValue.push(this.coerce(value[i]))
    }
    catch (e) {
      throw ValidationError(
          format(this.errorMessages.invalidChoice, {value: value[i]}))
    }
  }
  return newValue
}

TypedMultipleChoiceField.prototype.validate = function(value) {}

/**
 * Allows choosing from files inside a certain directory.
 * @constructor
 * @extends {ChoiceField}
 * @param {string} path
 * @param {Object=} kwargs
 */
var FilePathField = ChoiceField.extend({
  constructor: function(path, kwargs) {
    if (!(this instanceof Field)) return new FilePathField(path, kwargs)
    kwargs = object.extend({
      match: null, recursive: false, required: true, widget: null,
      label: null, initial: null, helpText: null
    }, kwargs)

    this.path = path
    this.match = kwargs.match
    this.recursive = kwargs.recursive
    delete kwargs.match
    delete kwargs.recursive

    kwargs.choices = []
    ChoiceField.call(this, kwargs)

    if (this.required) {
      this.setChoices([])
    }
    else {
      this.setChoices([['', '---------']])
    }
    if (this.match !== null) {
      this.matchRE = new RegExp(this.match)
    }

    // TODO Plug in file paths when running on the server

    this.widget.choices = this.choices()
  }
})

/**
 * A Field whose <code>clean()</code> method calls multiple Field
 * <code>clean()</code> methods.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var ComboField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new ComboField(kwargs)
    kwargs = object.extend({fields: []}, kwargs)
    Field.call(this, kwargs)
    // Set required to False on the individual fields, because the required
    // validation will be handled by ComboField, not by those individual fields.
    for (var i = 0, l = kwargs.fields.length; i < l; i++) {
      kwargs.fields[i].required = false
    }
    this.fields = kwargs.fields
  }
})

ComboField.prototype.clean = function(value) {
  Field.prototype.clean.call(this, value)
  for (var i = 0, l = this.fields.length; i < l; i++) {
    value = this.fields[i].clean(value)
  }
  return value
}

/**
 * A Field that aggregates the logic of multiple Fields.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var MultiValueField = Field.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new MultiValueField(kwargs)
    kwargs = object.extend({fields: []}, kwargs)
    Field.call(this, kwargs)
    // Set required to false on the individual fields, because the required
    // validation will be handled by MultiValueField, not by those individual
    // fields.
    for (var i = 0, l = kwargs.fields.length; i < l; i++) {
      kwargs.fields[i].required = false
    }
    this.fields = kwargs.fields
  }
})
MultiValueField.prototype.defaultErrorMessages =
    object.extend({}, MultiValueField.prototype.defaultErrorMessages, {
      invalid: 'Enter a list of values.'
    })

MultiValueField.prototype.validate = function() {}

/**
 * Validates every value in the given list. A value is validated against the
 * corresponding Field in <code>this.fields</code>.
 *
 * For example, if this MultiValueField was instantiated with
 * <code>{fields: [forms.DateField(), forms.TimeField()]}, <code>clean()</code>
 * would call <code>DateField.clean(value[0])</code> and
 * <code>TimeField.clean(value[1])<code>.
 *
 * @param {Array} value the input to be validated.
 *
 * @return the result of calling <code>compress()</code> on the cleaned input.
 */
MultiValueField.prototype.clean = function(value) {
  var cleanData = []
    , errors = []

  if (!value || is.Array(value)) {
    var allValuesEmpty = true
    if (is.Array(value)) {
      for (var i = 0, l = value.length; i < l; i++) {
        if (value[i]) {
          allValuesEmpty = false
          break
        }
      }
    }

    if (!value || allValuesEmpty) {
      if (this.required) {
        throw ValidationError(this.errorMessages.required)
      }
      else {
        return this.compress([])
      }
    }
  }
  else {
    throw ValidationError(this.errorMessages.invalid)
  }

  for (var i = 0, l = this.fields.length; i < l; i++) {
    var field = this.fields[i]
      , fieldValue = value[i]
    if (fieldValue === undefined) {
      fieldValue = null
    }
    if (this.required && isEmptyValue(fieldValue)) {
      throw ValidationError(this.errorMessages.required)
    }
    try {
      cleanData.push(field.clean(fieldValue))
    }
    catch (e) {
      if (!(e instanceof ValidationError)) {
        throw e
      }
      errors = errors.concat(e.messages)
    }
  }

  if (errors.length !== 0) {
    throw ValidationError(errors)
  }

  var out = this.compress(cleanData)
  this.validate(out)
  this.runValidators(out)
  return out
}

/**
 * Returns a single value for the given list of values. The values can be
 * assumed to be valid.
 *
 * For example, if this MultiValueField was instantiated with
 * <code>{fields: [forms.DateField(), forms.TimeField()]}</code>, this might
 * return a <code>Date</code> object created by combining the date and time in
 * <code>dataList</code>.
 *
 * @param {Array} dataList
 */
MultiValueField.prototype.compress = function(dataList) {
  throw new Error('Subclasses must implement this method.')
}

/**
 * A MultiValueField consisting of a DateField and a TimeField.
 * @constructor
 * @extends {MultiValueField}
 * @param {Object=} kwargs
 */
var SplitDateTimeField = MultiValueField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new SplitDateTimeField(kwargs)
    kwargs = object.extend({
      inputDateFormats: null, inputTimeFormats: null
    }, kwargs)
    var errors = object.extend({}, this.defaultErrorMessages)
    if (typeof kwargs.errorMessages != 'undefined') {
      object.extend(errors, kwargs.errorMessages)
    }
    kwargs.fields = [
      DateField({inputFormats: kwargs.inputDateFormats,
                 errorMessages: {invalid: errors.invalidDate}})
    , TimeField({inputFormats: kwargs.inputDateFormats,
                 errorMessages: {invalid: errors.invalidTime}})
    ]
    MultiValueField.call(this, kwargs)
  }
, widget: widgets.SplitDateTimeWidget
, hiddenWidget: widgets.SplitHiddenDateTimeWidget
})
SplitDateTimeField.prototype.defaultErrorMessages =
    object.extend({}, SplitDateTimeField.prototype.defaultErrorMessages, {
      invalidDate: 'Enter a valid date.'
    , invalidTime: 'Enter a valid time.'
    })

/**
 * Validates that, if given, its input does not contain empty values.
 *
 * @param {Array} [dataList] a two-item list consisting of two <code>Date</code>
 *                           objects, the first of which represents a date, the
 *                           second a time.
 *
 * @return a <code>Date</code> object representing the given date and time, or
 *         <code>null</code> for empty values.
 */
SplitDateTimeField.prototype.compress = function(dataList) {
  if (is.Array(dataList) && dataList.length > 0) {
    var d = dataList[0], t = dataList[1]
    // Raise a validation error if date or time is empty (possible if
    // SplitDateTimeField has required == false).
    if (isEmptyValue(d)) {
      throw ValidationError(this.errorMessages.invalidDate)
    }
    if (isEmptyValue(t)) {
      throw ValidationError(this.errorMessages.invalidTime)
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(),
                    t.getHours(), t.getMinutes(), t.getSeconds())
  }
  return null
}

/**
 * Validates that its input is a valid IPv4 address.
 * @constructor
 * @extends {CharField}
 * @param {Object=} kwargs
 */
var IPAddressField = CharField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new IPAddressField(kwargs)
    CharField.call(this, kwargs)
  }
})
IPAddressField.prototype.defaultValidators = [validators.validateIPv4Address]
IPAddressField.prototype.defaultErrorMessages =
    object.extend({}, IPAddressField.prototype.defaultErrorMessages, {
      invalid: 'Enter a valid IPv4 address.'
    })

var GenericIPAddressField = CharField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new GenericIPAddressField(kwargs)
    kwargs = object.extend({
      protocol: 'both', unpackIPv4: false
    }, kwargs)
    this.unpackIPv4 = kwargs.unpackIPv4
    var ipValidator = validators.ipAddressValidators(kwargs.protocol,
                                                     kwargs.unpackIPv4)
    this.defaultValidators = ipValidator.validators
    this.defaultErrorMessages = object.extend(
      {}, this.defaultErrorMessages, {invalid: ipValidator.message}
    )
    CharField.call(this, kwargs)
  }
})

GenericIPAddressField.prototype.toJavaScript = function(value) {
  if (!value) {
    return ''
  }
  if (value && value.indexOf(':') != -1) {
    return cleanIPv6Address(value, {
      unpackIPv4: this.unpackIPv4
    , errorMessage: this.errorMessages.invalid
    })
  }
  return value
}

/**
 * Validates that its input is a valid slug.
 * @constructor
 * @extends {CharField}
 * @param {Object=} kwargs
 */
var SlugField = CharField.extend({
  constructor: function(kwargs) {
    if (!(this instanceof Field)) return new SlugField(kwargs)
    CharField.call(this, kwargs)
  }
})
SlugField.prototype.defaultValidators = [validators.validateSlug]
SlugField.prototype.defaultErrorMessages =
    object.extend({}, SlugField.prototype.defaultErrorMessages, {
      invalid: "Enter a valid 'slug' consisting of letters, numbers, underscores or hyphens."
    })

module.exports = {
  Field: Field
, CharField: CharField
, IntegerField: IntegerField
, FloatField: FloatField
, DecimalField: DecimalField
, BaseTemporalField: BaseTemporalField
, DateField: DateField
, TimeField: TimeField
, DateTimeField: DateTimeField
, RegexField: RegexField
, EmailField: EmailField
, FileField: FileField
, ImageField: ImageField
, URLField: URLField
, BooleanField: BooleanField
, NullBooleanField: NullBooleanField
, ChoiceField: ChoiceField
, TypedChoiceField: TypedChoiceField
, MultipleChoiceField: MultipleChoiceField
, TypedMultipleChoiceField: TypedMultipleChoiceField
, FilePathField: FilePathField
, ComboField: ComboField
, MultiValueField: MultiValueField
, SplitDateTimeField: SplitDateTimeField
, IPAddressField: IPAddressField
, GenericIPAddressField: GenericIPAddressField
, SlugField: SlugField
}
})

require.define("./forms", function(module, exports, require) {
var Concur = require('Concur')
  , DOMBuilder = require('DOMBuilder')
  , is = require('isomorph/is')
  , format = require('isomorph/format').formatObj
  , object = require('isomorph/object')
  , copy = require('isomorph/copy')
  , validators = require('validators')

var util = require('./util')
  , fields = require('./fields')
  , widgets = require('./widgets')

var ErrorList = util.ErrorList
  , ErrorObject = util.ErrorObject
  , ValidationError = validators.ValidationError
  , Field = fields.Field
  , FileField = fields.FileField
  , Textarea = widgets.Textarea
  , TextInput = widgets.TextInput

/** Property under which non-field-specific errors are stored. */
var NON_FIELD_ERRORS = '__all__'

/**
 * A field and its associated data.
 *
 * @param {Form} form a form.
 * @param {Field} field one of the form's fields.
 * @param {String} name the name under which the field is held in the form.
 * @constructor
 */
var BoundField = Concur.extend({
  constructor: function(form, field, name) {
    if (!(this instanceof BoundField)) return new BoundField(form, field, name)
    this.form = form
    this.field = field
    this.name = name
    this.htmlName = form.addPrefix(name)
    this.htmlInitialName = form.addInitialPrefix(name)
    this.htmlInitialId = form.addInitialPrefix(this.autoId())
    this.label = this.field.label !== null ? this.field.label : util.prettyName(name)
    this.helpText = field.helpText || ''
  }
})

BoundField.prototype.errors = function() {
  return this.form.errors(this.name) || new this.form.errorConstructor()
}

BoundField.prototype.isHidden = function() {
  return this.field.widget.isHidden
}

/**
 * Calculates and returns the <code>id</code> attribute for this BoundFIeld
 * if the associated form has an autoId. Returns an empty string otherwise.
 */
BoundField.prototype.autoId = function() {
  var autoId = this.form.autoId
  if (autoId) {
    autoId = ''+autoId
    if (autoId.indexOf('{name}') != -1) {
      return format(autoId, {name: this.htmlName})
    }
    return this.htmlName
  }
  return ''
}

  /**
   * Returns the data for this BoundFIeld, or <code>null</code> if it wasn't
   * given.
   */
BoundField.prototype.data = function() {
  return this.field.widget.valueFromData(this.form.data,
                                         this.form.files,
                                         this.htmlName)
}

  /**
   * Wrapper around the field widget's <code>idForLabel</code> method.
   * Useful, for example, for focusing on this field regardless of whether
   * it has a single widget or a MutiWidget.
   */
BoundField.prototype.idForLabel = function() {
  var widget = this.field.widget
    , id = object.get(widget.attrs, 'id', this.autoId())
  return widget.idForLabel(id)
}

/**
 * Assuming this method will only be used when DOMBuilder is configured to
 * generate HTML.
 */
BoundField.prototype.toString = function() {
  return ''+this.defaultRendering()
}

BoundField.prototype.defaultRendering = function() {
  if (this.field.showHiddenInitial) {
    return DOMBuilder.fragment(this.asWidget(),
                               this.asHidden({onlyInitial: true}))
  }
  return this.asWidget()
}

/**
 * Yields SubWidgets that comprise all widgets in this BoundField.  This really
 * is only useful for RadioSelect widgets, so that you can iterate over
 * individual radio buttons when rendering.
 */
BoundField.prototype.__iter__ = function() {
  return this.field.widget.subWidgets(this.htmlName, this.value())
}

/**
 * Renders a widget for the field.
 *
 * @param {Object} [kwargs] configuration options
 * @config {Widget} [widget] an override for the widget used to render the field
 *                           - if not provided, the field's configured widget
 *                           will be used
 * @config {Object} [attrs] additional attributes to be added to the field's
 *                          widget.
 */
BoundField.prototype.asWidget = function(kwargs) {
  kwargs = object.extend({
    widget: null, attrs: null, onlyInitial: false
  }, kwargs)
  var widget = (kwargs.widget !== null ? kwargs.widget : this.field.widget)
    , attrs = (kwargs.attrs !== null ? kwargs.attrs : {})
    , autoId = this.autoId()
    , name = !kwargs.onlyInitial ? this.htmlName : this.htmlInitialName
  if (autoId &&
      typeof attrs.id == 'undefined' &&
      typeof widget.attrs.id == 'undefined') {
    attrs.id = (!kwargs.onlyInitial ? autoId : this.htmlInitialId)
  }

  return widget.render(name, this.value(), {attrs: attrs})
}

/**
 * Renders the field as a text input.
 *
 * @param {Object} [kwargs] widget options.
 */
BoundField.prototype.asText = function(kwargs) {
  kwargs = object.extend({}, kwargs, {widget: TextInput()})
  return this.asWidget(kwargs)
}

/**
 * Renders the field as a textarea.
 *
 * @param {Object} [kwargs] widget options.
 */
BoundField.prototype.asTextarea = function(kwargs) {
  kwargs = object.extend({}, kwargs, {widget: Textarea()})
  return this.asWidget(kwargs)
}

/**
 * Renders the field as a hidden field.
 *
 * @param {Object} [attrs] additional attributes to be added to the field's
 *                         widget.
 */
BoundField.prototype.asHidden = function(kwargs) {
  kwargs = object.extend({}, kwargs, {widget: new this.field.hiddenWidget()})
  return this.asWidget(kwargs)
}

/**
 * Returns the value for this BoundField, using the initial value if the form
 * is not bound or the data otherwise.
 */
BoundField.prototype.value = function() {
  var data
  if (!this.form.isBound) {
    data = object.get(this.form.initial, this.name, this.field.initial)
    if (is.Function(data)) {
      data = data()
    }
  }
  else {
    data = this.field.boundData(this.data(),
                                object.get(this.form.initial,
                                           this.name,
                                           this.field.initial))
  }
  return this.field.prepareValue(data)
}

/**
 * Creates the label value to be displayed, adding the form suffix if there is
 * one and the label doesn't end in punctuation.
 */
BoundField.prototype.getLabel = function() {
  var isSafe = DOMBuilder.html && DOMBuilder.html.isSafe(this.label)
  var label = ''+this.label
  // Only add the suffix if the label does not end in punctuation
  if (this.form.labelSuffix &&
      ':?.!'.indexOf(label.charAt(label.length - 1)) == -1) {
    label += this.form.labelSuffix
  }
  if (isSafe) {
    label = DOMBuilder.html.markSafe(label)
  }
  return label
}

/**
 * Wraps the given contents in a &lt;label&gt;, if the field has an ID
 * attribute. Does not HTML-escape the contents. If contents aren't given, uses
 * the field's HTML-escaped label.
 *
 * If attrs are given, they're used as HTML attributes on the <label> tag.
 *
 * @param {Object} [kwargs] configuration options.
 * @config {String} [contents] contents for the label - if not provided, label
 *                             contents will be generated from the field itself.
 * @config {Object} [attrs] additional attributes to be added to the label.
 */
BoundField.prototype.labelTag = function(kwargs) {
  kwargs = object.extend({contents: null, attrs: null}, kwargs)
  var contents
    , widget = this.field.widget
    , id
    , attrs
  if (kwargs.contents !== null) {
    contents = kwargs.contents
  }
  else {
    contents = this.getLabel()
  }

  id = object.get(widget.attrs, 'id', this.autoId())
  if (id) {
    attrs = object.extend(kwargs.attrs || {}, {'for': widget.idForLabel(id)})
    contents = DOMBuilder.createElement('label', attrs, [contents])
  }
  return contents
}

/**
 * Returns a string of space-separated CSS classes for this field.
 */
BoundField.prototype.cssClasses = function(extraClasses) {
  extraClasses = extraClasses || this.field.extraClasses
  if (extraClasses !== null && is.Function(extraClasses.split)) {
    extraClasses = extraClasses.split()
  }
  extraClasses = extraClasses || []
  if (this.errors().isPopulated() &&
      typeof this.form.errorCssClass != 'undefined') {
    extraClasses.push(this.form.errorCssClass)
  }
  if (this.field.required && typeof this.form.requiredCssClass != 'undefined') {
    extraClasses.push(this.form.requiredCssClass)
  }
  return extraClasses.join(' ')
}

/**
 * A collection of Fields that knows how to validate and display itself.
 * @constructor
 * @param {Object}
 */
var BaseForm = Concur.extend({
  constructor: function(kwargs) {
    kwargs = object.extend({
      data: null, files: null, autoId: 'id_{name}', prefix: null,
      initial: null, errorConstructor: ErrorList, labelSuffix: ':',
      emptyPermitted: false
    }, kwargs)
    this.isBound = kwargs.data !== null || kwargs.files !== null
    this.data = kwargs.data || {}
    this.files = kwargs.files || {}
    this.autoId = kwargs.autoId
    this.prefix = kwargs.prefix
    this.initial = kwargs.initial || {}
    this.errorConstructor = kwargs.errorConstructor
    this.labelSuffix = kwargs.labelSuffix
    this.emptyPermitted = kwargs.emptyPermitted
    this._errors = null; // Stores errors after clean() has been called
    this._changedData = null

    // The baseFields attribute is the *prototype-wide* definition of fields.
    // Because a particular *instance* might want to alter this.fields, we
    // create this.fields here by deep copying baseFields. Instances should
    // always modify this.fields; they should not modify baseFields.
    this.fields = copy.deepCopy(this.baseFields)
  }
})

/**
 * Getter for errors, which first cleans the form if there are no errors
 * defined yet.
 *
 * @return errors for the data provided for the form.
 */
BaseForm.prototype.errors = function(name) {
  if (this._errors === null) {
    this.fullClean()
  }
  if (name) {
    return this._errors.get(name)
  }
  return this._errors
}

BaseForm.prototype.changedData = function() {
  if (this._changedData === null) {
    this._changedData = []
    // XXX: For now we're asking the individual fields whether or not
    // the data has changed. It would probably be more efficient to hash
    // the initial data, store it in a hidden field, and compare a hash
    // of the submitted data, but we'd need a way to easily get the
    // string value for a given field. Right now, that logic is embedded
    // in the render method of each field's widget.
    for (var name in this.fields) {
      if (!object.hasOwn(this.fields, name)) {
        continue
      }

      var field = this.fields[name]
        , prefixedName = this.addPrefix(name)
        , dataValue = field.widget.valueFromData(this.data,
                                                 this.files,
                                                 prefixedName)
        , initialValue = object.get(this.initial, name, field.initial)

      if (field.showHiddenInitial) {
        var initialPrefixedName = this.addInitialPrefix(name)
          , hiddenWidget = new field.hiddenWidget()
          , initialValue = hiddenWidget.valueFromData(
                this.data, this.files, initialPrefixedName)
      }

      if (field._hasChanged(initialValue, dataValue)) {
        this._changedData.push(name)
      }
    }
  }
  return this._changedData
}

BaseForm.prototype.toString = function() {
  return ''+this.defaultRendering()
}

BaseForm.prototype.defaultRendering = function() {
  return this.asTable()
}

/**
 * In lieu of __iter__, creates a {@link BoundField} for each field in the form,
 * in the order in which the fields were created.
 *
 * @param {Function} [test] if provided, this function will be called with
 *                          <var>field</var> and <var>name</var> arguments -
 *                          BoundFields will only be generated for fields for
 *                          which <code>true</code> is returned.
 *
 * @return a list of <code>BoundField</code> objects - one for each field in
 *         the form, in the order in which the fields were created.
 */
BaseForm.prototype.boundFields = function(test) {
  test = test || function() { return true }

  var fields = []
  for (var name in this.fields) {
    if (object.hasOwn(this.fields, name) &&
        test(this.fields[name], name) === true) {
      fields.push(BoundField(this, this.fields[name], name))
    }
  }
  return fields
}

/**
 * {name -> BoundField} version of boundFields
 */
BaseForm.prototype.boundFieldsObj = function(test) {
  test = test || function() { return true }

  var fields = {}
  for (var name in this.fields) {
    if (object.hasOwn(this.fields, name) &&
        test(this.fields[name], name) === true) {
      fields[name] = BoundField(this, this.fields[name], name)
    }
  }
  return fields
}

/**
 * In lieu of __getitem__, creates a {@link BoundField} for the field with the
 * given name.
 *
 * @param {String} name a field name.
 *
 * @return a <code>BoundField</code> for the field with the given name, if one
 *         exists.
 */
BaseForm.prototype.boundField = function(name) {
  if (!object.hasOwn(this.fields, name)) {
    throw new Error("Form does not have a '" + name + "' field.")
  }
  return BoundField(this, this.fields[name], name)
}

/**
 * Determines whether or not the form has errors.
 * @return {Boolean}
 */
BaseForm.prototype.isValid = function() {
  if (!this.isBound) {
    return false
  }
  return !this.errors().isPopulated()
}

/**
 * Returns the field name with a prefix appended, if this Form has a prefix set.
 *
 * @param {String} fieldName a field name.
 *
 * @return a field name with a prefix appended, if this Form has a prefix set,
 *         otherwise <code>fieldName</code> is returned as-is.
 */
BaseForm.prototype.addPrefix = function(fieldName) {
  if (this.prefix !== null) {
      return format('{prefix}-{fieldName}',
                    {prefix: this.prefix, fieldName: fieldName})
  }
  return fieldName
}

/**
 * Add an initial prefix for checking dynamic initial values.
 */
BaseForm.prototype.addInitialPrefix = function(fieldName) {
  return format('initial-{fieldName}',
                {fieldName: this.addPrefix(fieldName)})
}

/**
 * Helper function for outputting HTML.
 *
 * @param {Function} normalRow a function which produces a normal row.
 * @param {Function} errorRow a function which produces an error row.
 * @param {Boolean} errorsOnSeparateRow determines if errors are placed in their
 *                                      own row, or in the row for the field
 *                                      they are related to.
 * @param {Boolean} [doNotCoerce] if <code>true</code>, the resulting rows will
 *                                not be coerced to a String if we're operating
 *                                in HTML mode - defaults to <code>false</code>.
 *
 * @return if we're operating in DOM mode returns a list of DOM elements
 *         representing rows, otherwise returns an HTML string, with rows
 *         separated by linebreaks.
 */
BaseForm.prototype._htmlOutput = function(normalRow,
                                          errorRow,
                                          errorsOnSeparateRow,
                                          doNotCoerce) {
  // Errors that should be displayed above all fields
  var topErrors = this.nonFieldErrors()
    , rows = []
    , hiddenFields = []
    , htmlClassAttr = null
    , cssClasses = null
    , hiddenBoundFields = this.hiddenFields()
    , visibleBoundFields = this.visibleFields()
    , bf, bfErrors

  for (var i = 0, l = hiddenBoundFields.length; i < l; i++) {
    bf = hiddenBoundFields[i]
    bfErrors = bf.errors()
    if (bfErrors.isPopulated()) {
      for (var j = 0, m = bfErrors.errors.length; j < m; j++) {
        topErrors.errors.push('(Hidden field ' + bf.name + ') ' +
                              bfErrors.errors[j])
      }
    }
    hiddenFields.push(bf.defaultRendering())
  }

  for (var i = 0, l = visibleBoundFields.length; i < l; i++) {
    bf = visibleBoundFields[i]
    htmlClassAttr = ''
    cssClasses = bf.cssClasses()
    if (cssClasses) {
      htmlClassAttr = cssClasses
    }

    // Variables which can be optional in each row
    var errors = null
      , label = null
      , helpText = null
      , extraContent = null

    bfErrors = bf.errors()
    if (bfErrors.isPopulated()) {
      errors = new this.errorConstructor()
      for (var j = 0, m = bfErrors.errors.length; j < m; j++) {
        errors.errors.push(bfErrors.errors[j])
      }

      if (errorsOnSeparateRow === true) {
        rows.push(errorRow(errors.defaultRendering()))
        errors = null
      }
    }

    if (bf.label) {
      label = bf.labelTag() || ''
    }

    if (bf.field.helpText) {
      helpText = bf.field.helpText
    }

    // If this is the last row, it should include any hidden fields
    if (i == l - 1 && hiddenFields.length > 0) {
      extraContent = hiddenFields
    }
    if (errors !== null) {
      errors = errors.defaultRendering()
    }
    rows.push(normalRow(label, bf.defaultRendering(), helpText, errors,
                        htmlClassAttr, extraContent))
  }

  if (topErrors.isPopulated()) {
    // Add hidden fields to the top error row if it's being displayed and
    // there are no other rows.
    var extraContent = null
    if (hiddenFields.length > 0 && rows.length == 0) {
      extraContent = hiddenFields
    }
    rows.splice(0, 0, errorRow(topErrors.defaultRendering(), extraContent))
  }

  // Put hidden fields in their own error row if there were no rows to
  // display.
  if (hiddenFields.length > 0 && rows.length == 0) {
    rows.push(errorRow('', hiddenFields))
  }
  if (doNotCoerce === true || DOMBuilder.mode == 'dom') {
    return rows
  }
  else {
    return DOMBuilder.html.markSafe(rows.join('\n'))
  }
}

/**
 * Returns this form rendered as HTML &lt;tr&gt;s - excluding the
 * &lt;table&gt;&lt;/table&gt;.
 *
 * @param {Boolean} [doNotCoerce] if <code>true</code>, the resulting rows will
 *                                not be coerced to a String if we're operating
 *                                in HTML mode - defaults to <code>false</code>.
 */
BaseForm.prototype.asTable = (function() {
  var normalRow = function(label, field, helpText, errors, htmlClassAttr,
                           extraContent) {
    var contents = []
    if (errors) {
      contents.push(errors)
    }
    contents.push(field)
    if (helpText) {
      contents.push(DOMBuilder.createElement('br'))
      contents.push(helpText)
    }
    if (extraContent) {
      contents = contents.concat(extraContent)
    }

    var rowAttrs = {}
    if (htmlClassAttr) {
      rowAttrs['class'] = htmlClassAttr
    }
    return DOMBuilder.createElement('tr', rowAttrs, [
      DOMBuilder.createElement('th', {}, [label]),
      DOMBuilder.createElement('td', {}, contents)
    ])
  }

  var errorRow = function(errors, extraContent) {
    var contents = [errors]
    if (extraContent) {
      contents = contents.concat(extraContent)
    }
    return DOMBuilder.createElement('tr', {}, [
      DOMBuilder.createElement('td', {colSpan: 2}, contents)
    ])
  }

  return function(doNotCoerce) {
    return this._htmlOutput(normalRow, errorRow, false, doNotCoerce)
  }
})()

/**
 * Returns this form rendered as HTML &lt;li&gt;s - excluding the
 * &lt;ul&gt;&lt;/ul&gt;.
 *
 * @param {Boolean} [doNotCoerce] if <code>true</code>, the resulting rows will
 *                                not be coerced to a String if we're operating
 *                                in HTML mode - defaults to <code>false</code>.
 */
BaseForm.prototype.asUL = (function() {
  var normalRow = function(label, field, helpText, errors, htmlClassAttr,
                           extraContent) {
    var contents = []
    if (errors) {
      contents.push(errors)
    }
    if (label) {
      contents.push(label)
    }
    contents.push(' ')
    contents.push(field)
    if (helpText) {
      contents.push(' ')
      contents.push(helpText)
    }
    if (extraContent) {
      contents = contents.concat(extraContent)
    }

    var rowAttrs = {}
    if (htmlClassAttr) {
      rowAttrs['class'] = htmlClassAttr
    }
    return DOMBuilder.createElement('li', rowAttrs, contents)
  }

  var errorRow = function(errors, extraContent) {
    var contents = [errors]
    if (extraContent) {
      contents = contents.concat(extraContent)
    }
    return DOMBuilder.createElement('li', {}, contents)
  }

  return function(doNotCoerce) {
    return this._htmlOutput(normalRow, errorRow, false, doNotCoerce)
  }
})()

/**
 * Returns this form rendered as HTML &lt;p&gt;s.
 *
 * @param {Boolean} [doNotCoerce] if <code>true</code>, the resulting rows will
 *                                not be coerced to a String if we're operating
 *                                in HTML mode - defaults to <code>false</code>.
 */
BaseForm.prototype.asP = (function() {
  var normalRow = function(label, field, helpText, errors, htmlClassAttr,
                           extraContent) {
    var contents = []
    if (label) {
      contents.push(label)
    }
    contents.push(' ')
    contents.push(field)
    if (helpText) {
      contents.push(' ')
      contents.push(helpText)
    }
    if (extraContent) {
      contents = contents.concat(extraContent)
    }

    var rowAttrs = {}
    if (htmlClassAttr) {
      rowAttrs['class'] = htmlClassAttr
    }
    return DOMBuilder.createElement('p', rowAttrs, contents)
  }

  var errorRow = function(errors, extraContent) {
    if (extraContent) {
      // When provided extraContent is usually hidden fields, so we need
      // to give it a block scope wrapper in this case for HTML validity.
      return DOMBuilder.createElement('div', {}, [errors].concat(extraContent))
    }
    // Otherwise, just display errors as they are
    return errors
  }

  return function(doNotCoerce) {
    return this._htmlOutput(normalRow, errorRow, true, doNotCoerce)
  }
})()

/**
 * Returns errors that aren't associated with a particular field.
 *
 * @return errors that aren't associated with a particular field - i.e., errors
 *         generated by <code>clean()</code>. Will be empty if there are none.
 */
BaseForm.prototype.nonFieldErrors = function() {
  return (this.errors(NON_FIELD_ERRORS) || new this.errorConstructor())
}

/**
 * Returns the raw value for a particular field name. This is just a convenient
 * wrapper around widget.valueFromData.
 */
BaseForm.prototype._rawValue = function(fieldname) {
  var field = this.fields[fieldname]
    , prefix = this.addPrefix(fieldname)
  return field.widget.valueFromData(this.data, this.files, prefix)
}

/**
 * Cleans all of <code>data</code> and populates <code>_errors</code> and
 * <code>cleanedData</code>.
 */
BaseForm.prototype.fullClean = function() {
  this._errors = ErrorObject()
  if (!this.isBound) {
    return; // Stop further processing
  }

  this.cleanedData = {}

  // If the form is permitted to be empty, and none of the form data has
  // changed from the initial data, short circuit any validation.
  if (this.emptyPermitted && !this.hasChanged()) {
    return
  }

  this._cleanFields()
  this._cleanForm()
  this._postClean()

  if (this._errors.isPopulated()) {
    delete this.cleanedData
  }
}

BaseForm.prototype._cleanFields = function() {
  for (var name in this.fields)
  {
    if (!object.hasOwn(this.fields, name)) {
      continue
    }

    var field = this.fields[name]
        // valueFromData() gets the data from the data objects.
        // Each widget type knows how to retrieve its own data, because some
        // widgets split data over several HTML fields.
      , value = field.widget.valueFromData(this.data, this.files,
                                           this.addPrefix(name))
    try {
      if (field instanceof FileField) {
        var initial = object.get(this.initial, name, field.initial)
        value = field.clean(value, initial)
      }
      else {
        value = field.clean(value)
      }
      this.cleanedData[name] = value

      // Try clean_name
      var customClean = 'clean_' + name
      if (typeof this[customClean] != 'undefined' &&
          is.Function(this[customClean])) {
         this.cleanedData[name] = this[customClean]()
         continue
      }

      // Try cleanName
      customClean = 'clean' + name.charAt(0).toUpperCase() +
                    name.substr(1)
      if (typeof this[customClean] != 'undefined' &&
          is.Function(this[customClean])) {
        this.cleanedData[name] = this[customClean]()
      }
    }
    catch (e) {
      if (!(e instanceof ValidationError)) {
        throw e
      }
      this._errors.set(name, new this.errorConstructor(e.messages))
      if (typeof this.cleanedData[name] != 'undefined') {
        delete this.cleanedData[name]
      }
    }
  }
}

BaseForm.prototype._cleanForm = function() {
  try {
    this.cleanedData = this.clean()
  }
  catch (e) {
    if (!(e instanceof ValidationError)) {
      throw e
    }
    this._errors.set(NON_FIELD_ERRORS,
                     new this.errorConstructor(e.messages))
  }
}

/**
 * An internal hook for performing additional cleaning after form cleaning is
 * complete.
 */
BaseForm.prototype._postClean = function() {}

/**
 * Hook for doing any extra form-wide cleaning after each Field's
 * <code>clean()</code> has been called. Any {@link ValidationError} raised by
 * this method will not be associated with a particular field; it will have a
 * special-case association with the field named <code>__all__</code>.
 *
 * @return validated, cleaned data.
 */
BaseForm.prototype.clean = function() {
  return this.cleanedData
}

/**
 * Determines if data differs from initial.
 */
BaseForm.prototype.hasChanged = function() {
  return (this.changedData().length > 0)
}

/**
 * Determines if the form needs to be multipart-encrypted, in other words, if it
 * has a {@link FileInput}.
 *
 * @return <code>true</code> if the form needs to be multipart-encrypted,
 *         <code>false</code> otherwise.
 */
BaseForm.prototype.isMultipart = function() {
  for (var name in this.fields) {
    if (object.hasOwn(this.fields, name) &&
        this.fields[name].widget.needsMultipartForm) {
      return true
    }
  }
  return false
}

/**
 * Returns a list of all the {@link BoundField} objects that correspond to
 * hidden fields. Useful for manual form layout.
 */
BaseForm.prototype.hiddenFields = function() {
  return this.boundFields(function(field) {
    return field.widget.isHidden
  })
}

/**
 * Returns a list of {@link BoundField} objects that do not correspond to
 * hidden fields. The opposite of the hiddenFields() method.
 */
BaseForm.prototype.visibleFields = function() {
  return this.boundFields(function(field) {
    return !field.widget.isHidden
  })
}

function DeclarativeFieldsMeta(prototypeProps, constructorProps) {
  // Pop fields from prototypeProps to contribute towards baseFields
  var fields = []
  for (var name in prototypeProps) {
    if (object.hasOwn(prototypeProps, name) &&
        prototypeProps[name] instanceof Field) {
      fields.push([name, prototypeProps[name]])
      delete prototypeProps[name]
    }
  }
  fields.sort(function(a, b) {
    return a[1].creationCounter - b[1].creationCounter
  })

  // If any mixins which look like form constructors were given, inherit their
  // fields.
  if (object.hasOwn(prototypeProps, '__mixin__')) {
    var mixins = prototypeProps.__mixin__
    if (!is.Array(mixins)) {
      mixins = [mixins]
    }
    // Note that we loop over mixed in forms in *reverse* to preserve the
    // correct order of fields.
    for (var i = mixins.length - 1; i >= 0; i--) {
      var mixin = mixins[i]
      if (is.Function(mixin) &&
          typeof mixin.prototype.baseFields != 'undefined') {
        fields = object.items(mixin.prototype.baseFields).concat(fields)
        // Replace the mixin with an object containing the other prototype
        // properties, to avoid overwriting baseFields when the mixin is
        // applied.
        var formMixin = object.extend({}, mixin.prototype)
        delete formMixin.baseFields
        mixins[i] = formMixin
      }
    }
    prototypeProps.__mixin__ = mixins
  }

  // If we're extending from a form which already has some baseFields, they
  // should be first.
  if (typeof this.baseFields != 'undefined') {
    fields = object.items(this.baseFields).concat(fields)
  }

  // Where -> is "overridden by":
  // parent fields -> mixin form fields -> given fields
  prototypeProps.baseFields = object.fromItems(fields)
}

var Form = BaseForm.extend({
  __meta__: DeclarativeFieldsMeta
})

module.exports = {
  NON_FIELD_ERRORS: NON_FIELD_ERRORS
, BoundField: BoundField
, BaseForm: BaseForm
, DeclarativeFieldsMeta: DeclarativeFieldsMeta
, Form: Form
}
})

require.define("./formsets", function(module, exports, require) {
var Concur = require('Concur')
  , DOMBuilder = require('DOMBuilder')
  , object = require('isomorph/object')
  , validators = require('validators')

var util = require('./util')
  , widgets = require('./widgets')
  , fields = require('./fields')
  , forms = require('./forms')

var ErrorList = util.ErrorList
  , ValidationError = validators.ValidationError
  , IntegerField = fields.IntegerField
  , BooleanField = fields.BooleanField
  , HiddenInput = widgets.HiddenInput

// Special field names
var TOTAL_FORM_COUNT = 'TOTAL_FORMS'
  , INITIAL_FORM_COUNT = 'INITIAL_FORMS'
  , MAX_NUM_FORM_COUNT = 'MAX_NUM_FORMS'
  , ORDERING_FIELD_NAME = 'ORDER'
  , DELETION_FIELD_NAME = 'DELETE'

/**
 * ManagementForm is used to keep track of how many form instances are displayed
 * on the page. If adding new forms via javascript, you should increment the
 * count field of this form as well.
 * @constructor
 */
var ManagementForm = (function() {
  var fields = {}
  fields[TOTAL_FORM_COUNT] = IntegerField({widget: HiddenInput})
  fields[INITIAL_FORM_COUNT] = IntegerField({widget: HiddenInput})
  fields[MAX_NUM_FORM_COUNT] = IntegerField({required: false, widget: HiddenInput})
  return forms.Form.extend(fields)
})()

/**
 * A collection of instances of the same Form.
 * @constructor
 * @param {Object=} kwargs
 */
var BaseFormSet = Concur.extend({
  constructor: function(kwargs) {
    kwargs = object.extend({
      data: null, files: null, autoId: 'id_{name}', prefix: null,
      initial: null, errorConstructor: ErrorList
    }, kwargs)
    this.isBound = kwargs.data !== null || kwargs.files !== null
    this.prefix = kwargs.prefix || BaseFormSet.getDefaultPrefix()
    this.autoId = kwargs.autoId
    this.data = kwargs.data || {}
    this.files = kwargs.files || {}
    this.initial = kwargs.initial
    this.errorConstructor = kwargs.errorConstructor
    this._errors = null
    this._nonFormErrors = null

    // Construct the forms in the formset
    this._constructForms()
  }
})
BaseFormSet.getDefaultPrefix = function() {
  return 'form'
}

/**
 * Returns the ManagementForm instance for this FormSet.
 */
BaseFormSet.prototype.managementForm = function() {
  if (this.isBound) {
    var form = new ManagementForm({data: this.data, autoId: this.autoId,
                                  prefix: this.prefix})
    if (!form.isValid()) {
      throw ValidationError('ManagementForm data is missing or has been tampered with')
    }
  }
  else {
    var initial = {}
    initial[TOTAL_FORM_COUNT] = this.totalFormCount()
    initial[INITIAL_FORM_COUNT] = this.initialFormCount()
    initial[MAX_NUM_FORM_COUNT] = this.maxNum
    var form = new ManagementForm({autoId: this.autoId,
                                   prefix: this.prefix,
                                   initial: initial})
  }
  return form
}

BaseFormSet.prototype.initialForms = function() {
  return this.forms.slice(0, this.initialFormCount())
}

BaseFormSet.prototype.extraForms = function() {
  return this.forms.slice(this.initialFormCount())
}

BaseFormSet.prototype.emptyForm = function(kwargs) {
  var defaults = {
    autoId: this.autoId,
    prefix: this.addPrefix('__prefix__'),
    emptyPermitted: true
  }
  var formKwargs = object.extend(defaults, kwargs)
  var form = new this.form(formKwargs)
  this.addFields(form, null)
  return form
}

/**
 * Returns a list of form.cleanedData objects for every form in this.forms.
 */
BaseFormSet.prototype.cleanedData = function() {
  if (!this.isValid()) {
    throw new Error(this.constructor.name +
                    " object has no attribute 'cleanedData'")
  }
  var cleaned = []
  for (var i = 0, l = this.forms.length; i < l; i++) {
    cleaned.push(this.forms[i].cleanedData)
  }
  return cleaned
}

/**
 * Returns a list of forms that have been marked for deletion. Throws an
 * error if deletion is not allowed.
 */
BaseFormSet.prototype.deletedForms = function() {
  if (!this.isValid() || !this.canDelete) {
    throw new Error(this.constructor.name +
                    " object has no attribute 'deletedForms'")
  }

  // Construct _deletedFormIndexes, which is just a list of form indexes
  // that have had their deletion widget set to true.
  if (typeof this._deletedFormIndexes == 'undefined') {
    this._deletedFormIndexes = []
    var totalFormCount = this.totalFormCount()
    for (var i = 0; i < totalFormCount; i++) {
      var form = this.forms[i]
      // If this is an extra form and hasn't changed, ignore it
      if (i >= this.initialFormCount() && !form.hasChanged()) {
        continue
      }
      if (this._shouldDeleteForm(form)) {
        this._deletedFormIndexes.push(i)
      }
    }
  }

  var deletedForms = []
  for (var i = 0, l = this._deletedFormIndexes.length; i < l; i++) {
    deletedForms.push(this.forms[this._deletedFormIndexes[i]])
  }
  return deletedForms
}

/**
 * Returns a list of forms in the order specified by the incoming data.
 * Throws an Error if ordering is not allowed.
 */
BaseFormSet.prototype.orderedForms = function() {
  if (!this.isValid() || !this.canOrder) {
    throw new Error(this.constructor.name +
                    " object has no attribute 'orderedForms'")
  }

  // Construct _ordering, which is a list of [form index, orderFieldValue]
  // pairs. After constructing this list, we'll sort it by orderFieldValue
  // so we have a way to get to the form indexes in the order specified by
  // the form data.
  if (typeof this._ordering == 'undefined') {
    this._ordering = []
    var totalFormCount = this.totalFormCount()
    for (var i = 0; i < totalFormCount; i++) {
      var form = this.forms[i]
      // If this is an extra form and hasn't changed, ignore it
      if (i >= this.initialFormCount() && !form.hasChanged()) {
        continue
      }
      // Don't add data marked for deletion
      if (this.canDelete && this._shouldDeleteForm(form)) {
        continue
      }
      this._ordering.push([i, form.cleanedData[ORDERING_FIELD_NAME]])
    }

    // Null should be sorted below anything else. Allowing null as a
    // comparison value makes it so we can leave ordering fields blank.
    this._ordering.sort(function(x, y) {
      if (x[1] === null && y[1] === null) {
        // Sort by form index if both order field values are null
        return x[0] - y[0]
      }
      if (x[1] === null) {
        return 1
      }
      if (y[1] === null) {
        return -1
      }
      return x[1] - y[1]
    })
  }

  var orderedForms = []
  for (var i = 0, l = this._ordering.length; i < l; i++) {
    orderedForms.push(this.forms[this._ordering[i][0]])
  }
  return orderedForms
}

/**
 * Returns a list of form.errors for every form in this.forms.
 */
BaseFormSet.prototype.errors = function() {
  if (this._errors === null) {
    this.fullClean()
  }
  return this._errors
}


BaseFormSet.prototype.toString = function() {
  return ''+this.defaultRendering()
}

BaseFormSet.prototype.defaultRendering = function() {
  return this.asTable()
}

/**
 * Determines the number of form instances this formset contains, based on
 * either submitted management data or initial configuration, as appropriate.
 */
BaseFormSet.prototype.totalFormCount = function() {
  if (this.isBound) {
    return this.managementForm().cleanedData[TOTAL_FORM_COUNT]
  }
  else {
    var initialForms = this.initialFormCount()
      , totalForms = this.initialFormCount() + this.extra
    // Allow all existing related objects/inlines to be displayed, but don't
    // allow extra beyond max_num.
    if (this.maxNum !== null &&
        initialForms > this.maxNum &&
        this.maxNum >= 0) {
      totalForms = initialForms
    }
    if (this.maxNum !== null &&
        totalForms > this.maxNum &&
        this.maxNum >= 0) {
      totalForms = this.maxNum
    }
    return totalForms
  }
}

/**
 * Determines the number of initial form instances this formset contains, based
 * on either submitted management data or initial configuration, as appropriate.
 */
BaseFormSet.prototype.initialFormCount = function() {
  if (this.isBound) {
    return this.managementForm().cleanedData[INITIAL_FORM_COUNT]
  }
  else {
    // Use the length of the inital data if it's there, 0 otherwise.
    var initialForms = (this.initial !== null && this.initial.length > 0
                        ? this.initial.length
                        : 0)
    if (this.maxNum !== null &&
        initialForms > this.maxNum &&
        this.maxNum >= 0) {
      initialForms = this.maxNum
    }
    return initialForms
  }
}

/**
 * Instantiates all the forms and put them in <code>this.forms</code>.
 */
BaseFormSet.prototype._constructForms = function() {
  this.forms = []
  var totalFormCount = this.totalFormCount()
  for (var i = 0; i < totalFormCount; i++) {
    this.forms.push(this._constructForm(i))
  }
}

/**
 * Instantiates and returns the <code>i</code>th form instance in the formset.
 */
BaseFormSet.prototype._constructForm = function(i, kwargs) {
  var defaults = {autoId: this.autoId, prefix: this.addPrefix(i)}

  if (this.isBound) {
    defaults['data'] = this.data
    defaults['files'] = this.files
  }

  if (this.initial !== null && this.initial.length > 0) {
    if (typeof this.initial[i] != 'undefined') {
      defaults['initial'] = this.initial[i]
    }
  }

  // Allow extra forms to be empty
  if (i >= this.initialFormCount()) {
    defaults['emptyPermitted'] = true
  }

  var formKwargs = object.extend(defaults, kwargs)
  var form = new this.form(formKwargs)
  this.addFields(form, i)
  return form
}

/**
 * Returns an ErrorList of errors that aren't associated with a particular
 * form -- i.e., from <code>formset.clean()</code>. Returns an empty ErrorList
 * if there are none.
 */
BaseFormSet.prototype.nonFormErrors = function() {
  if (this._nonFormErrors !== null) {
    return this._nonFormErrors
  }
  return new this.errorConstructor()
}

BaseFormSet.prototype._shouldDeleteForm = function(form) {
  // The way we lookup the value of the deletion field here takes
  // more code than we'd like, but the form's cleanedData will not
  // exist if the form is invalid.
  var field = form.fields[DELETION_FIELD_NAME]
    , rawValue = form._rawValue(DELETION_FIELD_NAME)
    , shouldDelete = field.clean(rawValue)
  return shouldDelete
}

/**
 * Returns <code>true</code> if <code>form.errors</code> is empty for every form
 * in <code>this.forms</code>
 */
BaseFormSet.prototype.isValid = function() {
  if (!this.isBound) {
    return false
  }

  // We loop over every form.errors here rather than short circuiting on the
  // first failure to make sure validation gets triggered for every form.
  var formsValid = true
    , errors = this.errors() // Triggers fullClean()
    , totalFormCount = this.totalFormCount()
  for (var i = 0; i < totalFormCount; i++) {
    var form = this.forms[i]
    if (this.canDelete && this._shouldDeleteForm(form)) {
      // This form is going to be deleted so any of its errors should
      // not cause the entire formset to be invalid.
      continue
    }
    if (errors[i].isPopulated()) {
      formsValid = false
    }
  }

  return (formsValid && !this.nonFormErrors().isPopulated())
}

/**
 * Cleans all of <code>this.data</code> and populates <code>this._errors</code>.
 */
BaseFormSet.prototype.fullClean = function() {
  this._errors = []
  if (!this.isBound) {
    return; // Stop further processing
  }

  var totalFormCount = this.totalFormCount()
  for (var i = 0; i < totalFormCount; i++) {
    var form = this.forms[i]
    this._errors.push(form.errors())
  }

  // Give this.clean() a chance to do cross-form validation.
  try {
    this.clean()
  }
  catch (e) {
    if (!(e instanceof ValidationError)) {
      throw e
    }
    this._nonFormErrors = new this.errorConstructor(e.messages)
  }
}

/**
 * Hook for doing any extra formset-wide cleaning after Form.clean() has been
 * called on every form. Any ValidationError raised by this method will not be
 * associated with a particular form; it will be accesible via
 * formset.nonFormErrors()
 */
BaseFormSet.prototype.clean = function() {}

/**
 * Returns true if any form differs from initial.
 */
BaseFormSet.prototype.hasChanged = function() {
  for (var i = 0, l = this.forms.length; i < l; i++) {
    if (this.forms[i].hasChanged()) {
      return true
    }
  }
  return false
}

/**
 * A hook for adding extra fields on to each form instance.
 *
 * @param {Form} form the form fields are to be added to.
 * @param {Number} index the index of the given form in the formset.
 */
BaseFormSet.prototype.addFields = function(form, index) {
  if (this.canOrder) {
    // Only pre-fill the ordering field for initial forms
    if (index !== null && index < this.initialFormCount()) {
      form.fields[ORDERING_FIELD_NAME] =
          IntegerField({label: 'Order', initial: index + 1,
                        required: false})
    }
    else {
      form.fields[ORDERING_FIELD_NAME] =
          IntegerField({label: 'Order', required: false})
    }
  }

  if (this.canDelete) {
    form.fields[DELETION_FIELD_NAME] =
        BooleanField({label: 'Delete', required: false})
  }
}

/**
 * Returns the formset prefix with the form index appended.
 *
 * @param {Number} index the index of a form in the formset.
 */
BaseFormSet.prototype.addPrefix = function(index) {
  return this.prefix + '-' + index
}

/**
 * Returns <code>true</code> if the formset needs to be multipart-encrypted,
 * i.e. it has FileInput. Otherwise, <code>false</code>.
 */
BaseFormSet.prototype.isMultipart = function() {
  return (this.forms.length > 0 && this.forms[0].isMultipart())
}

/**
 * Returns this formset rendered as HTML &lt;tr&gt;s - excluding the
 * &lt;table&gt;&lt;/table&gt;.
 *
 * @param {Boolean} [doNotCoerce] if <code>true</code>, the resulting rows will
 *                                not be coerced to a String if we're operating
 *                                in HTML mode - defaults to <code>false</code>.
 */
BaseFormSet.prototype.asTable = function(doNotCoerce) {
  // XXX: there is no semantic division between forms here, there probably
  // should be. It might make sense to render each form as a table row with
  // each field as a td.
  var rows = this.managementForm().asTable(true)
  for (var i = 0, l = this.forms.length; i < l; i++) {
    rows = rows.concat(this.forms[i].asTable(true))
  }
  if (doNotCoerce === true || DOMBuilder.mode == 'dom') {
    return rows
  }
  return rows.join('\n')
}

BaseFormSet.prototype.asP = function(doNotCoerce) {
  var rows = this.managementForm().asP(true)
  for (var i = 0, l = this.forms.length; i < l; i++) {
    rows = rows.concat(this.forms[i].asP(true))
  }
  if (doNotCoerce === true || DOMBuilder.mode == 'dom') {
    return rows
  }
  return rows.join('\n')
}

BaseFormSet.prototype.asUL = function(doNotCoerce) {
  var rows = this.managementForm().asUL(true)
  for (var i = 0, l = this.forms.length; i < l; i++) {
    rows = rows.concat(this.forms[i].asUL(true))
  }
  if (doNotCoerce === true || DOMBuilder.mode == 'dom') {
    return rows
  }
  return rows.join('\n')
}

/**
 * Creates a FormSet constructor for the given Form constructor.
 * @param {Form} form
 * @param {Object=} kwargs
 */
function formsetFactory(form, kwargs) {
  kwargs = object.extend({
    formset: BaseFormSet, extra: 1, canOrder: false, canDelete: false,
    maxNum: null
  }, kwargs)

  var formset = kwargs.formset
    , extra = kwargs.extra
    , canOrder = kwargs.canOrder
    , canDelete = kwargs.canDelete
    , maxNum = kwargs.maxNum

  // Remove special properties from kwargs, as they will now be used to add
  // properties to the prototype.
  delete kwargs.formset
  delete kwargs.extra
  delete kwargs.canOrder
  delete kwargs.canDelete
  delete kwargs.maxNum

  kwargs.constructor = function(kwargs) {
    this.form = form
    this.extra = extra
    this.canOrder = canOrder
    this.canDelete = canDelete
    this.maxNum = maxNum
    formset.call(this, kwargs)
  }

  var formsetConstructor = formset.extend(kwargs)

  return formsetConstructor
}

/**
 * Returns true if every formset in formsets is valid.
 */
function allValid(formsets) {
  var valid = true
  for (var i = 0, l = formsets.length; i < l; i++) {
    if (!formsets[i].isValid()) {
        valid = false
    }
  }
  return valid
}

module.exports = {
  TOTAL_FORM_COUNT: TOTAL_FORM_COUNT
, INITIAL_FORM_COUNT: INITIAL_FORM_COUNT
, MAX_NUM_FORM_COUNT: MAX_NUM_FORM_COUNT
, ORDERING_FIELD_NAME: ORDERING_FIELD_NAME
, DELETION_FIELD_NAME: DELETION_FIELD_NAME
, ManagementForm: ManagementForm
, BaseFormSet: BaseFormSet
, formsetFactory: formsetFactory
, allValid: allValid
}
})

require.define("./models", function(module, exports, require) {
var object = require('isomorph/object')
  , validators = require('validators')

var util = require('./util')
  , fields = require('./fields')

var Field = fields.Field
  , ValidationError = validators.ValidationError

/**
 * A means of hooking newforms up with information about your model layer.
 */
var ModelInterface = {
  /**
   * Set to true if an exception is thrown when a model can't be found.
   */
  throwsIfNotFound: true

  /**
   * Constructor of error thrown when a model can't be found. Any exceptions
   * which do not have this constructor will be rethrown.
   */
, notFoundErrorConstructor: Error

  /**
   * Value returned to indicate not found, instead of throwing an exception.
   */
, notFoundValue: null

  /**
   * Given a model instance, should return the id which will be used to search
   * for valid choices on submission.
   */
, prepareValue: function(obj) {
    throw new Error('You must implement the forms.ModelInterface methods to use Model fields')
  }

  /**
   * Finds a model instance by id, given the model query which was passed to
   * newforms and the id of the selected model.
   */
, findById: function(modelQuery, id) {
    throw new Error('You must implement the forms.ModelInterface methods to use Model fields')
  }
}

function ModelQueryIterator(field) {
  this.field = field
  this.modelQuery = field.modelQuery
}

ModelQueryIterator.prototype.__iter__ = function() {
  var choices = []
  if (this.field.emptyLabel !== null) {
    choices.push(['', this.field.emptyLabel])
  }
  if (this.field.cacheChoices) {
    if (this.field.choiceCache === null) {
      this.field.choiceCache = choices.concat(this.modelChoices())
    }
    return this.field.choiceCache
  }
  else {
    return choices.concat(this.modelChoices())
  }
}

/**
 * Calls the model query function and creates choices from its results.
 */
ModelQueryIterator.prototype.modelChoices = function() {
  var instances = util.iterate(this.modelQuery)
    , choices = []
  for (var i = 0, l = instances.length; i < l; i++) {
    choices.push(this.choice(instances[i]))
  }
  return choices
}

/**
 * Creates a choice from a single model instance.
 */
ModelQueryIterator.prototype.choice = function(obj) {
  return [this.field.prepareValue(obj), this.field.labelFromInstance(obj)]
}

/**
 * A ChoiceField which retrieves its choices as objects returned by a given
 * function.
 * @constructor
 * @extends {ChoiceField}
 * @param {function} modelQuery
 * @param {Object} kwargs
 */
var ModelChoiceField = fields.ChoiceField.extend({
  constructor: function(modelQuery, kwargs) {
    if (!(this instanceof Field)) return new ModelChoiceField(modelQuery, kwargs)
    kwargs = object.extend({
      required: true, initial: null, cacheChoices: false, emptyLabel: '---------',
      modelInterface: ModelInterface
    }, kwargs)
    if (kwargs.required === true && kwargs.initial !== null) {
      this.emptyLabel = null
    }
    else {
      this.emptyLabel = kwargs.emptyLabel
    }
    this.emptyLabel = kwargs.emptyLabel
    this.cacheChoices = kwargs.cacheChoices
    this.modelInterface = kwargs.modelInterface

    // We don't need the ChoiceField constructor, as we've already handled setting
    // of choices.
    Field.call(this, kwargs)

    this.setModelQuery(modelQuery)
    this.choiceCache = null
  }
})
ModelChoiceField.prototype.defaultErrorMessages =
    object.extend({}, ModelChoiceField.prototype.defaultErrorMessages, {
      invalidChoice: 'Select a valid choice. That choice is not one of the available choices.'
    })

ModelChoiceField.prototype.getModelQuery = function() {
  return this.modelQuery
}

ModelChoiceField.prototype.setModelQuery = function(modelQuery) {
  this.modelQuery = modelQuery
  this.widget.choices = this.getChoices()
}

ModelChoiceField.prototype.getChoices = function() {
  // If this._choices is set, then somebody must have manually set them with
  // the inherited setChoices method.
  if (typeof this._choices != 'undefined') {
    return this._choices
  }

  // Otherwise, return an object which can be used with iterate() to get
  // choices.
  return new ModelQueryIterator(this)
}

ModelChoiceField.prototype.prepareValue = function(obj) {
  var value = null
  if (obj != null) {
    value = this.modelInterface.prepareValue(obj)
  }
  if (value == null) {
    value = Field.prototype.prepareValue.call(this, obj)
  }
  return value
}

/**
 * Creates a choice label from a model instance.
 */
ModelChoiceField.prototype.labelFromInstance = function(obj) {
  return ''+obj
}

ModelChoiceField.prototype.toJavaScript = function(value) {
  if (validators.isEmptyValue(value)) {
    return null
  }
  if (this.modelInterface.throwsIfNotFound) {
    try {
      value = this.modelInterface.findById(this.modelQuery, value)
    }
    catch (e) {
      if (this.modelInterface.notFoundErrorConstructor !== null &&
          !(e instanceof this.modelInterface.notFoundErrorConstructor)) {
        throw e
      }
      throw new ValidationError(this.errorMessages.invalidChoice)
    }
  }
  else {
    value = this.modelInterface.findById(this.modelQuery, value)
    if (value === this.modelInterface.notFoundValue) {
      throw new ValidationError(this.errorMessages.invalidChoice)
    }
  }
  return value
}

ModelChoiceField.prototype.validate = function(value) {
  return Field.prototype.validate.call(this, value)
}

module.exports = {
  ModelInterface: ModelInterface
, ModelChoiceField: ModelChoiceField
}
})

require.define("newforms", function(module, exports, require) {
var object = require('isomorph/object')
  , validators = require('validators')

var util = require('./util')
  , widgets = require('./widgets')
  , fields = require('./fields')
  , forms = require('./forms')
  , formsets = require('./formsets')
  , models = require('./models')

object.extend(
  module.exports
, { ValidationError: validators.ValidationError
  , ErrorObject: util.ErrorObject
  , ErrorList: util.ErrorList
  , formData: util.formData
  , util: {
      iterate: util.iterate
    , prettyName: util.prettyName
    }
  }
, validators
, widgets
, fields
, forms
, formsets
, models
)
})

require.define(["./sacrum/sacrum","./sacrum"], function(module, exports, require) {
var server = (typeof window == 'undefined')

var is = require('isomorph').is
  , object = require('isomorph').object
  , array = require('isomorph').array
  , format = require('isomorph').format
  , querystring = require('isomorph').querystring
  , Concur = require('Concur')
  , urlresolve = require('urlresolve')
  , DOMBuilder = require('DOMBuilder')
  , forms = require('newforms')

var slice = Array.prototype.slice
  , toString = Object.prototype.toString

// Monkeypatch a toDOM method for debugging 404 errors
urlresolve.Resolver404.prototype.toDOM = function() {
  var el = DOMBuilder.elements
  return DOMBuilder.fragment(
    el.P(this.toString() + ' - tried the following patterns:')
  , el.UL(el.LI.map(this.tried, function(tried) {
      array.flatten(tried)
      var patterns = []
      for (var i = 0, l = tried.length; i < l; i++) {
        patterns.push(tried[i].pattern)
      }
      return patterns.join(' ')
    }))
  )
}

// ================================================================== Models ===

/**
 * Meta-info about a model.
 */
function ModelOptions(meta) {
  this.meta = meta
  this.name = meta.name
  this.namePlural = meta.namePlural || meta.name + 's'
}

/**
 * Model definitions are expected contain a Meta property containing Model
 * options, defining at least a name property.
 */
function ModelMeta(prototypeProps, constructorProps) {
  // Prepare ModelOptions for the extended Model
  var options = new ModelOptions(prototypeProps.Meta)
  delete prototypeProps.Meta
  prototypeProps._meta = constructorProps._meta = options
}

/**
 * Base constructor for models - doesn't actually do much yet.
 */
var Model = Concur.extend({
  __meta__: ModelMeta
, constructor: function(props) {
    object.extend(this, props)
  }
})

// ----------------------------------------------- Model Storage / Retrieval ---

/**
 * Stores and retrieves instances of the given model.
 */
function Storage(model) {
  this._store = {}
  this._idSeed = 1
  this.model = model
}

Storage.prototype.query = function() {
  return new Query(this)
}

/**
 * Generates a new id for a model instance and stores it.
 */
Storage.prototype.add = function(instance) {
  instance.id = this._idSeed++
  this._store[instance.id] = instance
  return instance
}

Storage.prototype.update = function(instance) {}

/**
 * Retrieves all model instances.
 */
Storage.prototype.all = function() {
  var a = []
  for (var id in this._store) {
    a.push(this._store[id])
  }
  return a
}

/**
 * Retrieves the model instance with the given id, or null if it doesn't exist.
 */
Storage.prototype.get = function(id) {
  return this._store[id] || null
}

/**
 * Removes the given model instance.
 */
Storage.prototype.remove = function(instance) {
  delete this._store[instance.id]
}

/**
 * A representation of a query on a Storage object, which can be used to obtain
 * query results or perform further retrieval.
 *
 * We need an object which has access to query results and a link to the means
 * of looking stuff up to hook up with newforms' ModelChoiceField.
 */
function Query(storage) {
  this.storage = storage
}

/**
 * Fetches query results - for now, always returns all instances in the storage.
 */
Query.prototype.__iter__ = function() {
  return this.storage.all()
}

Query.prototype.get = function(id) {
  return this.storage.get(id)
}

// -----------------------------------------------------------Models & Forms ---

// Let newforms know what our cobbled-together storage and retrieval looks like
object.extend(forms.ModelInterface, {
  throwsIfNotFound: false
, notFoundValue: null
, prepareValue: function(instance) {
    return instance.id
  }
, findById: function(modelQuery, id) {
    return modelQuery.get(id)
  }
})

// =================================================================== Views ===

/**
 * Base constructor for objects containing functions which implement display and
 * control logic. Generally, views are instantiated using Views.extend - you
 * shouldn't need to use this contructor directly unless you're writing a
 * specialised base constructor, such as ModelAdminViews.
 *
 * The base Views object provides functionality which expects the following
 * instance properties:
 *
 * name (required)
 *    Name for the collection of view functions - for example, if you have a
 *    bunch of view functions which handle listing and editing Vehicle objects,
 *    a logical name would be 'VehicleViews'
 *
 * el (optinal)
 *    The element which contains the Views' contents, if appropriate.
 *
 * These don't have to be set at construction time - you could defer setting
 * them until the Views' init() method is called, if appropriate.
 *
 * @constructor
 * @param {Object} props instance properties.
 */
var Views = Concur.extend({
  constructor: function(props) {
    object.extend(this, props)
  }
})

Views.prototype.name = 'Views'

/**
 * Default tagName for this Views' element if it needs to be automatically
 * created.
 */
Views.prototype.tagName = 'div'

/**
 * Renders a DOMBuilder template with the given context data.
 * @param {string} templateName the name of a DOMBuilder template to render.
 * @param {Object} context template rendering context data.
 * @param {Object.<string, Function>=} named event handling functions - if
 *     provided, these functions will be bound to this Views instance and
 *     addded to the template context as an 'events' property.
 */
Views.prototype.render = function(templateName, context, events) {
  context = context || {}
  if (events) {
    for (var name in events) {
      var event = events[name]
      if (event == null) {
        this.warn('Event', name, 'for use with', templateName, 'is', event)
      }
      else {
        events[name] = bind(event, this)
      }
    }
    context.events = events
  }
  return DOMBuilder.template.renderTemplate(templateName, context)
}

/**
 * Renders a template and displays the results in this Views' element.
 */
Views.prototype.display = function(templateName, context, events) {
  var contents = this.render(templateName, context, events)
  // We don't place contents into an element on the server as we never want to
  // store state on view instances, since they're shared across all users.
  if (server) {
    return contents
  }
  this._ensureElement()
  return this.replaceContents(this.el, contents)
}

Views.prototype.redirect = function(path) {
  if (server) {
    return new Redirect(path)
  }
  else {
    loadURL(path)
  }
}

function Redirect(path) {
  this.path = path
}
Redirect.prototype.toString = function() {
  return format('Redirect to %s', this.path)
}

/**
 * Replaces the contents of an element and returns it.
 */
Views.prototype.replaceContents = function(el, contents) {
  if (is.String(el)) {
    el = document.getElementById(el)
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
  // If given a list of contents, wrap it in a DocumentFragment so it can be
  // appended in one go.
  if (is.Array(contents)) {
    contents = DOMBuilder.fragment(contents)
  }
  else if (is.String(contents)) {
    contents = DOMBuilder.textNode(contents)
  }
  el.appendChild(contents)
  return el
}

/**
 * Ensures this Views instance has an el property which contents can be added
 * to.
 */
Views.prototype._ensureElement = function() {
  if (!this.el) {
    this.el = DOMBuilder.createElement(this.tagName)
  }
}

/**
 * Logs debug information with this Views' name.
 */
Views.prototype.log = function() {
  console.log.apply(console,
                    [this.name].concat(slice.call(arguments)))
}

/**
 * Logs warning information with this Views' name.
 */
Views.prototype.warn = function(message) {
  console.warn.apply(console,
                     [this.name].concat(slice.call(arguments)))
}

/**
 * Logs error information with this Views' name.
 */
Views.prototype.error = function(message) {
  console.error.apply(console,
                      [this.name].concat(slice.call(arguments)))
}


// ==================================================================== URLs ===

/**
 * Placeholder for URL patterns. The furst use of either the resolve or reverse
 * function creates a URLResolver using the configured patterns.
 */
var URLConf = {
  patterns: []
, resolver: null
, resolve: function(path) {
    object.extend(this, urlresolve.getResolver(this.patterns))
    return this.resolve(path)
  }
, reverse: function(name, args, prefix) {
    object.extend(this, urlresolve.getResolver(this.patterns))
    return this.reverse(name, args, prefix)
  }
}

/**
 * Event handler which prevents default submissions which would usually result
 * in a new HTTP request and performs URL resolution of the target URL to
 * determine which view function should be invokved.
 *
 * For form submissions, form data is collected from the form and passed as the
 * last argument to the view function.
 */
function handleURLChange(e) {
  console.log('handleURLChange', e)
  e.preventDefault()
  var el = e.target
    , tagName = el.tagName.toLowerCase()
  try {
    if (tagName == 'a') {
      var path = el.getAttribute('href')
      console.log('Resolving a/@href', path)
      var match = URLConf.resolve(path)
      match.func.apply(null, match.args)
      pushURLState(path)
    }
    else if (tagName == 'form') {
      var path = el.getAttribute('action')
        , formData = forms.formData(el)
      console.log('Resolving form/@action', path, formData)
      var match = URLConf.resolve(path)
      match.func.apply(null, match.args.concat([formData]))
      if (el.method.toUpperCase() != 'POST') {
        pushURLState(path, formData)
      }
    }
    else {
      console.error('Unknown target element for URL change', tagName, el)
    }
  }
  catch(err) {
    console.error('£rror handling URL change', err)
    alert(err)
  }
}

// TODO Hash/iframe fallbacks for non-pushState browsers & file: protocol

/**
 * Adds a URL to the history.
 */
function pushURLState(path, queryObj) {
  if (window.location.protocol == 'file:') {
    return
  }
  var loc = window.location
    , root = loc.protocol + '//' + loc.host
  if (queryObj && !is.Empty(queryObj)) {
    path += '?' + querystring.stringify(queryObj)
  }
  window.history.pushState({}, '', root + path)
}

/**
 * Executes the appropriate handler when the back button is used.
 */
function handlePopURLState(e) {
  var path = window.location.pathname
  console.log('Resolving onpopstate', path)
  var match = URLConf.resolve(path)
  match.func.apply(null, match.args)
}

/**
 * Executes the handler for the given URL and adds it to the history.
 */
function loadURL(path) {
  console.log('Resolving loadURL', path)
  var match = URLConf.resolve(path)
  match.func.apply(null, match.args)
  pushURLState(path)
}

var templateAPI = DOMBuilder.modes.template.api

/**
 * Resolves a URL with the given arguments (if any) and returns it or adds it
 * to the context.
 */
function URLNode(urlName, args, options) {
  args = args || []
  options = object.extend({as: null}, options || {})
  this.urlName = new templateAPI.TextNode(urlName)
  this.args = []
  for (var i = 0, l = args.length; i < l; i++) {
    this.args.push(new templateAPI.TextNode(args[i]))
  }
  this.as = options.as
}
object.inherits(URLNode, templateAPI.TemplateNode)

URLNode.prototype.render = function(context) {
  var urlName = this.urlName.render(context).join('')
  var args = []
  for (var i = 0, l = this.args.length; i < l; i++) {
    args.push(this.args[i].render(context).join(''))
  }
  var url = URLConf.reverse(urlName, args)
  if (this.as) {
    context.set(this.as, url)
    return []
  }
  return url
}

object.extend(DOMBuilder.template, {
  /**
   * Provides access to the handleURLChange function in templates.
   */
  $resolve: handleURLChange
  /**
   * Provides access to construct a URLNode in templates.
   */
, $url: function(urlName, args, options) {
    return new URLNode(urlName, args, options)
  }
})

module.exports = {
  Model: Model
, ModelOptions: ModelOptions
, Storage: Storage
, Query: Query
, Views: Views
, Redirect: Redirect
, URLConf: URLConf
, handleURLChange: handleURLChange
, pushURLState: pushURLState
, handlePopURLState: handlePopURLState
}
})

require.define("./sacrum/admin", function(module, exports, require) {
var server = (typeof window == 'undefined')

var object = require('isomorph/object')
  , format = require('isomorph/format').format
  , urlresolve = require('urlresolve')
  , DOMBuilder = require('DOMBuilder')

var Sacrum = require('./sacrum')
  , reverse = Sacrum.URLConf.reverse.bind(Sacrum.URLConf)

// ============================================================= Admin Views ===

/**
 * Views which use created ModelAdminView instances to display an admin section.
 */
var AdminViews = new Sacrum.Views({
  name: 'AdminViews'
, elementId: 'admin'

  /** ModelAdminViews which have been registered for display. */
, modelViews: []

, init: function() {
    this.log('init')
    if (!server) {
      this.el = document.getElementById(this.elementId)
    }

    // Hook ap all ModelAdminViews which have been created
    for (var i = 0, l = ModelAdminViews.instances.length; i < l; i++) {
      var mv = ModelAdminViews.instances[i]
      // Give all instances our element to display their content in
      mv.el = this.el
      this.modelViews.push(mv)
    }
  }

  /**
   * Lists registered ModelAdminViews.
   */
, index: function() {
    this.log('index')
    var models = []
    for (var i = 0, l = this.modelViews.length, mv; i < l; i++) {
      var mv = this.modelViews[i]
      models.push({
        name: mv.storage.model._meta.namePlural
      , listURL: reverse(mv.urlName('list'))
      })
    }
    return this.display('admin:index', {models: models})
  }

  /**
   * Creates a URL pattern for the index view and roots each ModelAdminViews
   * instance under a URL based on its namespace.
   */
, getURLs: function() {
    var urlPatterns = urlresolve.patterns(this
      , urlresolve.url('', 'index', 'admin_index')
      )
    for (var i = 0, l = this.modelViews.length; i < l; i++) {
      var mv = this.modelViews[i]
      urlPatterns.push(
        urlresolve.url(format('%s/', mv.namespace), mv.getURLs())
      )
    }
    return urlPatterns
  }
})

// --------------------------------------------------------- ModelAdminViews ---

/**
 * Views which take care of some of the repetitive work involved in creating
 * basic CRUD functionality for a particular Model. This specialised version of
 * Views expects to find the following instance properties:
 *
 *    namespace
 *       Unique namespace for the instance - used in base CRUD templates to
 *       ensure created element ids are unique and when looking up templates
 *       which override the base templates.
 *
 *    storage
 *       A Storage object used to create, retrieve, update and delete Model
 *       instances.
 *
 *    form
 *       A Form used to take and validate user input when creating and updating
 *       Model instances.
 *
 *    elementId (Optional)
 *       The id of the elements in which content should be displayed, if
 *       appropriate.
 *
 * @constructor
 * @param {Object} props instance properties.
 */
var ModelAdminViews = Sacrum.Views.extend({
  constructor: function(props) {
    ModelAdminViews.instances.push(this)
    Sacrum.Views.call(this, props)
  }

, name: 'ModelAdminViews'

  /**
   * Overrides render to pass in template variables which are required for Admin
   * templates.
   */
, render: function(templateName, context, events) {
    object.extend(context, {
      ns: this.namespace
    , model: this.storage.model._meta
    })
    return ModelAdminViews.__super__.render.call(this, templateName, context, events)
  }

  /**
   * Finds the content element for this ModelAdminViews and displays a list of
   * Model instances by default.
   */
, init: function() {
    this.log('init')
    if (!server && this.elementId) {
      this.el = document.getElementById(this.elementId)
    }
  }

  /**
   * Constructs a URL name based on this ModenAdminViews' namespace.
   */
, urlName: function(name) {
    return 'admin_' + this.namespace + '_' + name
  }

  /**
   * Displays a list of Model instances.
   */
, list: function() {
    this.log('list')
    var items = this.storage.all()
    return this.display([this.namespace + ':admin:list', 'admin:list']
      , { items: items
        , rowTemplates: [this.namespace + ':admin:listRow', 'admin:listRow']
        , addURL: reverse(this.urlName('add'))
        }
      )
  }

  /**
   * Displays the selected Model's details.
   */
, detail: function(id) {
    this.log('detail', id)
    var item = this.storage.get(id)
    return this.display([this.namespace + ':admin:detail', 'admin:detail']
      , { item: item
        , editURL: reverse(this.urlName('edit'), [id])
        , deleteURL: reverse(this.urlName('delete'), [id])
        }
      )
  }

  /**
   * Displays the add Form, or validates user input and creates a new Model
   * instance or redisplays the form with errors if form data was given.
   */
, add: function(data) {
    this.log('add', data)
    var form
    if (data) {
      form = new this.form({data: data})
      if (form.isValid()) {
        var instance = this.storage.add(new this.storage.model(form.cleanedData))
        return this.redirect(
          reverse(this.urlName('detail'), [instance.id])
        )
      }
      else if (!server) {
        // Look up the <tbody> containing the form rows and replace its contents
        // with the rendered invalid form.
        return this.replaceContents(format('%sFormBody', this.namespace),
                                    form.asTable())
      }
      // If we're on the server, fall through to rendering the complete template
    }
    else {
      form = new this.form()
    }
    return this.display([this.namespace + ':admin:add', 'admin:add']
      , { form: form
        , submitURL: reverse(this.urlName('add'))
        , cancelURL: reverse(this.urlName('list'))
        }
      )
  }

  /**
   * Displays the edit Form, populated with the selected Model instance's data,
   * or validates user input and either updates the selected Model instance or
   * redisplays the form with errors if form data was given.
   */
, edit: function(id, data) {
    this.log('edit', id, data)
    var item = this.storage.get(id)
      , form
    if (data) {
      form = new this.form({data: data, initial: item})
      if (form.isValid()) {
        object.extend(item, form.cleanedData)
        this.storage.update(item)
        return this.redirect(
          reverse(this.urlName('detail'), [id])
        )
      }
      else if (!server) {
        // Look up the <tbody> containing the form rows and replace its contents
        // with the rendered invalid form.
        return this.replaceContents(format('%sFormBody', this.namespace),
                                    form.asTable())
      }
      // If we're on the server, fall through to rendering the complete template
    }
    else {
      form = new this.form({initial: item})
    }
    return this.display([this.namespace + ':admin:edit', 'admin:edit']
      , { item: item
        , form: form
        , submitURL: reverse(this.urlName('edit'), [id])
        , cancelURL: reverse(this.urlName('detail'), [id])
        }
      )
  }

  /**
   * Displays the Confirm Deletion screen for the selected Model instance, or
   * performs deletion if form data was given.
   */
, delete_: function(id, data) {
    this.log('delete_', id, data)
    var item = this.storage.get(id)
    if (data) {
      this.storage.remove(item)
      return this.redirect(
        reverse(this.urlName('list'))
      )
    }
    else {
      return this.display([this.namespace + ':admin:delete', 'admin:delete']
        , { item: item
          , submitURL: reverse(this.urlName('delete'), [id])
          , cancelURL: reverse(this.urlName('detail'), [id])
          }
        )
    }
  }

  /**
   * Creates URL patterns which can be rooted at any desired URL.
   */
, getURLs: function() {
    return urlresolve.patterns(this
    , urlresolve.url('',            'list',    this.urlName('list'))
    , urlresolve.url('add/',        'add',     this.urlName('add'))
    , urlresolve.url(':id/edit/',   'edit',    this.urlName('edit'))
    , urlresolve.url(':id/delete/', 'delete_', this.urlName('delete'))
    , urlresolve.url(':id/',        'detail',  this.urlName('detail'))
    )
  }
}, {
  /** Constructor property to track created instances. */
  instances: []
})

// =============================================================== Templates ===

void function() { with (DOMBuilder.template) {

var template = DOMBuilder.template

$template('admin:base'
, DIV({'id': 'admin-header'}
  , $block('breadCrumbs'
    , H2(
        A({href: $url('admin_index'), click: $resolve}, 'Admin')
      , $if('ns'
        , ' \u2192 '
        , A({href: $url('admin_{{ ns }}_list'), click: $resolve}, '{{ model.namePlural }}')
        )
      )
    )
  )
, DIV({'id': 'admin-content'}
  , $block('contents')
  )
)

$template({name: 'admin:index', extend: 'admin:base'}, $block('contents'
, TABLE({'class': 'list'}
  , THEAD(TR(
      TH('Models')
    ))
  , TBODY($for('model in models'
    , $cycle(['odd', 'even'], {as: 'rowClass', silent: true})
    , TR({'class': '{{ rowClass }}'}
      , TD(A({href: '{{ model.listURL }}', click: $resolve},
          '{{ model.name }}'
        ))
      )
    ))
  )
))

// ------------------------------------------------ ModelAdminView Templates ---

/**
 * Creates a <colgroup> to ensure detail column headers are a particular width.
 */
function detailColumns(options) {
  options = object.extend({width: '110px', columns: 2}, options || {})
  var cols = []
  for (var i = 0; i < options.columns; i++) {
    cols.push(template.COL({width: options.width}))
    cols.push(template.COL())
  }
  return template.COLGROUP(cols)
}

/**
 * Creates a <span> to space buttons out with some text.
 */
function buttonSpacer(text) {
  return template.SPAN({'class': 'spacer'}, text || ' or ')
}

$template({name: 'admin:list', extend: 'admin:base'}, $block('contents'
, $block('itemTable'
  , TABLE({'class': 'list'}
    , THEAD(TR(
        $block('headers'
        , TH('{{ model.name }}')
        )
      ))
    , TBODY($for('item in items'
      , $cycle(['odd', 'even'], {as: 'rowClass', silent: true})
      , $include($var('rowTemplates'))
      ))
    )
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , A({href: '{{ addURL }}', 'class': 'button', click: $resolve}
      , 'Add {{ model.name }}'
      )
    )
  )
))

$template('admin:listRow'
, TR({id: '{{ ns }}-{{ item.id }}', 'class': '{{ rowClass }}'}
  , $url('admin_{{ ns }}_detail', ['{{ item.id }}'], {as: 'detailURL'})
  , TD(A({href: '{{ detailURL }}', click: $resolve}
    , $block('linkText', '{{ item }}')
    ))
  , $block('extraCells')
  )
)

$template({name: 'admin:detail', extend: 'admin:base'}, $block('contents'
, $block('top')
, $block('detail'
  , TABLE({'class': 'detail'}
    , detailColumns()
    , TBODY($block('detailRows'
      , TR(
          TH('{{ model.name }}:')
        , TD('{{ item }}')
        )
      ))
    )
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , A({href: '{{ editURL }}', click: $resolve, 'class': 'button'}, 'Edit')
    , buttonSpacer()
    , A({href: '{{ deleteURL }}', click: $resolve, 'class': 'button'}, 'Delete')
    )
  )
))

$template({name: 'admin:add', extend: 'admin:base'}, $block('contents'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '{{ submitURL }}', submit: $resolve}
  , TABLE({'class': 'form detail'}
    , detailColumns({columns: 1})
    , TBODY({id: '{{ ns }}FormBody'}, $block('formRows'
      , $var('form.asTable')
      ))
    )
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add {{ model.name }}', 'class': 'add'})
    , buttonSpacer()
    , A({href: '{{ cancelURL }}', click: $resolve, 'class': 'button cancel'}, 'Cancel')
    )
  )
))

$template({name: 'admin:edit', extend: 'admin:base'}, $block('contents'
, FORM({ id: '{{ ns }}Form', method: 'POST', action: '{{ submitURL }}', submit: $resolve}
  , TABLE({'class': 'form detail'}
    , detailColumns({columns: 1})
    , TBODY({id: '{{ ns }}FormBody'}, $block('formRows'
      , $var('form.asTable')
      ))
    )
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit {{ model.name }}', 'class': 'edit'})
    , buttonSpacer()
    , A({href: '{{ cancelURL }}', click: $resolve, 'class': 'button cancel'}, 'Cancel')
    )
  )
))

$template({name: 'admin:delete', extend: 'admin:base'}, $block('contents'
, H2('Confirm Deletion')
, P('Are you sure you want to delete the {{ model.name }} "{{ item }}"?')
, DIV({'class': 'controls'}
  , FORM({action: '{{ submitURL }}', method: 'POST', submit: $resolve}
    , DIV(
        INPUT({type: 'submit', value: 'Delete {{ model.name }}', 'class': 'delete'})
      , buttonSpacer()
      , A({href: '{{ cancelURL }}', click: $resolve, 'class': 'button cancel'}, 'Cancel')
      )
    )
  )
))

}}()

// ================================================================== Export ===

module.exports = {
  AdminViews: AdminViews
, ModelAdminViews: ModelAdminViews
}
})

require.define(["sacrum","../../lib/sacrum"], function(module, exports, require) {
var Sacrum = require('./sacrum/sacrum')
Sacrum.Admin = require('./sacrum/admin')
module.exports = Sacrum
})

require.define("fragile", function(module, exports, require) {
var server = (typeof window == 'undefined')

var Sacrum = require('../../lib/sacrum')
  , Admin = Sacrum.Admin
  , object = require('isomorph').object
  , time = require('isomorph').time
  , urlresolve = require('urlresolve')
  , URLConf = Sacrum.URLConf
  , DOMBuilder = require('DOMBuilder')
  , forms = require('newforms')

// =============================================================== Utilities ===

/**
 * Replaces linebreaks with <br> elements for display.
 */
function lineBreaks(s) {
  if (!s) return ''

  var lines = s.split('\n')
  var display = []
  for (var i = 0, l = lines.length, line; line = lines[i], i < l; i++) {
    if (line) {
      display.push(line)
    }
    if (i != l - 1) {
      display.push(DOMBuilder.elements.BR())
    }
  }
  return display
}

/**
 * Formats a date in Oct 25, 2006 format.
 */
function formatDate(d) {
  if (!d) return ''
  return time.strftime(d, '%b %d, %Y')
}

// ================================================================== Models ===

// -------------------------------------------------------------------- User ---

var User = Sacrum.Model.extend({
  toString: function() {
    return this.displayName
  }
, profileImageDisplay: function() {
    if (this.profileImage) {
      return DOMBuilder.elements.IMG({src: this.profileImage})
    }
    return ''
  }
, Meta: {
    name: 'User'
  }
})

// ----------------------------------------------------------------- Project ---

var Project = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, Meta: {
    name: 'Project'
  }
})

// ----------------------------------------------------------------- Package ---

var Package = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, Meta: {
    name: 'Package'
  }
})

// ----------------------------------------------------------------- Release ---

var Release = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, themeDisplay: function() {
    return lineBreaks(this.theme)
  }
, startDateDisplay: function() {
    return formatDate(this.startDate)
  }
, releaseDateDisplay: function() {
    return formatDate(this.releaseDate)
  }
, stateDisplay: function() {
    return object.fromItems(Release.StateChoices)[this.state]
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
, Meta: {
    name: 'Release'
  }
})

Release.States = { PLANNING: 'P'
                 , ACTIVE:   'X'
                 , ACCEPTED: 'A'
                 }

Release.StateChoices = [ [Release.States.PLANNING, 'Planning']
                       , [Release.States.ACTIVE,   'Active']
                       , [Release.States.ACCEPTED, 'Accepted']
                       ]

// --------------------------------------------------------------- Iteration ---

var Iteration = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, themeDisplay: function() {
    return lineBreaks(this.theme)
  }
, startDateDisplay: function() {
    return formatDate(this.startDate)
  }
, endDateDisplay: function() {
    return formatDate(this.endDate)
  }
, stateDisplay: function() {
    return object.fromItems(Iteration.StateChoices)[this.state]
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
, Meta: {
    name: 'Iteration'
  }
})

Iteration.States = { PLANNING:  'P'
                   , COMMITTED: 'C'
                   , ACCEPTED:  'A'
                   }
Iteration.StateChoices = [ [Iteration.States.PLANNING,  'Planning']
                         , [Iteration.States.COMMITTED, 'Committed']
                         , [Iteration.States.ACCEPTED,  'Accepted']
                         ]

// ------------------------------------------------------------------- Story ---

var Story = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, stateDisplay: function() {
    return object.fromItems(Story.StateChoices)[this.state]
  }
, blockedDisplay: function() {
    return (this.blocked ? 'Yes' : 'No')
  }
, descriptionDisplay: function() {
    return lineBreaks(this.description)
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
, Meta: {
    name: 'Story'
  , namePlural: 'Stories'
  }
})

Story.States = { SCOPED:      'S'
               , DEFINED:     'D'
               , IN_PROGRESS: 'P'
               , COMPLETED:   'C'
               , ACCEPTED:    'A'
               }

Story.StateChoices = [ [Story.States.SCOPED,      'Scoped']
                     , [Story.States.DEFINED,     'Defined']
                     , [Story.States.IN_PROGRESS, 'In-Progress']
                     , [Story.States.COMPLETED,   'Completed']
                     , [Story.States.ACCEPTED,    'Accepted']
                     ]

// -------------------------------------------------------------------- Task ---

var Task = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, getProject: function() {
    return this.story.project
  }
, stateDisplay: function() {
    return object.fromItems(Task.StateChoices)[this.state]
  }
, blockedDisplay: function() {
    return (this.blocked ? 'Yes' : 'No')
  }
, descriptionDisplay: function() {
    return lineBreaks(this.description)
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
, Meta: {
    name: 'Task'
  }
})

Task.States = { DEFINED:     'D'
              , IN_PROGRESS: 'P'
              , COMPLETED:   'C'
              }

Task.StateChoices = [ [Task.States.DEFINED,     'Defined']
                    , [Task.States.IN_PROGRESS, 'In-Progress']
                    , [Task.States.COMPLETED,   'Completed']
                    ]

// ----------------------------------------------- Model Storage / Retrieval ---

var Projects = new Sacrum.Storage(Project)
  , Packages = new Sacrum.Storage(Package)
  , Releases = new Sacrum.Storage(Release)
  , Iterations = new Sacrum.Storage(Iteration)
  , Stories = new Sacrum.Storage(Story)
  , Tasks = new Sacrum.Storage(Task)
  , Users = new Sacrum.Storage(User)

// =================================================================== Forms ===

var UserForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 255})
, email: forms.EmailField()
, displayName: forms.CharField({maxLength: 50})
, profileImage: forms.URLField({required: false})
})

var ProjectForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
})

var PackageForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
})

var ReleaseForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
, theme: forms.CharField({required: false, widget: forms.Textarea})
, startDate: forms.DateField()
, releaseDate: forms.DateField()
, state: forms.ChoiceField({choices: Release.StateChoices})
, resources: forms.DecimalField({required: false, minValue: 0})
, project: forms.ModelChoiceField(Projects.query())
, estimate: forms.DecimalField({required: false, minValue: 0})
, notes: forms.CharField({required: false, widget: forms.Textarea})

, clean: function() {
    if (this.cleanedData.startDate && this.cleanedData.releaseDate &&
        this.cleanedData.startDate > this.cleanedData.releaseDate) {
      throw new forms.ValidationError('Release Date cannot be prior to Start Date.')
    }
    return this.cleanedData
  }
})

var IterationForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
, theme: forms.CharField({required: false, widget: forms.Textarea})
, startDate: forms.DateField()
, endDate: forms.DateField()
, state: forms.ChoiceField({choices: Iteration.StateChoices})
, resources: forms.DecimalField({required: false, minValue: 0})
, project: forms.ModelChoiceField(Projects.query())
, estimate: forms.DecimalField({required: false, minValue: 0})
, notes: forms.CharField({required: false, widget: forms.Textarea})

, clean: function() {
    if (this.cleanedData.startDate && this.cleanedData.endDate &&
        this.cleanedData.startDate > this.cleanedData.endDate) {
      throw new forms.ValidationError('End Date cannot be prior to Start Date.')
    }
    return this.cleanedData
  }
})

var StoryForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, pkg: forms.ModelChoiceField(Packages.query(), {required: false})
, project: forms.ModelChoiceField(Projects.query())
, parent: forms.ModelChoiceField(Stories.query(), {required: false})
, state: forms.ChoiceField({choices: Story.StateChoices, initial: Story.States.SCOPED})
, blocked: forms.BooleanField({required: false, initial: false})
, release: forms.ModelChoiceField(Releases.query(), {required: false})
, iteration: forms.ModelChoiceField(Iterations.query(), {required: false})
, planEstimate: forms.DecimalField({required: false, minValue: 0})
, rank: forms.CharField({required: false, maxLength: 50})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

var TaskForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 255})
, description: forms.CharField({required: false, widget: forms.Textarea})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, state: forms.ChoiceField({choices: Task.StateChoices, initial: Task.States.DEFINED})
, blocked: forms.BooleanField({required: false, initial: false})
, estimate: forms.DecimalField({required: false, minValue: 0})
, actuals: forms.DecimalField({required: false, minValue: 0})
, todo: forms.DecimalField({required: false, minValue: 0})
, story: forms.ModelChoiceField(Stories.query())
, rank: forms.CharField({required: false, maxLength: 50})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

// =================================================================== Views ===

// ------------------------------------------------------- Model Admin Views ---

var UserAdminViews = new Admin.ModelAdminViews({
  name: 'UserAdminViews'
, namespace: 'users'
, storage: Users
, form: UserForm
})

var ProjectAdminViews = new Admin.ModelAdminViews({
  name: 'ProjectAdminViews'
, namespace: 'projects'
, storage: Projects
, form: ProjectForm
})

var PackageAdminViews = new Admin.ModelAdminViews({
  name: 'PackageAdminViews'
, namespace: 'packages'
, storage: Packages
, form: PackageForm
})

var ReleaseAdminViews = new Admin.ModelAdminViews({
  name: 'ReleaseAdminViews'
, namespace: 'releases'
, storage: Releases
, form: ReleaseForm
})

var IterationAdminViews = new Admin.ModelAdminViews({
  name: 'IterationAdminViews'
, namespace: 'iterations'
, storage: Iterations
, form: IterationForm
})

var StoryAdminViews = new Admin.ModelAdminViews({
  name: 'StoryAdminViews'
, namespace: 'stories'
, storage: Stories
, form: StoryForm
})

var TaskAdminViews = new Admin.ModelAdminViews({
  name: 'TaskAdminViews'
, namespace: 'tasks'
, storage: Tasks
, form: TaskForm
})

// =============================================================== Templates ===

void function() { with (DOMBuilder.template) {

// ------------------------------------------------ ModelAdminView Templates ---

var template = DOMBuilder.template

/**
 * Creates a detail section consisting of pairs of name:value cells, with up to
 * two pairs displayed per row.
 */
function section(label, rows) {
  var els = [
    template.TR({'class': 'section'}
    , template.TD({colSpan: 4}, label)
    )
  ]

  if (rows) {
    for (var i = 0, l = rows.length; i < l; i++) {
      var row = rows[i]
        , rowFunc = (row.length == 2 ? singleRow : multiRow)
      els.push(rowFunc.apply(null, row))
    }
  }

  return els
}

/**
 * Creates a row containing a single item in a detail section.
 */
function singleRow(label, value) {
 return template.TR(
          template.TH(label + ':')
        , template.TD({colSpan: 3}, '{{ item.' + value + ' }}')
        )
}

/**
 * Creates a row containing a pair of items in a detail section.
 */
function multiRow(label1, value1, label2, value2) {
 return template.TR(
          template.TH(label1 + ':')
        , template.TD('{{ item.' + value1 + ' }}')
        , template.TH(label2 + ':')
        , template.TD('{{ item.' + value2 + ' }}')
        )
}

// -------------------------------------------------------------- User Admin ---

$template({name: 'users:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Email')
  , TH('Display name')
  )
)

$template({name: 'users:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.email }}')
  , TD('{{ item.displayName }}')
  )
)

$template({name: 'users:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('Account Information',
        [ ['Email Address', 'email']
        , ['Name'         , 'name' ]
        ]
      )

  , section('Display Preferences',
        [ ['Display Name' , 'displayName'        ]
        , ['Profile Image', 'profileImageDisplay']
        ]
      )
  )
)

// ----------------------------------------------------------- Release Admin ---

$template({name: 'releases:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Theme')
  , TH('Start Date')
  , TH('Release Date')
  , TH('State')
  )
)

$template({name: 'releases:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.themeDisplay }}')
  , TD('{{ item.startDateDisplay }}')
  , TD('{{ item.releaseDateDisplay }}')
  , TD('{{ item.stateDisplay }}')
  )
)

$template({name: 'releases:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['Name'         , 'name'            ]
        , ['Theme'        , 'themeDisplay'    ]
        , ['Start Date'   , 'startDateDisplay', 'Release Date', 'releaseDateDisplay']
        , ['State'        , 'stateDisplay'    , 'Resources'   , 'resources'         ]
        , ['Project'      , 'project'         ]
        , ['Plan Estimate', 'estimate'        ]
        , ['Notes'        , 'notesDisplay'    ]
        ]
      )
  )
)

// --------------------------------------------------------- Iteration Admin ---

$template({name: 'iterations:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Theme')
  , TH('Start Date')
  , TH('End Date')
  , TH('State')
  )
)

$template({name: 'iterations:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.themeDisplay }}')
  , TD('{{ item.startDateDisplay }}')
  , TD('{{ item.endDateDisplay }}')
  , TD('{{ item.stateDisplay }}')
  )
)

$template({name: 'iterations:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['Name'         , 'name'            ]
        , ['Theme'        , 'themeDisplay'    ]
        , ['Start Date'   , 'startDateDisplay', 'End Date' , 'endDateDisplay']
        , ['Project'      , 'project'         ]
        , ['State'        , 'stateDisplay'    , 'Resources', 'resources'     ]
        , ['Plan Estimate', 'estimate'        ]
        , ['Notes'        , 'notesDisplay'    ]
        ]
      )
  )
)

// ------------------------------------------------------------- Story Admin ---

$template({name: 'stories:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Release')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Plan Est')
  , TH('Owner')
  )
)

$template({name: 'stories:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.release }}')
  , TD('{{ item.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.planEstimate }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'stories:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['ID'         , 'id'                ]
        , ['Name'       , 'name'              ]
        , ['Description', 'descriptionDisplay']
        , ['Owner'      , 'owner'             , 'Package', 'pkg']
        , ['Project'    , 'project'           ]
        ]
      )

  , section('Story',
        [ ['Parent', 'parent'] ]
      )

  , section('Schedule',
        [ ['State'   , 'stateDisplay', 'Blocked'  , 'blockedDisplay']
        , ['Release' , 'release'     , 'Iteration', 'iteration'     ]
        , ['Plan Est', 'planEstimate']
        , ['Rank'    , 'rank'        ]
        ]
      )

  , section('Notes',
        [ ['Notes', 'notesDisplay'] ]
      )
  )
)

// -------------------------------------------------------------- Task Admin ---

$template({name: 'tasks:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Story')
  , TH('Release')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Estimate')
  , TH('To Do')
  , TH('Actuals')
  , TH('Owner')
  )
)

$template({name: 'tasks:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.story }}')
  , TD('{{ item.story.release }}')
  , TD('{{ item.story.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.estimate }}')
  , TD('{{ item.todo }}')
  , TD('{{ item.actuals }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'tasks:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['ID'         , 'id'                ]
        , ['Name'       , 'name'              ]
        , ['Description', 'descriptionDisplay']
        , ['Owner'      , 'owner'             ]
        , ['Project'    , 'getProject'        ]
        ]
      )

  , section('Task',
        [ ['State',    'stateDisplay', 'Blocked', 'blockedDisplay']
        , ['Estimate', 'estimate',     'Actuals', 'actuals'       ]
        , ['To Do',    'todo'        ]
        , ['Story',    'story'       ]
        , ['Rank',     'rank'        ]
        ]
      )

  , section('Notes',
        [ ['Notes', 'notesDisplay'] ]
      )
  )
)

}}()

// ============================================================= Sample Data ===

void function() {
  var u1 = Users.add(new User({name: 'User 1', email: 'a@a.com', displayName: 'User 1', profileImage: 'http://jonathan.buchanan153.users.btopenworld.com/adventurer.png'}))
    , u2 = Users.add(new User({name: 'User 2', email: 'b@b.com', displayName: 'User 2', profileImage: 'http://jonathan.buchanan153.users.btopenworld.com/kiwi.png'}))
    , p1 = Projects.add(new Project({name: 'Project 1'}))
    , p2 = Projects.add(new Project({name: 'Project 2'}))
    , pa1 = Packages.add(new Package({name: 'Package 1'}))
    , pa2 = Packages.add(new Package({name: 'Package 2'}))
    , r1 = Releases.add(new Release({name: 'Release 1', theme: 'Do the thing.\n\nAnd the other thing.', state: Release.States.ACTIVE, startDate: new Date(2010, 5, 1), releaseDate: new Date(2010, 11, 16), project: p1, resources: 76.5, estimate: 54.0}))
    , r2 = Releases.add(new Release({name: 'Release 2', theme: 'This and that.\n\nNothing major.', state: Release.States.PLANNING, startDate: new Date(2011, 1, 1), releaseDate: new Date(2011, 9, 16), project: p1, resources: 76.5, estimate: 54.0}))
    , r3 = Releases.add(new Release({name: 'Release 3', theme: 'Months of firefighting.', state: Release.States.PLANNING, startDate: new Date(2011, 3, 16), releaseDate: new Date(2012, 6, 1), project: p2, resources: 76.5, estimate: 54.0}))
    , i1 = Iterations.add(new Iteration({name: 'Sprint 1', theme: 'Getting started.', state: Iteration.States.COMMITTED, startDate: new Date(2010, 5, 1), endDate: new Date(2010, 6, 1), project: p1, resources: 76.5, estimate: 54.0}))
    , i2 = Iterations.add(new Iteration({name: 'Sprint 2', theme: 'Big, risky stories.', state: Iteration.States.PLANNING, startDate: new Date(2010, 6, 1), endDate: new Date(2010, 7, 1), project: p1, resources: 76.5, estimate: 54.0}))
    , s1 = Stories.add(new Story({name: 'Story 1', project: p1, parent: null, state: Story.States.IN_PROGRESS, owner: u1, pkg: pa1, release: r1, iteration: i1, planEstimate: 20.0, rank: 1.0}))
    , t1 = Tasks.add(new Task({name: 'Task 1', state: Task.States.IN_PROGRESS, estimate: 15.0, actuals: 5.0, todo: 10.0, story: s1, owner: u1, rank: 2.0}))
}()

// ===================================================== Export / Initialise ===

function init() {
  Admin.AdminViews.init()
  URLConf.patterns = [ urlresolve.url('admin/', Admin.AdminViews.getURLs()) ]
}

var Fragile = {
  util: {
    lineBreaks: lineBreaks
  , formatDate: formatDate
  }
, User: User
, Project: Project
, Release: Release
, Iteration: Iteration
, Story: Story
, Task: Task
, Users: Users
, Projects: Projects
, Releases: Releases
, Iterations: Iterations
, Stories: Stories
, Tasks: Tasks
, UserForm: UserForm
, ProjectForm: ProjectForm
, ReleaseForm: ReleaseForm
, IterationForm: IterationForm
, StoryForm: StoryForm
, TaskForm: TaskForm
, UserAdminViews: UserAdminViews
, ProjectAdminViews: ProjectAdminViews
, ReleaseAdminViews: ReleaseAdminViews
, IterationAdminViews: IterationAdminViews
, StoryAdminViews: StoryAdminViews
, TaskAdminViews: TaskAdminViews
, init: init
}

module.exports = Fragile

if (!server) {
  if (window.location.protocol != 'file:') {
    window.onpopstate = Sacrum.handlePopURLState
  }
  window.onload = function() {
    init()
    var path = window.location.pathname
    // If running via the static page, always start at the index
    if (path.indexOf('.html') == path.length - 5) {
      path = '/admin/'
    }
    URLConf.resolve(path).func()
  }
}
})

window['Fragile'] = require('fragile')

})();