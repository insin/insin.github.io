/**
 * newforms 0.10.0-alpha (dev build at Sat, 20 Dec 2014 13:46:46 GMT) - https://github.com/insin/newforms
 * MIT Licensed
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.forms=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var object = require('isomorph/object')
var validators = require('validators')

var env = require('./env')
var fields = require('./fields')
var formats = require('./formats')
var forms = require('./forms')
var formsets = require('./formsets')
var locales = require('./locales')
var util = require('./util')
var widgets = require('./widgets')

var BoundField = require('./BoundField')
var ErrorList = require('./ErrorList')
var ErrorObject = require('./ErrorObject')

module.exports = object.extend({
  addLocale: locales.addLocale
, BoundField: BoundField
, env: env
, ErrorList: ErrorList
, ErrorObject: ErrorObject
, formats: formats
, formData: util.formData
, locales: locales
, setDefaultLocale: locales.setDefaultLocale
, util: util
, validateAll: util.validateAll
, ValidationError: validators.ValidationError
, validators: validators
}, fields, forms, formsets, widgets)

},{"./BoundField":2,"./ErrorList":3,"./ErrorObject":4,"./env":5,"./fields":6,"./formats":7,"./forms":8,"./formsets":9,"./locales":10,"./util":11,"./widgets":12,"isomorph/object":18,"validators":22}],2:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var is = require('isomorph/is')
var format = require('isomorph/format').formatObj
var object = require('isomorph/object')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)

var util = require('./util')
var widgets = require('./widgets')

/**
 * A helper for rendering a field.
 * @param {Form} form the form instance which the field is a part of.
 * @param {Field} field the field to be rendered.
 * @param {string} name the name associated with the field in the form.
 * @constructor
 */
var BoundField = Concur.extend({
  constructor: function BoundField(form, field, name) {
    if (!(this instanceof BoundField)) { return new BoundField(form, field, name) }
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

// ================================================================== Status ===

/**
 * @return {boolean} true if the value which will be displayed in the field's
 *   widget is empty.
 */
BoundField.prototype.isEmpty = function() {
  return this.field.isEmptyValue(this.value())
}

/**
 * @return {boolean} true if the field has a pending async validation.
 */
BoundField.prototype.isPending = function() {
  return typeof this.form._pendingAsyncValidation[this.name] != 'undefined'
}

/**
 * @return {boolean} true if the field has some data in its form's cleanedData.
 */
BoundField.prototype.isCleaned = function() {
  return typeof this.form.cleanedData[this.name] != 'undefined'
}

/**
 * @return {boolean} true if the field's widget will render hidden field(s).
 */
BoundField.prototype.isHidden = function() {
  return this.field.widget.isHidden
}

/**
 * Determines the field's curent status in the form. Statuses are determined in
 * the following order:
 * * 'pending' - the field has a pending async validation.
 * * 'error' - the field has a validation error.
 * * 'valid' - the field has a value in form.cleanedData.
 * * 'default' - the field meets none of the above criteria, e.g. it's been
 *   rendered but hasn't been interacted with or validated yet.
 * @return {string}
 */
BoundField.prototype.status = function() {
  if (this.isPending()) { return 'pending' }
  if (this.errors().isPopulated()) { return 'error' }
  if (this.isCleaned()) { return 'valid' }
  return 'default'
}

// ============================================================== Field Data ===

/**
 * Calculates and returns the id attribute for this BoundField if the associated
 * form has an autoId. Returns an empty string otherwise.
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
 * @return {*} user input data for the field, or null if none has been given.
 */
BoundField.prototype.data = function() {
  return this.field.widget.valueFromData(this.form.data,
                                         this.form.files,
                                         this.htmlName)
}

/**
 * @return {ErrorObject} errors for the field, which may be empty.
 */
BoundField.prototype.errors = function() {
  return this.form.errors(this.name) || new this.form.errorConstructor()
}

/**
 * @return {string=} the first error message for the field, or undefined if
 *   there were none.
 */
BoundField.prototype.errorMessage = function() {
  return this.errors().first()
}

/**
 * @return {Array.<string>} all error messages for the field, will be empty if
 *   there were none.
 */
BoundField.prototype.errorMessages = function() {
  return this.errors().messages()
}

/**
 * Gets or generates an id for the field's <label>.
 * @return {string}
 */
BoundField.prototype.idForLabel = function() {
  var widget = this.field.widget
  var id = object.get(widget.attrs, 'id', this.autoId())
  return widget.idForLabel(id)
}

/**
 * @return {*} the value to be displayed in the field's widget.
 */
BoundField.prototype.value = function() {
  var data
  if (this.form.isInitialRender) {
    data = this.initialValue()
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
 * @return {*} the initial value for the field, will be null if none was
 *   configured on the field or given to the form.
 */
BoundField.prototype.initialValue = function() {
  var value = object.get(this.form.initial, this.name, this.field.initial)
  if (is.Function(value)) {
    value = value()
  }
  return value
}

// =============================================================== Rendering ===

/**
 * Renders a widget for the field.
 * @param {Object=} kwargs widgets options.
 * @param {Widget} kwargs.widget an override for the widget used to render the
 *   field - if not provided, the field's configured widget will be used.
 * @param {Object} kwargs.attrs additional attributes to be added to the field's
 *   widget.
 * @return {ReactElement}
 */
BoundField.prototype.asWidget = function(kwargs) {
  kwargs = object.extend({
    widget: null, attrs: null, onlyInitial: false
  }, kwargs)
  var widget = (kwargs.widget !== null ? kwargs.widget : this.field.widget)
  var attrs = (kwargs.attrs !== null ? kwargs.attrs : {})
  var autoId = this.autoId()
  var name = !kwargs.onlyInitial ? this.htmlName : this.htmlInitialName
  if (autoId &&
      typeof attrs.id == 'undefined' &&
      typeof widget.attrs.id == 'undefined') {
    attrs.id = (!kwargs.onlyInitial ? autoId : this.htmlInitialId)
  }
  if (typeof attrs.key == 'undefined') {
    attrs.key = name
  }
  var controlled = this._isControlled(widget)
  var validation = this._validation(widget)

  // Always Add an onChange event handler to update form.data when the field is
  // changed.
  attrs.onChange = this.form._handleFieldEvent.bind(this.form, {
    event: 'onChange'
  , validate: !!validation.onChange
  , delay: validation.onChangeDelay
  })

  // If validation should happen on events other than onChange, also add event
  // handlers for them.
  if (validation != 'manual' && validation.events) {
    for (var i = 0, l = validation.events.length; i < l; i++) {
      var eventName = validation.events[i]
      attrs[eventName] =
        this.form._handleFieldEvent.bind(this.form, {event: eventName})
    }
  }

  var renderKwargs = {attrs: attrs, controlled: controlled}
  if (widget.needsInitialValue) {
    renderKwargs.initialValue = this.initialValue()
  }
  return widget.render(name, this.value(), renderKwargs)
}

/**
 * Renders the field as a hidden field.
 * @param {Object=} kwargs widget options.
 * @return {ReactElement}
 */
BoundField.prototype.asHidden = function(kwargs) {
  kwargs = object.extend({}, kwargs, {widget: new this.field.hiddenWidget()})
  return this.asWidget(kwargs)
}

/**
 * Renders the field as a text input.
 * @param {Object=} kwargs widget options.
 * @return {ReactElement}
 */
BoundField.prototype.asText = function(kwargs) {
  kwargs = object.extend({}, kwargs, {widget: widgets.TextInput()})
  return this.asWidget(kwargs)
}

/**
 * Renders the field as a textarea.
 * @param {Object=} kwargs widget options.
 * @return {ReactElement}
 */
BoundField.prototype.asTextarea = function(kwargs) {
  kwargs = object.extend({}, kwargs, {widget: widgets.Textarea()})
  return this.asWidget(kwargs)
}

/**
 * Determines CSS classes for this field based on what's configured in the field
 * and form, and the field's current status.
 * @param {string=} extraCssClasses additional CSS classes for the field.
 * @return {string} space-separated CSS classes for this field.
 */
BoundField.prototype.cssClasses = function(extraCssClasses) {
  var cssClasses = (extraCssClasses ? [extraCssClasses] : [])

  // Field/row classes
  if (this.field.cssClass !== null) {
    cssClasses.push(this.field.cssClass)
  }
  if (typeof this.form.rowCssClass != 'undefined') {
    cssClasses.push(this.form.rowCssClass)
  }

  // Status class
  var status = this.status()
  if (typeof this.form[status + 'CssClass'] != 'undefined') {
    cssClasses.push(this.form[status + 'CssClass'])
  }

  // Required-ness classes
  if (this.field.required) {
    if (typeof this.form.requiredCssClass != 'undefined') {
      cssClasses.push(this.form.requiredCssClass)
    }
  }
  else if (typeof this.form.optionalCssClass != 'undefined') {
    cssClasses.push(this.form.optionalCssClass)
  }

  return cssClasses.join(' ')
}

/**
 * Renders a tag containing help text for the field.
 * @param {Object=} kwargs configuration options.
 * @param {string} kwargs.tagName allows overriding the type of tag - defaults
 *   to 'span'.
 * @param {string} kwargs.contents help text contents - if not provided,
 *   contents will be taken from the field itself. To render raw HTML in help
 *   text, it should be specified using the React convention for raw HTML,
 *   which is to provide an object with a __html property.
 * @param {Object} kwargs.attrs additional attributes to be added to the tag -
 *   by default it will get a className of 'helpText'
 * @return {ReactElement}
 */
BoundField.prototype.helpTextTag = function(kwargs) {
  kwargs = object.extend({
    tagName: 'span', attrs: null, contents: this.helpText
  }, kwargs)
  if (kwargs.contents) {
    var attrs = object.extend({className: 'helpText'}, kwargs.attrs)
    var contents = kwargs.contents
    if (is.Object(contents) && object.hasOwn(contents, '__html')) {
      attrs.dangerouslySetInnerHTML = contents
      return React.createElement(kwargs.tagName, attrs)
    }
    return React.createElement(kwargs.tagName, attrs, contents)
  }
}

/**
 * Wraps the given contents in a <label> if the field has an id attribute. If
 * contents aren't given, uses the field's label.
 * If attrs are given, they're used as HTML attributes on the <label> tag.
 * @param {Object=} kwargs configuration options.
 * @param {string} kwargs.contents contents for the label - if not provided,
 *   label contents will be generated from the field itself.
 * @param {Object} kwargs.attrs additional attributes to be added to the label.
 * @param {string} kwargs.labelSuffix allows overriding the form's labelSuffix.
 * @return {ReactElement}
 */
BoundField.prototype.labelTag = function(kwargs) {
  kwargs = object.extend({
    contents: this.label, attrs: null, labelSuffix: this.form.labelSuffix
  }, kwargs)
  var contents = this._addLabelSuffix(kwargs.contents, kwargs.labelSuffix)
  var widget = this.field.widget
  var id = object.get(widget.attrs, 'id', this.autoId())
  if (id) {
    var attrs = object.extend(kwargs.attrs || {}, {htmlFor: widget.idForLabel(id)})
    contents = React.createElement('label', attrs, contents)
  }
  return contents
}

/**
 * @return {ReactElement}
 */
BoundField.prototype.render = function(kwargs) {
  if (this.field.showHiddenInitial) {
    return React.createElement('div', null, this.asWidget(kwargs),
                               this.asHidden({onlyInitial: true}))
  }
  return this.asWidget(kwargs)
}

/**
 * Returns a list of SubWidgets that comprise all widgets in this BoundField.
 * This really is only useful for RadioSelect and CheckboxSelectMultiple
 * widgets, so that you can iterate over individual inputs when rendering.
 * @return {Array.<SubWidget>}
 */
BoundField.prototype.subWidgets = function() {
  var id = this.field.widget.attrs.id || this.autoId()
  var kwargs = {attrs: {}}
  if (id) {
    kwargs.attrs.id = id
  }
  return this.field.widget.subWidgets(this.htmlName, this.value(), kwargs)
}

/**
 * @return {string}
 */
BoundField.prototype._addLabelSuffix = function(label, labelSuffix) {
  // Only add the suffix if the label does not end in punctuation
  if (labelSuffix && ':?.!'.indexOf(label.charAt(label.length - 1)) == -1) {
    return label + labelSuffix
  }
  return label
}

/**
 * Determines if the widget should be a controlled or uncontrolled React
 * component.
 * @return {boolean}
 */
BoundField.prototype._isControlled = function(widget) {
  if (arguments.length === 0) {
    widget = this.field.widget
  }
  var controlled = false
  if (widget.isValueSettable) {
    // If the field has any controlled config set, it should take precedence,
    // otherwise use the form's as it has a default.
    controlled = (this.field.controlled !== null
                  ? this.field.controlled
                  : this.form.controlled)
  }
  return controlled
}

/**
 * Gets the configured validation for the field or form, allowing the widget
 * which is going to be rendered to override it if necessary.
 * @param {Widget=} widget
 * @return {?(Object|string)}
 */
BoundField.prototype._validation = function(widget) {
  if (arguments.length === 0) {
    widget = this.field.widget
  }
  // If the field has any validation config set, it should take precedence,
  // otherwise use the form's as it has a default.
  var validation = this.field.validation || this.form.validation
  // Allow widgets to override the type of validation that's used for them -
  // primarily for inputs which can only be changed by click/selection.
  if (validation !== 'manual' && widget.validation !== null) {
    validation = widget.validation
  }
  return validation
}

module.exports = BoundField
},{"./util":11,"./widgets":12,"Concur":13,"isomorph/format":16,"isomorph/is":17,"isomorph/object":18}],3:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var validators = require('validators')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)

var ValidationError = validators.ValidationError

/**
 * A list of errors which knows how to display itself in various formats.
 * @param {Array=} list a list of errors.
 * @constructor
 */
var ErrorList = Concur.extend({
  constructor: function ErrorList(list) {
    if (!(this instanceof ErrorList)) { return new ErrorList(list) }
    this.data = list || []
  }
})

/**
 * @param {Array.<Object>} list
 * @return {ErrorList}
 */
ErrorList.fromJSON = function(list) {
  var result = new ErrorList()
  result.fromJSON(list)
  return result
}

/**
 * Adds more errors.
 * @param {Array} errorList a list of errors.
 */
ErrorList.prototype.extend = function(errorList) {
  this.data.push.apply(this.data, errorList)
}

/**
 * @return {number} the number of errors.
 */
ErrorList.prototype.length = function() {
  return this.data.length
}

/**
 * @return {boolean} true if any errors are present.
 */
ErrorList.prototype.isPopulated = function() {
  return (this.length() > 0)
}

/**
 * @return {string} the first message held in this ErrorList.
 */
ErrorList.prototype.first = function() {
  if (this.data.length > 0) {
    var error = this.data[0]
    if (error instanceof ValidationError) {
      error = error.messages()[0]
    }
    return error
  }
}

/**
 * @return {Array.<string>} the list of messages held in this ErrorList.
 */
ErrorList.prototype.messages = function() {
  var messages = []
  for (var i = 0, l = this.data.length; i < l; i++) {
    var error = this.data[i]
    if (error instanceof ValidationError) {
      error = error.messages()[0]
    }
    messages.push(error)
  }
  return messages
}

/**
 * Default display is as a list.
 * @return {ReactElement}
 */
ErrorList.prototype.render = function() {
  return this.asUl()
}

/**
 * Displays errors as a list.
 * @return {ReactElement}
 */
ErrorList.prototype.asUl = function() {
  if (!this.isPopulated()) {
    return
  }
  return React.createElement('ul', {className: 'errorlist'}
  , this.messages().map(function(error) {
      return React.createElement('li', null, error)
    })
  )
}

/**
 * Displays errors as text.
 * @return {string}
 */
ErrorList.prototype.asText = ErrorList.prototype.toString =function() {
  return this.messages().map(function(error) {
    return '* ' + error
  }).join('\n')
}

/**
 * @return {Array}
 */
ErrorList.prototype.asData = function() {
  return this.data
}

/**
 * @return {Object}
 */
ErrorList.prototype.toJSON = function() {
  return new ValidationError(this.data).errorList.map(function(error) {
    return {
      message: error.messages()[0]
    , code: error.code || ''
    }
  })
}

/**
 * @param {Array.<Object>} list
 */
ErrorList.prototype.fromJSON = function(list) {
  this.data = list.map(function(err) {
    return new ValidationError(err.message, {code: err.code})
  })
}

module.exports = ErrorList

},{"Concur":13,"validators":22}],4:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var object = require('isomorph/object')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)

var ErrorList = require('./ErrorList')

/**
 * A collection of field errors that knows how to display itself in various
 * formats. This object's .error properties are the field names and
 * corresponding values are the errors.
 * @constructor
 * @param {Object} errors
 */
var ErrorObject = Concur.extend({
  constructor: function ErrorObject(errors) {
    if (!(this instanceof ErrorObject)) { return new ErrorObject(errors) }
    this.errors = errors || {}
  }
})

/**
 * @param {Object} jsonObj
 * @param {function=} errorConstructor
 * @return {ErrorObject}
 */
ErrorObject.fromJSON = function(jsonObj, errorConstructor) {
  var result = new ErrorObject()
  result.fromJSON(jsonObj, errorConstructor)
  return result
}

/**
 * @param {string} field
 * @param {ErrorList} error
 */
ErrorObject.prototype.set = function(field, error) {
  this.errors[field] = error
}

/**
 * @param {string} field
 * @return {ErrorList}
 */
ErrorObject.prototype.get = function(field) {
  return this.errors[field]
}

/**
 * @param {string} field
 * @return {boolean} true if there were errors for the given field.
 */
ErrorObject.prototype.remove = function(field) {
  return delete this.errors[field]
}

/**
 * @param {Array.<string>} fields
 */
ErrorObject.prototype.removeAll = function(fields) {
  for (var i = 0, l = fields.length; i < l; i++) {
    delete this.errors[fields[i]]
  }
}

/**
 * @return {boolean} true if the field has errors.
 */
ErrorObject.prototype.hasField = function(field) {
  return object.hasOwn(this.errors, field)
}

/**
 * @return {number}
 */
ErrorObject.prototype.length = function() {
  return Object.keys(this.errors).length
}

/**
 * @return {boolean} true if any errors are present.
 */
ErrorObject.prototype.isPopulated = function() {
  return (this.length() > 0)
}

/**
 * Default display is as a list.
 * @return {ReactElement}
 */
ErrorObject.prototype.render = function() {
  return this.asUl()
}

/**
 * Displays error details as a list.
 * @return {ReactElement}
 */
ErrorObject.prototype.asUl = function() {
  var items = Object.keys(this.errors).map(function(field) {
    return React.createElement('li', null, field, this.errors[field].asUl())
  }.bind(this))
  if (items.length === 0) { return }
  return React.createElement('ul', {className: 'errorlist'}, items)
}

/**
 * Displays error details as text.
 * @return {string}
 */
ErrorObject.prototype.asText = ErrorObject.prototype.toString = function() {
  return Object.keys(this.errors).map(function(field) {
    var messages = this.errors[field].messages()
    return ['* ' + field].concat(messages.map(function(message) {
      return ('  * ' + message)
    })).join('\n')
  }.bind(this)).join('\n')
}

/**
 * @return {Object}
 */
ErrorObject.prototype.asData = function() {
  var data = {}
  Object.keys(this.errors).map(function(field) {
    data[field] = this.errors[field].asData()
  }.bind(this))
  return data
}

/**
 * @return {Object}
 */
ErrorObject.prototype.toJSON = function() {
  var jsonObj = {}
  Object.keys(this.errors).map(function(field) {
    jsonObj[field] = this.errors[field].toJSON()
  }.bind(this))
  return jsonObj
}

/**
 * @param {Object} jsonObj
 * @param {function=} errorConstructor
 */
ErrorObject.prototype.fromJSON = function(jsonObj, errorConstructor) {
  errorConstructor = errorConstructor || ErrorList
  this.errors = {}
  var fieldNames = Object.keys(jsonObj)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    var fieldName = fieldNames[i]
    this.errors[fieldName] = errorConstructor.fromJSON(jsonObj[fieldName])
  }
}

module.exports = ErrorObject

},{"./ErrorList":3,"Concur":13,"isomorph/object":18}],5:[function(require,module,exports){
'use strict';

module.exports = {
  browser: typeof process == 'undefined'
}
},{}],6:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var is = require('isomorph/is')
var object = require('isomorph/object')
var time = require('isomorph/time')
var url = require('isomorph/url')
var validators = require('validators')

var env = require('./env')
var formats = require('./formats')
var locales = require('./locales')
var util = require('./util')
var widgets = require('./widgets')

var ValidationError = validators.ValidationError
var Widget = widgets.Widget
var cleanIPv6Address = validators.ipv6.cleanIPv6Address

/**
 * An object that is responsible for doing validation and normalisation, or
 * "cleaning", for example: an EmailField makes sure its data is a valid
 * e-mail address and makes sure that acceptable "blank" values all have the
 * same representation.
 * @constructor
 * @param {Object=} kwargs
 */
var Field = Concur.extend({
  widget: widgets.TextInput         // Default widget to use when rendering this type of Field
, hiddenWidget: widgets.HiddenInput // Default widget to use when rendering this as "hidden"
, defaultValidators: []             // Default list of validators
  // Add an 'invalid' entry to defaultErrorMessages if you want a specific
  // field error message not raised by the field validators.
, defaultErrorMessages: {
    required: 'This field is required.'
  }
, emptyValues: validators.EMPTY_VALUES.slice()
, emptyValueArray: true // Should isEmptyValue check for empty Arrays?

, constructor: function Field(kwargs) {
    kwargs = object.extend({
      required: true, widget: null, label: null, initial: null,
      helpText: null, errorMessages: null, showHiddenInitial: false,
      validators: [], cssClass: null, validation: null, controlled: null,
      custom: null
    }, kwargs)
    this.required = kwargs.required
    this.label = kwargs.label
    this.initial = kwargs.initial
    this.showHiddenInitial = kwargs.showHiddenInitial
    this.helpText = kwargs.helpText || ''
    this.cssClass = kwargs.cssClass
    this.validation = util.normaliseValidation(kwargs.validation)
    this.controlled = kwargs.controlled
    this.custom = kwargs.custom

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
    var messages = [{}]
    for (var i = this.constructor.__mro__.length - 1; i >=0; i--) {
      messages.push(object.get(this.constructor.__mro__[i].prototype,
                               'defaultErrorMessages', null))
    }
    messages.push(kwargs.errorMessages)
    this.errorMessages = object.extend.apply(object, messages)

    this.validators = this.defaultValidators.concat(kwargs.validators)
  }
})

/**
 * Tracks each time a Field instance is created; used to retain order.
 */
Field.creationCounter = 0

Field.prototype.prepareValue = function(value) {
  return value
}

/**
 * @param {*} value user input.
 * @throws {ValidationError} if the input is invalid.
 */
Field.prototype.toJavaScript = function(value) {
  return value
}

/**
 * Checks for the given value being === one of the configured empty values, plus
 * any additional checks required due to JavaScript's lack of a generic object
 * equality checking mechanism.
 */
Field.prototype.isEmptyValue = function(value) {
  if (this.emptyValues.indexOf(value) != -1) {
    return true
  }
  return (this.emptyValueArray === true && is.Array(value) && value.length === 0)
}

Field.prototype.validate = function(value) {
  if (this.required && this.isEmptyValue(value)) {
    throw ValidationError(this.errorMessages.required, {code: 'required'})
  }
}

Field.prototype.runValidators = function(value) {
  if (this.isEmptyValue(value)) {
    return
  }
  var errors = []
  for (var i = 0, l = this.validators.length; i < l; i++) {
    var validator = this.validators[i]
    try {
      validator(value)
    }
    catch (e) {
      if (!(e instanceof ValidationError)) { throw e }
      if (object.hasOwn(e, 'code') &&
          object.hasOwn(this.errorMessages, e.code)) {
        e.message = this.errorMessages[e.code]
      }
      errors.push.apply(errors, e.errorList)
    }
  }
  if (errors.length > 0) {
    throw ValidationError(errors)
  }
}

/**
 * Validates the given value and returns its "cleaned" value as an appropriate
 * JavaScript object.
 * @param {string} value user input.
 * @throws {ValidationError} if the input is invalid.
 */
Field.prototype.clean = function(value) {
  value = this.toJavaScript(value)
  this.validate(value)
  this.runValidators(value)
  return value
}

/**
 * Return the value that should be shown for this field on render of a bound
 * form, given the submitted data for the field and the initial data, if any.
 * For most fields, this will simply be data; FileFields need to handle it a bit
 * differently.
 */
Field.prototype.boundData = function(data, initial) {
  return data
}

/**
 * Specifies HTML attributes which should be added to a given widget for this
 * field.
 * @param {Widget} widget a widget.
 * @return {Object} an object specifying HTML attributes that should be added to
 *   the given widget when rendered, based on this field.
 */
Field.prototype.widgetAttrs = function(widget) {
  return {}
}

/**
 * @return {boolean} true if data differs from initial.
 */
Field.prototype._hasChanged = function(initial, data) {
  // For purposes of seeing whether something has changed, null is the same
  // as an empty string, if the data or initial value we get is null, replace
  // it with ''.
  var initialValue = (initial === null ? '' : initial)
  try {
    data = this.toJavaScript(data)
    if (typeof this._coerce == 'function') {
      data = this._coerce(data)
    }
  }
  catch (e) {
    if (!(e instanceof ValidationError)) { throw e }
    return true
  }
  var dataValue = (data === null ? '' : data)
  return (''+initialValue != ''+dataValue) // TODO is forcing to string necessary?
}

/**
 * Validates that its input is a valid String.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var CharField = Field.extend({
  constructor: function CharField(kwargs) {
    if (!(this instanceof Field)) { return new CharField(kwargs) }
    kwargs = object.extend({maxLength: null, minLength: null}, kwargs)
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

/**
 * @return {string}
 */
CharField.prototype.toJavaScript = function(value) {
  if (this.isEmptyValue(value)) {
    return ''
  }
  return ''+value
}

/**
 * If this field is configured to enforce a maximum length, adds a suitable
 * maxLength attribute to text input fields.
 * @param {Widget} widget the widget being used to render this field's value.
 * @return {Object} additional attributes which should be added to the widget.
 */
CharField.prototype.widgetAttrs = function(widget) {
  var attrs = {}
  if (this.maxLength !== null && (widget instanceof widgets.TextInput ||
                                  widget instanceof widgets.PasswordInput)) {
    attrs.maxLength = ''+this.maxLength
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
  widget: widgets.NumberInput
, defaultErrorMessages: {
    invalid: 'Enter a whole number.'
  }

, constructor: function IntegerField(kwargs) {
    if (!(this instanceof Field)) { return new IntegerField(kwargs) }
    kwargs = object.extend({maxValue: null, minValue: null}, kwargs)
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

/**
 * Validates that Number() can be called on the input with a result that isn't
 * NaN and doesn't contain any decimal points.
 * @param {*} value user input.
 * @return {?number} the result of Number(), or null for empty values.
 * @throws {ValidationError} if the input is invalid.
 */
IntegerField.prototype.toJavaScript = function(value) {
  value = Field.prototype.toJavaScript.call(this, value)
  if (this.isEmptyValue(value)) {
    return null
  }
  value = Number(value)
  if (isNaN(value) || value.toString().indexOf('.') != -1) {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
  }
  return value
}

IntegerField.prototype.widgetAttrs = function(widget) {
  var attrs = Field.prototype.widgetAttrs.call(this, widget)
  if (widget instanceof widgets.NumberInput) {
    if (this.minValue !== null) {
      attrs.min = this.minValue
    }
    if (this.maxValue !== null) {
      attrs.max = this.maxValue
    }
  }
  return attrs
}

/**
 * Validates that its input is a valid float.
 * @constructor
 * @extends {IntegerField}
 * @param {Object=} kwargs
 */
var FloatField = IntegerField.extend({
  defaultErrorMessages: {
    invalid: 'Enter a number.'
  }

, constructor: function FloatField(kwargs) {
    if (!(this instanceof Field)) { return new FloatField(kwargs) }
    IntegerField.call(this, kwargs)
  }
})

/** Float validation regular expression, as parseFloat() is too forgiving. */
FloatField.FLOAT_REGEXP = /^[-+]?(?:\d+(?:\.\d*)?|(?:\d+)?\.\d+)$/

/**
 * Validates that the input looks like valid input for parseFloat() and the
 * result of calling it isn't NaN.
 * @param {*} value user input.
 * @return a Number obtained from parseFloat(), or null for empty values.
 * @throws {ValidationError} if the input is invalid.
 */
FloatField.prototype.toJavaScript = function(value) {
  value = Field.prototype.toJavaScript.call(this, value)
  if (this.isEmptyValue(value)) {
    return null
  }
  value = util.strip(value)
  if (!FloatField.FLOAT_REGEXP.test(value)) {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
  }
  value = parseFloat(value)
  if (isNaN(value)) {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
  }
  return value
}

/**
 * Determines if data has changed from initial. In JavaScript, trailing zeroes
 * in floats are dropped when a float is coerced to a String, so e.g., an
 * initial value of 1.0 would not match a data value of '1.0' if we were to use
 * the Widget object's _hasChanged, which checks coerced String values.
 * @return {boolean} true if data has changed from initial.
 */
FloatField.prototype._hasChanged = function(initial, data) {
  // For purposes of seeing whether something has changed, null is the same
  // as an empty string, if the data or initial value we get is null, replace
  // it with ''.
  var dataValue = (data === null ? '' : data)
  var initialValue = (initial === null ? '' : initial)
  if (initialValue === dataValue) {
    return false
  }
  else if (initialValue === '' || dataValue === '') {
    return true
  }
  return (parseFloat(''+initialValue) != parseFloat(''+dataValue))
}

FloatField.prototype.widgetAttrs = function(widget) {
  var attrs = IntegerField.prototype.widgetAttrs.call(this, widget)
  if (widget instanceof widgets.NumberInput &&
      !object.hasOwn(widget.attrs, 'step')) {
    object.setDefault(attrs, 'step', 'any')
  }
  return attrs
}

/**
 * Validates that its input is a decimal number.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var DecimalField = IntegerField.extend({
  defaultErrorMessages: {
    invalid: 'Enter a number.'
  , maxDigits: 'Ensure that there are no more than {max} digits in total.'
  , maxDecimalPlaces: 'Ensure that there are no more than {max} decimal places.'
  , maxWholeDigits: 'Ensure that there are no more than {max} digits before the decimal point.'
  }

, constructor: function DecimalField(kwargs) {
    if (!(this instanceof Field)) { return new DecimalField(kwargs) }
    kwargs = object.extend({maxDigits: null, decimalPlaces: null}, kwargs)
    this.maxDigits = kwargs.maxDigits
    this.decimalPlaces = kwargs.decimalPlaces
    IntegerField.call(this, kwargs)
  }
})

/** Decimal validation regular expression, in lieu of a Decimal type. */
DecimalField.DECIMAL_REGEXP = /^[-+]?(?:\d+(?:\.\d*)?|(?:\d+)?\.\d+)$/

/**
 * DecimalField overrides the clean() method as it performs its own validation
 * against a different value than that given to any defined validators, due to
 * JavaScript lacking a built-in Decimal type. Decimal format and component size
 * checks will be performed against a normalised string representation of the
 * input, whereas Validators will be passed a float version of the value for
 * min/max checking.
 * @param {string|Number} value
 * @return {string} a normalised version of the input.
 */
DecimalField.prototype.clean = function(value) {
  // Take care of empty, required validation
  Field.prototype.validate.call(this, value)
  if (this.isEmptyValue(value)) {
    return null
  }

  // Coerce to string and validate that it looks Decimal-like
  value = util.strip(''+value)
  if (!DecimalField.DECIMAL_REGEXP.test(value)) {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
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
  // * If the input ended with a '.', it is stripped
  if (value.indexOf('.') == value.length - 1) {
    value = value.substring(0, value.length - 1)
  }

  // Perform own validation
  var pieces = value.split('.')
  var wholeDigits = pieces[0].length
  var decimals = (pieces.length == 2 ? pieces[1].length : 0)
  var digits = wholeDigits + decimals
  if (this.maxDigits !== null && digits > this.maxDigits) {
    throw ValidationError(this.errorMessages.maxDigits, {
      code: 'maxDigits'
    , params: {max: this.maxDigits}
    })
  }
  if (this.decimalPlaces !== null && decimals > this.decimalPlaces) {
    throw ValidationError(this.errorMessages.maxDecimalPlaces, {
      code: 'maxDecimalPlaces'
    , params: {max: this.decimalPlaces}
    })
  }
  if (this.maxDigits !== null &&
      this.decimalPlaces !== null &&
      wholeDigits > (this.maxDigits - this.decimalPlaces)) {
    throw ValidationError(this.errorMessages.maxWholeDigits, {
      code: 'maxWholeDigits'
    , params: {max: (this.maxDigits - this.decimalPlaces)}
    })
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

  // Return the normalised String representation
  return value
}

DecimalField.prototype.widgetAttrs = function(widget) {
  var attrs = IntegerField.prototype.widgetAttrs.call(this, widget)
  if (widget instanceof widgets.NumberInput &&
      !object.hasOwn(widget.attrs, 'step')) {
    var step = 'any'
    if (this.decimalPlaces !== null) {
      // Use exponential notation for small values since they might
      // be parsed as 0 otherwise.
      if (this.decimalPlaces === 0) {
        step = '1'
      }
      else if (this.decimalPlaces < 7) {
        step = '0.' + '000001'.slice(-this.decimalPlaces)
      }
      else {
        step = '1e-' + this.decimalPlaces
      }
    }
    object.setDefault(attrs, 'step', step)
  }
  return attrs
}

/**
 * Base field for fields which validate that their input is a date or time.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var BaseTemporalField = Field.extend({
  inputFormatType: ''
, constructor: function BaseTemporalField(kwargs) {
    kwargs = object.extend({inputFormats: null}, kwargs)
    Field.call(this, kwargs)
    this.inputFormats = kwargs.inputFormats
  }
})

/**
 * Validates that its input is a valid date or time.
 * @param {(string|Date)} value user input.
 * @return {Date}
 * @throws {ValidationError} if the input is invalid.
 */
BaseTemporalField.prototype.toJavaScript = function(value) {
  if (!is.Date(value)) {
    value = util.strip(value)
  }
  if (is.String(value)) {
    if (this.inputFormats === null) {
      this.inputFormats = formats.getFormat(this.inputFormatType)
    }
    for (var i = 0, l = this.inputFormats.length; i < l; i++) {
      try {
        return this.strpdate(value, this.inputFormats[i])
      }
      catch (e) {
        // pass
      }
    }
  }
  throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
}

/**
 * Creates a Date from the given input if it's valid based on a format.
 * @param {string} value
 * @param {string} format
 * @return {Date}
 */
BaseTemporalField.prototype.strpdate = function(value, format) {
  return time.strpdate(value, format, locales.getDefaultLocale())
}

BaseTemporalField.prototype._hasChanged = function(initial, data) {
  try {
    data = this.toJavaScript(data)
  }
  catch (e) {
    if (!(e instanceof ValidationError)) { throw e }
    return true
  }
  initial = this.toJavaScript(initial)
  if (!!initial && !!data) {
    return initial.getTime() !== data.getTime()
  }
  else {
    return initial !== data
  }
}

/**
 * Validates that its input is a date.
 * @constructor
 * @extends {BaseTemporalField}
 * @param {Object=} kwargs
 */
var DateField = BaseTemporalField.extend({
  widget: widgets.DateInput
, inputFormatType: 'DATE_INPUT_FORMATS'
, defaultErrorMessages: {
    invalid: 'Enter a valid date.'
  }

, constructor: function DateField(kwargs) {
    if (!(this instanceof Field)) { return new DateField(kwargs) }
    BaseTemporalField.call(this, kwargs)
  }
})

/**
 * Validates that the input can be converted to a date.
 * @param {?(string|Date)} value user input.
 * @return {?Date} a with its year, month and day attributes set, or null for
 *   empty values when they are allowed.
 * @throws {ValidationError} if the input is invalid.
 */
DateField.prototype.toJavaScript = function(value) {
  if (this.isEmptyValue(value)) {
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
  widget: widgets.TimeInput
, inputFormatType: 'TIME_INPUT_FORMATS'
, defaultErrorMessages: {
    invalid: 'Enter a valid time.'
  }

, constructor: function TimeField(kwargs) {
    if (!(this instanceof Field)) { return new TimeField(kwargs) }
    BaseTemporalField.call(this, kwargs)
  }
})

/**
 * Validates that the input can be converted to a time.
 * @param {?(string|Date)} value user input.
 * @return {?Date} a Date with its hour, minute and second attributes set, or
 *   null for empty values when they are allowed.
 * @throws {ValidationError} if the input is invalid.
 */
TimeField.prototype.toJavaScript = function(value) {
  if (this.isEmptyValue(value)) {
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
 * @param {string} value
 * @param {string} format
 * @return {Date}
 */
TimeField.prototype.strpdate = function(value, format) {
  var t = time.strptime(value, format, locales.getDefaultLocale())
  return new Date(1900, 0, 1, t[3], t[4], t[5])
}

/**
 * Validates that its input is a date/time.
 * @constructor
 * @extends {BaseTemporalField}
 * @param {Object=} kwargs
 */
var DateTimeField = BaseTemporalField.extend({
  widget: widgets.DateTimeInput
, inputFormatType: 'DATETIME_INPUT_FORMATS'
, defaultErrorMessages: {
    invalid: 'Enter a valid date/time.'
  }

, constructor: function DateTimeField(kwargs) {
    if (!(this instanceof Field)) { return new DateTimeField(kwargs) }
    BaseTemporalField.call(this, kwargs)
  }
})

/**
 * @param {?(string|Date|Array.<string>)} value user input.
 * @return {?Date}
 * @throws {ValidationError} if the input is invalid.
 */
DateTimeField.prototype.toJavaScript = function(value) {
  if (this.isEmptyValue(value)) {
    return null
  }
  if (value instanceof Date) {
    return value
  }
  if (is.Array(value)) {
    // Input comes from a SplitDateTimeWidget, for example, so it's two
    // components: date and time.
    if (value.length != 2) {
      throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
    }
    if (this.isEmptyValue(value[0]) && this.isEmptyValue(value[1])) {
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
 * @param {(RegExp|string)} regex
 * @param {Object=} kwargs
 */
var RegexField = CharField.extend({
  constructor: function RegexField(regex, kwargs) {
    if (!(this instanceof Field)) { return new RegexField(regex, kwargs) }
    CharField.call(this, kwargs)
    if (is.String(regex)) {
      regex = new RegExp(regex)
    }
    this.regex = regex
    this.validators.push(validators.RegexValidator({regex: this.regex}))
  }
})

/**
 * Validates that its input appears to be a valid e-mail address.
 * @constructor
 * @extends {CharField}
 * @param {Object=} kwargs
 */
var EmailField = CharField.extend({
  widget: widgets.EmailInput
, defaultValidators: [validators.validateEmail]

, constructor: function EmailField(kwargs) {
    if (!(this instanceof Field)) { return new EmailField(kwargs) }
    CharField.call(this, kwargs)
  }
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
  widget: widgets.ClearableFileInput
, defaultErrorMessages: {
    invalid: 'No file was submitted. Check the encoding type on the form.'
  , missing: 'No file was submitted.'
  , empty: 'The submitted file is empty.'
  , maxLength: 'Ensure this filename has at most {max} characters (it has {length}).'
  , contradiction: 'Please either submit a file or check the clear checkbox, not both.'
  }

, constructor: function FileField(kwargs) {
    if (!(this instanceof Field)) { return new FileField(kwargs) }
    kwargs = object.extend({maxLength: null, allowEmptyFile: false}, kwargs)
    this.maxLength = kwargs.maxLength
    this.allowEmptyFile = kwargs.allowEmptyFile
    delete kwargs.maxLength
    Field.call(this, kwargs)
  }
})

FileField.prototype.toJavaScript = function(data, initial) {
  if (this.isEmptyValue(data)) {
    return null
  }

  if (env.browser) {
    return data
  }

  // UploadedFile objects should have name and size attributes
  if (typeof data.name == 'undefined' || typeof data.size == 'undefined') {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
  }

  var fileName = data.name
  var fileSize = data.size

  if (this.maxLength !== null && fileName.length > this.maxLength) {
    throw ValidationError(this.errorMessages.maxLength, {
      code: 'maxLength'
    , params: {max: this.maxLength, length: fileName.length}
    })
  }
  if (!fileName) {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
  }
  if (!this.allowEmptyFile && !fileSize) {
    throw ValidationError(this.errorMessages.empty, {code: 'empty'})
  }
  return data
}

FileField.prototype.clean = function(data, initial) {
  // If the widget got contradictory inputs, we raise a validation error
  if (data === widgets.FILE_INPUT_CONTRADICTION) {
    throw ValidationError(this.errorMessages.contradiction,
                          {code: 'contradiction'})
  }
  // false means the field value should be cleared; further validation is
  // not needed.
  if (data === false) {
    if (!this.required) {
      return false
    }
    // If the field is required, clearing is not possible (the widget
    // shouldn't return false data in that case anyway). false is not
    // in EMPTY_VALUES; if a false value makes it this far it should be
    // validated from here on out as null (so it will be caught by the
    // required check).
    data = null
  }
  if (!data && initial) {
    return initial
  }
  return Field.prototype.clean.call(this, data)
}

FileField.prototype.boundData = function(data, initial) {
  if (data === null || data === widgets.FILE_INPUT_CONTRADICTION) {
    return initial
  }
  return data
}

FileField.prototype._hasChanged = function(initial, data) {
  return (data !== null)
}

/**
 * Validates that its input is a valid uploaded image.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var ImageField = FileField.extend({
  defaultErrorMessages: {
    invalidImage: 'Upload a valid image. The file you uploaded was either not an image or a corrupted image.'
  }

, constructor: function ImageField(kwargs) {
    if (!(this instanceof Field)) { return new ImageField(kwargs) }
    FileField.call(this, kwargs)
  }
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

ImageField.prototype.widgetAttrs = function(widget) {
  var attrs = FileField.prototype.widgetAttrs.call(this, widget)
  attrs.accept = 'image/*'
  return attrs
}

/**
 * Validates that its input appears to be a valid URL.
 * @constructor
 * @extends {CharField}
 * @param {Object=} kwargs
 */
var URLField = CharField.extend({
  widget: widgets.URLInput
, defaultErrorMessages: {
    invalid: 'Enter a valid URL.'
  }
, defaultValidators: [validators.URLValidator()]

, constructor: function URLField(kwargs) {
    if (!(this instanceof Field)) { return new URLField(kwargs) }
    CharField.call(this, kwargs)
  }
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

URLField.prototype.clean = function(value) {
  value = util.strip(this.toJavaScript(value))
  return CharField.prototype.clean.call(this, value)
}

/**
 * Normalises its input to a Boolean primitive.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var BooleanField = Field.extend({
  widget: widgets.CheckboxInput

, constructor: function BooleanField(kwargs) {
    if (!(this instanceof Field)) { return new BooleanField(kwargs) }
    Field.call(this, kwargs)
  }
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
    throw ValidationError(this.errorMessages.required, {code: 'required'})
  }
  return value
}

BooleanField.prototype._hasChanged = function(initial, data) {
  // Sometimes data or initial could be null or '' which should be the same
  // thing as false.
  if (initial === 'false') {
    // showHiddenInitial may have transformed false to 'false'
    initial = false
  }
  return (Boolean(initial) != Boolean(data))
}

/**
 * A field whose valid values are null, true and false.
 * Invalid values are cleaned to null.
 * @constructor
 * @extends {BooleanField}
 * @param {Object=} kwargs
 */
var NullBooleanField = BooleanField.extend({
  widget: widgets.NullBooleanSelect

, constructor: function NullBooleanField(kwargs) {
    if (!(this instanceof Field)) { return new NullBooleanField(kwargs) }
    BooleanField.call(this, kwargs)
  }
})

NullBooleanField.prototype.toJavaScript = function(value) {
  // Explicitly checks for the string 'True' and 'False', which is what a
  // hidden field will submit for true and false, and for '1' and '0', which
  // is what a RadioField will submit. Unlike the BooleanField we also need
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

NullBooleanField.prototype._hasChanged = function(initial, data) {
  // null (unknown) and false (No) are not the same
  if (initial !== null) {
      initial = Boolean(initial)
  }
  if (data !== null) {
      data = Boolean(data)
  }
  return initial != data
}

/**
 * Validates that its input is one of a valid list of choices.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var ChoiceField = Field.extend({
  widget: widgets.Select
, defaultErrorMessages: {
    invalidChoice: 'Select a valid choice. {value} is not one of the available choices.'
  }

, constructor: function ChoiceField(kwargs) {
    if (!(this instanceof Field)) { return new ChoiceField(kwargs) }
    kwargs = object.extend({choices: []}, kwargs)
    Field.call(this, kwargs)
    this.setChoices(kwargs.choices)
  }
})

ChoiceField.prototype.choices = function() { return this._choices }
ChoiceField.prototype.setChoices = function(choices) {
  // Setting choices also sets the choices on the widget
  this._choices = this.widget.choices = util.normaliseChoices(choices)
}

ChoiceField.prototype.toJavaScript = function(value) {
  if (this.isEmptyValue(value)) {
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
    throw ValidationError(this.errorMessages.invalidChoice, {
      code: 'invalidChoice'
    , params: {value: value}
    })
  }
}

/**
 * Checks to see if the provided value is a valid choice.
 * @param {string} value the value to be validated.
 */
ChoiceField.prototype.validValue = function(value) {
  var choices = this.choices()
  for (var i = 0, l = choices.length; i < l; i++) {
    if (is.Array(choices[i][1])) {
      // This is an optgroup, so look inside the group for options
      var optgroupChoices = choices[i][1]
      for (var j = 0, m = optgroupChoices.length; j < m; j++) {
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
  constructor: function TypedChoiceField(kwargs) {
    if (!(this instanceof Field)) { return new TypedChoiceField(kwargs) }
    kwargs = object.extend({
      coerce: function(val) { return val }, emptyValue: ''
    }, kwargs)
    this.coerce = object.pop(kwargs, 'coerce')
    this.emptyValue = object.pop(kwargs, 'emptyValue')
    ChoiceField.call(this, kwargs)
  }
})

/**
 * Validate that the value can be coerced to the right type (if not empty).
 */
TypedChoiceField.prototype._coerce = function(value) {
  if (value === this.emptyValue || this.isEmptyValue(value)) {
    return this.emptyValue
  }
  try {
    value = this.coerce(value)
  }
  catch (e) {
    throw ValidationError(this.errorMessages.invalidChoice, {
      code: 'invalidChoice'
    , params: {value: value}
    })
  }
  return value
}

TypedChoiceField.prototype.clean = function(value) {
  value = ChoiceField.prototype.clean.call(this, value)
  return this._coerce(value)
}

/**
 * Validates that its input is one or more of a valid list of choices.
 * @constructor
 * @extends {ChoiceField}
 * @param {Object=} kwargs
 */
var MultipleChoiceField = ChoiceField.extend({
  hiddenWidget: widgets.MultipleHiddenInput
, widget: widgets.SelectMultiple
, defaultErrorMessages: {
    invalidChoice: 'Select a valid choice. {value} is not one of the available choices.'
  , invalidList: 'Enter a list of values.'
  }

, constructor: function MultipleChoiceField(kwargs) {
    if (!(this instanceof Field)) { return new MultipleChoiceField(kwargs) }
    ChoiceField.call(this, kwargs)
  }
})

MultipleChoiceField.prototype.toJavaScript = function(value) {
  if (this.isEmptyValue(value)) {
    return []
  }
  else if (!is.Array(value)) {
    throw ValidationError(this.errorMessages.invalidList, {code: 'invalidList'})
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
 * @param {Array.<string>} value user input.
 * @throws {ValidationError} if the input is invalid.
 */
MultipleChoiceField.prototype.validate = function(value) {
  if (this.required && !value.length) {
    throw ValidationError(this.errorMessages.required, {code: 'required'})
  }
  for (var i = 0, l = value.length; i < l; i++) {
    if (!this.validValue(value[i])) {
      throw ValidationError(this.errorMessages.invalidChoice, {
        code: 'invalidChoice'
      , params: {value: value[i]}
      })
    }
  }
}

MultipleChoiceField.prototype._hasChanged = function(initial, data) {
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
 * AMultipleChoiceField which returns values coerced by some provided function.
 * @constructor
 * @extends {MultipleChoiceField}
 * @param {Object=} kwargs
 */
var TypedMultipleChoiceField = MultipleChoiceField.extend({
  constructor: function TypedMultipleChoiceField(kwargs) {
    if (!(this instanceof Field)) { return new TypedMultipleChoiceField(kwargs) }
    kwargs = object.extend({
      coerce: function(val) { return val }, emptyValue: []
    }, kwargs)
    this.coerce = object.pop(kwargs, 'coerce')
    this.emptyValue = object.pop(kwargs, 'emptyValue')
    MultipleChoiceField.call(this, kwargs)
  }
})

TypedMultipleChoiceField.prototype._coerce = function(value) {
  if (value === this.emptyValue || this.isEmptyValue(value) ||
      (is.Array(value) && !value.length)) {
    return this.emptyValue
  }
  var newValue = []
  for (var i = 0, l = value.length; i < l; i++) {
    try {
      newValue.push(this.coerce(value[i]))
    }
    catch (e) {
      throw ValidationError(this.errorMessages.invalidChoice, {
        code: 'invalidChoice'
      , params: {value: value[i]}
      })
    }
  }
  return newValue
}

TypedMultipleChoiceField.prototype.clean = function(value) {
  value = MultipleChoiceField.prototype.clean.call(this, value)
  return this._coerce(value)
}

TypedMultipleChoiceField.prototype.validate = function(value) {
  if (value !== this.emptyValue || (is.Array(value) && value.length)) {
    MultipleChoiceField.prototype.validate.call(this, value)
  }
  else if (this.required) {
    throw ValidationError(this.errorMessages.required, {code: 'required'})
  }
}

/**
 * Allows choosing from files inside a certain directory.
 * @constructor
 * @extends {ChoiceField}
 * @param {string} path
 * @param {Object=} kwargs
 */
var FilePathField = ChoiceField.extend({
  constructor: function FilePathField(path, kwargs) {
    if (!(this instanceof Field)) { return new FilePathField(path, kwargs) }
    kwargs = object.extend({
      match: null, recursive: false, required: true, widget: null,
      label: null, initial: null, helpText: null,
      allowFiles: true, allowFolders: false
    }, kwargs)

    this.path = path
    this.match = object.pop(kwargs, 'match')
    this.recursive = object.pop(kwargs, 'recursive')
    this.allowFiles = object.pop(kwargs, 'allowFiles')
    this.allowFolders = object.pop(kwargs, 'allowFolders')
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
 * A Field whose clean() method calls multiple Field clean() methods.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var ComboField = Field.extend({
  constructor: function ComboField(kwargs) {
    if (!(this instanceof Field)) { return new ComboField(kwargs) }
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
 * Its clean() method takes a "decompressed" list of values, which are then
 * cleaned into a single value according to this.fields. Each value in this
 * list is cleaned by the corresponding field -- the first value is cleaned by
 * the first field, the second value is cleaned by the second field, etc. Once
 * all fields are cleaned, the list of clean values is "compressed" into a
 * single value.
 * Subclasses should not have to implement clean(). Instead, they must
 * implement compress(), which takes a list of valid values and returns a
 * "compressed" version of those values -- a single value.
 * You'll probably want to use this with MultiWidget.
 * @constructor
 * @extends {Field}
 * @param {Object=} kwargs
 */
var MultiValueField = Field.extend({
  defaultErrorMessages: {
    invalid: 'Enter a list of values.'
  , incomplete: 'Enter a complete value.'
  }

, constructor: function MultiValueField(kwargs) {
    if (!(this instanceof Field)) { return new MultiValueField(kwargs) }
    kwargs = object.extend({fields: []}, kwargs)
    this.requireAllFields = object.pop(kwargs, 'requireAllFields', true)
    Field.call(this, kwargs)

    for (var i = 0, l = kwargs.fields.length; i < l; i++) {
      var f = kwargs.fields[i]
      object.setDefault(f.errorMessages, 'incomplete',
                        this.errorMessages.incomplete)
      if (this.requireAllFields) {
        // Set required to false on the individual fields, because the required
        // validation will be handled by MultiValueField, not by those
        // individual fields.
        f.required = false
      }
    }
    this.fields = kwargs.fields
  }
})

MultiValueField.prototype.validate = function() {}

/**
 * Validates every value in the given list. A value is validated against the
 * corresponding Field in this.fields.
 * For example, if this MultiValueField was instantiated with
 * {fields: [forms.DateField(), forms.TimeField()]}, clean() would call
 * DateField.clean(value[0]) and TimeField.clean(value[1]).
 * @param {Array} value user input for each field.
 * @return the result of calling compress() on the cleaned input.
 * @throws {ValidationError} if the input is invalid.
 */
MultiValueField.prototype.clean = function(value) {
  var cleanData = []
  var errors = []

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
        throw ValidationError(this.errorMessages.required, {code: 'required'})
      }
      else {
        return this.compress([])
      }
    }
  }
  else {
    throw ValidationError(this.errorMessages.invalid, {code: 'invalid'})
  }

  for (i = 0, l = this.fields.length; i < l; i++) {
    var field = this.fields[i]
    var fieldValue = value[i]
    if (fieldValue === undefined) {
      fieldValue = null
    }
    if (this.isEmptyValue(fieldValue)) {
      if (this.requireAllFields) {
        // Throw a 'required' error if the MultiValueField is required and any
        // field is empty.
        if (this.required) {
          throw ValidationError(this.errorMessages.required, {code: 'required'})
        }
      }
      else if (field.required) {
        // Otherwise, add an 'incomplete' error to the list of collected errors
        // and skip field cleaning, if a required field is empty.
        if (errors.indexOf(field.errorMessages.incomplete) == -1) {
          errors.push(field.errorMessages.incomplete)
        }
        continue
      }
    }

    try {
      cleanData.push(field.clean(fieldValue))
    }
    catch (e) {
      if (!(e instanceof ValidationError)) { throw e }
      // Collect all validation errors in a single list, which we'll throw at
      // the end of clean(), rather than throwing a single exception for the
      // first error we encounter. Skip duplicates.
      errors = errors.concat(e.messages().filter(function(m) {
        return errors.indexOf(m) == -1
      }))
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
 * For example, if this MultiValueField was instantiated with
 * {fields: [forms.DateField(), forms.TimeField()]}, this might return a Date
 * object created by combining the date and time in dataList.
 * @param {Array} dataList
 * @abstract
 */
MultiValueField.prototype.compress = function(dataList) {
  throw new Error('Subclasses must implement this method.')
}

MultiValueField.prototype._hasChanged = function(initial, data) {
  if (initial === null) {
    initial = []
    for (var i = 0, l = data.length; i < l; i++) {
      initial.push('')
    }
  }
  else if (!(is.Array(initial))) {
    initial = this.widget.decompress(initial)
  }

  for (i = 0, l = this.fields.length; i < l; i++) {
    if (this.fields[i]._hasChanged(initial[i], data[i])) {
      return true
    }
  }
  return false
}

/**
 * A MultiValueField consisting of a DateField and a TimeField.
 * @constructor
 * @extends {MultiValueField}
 * @param {Object=} kwargs
 */
var SplitDateTimeField = MultiValueField.extend({
  hiddenWidget: widgets.SplitHiddenDateTimeWidget
, widget: widgets.SplitDateTimeWidget
, defaultErrorMessages: {
    invalidDate: 'Enter a valid date.'
  , invalidTime: 'Enter a valid time.'
  }

, constructor: function SplitDateTimeField(kwargs) {
    if (!(this instanceof Field)) { return new SplitDateTimeField(kwargs) }
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
    , TimeField({inputFormats: kwargs.inputTimeFormats,
                 errorMessages: {invalid: errors.invalidTime}})
    ]
    MultiValueField.call(this, kwargs)
  }
})

/**
 * Validates that, if given, its input does not contain empty values.
 * @param {?Array.<Date>} dataList a two-item list consisting of two Date
 *   objects, the first of which represents a date, the second a time.
 * @return {?Date} a Dare representing the given date and time, or null for
 *   empty values.
 */
SplitDateTimeField.prototype.compress = function(dataList) {
  if (is.Array(dataList) && dataList.length > 0) {
    var d = dataList[0]
    var t = dataList[1]
    // Raise a validation error if date or time is empty (possible if
    // SplitDateTimeField has required == false).
    if (this.isEmptyValue(d)) {
      throw ValidationError(this.errorMessages.invalidDate, {code: 'invalidDate'})
    }
    if (this.isEmptyValue(t)) {
      throw ValidationError(this.errorMessages.invalidTime, {code: 'invalidTime'})
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
 * @deprecated in favour of GenericIPAddressField
 */
var IPAddressField = CharField.extend({
  defaultValidators: [validators.validateIPv4Address]

, constructor: function IPAddressField(kwargs) {
    if (!(this instanceof Field)) { return new IPAddressField(kwargs) }
    CharField.call(this, kwargs)
  }
})

var GenericIPAddressField = CharField.extend({
  constructor: function GenericIPAddressField(kwargs) {
    if (!(this instanceof Field)) { return new GenericIPAddressField(kwargs) }
    kwargs = object.extend({protocol: 'both', unpackIPv4: false}, kwargs)
    this.unpackIPv4 = kwargs.unpackIPv4
    this.defaultValidators =
      validators.ipAddressValidators(kwargs.protocol, kwargs.unpackIPv4).validators
    CharField.call(this, kwargs)
  }
})

GenericIPAddressField.prototype.toJavaScript = function(value) {
  if (!value) {
    return ''
  }
  if (value && value.indexOf(':') != -1) {
    return cleanIPv6Address(value, {unpackIPv4: this.unpackIPv4})
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
  defaultValidators: [validators.validateSlug]
, constructor: function SlugField(kwargs) {
    if (!(this instanceof Field)) { return new SlugField(kwargs) }
    CharField.call(this, kwargs)
  }
})

SlugField.prototype.clean = function(value) {
  value = util.strip(this.toJavaScript(value))
  return CharField.prototype.clean.call(this, value)
}

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

},{"./env":5,"./formats":7,"./locales":10,"./util":11,"./widgets":12,"Concur":13,"isomorph/is":17,"isomorph/object":18,"isomorph/time":19,"isomorph/url":20,"validators":22}],7:[function(require,module,exports){
'use strict';

var object = require('isomorph/object')

var locales = require('./locales')

/**
 * Standard input formats which will always be accepted.
 */
var ISO_INPUT_FORMATS = {
  'DATE_INPUT_FORMATS': ['%Y-%m-%d']
, 'TIME_INPUT_FORMATS': ['%H:%M:%S', '%H:%M']
, 'DATETIME_INPUT_FORMATS': [
    '%Y-%m-%d %H:%M:%S'
  , '%Y-%m-%d %H:%M'
  , '%Y-%m-%d'
  ]
}

var formatCache = {}

/**
 * Gets all acceptable formats of a certain type (e.g. DATE_INPUT_FORMATS) for a
 * particular language code. All date/time formats will have the applicable ISO
 * formats added as lowest-precedence.
 * If an unknown language code is given, the default locale's formats will be
 * used instead.
 * If the locale doesn't have configuration for the format type, only the ISO
 * formats will be returned.
 * @param {string} formatType
 * @param {string=} lang language code - if not given, the default locale's
 *   formats will be returned.
 * @return {Array.<string>} a list of formats
 */
function getFormat(formatType, lang) {
  if (!lang) {
    lang = locales.getDefaultLocale()
  }
  var cacheKey = formatType + ':' + lang
  if (!object.hasOwn(formatCache, cacheKey)) {
    var langLocales = locales.getLocales(lang)
    var localeFormats = []
    for (var i = 0, l = langLocales.length; i < l; i++) {
      var locale = langLocales[i]
      if (object.hasOwn(locale, formatType)) {
        // Copy locale-specific formats, as we may be adding to them
        localeFormats = locale[formatType].slice()
        break
      }
    }
    if (object.hasOwn(ISO_INPUT_FORMATS, formatType)) {
      var isoFormats = ISO_INPUT_FORMATS[formatType]
      for (var j = 0, m = isoFormats.length; j < m; j++) {
        var isoFormat = isoFormats[j]
        if (localeFormats.indexOf(isoFormat) == -1) {
          localeFormats.push(isoFormat)
        }
      }
    }
    formatCache[cacheKey] = localeFormats
  }
  return formatCache[cacheKey]
}

module.exports = {
  getFormat: getFormat
}

},{"./locales":10,"isomorph/object":18}],8:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var copy = require('isomorph/copy')
var is = require('isomorph/is')
var object = require('isomorph/object')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)
var validators = require('validators')

var fields = require('./fields')
var util = require('./util')
var BoundField = require('./BoundField')
var ErrorList = require('./ErrorList')
var ErrorObject = require('./ErrorObject')

var Field = fields.Field
var FileField = fields.FileField
var ValidationError = validators.ValidationError

function noop() {}
var sentinel = {}

/** Property under which non-field-specific errors are stored. */
var NON_FIELD_ERRORS = '__all__'

/**
 * Checks if a field's view of raw input data (via its Widget) has changed.
 */
function fieldDataHasChanged(previous, current) {
  if (is.Array(previous) && is.Array(current)) {
    if (previous.length != current.length) { return true }
    for (var i = 0, l = previous.length; i < l; i++) {
      if (previous[i] != current[i]) { return true }
    }
    return false
  }
  return previous != current
}

if ('production' !== "development") {
  var warnedOnImpliedValidateAuto = false
}

/**
 * A collection of Fields that knows how to validate and display itself.
 * @constructor
 * @param {Object.<string, *>} kwargs form options.
 */
var BaseForm = Concur.extend({
  constructor: function BaseForm(kwargs) {
    // TODO Perform PropType checks on kwargs in development mode
    kwargs = object.extend({
      data: null, files: null, autoId: 'id_{name}', prefix: null,
      initial: null, errorConstructor: ErrorList, labelSuffix: ':',
      emptyPermitted: false, validation: null, controlled: false,
      onChange: null, errors: null
    }, kwargs)
    this.isInitialRender = (kwargs.data == null && kwargs.files == null)
    this.data = kwargs.data || {}
    this.files = kwargs.files || {}
    this.autoId = kwargs.autoId
    this.prefix = kwargs.prefix
    this.initial = kwargs.initial || {}
    this.cleanedData = {}
    this.errorConstructor = kwargs.errorConstructor
    this.labelSuffix = kwargs.labelSuffix
    this.emptyPermitted = kwargs.emptyPermitted
    this.controlled = kwargs.controlled
    this.onChange = kwargs.onChange

    // Auto validation is implied when onChange is passed
    if (is.Function(kwargs.onChange)) {
      if ('production' !== "development") {
        if (!warnedOnImpliedValidateAuto && kwargs.validation === 'auto') {
          util.info('Passing onChange to a Form or FormSet constructor also ' +
                    "implies validation: 'auto' by default - you don't have " +
                    'to set it manually.')
          warnedOnImpliedValidateAuto = true
        }
      }
      if (kwargs.validation == null) {
        kwargs.validation = 'auto'
      }
    }
    this.validation = util.normaliseValidation(kwargs.validation || 'manual')

    this._errors = kwargs.errors

    // Cancellable debounced functions for delayed event validation
    this._pendingEventValidation = {}
    // Input data as it was last time validation was performed on a field
    this._lastValidatedData = {}
    // Cached result of the last call to hasChanged()
    this._lastHasChanged = null

    // Lookup for names of fields pending validation
    this._pendingValidation = {}
    // Cancellable callbacks for pending async validation
    this._pendingAsyncValidation = {}
    // Lookup for names of fields pending validation which clean() depends on
    this._runCleanAfter = {}
    // Callback to be run the next time validation finishes
    this._onValidate = null

    // The baseFields attribute is the *prototype-wide* definition of fields.
    // Because a particular *instance* might want to alter this.fields, we
    // create this.fields here by deep copying baseFields. Instances should
    // always modify this.fields; they should not modify baseFields.
    this.fields = copy.deepCopy(this.baseFields)

    if ('production' !== "development") {
      // Now that form.fields exists, we can check if there's any configuration
      // which *needs* onChange on the form or its fields.
      if (!is.Function(kwargs.onChange) && this._needsOnChange()) {
        util.warning("You didn't provide an onChange callback for a " +
                     this._formName() + ' which has controlled fields. This ' +
                     'will result in read-only fields.')
      }
    }

    // Copy initial values to the data object, as it represents form input -
    // literally so in the case of controlled components once we start taking
    // some data and isInitialRender flips to false.
    if (this.isInitialRender) {
      this._copyInitialToData()
    }
  }
})

/**
 * Calls the onChange function if it's been provided. This method will be called
 * every time the form makes a change to its state which requires redisplay.
 */
BaseForm.prototype._stateChanged = function() {
  if (typeof this.onChange == 'function') {
    this.onChange()
  }
}

/**
 * Copies initial data to the input data object, as it represents form input -
 * when using controlled components once we start taking some data,
 * isInitialRender flips to false and this.data is used for rendering widgets.
 */
BaseForm.prototype._copyInitialToData = function() {
  var initialData = object.extend(this._fieldInitialData(), this.initial)
  var initialFieldNames = Object.keys(initialData)
  for (var i = 0, l = initialFieldNames.length; i < l; i++) {
    var fieldName = initialFieldNames[i]
    if (typeof this.fields[fieldName] == 'undefined') { continue }
    // Don't copy initial to input data for fields which can't have the
    // initial data set as their current value.
    if (!this.fields[fieldName].widget.isValueSettable) { continue }
    this.data[this.addPrefix(fieldName)] = initialData[fieldName]
  }
}

/**
 * Gets initial data configured in this form's fields.
 * @return {Object.<string,*>}
 */
BaseForm.prototype._fieldInitialData = function() {
  var fieldInitial = {}
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l; i++) {
    var fieldName = fieldNames[i]
    var initial = this.fields[fieldName].initial
    if (initial !== null) {
      fieldInitial[fieldName] = initial
    }
  }
  return fieldInitial
}

/**
 * Tries to construct a display name for the form for display in error messages.
 * @return {string}
 */
BaseForm.prototype._formName = function() {
  var name = this.displayName || this.constructor.name
  return (name ? "'" + name + "'" : 'Form')
}

/**
 * @return {boolean} true if the form or any of its fields are configured to
 *   generate controlled components.
 */
BaseForm.prototype._needsOnChange = function() {
  if (this.controlled === true) {
    return true
  }
  var names = Object.keys(this.fields)
  for (var i = 0, l = names.length; i < l; i++) {
    if (this.fields[names[i]].controlled === true) {
      return true
    }
  }
  return false
}

// ============================================================== Validation ===

/**
 * Validates the form from scratch. If a <form> is given, data from it will be
 * set on this form first. Otherwise, validation will be done with this form's
 * current input data.
 * @param {(ReactElement|HTMLFormElement)=} form the <form> containing this
 * form's rendered widgets - this can be a React <form> component or a real
 * <form> DOM node.
 * @param {function(err, isValid, cleanedData)=} cb callback for asynchronous
 *   validation.
 * @return {boolean|undefined} true if the form only has synchronous validation
 *   and is valid.
 * @throws if the form has asynchronous validation and a callback is not
 *   provided.
 */
BaseForm.prototype.validate = function(form, cb) {
  this._cancelPendingOperations()
  if (is.Function(form)) {
    cb = form
    form = null
  }
  if (form) {
    if (typeof form.getDOMNode == 'function') {
      form = form.getDOMNode()
    }
    this.data = util.formData(form)
  }
  return (this.isAsync() ? this._validateAsync(cb) : this._validateSync())
}

BaseForm.prototype._validateAsync = function(cb) {
  if (!is.Function(cb)) {
    throw new Error(
      'You must provide a callback to validate() when a form has ' +
      'asynchronous validation.'
    )
  }
  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  this._onValidate = cb
  this.fullClean()
  // Display async progress indicators
  this._stateChanged()
}

BaseForm.prototype._validateSync = function() {
  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  this.fullClean()
  // Display changes to valid/invalid state
  this._stateChanged()
  return this.isValid()
}

/**
 * Cleans data for all fields and triggers cross-form cleaning.
 */
BaseForm.prototype.fullClean = function() {
  this._errors = new ErrorObject()
  if (this.isInitialRender) {
    return // Stop further processing
  }

  this.cleanedData = {}

  // If the form is permitted to be empty, and none of the form data has
  // changed from the initial data, short circuit any validation.
  if (this.emptyPermitted && !this.hasChanged()) {
    this._finishedValidation(null)
    return
  }

  this._cleanFields()
}

/**
 * Cleans data for the given field names and triggers cross-form cleaning in
 * case any cleanedData it uses has changed.
 * @param {Array.<string>} fields field names.
 */
BaseForm.prototype.partialClean = function(fields) {
  this._removeErrors(fields)

  // If the form is permitted to be empty, and none of the form data has
  // changed from the initial data, short circuit any validation.
  if (this.emptyPermitted && !this.hasChanged()) {
    if (this._errors.isPopulated()) {
      this._errors = ErrorObject()
    }
    return
  }

  this._preCleanFields(fields)
  for (var i = 0, l = fields.length; i < l; i++) {
    this._cleanField(fields[i])
  }
}

/**
 * Validates and cleans every field in the form.
 */
BaseForm.prototype._cleanFields = function() {
  var fieldNames = Object.keys(this.fields)
  this._preCleanFields(fieldNames)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    this._cleanField(fieldNames[i])
  }
}

/**
 * Sets up pending validation state prior to cleaning fields and configures
 * cross-field cleaning to run after its dependent fields have been cleaned, or
 * after all fields have been cleaned if dependencies have not been configured.
 * @param {Array.<string>} fieldNames fields which are about to be cleaned.
 */
BaseForm.prototype._preCleanFields = function(fieldNames) {
  // Add all field names to those pending validation
  object.extend(this._pendingValidation, object.lookup(fieldNames))

  // Add appropriate field names to determine when to run cross-field cleaning
  var i, l
  if (typeof this.clean.fields != 'undefined') {
    for (i = 0, l = fieldNames.length; i < l; i++) {
      if (this.clean.fields[fieldNames[i]]) {
        this._runCleanAfter[fieldNames[i]] = true
      }
    }
  }
  else {
    // Ignore any invalid field names given
    for (i = 0, l = fieldNames.length; i < l; i++) {
      if (this.fields[fieldNames[i]]) {
        this._runCleanAfter[fieldNames[i]] = true
      }
    }
  }
}

/**
 * Validates and cleans the named field and runs any custom validation function
 * that's been provided for it.
 * @param {string} name the name of a form field.
 */
BaseForm.prototype._cleanField = function(name) {
  if (!object.hasOwn(this.fields, name)) {
    throw new Error(this._formName() + " has no field named '" + name + "'")
  }

  var field = this.fields[name]
  // valueFromData() gets the data from the data objects.
  // Each widget type knows how to retrieve its own data, because some widgets
  // split data over several HTML fields.
  var value = field.widget.valueFromData(this.data, this.files,
                                         this.addPrefix(name))
  var async = false
  var error = null

  try {
    if (field instanceof FileField) {
      var initial = object.get(this.initial, name, field.initial)
      value = field.clean(value, initial)
    }
    else {
      value = field.clean(value)
    }
    this.cleanedData[name] = value
    var customClean = this._getCustomClean(name)
    if (is.Function(customClean)) {
      async = this._runCustomClean(name, customClean)
    }
  }
  catch (e) {
    if (e instanceof ValidationError) {
      this.addError(name, e)
    }
    else {
      error = e
    }
  }

  if (!async) {
    this._fieldCleaned(name, error)
  }
}

/**
 * Gets the custom cleaning method for a field. These can be named clean<Name>
 * or clean_<name>.
 * @param {string} fieldName
 * @return {function|undefined}
 */
BaseForm.prototype._getCustomClean = function(fieldName) {
  return (this['clean' + fieldName.charAt(0).toUpperCase() + fieldName.substr(1)] ||
          this['clean_' + fieldName])
}

/**
 * Calls a custom cleaning method, expecting synchronous or asynchronous
 * behaviour, depending on its arity.
 * @param {string} fieldName a field name.
 * @param {(function()|function(function(Error, string, string|ValidationError)))} customClean
 *   the custom cleaning method for the field.
 * @return {boolean} true if cleaning is running asynchronously, false if it just
 *   ran synchronously.
 */
BaseForm.prototype._runCustomClean = function(fieldName, customClean) {
  // Check arity to see if we have a callback in the function signature
  if (customClean.length === 0) {
    // Synchronous processing only expected
    customClean.call(this)
    return false
  }

  // If custom validation is async and there's one pending, prevent its
  // callback from doing anything.
  if (typeof this._pendingAsyncValidation[fieldName] != 'undefined') {
    object.pop(this._pendingAsyncValidation, fieldName).cancel()
  }
  // Set up callback for async processing - the argument for addError()
  // should be passed via the callback as calling it directly prevents us
  // from completely ignoring the callback if validation fires again.
  var callback = function(err, validationError) {
    if (validationError) {
      this.addError(fieldName == NON_FIELD_ERRORS ? null : fieldName, validationError)
    }
    this._fieldCleaned(fieldName, err)
    this._stateChanged()
  }.bind(this)
  var cancellableCallback = util.cancellable(callback)

  // An explicit return value of false indicates that async processing is
  // being skipped (e.g. because sync checks in the method failed first)
  var returnValue = customClean.call(this, cancellableCallback)
  if (returnValue !== false) {
    // Async processing is happening! Make the callback cancellable and
    // hook up any custom onCancel handling provided.
    if (returnValue && typeof returnValue.onCancel == 'function') {
      callback.onCancel = returnValue.onCancel
    }
    this._pendingAsyncValidation[fieldName] = cancellableCallback
    return true
  }
}

/**
 * Callback for completion of field cleaning. Triggers further field cleaning or
 * signals the end of validation, as necessary.
 * @param {string} fieldName
 * @param {Error=} err an error caught while cleaning the field.
 */
BaseForm.prototype._fieldCleaned = function(fieldName, err) {
  var wasPending = delete this._pendingValidation[fieldName]
  if (this._pendingAsyncValidation[fieldName]) {
    delete this._pendingAsyncValidation[fieldName]
  }

  if (err) {
    if ("production" !== "development") {
      console.error('Error cleaning ' + this._formName() + '.' + fieldName +
                    ':' + err.message)
    }
    // Stop tracking validation progress on error, and don't call clean()
    this._pendingValidation = {}
    this._runCleanAfter = {}
    this._finishedValidation(err)
    return
  }

  // Run clean() if this this was the last field it was waiting for
  if (this._runCleanAfter[fieldName]) {
    delete this._runCleanAfter[fieldName]
    if (is.Empty(this._runCleanAfter)) {
      this._cleanForm()
      return
    }
  }

  // Signal the end of validation if this was the last field we were waiting for
  if (wasPending && is.Empty(this._pendingValidation)) {
    this._finishedValidation(null)
  }
}

/**
 * Hook for doing any extra form-wide cleaning after each Field has been cleaned.
 * Any ValidationError thrown by synchronous validation in this method will not
 * be associated with a particular field; it will have a special-case association
 * with the field named '__all__'.
 * @param {function(Error, string, string|ValidationError)=} cb a callback to signal the
 *   end of asynchronous validation.
 */
BaseForm.prototype.clean = noop

/**
 * Calls the clean() hook.
 */
BaseForm.prototype._cleanForm = function() {
  var async = false
  var error = null
  try {
    if (this.clean !== noop) {
      async = this._runCustomClean(NON_FIELD_ERRORS, this.clean)
    }
  }
  catch (e) {
    if (e instanceof ValidationError) {
      this.addError(null, e)
    }
    else {
      error = e
    }
  }

  if (!async) {
    this._fieldCleaned(NON_FIELD_ERRORS, error)
  }
}

BaseForm.prototype._finishedValidation = function(err) {
  if (!this.isAsync()) {
    if (err) {
      throw err
    }
    // Synchronous form validation results will be returned via the original
    // call which triggered validation.
    return
  }
  if (is.Function(this._onValidate)) {
    var callback = this._onValidate
    this._onValidate = null
    if (err) {
      return callback(err)
    }
    var isValid = this.isValid()
    callback(null, isValid, isValid ? this.cleanedData : null)
  }
}

/**
 * Cancels any pending field validations and async validations.
 */
BaseForm.prototype._cancelPendingOperations = function() {
  Object.keys(this._pendingEventValidation).forEach(function(field) {
    object.pop(this._pendingEventValidation, field).cancel()
  }.bind(this))
  Object.keys(this._pendingAsyncValidation).forEach(function(field) {
    object.pop(this._pendingAsyncValidation, field).cancel()
  }.bind(this))
}

// ========================================================== Event Handling ===

/**
 * Handles validating the field which is the target of the given event based
 * on its validation config. This will be hooked up to the appropriate event
 * as per the field's validation config.
 * @param {Object} validation the field's validation config for the event.
 * @param {SyntheticEvent} e the event being handled.
 */
BaseForm.prototype._handleFieldEvent = function(validation, e) {
  // Update form.data with the current value of the field which is the target of
  // the event.
  var htmlName = e.target.name
  var fieldName = this.removePrefix(e.target.getAttribute('data-newforms-field') || htmlName)
  var field = this.fields[fieldName]
  var targetData = util.fieldData(e.target.form, htmlName)
  this.data[htmlName] = targetData
  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  if (this.controlled || field.controlled) {
    this._stateChanged()
  }

  // Bail out early if the event is only being handled to update the field's data
  if (validation.validate === false) { return }

  var validate = false

  // Special cases for onBlur, as it ends a user's interaction with a text input
  if (validation.event == 'onBlur') {
    // If there is any pending validation, trigger it immediately
    if (typeof this._pendingEventValidation[fieldName] != 'undefined') {
      this._pendingEventValidation[fieldName].trigger()
      return
    }
    // Always validate if the field is required and the input which was blurred
    // was empty (some fields have multiple inputs).
    validate = (field.required && field.isEmptyValue(targetData))
  }

  // Always validate if this is the first time the field has been interacted
  // with.
  if (!validate) {
    var lastValidatedData = object.get(this._lastValidatedData, fieldName, sentinel)
    validate = (lastValidatedData === sentinel)
  }

  // Otherwise, validate if data has changed since validation was last performed
  // - this prevents displayed validation errors being cleared unnecessarily.
  if (!validate) {
    var fieldData = field.widget.valueFromData(this.data, null, this.addPrefix(fieldName))
    validate = fieldDataHasChanged(lastValidatedData, fieldData)
  }

  // Cancel any pending validation as it's no longer needed - this can happen
  // if the user edits a field with debounced validation and it ends up back
  // at its original value before validation is triggered.
  if (!validate && typeof this._pendingEventValidation[fieldName] != 'undefined') {
    object.pop(this._pendingEventValidation, fieldName).cancel()
  }

  // If we don't need to validate, we're done handling the event
  if (!validate) { return }

  if (validation.delay) {
    this._delayedFieldValidation(fieldName, validation.delay)
  }
  else {
    this._immediateFieldValidation(fieldName)
  }
}

/**
 * Sets up delayed validation of a field with a debounced function and calls it,
 * or just calls the function again if it already exists, to reset the delay.
 * @param {string} fieldName
 * @param {number} delay delay time in ms.
 */
BaseForm.prototype._delayedFieldValidation = function(fieldName, delay) {
  if (typeof this._pendingEventValidation[fieldName] == 'undefined') {
    this._pendingEventValidation[fieldName] = util.debounce(function() {
      delete this._pendingEventValidation[fieldName]
      this._immediateFieldValidation(fieldName)
    }.bind(this), delay)
  }
  this._pendingEventValidation[fieldName]()
}

/**
 * Validates a field and notifies the React component that state has changed.
 * @param {string} fieldName
 */
BaseForm.prototype._immediateFieldValidation = function(fieldName) {
  // Remove and cancel any pending validation for the field to avoid doubling up
  // when both delayed and immediate validation are configured.
  if (typeof this._pendingEventValidation[fieldName] != 'undefined') {
    object.pop(this._pendingEventValidation, fieldName).cancel()
  }
  this._lastValidatedData[fieldName] =
      this.fields[fieldName].widget.valueFromData(this.data, this.files,
                                                  this.addPrefix(fieldName))
  this.partialClean([fieldName])
  this._stateChanged()
}

// ============================================================== Mutability ===

/**
 * Resets a form data back to its initial state, optionally providing new initial
 * data.
 * @param {Object.<string, *>=} newInitial new initial data for the form.
 */
BaseForm.prototype.reset = function(newInitial) {
  this._cancelPendingOperations()

  if (typeof newInitial != 'undefined') {
    this.initial = newInitial
  }

  this.data = {}
  this.cleanedData = {}
  this.isInitialRender = true

  this._errors = null
  this._lastHasChanged = null
  this._pendingValidation = {}
  this._runCleanAfter = {}
  this._lastValidatedData = {}
  this._onValidate = null

  this._copyInitialToData()
  this._stateChanged()
}

/**
 * Sets the form's entire input data, also triggering validation by default.
 * @param {object.<string,*>} data new input data for the form.
 * @param {object.<string,boolean>} kwargs data setting options.
 * @return {boolean|undefined} if data setting options indicate the new data
 *   should be validated and the form does not have asynchronous validation
 *   configured: true if the new data is valid.
 */
BaseForm.prototype.setData = function(data, kwargs) {
  kwargs = object.extend({
    prefixed: false, validate: true, _triggerStateChange: true
  }, kwargs)

  this.data = (kwargs.prefixed ? data : this._prefixData(data))

  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  if (kwargs.validate) {
    this._errors = null
    // This call ultimately triggers a fullClean() because _errors is null
    var isValid = this.isValid()
  }
  else {
    // Prevent validation being triggered if errors() is accessed during render
    this._errors = new ErrorObject()
  }

  if (kwargs._triggerStateChange) {
    this._stateChanged()
  }

  if (kwargs.validate && !this.isAsync()) {
    return isValid
  }
}

/**
 * Sets the form's entire input data wth data extracted from a ``<form>``, which
 * will be prefixed, if prefixes are being used.
 * @param {Object.<strong, *>} formData
 * @param {Object.<string, boolean>} kwargs setData options.
 */
BaseForm.prototype.setFormData = function(formData, kwargs) {
  return this.setData(formData, object.extend(kwargs || {}, {prefixed: true}))
}

/**
 * Updates some of the form's input data, optionally triggering validation of
 * updated fields and form-wide cleaning, or clears existing errors from the
 * updated fields.
 * @param {Object.<string, *>} data updated input data for the form.
 * @param {Object.<string, boolean>} kwargs update options.
 */
BaseForm.prototype.updateData = function(data, kwargs) {
  kwargs = object.extend({
    prefixed: false, validate: true, clearValidation: true
  }, kwargs)

  object.extend(this.data, (kwargs.prefixed ? data : this._prefixData(data)))
  if (this.isInitialRender) {
    this.isInitialRender = false
  }

  var fields = Object.keys(data)
  if (kwargs.prefixed) {
    fields = fields.map(this.removePrefix.bind(this))
  }

  if (kwargs.validate) {
    this.partialClean(fields)
  }
  else if (kwargs.clearValidation) {
    this._removeErrors(fields)
    this._removeCleanedData(fields)
    this._cleanForm()
  }

  this._stateChanged()
}

/**
 * Removes any cleanedData present for the given form fields.
 * @param {Array.<string>} fields field names.
 */
BaseForm.prototype._removeCleanedData = function(fields) {
  for (var i = 0, l = fields.length; i < l; i++) {
    delete this.cleanedData[fields[i]]
  }
}

// ============================================================= BoundFields ===

/**
 * Creates a BoundField for the field with the given name.
 * @param {string} name a field name.
 * @return {BoundField} a BoundField for the field.
 */
BaseForm.prototype.boundField = function(name) {
  if (!object.hasOwn(this.fields, name)) {
    throw new Error(this._formName() + " does not have a '" + name + "' field.")
  }
  return new BoundField(this, this.fields[name], name)
}

/**
 * Creates a BoundField for each field in the form, in the order in which the
 * fields were created.
 * @param {function(Field, string)=} test if provided, this function will be
 *   called with field and name arguments - BoundFields will only be generated
 *   for fields for which true is returned.
 * @return {Array.<BoundField>} a list of BoundField objects.
 */
BaseForm.prototype.boundFields = function(test) {
  var bfs = []
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    var fieldName = fieldNames[i]
    if (!test || test(this.fields[fieldName], fieldName)) {
      bfs.push(new BoundField(this, this.fields[fieldName], fieldName))
    }
  }
  return bfs
}

/**
 * Like boundFields(), but returns a name -> BoundField object instead.
 * @return {Object.<string, BoundField>}
 */
BaseForm.prototype.boundFieldsObj = function() {
  var bfs = {}
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    var fieldName = fieldNames[i]
    bfs[fieldName] = new BoundField(this, this.fields[fieldName], fieldName)
  }
  return bfs
}

/**
 * Returns a list of all the BoundField objects that correspond to hidden
 * fields. Useful for manual form layout.
 * @return {Array.<BoundField>}
 */
BaseForm.prototype.hiddenFields = function() {
  return this.boundFields(function(field) {
    return field.widget.isHidden
  })
}

/**
 * Returns a list of BoundField objects that do not correspond to hidden fields.
 * The opposite of the hiddenFields() method.
 * @return {Array.<BoundField>}
 */
BaseForm.prototype.visibleFields = function() {
  return this.boundFields(function(field) {
    return !field.widget.isHidden
  })
}

// ================================================================== Errors ===

/**
 * Updates the content of this._errors.
 * The field argument is the name of the field to which the errors should be
 * added. If its value is null the errors will be treated as NON_FIELD_ERRORS.
 * The error argument can be a single error, a list of errors, or an object that
 * maps field names to lists of errors. What we define as an "error" can be
 * either a simple string or an instance of ValidationError with its message
 * attribute set and what we define as list or object can be an actual list or
 * object or an instance of ValidationError with its errorList or errorObj
 * property set.
 * If error is an object, the field argument *must* be null and errors will be
 * added to the fields that correspond to the properties of the object.
 * @param {?string} field the name of a form field.
 * @param {(string|ValidationError|Array.<(string|ValidationError)>|Object<string,(string|ValidationError|Array.<(string|ValidationError)>))} error
 */
BaseForm.prototype.addError = function(field, error) {
  if (!(error instanceof ValidationError)) {
    // Normalise to ValidationError and let its constructor do the hard work of
    // making sense of the input.
    error = ValidationError(error)
  }

  if (object.hasOwn(error, 'errorObj')) {
    if (field !== null) {
      throw new Error("The 'field' argument to form.addError() must be null when " +
                      "the 'error' argument contains errors for multiple fields.")
    }
    error = error.errorObj
  }
  else {
    var errorList = error.errorList
    error = {}
    error[field || NON_FIELD_ERRORS] = errorList
  }

  var fields = Object.keys(error)
  for (var i = 0, l = fields.length; i < l; i++) {
    field = fields[i]
    errorList = error[field]
    if (!this._errors.hasField(field)) {
      if (field !== NON_FIELD_ERRORS && !object.hasOwn(this.fields, field)) {
        throw new Error(this._formName() + " has no field named '" + field + "'")
      }
      this._errors.set(field, new this.errorConstructor())
    }
    else {
      // Filter out any error messages which are duplicates of existing
      // messages. This can happen if onChange validation which uses addError()
      // is fired repeatedly and is adding an error message to a field other
      // then the one being changed.
      var messageLookup = object.lookup(this._errors.get(field).messages())
      var newMessages = ErrorList(errorList).messages()
      for (var j = errorList.length - 1; j >= 0; j--) {
        if (messageLookup[newMessages[j]]) {
          errorList.splice(j, 1)
        }
      }
    }

    if (errorList.length > 0) {
      this._errors.get(field).extend(errorList)
    }

    if (object.hasOwn(this.cleanedData, field)) {
      delete this.cleanedData[field]
    }
  }
}

/**
 * Getter for errors, which first cleans the form if there are no errors
 * defined yet.
 * @param {string=} name if given, errors for this field name will be returned
 *   instead of the full error object.
 * @return {ErrorObject|ErrorList} form or field errors
 */
BaseForm.prototype.errors = function(name) {
  if (this._errors == null) {
    this.fullClean()
  }
  if (name) {
    return this._errors.get(name)
  }
  return this._errors
}

/**
 * @return {ErrorObject} errors that aren't associated with a particular field -
 *   i.e., errors generated by clean(). Will be empty if there are none.
 */
BaseForm.prototype.nonFieldErrors = function() {
  return (this.errors(NON_FIELD_ERRORS) || new this.errorConstructor())
}

/**
 * @param {ErrorObject} errors
 */
BaseForm.prototype.setErrors = function(errors) {
  this._errors = errors
  this._stateChanged()
}

/**
 * Removes any validation errors present for the given form fields. If validation
 * has not been performed yet, initialises the errors object.
 * @param {Array.<string>} fields field names.
 */
BaseForm.prototype._removeErrors = function(fields) {
  if (this._errors == null) {
    this._errors = ErrorObject()
  }
  else {
    // TODO use clean.fields if available
    this._errors.remove(NON_FIELD_ERRORS)
    this._errors.removeAll(fields)
  }
}

// ================================================================= Changes ===

/**
 * Determines which fields have changed from initial form data.
 * @param {boolean=} _hasChangedCheck if true, the method is only being run to
 *   determine if any fields have changed, not to get the list of fields.
 * @return {Array.<string>|boolean} a list of changed field names or true if
 *   only checking for changes and one is found.
 */
BaseForm.prototype.changedData = function(_hasChangedCheck) {
  var changedData = []
  var initialValue
  // XXX: For now we're asking the individual fields whether or not
  // the data has changed. It would probably be more efficient to hash
  // the initial data, store it in a hidden field, and compare a hash
  // of the submitted data, but we'd need a way to easily get the
  // string value for a given field. Right now, that logic is embedded
  // in the render method of each field's widget.
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    var name = fieldNames[i]
    var field = this.fields[name]
    var prefixedName = this.addPrefix(name)
    var dataValue = field.widget.valueFromData(this.data, this.files, prefixedName)
    if (!field.showHiddenInitial) {
      initialValue = object.get(this.initial, name, field.initial)
      if (is.Function(initialValue)) {
        initialValue = initialValue()
      }
    }
    else {
      var initialPrefixedName = this.addInitialPrefix(name)
      var hiddenWidget = new field.hiddenWidget()
      try {
        initialValue = hiddenWidget.valueFromData(
                this.data, this.files, initialPrefixedName)
      }
      catch (e) {
        if (!(e instanceof ValidationError)) { throw e }
        // Always assume data has changed if validation fails
        if (_hasChangedCheck) {
          return true
        }
        changedData.push(name)
        continue
      }
    }
    if (field._hasChanged(initialValue, dataValue)) {
      if (_hasChangedCheck) {
        return true
      }
      changedData.push(name)
    }
  }
  if (_hasChangedCheck) {
    return false
  }
  return changedData
}

/**
 * @return {boolean} true if input data differs from initial data.
 */
BaseForm.prototype.hasChanged = function() {
  this._lastHasChanged = this.changedData(true)
  return this._lastHasChanged
}

// ================================================================== Status ===

/**
 * @return {boolean} true if the form needs a callback argument for final
 *   validation.
 */
BaseForm.prototype.isAsync = function() {
  if (this.clean.length == 1) { return true }
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    var customClean = this._getCustomClean(fieldNames[i])
    if (is.Function(customClean) && customClean.length == 1) {
      return true
    }
  }
  return false
}

/**
 * @return {boolean} true if all required fields have been completed.
 */
BaseForm.prototype.isComplete = function() {
  if (!this.isValid() || this.isPending()) {
    return false
  }
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l; i++) {
    var fieldName = fieldNames[i]
    if (this.fields[fieldName].required &&
        typeof this.cleanedData[fieldName] == 'undefined') {
      return false
    }
  }
  return true
}

/**
 * @return {boolean} true if the form needs to be multipart-encoded, in other
 *   words, if it has a FileField.
 */
BaseForm.prototype.isMultipart = function() {
  var fieldNames = Object.keys(this.fields)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    if (this.fields[fieldNames[i]].widget.needsMultipartForm) {
      return true
    }
  }
  return false
}

/**
 * @return {boolean} true if the form is waiting for async validation to
 *   complete.
 */
BaseForm.prototype.isPending = function() {
  return !is.Empty(this._pendingAsyncValidation)
}

/**
 * @return {boolean} true if the form doesn't have any errors.
 */
BaseForm.prototype.isValid = function() {
  if (this.isInitialRender) {
    return false
  }
  return !this.errors().isPopulated()
}

/**
 * @return {boolean} true if the form is waiting for async validation of its
 *   clean() method to complete.
 */
BaseForm.prototype.nonFieldPending = function() {
  return typeof this._pendingAsyncValidation[NON_FIELD_ERRORS] != 'undefined'
}

/**
 * @return {boolean} true if this form is allowed to be empty and if input data
 *   differs from initial data. This can be used to determine when required
 *   fields in an extra FormSet form become truly required.
 */
BaseForm.prototype.notEmpty = function() {
  return (this.emptyPermitted && this._lastHasChanged === true)
}

// ================================================================ Prefixes ===

/**
 * Adds an initial prefix for checking dynamic initial values.
 * @param {string} fieldName a field name.
 * @return {string}
 */
BaseForm.prototype.addInitialPrefix = function(fieldName) {
  return 'initial-' + this.addPrefix(fieldName)
}

/**
 * Prepends a prefix to a field name if this form has one set.
 * @param {string} fieldName a form field name.
 * @return {string} the field name with a prefix prepended if this form has a
 *   prefix set, otherwise the field name as-is.
 * @return {string}
 */
BaseForm.prototype.addPrefix = function(fieldName) {
  if (this.prefix !== null) {
      return this.prefix + '-' + fieldName
  }
  return fieldName
}

/**
 * Returns the field with a prefix-size chunk chopped off the start if this
 * form has a prefix set and the field name starts with it.
 * @param {string} fieldName a field name.
 * @return {string}
 */
BaseForm.prototype.removePrefix = function(fieldName) {
  if (this.prefix !== null && fieldName.indexOf(this.prefix + '-') === 0) {
      return fieldName.substring(this.prefix.length + 1)
  }
  return fieldName
}

/**
 * Creates a version of the given data object with prefixes removed from the
 * property names if this form has a prefix, otherwise returns the object
 * itself.
 * @param {object.<string,*>} data
 * @return {Object.<string,*>}
 */
BaseForm.prototype._deprefixData = function(data) {
  if (this.prefix == null) { return data }
  var prefixedData = {}
  var fieldNames = Object.keys(data)
  for (var i = 0, l = fieldNames.length; i < l; i++) {
    prefixedData[this.removePrefix(fieldNames[i])] = data[fieldNames[i]]
  }
  return prefixedData
}

/**
 * Creates a version of the given data object with prefixes added to the
 * property names if this form has a prefix, otherwise returns the object
 * itself.
 * @param {object.<string,*>} data
 * @return {Object.<string,*>}
 */
BaseForm.prototype._prefixData = function(data) {
  if (this.prefix == null) { return data }
  var prefixedData = {}
  var fieldNames = Object.keys(data)
  for (var i = 0, l = fieldNames.length; i < l; i++) {
    prefixedData[this.addPrefix(fieldNames[i])] = data[fieldNames[i]]
  }
  return prefixedData
}

// ======================================================= Default Rendering ===

/**
 * Default render method, which just calls asTable().
 * @return {Array.<ReactElement>}
 */
BaseForm.prototype.render = function() {
  return this.asTable()
}

/**
 * Renders the form's fields, validation messages, async busy indicators and
 * hidden fields as a list of <tr>s.
 * @return {Array.<ReactElement>}
 */
BaseForm.prototype.asTable = (function() {
  function normalRow(key, cssClasses, label, field, pending, helpText, errors, extraContent) {
    var contents = []
    if (errors) { contents.push(errors) }
    contents.push(field)
    if (pending) {
      contents.push(React.createElement('br', null))
      contents.push(pending)
    }
    if (helpText) {
      contents.push(React.createElement('br', null))
      contents.push(helpText)
    }
    if (extraContent) { contents.push.apply(contents, extraContent) }
    var rowAttrs = {key: key}
    if (cssClasses) { rowAttrs.className = cssClasses }
    return React.createElement('tr', rowAttrs
    , React.createElement('th', null, label)
    , React.createElement('td', null, contents)
    )
  }

  function errorRow(key, errors, extraContent, cssClasses) {
    var contents = []
    if (errors) { contents.push(errors) }
    if (extraContent) { contents.push.apply(contents, extraContent) }
    var rowAttrs = {key: key}
    if (cssClasses) { rowAttrs.className = cssClasses }
    return React.createElement('tr', rowAttrs
    , React.createElement('td', {colSpan: 2}, contents)
    )
  }

  return function() { return this._htmlOutput(normalRow, errorRow) }
})()

/**
 * Renders the form's fields, validation messages, async busy indicators and
 * hidden fields as a list of <li>s.
 * @return {Array.<ReactElement>}
 */
BaseForm.prototype.asUl = _singleElementRow(React.createFactory('li'))

/**
 * Renders the form's fields, validation messages, async busy indicators and
 * hidden fields as a list of <div>s.
 * @return {Array.<ReactElement>}
 */
BaseForm.prototype.asDiv = _singleElementRow(React.createFactory('div'))

/**
 * Helper function for outputting HTML.
 * @param {function} normalRow a function which produces a normal row.
 * @param {function} errorRow a function which produces an error row.
 * @return {Array.<ReactElement>}
 */
BaseForm.prototype._htmlOutput = function(normalRow, errorRow) {
  var bf
  var bfErrors
  var topErrors = this.nonFieldErrors() // Errors that should be displayed above all fields

  var hiddenFields = []
  var hiddenBoundFields = this.hiddenFields()
  for (var i = 0, l = hiddenBoundFields.length; i < l; i++) {
    bf = hiddenBoundFields[i]
    bfErrors = bf.errors()
    if (bfErrors.isPopulated) {
      topErrors.extend(bfErrors.messages().map(function(error) {
        return '(Hidden field ' + bf.name + ') ' + error
      }))
    }
    hiddenFields.push(bf.render())
  }

  var rows = []
  var errors
  var label
  var pending
  var helpText
  var extraContent
  var visibleBoundFields = this.visibleFields()
  for (i = 0, l = visibleBoundFields.length; i < l; i++) {
    bf = visibleBoundFields[i]
    bfErrors = bf.errors()

    // Variables which can be optional in each row
    errors = (bfErrors.isPopulated() ? bfErrors.render() : null)
    label = (bf.label ? bf.labelTag() : null)
    pending = (bf.isPending() ? React.createElement('progress', null, '...') : null)
    helpText = bf.helpTextTag()
    // If this is the last row, it should include any hidden fields
    extraContent = (i == l - 1 && hiddenFields.length > 0 ? hiddenFields : null)

    rows.push(normalRow(bf.htmlName,
                        bf.cssClasses(),
                        label,
                        bf.render(),
                        pending,
                        helpText,
                        errors,
                        extraContent))
  }

  if (topErrors.isPopulated()) {
    // Add hidden fields to the top error row if it's being displayed and
    // there are no other rows.
    extraContent = (hiddenFields.length > 0 && rows.length === 0 ? hiddenFields : null)
    rows.unshift(errorRow(this.addPrefix(NON_FIELD_ERRORS),
                          topErrors.render(),
                          extraContent,
                          this.errorRowCssClass))
  }

  // Put a cross-field pending indicator in its own row
  if (this.nonFieldPending()) {
    extraContent = (hiddenFields.length > 0 && rows.length === 0 ? hiddenFields : null)
    rows.push(errorRow(this.addPrefix('__pending__'),
                       React.createElement('progress', null, '...'),
                       extraContent,
                       this.pendingRowCssClass))
  }

  // Put hidden fields in their own row if there were no rows to display.
  if (hiddenFields.length > 0 && rows.length === 0) {
    rows.push(errorRow(this.addPrefix('__hiddenFields__'),
                       null,
                       hiddenFields,
                       this.hiddenFieldRowCssClass))
  }

  return rows
}

function _normalRow(reactEl, key, cssClasses, label, field, pending, helpText, errors, extraContent) {
  var rowAttrs = {key: key}
  if (cssClasses) { rowAttrs.className = cssClasses }
  var contents = [rowAttrs]
  if (errors) { contents.push(errors) }
  if (label) { contents.push(label) }
  contents.push(' ')
  contents.push(field)
  if (pending) {
    contents.push(' ')
    contents.push(pending)
  }
  if (helpText) {
    contents.push(' ')
    contents.push(helpText)
  }
  if (extraContent) { contents.push.apply(contents, extraContent) }
  return reactEl.apply(null, contents)
}

function _errorRow(reactEl, key, errors, extraContent, cssClasses) {
  var rowAttrs = {key: key}
  if (cssClasses) { rowAttrs.className = cssClasses }
  var contents = [rowAttrs]
  if (errors) { contents.push(errors) }
  if (extraContent) { contents.push.apply(contents, extraContent) }
  return reactEl.apply(null, contents)
}

function _singleElementRow(reactEl) {
  var normalRow = _normalRow.bind(null, reactEl)
  var errorRow = _errorRow.bind(null, reactEl)
  return function() {
    return this._htmlOutput(normalRow, errorRow)
  }
}

/**
 * Renders a "row" in a form. This can contain manually provided contents, or
 * if a BoundField is given, it will be used to display a field's label, widget,
 * error message(s), help text and async pending indicator.
 */
var FormRow = React.createClass({
  propTypes: {
    bf: React.PropTypes.instanceOf(BoundField)
  , className: React.PropTypes.string
  , component: React.PropTypes.any
  , content: React.PropTypes.any
  , hidden: React.PropTypes.bool
  , __all__: function(props) {
      if (!props.bf && !props.content) {
        return new Error(
          'Invalid props supplied to `FormRow`, either `bf` or `content` ' +
          'must be specified.'
        )
      }
      if (props.bf && props.content) {
        return new Error(
          'Both `bf` and `content` props were passed to `FormRow` - `bf` ' +
          'will be ignored.'
        )
      }
    }
  },

  getDefaultProps: function() {
    return {
      component: 'div'
    }
  },

  render: function() {
    var attrs = {}
    if (this.props.className) {
      attrs.className = this.props.className
    }
    if (this.props.hidden) {
      attrs.style = {display: 'none'}
    }
    // If content was given, use it
    if (this.props.content) {
      return React.createElement(this.props.component, attrs, this.props.content)
    }
    // Otherwise render a BoundField
    var bf = this.props.bf
    var isPending = bf.isPending()
    return React.createElement(this.props.component, attrs,
      bf.labelTag(), ' ', bf.render(),
      isPending && ' ',
      isPending && React.createElement('progress', null, 'Validating...'),
      bf.errors().render(),
      bf.helpTextTag()
    )
  }
})

var formProps = {
  autoId: util.autoIdChecker
, controlled: React.PropTypes.bool
, data: React.PropTypes.object
, emptyPermitted: React.PropTypes.bool
, errorConstructor: React.PropTypes.func
, errors: React.PropTypes.instanceOf(ErrorObject)
, files: React.PropTypes.object
, initial: React.PropTypes.object
, labelSuffix: React.PropTypes.string
, onChange: React.PropTypes.func
, prefix: React.PropTypes.string
, validation: React.PropTypes.oneOfType([
    React.PropTypes.string
  , React.PropTypes.object
  ])
}

if ("production" !== "development") {
  var warnedAboutReactAddons = false
}

/**
 * Renders a Form. A form instance or constructor can be given. If a constructor
 * is given, an instance will be created when the component is mounted, and any
 * additional props will be passed to the constructor as options.
 */
var RenderForm = React.createClass({
  displayName: 'RenderForm',
  propTypes: object.extend({}, formProps, {
    className: React.PropTypes.string      // Class for the component wrapping all rows
  , component: React.PropTypes.any         // Component to wrap all rows
  , form: React.PropTypes.oneOfType([      // Form instance or constructor
      React.PropTypes.func,
      React.PropTypes.instanceOf(BaseForm)
    ]).isRequired
  , row: React.PropTypes.any               // Component to render form rows
  , rowComponent: React.PropTypes.any      // Component to wrap each row
  }),

  childContextTypes: {
    form: React.PropTypes.instanceOf(BaseForm)
  },

  getChildContext: function() {
    return {form: this.form}
  },

  getDefaultProps: function() {
    return {
      component: 'div'
    , row: FormRow
    , rowComponent: 'div'
    }
  },

  componentWillMount: function() {
    if (this.props.form instanceof BaseForm) {
      this.form = this.props.form
    }
    else {
      this.form = new this.props.form(object.extend({
        onChange: this.forceUpdate.bind(this)
      }, util.getProps(this.props, Object.keys(formProps))))
    }
  },

  getForm: function() {
    return this.form
  },

  render: function() {
    // Allow a single child to be passed for custom rendering - passing any more
    // will throw an error.
    if (React.Children.count(this.props.children) !== 0) {
      return React.Children.only(this.props.children)
      // TODO Cloning should no longer be necessary when facebook/react#2112 lands
      if (React.addons) {
        return React.addons.cloneWithProps(React.Children.only(this.props.children), {form: this.form})
      }
      else {
        if ("production" !== "development") {
          if (!warnedAboutReactAddons) {
            util.warning(
              'Children have been passed to RenderForm but React.addons.' +
              'cloneWithProps is not available to clone them. ' +
              'To use custom rendering, you must use the react-with-addons ' +
              'build of React.'
            )
            warnedAboutReactAddons = true
          }
        }
      }
    }

    // Default rendering
    var form = this.form
    var props = this.props
    var attrs = {}
    if (this.props.className) {
      attrs.className = props.className
    }
    var topErrors = form.nonFieldErrors()
    var hiddenFields = form.hiddenFields().map(function(bf) {
      var errors = bf.errors()
      if (errors.isPopulated) {
        topErrors.extend(errors.messages().map(function(error) {
          return '(Hidden field ' + bf.name + ') ' + error
        }))
      }
      return bf.render()
    })

    return React.createElement(props.component, attrs,
      topErrors.isPopulated() && React.createElement(props.row, {
        className: form.errorCssClass
      , content: topErrors.render()
      , key: form.addPrefix('__all__')
      , component: props.rowComponent
      }),
      form.visibleFields().map(function(bf) {
        return React.createElement(props.row, {
          bf: bf
        , className: bf.cssClasses()
        , key: bf.htmlName
        , component: props.rowComponent
        })
      }.bind(this)),
      form.nonFieldPending() && React.createElement(props.row, {
        className: form.pendingRowCssClass
      , content: React.createElement('progress', null, 'Validating...')
      , key: form.addPrefix('__pending__')
      , component: props.rowComponent
      }),
      hiddenFields.length > 0 && React.createElement(props.row, {
        className: form.hiddenFieldRowCssClass
      , content: hiddenFields
      , hidden: true
      , key: form.addPrefix('__hidden__')
      , component: props.rowComponent
      })
    )
  }
})

// TODO Support declaring propTypes when extending forms - merge them in here
/**
 * Meta function for handling declarative fields and inheriting fields from
 * forms further up the inheritance chain or being explicitly mixed-in, which
 * sets up baseFields and declaredFields on a new Form constructor's prototype.
 * @param {Object.<string,*>} prototypeProps
 */
function DeclarativeFieldsMeta(prototypeProps) {
  // Pop Fields instances from prototypeProps to build up the new form's own
  // declaredFields.
  var fields = []
  Object.keys(prototypeProps).forEach(function(name) {
    if (prototypeProps[name] instanceof Field) {
      fields.push([name, prototypeProps[name]])
      delete prototypeProps[name]
    }
  })
  fields.sort(function(a, b) {
    return a[1].creationCounter - b[1].creationCounter
  })
  prototypeProps.declaredFields = object.fromItems(fields)

  // Build up final declaredFields from the form being extended, forms being
  // mixed in and the new form's own declaredFields, in that order of
  // precedence.
  var declaredFields = {}

  // If we're extending another form, we don't need to check for shadowed
  // fields, as it's at the bottom of the pile for inheriting declaredFields.
  if (object.hasOwn(this, 'declaredFields')) {
    object.extend(declaredFields, this.declaredFields)
  }

  // If any mixins which look like Form constructors were given, inherit their
  // declaredFields and check for shadowed fields.
  if (object.hasOwn(prototypeProps, '__mixins__')) {
    var mixins = prototypeProps.__mixins__
    if (!is.Array(mixins)) { mixins = [mixins] }
    // Process mixins from left-to-right, the same precedence they'll get for
    // having their prototype properties mixed in.
    for (var i = 0, l = mixins.length; i < l; i++) {
      var mixin = mixins[i]
      if (is.Function(mixin) && object.hasOwn(mixin.prototype, 'declaredFields')) {
        // Extend mixed-in declaredFields over the top of what's already there,
        // then delete any fields which have been shadowed by a non-Field
        // property in its prototype.
        object.extend(declaredFields, mixin.prototype.declaredFields)
        Object.keys(mixin.prototype).forEach(function(name) {
          if (object.hasOwn(declaredFields, name)) {
            delete declaredFields[name]
          }
        })
        // To avoid overwriting the new form's baseFields, declaredFields or
        // constructor when the rest of the mixin's prototype is mixed-in by
        // Concur, replace the mixin with an object containing only its other
        // prototype properties.
        var mixinPrototype = object.extend({}, mixin.prototype)
        delete mixinPrototype.baseFields
        delete mixinPrototype.declaredFields
        delete mixinPrototype.constructor
        mixins[i] = mixinPrototype
      }
    }
    // We may have wrapped a single mixin in an Array - assign it back to the
    // new form's prototype for processing by Concur.
    prototypeProps.__mixins__ = mixins
  }

  // Finally - extend the new form's own declaredFields over the top of
  // declaredFields being inherited, then delete any fields which have been
  // shadowed by a non-Field property in its prototype.
  object.extend(declaredFields, prototypeProps.declaredFields)
  Object.keys(prototypeProps).forEach(function(name) {
    if (object.hasOwn(declaredFields, name)) {
      delete declaredFields[name]
    }
  })

  prototypeProps.baseFields = declaredFields
  prototypeProps.declaredFields = declaredFields

  // If a clean method is specified as [field1, field2, ..., cleanFunction],
  // replace it with the clean function and attach the field names to the
  // function.
  if (object.hasOwn(prototypeProps, 'clean') && is.Array(prototypeProps.clean)) {
    var clean = prototypeProps.clean.pop()
    clean.fields = object.lookup(prototypeProps.clean)
    prototypeProps.clean = clean
  }
}

/**
 * Base constructor which acts as the user API for creating new form
 * constructors, extending BaseForm and registering DeclarativeFieldsMeta as
 * its __meta__ function to handle setting up new form constructor prototypes.
 * @constructor
 * @extends {BaseForm}
 */
var Form = BaseForm.extend({
  __meta__: DeclarativeFieldsMeta
, constructor: function Form() {
    BaseForm.apply(this, arguments)
  }
})

var _extend = Form.extend

Form.extend = function(prototypeProps, constructorProps) {
  return _extend.call(this, object.extend({}, prototypeProps), constructorProps)
}

function isFormAsync(constructor) {
  var proto = constructor.prototype
  if (proto.clean.length == 1) { return true }
  var fieldNames = Object.keys(proto.baseFields)
  for (var i = 0, l = fieldNames.length; i < l ; i++) {
    var customClean = proto._getCustomClean(fieldNames[i])
    if (is.Function(customClean) && customClean.length == 1) {
      return true
    }
  }
  return false
}

module.exports = {
  NON_FIELD_ERRORS: NON_FIELD_ERRORS
, BaseForm: BaseForm
, DeclarativeFieldsMeta: DeclarativeFieldsMeta
, FormRow: FormRow
, Form: Form
, isFormAsync: isFormAsync
, RenderForm: RenderForm
}

},{"./BoundField":2,"./ErrorList":3,"./ErrorObject":4,"./fields":6,"./util":11,"Concur":13,"isomorph/copy":15,"isomorph/is":17,"isomorph/object":18,"validators":22}],9:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var is = require('isomorph/is')
var object = require('isomorph/object')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)
var validators = require('validators')

var env = require('./env')
var fields = require('./fields')
var forms = require('./forms')
var util = require('./util')
var widgets = require('./widgets')
var ErrorList = require('./ErrorList')

var BooleanField = fields.BooleanField
var HiddenInput = widgets.HiddenInput
var IntegerField = fields.IntegerField
var ValidationError = validators.ValidationError

function noop() {}

// Name associated with clean() validation
var CLEAN_VALIDATION = 'clean'

// Special field names
var DELETION_FIELD_NAME = 'DELETE'
var INITIAL_FORM_COUNT = 'INITIAL_FORMS'
var MAX_NUM_FORM_COUNT = 'MAX_NUM_FORMS'
var MIN_NUM_FORM_COUNT = 'MIN_NUM_FORMS'
var ORDERING_FIELD_NAME = 'ORDER'
var TOTAL_FORM_COUNT = 'TOTAL_FORMS'

// Default minimum number of forms in a formset
var DEFAULT_MIN_NUM = 0

// Default maximum number of forms in a formset, to prevent memory exhaustion
var DEFAULT_MAX_NUM = 1000

/**
 * ManagementForm is used to keep track of how many form instances are displayed
 * on the page. If adding new forms via JavaScript, you should increment the
 * count field of this form as well.
 * @constructor
 */
var ManagementForm = (function() {
  var fields = {}
  fields[TOTAL_FORM_COUNT] = IntegerField({widget: HiddenInput})
  fields[INITIAL_FORM_COUNT] = IntegerField({widget: HiddenInput})
  // MIN_NUM_FORM_COUNT and MAX_NUM_FORM_COUNT are output with the rest of
  // the management form, but only for the convenience of client-side
  // code. The POST value of them returned from the client is not checked.
  fields[MIN_NUM_FORM_COUNT] = IntegerField({required: false, widget: HiddenInput})
  fields[MAX_NUM_FORM_COUNT] = IntegerField({required: false, widget: HiddenInput})
  return forms.Form.extend(fields)
})()

/**
 * A collection of instances of the same Form.
 * @constructor
 * @param {Object=} kwargs
 */
var BaseFormSet = Concur.extend({
  constructor: function BaseFormSet(kwargs) {
    // TODO Perform PropType checks on kwargs in development mode
    kwargs = object.extend({
      data: null, files: null, autoId: 'id_{name}', prefix: null,
      initial: null, errorConstructor: ErrorList, managementFormCssClass: null,
      validation: null, controlled: false, onChange: null
    }, kwargs)
    this.isInitialRender = (kwargs.data === null && kwargs.files === null)
    this.prefix = kwargs.prefix || this.getDefaultPrefix()
    this.autoId = kwargs.autoId
    this.data = kwargs.data || {}
    this.files = kwargs.files || {}
    this.initial = kwargs.initial
    this.errorConstructor = kwargs.errorConstructor
    this.managementFormCssClass = kwargs.managementFormCssClass
    this.validation = kwargs.validation
    this.controlled = kwargs.controlled
    this.onChange = kwargs.onChange

    this._forms = null
    this._errors = null
    this._nonFormErrors = null

    // Lookup for pending validation
    this._pendingValidation = {}
    // Cancellable callbacks for pending async validation
    this._pendingAsyncValidation = {}
    // Lookup for pending validation which formset cleaning depends on
    this._cleanFormsetAfter = {}
    // Callback to be run the next time validation finishes
    this._onValidate = null
  }
})

/**
 * Calls the onChange function if it's been provided. This method will be called
 * every time the formset makes a change to its state which requires redisplay.
 */
BaseFormSet.prototype._stateChanged = function() {
  if (typeof this.onChange == 'function') {
    this.onChange()
  }
}

// ============================================================== Validation ===

/**
 * Forces the formset to revalidate from scratch. If a <form> is given, data
 * from it will be set on this formset's forms first. Otherwise, validation will
 * be done with current input data.
 * @param {(ReactElement|HTMLFormElement)=} form the <form> containing this
 *   formset's rendered widgets - this can be a React <form> component or a real
 *   <form> DOM node.
 * @param {function(err, isValid, cleanedData)=} cb callback for asynchronous
 *   validation.
 * @return {boolean|undefined} true if the form only has synchronous validation
 *   and is valid.
 * @throws if the formset or its form has asynchronous validation and a callback
 *   is not provided.
 */
BaseFormSet.prototype.validate = function(form, cb) {
  this._cancelPendingOperations()
  if (is.Function(form)) {
    cb = form
    form = null
  }
  if (form) {
    if (typeof form.getDOMNode == 'function') {
      form = form.getDOMNode()
    }
    this.setData(util.formData(form), {
      validate: false
    , _triggerStateChange: false
    })
  }
  return (this.isAsync() ? this._validateAsync(cb) : this._validateSync())
}

BaseFormSet.prototype._validateAsync = function(cb) {
  if (!is.Function(cb)) {
    throw new Error(
      'You must provide a callback to validate() when a formset or its form ' +
      'has asynchronous validation.'
    )
  }
  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  this._onValidate = cb
  this.fullClean()
  // Update state to display async progress indicators
  this._stateChanged()
}

BaseFormSet.prototype._validateSync = function() {
  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  this.fullClean()
  // Display changes to valid/invalid state
  this._stateChanged()
  return this.isValid()
}

/**
 * Cleans all of this.data and populates this._errors and this._nonFormErrors.
 */
BaseFormSet.prototype.fullClean = function() {
  this._errors = []
  this._nonFormErrors = new this.errorConstructor()

  if (this.isInitialRender) {
    return // Stop further processing
  }

  this._cleanForms()
}

/**
 * Validates and cleans every form in the formset.
 */
BaseFormSet.prototype._cleanForms = function() {
  var forms = this.forms()
  var formIndexLookup = object.lookup(Object.keys(forms))
  object.extend(this._pendingValidation, formIndexLookup)
  object.extend(this._cleanFormsetAfter, formIndexLookup)
  for (var i = 0, l = forms.length; i < l; i++) {
    this._cleanForm(i, forms[i])
  }
  // Make sure clean gets called even if the formset is empty
  if (forms.length === 0) {
    this._cleanFormsetAfter.empty = true
    this._formCleaned('empty', null)
  }
}

/**
 * Validates and cleans the form at the given index.
 * @param {number} index the index of the form in the formset.
 * @param {Form} form
 */
BaseFormSet.prototype._cleanForm = function(index, form) {
  if (!form.isAsync()) {
    form.validate()
    this._errors[index] = form.errors()
    this._formCleaned(index, null)
    return
  }

  // If the form is async and there's one pending, prevent its callback from
  // doing anything.
  if (typeof this._pendingAsyncValidation[index] != 'undefined') {
    object.pop(this._pendingAsyncValidation, index).cancel()
  }
  // Set up callback for async processing
  var callback = function(err) {
    if (!err) {
      this._errors[index] = form.errors()
    }
    this._formCleaned(index, err)
    this._stateChanged()
  }.bind(this)
  callback.onCancel = function() {
    form._cancelPendingOperations()
  }
  this._pendingAsyncValidation[index] = util.cancellable(callback)
  form.validate(callback)
}

/**
 * Callback for completion of form cleaning. Triggers formset cleaning or
 * signals the end of validation, as necessary.
 * @param {number|string} name the name associated with the cleaning that's completed.
 * @param {Error=} err an error caught while cleaning.
 */
BaseFormSet.prototype._formCleaned = function(name, err) {
  delete this._pendingValidation[name]
  if (this._pendingAsyncValidation[name]) {
    delete this._pendingAsyncValidation[name]
  }

  if (err) {
    if ("production" !== "development") {
      console.error('Error cleaning formset[' + name + ']:' + err.message)
    }
    // Stop tracking validation progress on error, and don't call clean()
    this._pendingValidation = {}
    this._cleanFormsetAfter = {}
    this._finishedValidation(err)
    return
  }

  // Run clean() if this this was the last field it was waiting for
  if (this._cleanFormsetAfter[name]) {
    delete this._cleanFormsetAfter[name]
    if (is.Empty(this._cleanFormsetAfter)) {
      this._cleanFormset()
      return
    }
  }

  // Signal the end of validation if this was the last field we were waiting for
  if (name == CLEAN_VALIDATION) {
    this._finishedValidation(null)
  }
}

/**
 * Hook for doing any extra formset-wide cleaning after Form.clean() has been
 * called on every form. Any ValidationError raised by this method will not be
 * associated with a particular form; it will be accessible via
 * formset.nonFormErrors()
 */
BaseFormSet.prototype.clean = noop

/**
 * Validates the number of forms and calls the clean() hook.
 */
BaseFormSet.prototype._cleanFormset = function() {
  var async = false
  var error = null
  try {
    var totalFormCount = this.totalFormCount()
    var deletedFormCount = this.deletedForms().length
    if ((this.validateMax && totalFormCount - deletedFormCount > this.maxNum) ||
        (!env.browser && this.managementForm().cleanedData[TOTAL_FORM_COUNT] > this.absoluteMax)) {
      throw ValidationError('Please submit ' + this.maxNum + ' or fewer forms.',
                            {code: 'tooManyForms'})
    }
    if (this.validateMin && totalFormCount - deletedFormCount < this.minNum) {
      throw ValidationError('Please submit ' + this.minNum + ' or more forms.',
                            {code: 'tooFewForms'})
    }
    // Give this.clean() a chance to do cross-form validation.
    if (this.clean !== noop) {
      async = this._runCustomClean(CLEAN_VALIDATION, this.clean)
    }
  }
  catch (e) {
    if (e instanceof ValidationError) {
      this._nonFormErrors = new this.errorConstructor(e.messages())
    }
    else {
      error = e
    }
  }

  if (!async) {
    this._formCleaned(CLEAN_VALIDATION, error)
  }
}

/**
 * Calls a custom cleaning method, expecting synchronous or asynchronous
 * behaviour, depending on its arity.
 * @param {string} name a name to associate with the cleaning method.
 * @param {function} customClean
 * @return {boolean} true if cleaning is running asynchronously, false if it just
 *   ran synchronously.
 */
BaseFormSet.prototype._runCustomClean = function(name, customClean) {
  // Check arity to see if we have a callback in the function signature
  if (customClean.length === 0) {
    // Synchronous processing only expected
    customClean.call(this)
    return false
  }

  // If custom validation is async and there's one pending, prevent its
  // callback from doing anything.
  if (typeof this._pendingAsyncValidation[name] != 'undefined') {
    object.pop(this._pendingAsyncValidation, name).cancel()
  }
  // Set up callback for async processing - arguments for addError()
  // should be passed via the callback as calling it directly prevents us
  // from completely ignoring the callback if validation fires again.
  var callback = function(err, validationError) {
    if (typeof validationError != 'undefined') {
      this.addError(validationError)
    }
    this._formCleaned(name, err)
    this._stateChanged()
  }.bind(this)

  // An explicit return value of false indicates that async processing is
  // being skipped (e.g. because sync checks in the method failed first)
  var returnValue = customClean.call(this, callback)
  if (returnValue !== false) {
    // Async processing is happening! Make the callback cancellable and
    // hook up any custom onCancel handling provided.
    if (returnValue && typeof returnValue.onCancel == 'function') {
      callback.onCancel = returnValue.onCancel
    }
    this._pendingAsyncValidation[name] = util.cancellable(callback)
    return true
  }
}

BaseFormSet.prototype._finishedValidation = function(err) {
  if (!this.isAsync()) {
    if (err) {
      throw err
    }
    // Synchronous formset validation results will be returned via the original
    // call which triggered validation.
    return
  }
  if (is.Function(this._onValidate)) {
    var callback = this._onValidate
    this._onValidate = null
    if (err) {
      return callback(err)
    }
    var isValid = this.isValid()
    callback(null, isValid, isValid ? this.cleanedData() : null)
  }
}

/**
 * Cancels any pending async validations.
 */
BaseFormSet.prototype._cancelPendingOperations = function() {
  Object.keys(this._pendingAsyncValidation).forEach(function(field) {
    object.pop(this._pendingAsyncValidation, field).cancel()
  }.bind(this))
}

/**
 * Returns a list of form.cleanedData objects for every form in this.forms().
 */
BaseFormSet.prototype.cleanedData = function() {
  var forms = this.initialForms()
  // Don't include empty or incomplete extra forms
  forms.push.apply(forms, this.extraForms().filter(function(form) {
    return form.hasChanged() && form.isComplete()
  }))
  return forms.map(function(form) { return form.cleanedData })
}


// ============================================================== Mutability ===

/**
 * Sets the formset's entire input data, also triggering validation by default.
 * @param {Object.<string,*>} data new input data for forms, which must be
 *   prefixed for uniqueness.
 * @param {Object.<string,boolean>} kwargs data setting options.
 * @return {boolean} if date setting options indicate the new data should be
 *   validated, true if the new data is valid.
 */
BaseFormSet.prototype.setData = function(data, kwargs) {
  kwargs = object.extend({validate: true, _triggerStateChange: true}, kwargs)

  this.data = data
  var formDataSettingOptions = {
    prefixed: true, validate: kwargs.validate, _triggerStateChange: false
  }
  this.forms().forEach(function(form) {
    form.setData(data, formDataSettingOptions)
  })

  if (this.isInitialRender) {
    this.isInitialRender = false
  }
  if (kwargs.validate) {
    this._errors = null
    // This call ultimately triggers a fullClean() because _errors is null
    var isValid = this.isValid()
  }
  else {
    // Prevent validation being triggered if errors() is accessed during render
    this._errors = []
    this._nonFormErrors = new this.errorConstructor()
  }

  if (kwargs._triggerStateChange) {
    this._stateChanged()
  }

  if (kwargs.validate) {
    return isValid
  }
}

/**
 * Alias to keep the FormSet data setting API the same as Form's.
 */
BaseFormSet.prototype.setFormData = BaseFormSet.prototype.setData

// =================================================================== Forms ===

/**
 * Returns the ManagementForm instance for this FormSet.
 * @browser the form is unbound and uses initial data from this FormSet.
 * @server the form is bound to submitted data.
 */
BaseFormSet.prototype.managementForm = function() {
  var form
  if (!env.browser && !this.isInitialRender) {
    form = new ManagementForm({data: this.data, autoId: this.autoId,
                               prefix: this.prefix})
    if (!form.isValid()) {
      throw ValidationError('ManagementForm data is missing or has been tampered with',
                            {code: 'missing_management_form'})
    }
  }
  else {
    var initial = {}
    initial[TOTAL_FORM_COUNT] = this.totalFormCount()
    initial[INITIAL_FORM_COUNT] = this.initialFormCount()
    initial[MIN_NUM_FORM_COUNT] = this.minNum
    initial[MAX_NUM_FORM_COUNT] = this.maxNum
    form = new ManagementForm({autoId: this.autoId,
                               prefix: this.prefix,
                               initial: initial})
  }
  if (this.managementFormCssClass !== null) {
    form.hiddenFieldRowCssClass = this.managementFormCssClass
  }
  return form
}

/**
 * Determines the number of form instances this formset contains, based on
 * either submitted management data or initial configuration, as appropriate.
 */
BaseFormSet.prototype.totalFormCount = function() {
  if (!env.browser && !this.isInitialRender) {
    // Return absoluteMax if it is lower than the actual total form count in
    // the data; this is DoS protection to prevent clients  from forcing the
    // server to instantiate arbitrary numbers of forms.
    return Math.min(this.managementForm().cleanedData[TOTAL_FORM_COUNT], this.absoluteMax)
  }
  else {
    var initialForms = this.initialFormCount()
    var totalForms = this.initialFormCount() + this.extra
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
  if (!env.browser && !this.isInitialRender) {
    return this.managementForm().cleanedData[INITIAL_FORM_COUNT]
  }
  else {
    // Use the length of the initial data if it's there, 0 otherwise.
    return (this.initial !== null && this.initial.length > 0
            ? this.initial.length
            : 0)
  }
}

/**
 * Instantiates forms when first accessed.
 */
BaseFormSet.prototype.forms = function() {
  if (this._forms !== null) { return this._forms }
  var forms = []
  var totalFormCount = this.totalFormCount()
  for (var i = 0; i < totalFormCount; i++) {
    forms.push(this._constructForm(i))
  }
  this._forms = forms
  return forms
}

/**
 * Adds another form and increments extra.
 */
BaseFormSet.prototype.addAnother = function() {
  var currentFormCount = this.totalFormCount()
  this.extra++
  if (this._forms !== null) {
    this._forms[currentFormCount] = this._constructForm(currentFormCount)
  }
 this._stateChanged()
}

// Assumption - the UI will only let the user remove extra forms
BaseFormSet.prototype.removeForm = function(index) {
  if (this.extra === 0) {
    throw new Error("Can't remove a form when there are no extra forms")
  }
  this.extra--
  if (this._forms !== null) {
    this._forms.splice(index, 1)
  }
  if (this._errors !== null) {
    this._errors.splice(index, 1)
  }
 this._stateChanged()
}

/**
 * Instantiates and returns the ith form instance in the formset.
 */
BaseFormSet.prototype._constructForm = function(i) {
  var defaults = {
    autoId: this.autoId
  , prefix: this.addPrefix(i)
  , errorConstructor: this.errorConstructor
  , validation: this.validation
  , controlled: this.controlled
  , onChange: this.onChange
  }
  if (!this.isInitialRender) {
    defaults.data = this.data
    defaults.files = this.files
  }
  if (this.initial !== null && this.initial.length > 0) {
    if (typeof this.initial[i] != 'undefined') {
      defaults.initial = this.initial[i]
    }
  }
  // Allow extra forms to be empty
  if (i >= this.initialFormCount()) {
    defaults.emptyPermitted = true
  }

  var form = new this.form(defaults)
  this.addFields(form, i)
  return form
}

/**
 * Returns a list of all the initial forms in this formset.
 */
BaseFormSet.prototype.initialForms = function() {
  return this.forms().slice(0, this.initialFormCount())
}

/**
 * Returns a list of all the extra forms in this formset.
 */
BaseFormSet.prototype.extraForms = function() {
  return this.forms().slice(this.initialFormCount())
}

BaseFormSet.prototype.emptyForm = function() {
  var kwargs = {
    autoId: this.autoId,
    prefix: this.addPrefix('__prefix__'),
    emptyPermitted: true
  }
  var form = new this.form(kwargs)
  this.addFields(form, null)
  return form
}

/**
 * Returns a list of forms that have been marked for deletion.
 */
BaseFormSet.prototype.deletedForms = function() {
  if (!this.isValid() || !this.canDelete) { return [] }

  var forms = this.forms()

  // Construct _deletedFormIndexes, which is just a list of form indexes
  // that have had their deletion widget set to true.
  if (typeof this._deletedFormIndexes == 'undefined') {
    this._deletedFormIndexes = []
    for (var i = 0, l = forms.length; i < l; i++) {
      var form = forms[i]
      // If this is an extra form and hasn't changed, ignore it
      if (i >= this.initialFormCount() && !form.hasChanged()) {
        continue
      }
      if (this._shouldDeleteForm(form)) {
        this._deletedFormIndexes.push(i)
      }
    }
  }

  return this._deletedFormIndexes.map(function(i) { return forms[i] })
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

  var forms = this.forms()

  // Construct _ordering, which is a list of [form index, orderFieldValue]
  // pairs. After constructing this list, we'll sort it by orderFieldValue
  // so we have a way to get to the form indexes in the order specified by
  // the form data.
  if (typeof this._ordering == 'undefined') {
    this._ordering = []
    for (var i = 0, l = forms.length; i < l; i++) {
      var form = forms[i]
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

  return this._ordering.map(function(ordering) { return forms[ordering[0]]})
}

/**
 * A hook for adding extra fields on to each form instance.
 * @param {Form} form the form fields are to be added to.
 * @param {Number} index the index of the given form in the formset.
 */
BaseFormSet.prototype.addFields = function(form, index) {
  if (this.canOrder) {
    // Only pre-fill the ordering field for initial forms
    if (index != null && index < this.initialFormCount()) {
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
 * Returns whether or not the form was marked for deletion.
 */
BaseFormSet.prototype._shouldDeleteForm = function(form) {
  return object.get(form.cleanedData, DELETION_FIELD_NAME, false)
}

// ================================================================== Errors ===

BaseFormSet.prototype.addError = function(error) {
  if (!(error instanceof ValidationError)) {
    // Normalise to ValidationError and let its constructor do the hard work of
    // making sense of the input.
    error = ValidationError(error)
  }

  this._nonFormErrors.extend(error.errorList)
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

/**
 * Returns an ErrorList of errors that aren't associated with a particular
 * form -- i.e., from formset.clean(). Returns an empty ErrorList if there are
 * none.
 */
BaseFormSet.prototype.nonFormErrors = function() {
  if (this._nonFormErrors === null) {
    this.fullClean()
  }
  return this._nonFormErrors
}

/**
 * Returns the number of errors across all forms in the formset.
 */
BaseFormSet.prototype.totalErrorCount = function() {
  return (this.nonFormErrors().length() +
          this.errors().reduce(function(sum, formErrors) {
            return sum + formErrors.length()
          }, 0))
}

// ================================================================== Status ===

/**
 * Returns true if any form differs from initial.
 */
BaseFormSet.prototype.hasChanged = function() {
  var forms = this.forms()
  for (var i = 0, l = forms.length; i < l; i++) {
    if (forms[i].hasChanged()) {
      return true
    }
  }
  return false
}

/**
 * @return {boolean} true if the formset needs a callback argument for final
 *   validation.
 */
BaseFormSet.prototype.isAsync = function() {
  return (this.clean.length == 1 || forms.isFormAsync(this.form))
}

/**
 * @return {boolean} true if the formset needs to be multipart-encoded, i.e. it
 * has a FileInput. Otherwise, false.
 */
BaseFormSet.prototype.isMultipart = function() {
  return (this.forms().length > 0 && this.forms()[0].isMultipart())
}

/**
 * @return {boolean} true if the formset is waiting for async validation to
 *   complete.
 */
BaseFormSet.prototype.isPending = function() {
  return !is.Empty(this._pendingAsyncValidation)
}

/**
 * Returns true if every form in this.forms() is valid and there are no non-form
 * errors.
 */
BaseFormSet.prototype.isValid = function() {
  if (this.isInitialRender) {
    return false
  }
  // Triggers a full clean
  var errors = this.errors()
  var forms = this.forms()
  for (var i = 0, l = errors.length; i < l ; i++) {
    if (errors[i].isPopulated()) {
      if (this.canDelete && this._shouldDeleteForm(forms[i])) {
        // This form is going to be deleted so any of its errors should
        // not cause the entire formset to be invalid.
        continue
      }
      return false
    }
  }
  return !this.nonFormErrors().isPopulated()
}

/**
 * @return {boolean} true if the formset is waiting for async validation of its
 *   clean() method to complete.
 */
BaseFormSet.prototype.nonFormPending = function() {
  return typeof this._pendingAsyncValidation[CLEAN_VALIDATION] != 'undefined'
}

// ================================================================ Prefixes ===

/**
 * Returns the formset prefix with the form index appended.
 * @param {Number} index the index of a form in the formset.
 */
BaseFormSet.prototype.addPrefix = function(index) {
  return this.prefix + '-' + index
}

BaseFormSet.prototype.getDefaultPrefix = function() {
  return 'form'
}

// ======================================================= Default Rendering ===

/**
 * Default render method, which just calls asTable().
 * @return {Array.<ReactElement>}
 */
BaseFormSet.prototype.render = function() {
  return this.asTable()
}

/**
 * Renders the formset as <tr>s - excluding the <table>.
 * @return {Array.<ReactElement>}
 */
BaseFormSet.prototype.asTable = function() {
  // XXX: there is no semantic division between forms here, there probably
  // should be. It might make sense to render each form as a table row with
  // each field as a td.
  var rows = this.managementForm().asTable()
  this.forms().forEach(function(form) { rows = rows.concat(form.asTable()) })
  if (this.nonFormPending()) {
    rows.push(React.createElement('tr', {key: '__pending__'}
    , React.createElement('td', {colSpan: 2}
      , React.createElement('progress', null, '...')
      )
    ))
  }
  return rows
}

/**
 * Returns the formset as <div>s.
 * @return {Array.<ReactElement>}
 */
BaseFormSet.prototype.asDiv = function() {
  var rows = this.managementForm().asDiv()
  this.forms().forEach(function(form) { rows = rows.concat(form.asDiv()) })
  if (this.nonFormPending()) {
    rows.push(React.createElement('div', {key: '__pending__'}
    , React.createElement('progress', null, '...')
    ))
  }
  return rows
}

var formsetProps = {
  autoId: util.autoIdChecker
, controlled: React.PropTypes.bool
, data: React.PropTypes.object
, errorConstructor: React.PropTypes.func
, files: React.PropTypes.object
, initial: React.PropTypes.object
, onChange: React.PropTypes.func
, prefix: React.PropTypes.string
, validation: React.PropTypes.oneOfType([
    React.PropTypes.string
  , React.PropTypes.object
  ])
}

var formsetFactoryProps = {
  canDelete: React.PropTypes.bool
, canOrder: React.PropTypes.bool
, extra: React.PropTypes.number
, formset: React.PropTypes.func
, maxNum: React.PropTypes.number
, minNum: React.PropTypes.number
, validateMax: React.PropTypes.bool
, validateMin: React.PropTypes.bool
}

/**
 * Renders a Formset. A formset instance or constructor can be given. If a
 * constructor is given, an instance will be created when the component is
 * mounted, and any additional props will be passed to the constructor as
 * options.
 */
var RenderFormSet = React.createClass({
  displayName: 'RenderFormSet',
  propTypes: object.extend({}, formsetFactoryProps, formsetProps, {
    className: React.PropTypes.string         // Class for the component wrapping all forms
  , component: React.PropTypes.any            // Component to wrap all forms
  , formComponent: React.PropTypes.any        // Component to wrap each form
  , form: React.PropTypes.func                // Form constructor
  , formset: React.PropTypes.oneOfType([      // Formset instance or constructor
      React.PropTypes.func,
      React.PropTypes.instanceOf(BaseFormSet)
    ])
  , row: React.PropTypes.any                  // Component to render form rows
  , rowComponent: React.PropTypes.any         // Component to wrap each form row
  , useManagementForm: React.PropTypes.bool   // Should ManagementForm hidden fields be rendered?
  , __all__: function(props) {
      if (!props.form && !props.formset) {
        return new Error(
          'Invalid props supplied to `RenderFormSet`, either `form` or ' +
          '`formset` must be specified.'
        )
      }
    }
  }),

  getDefaultProps: function() {
    return {
      component: 'div'
    , formComponent: 'div'
    , row: forms.FormRow
    , rowComponent: 'div'
    , useManagementForm: false
    }
  },

  componentWillMount: function() {
    var formset = this.props.formset
    // Create a new FormSet constructor if a Form constructor was given
    if (this.props.form) {
      formset = formsetFactory(this.props.form,
                               util.getProps(this.props, Object.keys(formsetFactoryProps)))
    }
    if (formset instanceof BaseFormSet) {
      this.formset = formset
    }
    else {
      this.formset = new formset(object.extend({
        onChange: this.forceUpdate.bind(this)
      }, util.getProps(this.props, Object.keys(formsetProps))))
    }
  },

  getFormset: function() {
    return this.formset
  },

  render: function() {
    var formset = this.formset
    var props = this.props
    var attrs = {}
    if (this.props.className) {
      attrs.className = props.className
    }
    var topErrors = formset.nonFormErrors()

    return React.createElement(props.component, attrs,
      topErrors.isPopulated() && React.createElement(props.row, {
        className: formset.errorCssClass
      , content: topErrors.render()
      , key: formset.addPrefix('__all__')
      , rowComponent: props.rowComponent
      }),
      formset.forms().map(function(form) {
        return React.createElement(forms.RenderForm, {
          form: form
        , formComponent: props.formComponent
        , row: props.row
        , rowComponent: props.rowComponent
        })
      }),
      formset.nonFormPending() && React.createElement(props.row, {
        className: formset.pendingRowCssClass
      , content: React.createElement('progress', null, 'Validating...')
      , key: formset.addPrefix('__pending__')
      , rowComponent: props.rowComponent
      }),
      props.useManagementForm && React.createElement(forms.RenderForm, {
        form: formset.managementForm()
      , formComponent: props.formComponent
      , row: props.row
      , rowComponent: props.rowComponent
      })
    )
  }
})

/**
 * Creates a FormSet constructor for the given Form constructor.
 * @param {Form} form
 * @param {Object=} kwargs
 */
function formsetFactory(form, kwargs) {
  // TODO Perform PropType checks on kwargs in development mode
  kwargs = object.extend({
    formset: BaseFormSet, extra: 1, canOrder: false, canDelete: false,
    maxNum: DEFAULT_MAX_NUM, validateMax: false,
    minNum: DEFAULT_MIN_NUM, validateMin: false
  }, kwargs)

  // Remove special properties from kwargs, as it will subsequently be used to
  // add properties to the new formset's prototype.
  var formset = object.pop(kwargs, 'formset')
  var extra = object.pop(kwargs, 'extra')
  var canOrder = object.pop(kwargs, 'canOrder')
  var canDelete = object.pop(kwargs, 'canDelete')
  var maxNum = object.pop(kwargs, 'maxNum')
  var validateMax = object.pop(kwargs, 'validateMax')
  var minNum = object.pop(kwargs, 'minNum')
  var validateMin = object.pop(kwargs, 'validateMin')

  // Hard limit on forms instantiated, to prevent memory-exhaustion attacks
  // limit is simply maxNum + DEFAULT_MAX_NUM (which is 2 * DEFAULT_MAX_NUM
  // if maxNum is not provided in the first place)
  var absoluteMax = maxNum + DEFAULT_MAX_NUM
  extra += minNum

  kwargs.constructor = function(kwargs) {
    this.form = form
    this.extra = extra
    this.canOrder = canOrder
    this.canDelete = canDelete
    this.maxNum = maxNum
    this.validateMax = validateMax
    this.minNum = minNum
    this.validateMin = validateMin
    this.absoluteMax = absoluteMax
    formset.call(this, kwargs)
  }

  return formset.extend(kwargs)
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
  allValid: allValid
, BaseFormSet: BaseFormSet
, DEFAULT_MAX_NUM: DEFAULT_MAX_NUM
, formsetFactory: formsetFactory
, RenderFormSet: RenderFormSet
}

},{"./ErrorList":3,"./env":5,"./fields":6,"./forms":8,"./util":11,"./widgets":12,"Concur":13,"isomorph/is":17,"isomorph/object":18,"validators":22}],10:[function(require,module,exports){
'use strict';

var object = require('isomorph/object')
var time = require('isomorph/time')

var defaultLocale = {lang: 'en'}

var localeCache = {
  en: {
    DATE_INPUT_FORMATS: [
      '%Y-%m-%d'                        // '2006-10-25'
    , '%m/%d/%Y', '%m/%d/%y'            // '10/25/2006', '10/25/06'
    , '%b %d %Y', '%b %d, %Y'           // 'Oct 25 2006', 'Oct 25, 2006'
    , '%d %b %Y', '%d %b, %Y'           // '25 Oct 2006', '25 Oct, 2006'
    , '%B %d %Y', '%B %d, %Y'           // 'October 25 2006', 'October 25, 2006'
    , '%d %B %Y', '%d %B, %Y'           // '25 October 2006', '25 October, 2006'
    ]
  , DATETIME_INPUT_FORMATS: [
      '%Y-%m-%d %H:%M:%S'               // '2006-10-25 14:30:59'
    , '%Y-%m-%d %H:%M'                  // '2006-10-25 14:30'
    , '%Y-%m-%d'                        // '2006-10-25'
    , '%m/%d/%Y %H:%M:%S'               // '10/25/2006 14:30:59'
    , '%m/%d/%Y %H:%M'                  // '10/25/2006 14:30'
    , '%m/%d/%Y'                        // '10/25/2006'
    , '%m/%d/%y %H:%M:%S'               // '10/25/06 14:30:59'
    , '%m/%d/%y %H:%M'                  // '10/25/06 14:30'
    , '%m/%d/%y'                        // '10/25/06'
    ]
  }
, en_GB: {
    DATE_INPUT_FORMATS: [
      '%d/%m/%Y', '%d/%m/%y'            // '25/10/2006', '25/10/06'
    , '%b %d %Y', '%b %d, %Y'           // 'Oct 25 2006', 'Oct 25, 2006'
    , '%d %b %Y', '%d %b, %Y'           // '25 Oct 2006', '25 Oct, 2006'
    , '%B %d %Y', '%B %d, %Y'           // 'October 25 2006', 'October 25, 2006'
    , '%d %B %Y', '%d %B, %Y'           // '25 October 2006', '25 October, 2006'
    ]
  , DATETIME_INPUT_FORMATS: [
      '%Y-%m-%d %H:%M:%S'               // '2006-10-25 14:30:59'
    , '%Y-%m-%d %H:%M'                  // '2006-10-25 14:30'
    , '%Y-%m-%d'                        // '2006-10-25'
    , '%d/%m/%Y %H:%M:%S'               // '25/10/2006 14:30:59'
    , '%d/%m/%Y %H:%M'                  // '25/10/2006 14:30'
    , '%d/%m/%Y'                        // '25/10/2006'
    , '%d/%m/%y %H:%M:%S'               // '25/10/06 14:30:59'
    , '%d/%m/%y %H:%M'                  // '25/10/06 14:30'
    , '%d/%m/%y'                        // '25/10/06'
    ]
  }
}

/**
 * Adds a locale object to our own cache (for formats) and isomorph.time's cache
 * (for time parsing/formatting).
 * @param {string} lang
 * @param {string=} locale
 */
function addLocale(lang, locale) {
  localeCache[lang] = locale
  time.locales[lang] = locale
}

/**
 * Gets the most applicable locale, falling back to the language code if
 * necessary and to the default locale if no matching locale was found.
 * @param {string=} lang
 */
function getLocale(lang) {
  if (lang) {
    if (object.hasOwn(localeCache, lang)) {
      return localeCache[lang]
    }
    if (lang.indexOf('_') != -1) {
      lang = lang.split('_')[0]
      if (object.hasOwn(localeCache, lang)) {
        return localeCache[lang]
      }
    }
  }
  return localeCache[defaultLocale.lang]
}

/**
 * Gets all applicable locales, with the most specific first, falling back to
 * the default locale if necessary.
 * @param {string=} lang
 * @return {Array.<Object>}
 */
function getLocales(lang) {
  if (lang) {
    var locales = []
    if (object.hasOwn(localeCache, lang)) {
       locales.push(localeCache[lang])
    }
    if (lang.indexOf('_') != -1) {
      lang = lang.split('_')[0]
      if (object.hasOwn(localeCache, lang)) {
        locales.push(localeCache[lang])
      }
    }
    if (locales.length) {
      return locales
    }
  }
  return [localeCache[defaultLocale.lang]]
}

/**
 * Sets the language code for the default locale.
 * @param {string} lang
 */
function setDefaultLocale(lang) {
  if (!object.hasOwn(localeCache, lang)) {
    throw new Error('Unknown locale: ' + lang)
  }
  defaultLocale.lang = lang
}

/**
 * @return {string} the language code for the default locale.
 */
function getDefaultLocale() {
  return defaultLocale.lang
}

module.exports = {
  addLocale: addLocale
, getDefaultLocale: getDefaultLocale
, getLocale: getLocale
, getLocales: getLocales
, setDefaultLocale: setDefaultLocale
}

},{"isomorph/object":18,"isomorph/time":19}],11:[function(require,module,exports){
'use strict';

var is = require('isomorph/is')
var object = require('isomorph/object')

/**
 * Replaces String {placeholders} with properties of a given object, but
 * interpolates into and returns an Array instead of a String.
 * By default, any resulting empty strings are stripped out of the Array. To
 * disable this, pass an options object with a 'strip' property which is false.
 */
function formatToArray(str, obj, options) {
  var parts = str.split(/\{(\w+)\}/g)
  for (var i = 1, l = parts.length; i < l; i += 2) {
    parts[i] = (object.hasOwn(obj, parts[i])
                ? obj[parts[i]]
                : '{' + parts[i] + '}')
  }
  if (!options || (options && options.strip !== false)) {
    parts = parts.filter(function(p) { return p !== ''})
  }
  return parts
}

/**
 * Get named properties from an object.
 * @param src {Object}
 * @param props {Array.<string>}
 * @return {Object}
 */
function getProps(src, props) {
  var result = {}
  for (var i = 0, l = props.length; i < l ; i++) {
    var prop = props[i]
    if (object.hasOwn(src, prop)) {
      result[prop] = src[prop]
    }
  }
  return result
}

/**
 * Get a named property from an object, calling it and returning its result if
 * it's a function.
 */
function maybeCall(obj, prop) {
  var value = obj[prop]
  if (is.Function(value)) {
    value = value.call(obj)
  }
  return value
}

/**
 * Creates a list of choice pairs from a list of objects using the given named
 * properties for the value and label.
 */
function makeChoices(list, valueProp, labelProp) {
  return list.map(function(item) {
    return [maybeCall(item, valueProp), maybeCall(item, labelProp)]
  })
}

/**
 * Validates choice input and normalises lazy, non-Array choices to be
 * [value, label] pairs
 * @return {Array} a normalised version of the given choices.
 * @throws if an Array with length != 2 was found where a choice pair was expected.
 */
function normaliseChoices(choices) {
  if (!choices.length) { return choices }

  var normalisedChoices = []
  for (var i = 0, l = choices.length, choice; i < l; i++) {
    choice = choices[i]
    if (!is.Array(choice)) {
      // TODO In the development build, emit a warning about a choice being
      //      automatically converted from 'blah' to ['blah', 'blah'] in case it
      //      wasn't intentional
      choice = [choice, choice]
    }
    if (choice.length != 2) {
      throw new Error('Choices in a choice list must contain exactly 2 values, ' +
                      'but got ' + JSON.stringify(choice))
    }
    if (is.Array(choice[1])) {
      var normalisedOptgroupChoices = []
      // This is an optgroup, so look inside the group for options
      var optgroupChoices = choice[1]
      for (var j = 0, m = optgroupChoices.length, optgroupChoice; j < m; j++) {
        optgroupChoice = optgroupChoices[j]
        if (!is.Array(optgroupChoice)) {
          optgroupChoice = [optgroupChoice, optgroupChoice]
        }
        if (optgroupChoice.length != 2) {
          throw new Error('Choices in an optgroup choice list must contain ' +
                          'exactly 2 values, but got ' +
                          JSON.stringify(optgroupChoice))
        }
        normalisedOptgroupChoices.push(optgroupChoice)
      }
      normalisedChoices.push([choice[0], normalisedOptgroupChoices])
    }
    else {
      normalisedChoices.push(choice)
    }
  }
  return normalisedChoices
}

/**
 * @param {Array.<string>} events
 */
function normaliseValidationEvents(events) {
  events = events.map(function(event) {
    if (event.indexOf('on') === 0) { return event }
    return 'on' + event.charAt(0).toUpperCase() + event.substr(1)
  })
  var onChangeIndex = events.indexOf('onChange')
  if (onChangeIndex != -1) {
    events.splice(onChangeIndex, 1)
  }
  return {events: events, onChange: (onChangeIndex != -1)}
}

/**
 * @param {string} events
 */
function normaliseValidationString(events) {
  return normaliseValidationEvents(strip(events).split(/ +/g))
}

/**
 * @param {(string|Object)} validation
 */
function normaliseValidation(validation) {
  if (!validation || validation === 'manual') {
    return validation
  }
  else if (validation === 'auto') {
    return {events: ['onBlur'], onChange: true, onChangeDelay: 369}
  }
  else if (is.String(validation)) {
    return normaliseValidationString(validation)
  }
  else if (is.Object(validation)) {
    var normalised
    if (is.String(validation.on)) {
      normalised = normaliseValidationString(validation.on)
    }
    else if (is.Array(validation.on)) {
      normalised = normaliseValidationEvents(validation.on)
    }
    else {
      throw new Error("Validation config Objects must have an 'on' String or Array")
    }
    normalised.onChangeDelay = object.get(validation, 'onChangeDelay', validation.delay)
    return normalised
  }
  throw new Error('Unexpected validation config: ' + validation)
}

/**
 * Converts 'firstName' and 'first_name' to 'First name', and
 * 'SHOUTING_LIKE_THIS' to 'SHOUTING LIKE THIS'.
 */
var prettyName = (function() {
  var capsRE = /([A-Z]+)/g
  var splitRE = /[ _]+/
  var allCapsRE = /^[A-Z][A-Z0-9]+$/

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
      if (i === 0) {
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
 * @param {HTMLFormElement|ReactElement} form a form element.
 * @return {Object.<string,(string|Array.<string>)>} an object containing the
 *   submittable value(s) held in each of the form's elements.
 */
function formData(form) {
  if (!form) {
    throw new Error('formData was given form=' + form)
  }
  if (typeof form.getDOMNode == 'function') {
    form = form.getDOMNode()
  }
  var data = {}

  for (var i = 0, l = form.elements.length; i < l; i++) {
    var element = form.elements[i]
    var value = getFormElementValue(element)
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
 * @param {HTMLFormElement|ReactElement} form a form element.
 * @param {string} field a field name.
 * @return {(string|Array.<string>)} the named field's submittable value(s),
 */
function fieldData(form, field) {
  /* global NodeList */
  if (!form) {
    throw new Error('fieldData was given form=' + form)
  }
  if (form && typeof form.getDOMNode == 'function') {
    form = form.getDOMNode()
  }
  var data = null
  var element = form.elements[field]
  // Check if we've got a NodeList
  if (element instanceof NodeList) {
    for (var i = 0, l = element.length; i < l; i++) {
      var value = getFormElementValue(element[i])
      if (value !== null) {
        if (data !== null) {
          if (is.Array(data)) {
            data= data.concat(value)
          }
          else {
            data = [data, value]
          }
        }
        else {
          data = value
        }
      }
    }
  }
  else {
    data = getFormElementValue(element)
  }

  return data
}

/**
 * Lookup for <input>s whose value can be accessed with .value.
 */
var textInputTypes = object.lookup([
  'hidden', 'password', 'text', 'email', 'url', 'number', 'file', 'textarea'
])

/**
 * Lookup for <inputs> which have a .checked property.
 */
var checkedInputTypes = object.lookup(['checkbox', 'radio'])

/**
 * @param {HTMLElement|HTMLSelectElement} element a form element.
 * @return {(string|Array.<string>)} the element's submittable value(s),
 */
function getFormElementValue(element) {
  var value = null
  var type = element.type

  if (textInputTypes[type] || checkedInputTypes[type] && element.checked) {
    value = element.value
  }
  else if (type == 'select-one') {
    if (element.options.length) {
      value = element.options[element.selectedIndex].value
    }
  }
  else if (type == 'select-multiple') {
    value = []
    for (var i = 0, l = element.options.length; i < l; i++) {
      if (element.options[i].selected) {
        value.push(element.options[i].value)
      }
    }
  }

  return value
}

/**
 * Coerces to string and strips leading and trailing spaces.
 */
var strip = function() {
  var stripRE =/(^\s+|\s+$)/g
  return function strip(s) {
    return (''+s).replace(stripRE, '')
  }
}()

/**
 * From Underscore.js 1.5.2
 * http://underscorejs.org
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * Modified to give the returned function:
 * - a .cancel() method which prevents the debounced function being called.
 * - a .trigger() method which calls the debounced function immediately.
 */
function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result
  var debounced = function() {
    context = this
    args = arguments
    timestamp = new Date()
    var later = function() {
      var last = (new Date()) - timestamp
      if (last < wait) {
        timeout = setTimeout(later, wait - last)
      } else {
        timeout = null
        if (!immediate) { result = func.apply(context, args) }
      }
    };
    var callNow = immediate && !timeout
    if (!timeout) {
      timeout = setTimeout(later, wait)
    }
    if (callNow) { result = func.apply(context, args) }
    return result
  }

  // Clear any pending timeout
  debounced.cancel = function() {
    if (timeout) {
      clearTimeout(timeout)
    }
  }

  // Clear any pending timeout and execute the function immediately
  debounced.trigger = function() {
    debounced.cancel()
    return func.apply(context, args)
  }

  return debounced
}

/**
 * Returns a function with a .cancel() function which can be used to prevent the
 * given function from being called. If the given function has an onCancel(),
 * it will be called when it's being cancelled.
 *
 * Use case: triggering an asynchronous function with new data while an existing
 * function for the same task but with old data is still pending a callback, so
 * the callback only gets called for the last one to run.
 */
function cancellable(func) {
  var cancelled = false

  var cancellabled = function() {
    if (!cancelled) {
      func.apply(null, arguments)
    }
  }

  cancellabled.cancel = function() {
    cancelled = true
    if (is.Function(func.onCancel)) {
      func.onCancel()
    }
  }

  return cancellabled
}

/**
 * Extracts data from a <form> and validates it with a list of forms and/or
 * formsets.
 * @param form the <form> into which any given forms and formsets have been
 *   rendered - this can be a React <form> component or a real <form> DOM node.
 * @param {Array.<(Form|BaseFormSet)>} formsAndFormsets a list of forms and/or
 *   formsets to be used to validate the <form>'s input data.
 * @return {boolean} true if the <form>'s input data are valid according to all
 *   given forms and formsets.
 */
function validateAll(form, formsAndFormsets) {
  if (form && typeof form.getDOMNode == 'function') {
    form = form.getDOMNode()
  }
  var data = formData(form)
  var isValid = true
  for (var i = 0, l = formsAndFormsets.length; i < l; i++) {
    if (!formsAndFormsets[i].setFormData(data)) {
      isValid = false
    }
  }
  return isValid
}

var info = function() {}
var warning = function() {}

if ('production' !== "development") {
  info = function(message) {
    console.warn('[newforms] ' + message)
  }
  warning = function(message) {
    console.warn('[newforms] Warning: ' + message)
  }
}

function autoIdChecker(props, propName, componentName, location) {
  var autoId = props.autoId
  if (props.autoId && !(is.String(autoId) && autoId.indexOf('{name}') != -1)) {
    return new Error(
      'Invalid `autoId` ' + location + ' supplied to ' +
      '`' + componentName + '`. Must be falsy or a String containing a ' +
      '`{name}` placeholder'
    )
  }
}

module.exports = {
  autoIdChecker: autoIdChecker
, cancellable: cancellable
, debounce: debounce
, info: info
, fieldData: fieldData
, formatToArray: formatToArray
, formData: formData
, getProps: getProps
, makeChoices: makeChoices
, normaliseChoices: normaliseChoices
, normaliseValidation: normaliseValidation
, prettyName: prettyName
, strip: strip
, validateAll: validateAll
, warning: warning
}

},{"isomorph/is":17,"isomorph/object":18}],12:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var is = require('isomorph/is')
var object = require('isomorph/object')
var time = require('isomorph/time')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)

var env = require('./env')
var formats = require('./formats')
var locales = require('./locales')
var util = require('./util')

/**
 * Some widgets are made of multiple HTML elements -- namely, RadioSelect.
 * This represents the "inner" HTML element of a widget.
 * @constructor
 */
var SubWidget = Concur.extend({
  constructor: function SubWidget(parentWidget, name, value, kwargs) {
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
  constructor: function Widget(kwargs) {
    kwargs = object.extend({attrs: null}, kwargs)
    this.attrs = object.extend({}, kwargs.attrs)
  }
  /** Determines whether this corresponds to an <input type="hidden">. */
, isHidden: false
  /** Determines whether this widget needs a multipart-encoded form. */
, needsMultipartForm: false
  /** Determines whether this widget is for a required field. */
, isRequired: false
  /** Override for active validation config a particular widget needs to use. */
, validation: null
  /** Determines whether this widget's render logic always needs to use the initial value. */
, needsInitialValue: false
  /** Determines whether this widget's value can be set. */
, isValueSettable: true
})

/**
 * Yields all "subwidgets" of this widget. Used only by RadioSelect to
 * allow access to individual <input type="radio"> buttons.
 * Arguments are the same as for render().
 * @return {Array.<SubWidget>}
 */
Widget.prototype.subWidgets = function(name, value, kwargs) {
  return [SubWidget(this, name, value, kwargs)]
}

/**
 * Returns this Widget rendered as HTML.
 * The value given is not guaranteed to be valid input, so subclass
 * implementations should program defensively.
 * @abstract
 */
Widget.prototype.render = function(name, value, kwargs) {
  throw new Error('Constructors extending Widget must implement a render() method.')
}

/**
 * Helper function for building an HTML attributes object.
 */
Widget.prototype.buildAttrs = function(kwargAttrs, renderAttrs) {
  return object.extend({}, this.attrs, renderAttrs, kwargAttrs)
}

/**
 * Retrieves a value for this widget from the given data.
 * @param {Object} data form data.
 * @param {Object} files file data.
 * @param {string} name the field name to be used to retrieve data.
 * @return a value for this widget, or null if no value was provided.
 */
Widget.prototype.valueFromData = function(data, files, name) {
  return object.get(data, name, null)
}

/**
 * Determines the HTML id attribute of this Widget for use by a
 * <label>, given the id of the field.
 * This hook is necessary because some widgets have multiple HTML elements and,
 * thus, multiple ids. In that case, this method should return an ID value that
 * corresponds to the first id in the widget's tags.
 * @param {string} id a field id.
 * @return {string} the id which should be used by a <label> for this Widget.
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
  constructor: function Input(kwargs) {
    if (!(this instanceof Widget)) { return new Input(kwargs) }
    Widget.call(this, kwargs)
  }
  /** The type attribute of this input - subclasses must define it. */
, inputType: null
})

Input.prototype._formatValue = function(value) {
  return value
}

Input.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({attrs: null}, kwargs)
  if (value === null) {
    value = ''
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {type: this.inputType,
                                                  name: name})
  // Hidden inputs can be made controlled inputs by default, as the user
  // can't directly interact with them.
  var valueAttr = (kwargs.controlled || this.isHidden ? 'value' : 'defaultValue')
  if (!(valueAttr == 'defaultValue' && value === '')) {
    finalAttrs[valueAttr] = (value !== '' ? ''+this._formatValue(value) : value)
  }
  return React.createElement('input', finalAttrs)
}

/**
 * An HTML <input type="text"> widget.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var TextInput = Input.extend({
  constructor: function TextInput(kwargs) {
    if (!(this instanceof Widget)) { return new TextInput(kwargs) }
    kwargs = object.extend({attrs: null}, kwargs)
    if (kwargs.attrs != null) {
      this.inputType = object.pop(kwargs.attrs, 'type', this.inputType)
    }
    Input.call(this, kwargs)
  }
, inputType: 'text'
})

/**
 * An HTML <input type="number"> widget.
 * @constructor
 * @extends {TextInput}
 * @param {Object=} kwargs
 */
var NumberInput = TextInput.extend({
  constructor: function NumberInput(kwargs) {
    if (!(this instanceof Widget)) { return new NumberInput(kwargs) }
    TextInput.call(this, kwargs)
  }
, inputType: 'number'
})

/**
 * An HTML <input type="email"> widget.
 * @constructor
 * @extends {TextInput}
 * @param {Object=} kwargs
 */
var EmailInput = TextInput.extend({
  constructor: function EmailInput(kwargs) {
    if (!(this instanceof Widget)) { return new EmailInput(kwargs) }
    TextInput.call(this, kwargs)
  }
, inputType: 'email'
})

/**
 * An HTML <input type="url"> widget.
 * @constructor
 * @extends {TextInput}
 * @param {Object=} kwargs
 */
var URLInput = TextInput.extend({
  constructor: function URLInput(kwargs) {
    if (!(this instanceof Widget)) { return new URLInput(kwargs) }
    TextInput.call(this, kwargs)
  }
, inputType: 'url'
})

/**
 * An HTML <input type="password"> widget.
 * @constructor
 * @extends {TextInput}
 * @param {Object=} kwargs
 */
var PasswordInput = TextInput.extend({
  constructor: function PasswordInput(kwargs) {
    if (!(this instanceof Widget)) { return new PasswordInput(kwargs) }
    kwargs = object.extend({renderValue: false}, kwargs)
    TextInput.call(this, kwargs)
    this.renderValue = kwargs.renderValue
  }
, inputType: 'password'
})

PasswordInput.prototype.render = function(name, value, kwargs) {
  if (!env.browser && !this.renderValue) {
    value = ''
  }
  return TextInput.prototype.render.call(this, name, value, kwargs)
}

/**
 * An HTML <input type="hidden"> widget.
 * @constructor
 * @extends {Input}
 * @param {Object=} kwargs
 */
var HiddenInput = Input.extend({
  constructor: function HiddenInput(kwargs) {
    if (!(this instanceof Widget)) { return new HiddenInput(kwargs) }
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
  constructor: function MultipleHiddenInput(kwargs) {
    if (!(this instanceof Widget)) { return new MultipleHiddenInput(kwargs) }
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
  var id = object.get(finalAttrs, 'id', null)
  var key = object.get(finalAttrs, 'key', null)
  var inputs = []
  for (var i = 0, l = value.length; i < l; i++) {
    var inputAttrs = object.extend({}, finalAttrs, {value: value[i]})
    // Add numeric index suffixes to attributes which should be unique
    if (id) {
      inputAttrs.id = id + '_' + i
    }
    if (key) {
      inputAttrs.key = id + '_' + i
    }
    inputs.push(React.createElement('input', inputAttrs))
  }
  return React.createElement('div', null, inputs)
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
  constructor: function FileInput(kwargs) {
    if (!(this instanceof Widget)) { return new FileInput(kwargs) }
    Input.call(this, kwargs)
  }
, inputType: 'file'
, needsMultipartForm: true
, validation: {onChange: true}
, isValueSettable: false
})

FileInput.prototype.render = function(name, value, kwargs) {
  return Input.prototype.render.call(this, name, null, kwargs)
}

/**
 * File widgets take data from file wrappers on the server. On the client, they
 * take it from data so the presence of a .value can be validated when required.
 */
FileInput.prototype.valueFromData = function(data, files, name) {
  return object.get(env.browser ? data : files, name, null)
}

var FILE_INPUT_CONTRADICTION = {}

/**
 * @constructor
 * @extends {FileInput}
 * @param {Object=} kwargs
 */
var ClearableFileInput = FileInput.extend({
  needsInitialValue: true
, isValueSettable: false
, constructor: function ClearableFileInput(kwargs) {
    if (!(this instanceof Widget)) { return new ClearableFileInput(kwargs) }
    FileInput.call(this, kwargs)
  }
, initialText: 'Currently'
, inputText: 'Change'
, clearCheckboxLabel: 'Clear'
, templateWithInitial: function(params) {
    return util.formatToArray(
      '{initialText}: {initial} {clearTemplate}{br}{inputText}: {input}'
    , object.extend(params, {br: React.createElement('br', null)})
    )
  }
, templateWithClear: function(params) {
    return util.formatToArray(
      '{checkbox} {label}'
    , object.extend(params, {
        label: React.createElement('label', {htmlFor: params.checkboxId}, params.label)
      })
    )
  }
, urlMarkupTemplate: function(href, name) {
    return React.createElement('a', {href: href}, name)
  }
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
  kwargs = object.extend({attrs: {}}, kwargs)
  kwargs.attrs.key = 'input'
  var input = FileInput.prototype.render.call(this, name, value, kwargs)
  var initialValue = kwargs.initialValue
  if (!initialValue && value && typeof value.url != 'undefined') {
    initialValue = value
  }
  if (initialValue && typeof initialValue.url != 'undefined') {
    var clearTemplate
    if (!this.isRequired) {
      var clearCheckboxName = this.clearCheckboxName(name)
      var clearCheckboxId = this.clearCheckboxId(clearCheckboxName)
      clearTemplate = this.templateWithClear({
        checkbox: CheckboxInput().render(clearCheckboxName, false, {attrs: {'id': clearCheckboxId}})
      , checkboxId: clearCheckboxId
      , label: this.clearCheckboxLabel
      })
    }
    var contents = this.templateWithInitial({
      initialText: this.initialText
    , initial: this.urlMarkupTemplate(initialValue.url, ''+initialValue)
    , clearTemplate: clearTemplate
    , inputText: this.inputText
    , input: input
    })
    return React.createElement('span', null, contents)
  }
  else {
    return React.createElement('span', null, input)
  }
}

ClearableFileInput.prototype.valueFromData = function(data, files, name) {
  var upload = FileInput.prototype.valueFromData(data, files, name)
  if (!this.isRequired &&
      CheckboxInput.prototype.valueFromData.call(this, data, files,
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
 * An HTML <textarea> widget.
 * @param {Object} [kwargs] configuration options
 * @config {object} [attrs] HTML attributes for the rendered widget. Default
 *   rows and cols attributes will be used if not provided.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var Textarea = Widget.extend({
  constructor: function Textarea(kwargs) {
    if (!(this instanceof Widget)) { return new Textarea(kwargs) }
    // Ensure we have something in attrs
    kwargs = object.extend({attrs: null}, kwargs)
    // Provide default 'cols' and 'rows' attributes
    kwargs.attrs = object.extend({rows: '3', cols: '40'}, kwargs.attrs)
    Widget.call(this, kwargs)
  }
})

Textarea.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({}, kwargs)
  if (value === null) {
    value = ''
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {name: name})
  var valueAttr = (kwargs.controlled ? 'value' : 'defaultValue')
  finalAttrs[valueAttr] = value
  return React.createElement('textarea', finalAttrs)
}

/**
 * A <input type="text"> which, if given a Date object to display, formats it as
 * an appropriate date/time String.
 * @constructor
 * @extends {TextInput}
 * @param {Object=} kwargs
 */
var DateTimeBaseInput = TextInput.extend({
  formatType: ''
, constructor: function DateTimeBaseInput(kwargs) {
    kwargs = object.extend({format: null}, kwargs)
    TextInput.call(this, kwargs)
    this.format = kwargs.format
  }
})

DateTimeBaseInput.prototype._formatValue = function(value) {
  if (is.Date(value)) {
    if (this.format === null) {
      this.format = formats.getFormat(this.formatType)[0]
    }
    return time.strftime(value, this.format, locales.getDefaultLocale())
  }
  return value
}

/**
 * @constructor
 * @extends {DateTimeBaseInput}
 * @param {Object=} kwargs
 */
var DateInput = DateTimeBaseInput.extend({
  formatType: 'DATE_INPUT_FORMATS'
, constructor: function DateInput(kwargs) {
    if (!(this instanceof DateInput)) { return new DateInput(kwargs) }
    DateTimeBaseInput.call(this, kwargs)
  }
})

/**
 * @constructor
 * @extends {DateTimeBaseInput}
 * @param {Object=} kwargs
 */
var DateTimeInput = DateTimeBaseInput.extend({
  formatType: 'DATETIME_INPUT_FORMATS'
, constructor: function DateTimeInput(kwargs) {
    if (!(this instanceof DateTimeInput)) { return new DateTimeInput(kwargs) }
    DateTimeBaseInput.call(this, kwargs)
  }
})

/**
 * @constructor
 * @extends {DateTimeBaseInput}
 * @param {Object=} kwargs
 */
var TimeInput = DateTimeBaseInput.extend({
  formatType: 'TIME_INPUT_FORMATS'
, constructor: function TimeInput(kwargs) {
    if (!(this instanceof TimeInput)) { return new TimeInput(kwargs) }
    DateTimeBaseInput.call(this, kwargs)
  }
})

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
  constructor: function CheckboxInput(kwargs) {
    if (!(this instanceof Widget)) { return new CheckboxInput(kwargs) }
    kwargs = object.extend({checkTest: defaultCheckTest}, kwargs)
    Widget.call(this, kwargs)
    this.checkTest = kwargs.checkTest
  }
, validation: {onChange: true}
})

CheckboxInput.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({}, kwargs)
  var finalAttrs = this.buildAttrs(kwargs.attrs, {type: 'checkbox',
                                                  name: name})
  if (value !== '' && value !== true && value !== false && value !== null &&
      value !== undefined) {
    // Only add the value attribute if value is non-empty
    finalAttrs.value = value
  }
  var checkedAttr = (kwargs.controlled ? 'checked' : 'defaultChecked')
  finalAttrs[checkedAttr] = this.checkTest(value)
  return React.createElement('input', finalAttrs)
}

CheckboxInput.prototype.valueFromData = function(data, files, name) {
  if (typeof data[name] == 'undefined') {
    //  A missing value means False because HTML form submission does not
    // send results for unselected checkboxes.
    return false
  }
  var value = data[name]
  var values = {'true': true, 'false': false}
  // Translate true and false strings to boolean values
  if (is.String(value)) {
    value = object.get(values, value.toLowerCase(), value)
  }
  return !!value
}

/**
 * An HTML <select> widget.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var Select = Widget.extend({
  constructor: function Select(kwargs) {
    if (!(this instanceof Widget)) { return new Select(kwargs) }
    kwargs = object.extend({choices: []}, kwargs)
    Widget.call(this, kwargs)
    this.choices = util.normaliseChoices(kwargs.choices)
  }
, allowMultipleSelected: false
, validation: {onChange: true}
})

/**
 * Renders the widget.
 * @param {string} name the field name.
 * @param {*} selectedValue the value of an option which should be marked as
 *   selected, or null if no value is selected -- will be normalised to a String
 *   for comparison with choice values.
 * @param {Object=} kwargs rendering options
 * @param {Object=} kwargs.attrs additional HTML attributes for the rendered widget.
 * @param {Array=} kwargs.choices choices to be used when rendering the widget, in
 *   addition to those already held by the widget itself.
 * @return a <select> element.
 */
Select.prototype.render = function(name, selectedValue, kwargs) {
  kwargs = object.extend({choices: []}, kwargs)
  if (selectedValue === null) {
    selectedValue = ''
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {name: name})
  var options = this.renderOptions(kwargs.choices, [selectedValue])
  var valueAttr = (kwargs.controlled ? 'value' : 'defaultValue')
  finalAttrs[valueAttr] = selectedValue
  return React.createElement('select', finalAttrs, options)
}

Select.prototype.renderOptions = function(additionalChoices, selectedValues) {
  var selectedValuesLookup = object.lookup(selectedValues)
  var options = []
  var choices = this.choices.concat(util.normaliseChoices(additionalChoices))
  for (var i = 0, l = choices.length, choice; i < l; i++) {
    choice = choices[i]
    if (is.Array(choice[1])) {
      var optgroupOptions = []
      var optgroupChoices = choice[1]
      for (var j = 0, m = optgroupChoices.length; j < m; j++) {
        optgroupOptions.push(this.renderOption(selectedValuesLookup,
                                               optgroupChoices[j][0],
                                               optgroupChoices[j][1]))
      }
      options.push(React.createElement('optgroup', {label: choice[0]}, optgroupOptions))
    }
    else {
      options.push(this.renderOption(selectedValuesLookup,
                                     choice[0],
                                     choice[1]))
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
  return React.createElement('option', attrs, optLabel)
}

/**
 * A <select> widget intended to be used with NullBooleanField.
 * @constructor
 * @extends {Select}
 * @param {Object=} kwargs
 */
var NullBooleanSelect = Select.extend({
  constructor: function NullBooleanSelect(kwargs) {
    if (!(this instanceof Widget)) { return new NullBooleanSelect(kwargs) }
    kwargs = kwargs || {}
    // Set or override choices
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

/**
 * An HTML <select> widget which allows multiple selections.
 * @constructor
 * @extends {Select}
 * @param {Object=} kwargs
 */
var SelectMultiple = Select.extend({
  constructor: function SelectMultiple(kwargs) {
    if (!(this instanceof Widget)) { return new SelectMultiple(kwargs) }
    Select.call(this, kwargs)
  }
, allowMultipleSelected: true
, validation: {onChange: true}
})

/**
 * Renders the widget.
 * @param {string} name the field name.
 * @param {Array} selectedValues the values of options which should be marked as
 *   selected, or null if no values are selected - these will be normalised to
 *   Strings for comparison with choice values.
 * @param {Object} [kwargs] additional rendering options.
 * @return a <select> element which allows multiple selections.
 */
SelectMultiple.prototype.render = function(name, selectedValues, kwargs) {
  kwargs = object.extend({choices: []}, kwargs)
  if (selectedValues === null) {
    selectedValues = []
  }
  if (!is.Array(selectedValues)) {
    selectedValues = [selectedValues]
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {name: name,
                                                  multiple: 'multiple'})
  var options = this.renderOptions(kwargs.choices, selectedValues)
  var valueAttr = (kwargs.controlled ? 'value' : 'defaultValue')
  finalAttrs[valueAttr] = selectedValues
  return React.createElement('select', finalAttrs, options)
}

/**
 * Retrieves values for this widget from the given data.
 * @param {Object} data form data.
 * @param {Object} files file data.
 * @param {string} name the field name to be used to retrieve data.
 * @return {Array} values for this widget, or null if no values were provided.
 */
SelectMultiple.prototype.valueFromData = function(data, files, name) {
  if (object.hasOwn(data, name) && data[name] != null) {
    return [].concat(data[name])
  }
  return null
}

/**
 * An object used by ChoiceFieldRenderer that represents a single
 * <input>.
 */
var ChoiceInput = SubWidget.extend({
  constructor: function ChoiceInput(name, value, attrs, controlled, choice, index) {
    this.name = name
    this.value = value
    this.attrs = attrs
    this.controlled = controlled
    this.choiceValue = ''+choice[0]
    this.choiceLabel = ''+choice[1]
    this.index = index
    if (typeof this.attrs.id != 'undefined') {
      this.attrs.id += '_' + this.index
    }
    if (typeof this.attrs.key != 'undefined') {
      this.attrs.key += '_' + this.index
    }
  }
, inputType: null // Subclasses must define this
})

/**
 * Renders a <label> enclosing the widget and its label text.
 */
ChoiceInput.prototype.render = function() {
  var labelAttrs = {}
  if (this.idForLabel()) {
    labelAttrs.htmlFor = this.idForLabel()
  }
  return React.createElement('label', labelAttrs, this.tag(), ' ', this.choiceLabel)
}

ChoiceInput.prototype.isChecked = function() {
  return this.value === this.choiceValue
}

/**
 * Renders the <input> portion of the widget.
 */
ChoiceInput.prototype.tag = function() {
  var finalAttrs = Widget.prototype.buildAttrs.call(this, {}, {
    type: this.inputType, name: this.name, value: this.choiceValue
  })
  var checkedAttr = (this.controlled ? 'checked' : 'defaultChecked')
  finalAttrs[checkedAttr] = this.isChecked()
  return React.createElement('input', finalAttrs)
}

ChoiceInput.prototype.idForLabel = function() {
  return object.get(this.attrs, 'id', '')
}

var RadioChoiceInput = ChoiceInput.extend({
  constructor: function RadioChoiceInput(name, value, attrs, controlled, choice, index) {
    if (!(this instanceof RadioChoiceInput)) {
      return new RadioChoiceInput(name, value, attrs, controlled, choice, index)
    }
    ChoiceInput.call(this, name, value, attrs, controlled, choice, index)
    this.value = ''+this.value
  }
, inputType: 'radio'
})

var CheckboxChoiceInput = ChoiceInput.extend({
  constructor: function CheckboxChoiceInput(name, value, attrs, controlled, choice, index) {
    if (!(this instanceof CheckboxChoiceInput)) {
      return new CheckboxChoiceInput(name, value, attrs, controlled, choice, index)
    }
    if (!is.Array(value)) {
      value = [value]
    }
    ChoiceInput.call(this, name, value, attrs, controlled, choice, index)
    for (var i = 0, l = this.value.length; i < l; i++) {
      this.value[i] = ''+this.value[i]
    }
  }
, inputType: 'checkbox'
})

CheckboxChoiceInput.prototype.isChecked = function() {
  return this.value.indexOf(this.choiceValue) !== -1
}

/**
 * An object used by choice Selects to enable customisation of choice widgets.
 * @constructor
 * @param {string} name
 * @param {string} value
 * @param {Object} attrs
 * @param {boolean} controlled
 * @param {Array} choices
 */
var ChoiceFieldRenderer = Concur.extend({
  constructor: function ChoiceFieldRenderer(name, value, attrs, controlled, choices) {
    if (!(this instanceof ChoiceFieldRenderer)) {
      return new ChoiceFieldRenderer(name, value, attrs, controlled, choices)
    }
    this.name = name
    this.value = value
    this.attrs = attrs
    this.controlled = controlled
    this.choices = choices
  }
, choiceInputConstructor: null
})

ChoiceFieldRenderer.prototype.choiceInputs = function() {
  var inputs = []
  for (var i = 0, l = this.choices.length; i < l; i++) {
    inputs.push(this.choiceInputConstructor(this.name, this.value,
                                            object.extend({}, this.attrs),
                                            this.controlled,
                                            this.choices[i], i))
  }
  return inputs
}

ChoiceFieldRenderer.prototype.choiceInput = function(i) {
  if (i >= this.choices.length) {
    throw new Error('Index out of bounds: ' + i)
  }
  return this.choiceInputConstructor(this.name, this.value,
                                     object.extend({}, this.attrs),
                                     this.controlled,
                                     this.choices[i], i)
  }

/**
 * Outputs a <ul> for this set of choice fields.
 * If an id was given to the field, it is applied to the <ul> (each item in the
 * list will get an id of `$id_$i`).
 */
ChoiceFieldRenderer.prototype.render = function() {
  var id = object.get(this.attrs, 'id', null)
  var key = object.pop(this.attrs, 'key', null)
  var items = []
  for (var i = 0, l = this.choices.length; i < l; i++) {
    var choice = this.choices[i]
    var choiceValue = choice[0]
    var choiceLabel = choice[1]
    if (is.Array(choiceLabel)) {
      var attrsPlus = object.extend({}, this.attrs)
      if (id) {
        attrsPlus.id +='_' + i
      }
      if (key) {
        attrsPlus.key += '_' + i
      }
      var subRenderer = ChoiceFieldRenderer(this.name, this.value,
                                            attrsPlus,
                                            this.controlled,
                                            choiceLabel)
      subRenderer.choiceInputConstructor = this.choiceInputConstructor
      items.push(React.createElement('li', null, choiceValue, subRenderer.render()))
    }
    else {
      var w = this.choiceInputConstructor(this.name, this.value,
                                          object.extend({}, this.attrs),
                                          this.controlled,
                                          choice, i)
      items.push(React.createElement('li', null, w.render()))
    }
  }
  var listAttrs = {}
  if (id) {
    listAttrs.id = id
  }
  return React.createElement('ul', listAttrs, items)
}

var RadioFieldRenderer = ChoiceFieldRenderer.extend({
  constructor: function RadioFieldRenderer(name, value, attrs, controlled, choices) {
    if (!(this instanceof RadioFieldRenderer)) {
      return new RadioFieldRenderer(name, value, attrs, controlled, choices)
    }
    ChoiceFieldRenderer.apply(this, arguments)
  }
, choiceInputConstructor: RadioChoiceInput
})

var CheckboxFieldRenderer = ChoiceFieldRenderer.extend({
  constructor: function CheckboxFieldRenderer(name, value, attrs, controlled, choices) {
    if (!(this instanceof CheckboxFieldRenderer)) {
      return new CheckboxFieldRenderer(name, value, attrs, controlled, choices)
    }
    ChoiceFieldRenderer.apply(this, arguments)
  }
, choiceInputConstructor: CheckboxChoiceInput
})

var RendererMixin = Concur.extend({
  constructor: function RendererMixin(kwargs) {
    kwargs = object.extend({renderer: null}, kwargs)
    // Override the default renderer if we were passed one
    if (kwargs.renderer !== null) {
      this.renderer = kwargs.renderer
    }
  }
, _emptyValue: null
, validation: {onChange: true}
})

RendererMixin.prototype.subWidgets = function(name, value, kwargs) {
  return this.getRenderer(name, value, kwargs).choiceInputs()
}

/**
 * @return an instance of the renderer to be used to render this widget.
 */
RendererMixin.prototype.getRenderer = function(name, value, kwargs) {
  kwargs = object.extend({choices: [], controlled: false}, kwargs)
  if (value === null) {
    value = this._emptyValue
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs)
  var choices = this.choices.concat(kwargs.choices)
  return new this.renderer(name, value, finalAttrs, kwargs.controlled, choices)
}

RendererMixin.prototype.render = function(name, value, kwargs) {
  return this.getRenderer(name, value, kwargs).render()
}

/**
 * Widgets using this RendererMixin are made of a collection of subwidgets, each
 * with their own <label>, and distinct ID.
 * The IDs are made distinct by y "_X" suffix, where X is the zero-based index
 * of the choice field. Thus, the label for the main widget should reference the
 * first subwidget, hence the "_0" suffix.
 */
RendererMixin.prototype.idForLabel = function(id) {
  if (id) {
    id += '_0'
  }
  return id
}

/**
 * Renders a single select as a list of <input type="radio"> elements.
 * @constructor
 * @extends {Select}
 * @param {Object=} kwargs
 */
var RadioSelect = Select.extend({
  __mixins__: [RendererMixin]
, constructor: function(kwargs) {
    if (!(this instanceof RadioSelect)) { return new RadioSelect(kwargs) }
    RendererMixin.call(this, kwargs)
    Select.call(this, kwargs)
  }
, renderer: RadioFieldRenderer
, _emptyValue: ''
})

/**
 * Multiple selections represented as a list of <input type="checkbox"> widgets.
 * @constructor
 * @extends {SelectMultiple}
 * @param {Object=} kwargs
 */
var CheckboxSelectMultiple = SelectMultiple.extend({
  __mixins__: [RendererMixin]
, constructor: function(kwargs) {
    if (!(this instanceof CheckboxSelectMultiple)) { return new CheckboxSelectMultiple(kwargs) }
    RendererMixin.call(this, kwargs)
    SelectMultiple.call(this, kwargs)
  }
, renderer: CheckboxFieldRenderer
, _emptyValue: []
})

/**
 * A widget that is composed of multiple widgets.
 * @constructor
 * @extends {Widget}
 * @param {Object=} kwargs
 */
var MultiWidget = Widget.extend({
  constructor: function MultiWidget(widgets, kwargs) {
    if (!(this instanceof Widget)) { return new MultiWidget(widgets, kwargs) }
    this.widgets = []
    var needsMultipartForm = false
    for (var i = 0, l = widgets.length; i < l; i++) {
      var widget = widgets[i] instanceof Widget ? widgets[i] : new widgets[i]()
      if (widget.needsMultipartForm) {
        needsMultipartForm = true
      }
      this.widgets.push(widget)
    }
    this.needsMultipartForm = needsMultipartForm
    Widget.call(this, kwargs)
  }
})

/**
 * This method is different than other widgets', because it has to figure out
 * how to split a single value for display in multiple widgets.
 *
 * If the given value is NOT a list, it will first be "decompressed" into a list
 * before it is rendered by calling the  MultiWidget#decompress function.
 *
 * Each value in the list is rendered  with the corresponding widget -- the
 * first value is rendered in the first widget, the second value is rendered in
 * the second widget, and so on.
 *
 * @param {string} name the field name.
 * @param {(array.<*>|*)} value a list of values, or a normal value (e.g., a String that has
 *   been "compressed" from a list of values).
 * @param {Object=} kwargs rendering options.
 * @return a rendered collection of widgets.
 */
MultiWidget.prototype.render = function(name, value, kwargs) {
  kwargs = object.extend({}, kwargs)
  if (!(is.Array(value))) {
    value = this.decompress(value)
  }
  var finalAttrs = this.buildAttrs(kwargs.attrs, {'data-newforms-field': name})
  var id = object.get(finalAttrs, 'id', null)
  var key = object.get(finalAttrs, 'key', null)
  var renderedWidgets = []
  for (var i = 0, l = this.widgets.length; i < l; i++) {
    var widget = this.widgets[i]
    var widgetValue = null
    if (typeof value[i] != 'undefined') {
      widgetValue = value[i]
    }
    if (id) {
      finalAttrs.id = id + '_' + i
    }
    if (key) {
      finalAttrs.key = key + '_' + i
    }
    renderedWidgets.push(
        widget.render(name + '_' + i, widgetValue, {attrs: finalAttrs,
                                                    controlled: kwargs.controlled}))
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

/**
 * Creates an element containing a given list of rendered widgets.
 *
 * This hook allows you to format the HTML design of the widgets, if needed.
 *
 * @param {Array} renderedWidgets a list of rendered widgets.
 * @return a <div> containing the rendered widgets.
 */
MultiWidget.prototype.formatOutput = function(renderedWidgets) {
  return React.createElement('div', null, renderedWidgets)
}

/**
 * Creates a list of decompressed values for the given compressed value.
 * @abstract
 * @param value a compressed value, which can be assumed to be valid, but not
 *   necessarily non-empty.
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
  constructor: function SplitDateTimeWidget(kwargs) {
    if (!(this instanceof Widget)) { return new SplitDateTimeWidget(kwargs) }
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
  constructor: function SplitHiddenDateTimeWidget(kwargs) {
    if (!(this instanceof Widget)) { return new SplitHiddenDateTimeWidget(kwargs) }
    SplitDateTimeWidget.call(this, kwargs)
    for (var i = 0, l = this.widgets.length; i < l; i++) {
      this.widgets[i].inputType = 'hidden'
      this.widgets[i].isHidden = true
    }
  }
, isHidden: true
})

module.exports = {
  SubWidget: SubWidget
, Widget: Widget
, Input: Input
, TextInput: TextInput
, NumberInput: NumberInput
, EmailInput: EmailInput
, URLInput: URLInput
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
, ChoiceInput: ChoiceInput
, RadioChoiceInput: RadioChoiceInput
, CheckboxChoiceInput: CheckboxChoiceInput
, ChoiceFieldRenderer: ChoiceFieldRenderer
, RendererMixin: RendererMixin
, RadioFieldRenderer: RadioFieldRenderer
, CheckboxFieldRenderer: CheckboxFieldRenderer
, RadioSelect: RadioSelect
, CheckboxSelectMultiple: CheckboxSelectMultiple
, MultiWidget: MultiWidget
, SplitDateTimeWidget: SplitDateTimeWidget
, SplitHiddenDateTimeWidget: SplitHiddenDateTimeWidget
}

},{"./env":5,"./formats":7,"./locales":10,"./util":11,"Concur":13,"isomorph/is":17,"isomorph/object":18,"isomorph/time":19}],13:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty
var toString = Object.prototype.toString

function type(obj) {
  return toString.call(obj).slice(8, -1).toLowerCase()
}

function inherits(childConstructor, parentConstructor) {
  var F = function() {}
  F.prototype = parentConstructor.prototype
  childConstructor.prototype = new F()
  childConstructor.prototype.constructor = childConstructor
  return childConstructor
}

function extend(dest, src) {
  for (var prop in src) {
    if (hasOwn.call(src, prop)) {
      dest[prop] = src[prop]
    }
  }
  return dest
}

/**
 * Mixes in properties from one object to another. If the source object is a
 * Function, its prototype is mixed in instead.
 */
function mixin(dest, src) {
  if (type(src) == 'function') {
    extend(dest, src.prototype)
  }
  else {
    extend(dest, src)
  }
}

/**
 * Applies mixins specified as a __mixins__ property on the given properties
 * object, returning an object containing the mixed in properties.
 */
function applyMixins(properties) {
  var mixins = properties.__mixins__
  if (type(mixins) != 'array') {
    mixins = [mixins]
  }
  var mixedProperties = {}
  for (var i = 0, l = mixins.length; i < l; i++) {
    mixin(mixedProperties, mixins[i])
  }
  delete properties.__mixins__
  return extend(mixedProperties, properties)
}

/**
 * Inherits another constructor's prototype and sets its prototype and
 * constructor properties in one fell swoop.
 *
 * If a child constructor is not provided via prototypeProps.constructor,
 * a new constructor will be created.
 */
function inheritFrom(parentConstructor, childConstructor, prototypeProps, constructorProps) {
  // Create a child constructor if one wasn't given
  if (childConstructor == null) {
    childConstructor = function() {
      parentConstructor.apply(this, arguments)
    }
  }

  // Make sure the new prototype has the correct constructor set up
  prototypeProps.constructor = childConstructor

  // Base constructors should only have the properties they're defined with
  if (parentConstructor !== Concur) {
    // Inherit the parent's prototype
    inherits(childConstructor, parentConstructor)
    childConstructor.__super__ = parentConstructor.prototype
  }

  // Add prototype properties - this is why we took a copy of the child
  // constructor reference in extend() - if a .constructor had been passed as a
  // __mixins__ and overitten prototypeProps.constructor, these properties would
  // be getting set on the mixed-in constructor's prototype.
  extend(childConstructor.prototype, prototypeProps)

  // Add constructor properties
  extend(childConstructor, constructorProps)

  return childConstructor
}

/**
 * Namespace and dummy constructor for initial extension.
 */
var Concur = module.exports = function() {}

/**
 * Details of a constructor's inheritance chain - Concur just facilitates sugar
 * so we don't include it in the initial chain. Arguably, Object.prototype could
 * go here, but it's just not that interesting.
 */
Concur.__mro__ = []

/**
 * Creates or uses a child constructor to inherit from the the call
 * context, which is expected to be a constructor.
 */
Concur.extend = function(prototypeProps, constructorProps) {
  // Ensure we have prop objects to work with
  prototypeProps = prototypeProps || {}
  constructorProps = constructorProps || {}

  // If the constructor being inherited from has a __meta__ function somewhere
  // in its prototype chain, call it to customise prototype and constructor
  // properties before they're used to set up the new constructor's prototype.
  if (typeof this.prototype.__meta__ != 'undefined') {
    this.prototype.__meta__(prototypeProps, constructorProps)
  }

  // Any child constructor passed in should take precedence - grab a reference
  // to it befoer we apply any mixins.
  var childConstructor = (hasOwn.call(prototypeProps, 'constructor')
                          ? prototypeProps.constructor
                          : null)

  // If any mixins are specified, mix them into the property objects
  if (hasOwn.call(prototypeProps, '__mixins__')) {
    prototypeProps = applyMixins(prototypeProps)
  }
  if (hasOwn.call(constructorProps, '__mixins__')) {
    constructorProps = applyMixins(constructorProps)
  }

  // Set up the new child constructor and its prototype
  childConstructor = inheritFrom(this,
                                 childConstructor,
                                 prototypeProps,
                                 constructorProps)

  // Pass on the extend function for extension in turn
  childConstructor.extend = this.extend

  // Expose the inheritance chain for programmatic access
  childConstructor.__mro__ = [childConstructor].concat(this.__mro__)

  return childConstructor
}

},{}],14:[function(require,module,exports){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

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
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
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
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
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
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
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
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
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
	 * if `flag` is non-zero and `digit` has no uppercase form.
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
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
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
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
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
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
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
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

},{}],15:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty
var toString = Object.prototype.toString
var type = function(obj) { return toString.call(obj).slice(8, -1).toLowerCase() }

var primitiveWrapperTypes = {
  boolean: true
, number: true
, string: true
}

var stringPropsRE = /^(?:\d+|length)$/

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
  var c, property
  if (typeof target != 'object') {
    // Non-objects have value semantics, so target is already a copy
    return target
  }
  else {
    var value = target.valueOf()
    if (target == value) {
      // The object is a standard object wrapper for a native type, say String.
      // we can make a copy by instantiating a new object around the value.
      c = new target.constructor(value)
      var notString = type(target) != 'string'

      // Wrappers can have properties added to them
      for (property in target) {
        if (hasOwn.call(target, property) && (notString || !stringPropsRE.test(property))) {
          c[property] = target[property]
        }
      }

      return c
    }
    else {
      // We have a normal object. If possible, we'll clone the original's
      // prototype (not the original) to get an empty object with the same
      // prototype chain as the original. If just copy the instance properties.
      // Otherwise, we have to copy the whole thing, property-by-property.
      if (target instanceof target.constructor && target.constructor !== Object) {
        c = clone(target.constructor.prototype)

        // Give the copy all the instance properties of target. It has the same
        // prototype as target, so inherited properties are already there.
        for (property in target) {
          if (hasOwn.call(target, property)) {
            c[property] = target[property]
          }
        }
      }
      else {
        c = {}
        for (property in target) {
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
    if (source === null) { return null }

    // All non-objects use value semantics and don't need explict copying
    if (typeof source != 'object') { return source }

    var cachedResult = this.getCachedResult(source)

    // We've already seen this object during this deep copy operation so can
    // immediately return the result. This preserves the cyclic reference
    // structure and protects us from infinite recursion.
    if (cachedResult) { return cachedResult }

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

    // Only DeepCopier.populate() can recursively deep copy. So, to keep track
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
      if (hasOwn.call(source, key)) {
        result[key] = deepCopy(source[key])
      }
    }
    return result
  }
})

// Standard primitive wrapper copier
deepCopy.register({
  canCopy: function(source) {
    return primitiveWrapperTypes[type(source)]
  }

, create: function(source) {
    return new source.constructor(source.valueOf())
  }

, populate: function(deepCopy, source, result) {
    var notString = type(source) != 'string'
    for (var key in source) {
      if (hasOwn.call(source, key) && (notString || !stringPropsRE.test(key))) {
        result[key] = deepCopy(source[key])
      }
    }
    return result
  }
})

// RegExp copier
deepCopy.register({
  canCopy: function(source) {
    return type(source) == 'regexp'
  }

, create: function(source) {
    return source
  }


})

// Date copier
deepCopy.register({
  canCopy: function(source) {
    return type(source) == 'date'
  }

, create: function(source) {
    return new Date(source)
  }
})

// Array copier
deepCopy.register({
  canCopy: function(source) {
    return type(source) == 'array'
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

module.exports = {
  DeepCopyAlgorithm: DeepCopyAlgorithm
, copy: copy
, clone: clone
, deepCopy: deepCopy
}

},{}],16:[function(require,module,exports){
'use strict';

var slice = Array.prototype.slice
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

},{}],17:[function(require,module,exports){
'use strict';

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
  /* jshint ignore:start */
  for (var prop in o) {
    return false
  }
  /* jshint ignore:end */
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

},{}],18:[function(require,module,exports){
'use strict';

/**
 * Wraps Object.prototype.hasOwnProperty() so it can be called with an object
 * and property name.
 */
var hasOwn = (function() {
  var hasOwnProperty = Object.prototype.hasOwnProperty
  return function(obj, prop) { return hasOwnProperty.call(obj, prop) }
})()

/**
 * Returns the type of an object as a lowercase string.
 */
var type = (function() {
  var toString = Object.prototype.toString
  return function(obj) { return toString.call(obj).slice(8, -1).toLowerCase() }
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
  var items_ = []
  for (var prop in obj) {
    if (hasOwn(obj, prop)) {
      items_.push([prop, obj[prop]])
    }
  }
  return items_
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

/**
 * Deletes and returns an own property from an object, optionally returning a
 * default value if the object didn't have theproperty.
 * @throws if given an object which is null (or undefined), or if the property
 *   doesn't exist and there was no defaultValue given.
 */
function pop(obj, prop, defaultValue) {
  if (obj == null) {
    throw new Error('pop was given ' + obj)
  }
  if (hasOwn(obj, prop)) {
    var value = obj[prop]
    delete obj[prop]
    return value
  }
  else if (arguments.length == 2) {
    throw new Error("pop was given an object which didn't have an own '" +
                    prop + "' property, without a default value to return")
  }
  return defaultValue
}

/**
 * If the prop is in the object, return its value. If not, set the prop to
 * defaultValue and return defaultValue.
 */
function setDefault(obj, prop, defaultValue) {
  if (obj == null) {
    throw new Error('setDefault was given ' + obj)
  }
  defaultValue = defaultValue || null
  if (hasOwn(obj, prop)) {
    return obj[prop]
  }
  else {
    obj[prop] = defaultValue
    return defaultValue
  }
}

module.exports = {
  hasOwn: hasOwn
, type: type
, extend: extend
, inherits: inherits
, items: items
, fromItems: fromItems
, lookup: lookup
, get: get
, pop: pop
, setDefault: setDefault
}

},{}],19:[function(require,module,exports){
'use strict';

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
  var hour
  if (data.hasOwnProperty('H')) {
    hour = parseInt(data.H, 10)
    if (hour > 23) {
      throw new Error('Hour is out of range: ' + hour)
    }
    time[3] = hour
  }
  else if (data.hasOwnProperty('I')) {
    hour = parseInt(data.I, 10)
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
  day = time[2], month = time[1], year = time[0]
  if (((month == 4 || month == 6 || month == 9 || month == 11) &&
      day > 30) ||
      (month == 2 && day > ((year % 4 === 0 && year % 100 !== 0 ||
                             year % 400 === 0) ? 29 : 28))) {
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

},{"./is":17}],20:[function(require,module,exports){
'use strict';

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
  var o = parseUri.options
    , m = o.parser[o.strictMode ? "strict" : "loose"].exec(str)
    , uri = {}
    , i = 14

  while (i--) { uri[o.key[i]] = m[i] || "" }

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) { uri[o.q.name][$1] = $2 }
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

},{}],21:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var format = require('isomorph/format').formatObj
var is = require('isomorph/is')
var object = require('isomorph/object')

var NON_FIELD_ERRORS = '__all__'

/**
 * A validation error, containing a list of messages. Single messages (e.g.
 * those produced by validators) may have an associated error code and
 * parameters to allow customisation by fields.
 *
 * The message argument can be a single error, a list of errors, or an object
 * that maps field names to lists of errors. What we define as an "error" can
 * be either a simple string or an instance of ValidationError with its message
 * attribute set, and what we define as list or object can be an actual list or
 * object or an instance of ValidationError with its errorList or errorObj
 * property set.
 */
var ValidationError = Concur.extend({
  constructor: function ValidationError(message, kwargs) {
    if (!(this instanceof ValidationError)) { return new ValidationError(message, kwargs) }
    kwargs = object.extend({code: null, params: null}, kwargs)

    var code = kwargs.code
    var params = kwargs.params

    if (message instanceof ValidationError) {
      if (object.hasOwn(message, 'errorObj')) {
        message = message.errorObj
      }
      else if (object.hasOwn(message, 'message')) {
        message = message.errorList
      }
      else {
        code = message.code
        params = message.params
        message = message.message
      }
    }

    if (is.Object(message)) {
      this.errorObj = {}
      Object.keys(message).forEach(function(field) {
        var messages = message[field]
        if (!(messages instanceof ValidationError)) {
          messages = ValidationError(messages)
        }
        this.errorObj[field] = messages.errorList
      }.bind(this))
    }
    else if (is.Array(message)) {
      this.errorList = []
      message.forEach(function(message) {
        // Normalize strings to instances of ValidationError
        if (!(message instanceof ValidationError)) {
          message = ValidationError(message)
        }
        this.errorList.push.apply(this.errorList, message.errorList)
      }.bind(this))
    }
    else {
      this.message = message
      this.code = code
      this.params = params
      this.errorList = [this]
    }
  }
})

/**
 * Returns validation messages as an object with field names as properties.
 * Throws an error if this validation error was not created with a field error
 * object.
 */
ValidationError.prototype.messageObj = function() {
  if (!object.hasOwn(this, 'errorObj')) {
    throw new Error('ValidationError has no errorObj')
  }
  return this.__iter__()
}

/**
 * Returns validation messages as a list.
 */
ValidationError.prototype.messages = function() {
  if (object.hasOwn(this, 'errorObj')) {
    var messages = []
    Object.keys(this.errorObj).forEach(function(field) {
      var errors = this.errorObj[field]
      messages.push.apply(messages, ValidationError(errors).__iter__())
    }.bind(this))
    return messages
  }
  else {
    return this.__iter__()
  }
}

/**
 * Generates an object of field error messags or a list of error messages
 * depending on how this ValidationError has been constructed.
 */
ValidationError.prototype.__iter__ = function() {
  if (object.hasOwn(this, 'errorObj')) {
    var messageObj = {}
    Object.keys(this.errorObj).forEach(function(field) {
      var errors = this.errorObj[field]
      messageObj[field] = ValidationError(errors).__iter__()
    }.bind(this))
    return messageObj
  }
  else {
    return this.errorList.map(function(error) {
      var message = error.message
      if (error.params) {
        message = format(message, error.params)
      }
      return message
    })
  }
}

/**
 * Passes this error's messages on to the given error object, adding to a
 * particular field's error messages if already present.
 */
ValidationError.prototype.updateErrorObj = function(errorObj) {
  if (object.hasOwn(this, 'errorObj')) {
    if (errorObj) {
      Object.keys(this.errorObj).forEach(function(field) {
        if (!object.hasOwn(errorObj, field)) {
          errorObj[field] = []
        }
        var errors = errorObj[field]
        errors.push.apply(errors, this.errorObj[field])
      }.bind(this))
    }
    else {
      errorObj = this.errorObj
    }
  }
  else {
    if (!object.hasOwn(errorObj, NON_FIELD_ERRORS)) {
      errorObj[NON_FIELD_ERRORS] = []
    }
    var nonFieldErrors = errorObj[NON_FIELD_ERRORS]
    nonFieldErrors.push.apply(nonFieldErrors, this.errorList)
  }
  return errorObj
}

ValidationError.prototype.toString = function() {
  return ('ValidationError(' + JSON.stringify(this.__iter__()) + ')')
}

module.exports = {
  ValidationError: ValidationError
}

},{"Concur":13,"isomorph/format":16,"isomorph/is":17,"isomorph/object":18}],22:[function(require,module,exports){
'use strict';

// HACK: requiring './validators' here makes the circular import in ipv6.js work
//       after browserification.
module.exports = require('./validators')
},{"./validators":24}],23:[function(require,module,exports){
'use strict';

var object = require('isomorph/object')

var errors = require('./errors')

var ValidationError = errors.ValidationError

var hexRE = /^[0-9a-f]+$/

/**
 * Cleans a IPv6 address string.
 *
 * Validity is checked by calling isValidIPv6Address() - if an invalid address
 * is passed, a ValidationError is thrown.
 *
 * Replaces the longest continious zero-sequence with '::' and removes leading
 * zeroes and makes sure all hextets are lowercase.
 */
function cleanIPv6Address(ipStr, kwargs) {
  kwargs = object.extend({
    unpackIPv4: false, errorMessage: 'This is not a valid IPv6 address.'
  }, kwargs)

  var bestDoublecolonStart = -1
  var bestDoublecolonLen = 0
  var doublecolonStart = -1
  var doublecolonLen = 0

  if (!isValidIPv6Address(ipStr)) {
    throw ValidationError(kwargs.errorMessage, {code: 'invalid'})
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
    if (hextets[i] === '') {
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
    if (bestDoublecolonStart === 0) {
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
  if (ipStr.toLowerCase().indexOf('0000:0000:0000:0000:0000:ffff:') !== 0) {
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
  if (ipStr.toLowerCase().indexOf('0000:0000:0000:0000:0000:ffff:') !== 0) {
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
        validateIPv4Address(hextet)
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
  var hextets = ipStr.split('::')

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
  for (i = 0, l = newIp.length; i < l; i++) {
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

},{"./errors":21,"./validators":24,"isomorph/object":18}],24:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var is = require('isomorph/is')
var object = require('isomorph/object')
var punycode = require('punycode')
var url = require('isomorph/url')

var errors = require('./errors')
var ipv6 = require('./ipv6')

var ValidationError = errors.ValidationError
var isValidIPv6Address = ipv6.isValidIPv6Address

var EMPTY_VALUES = [null, undefined, '']

function String_rsplit(str, sep, maxsplit) {
  var split = str.split(sep)
  return maxsplit ? [split.slice(0, -maxsplit).join(sep)].concat(split.slice(-maxsplit)) : split
}

/**
 * Validates that input matches a regular expression.
 */
var RegexValidator = Concur.extend({
  constructor: function(kwargs) {
    if (!(this instanceof RegexValidator)) { return new RegexValidator(kwargs) }
    kwargs = object.extend({
      regex: null, message: null, code: null, inverseMatch: null
    }, kwargs)
    if (kwargs.regex) {
      this.regex = kwargs.regex
    }
    if (kwargs.message) {
      this.message = kwargs.message
    }
    if (kwargs.code) {
      this.code = kwargs.code
    }
    if (kwargs.inverseMatch) {
      this.inverseMatch = kwargs.inverseMatch
    }
    // Compile the regex if it was not passed pre-compiled
    if (is.String(this.regex)) {
      this.regex = new RegExp(this.regex)
    }
    return this.__call__.bind(this)
  }
, regex: ''
, message: 'Enter a valid value.'
, code: 'invalid'
, inverseMatch: false
, __call__: function(value) {
    if (this.inverseMatch === this.regex.test(''+value)) {
      throw ValidationError(this.message, {code: this.code})
    }
  }
})

/**
 * Validates that input looks like a valid URL.
 */
var URLValidator = RegexValidator.extend({
  regex: new RegExp(
    '^(?:[a-z0-9\\.\\-]*)://'                         // schema is validated separately
  + '(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|' // Domain...
  + 'localhost|'                                      // localhost...
  + '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|'      // ...or IPv4
  + '\\[?[A-F0-9]*:[A-F0-9:]+\\]?)'                   // ...or IPv6
  + '(?::\\d+)?'                                      // Optional port
  + '(?:/?|[/?]\\S+)$'
  , 'i'
  )
, message: 'Enter a valid URL.'
, schemes: ['http', 'https', 'ftp', 'ftps']

, constructor:function(kwargs) {
    if (!(this instanceof URLValidator)) { return new URLValidator(kwargs) }
    kwargs = object.extend({schemes: null}, kwargs)
    RegexValidator.call(this, kwargs)
    if (kwargs.schemes !== null) {
      this.schemes = kwargs.schemes
    }
    return this.__call__.bind(this)
  }

, __call__: function(value) {
    value = ''+value
    // Check if the scheme is valid first
    var scheme = value.split('://')[0].toLowerCase()
    if (this.schemes.indexOf(scheme) === -1) {
      throw ValidationError(this.message, {code: this.code})
    }

    // Check the full URL
    try {
      RegexValidator.prototype.__call__.call(this, value)
    }
    catch (e) {
      if (!(e instanceof ValidationError)) { throw e }

      // Trivial case failed - try for possible IDN domain
      var urlFields = url.parseUri(value)
      try {
        urlFields.host = punycode.toASCII(urlFields.host)
      }
      catch (unicodeError) {
        throw e
      }
      value = url.makeUri(urlFields)
      RegexValidator.prototype.__call__.call(this, value)
    }
  }
})

/** Validates that input looks like a valid e-mail address. */
var EmailValidator = Concur.extend({
  message: 'Enter a valid email address.'
, code: 'invalid'
, userRegex: new RegExp(
    "(^[-!#$%&'*+/=?^_`{}|~0-9A-Z]+(\\.[-!#$%&'*+/=?^_`{}|~0-9A-Z]+)*$"                                 // Dot-atom
  + '|^"([\\001-\\010\\013\\014\\016-\\037!#-\\[\\]-\\177]|\\\\[\\001-\\011\\013\\014\\016-\\177])*"$)' // Quoted-string
  , 'i')
, domainRegex: new RegExp(
    '^(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+(?:[A-Z]{2,6}|[A-Z0-9-]{2,})$'          // Domain
  + '|^\\[(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)){3}\\]$' // Literal form, ipv4 address (SMTP 4.1.3)
  , 'i')
, domainWhitelist: ['localhost']

, constructor: function(kwargs) {
    if (!(this instanceof EmailValidator)) { return new EmailValidator(kwargs) }
    kwargs = object.extend({message: null, code: null, whitelist: null}, kwargs)
    if (kwargs.message !== null) {
      this.message = kwargs.message
    }
    if (kwargs.code !== null) {
      this.code = kwargs.code
    }
    if (kwargs.whitelist !== null) {
      this.domainWhitelist = kwargs.whitelist
    }
    return this.__call__.bind(this)
  }

, __call__ : function(value) {
    value = ''+value

    if (!value || value.indexOf('@') == -1) {
      throw ValidationError(this.message, {code: this.code})
    }

    var parts = String_rsplit(value, '@', 1)
    var userPart = parts[0]
    var domainPart = parts[1]

    if (!this.userRegex.test(userPart)) {
      throw ValidationError(this.message, {code: this.code})
    }

    if (this.domainWhitelist.indexOf(domainPart) == -1 &&
        !this.domainRegex.test(domainPart)) {
      // Try for possible IDN domain-part
      try {
        domainPart = punycode.toASCII(domainPart)
        if (this.domainRegex.test(domainPart)) {
          return
        }
      }
      catch (unicodeError) {
        // Pass through to throw the ValidationError
      }
      throw ValidationError(this.message, {code: this.code})
    }
  }
})

var validateEmail = EmailValidator()

var SLUG_RE = /^[-a-zA-Z0-9_]+$/
/** Validates that input is a valid slug. */
var validateSlug = RegexValidator({
  regex: SLUG_RE
, message: 'Enter a valid "slug" consisting of letters, numbers, underscores or hyphens.'
, code: 'invalid'
})

var IPV4_RE = /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/
/** Validates that input is a valid IPv4 address. */
var validateIPv4Address = RegexValidator({
  regex: IPV4_RE
, message: 'Enter a valid IPv4 address.'
, code: 'invalid'
})

/** Validates that input is a valid IPv6 address. */
function validateIPv6Address(value) {
  if (!isValidIPv6Address(value)) {
    throw ValidationError('Enter a valid IPv6 address.', {code: 'invalid'})
  }
}

/** Validates that input is a valid IPv4 or IPv6 address. */
function validateIPv46Address(value) {
  try {
    validateIPv4Address(value)
  }
  catch (e) {
    if (!(e instanceof ValidationError)) { throw e }
    try {
      validateIPv6Address(value)
    }
    catch (e) {
      if (!(e instanceof ValidationError)) { throw e }
      throw ValidationError('Enter a valid IPv4 or IPv6 address.',
                            {code: 'invalid'})
    }
  }
}

var ipAddressValidatorLookup = {
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
  if (typeof ipAddressValidatorLookup[protocol] == 'undefined') {
    throw new Error('The protocol "' + protocol +'" is unknown')
  }
  return ipAddressValidatorLookup[protocol]
}

var COMMA_SEPARATED_INT_LIST_RE = /^[\d,]+$/
/** Validates that input is a comma-separated list of integers. */
var validateCommaSeparatedIntegerList = RegexValidator({
  regex: COMMA_SEPARATED_INT_LIST_RE
, message: 'Enter only digits separated by commas.'
, code: 'invalid'
})

/**
 * Base for validators which compare input against a given value.
 */
var BaseValidator = Concur.extend({
  constructor: function(limitValue) {
    if (!(this instanceof BaseValidator)) { return new BaseValidator(limitValue) }
    this.limitValue = limitValue
    return this.__call__.bind(this)
  }
, compare: function(a, b) { return a !== b }
, clean: function(x) { return x }
, message: 'Ensure this value is {limitValue} (it is {showValue}).'
, code: 'limitValue'
, __call__: function(value) {
    var cleaned = this.clean(value)
    var params = {limitValue: this.limitValue, showValue: cleaned}
    if (this.compare(cleaned, this.limitValue)) {
      throw ValidationError(this.message, {code: this.code, params: params})
    }
  }
})

/**
 * Validates that input is less than or equal to a given value.
 */
var MaxValueValidator = BaseValidator.extend({
  constructor: function(limitValue) {
    if (!(this instanceof MaxValueValidator)) { return new MaxValueValidator(limitValue) }
    return BaseValidator.call(this, limitValue)
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
    if (!(this instanceof MinValueValidator)) { return new MinValueValidator(limitValue) }
    return BaseValidator.call(this, limitValue)
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
    if (!(this instanceof MinLengthValidator)) { return new MinLengthValidator(limitValue) }
    return BaseValidator.call(this, limitValue)
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
    if (!(this instanceof MaxLengthValidator)) { return new MaxLengthValidator(limitValue) }
    return BaseValidator.call(this, limitValue)
  }
, compare: function(a, b) { return a > b }
, clean: function(x) { return x.length }
, message: 'Ensure this value has at most {limitValue} characters (it has {showValue}).'
, code: 'maxLength'
})

module.exports = {
  EMPTY_VALUES: EMPTY_VALUES
, RegexValidator: RegexValidator
, URLValidator: URLValidator
, EmailValidator: EmailValidator
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

},{"./errors":21,"./ipv6":23,"Concur":13,"isomorph/is":17,"isomorph/object":18,"isomorph/url":20,"punycode":14}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGliXFxuZXdmb3Jtcy5qcyIsImxpYlxcQm91bmRGaWVsZC5qcyIsImxpYlxcRXJyb3JMaXN0LmpzIiwibGliXFxFcnJvck9iamVjdC5qcyIsImxpYlxcZW52LmpzIiwibGliXFxmaWVsZHMuanMiLCJsaWJcXGZvcm1hdHMuanMiLCJsaWJcXGZvcm1zLmpzIiwibGliXFxmb3Jtc2V0cy5qcyIsImxpYlxcbG9jYWxlcy5qcyIsImxpYlxcdXRpbC5qcyIsImxpYlxcd2lkZ2V0cy5qcyIsIm5vZGVfbW9kdWxlc1xcQ29uY3VyXFxsaWJcXGNvbmN1ci5qcyIsIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxwdW55Y29kZVxccHVueWNvZGUuanMiLCJub2RlX21vZHVsZXNcXGlzb21vcnBoXFxjb3B5LmpzIiwibm9kZV9tb2R1bGVzXFxpc29tb3JwaFxcZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzXFxpc29tb3JwaFxcaXMuanMiLCJub2RlX21vZHVsZXNcXGlzb21vcnBoXFxvYmplY3QuanMiLCJub2RlX21vZHVsZXNcXGlzb21vcnBoXFx0aW1lLmpzIiwibm9kZV9tb2R1bGVzXFxpc29tb3JwaFxcdXJsLmpzIiwibm9kZV9tb2R1bGVzXFx2YWxpZGF0b3JzXFxsaWJcXGVycm9ycy5qcyIsIm5vZGVfbW9kdWxlc1xcdmFsaWRhdG9yc1xcbGliXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xcdmFsaWRhdG9yc1xcbGliXFxpcHY2LmpzIiwibm9kZV9tb2R1bGVzXFx2YWxpZGF0b3JzXFxsaWJcXHZhbGlkYXRvcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHJEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNobENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6ckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIHZhbGlkYXRvcnMgPSByZXF1aXJlKCd2YWxpZGF0b3JzJylcblxudmFyIGVudiA9IHJlcXVpcmUoJy4vZW52JylcbnZhciBmaWVsZHMgPSByZXF1aXJlKCcuL2ZpZWxkcycpXG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpXG52YXIgZm9ybXMgPSByZXF1aXJlKCcuL2Zvcm1zJylcbnZhciBmb3Jtc2V0cyA9IHJlcXVpcmUoJy4vZm9ybXNldHMnKVxudmFyIGxvY2FsZXMgPSByZXF1aXJlKCcuL2xvY2FsZXMnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKVxuXG52YXIgQm91bmRGaWVsZCA9IHJlcXVpcmUoJy4vQm91bmRGaWVsZCcpXG52YXIgRXJyb3JMaXN0ID0gcmVxdWlyZSgnLi9FcnJvckxpc3QnKVxudmFyIEVycm9yT2JqZWN0ID0gcmVxdWlyZSgnLi9FcnJvck9iamVjdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0LmV4dGVuZCh7XG4gIGFkZExvY2FsZTogbG9jYWxlcy5hZGRMb2NhbGVcbiwgQm91bmRGaWVsZDogQm91bmRGaWVsZFxuLCBlbnY6IGVudlxuLCBFcnJvckxpc3Q6IEVycm9yTGlzdFxuLCBFcnJvck9iamVjdDogRXJyb3JPYmplY3RcbiwgZm9ybWF0czogZm9ybWF0c1xuLCBmb3JtRGF0YTogdXRpbC5mb3JtRGF0YVxuLCBsb2NhbGVzOiBsb2NhbGVzXG4sIHNldERlZmF1bHRMb2NhbGU6IGxvY2FsZXMuc2V0RGVmYXVsdExvY2FsZVxuLCB1dGlsOiB1dGlsXG4sIHZhbGlkYXRlQWxsOiB1dGlsLnZhbGlkYXRlQWxsXG4sIFZhbGlkYXRpb25FcnJvcjogdmFsaWRhdG9ycy5WYWxpZGF0aW9uRXJyb3JcbiwgdmFsaWRhdG9yczogdmFsaWRhdG9yc1xufSwgZmllbGRzLCBmb3JtcywgZm9ybXNldHMsIHdpZGdldHMpXG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25jdXIgPSByZXF1aXJlKCdDb25jdXInKVxudmFyIGlzID0gcmVxdWlyZSgnaXNvbW9ycGgvaXMnKVxudmFyIGZvcm1hdCA9IHJlcXVpcmUoJ2lzb21vcnBoL2Zvcm1hdCcpLmZvcm1hdE9ialxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKVxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgd2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpXG5cbi8qKlxuICogQSBoZWxwZXIgZm9yIHJlbmRlcmluZyBhIGZpZWxkLlxuICogQHBhcmFtIHtGb3JtfSBmb3JtIHRoZSBmb3JtIGluc3RhbmNlIHdoaWNoIHRoZSBmaWVsZCBpcyBhIHBhcnQgb2YuXG4gKiBAcGFyYW0ge0ZpZWxkfSBmaWVsZCB0aGUgZmllbGQgdG8gYmUgcmVuZGVyZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZpZWxkIGluIHRoZSBmb3JtLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBCb3VuZEZpZWxkID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBCb3VuZEZpZWxkKGZvcm0sIGZpZWxkLCBuYW1lKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJvdW5kRmllbGQpKSB7IHJldHVybiBuZXcgQm91bmRGaWVsZChmb3JtLCBmaWVsZCwgbmFtZSkgfVxuICAgIHRoaXMuZm9ybSA9IGZvcm1cbiAgICB0aGlzLmZpZWxkID0gZmllbGRcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy5odG1sTmFtZSA9IGZvcm0uYWRkUHJlZml4KG5hbWUpXG4gICAgdGhpcy5odG1sSW5pdGlhbE5hbWUgPSBmb3JtLmFkZEluaXRpYWxQcmVmaXgobmFtZSlcbiAgICB0aGlzLmh0bWxJbml0aWFsSWQgPSBmb3JtLmFkZEluaXRpYWxQcmVmaXgodGhpcy5hdXRvSWQoKSlcbiAgICB0aGlzLmxhYmVsID0gdGhpcy5maWVsZC5sYWJlbCAhPT0gbnVsbCA/IHRoaXMuZmllbGQubGFiZWwgOiB1dGlsLnByZXR0eU5hbWUobmFtZSlcbiAgICB0aGlzLmhlbHBUZXh0ID0gZmllbGQuaGVscFRleHQgfHwgJydcbiAgfVxufSlcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFN0YXR1cyA9PT1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB2YWx1ZSB3aGljaCB3aWxsIGJlIGRpc3BsYXllZCBpbiB0aGUgZmllbGQnc1xuICogICB3aWRnZXQgaXMgZW1wdHkuXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZmllbGQuaXNFbXB0eVZhbHVlKHRoaXMudmFsdWUoKSlcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmaWVsZCBoYXMgYSBwZW5kaW5nIGFzeW5jIHZhbGlkYXRpb24uXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHlwZW9mIHRoaXMuZm9ybS5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvblt0aGlzLm5hbWVdICE9ICd1bmRlZmluZWQnXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZmllbGQgaGFzIHNvbWUgZGF0YSBpbiBpdHMgZm9ybSdzIGNsZWFuZWREYXRhLlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5pc0NsZWFuZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHR5cGVvZiB0aGlzLmZvcm0uY2xlYW5lZERhdGFbdGhpcy5uYW1lXSAhPSAndW5kZWZpbmVkJ1xufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZpZWxkJ3Mgd2lkZ2V0IHdpbGwgcmVuZGVyIGhpZGRlbiBmaWVsZChzKS5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuaXNIaWRkZW4gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZmllbGQud2lkZ2V0LmlzSGlkZGVuXG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgZmllbGQncyBjdXJlbnQgc3RhdHVzIGluIHRoZSBmb3JtLiBTdGF0dXNlcyBhcmUgZGV0ZXJtaW5lZCBpblxuICogdGhlIGZvbGxvd2luZyBvcmRlcjpcbiAqICogJ3BlbmRpbmcnIC0gdGhlIGZpZWxkIGhhcyBhIHBlbmRpbmcgYXN5bmMgdmFsaWRhdGlvbi5cbiAqICogJ2Vycm9yJyAtIHRoZSBmaWVsZCBoYXMgYSB2YWxpZGF0aW9uIGVycm9yLlxuICogKiAndmFsaWQnIC0gdGhlIGZpZWxkIGhhcyBhIHZhbHVlIGluIGZvcm0uY2xlYW5lZERhdGEuXG4gKiAqICdkZWZhdWx0JyAtIHRoZSBmaWVsZCBtZWV0cyBub25lIG9mIHRoZSBhYm92ZSBjcml0ZXJpYSwgZS5nLiBpdCdzIGJlZW5cbiAqICAgcmVuZGVyZWQgYnV0IGhhc24ndCBiZWVuIGludGVyYWN0ZWQgd2l0aCBvciB2YWxpZGF0ZWQgeWV0LlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5zdGF0dXMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuaXNQZW5kaW5nKCkpIHsgcmV0dXJuICdwZW5kaW5nJyB9XG4gIGlmICh0aGlzLmVycm9ycygpLmlzUG9wdWxhdGVkKCkpIHsgcmV0dXJuICdlcnJvcicgfVxuICBpZiAodGhpcy5pc0NsZWFuZWQoKSkgeyByZXR1cm4gJ3ZhbGlkJyB9XG4gIHJldHVybiAnZGVmYXVsdCdcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRmllbGQgRGF0YSA9PT1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGFuZCByZXR1cm5zIHRoZSBpZCBhdHRyaWJ1dGUgZm9yIHRoaXMgQm91bmRGaWVsZCBpZiB0aGUgYXNzb2NpYXRlZFxuICogZm9ybSBoYXMgYW4gYXV0b0lkLiBSZXR1cm5zIGFuIGVtcHR5IHN0cmluZyBvdGhlcndpc2UuXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmF1dG9JZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXV0b0lkID0gdGhpcy5mb3JtLmF1dG9JZFxuICBpZiAoYXV0b0lkKSB7XG4gICAgYXV0b0lkID0gJycrYXV0b0lkXG4gICAgaWYgKGF1dG9JZC5pbmRleE9mKCd7bmFtZX0nKSAhPSAtMSkge1xuICAgICAgcmV0dXJuIGZvcm1hdChhdXRvSWQsIHtuYW1lOiB0aGlzLmh0bWxOYW1lfSlcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaHRtbE5hbWVcbiAgfVxuICByZXR1cm4gJydcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHsqfSB1c2VyIGlucHV0IGRhdGEgZm9yIHRoZSBmaWVsZCwgb3IgbnVsbCBpZiBub25lIGhhcyBiZWVuIGdpdmVuLlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5kYXRhID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZpZWxkLndpZGdldC52YWx1ZUZyb21EYXRhKHRoaXMuZm9ybS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm0uZmlsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaHRtbE5hbWUpXG59XG5cbi8qKlxuICogQHJldHVybiB7RXJyb3JPYmplY3R9IGVycm9ycyBmb3IgdGhlIGZpZWxkLCB3aGljaCBtYXkgYmUgZW1wdHkuXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmVycm9ycyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5mb3JtLmVycm9ycyh0aGlzLm5hbWUpIHx8IG5ldyB0aGlzLmZvcm0uZXJyb3JDb25zdHJ1Y3RvcigpXG59XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nPX0gdGhlIGZpcnN0IGVycm9yIG1lc3NhZ2UgZm9yIHRoZSBmaWVsZCwgb3IgdW5kZWZpbmVkIGlmXG4gKiAgIHRoZXJlIHdlcmUgbm9uZS5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuZXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmVycm9ycygpLmZpcnN0KClcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtBcnJheS48c3RyaW5nPn0gYWxsIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgZmllbGQsIHdpbGwgYmUgZW1wdHkgaWZcbiAqICAgdGhlcmUgd2VyZSBub25lLlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5lcnJvck1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmVycm9ycygpLm1lc3NhZ2VzKClcbn1cblxuLyoqXG4gKiBHZXRzIG9yIGdlbmVyYXRlcyBhbiBpZCBmb3IgdGhlIGZpZWxkJ3MgPGxhYmVsPi5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuaWRGb3JMYWJlbCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkZ2V0ID0gdGhpcy5maWVsZC53aWRnZXRcbiAgdmFyIGlkID0gb2JqZWN0LmdldCh3aWRnZXQuYXR0cnMsICdpZCcsIHRoaXMuYXV0b0lkKCkpXG4gIHJldHVybiB3aWRnZXQuaWRGb3JMYWJlbChpZClcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHsqfSB0aGUgdmFsdWUgdG8gYmUgZGlzcGxheWVkIGluIHRoZSBmaWVsZCdzIHdpZGdldC5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRhdGFcbiAgaWYgKHRoaXMuZm9ybS5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICBkYXRhID0gdGhpcy5pbml0aWFsVmFsdWUoKVxuICB9XG4gIGVsc2Uge1xuICAgIGRhdGEgPSB0aGlzLmZpZWxkLmJvdW5kRGF0YSh0aGlzLmRhdGEoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmdldCh0aGlzLmZvcm0uaW5pdGlhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWVsZC5pbml0aWFsKSlcbiAgfVxuICByZXR1cm4gdGhpcy5maWVsZC5wcmVwYXJlVmFsdWUoZGF0YSlcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHsqfSB0aGUgaW5pdGlhbCB2YWx1ZSBmb3IgdGhlIGZpZWxkLCB3aWxsIGJlIG51bGwgaWYgbm9uZSB3YXNcbiAqICAgY29uZmlndXJlZCBvbiB0aGUgZmllbGQgb3IgZ2l2ZW4gdG8gdGhlIGZvcm0uXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmluaXRpYWxWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmFsdWUgPSBvYmplY3QuZ2V0KHRoaXMuZm9ybS5pbml0aWFsLCB0aGlzLm5hbWUsIHRoaXMuZmllbGQuaW5pdGlhbClcbiAgaWYgKGlzLkZ1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhbHVlID0gdmFsdWUoKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gUmVuZGVyaW5nID09PVxuXG4vKipcbiAqIFJlbmRlcnMgYSB3aWRnZXQgZm9yIHRoZSBmaWVsZC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIHdpZGdldHMgb3B0aW9ucy5cbiAqIEBwYXJhbSB7V2lkZ2V0fSBrd2FyZ3Mud2lkZ2V0IGFuIG92ZXJyaWRlIGZvciB0aGUgd2lkZ2V0IHVzZWQgdG8gcmVuZGVyIHRoZVxuICogICBmaWVsZCAtIGlmIG5vdCBwcm92aWRlZCwgdGhlIGZpZWxkJ3MgY29uZmlndXJlZCB3aWRnZXQgd2lsbCBiZSB1c2VkLlxuICogQHBhcmFtIHtPYmplY3R9IGt3YXJncy5hdHRycyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMgdG8gYmUgYWRkZWQgdG8gdGhlIGZpZWxkJ3NcbiAqICAgd2lkZ2V0LlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5hc1dpZGdldCA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICB3aWRnZXQ6IG51bGwsIGF0dHJzOiBudWxsLCBvbmx5SW5pdGlhbDogZmFsc2VcbiAgfSwga3dhcmdzKVxuICB2YXIgd2lkZ2V0ID0gKGt3YXJncy53aWRnZXQgIT09IG51bGwgPyBrd2FyZ3Mud2lkZ2V0IDogdGhpcy5maWVsZC53aWRnZXQpXG4gIHZhciBhdHRycyA9IChrd2FyZ3MuYXR0cnMgIT09IG51bGwgPyBrd2FyZ3MuYXR0cnMgOiB7fSlcbiAgdmFyIGF1dG9JZCA9IHRoaXMuYXV0b0lkKClcbiAgdmFyIG5hbWUgPSAha3dhcmdzLm9ubHlJbml0aWFsID8gdGhpcy5odG1sTmFtZSA6IHRoaXMuaHRtbEluaXRpYWxOYW1lXG4gIGlmIChhdXRvSWQgJiZcbiAgICAgIHR5cGVvZiBhdHRycy5pZCA9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIHdpZGdldC5hdHRycy5pZCA9PSAndW5kZWZpbmVkJykge1xuICAgIGF0dHJzLmlkID0gKCFrd2FyZ3Mub25seUluaXRpYWwgPyBhdXRvSWQgOiB0aGlzLmh0bWxJbml0aWFsSWQpXG4gIH1cbiAgaWYgKHR5cGVvZiBhdHRycy5rZXkgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBhdHRycy5rZXkgPSBuYW1lXG4gIH1cbiAgdmFyIGNvbnRyb2xsZWQgPSB0aGlzLl9pc0NvbnRyb2xsZWQod2lkZ2V0KVxuICB2YXIgdmFsaWRhdGlvbiA9IHRoaXMuX3ZhbGlkYXRpb24od2lkZ2V0KVxuXG4gIC8vIEFsd2F5cyBBZGQgYW4gb25DaGFuZ2UgZXZlbnQgaGFuZGxlciB0byB1cGRhdGUgZm9ybS5kYXRhIHdoZW4gdGhlIGZpZWxkIGlzXG4gIC8vIGNoYW5nZWQuXG4gIGF0dHJzLm9uQ2hhbmdlID0gdGhpcy5mb3JtLl9oYW5kbGVGaWVsZEV2ZW50LmJpbmQodGhpcy5mb3JtLCB7XG4gICAgZXZlbnQ6ICdvbkNoYW5nZSdcbiAgLCB2YWxpZGF0ZTogISF2YWxpZGF0aW9uLm9uQ2hhbmdlXG4gICwgZGVsYXk6IHZhbGlkYXRpb24ub25DaGFuZ2VEZWxheVxuICB9KVxuXG4gIC8vIElmIHZhbGlkYXRpb24gc2hvdWxkIGhhcHBlbiBvbiBldmVudHMgb3RoZXIgdGhhbiBvbkNoYW5nZSwgYWxzbyBhZGQgZXZlbnRcbiAgLy8gaGFuZGxlcnMgZm9yIHRoZW0uXG4gIGlmICh2YWxpZGF0aW9uICE9ICdtYW51YWwnICYmIHZhbGlkYXRpb24uZXZlbnRzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWxpZGF0aW9uLmV2ZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBldmVudE5hbWUgPSB2YWxpZGF0aW9uLmV2ZW50c1tpXVxuICAgICAgYXR0cnNbZXZlbnROYW1lXSA9XG4gICAgICAgIHRoaXMuZm9ybS5faGFuZGxlRmllbGRFdmVudC5iaW5kKHRoaXMuZm9ybSwge2V2ZW50OiBldmVudE5hbWV9KVxuICAgIH1cbiAgfVxuXG4gIHZhciByZW5kZXJLd2FyZ3MgPSB7YXR0cnM6IGF0dHJzLCBjb250cm9sbGVkOiBjb250cm9sbGVkfVxuICBpZiAod2lkZ2V0Lm5lZWRzSW5pdGlhbFZhbHVlKSB7XG4gICAgcmVuZGVyS3dhcmdzLmluaXRpYWxWYWx1ZSA9IHRoaXMuaW5pdGlhbFZhbHVlKClcbiAgfVxuICByZXR1cm4gd2lkZ2V0LnJlbmRlcihuYW1lLCB0aGlzLnZhbHVlKCksIHJlbmRlckt3YXJncylcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBmaWVsZCBhcyBhIGhpZGRlbiBmaWVsZC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIHdpZGdldCBvcHRpb25zLlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5hc0hpZGRlbiA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHt9LCBrd2FyZ3MsIHt3aWRnZXQ6IG5ldyB0aGlzLmZpZWxkLmhpZGRlbldpZGdldCgpfSlcbiAgcmV0dXJuIHRoaXMuYXNXaWRnZXQoa3dhcmdzKVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZpZWxkIGFzIGEgdGV4dCBpbnB1dC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIHdpZGdldCBvcHRpb25zLlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5hc1RleHQgPSBmdW5jdGlvbihrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7fSwga3dhcmdzLCB7d2lkZ2V0OiB3aWRnZXRzLlRleHRJbnB1dCgpfSlcbiAgcmV0dXJuIHRoaXMuYXNXaWRnZXQoa3dhcmdzKVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZpZWxkIGFzIGEgdGV4dGFyZWEuXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJncyB3aWRnZXQgb3B0aW9ucy5cbiAqIEByZXR1cm4ge1JlYWN0RWxlbWVudH1cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuYXNUZXh0YXJlYSA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHt9LCBrd2FyZ3MsIHt3aWRnZXQ6IHdpZGdldHMuVGV4dGFyZWEoKX0pXG4gIHJldHVybiB0aGlzLmFzV2lkZ2V0KGt3YXJncylcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIENTUyBjbGFzc2VzIGZvciB0aGlzIGZpZWxkIGJhc2VkIG9uIHdoYXQncyBjb25maWd1cmVkIGluIHRoZSBmaWVsZFxuICogYW5kIGZvcm0sIGFuZCB0aGUgZmllbGQncyBjdXJyZW50IHN0YXR1cy5cbiAqIEBwYXJhbSB7c3RyaW5nPX0gZXh0cmFDc3NDbGFzc2VzIGFkZGl0aW9uYWwgQ1NTIGNsYXNzZXMgZm9yIHRoZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIGZvciB0aGlzIGZpZWxkLlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5jc3NDbGFzc2VzID0gZnVuY3Rpb24oZXh0cmFDc3NDbGFzc2VzKSB7XG4gIHZhciBjc3NDbGFzc2VzID0gKGV4dHJhQ3NzQ2xhc3NlcyA/IFtleHRyYUNzc0NsYXNzZXNdIDogW10pXG5cbiAgLy8gRmllbGQvcm93IGNsYXNzZXNcbiAgaWYgKHRoaXMuZmllbGQuY3NzQ2xhc3MgIT09IG51bGwpIHtcbiAgICBjc3NDbGFzc2VzLnB1c2godGhpcy5maWVsZC5jc3NDbGFzcylcbiAgfVxuICBpZiAodHlwZW9mIHRoaXMuZm9ybS5yb3dDc3NDbGFzcyAhPSAndW5kZWZpbmVkJykge1xuICAgIGNzc0NsYXNzZXMucHVzaCh0aGlzLmZvcm0ucm93Q3NzQ2xhc3MpXG4gIH1cblxuICAvLyBTdGF0dXMgY2xhc3NcbiAgdmFyIHN0YXR1cyA9IHRoaXMuc3RhdHVzKClcbiAgaWYgKHR5cGVvZiB0aGlzLmZvcm1bc3RhdHVzICsgJ0Nzc0NsYXNzJ10gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjc3NDbGFzc2VzLnB1c2godGhpcy5mb3JtW3N0YXR1cyArICdDc3NDbGFzcyddKVxuICB9XG5cbiAgLy8gUmVxdWlyZWQtbmVzcyBjbGFzc2VzXG4gIGlmICh0aGlzLmZpZWxkLnJlcXVpcmVkKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmZvcm0ucmVxdWlyZWRDc3NDbGFzcyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgY3NzQ2xhc3Nlcy5wdXNoKHRoaXMuZm9ybS5yZXF1aXJlZENzc0NsYXNzKVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0eXBlb2YgdGhpcy5mb3JtLm9wdGlvbmFsQ3NzQ2xhc3MgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjc3NDbGFzc2VzLnB1c2godGhpcy5mb3JtLm9wdGlvbmFsQ3NzQ2xhc3MpXG4gIH1cblxuICByZXR1cm4gY3NzQ2xhc3Nlcy5qb2luKCcgJylcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgdGFnIGNvbnRhaW5pbmcgaGVscCB0ZXh0IGZvciB0aGUgZmllbGQuXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJncyBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gKiBAcGFyYW0ge3N0cmluZ30ga3dhcmdzLnRhZ05hbWUgYWxsb3dzIG92ZXJyaWRpbmcgdGhlIHR5cGUgb2YgdGFnIC0gZGVmYXVsdHNcbiAqICAgdG8gJ3NwYW4nLlxuICogQHBhcmFtIHtzdHJpbmd9IGt3YXJncy5jb250ZW50cyBoZWxwIHRleHQgY29udGVudHMgLSBpZiBub3QgcHJvdmlkZWQsXG4gKiAgIGNvbnRlbnRzIHdpbGwgYmUgdGFrZW4gZnJvbSB0aGUgZmllbGQgaXRzZWxmLiBUbyByZW5kZXIgcmF3IEhUTUwgaW4gaGVscFxuICogICB0ZXh0LCBpdCBzaG91bGQgYmUgc3BlY2lmaWVkIHVzaW5nIHRoZSBSZWFjdCBjb252ZW50aW9uIGZvciByYXcgSFRNTCxcbiAqICAgd2hpY2ggaXMgdG8gcHJvdmlkZSBhbiBvYmplY3Qgd2l0aCBhIF9faHRtbCBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBrd2FyZ3MuYXR0cnMgYWRkaXRpb25hbCBhdHRyaWJ1dGVzIHRvIGJlIGFkZGVkIHRvIHRoZSB0YWcgLVxuICogICBieSBkZWZhdWx0IGl0IHdpbGwgZ2V0IGEgY2xhc3NOYW1lIG9mICdoZWxwVGV4dCdcbiAqIEByZXR1cm4ge1JlYWN0RWxlbWVudH1cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuaGVscFRleHRUYWcgPSBmdW5jdGlvbihrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7XG4gICAgdGFnTmFtZTogJ3NwYW4nLCBhdHRyczogbnVsbCwgY29udGVudHM6IHRoaXMuaGVscFRleHRcbiAgfSwga3dhcmdzKVxuICBpZiAoa3dhcmdzLmNvbnRlbnRzKSB7XG4gICAgdmFyIGF0dHJzID0gb2JqZWN0LmV4dGVuZCh7Y2xhc3NOYW1lOiAnaGVscFRleHQnfSwga3dhcmdzLmF0dHJzKVxuICAgIHZhciBjb250ZW50cyA9IGt3YXJncy5jb250ZW50c1xuICAgIGlmIChpcy5PYmplY3QoY29udGVudHMpICYmIG9iamVjdC5oYXNPd24oY29udGVudHMsICdfX2h0bWwnKSkge1xuICAgICAgYXR0cnMuZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwgPSBjb250ZW50c1xuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoa3dhcmdzLnRhZ05hbWUsIGF0dHJzKVxuICAgIH1cbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChrd2FyZ3MudGFnTmFtZSwgYXR0cnMsIGNvbnRlbnRzKVxuICB9XG59XG5cbi8qKlxuICogV3JhcHMgdGhlIGdpdmVuIGNvbnRlbnRzIGluIGEgPGxhYmVsPiBpZiB0aGUgZmllbGQgaGFzIGFuIGlkIGF0dHJpYnV0ZS4gSWZcbiAqIGNvbnRlbnRzIGFyZW4ndCBnaXZlbiwgdXNlcyB0aGUgZmllbGQncyBsYWJlbC5cbiAqIElmIGF0dHJzIGFyZSBnaXZlbiwgdGhleSdyZSB1c2VkIGFzIEhUTUwgYXR0cmlidXRlcyBvbiB0aGUgPGxhYmVsPiB0YWcuXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJncyBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gKiBAcGFyYW0ge3N0cmluZ30ga3dhcmdzLmNvbnRlbnRzIGNvbnRlbnRzIGZvciB0aGUgbGFiZWwgLSBpZiBub3QgcHJvdmlkZWQsXG4gKiAgIGxhYmVsIGNvbnRlbnRzIHdpbGwgYmUgZ2VuZXJhdGVkIGZyb20gdGhlIGZpZWxkIGl0c2VsZi5cbiAqIEBwYXJhbSB7T2JqZWN0fSBrd2FyZ3MuYXR0cnMgYWRkaXRpb25hbCBhdHRyaWJ1dGVzIHRvIGJlIGFkZGVkIHRvIHRoZSBsYWJlbC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrd2FyZ3MubGFiZWxTdWZmaXggYWxsb3dzIG92ZXJyaWRpbmcgdGhlIGZvcm0ncyBsYWJlbFN1ZmZpeC5cbiAqIEByZXR1cm4ge1JlYWN0RWxlbWVudH1cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUubGFiZWxUYWcgPSBmdW5jdGlvbihrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7XG4gICAgY29udGVudHM6IHRoaXMubGFiZWwsIGF0dHJzOiBudWxsLCBsYWJlbFN1ZmZpeDogdGhpcy5mb3JtLmxhYmVsU3VmZml4XG4gIH0sIGt3YXJncylcbiAgdmFyIGNvbnRlbnRzID0gdGhpcy5fYWRkTGFiZWxTdWZmaXgoa3dhcmdzLmNvbnRlbnRzLCBrd2FyZ3MubGFiZWxTdWZmaXgpXG4gIHZhciB3aWRnZXQgPSB0aGlzLmZpZWxkLndpZGdldFxuICB2YXIgaWQgPSBvYmplY3QuZ2V0KHdpZGdldC5hdHRycywgJ2lkJywgdGhpcy5hdXRvSWQoKSlcbiAgaWYgKGlkKSB7XG4gICAgdmFyIGF0dHJzID0gb2JqZWN0LmV4dGVuZChrd2FyZ3MuYXR0cnMgfHwge30sIHtodG1sRm9yOiB3aWRnZXQuaWRGb3JMYWJlbChpZCl9KVxuICAgIGNvbnRlbnRzID0gUmVhY3QuY3JlYXRlRWxlbWVudCgnbGFiZWwnLCBhdHRycywgY29udGVudHMpXG4gIH1cbiAgcmV0dXJuIGNvbnRlbnRzXG59XG5cbi8qKlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihrd2FyZ3MpIHtcbiAgaWYgKHRoaXMuZmllbGQuc2hvd0hpZGRlbkluaXRpYWwpIHtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgbnVsbCwgdGhpcy5hc1dpZGdldChrd2FyZ3MpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXNIaWRkZW4oe29ubHlJbml0aWFsOiB0cnVlfSkpXG4gIH1cbiAgcmV0dXJuIHRoaXMuYXNXaWRnZXQoa3dhcmdzKVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIFN1YldpZGdldHMgdGhhdCBjb21wcmlzZSBhbGwgd2lkZ2V0cyBpbiB0aGlzIEJvdW5kRmllbGQuXG4gKiBUaGlzIHJlYWxseSBpcyBvbmx5IHVzZWZ1bCBmb3IgUmFkaW9TZWxlY3QgYW5kIENoZWNrYm94U2VsZWN0TXVsdGlwbGVcbiAqIHdpZGdldHMsIHNvIHRoYXQgeW91IGNhbiBpdGVyYXRlIG92ZXIgaW5kaXZpZHVhbCBpbnB1dHMgd2hlbiByZW5kZXJpbmcuXG4gKiBAcmV0dXJuIHtBcnJheS48U3ViV2lkZ2V0Pn1cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuc3ViV2lkZ2V0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWQgPSB0aGlzLmZpZWxkLndpZGdldC5hdHRycy5pZCB8fCB0aGlzLmF1dG9JZCgpXG4gIHZhciBrd2FyZ3MgPSB7YXR0cnM6IHt9fVxuICBpZiAoaWQpIHtcbiAgICBrd2FyZ3MuYXR0cnMuaWQgPSBpZFxuICB9XG4gIHJldHVybiB0aGlzLmZpZWxkLndpZGdldC5zdWJXaWRnZXRzKHRoaXMuaHRtbE5hbWUsIHRoaXMudmFsdWUoKSwga3dhcmdzKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuX2FkZExhYmVsU3VmZml4ID0gZnVuY3Rpb24obGFiZWwsIGxhYmVsU3VmZml4KSB7XG4gIC8vIE9ubHkgYWRkIHRoZSBzdWZmaXggaWYgdGhlIGxhYmVsIGRvZXMgbm90IGVuZCBpbiBwdW5jdHVhdGlvblxuICBpZiAobGFiZWxTdWZmaXggJiYgJzo/LiEnLmluZGV4T2YobGFiZWwuY2hhckF0KGxhYmVsLmxlbmd0aCAtIDEpKSA9PSAtMSkge1xuICAgIHJldHVybiBsYWJlbCArIGxhYmVsU3VmZml4XG4gIH1cbiAgcmV0dXJuIGxhYmVsXG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgd2lkZ2V0IHNob3VsZCBiZSBhIGNvbnRyb2xsZWQgb3IgdW5jb250cm9sbGVkIFJlYWN0XG4gKiBjb21wb25lbnQuXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5faXNDb250cm9sbGVkID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgd2lkZ2V0ID0gdGhpcy5maWVsZC53aWRnZXRcbiAgfVxuICB2YXIgY29udHJvbGxlZCA9IGZhbHNlXG4gIGlmICh3aWRnZXQuaXNWYWx1ZVNldHRhYmxlKSB7XG4gICAgLy8gSWYgdGhlIGZpZWxkIGhhcyBhbnkgY29udHJvbGxlZCBjb25maWcgc2V0LCBpdCBzaG91bGQgdGFrZSBwcmVjZWRlbmNlLFxuICAgIC8vIG90aGVyd2lzZSB1c2UgdGhlIGZvcm0ncyBhcyBpdCBoYXMgYSBkZWZhdWx0LlxuICAgIGNvbnRyb2xsZWQgPSAodGhpcy5maWVsZC5jb250cm9sbGVkICE9PSBudWxsXG4gICAgICAgICAgICAgICAgICA/IHRoaXMuZmllbGQuY29udHJvbGxlZFxuICAgICAgICAgICAgICAgICAgOiB0aGlzLmZvcm0uY29udHJvbGxlZClcbiAgfVxuICByZXR1cm4gY29udHJvbGxlZFxufVxuXG4vKipcbiAqIEdldHMgdGhlIGNvbmZpZ3VyZWQgdmFsaWRhdGlvbiBmb3IgdGhlIGZpZWxkIG9yIGZvcm0sIGFsbG93aW5nIHRoZSB3aWRnZXRcbiAqIHdoaWNoIGlzIGdvaW5nIHRvIGJlIHJlbmRlcmVkIHRvIG92ZXJyaWRlIGl0IGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7V2lkZ2V0PX0gd2lkZ2V0XG4gKiBAcmV0dXJuIHs/KE9iamVjdHxzdHJpbmcpfVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5fdmFsaWRhdGlvbiA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHdpZGdldCA9IHRoaXMuZmllbGQud2lkZ2V0XG4gIH1cbiAgLy8gSWYgdGhlIGZpZWxkIGhhcyBhbnkgdmFsaWRhdGlvbiBjb25maWcgc2V0LCBpdCBzaG91bGQgdGFrZSBwcmVjZWRlbmNlLFxuICAvLyBvdGhlcndpc2UgdXNlIHRoZSBmb3JtJ3MgYXMgaXQgaGFzIGEgZGVmYXVsdC5cbiAgdmFyIHZhbGlkYXRpb24gPSB0aGlzLmZpZWxkLnZhbGlkYXRpb24gfHwgdGhpcy5mb3JtLnZhbGlkYXRpb25cbiAgLy8gQWxsb3cgd2lkZ2V0cyB0byBvdmVycmlkZSB0aGUgdHlwZSBvZiB2YWxpZGF0aW9uIHRoYXQncyB1c2VkIGZvciB0aGVtIC1cbiAgLy8gcHJpbWFyaWx5IGZvciBpbnB1dHMgd2hpY2ggY2FuIG9ubHkgYmUgY2hhbmdlZCBieSBjbGljay9zZWxlY3Rpb24uXG4gIGlmICh2YWxpZGF0aW9uICE9PSAnbWFudWFsJyAmJiB3aWRnZXQudmFsaWRhdGlvbiAhPT0gbnVsbCkge1xuICAgIHZhbGlkYXRpb24gPSB3aWRnZXQudmFsaWRhdGlvblxuICB9XG4gIHJldHVybiB2YWxpZGF0aW9uXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm91bmRGaWVsZCIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgdmFsaWRhdG9ycyA9IHJlcXVpcmUoJ3ZhbGlkYXRvcnMnKVxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbClcblxudmFyIFZhbGlkYXRpb25FcnJvciA9IHZhbGlkYXRvcnMuVmFsaWRhdGlvbkVycm9yXG5cbi8qKlxuICogQSBsaXN0IG9mIGVycm9ycyB3aGljaCBrbm93cyBob3cgdG8gZGlzcGxheSBpdHNlbGYgaW4gdmFyaW91cyBmb3JtYXRzLlxuICogQHBhcmFtIHtBcnJheT19IGxpc3QgYSBsaXN0IG9mIGVycm9ycy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgRXJyb3JMaXN0ID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBFcnJvckxpc3QobGlzdCkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBFcnJvckxpc3QpKSB7IHJldHVybiBuZXcgRXJyb3JMaXN0KGxpc3QpIH1cbiAgICB0aGlzLmRhdGEgPSBsaXN0IHx8IFtdXG4gIH1cbn0pXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheS48T2JqZWN0Pn0gbGlzdFxuICogQHJldHVybiB7RXJyb3JMaXN0fVxuICovXG5FcnJvckxpc3QuZnJvbUpTT04gPSBmdW5jdGlvbihsaXN0KSB7XG4gIHZhciByZXN1bHQgPSBuZXcgRXJyb3JMaXN0KClcbiAgcmVzdWx0LmZyb21KU09OKGxpc3QpXG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBBZGRzIG1vcmUgZXJyb3JzLlxuICogQHBhcmFtIHtBcnJheX0gZXJyb3JMaXN0IGEgbGlzdCBvZiBlcnJvcnMuXG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24oZXJyb3JMaXN0KSB7XG4gIHRoaXMuZGF0YS5wdXNoLmFwcGx5KHRoaXMuZGF0YSwgZXJyb3JMaXN0KVxufVxuXG4vKipcbiAqIEByZXR1cm4ge251bWJlcn0gdGhlIG51bWJlciBvZiBlcnJvcnMuXG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhbnkgZXJyb3JzIGFyZSBwcmVzZW50LlxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmlzUG9wdWxhdGVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5sZW5ndGgoKSA+IDApXG59XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgZmlyc3QgbWVzc2FnZSBoZWxkIGluIHRoaXMgRXJyb3JMaXN0LlxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmZpcnN0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRhdGEubGVuZ3RoID4gMCkge1xuICAgIHZhciBlcnJvciA9IHRoaXMuZGF0YVswXVxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikge1xuICAgICAgZXJyb3IgPSBlcnJvci5tZXNzYWdlcygpWzBdXG4gICAgfVxuICAgIHJldHVybiBlcnJvclxuICB9XG59XG5cbi8qKlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IHRoZSBsaXN0IG9mIG1lc3NhZ2VzIGhlbGQgaW4gdGhpcyBFcnJvckxpc3QuXG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUubWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1lc3NhZ2VzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGVycm9yID0gdGhpcy5kYXRhW2ldXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICBlcnJvciA9IGVycm9yLm1lc3NhZ2VzKClbMF1cbiAgICB9XG4gICAgbWVzc2FnZXMucHVzaChlcnJvcilcbiAgfVxuICByZXR1cm4gbWVzc2FnZXNcbn1cblxuLyoqXG4gKiBEZWZhdWx0IGRpc3BsYXkgaXMgYXMgYSBsaXN0LlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5hc1VsKClcbn1cblxuLyoqXG4gKiBEaXNwbGF5cyBlcnJvcnMgYXMgYSBsaXN0LlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmFzVWwgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmlzUG9wdWxhdGVkKCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7Y2xhc3NOYW1lOiAnZXJyb3JsaXN0J31cbiAgLCB0aGlzLm1lc3NhZ2VzKCkubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCBudWxsLCBlcnJvcilcbiAgICB9KVxuICApXG59XG5cbi8qKlxuICogRGlzcGxheXMgZXJyb3JzIGFzIHRleHQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUuYXNUZXh0ID0gRXJyb3JMaXN0LnByb3RvdHlwZS50b1N0cmluZyA9ZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLm1lc3NhZ2VzKCkubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgcmV0dXJuICcqICcgKyBlcnJvclxuICB9KS5qb2luKCdcXG4nKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmFzRGF0YSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5kYXRhXG59XG5cbi8qKlxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFZhbGlkYXRpb25FcnJvcih0aGlzLmRhdGEpLmVycm9yTGlzdC5tYXAoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZXMoKVswXVxuICAgICwgY29kZTogZXJyb3IuY29kZSB8fCAnJ1xuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5LjxPYmplY3Q+fSBsaXN0XG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUuZnJvbUpTT04gPSBmdW5jdGlvbihsaXN0KSB7XG4gIHRoaXMuZGF0YSA9IGxpc3QubWFwKGZ1bmN0aW9uKGVycikge1xuICAgIHJldHVybiBuZXcgVmFsaWRhdGlvbkVycm9yKGVyci5tZXNzYWdlLCB7Y29kZTogZXJyLmNvZGV9KVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVycm9yTGlzdFxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbClcblxudmFyIEVycm9yTGlzdCA9IHJlcXVpcmUoJy4vRXJyb3JMaXN0JylcblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgZmllbGQgZXJyb3JzIHRoYXQga25vd3MgaG93IHRvIGRpc3BsYXkgaXRzZWxmIGluIHZhcmlvdXNcbiAqIGZvcm1hdHMuIFRoaXMgb2JqZWN0J3MgLmVycm9yIHByb3BlcnRpZXMgYXJlIHRoZSBmaWVsZCBuYW1lcyBhbmRcbiAqIGNvcnJlc3BvbmRpbmcgdmFsdWVzIGFyZSB0aGUgZXJyb3JzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyb3JzXG4gKi9cbnZhciBFcnJvck9iamVjdCA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRXJyb3JPYmplY3QoZXJyb3JzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEVycm9yT2JqZWN0KSkgeyByZXR1cm4gbmV3IEVycm9yT2JqZWN0KGVycm9ycykgfVxuICAgIHRoaXMuZXJyb3JzID0gZXJyb3JzIHx8IHt9XG4gIH1cbn0pXG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IGpzb25PYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBlcnJvckNvbnN0cnVjdG9yXG4gKiBAcmV0dXJuIHtFcnJvck9iamVjdH1cbiAqL1xuRXJyb3JPYmplY3QuZnJvbUpTT04gPSBmdW5jdGlvbihqc29uT2JqLCBlcnJvckNvbnN0cnVjdG9yKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgRXJyb3JPYmplY3QoKVxuICByZXN1bHQuZnJvbUpTT04oanNvbk9iaiwgZXJyb3JDb25zdHJ1Y3RvcilcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFxuICogQHBhcmFtIHtFcnJvckxpc3R9IGVycm9yXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihmaWVsZCwgZXJyb3IpIHtcbiAgdGhpcy5lcnJvcnNbZmllbGRdID0gZXJyb3Jcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge0Vycm9yTGlzdH1cbiAqL1xuRXJyb3JPYmplY3QucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiB0aGlzLmVycm9yc1tmaWVsZF1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlcmUgd2VyZSBlcnJvcnMgZm9yIHRoZSBnaXZlbiBmaWVsZC5cbiAqL1xuRXJyb3JPYmplY3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiBkZWxldGUgdGhpcy5lcnJvcnNbZmllbGRdXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gZmllbGRzXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbihmaWVsZHMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgZGVsZXRlIHRoaXMuZXJyb3JzW2ZpZWxkc1tpXV1cbiAgfVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZpZWxkIGhhcyBlcnJvcnMuXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5oYXNGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiBvYmplY3QuaGFzT3duKHRoaXMuZXJyb3JzLCBmaWVsZClcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzKS5sZW5ndGhcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGFueSBlcnJvcnMgYXJlIHByZXNlbnQuXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5pc1BvcHVsYXRlZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHRoaXMubGVuZ3RoKCkgPiAwKVxufVxuXG4vKipcbiAqIERlZmF1bHQgZGlzcGxheSBpcyBhcyBhIGxpc3QuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYXNVbCgpXG59XG5cbi8qKlxuICogRGlzcGxheXMgZXJyb3IgZGV0YWlscyBhcyBhIGxpc3QuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5hc1VsID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtcyA9IE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzKS5tYXAoZnVuY3Rpb24oZmllbGQpIHtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCBudWxsLCBmaWVsZCwgdGhpcy5lcnJvcnNbZmllbGRdLmFzVWwoKSlcbiAgfS5iaW5kKHRoaXMpKVxuICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSB7IHJldHVybiB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHtjbGFzc05hbWU6ICdlcnJvcmxpc3QnfSwgaXRlbXMpXG59XG5cbi8qKlxuICogRGlzcGxheXMgZXJyb3IgZGV0YWlscyBhcyB0ZXh0LlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5FcnJvck9iamVjdC5wcm90b3R5cGUuYXNUZXh0ID0gRXJyb3JPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVycm9ycykubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgdmFyIG1lc3NhZ2VzID0gdGhpcy5lcnJvcnNbZmllbGRdLm1lc3NhZ2VzKClcbiAgICByZXR1cm4gWycqICcgKyBmaWVsZF0uY29uY2F0KG1lc3NhZ2VzLm1hcChmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICByZXR1cm4gKCcgICogJyArIG1lc3NhZ2UpXG4gICAgfSkpLmpvaW4oJ1xcbicpXG4gIH0uYmluZCh0aGlzKSkuam9pbignXFxuJylcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5hc0RhdGEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRhdGEgPSB7fVxuICBPYmplY3Qua2V5cyh0aGlzLmVycm9ycykubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgZGF0YVtmaWVsZF0gPSB0aGlzLmVycm9yc1tmaWVsZF0uYXNEYXRhKClcbiAgfS5iaW5kKHRoaXMpKVxuICByZXR1cm4gZGF0YVxufVxuXG4vKipcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuRXJyb3JPYmplY3QucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICB2YXIganNvbk9iaiA9IHt9XG4gIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzKS5tYXAoZnVuY3Rpb24oZmllbGQpIHtcbiAgICBqc29uT2JqW2ZpZWxkXSA9IHRoaXMuZXJyb3JzW2ZpZWxkXS50b0pTT04oKVxuICB9LmJpbmQodGhpcykpXG4gIHJldHVybiBqc29uT2JqXG59XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IGpzb25PYmpcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBlcnJvckNvbnN0cnVjdG9yXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5mcm9tSlNPTiA9IGZ1bmN0aW9uKGpzb25PYmosIGVycm9yQ29uc3RydWN0b3IpIHtcbiAgZXJyb3JDb25zdHJ1Y3RvciA9IGVycm9yQ29uc3RydWN0b3IgfHwgRXJyb3JMaXN0XG4gIHRoaXMuZXJyb3JzID0ge31cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyhqc29uT2JqKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbCA7IGkrKykge1xuICAgIHZhciBmaWVsZE5hbWUgPSBmaWVsZE5hbWVzW2ldXG4gICAgdGhpcy5lcnJvcnNbZmllbGROYW1lXSA9IGVycm9yQ29uc3RydWN0b3IuZnJvbUpTT04oanNvbk9ialtmaWVsZE5hbWVdKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRXJyb3JPYmplY3RcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJyb3dzZXI6IHR5cGVvZiBwcm9jZXNzID09ICd1bmRlZmluZWQnXG59IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciBpcyA9IHJlcXVpcmUoJ2lzb21vcnBoL2lzJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIHRpbWUgPSByZXF1aXJlKCdpc29tb3JwaC90aW1lJylcbnZhciB1cmwgPSByZXF1aXJlKCdpc29tb3JwaC91cmwnKVxudmFyIHZhbGlkYXRvcnMgPSByZXF1aXJlKCd2YWxpZGF0b3JzJylcblxudmFyIGVudiA9IHJlcXVpcmUoJy4vZW52JylcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJylcbnZhciBsb2NhbGVzID0gcmVxdWlyZSgnLi9sb2NhbGVzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJylcblxudmFyIFZhbGlkYXRpb25FcnJvciA9IHZhbGlkYXRvcnMuVmFsaWRhdGlvbkVycm9yXG52YXIgV2lkZ2V0ID0gd2lkZ2V0cy5XaWRnZXRcbnZhciBjbGVhbklQdjZBZGRyZXNzID0gdmFsaWRhdG9ycy5pcHY2LmNsZWFuSVB2NkFkZHJlc3NcblxuLyoqXG4gKiBBbiBvYmplY3QgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgZG9pbmcgdmFsaWRhdGlvbiBhbmQgbm9ybWFsaXNhdGlvbiwgb3JcbiAqIFwiY2xlYW5pbmdcIiwgZm9yIGV4YW1wbGU6IGFuIEVtYWlsRmllbGQgbWFrZXMgc3VyZSBpdHMgZGF0YSBpcyBhIHZhbGlkXG4gKiBlLW1haWwgYWRkcmVzcyBhbmQgbWFrZXMgc3VyZSB0aGF0IGFjY2VwdGFibGUgXCJibGFua1wiIHZhbHVlcyBhbGwgaGF2ZSB0aGVcbiAqIHNhbWUgcmVwcmVzZW50YXRpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBGaWVsZCA9IENvbmN1ci5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuVGV4dElucHV0ICAgICAgICAgLy8gRGVmYXVsdCB3aWRnZXQgdG8gdXNlIHdoZW4gcmVuZGVyaW5nIHRoaXMgdHlwZSBvZiBGaWVsZFxuLCBoaWRkZW5XaWRnZXQ6IHdpZGdldHMuSGlkZGVuSW5wdXQgLy8gRGVmYXVsdCB3aWRnZXQgdG8gdXNlIHdoZW4gcmVuZGVyaW5nIHRoaXMgYXMgXCJoaWRkZW5cIlxuLCBkZWZhdWx0VmFsaWRhdG9yczogW10gICAgICAgICAgICAgLy8gRGVmYXVsdCBsaXN0IG9mIHZhbGlkYXRvcnNcbiAgLy8gQWRkIGFuICdpbnZhbGlkJyBlbnRyeSB0byBkZWZhdWx0RXJyb3JNZXNzYWdlcyBpZiB5b3Ugd2FudCBhIHNwZWNpZmljXG4gIC8vIGZpZWxkIGVycm9yIG1lc3NhZ2Ugbm90IHJhaXNlZCBieSB0aGUgZmllbGQgdmFsaWRhdG9ycy5cbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICByZXF1aXJlZDogJ1RoaXMgZmllbGQgaXMgcmVxdWlyZWQuJ1xuICB9XG4sIGVtcHR5VmFsdWVzOiB2YWxpZGF0b3JzLkVNUFRZX1ZBTFVFUy5zbGljZSgpXG4sIGVtcHR5VmFsdWVBcnJheTogdHJ1ZSAvLyBTaG91bGQgaXNFbXB0eVZhbHVlIGNoZWNrIGZvciBlbXB0eSBBcnJheXM/XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEZpZWxkKGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgcmVxdWlyZWQ6IHRydWUsIHdpZGdldDogbnVsbCwgbGFiZWw6IG51bGwsIGluaXRpYWw6IG51bGwsXG4gICAgICBoZWxwVGV4dDogbnVsbCwgZXJyb3JNZXNzYWdlczogbnVsbCwgc2hvd0hpZGRlbkluaXRpYWw6IGZhbHNlLFxuICAgICAgdmFsaWRhdG9yczogW10sIGNzc0NsYXNzOiBudWxsLCB2YWxpZGF0aW9uOiBudWxsLCBjb250cm9sbGVkOiBudWxsLFxuICAgICAgY3VzdG9tOiBudWxsXG4gICAgfSwga3dhcmdzKVxuICAgIHRoaXMucmVxdWlyZWQgPSBrd2FyZ3MucmVxdWlyZWRcbiAgICB0aGlzLmxhYmVsID0ga3dhcmdzLmxhYmVsXG4gICAgdGhpcy5pbml0aWFsID0ga3dhcmdzLmluaXRpYWxcbiAgICB0aGlzLnNob3dIaWRkZW5Jbml0aWFsID0ga3dhcmdzLnNob3dIaWRkZW5Jbml0aWFsXG4gICAgdGhpcy5oZWxwVGV4dCA9IGt3YXJncy5oZWxwVGV4dCB8fCAnJ1xuICAgIHRoaXMuY3NzQ2xhc3MgPSBrd2FyZ3MuY3NzQ2xhc3NcbiAgICB0aGlzLnZhbGlkYXRpb24gPSB1dGlsLm5vcm1hbGlzZVZhbGlkYXRpb24oa3dhcmdzLnZhbGlkYXRpb24pXG4gICAgdGhpcy5jb250cm9sbGVkID0ga3dhcmdzLmNvbnRyb2xsZWRcbiAgICB0aGlzLmN1c3RvbSA9IGt3YXJncy5jdXN0b21cblxuICAgIHZhciB3aWRnZXQgPSBrd2FyZ3Mud2lkZ2V0IHx8IHRoaXMud2lkZ2V0XG4gICAgaWYgKCEod2lkZ2V0IGluc3RhbmNlb2YgV2lkZ2V0KSkge1xuICAgICAgLy8gV2UgbXVzdCBoYXZlIGEgV2lkZ2V0IGNvbnN0cnVjdG9yLCBzbyBjb25zdHJ1Y3Qgd2l0aCBpdFxuICAgICAgd2lkZ2V0ID0gbmV3IHdpZGdldCgpXG4gICAgfVxuICAgIC8vIExldCB0aGUgd2lkZ2V0IGtub3cgd2hldGhlciBpdCBzaG91bGQgZGlzcGxheSBhcyByZXF1aXJlZFxuICAgIHdpZGdldC5pc1JlcXVpcmVkID0gdGhpcy5yZXF1aXJlZFxuICAgIC8vIEhvb2sgaW50byB0aGlzLndpZGdldEF0dHJzKCkgZm9yIGFueSBGaWVsZC1zcGVjaWZpYyBIVE1MIGF0dHJpYnV0ZXNcbiAgICBvYmplY3QuZXh0ZW5kKHdpZGdldC5hdHRycywgdGhpcy53aWRnZXRBdHRycyh3aWRnZXQpKVxuICAgIHRoaXMud2lkZ2V0ID0gd2lkZ2V0XG5cbiAgICAvLyBJbmNyZW1lbnQgdGhlIGNyZWF0aW9uIGNvdW50ZXIgYW5kIHNhdmUgb3VyIGxvY2FsIGNvcHlcbiAgICB0aGlzLmNyZWF0aW9uQ291bnRlciA9IEZpZWxkLmNyZWF0aW9uQ291bnRlcisrXG5cbiAgICAvLyBDb3B5IGVycm9yIG1lc3NhZ2VzIGZvciB0aGlzIGluc3RhbmNlIGludG8gYSBuZXcgb2JqZWN0IGFuZCBvdmVycmlkZVxuICAgIC8vIHdpdGggYW55IHByb3ZpZGVkIGVycm9yIG1lc3NhZ2VzLlxuICAgIHZhciBtZXNzYWdlcyA9IFt7fV1cbiAgICBmb3IgKHZhciBpID0gdGhpcy5jb25zdHJ1Y3Rvci5fX21yb19fLmxlbmd0aCAtIDE7IGkgPj0wOyBpLS0pIHtcbiAgICAgIG1lc3NhZ2VzLnB1c2gob2JqZWN0LmdldCh0aGlzLmNvbnN0cnVjdG9yLl9fbXJvX19baV0ucHJvdG90eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkZWZhdWx0RXJyb3JNZXNzYWdlcycsIG51bGwpKVxuICAgIH1cbiAgICBtZXNzYWdlcy5wdXNoKGt3YXJncy5lcnJvck1lc3NhZ2VzKVxuICAgIHRoaXMuZXJyb3JNZXNzYWdlcyA9IG9iamVjdC5leHRlbmQuYXBwbHkob2JqZWN0LCBtZXNzYWdlcylcblxuICAgIHRoaXMudmFsaWRhdG9ycyA9IHRoaXMuZGVmYXVsdFZhbGlkYXRvcnMuY29uY2F0KGt3YXJncy52YWxpZGF0b3JzKVxuICB9XG59KVxuXG4vKipcbiAqIFRyYWNrcyBlYWNoIHRpbWUgYSBGaWVsZCBpbnN0YW5jZSBpcyBjcmVhdGVkOyB1c2VkIHRvIHJldGFpbiBvcmRlci5cbiAqL1xuRmllbGQuY3JlYXRpb25Db3VudGVyID0gMFxuXG5GaWVsZC5wcm90b3R5cGUucHJlcGFyZVZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQHBhcmFtIHsqfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIENoZWNrcyBmb3IgdGhlIGdpdmVuIHZhbHVlIGJlaW5nID09PSBvbmUgb2YgdGhlIGNvbmZpZ3VyZWQgZW1wdHkgdmFsdWVzLCBwbHVzXG4gKiBhbnkgYWRkaXRpb25hbCBjaGVja3MgcmVxdWlyZWQgZHVlIHRvIEphdmFTY3JpcHQncyBsYWNrIG9mIGEgZ2VuZXJpYyBvYmplY3RcbiAqIGVxdWFsaXR5IGNoZWNraW5nIG1lY2hhbmlzbS5cbiAqL1xuRmllbGQucHJvdG90eXBlLmlzRW1wdHlWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmVtcHR5VmFsdWVzLmluZGV4T2YodmFsdWUpICE9IC0xKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gKHRoaXMuZW1wdHlWYWx1ZUFycmF5ID09PSB0cnVlICYmIGlzLkFycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApXG59XG5cbkZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLnJlcXVpcmVkICYmIHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMucmVxdWlyZWQsIHtjb2RlOiAncmVxdWlyZWQnfSlcbiAgfVxufVxuXG5GaWVsZC5wcm90b3R5cGUucnVuVmFsaWRhdG9ycyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgZXJyb3JzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnZhbGlkYXRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIHZhbGlkYXRvciA9IHRoaXMudmFsaWRhdG9yc1tpXVxuICAgIHRyeSB7XG4gICAgICB2YWxpZGF0b3IodmFsdWUpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICAgIGlmIChvYmplY3QuaGFzT3duKGUsICdjb2RlJykgJiZcbiAgICAgICAgICBvYmplY3QuaGFzT3duKHRoaXMuZXJyb3JNZXNzYWdlcywgZS5jb2RlKSkge1xuICAgICAgICBlLm1lc3NhZ2UgPSB0aGlzLmVycm9yTWVzc2FnZXNbZS5jb2RlXVxuICAgICAgfVxuICAgICAgZXJyb3JzLnB1c2guYXBwbHkoZXJyb3JzLCBlLmVycm9yTGlzdClcbiAgICB9XG4gIH1cbiAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKGVycm9ycylcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGUgZ2l2ZW4gdmFsdWUgYW5kIHJldHVybnMgaXRzIFwiY2xlYW5lZFwiIHZhbHVlIGFzIGFuIGFwcHJvcHJpYXRlXG4gKiBKYXZhU2NyaXB0IG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSB0aGlzLnRvSmF2YVNjcmlwdCh2YWx1ZSlcbiAgdGhpcy52YWxpZGF0ZSh2YWx1ZSlcbiAgdGhpcy5ydW5WYWxpZGF0b3JzKHZhbHVlKVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGJlIHNob3duIGZvciB0aGlzIGZpZWxkIG9uIHJlbmRlciBvZiBhIGJvdW5kXG4gKiBmb3JtLCBnaXZlbiB0aGUgc3VibWl0dGVkIGRhdGEgZm9yIHRoZSBmaWVsZCBhbmQgdGhlIGluaXRpYWwgZGF0YSwgaWYgYW55LlxuICogRm9yIG1vc3QgZmllbGRzLCB0aGlzIHdpbGwgc2ltcGx5IGJlIGRhdGE7IEZpbGVGaWVsZHMgbmVlZCB0byBoYW5kbGUgaXQgYSBiaXRcbiAqIGRpZmZlcmVudGx5LlxuICovXG5GaWVsZC5wcm90b3R5cGUuYm91bmREYXRhID0gZnVuY3Rpb24oZGF0YSwgaW5pdGlhbCkge1xuICByZXR1cm4gZGF0YVxufVxuXG4vKipcbiAqIFNwZWNpZmllcyBIVE1MIGF0dHJpYnV0ZXMgd2hpY2ggc2hvdWxkIGJlIGFkZGVkIHRvIGEgZ2l2ZW4gd2lkZ2V0IGZvciB0aGlzXG4gKiBmaWVsZC5cbiAqIEBwYXJhbSB7V2lkZ2V0fSB3aWRnZXQgYSB3aWRnZXQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFuIG9iamVjdCBzcGVjaWZ5aW5nIEhUTUwgYXR0cmlidXRlcyB0aGF0IHNob3VsZCBiZSBhZGRlZCB0b1xuICogICB0aGUgZ2l2ZW4gd2lkZ2V0IHdoZW4gcmVuZGVyZWQsIGJhc2VkIG9uIHRoaXMgZmllbGQuXG4gKi9cbkZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICByZXR1cm4ge31cbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGRhdGEgZGlmZmVycyBmcm9tIGluaXRpYWwuXG4gKi9cbkZpZWxkLnByb3RvdHlwZS5faGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKGluaXRpYWwsIGRhdGEpIHtcbiAgLy8gRm9yIHB1cnBvc2VzIG9mIHNlZWluZyB3aGV0aGVyIHNvbWV0aGluZyBoYXMgY2hhbmdlZCwgbnVsbCBpcyB0aGUgc2FtZVxuICAvLyBhcyBhbiBlbXB0eSBzdHJpbmcsIGlmIHRoZSBkYXRhIG9yIGluaXRpYWwgdmFsdWUgd2UgZ2V0IGlzIG51bGwsIHJlcGxhY2VcbiAgLy8gaXQgd2l0aCAnJy5cbiAgdmFyIGluaXRpYWxWYWx1ZSA9IChpbml0aWFsID09PSBudWxsID8gJycgOiBpbml0aWFsKVxuICB0cnkge1xuICAgIGRhdGEgPSB0aGlzLnRvSmF2YVNjcmlwdChkYXRhKVxuICAgIGlmICh0eXBlb2YgdGhpcy5fY29lcmNlID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGRhdGEgPSB0aGlzLl9jb2VyY2UoZGF0YSlcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHZhciBkYXRhVmFsdWUgPSAoZGF0YSA9PT0gbnVsbCA/ICcnIDogZGF0YSlcbiAgcmV0dXJuICgnJytpbml0aWFsVmFsdWUgIT0gJycrZGF0YVZhbHVlKSAvLyBUT0RPIGlzIGZvcmNpbmcgdG8gc3RyaW5nIG5lY2Vzc2FyeT9cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBTdHJpbmcuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBDaGFyRmllbGQgPSBGaWVsZC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2hhckZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBDaGFyRmllbGQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7bWF4TGVuZ3RoOiBudWxsLCBtaW5MZW5ndGg6IG51bGx9LCBrd2FyZ3MpXG4gICAgdGhpcy5tYXhMZW5ndGggPSBrd2FyZ3MubWF4TGVuZ3RoXG4gICAgdGhpcy5taW5MZW5ndGggPSBrd2FyZ3MubWluTGVuZ3RoXG4gICAgRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgaWYgKHRoaXMubWluTGVuZ3RoICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3JzLk1pbkxlbmd0aFZhbGlkYXRvcih0aGlzLm1pbkxlbmd0aCkpXG4gICAgfVxuICAgIGlmICh0aGlzLm1heExlbmd0aCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2godmFsaWRhdG9ycy5NYXhMZW5ndGhWYWxpZGF0b3IodGhpcy5tYXhMZW5ndGgpKVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkNoYXJGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHJldHVybiAnJ1xuICB9XG4gIHJldHVybiAnJyt2YWx1ZVxufVxuXG4vKipcbiAqIElmIHRoaXMgZmllbGQgaXMgY29uZmlndXJlZCB0byBlbmZvcmNlIGEgbWF4aW11bSBsZW5ndGgsIGFkZHMgYSBzdWl0YWJsZVxuICogbWF4TGVuZ3RoIGF0dHJpYnV0ZSB0byB0ZXh0IGlucHV0IGZpZWxkcy5cbiAqIEBwYXJhbSB7V2lkZ2V0fSB3aWRnZXQgdGhlIHdpZGdldCBiZWluZyB1c2VkIHRvIHJlbmRlciB0aGlzIGZpZWxkJ3MgdmFsdWUuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFkZGl0aW9uYWwgYXR0cmlidXRlcyB3aGljaCBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHdpZGdldC5cbiAqL1xuQ2hhckZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICB2YXIgYXR0cnMgPSB7fVxuICBpZiAodGhpcy5tYXhMZW5ndGggIT09IG51bGwgJiYgKHdpZGdldCBpbnN0YW5jZW9mIHdpZGdldHMuVGV4dElucHV0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkZ2V0IGluc3RhbmNlb2Ygd2lkZ2V0cy5QYXNzd29yZElucHV0KSkge1xuICAgIGF0dHJzLm1heExlbmd0aCA9ICcnK3RoaXMubWF4TGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGF0dHJzXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgdmFsaWQgaW50ZWdlci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIEludGVnZXJGaWVsZCA9IEZpZWxkLmV4dGVuZCh7XG4gIHdpZGdldDogd2lkZ2V0cy5OdW1iZXJJbnB1dFxuLCBkZWZhdWx0RXJyb3JNZXNzYWdlczoge1xuICAgIGludmFsaWQ6ICdFbnRlciBhIHdob2xlIG51bWJlci4nXG4gIH1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gSW50ZWdlckZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBJbnRlZ2VyRmllbGQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7bWF4VmFsdWU6IG51bGwsIG1pblZhbHVlOiBudWxsfSwga3dhcmdzKVxuICAgIHRoaXMubWF4VmFsdWUgPSBrd2FyZ3MubWF4VmFsdWVcbiAgICB0aGlzLm1pblZhbHVlID0ga3dhcmdzLm1pblZhbHVlXG4gICAgRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG5cbiAgICBpZiAodGhpcy5taW5WYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2godmFsaWRhdG9ycy5NaW5WYWx1ZVZhbGlkYXRvcih0aGlzLm1pblZhbHVlKSlcbiAgICB9XG4gICAgaWYgKHRoaXMubWF4VmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMudmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcnMuTWF4VmFsdWVWYWxpZGF0b3IodGhpcy5tYXhWYWx1ZSkpXG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IE51bWJlcigpIGNhbiBiZSBjYWxsZWQgb24gdGhlIGlucHV0IHdpdGggYSByZXN1bHQgdGhhdCBpc24ndFxuICogTmFOIGFuZCBkb2Vzbid0IGNvbnRhaW4gYW55IGRlY2ltYWwgcG9pbnRzLlxuICogQHBhcmFtIHsqfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHJldHVybiB7P251bWJlcn0gdGhlIHJlc3VsdCBvZiBOdW1iZXIoKSwgb3IgbnVsbCBmb3IgZW1wdHkgdmFsdWVzLlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuSW50ZWdlckZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YWx1ZSA9IEZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQuY2FsbCh0aGlzLCB2YWx1ZSlcbiAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgdmFsdWUgPSBOdW1iZXIodmFsdWUpXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUudG9TdHJpbmcoKS5pbmRleE9mKCcuJykgIT0gLTEpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG5JbnRlZ2VyRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gIHZhciBhdHRycyA9IEZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycy5jYWxsKHRoaXMsIHdpZGdldClcbiAgaWYgKHdpZGdldCBpbnN0YW5jZW9mIHdpZGdldHMuTnVtYmVySW5wdXQpIHtcbiAgICBpZiAodGhpcy5taW5WYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgYXR0cnMubWluID0gdGhpcy5taW5WYWx1ZVxuICAgIH1cbiAgICBpZiAodGhpcy5tYXhWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgYXR0cnMubWF4ID0gdGhpcy5tYXhWYWx1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXR0cnNcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBmbG9hdC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ludGVnZXJGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBGbG9hdEZpZWxkID0gSW50ZWdlckZpZWxkLmV4dGVuZCh7XG4gIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZDogJ0VudGVyIGEgbnVtYmVyLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBGbG9hdEZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBGbG9hdEZpZWxkKGt3YXJncykgfVxuICAgIEludGVnZXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqIEZsb2F0IHZhbGlkYXRpb24gcmVndWxhciBleHByZXNzaW9uLCBhcyBwYXJzZUZsb2F0KCkgaXMgdG9vIGZvcmdpdmluZy4gKi9cbkZsb2F0RmllbGQuRkxPQVRfUkVHRVhQID0gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98KD86XFxkKyk/XFwuXFxkKykkL1xuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IHRoZSBpbnB1dCBsb29rcyBsaWtlIHZhbGlkIGlucHV0IGZvciBwYXJzZUZsb2F0KCkgYW5kIHRoZVxuICogcmVzdWx0IG9mIGNhbGxpbmcgaXQgaXNuJ3QgTmFOLlxuICogQHBhcmFtIHsqfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHJldHVybiBhIE51bWJlciBvYnRhaW5lZCBmcm9tIHBhcnNlRmxvYXQoKSwgb3IgbnVsbCBmb3IgZW1wdHkgdmFsdWVzLlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuRmxvYXRGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSBGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0LmNhbGwodGhpcywgdmFsdWUpXG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHZhbHVlID0gdXRpbC5zdHJpcCh2YWx1ZSlcbiAgaWYgKCFGbG9hdEZpZWxkLkZMT0FUX1JFR0VYUC50ZXN0KHZhbHVlKSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZCwge2NvZGU6ICdpbnZhbGlkJ30pXG4gIH1cbiAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKVxuICBpZiAoaXNOYU4odmFsdWUpKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkLCB7Y29kZTogJ2ludmFsaWQnfSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGRhdGEgaGFzIGNoYW5nZWQgZnJvbSBpbml0aWFsLiBJbiBKYXZhU2NyaXB0LCB0cmFpbGluZyB6ZXJvZXNcbiAqIGluIGZsb2F0cyBhcmUgZHJvcHBlZCB3aGVuIGEgZmxvYXQgaXMgY29lcmNlZCB0byBhIFN0cmluZywgc28gZS5nLiwgYW5cbiAqIGluaXRpYWwgdmFsdWUgb2YgMS4wIHdvdWxkIG5vdCBtYXRjaCBhIGRhdGEgdmFsdWUgb2YgJzEuMCcgaWYgd2Ugd2VyZSB0byB1c2VcbiAqIHRoZSBXaWRnZXQgb2JqZWN0J3MgX2hhc0NoYW5nZWQsIHdoaWNoIGNoZWNrcyBjb2VyY2VkIFN0cmluZyB2YWx1ZXMuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGRhdGEgaGFzIGNoYW5nZWQgZnJvbSBpbml0aWFsLlxuICovXG5GbG9hdEZpZWxkLnByb3RvdHlwZS5faGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKGluaXRpYWwsIGRhdGEpIHtcbiAgLy8gRm9yIHB1cnBvc2VzIG9mIHNlZWluZyB3aGV0aGVyIHNvbWV0aGluZyBoYXMgY2hhbmdlZCwgbnVsbCBpcyB0aGUgc2FtZVxuICAvLyBhcyBhbiBlbXB0eSBzdHJpbmcsIGlmIHRoZSBkYXRhIG9yIGluaXRpYWwgdmFsdWUgd2UgZ2V0IGlzIG51bGwsIHJlcGxhY2VcbiAgLy8gaXQgd2l0aCAnJy5cbiAgdmFyIGRhdGFWYWx1ZSA9IChkYXRhID09PSBudWxsID8gJycgOiBkYXRhKVxuICB2YXIgaW5pdGlhbFZhbHVlID0gKGluaXRpYWwgPT09IG51bGwgPyAnJyA6IGluaXRpYWwpXG4gIGlmIChpbml0aWFsVmFsdWUgPT09IGRhdGFWYWx1ZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGVsc2UgaWYgKGluaXRpYWxWYWx1ZSA9PT0gJycgfHwgZGF0YVZhbHVlID09PSAnJykge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIChwYXJzZUZsb2F0KCcnK2luaXRpYWxWYWx1ZSkgIT0gcGFyc2VGbG9hdCgnJytkYXRhVmFsdWUpKVxufVxuXG5GbG9hdEZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICB2YXIgYXR0cnMgPSBJbnRlZ2VyRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzLmNhbGwodGhpcywgd2lkZ2V0KVxuICBpZiAod2lkZ2V0IGluc3RhbmNlb2Ygd2lkZ2V0cy5OdW1iZXJJbnB1dCAmJlxuICAgICAgIW9iamVjdC5oYXNPd24od2lkZ2V0LmF0dHJzLCAnc3RlcCcpKSB7XG4gICAgb2JqZWN0LnNldERlZmF1bHQoYXR0cnMsICdzdGVwJywgJ2FueScpXG4gIH1cbiAgcmV0dXJuIGF0dHJzXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgZGVjaW1hbCBudW1iZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBEZWNpbWFsRmllbGQgPSBJbnRlZ2VyRmllbGQuZXh0ZW5kKHtcbiAgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSBudW1iZXIuJ1xuICAsIG1heERpZ2l0czogJ0Vuc3VyZSB0aGF0IHRoZXJlIGFyZSBubyBtb3JlIHRoYW4ge21heH0gZGlnaXRzIGluIHRvdGFsLidcbiAgLCBtYXhEZWNpbWFsUGxhY2VzOiAnRW5zdXJlIHRoYXQgdGhlcmUgYXJlIG5vIG1vcmUgdGhhbiB7bWF4fSBkZWNpbWFsIHBsYWNlcy4nXG4gICwgbWF4V2hvbGVEaWdpdHM6ICdFbnN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gbW9yZSB0aGFuIHttYXh9IGRpZ2l0cyBiZWZvcmUgdGhlIGRlY2ltYWwgcG9pbnQuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIERlY2ltYWxGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgRGVjaW1hbEZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe21heERpZ2l0czogbnVsbCwgZGVjaW1hbFBsYWNlczogbnVsbH0sIGt3YXJncylcbiAgICB0aGlzLm1heERpZ2l0cyA9IGt3YXJncy5tYXhEaWdpdHNcbiAgICB0aGlzLmRlY2ltYWxQbGFjZXMgPSBrd2FyZ3MuZGVjaW1hbFBsYWNlc1xuICAgIEludGVnZXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqIERlY2ltYWwgdmFsaWRhdGlvbiByZWd1bGFyIGV4cHJlc3Npb24sIGluIGxpZXUgb2YgYSBEZWNpbWFsIHR5cGUuICovXG5EZWNpbWFsRmllbGQuREVDSU1BTF9SRUdFWFAgPSAvXlstK10/KD86XFxkKyg/OlxcLlxcZCopP3woPzpcXGQrKT9cXC5cXGQrKSQvXG5cbi8qKlxuICogRGVjaW1hbEZpZWxkIG92ZXJyaWRlcyB0aGUgY2xlYW4oKSBtZXRob2QgYXMgaXQgcGVyZm9ybXMgaXRzIG93biB2YWxpZGF0aW9uXG4gKiBhZ2FpbnN0IGEgZGlmZmVyZW50IHZhbHVlIHRoYW4gdGhhdCBnaXZlbiB0byBhbnkgZGVmaW5lZCB2YWxpZGF0b3JzLCBkdWUgdG9cbiAqIEphdmFTY3JpcHQgbGFja2luZyBhIGJ1aWx0LWluIERlY2ltYWwgdHlwZS4gRGVjaW1hbCBmb3JtYXQgYW5kIGNvbXBvbmVudCBzaXplXG4gKiBjaGVja3Mgd2lsbCBiZSBwZXJmb3JtZWQgYWdhaW5zdCBhIG5vcm1hbGlzZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZVxuICogaW5wdXQsIHdoZXJlYXMgVmFsaWRhdG9ycyB3aWxsIGJlIHBhc3NlZCBhIGZsb2F0IHZlcnNpb24gb2YgdGhlIHZhbHVlIGZvclxuICogbWluL21heCBjaGVja2luZy5cbiAqIEBwYXJhbSB7c3RyaW5nfE51bWJlcn0gdmFsdWVcbiAqIEByZXR1cm4ge3N0cmluZ30gYSBub3JtYWxpc2VkIHZlcnNpb24gb2YgdGhlIGlucHV0LlxuICovXG5EZWNpbWFsRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGFrZSBjYXJlIG9mIGVtcHR5LCByZXF1aXJlZCB2YWxpZGF0aW9uXG4gIEZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZS5jYWxsKHRoaXMsIHZhbHVlKVxuICBpZiAodGhpcy5pc0VtcHR5VmFsdWUodmFsdWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIENvZXJjZSB0byBzdHJpbmcgYW5kIHZhbGlkYXRlIHRoYXQgaXQgbG9va3MgRGVjaW1hbC1saWtlXG4gIHZhbHVlID0gdXRpbC5zdHJpcCgnJyt2YWx1ZSlcbiAgaWYgKCFEZWNpbWFsRmllbGQuREVDSU1BTF9SRUdFWFAudGVzdCh2YWx1ZSkpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG5cbiAgLy8gSW4gbGlldSBvZiBhIERlY2ltYWwgdHlwZSwgRGVjaW1hbEZpZWxkIHZhbGlkYXRlcyBhZ2FpbnN0IGEgc3RyaW5nXG4gIC8vIHJlcHJlc2VudGF0aW9uIG9mIGEgRGVjaW1hbCwgaW4gd2hpY2g6XG4gIC8vICogQW55IGxlYWRpbmcgc2lnbiBoYXMgYmVlbiBzdHJpcHBlZFxuICB2YXIgbmVnYXRpdmUgPSBmYWxzZVxuICBpZiAodmFsdWUuY2hhckF0KDApID09ICcrJyB8fCB2YWx1ZS5jaGFyQXQoMCkgPT0gJy0nKSB7XG4gICAgbmVnYXRpdmUgPSAodmFsdWUuY2hhckF0KDApID09ICctJylcbiAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cigxKVxuICB9XG4gIC8vICogTGVhZGluZyB6ZXJvcyBoYXZlIGJlZW4gc3RyaXBwZWQgZnJvbSBkaWdpdHMgYmVmb3JlIHRoZSBkZWNpbWFsIHBvaW50LFxuICAvLyAgIGJ1dCB0cmFpbGluZyBkaWdpdHMgYXJlIHJldGFpbmVkIGFmdGVyIHRoZSBkZWNpbWFsIHBvaW50LlxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL14wKy8sICcnKVxuICAvLyAqIElmIHRoZSBpbnB1dCBlbmRlZCB3aXRoIGEgJy4nLCBpdCBpcyBzdHJpcHBlZFxuICBpZiAodmFsdWUuaW5kZXhPZignLicpID09IHZhbHVlLmxlbmd0aCAtIDEpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCB2YWx1ZS5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gUGVyZm9ybSBvd24gdmFsaWRhdGlvblxuICB2YXIgcGllY2VzID0gdmFsdWUuc3BsaXQoJy4nKVxuICB2YXIgd2hvbGVEaWdpdHMgPSBwaWVjZXNbMF0ubGVuZ3RoXG4gIHZhciBkZWNpbWFscyA9IChwaWVjZXMubGVuZ3RoID09IDIgPyBwaWVjZXNbMV0ubGVuZ3RoIDogMClcbiAgdmFyIGRpZ2l0cyA9IHdob2xlRGlnaXRzICsgZGVjaW1hbHNcbiAgaWYgKHRoaXMubWF4RGlnaXRzICE9PSBudWxsICYmIGRpZ2l0cyA+IHRoaXMubWF4RGlnaXRzKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5tYXhEaWdpdHMsIHtcbiAgICAgIGNvZGU6ICdtYXhEaWdpdHMnXG4gICAgLCBwYXJhbXM6IHttYXg6IHRoaXMubWF4RGlnaXRzfVxuICAgIH0pXG4gIH1cbiAgaWYgKHRoaXMuZGVjaW1hbFBsYWNlcyAhPT0gbnVsbCAmJiBkZWNpbWFscyA+IHRoaXMuZGVjaW1hbFBsYWNlcykge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMubWF4RGVjaW1hbFBsYWNlcywge1xuICAgICAgY29kZTogJ21heERlY2ltYWxQbGFjZXMnXG4gICAgLCBwYXJhbXM6IHttYXg6IHRoaXMuZGVjaW1hbFBsYWNlc31cbiAgICB9KVxuICB9XG4gIGlmICh0aGlzLm1heERpZ2l0cyAhPT0gbnVsbCAmJlxuICAgICAgdGhpcy5kZWNpbWFsUGxhY2VzICE9PSBudWxsICYmXG4gICAgICB3aG9sZURpZ2l0cyA+ICh0aGlzLm1heERpZ2l0cyAtIHRoaXMuZGVjaW1hbFBsYWNlcykpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLm1heFdob2xlRGlnaXRzLCB7XG4gICAgICBjb2RlOiAnbWF4V2hvbGVEaWdpdHMnXG4gICAgLCBwYXJhbXM6IHttYXg6ICh0aGlzLm1heERpZ2l0cyAtIHRoaXMuZGVjaW1hbFBsYWNlcyl9XG4gICAgfSlcbiAgfVxuXG4gIC8vICogVmFsdWVzIHdoaWNoIGRpZCBub3QgaGF2ZSBhIGxlYWRpbmcgemVybyBnYWluIGEgc2luZ2xlIGxlYWRpbmcgemVyb1xuICBpZiAodmFsdWUuY2hhckF0KDApID09ICcuJykge1xuICAgIHZhbHVlID0gJzAnICsgdmFsdWVcbiAgfVxuICAvLyBSZXN0b3JlIHNpZ24gaWYgbmVjZXNzYXJ5XG4gIGlmIChuZWdhdGl2ZSkge1xuICAgIHZhbHVlID0gJy0nICsgdmFsdWVcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGFnYWluc3QgYSBmbG9hdCB2YWx1ZSAtIGJlc3Qgd2UgY2FuIGRvIGluIHRoZSBtZWFudGltZVxuICB0aGlzLnJ1blZhbGlkYXRvcnMocGFyc2VGbG9hdCh2YWx1ZSkpXG5cbiAgLy8gUmV0dXJuIHRoZSBub3JtYWxpc2VkIFN0cmluZyByZXByZXNlbnRhdGlvblxuICByZXR1cm4gdmFsdWVcbn1cblxuRGVjaW1hbEZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICB2YXIgYXR0cnMgPSBJbnRlZ2VyRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzLmNhbGwodGhpcywgd2lkZ2V0KVxuICBpZiAod2lkZ2V0IGluc3RhbmNlb2Ygd2lkZ2V0cy5OdW1iZXJJbnB1dCAmJlxuICAgICAgIW9iamVjdC5oYXNPd24od2lkZ2V0LmF0dHJzLCAnc3RlcCcpKSB7XG4gICAgdmFyIHN0ZXAgPSAnYW55J1xuICAgIGlmICh0aGlzLmRlY2ltYWxQbGFjZXMgIT09IG51bGwpIHtcbiAgICAgIC8vIFVzZSBleHBvbmVudGlhbCBub3RhdGlvbiBmb3Igc21hbGwgdmFsdWVzIHNpbmNlIHRoZXkgbWlnaHRcbiAgICAgIC8vIGJlIHBhcnNlZCBhcyAwIG90aGVyd2lzZS5cbiAgICAgIGlmICh0aGlzLmRlY2ltYWxQbGFjZXMgPT09IDApIHtcbiAgICAgICAgc3RlcCA9ICcxJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodGhpcy5kZWNpbWFsUGxhY2VzIDwgNykge1xuICAgICAgICBzdGVwID0gJzAuJyArICcwMDAwMDEnLnNsaWNlKC10aGlzLmRlY2ltYWxQbGFjZXMpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc3RlcCA9ICcxZS0nICsgdGhpcy5kZWNpbWFsUGxhY2VzXG4gICAgICB9XG4gICAgfVxuICAgIG9iamVjdC5zZXREZWZhdWx0KGF0dHJzLCAnc3RlcCcsIHN0ZXApXG4gIH1cbiAgcmV0dXJuIGF0dHJzXG59XG5cbi8qKlxuICogQmFzZSBmaWVsZCBmb3IgZmllbGRzIHdoaWNoIHZhbGlkYXRlIHRoYXQgdGhlaXIgaW5wdXQgaXMgYSBkYXRlIG9yIHRpbWUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBCYXNlVGVtcG9yYWxGaWVsZCA9IEZpZWxkLmV4dGVuZCh7XG4gIGlucHV0Rm9ybWF0VHlwZTogJydcbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEJhc2VUZW1wb3JhbEZpZWxkKGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2lucHV0Rm9ybWF0czogbnVsbH0sIGt3YXJncylcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLmlucHV0Rm9ybWF0cyA9IGt3YXJncy5pbnB1dEZvcm1hdHNcbiAgfVxufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBkYXRlIG9yIHRpbWUuXG4gKiBAcGFyYW0geyhzdHJpbmd8RGF0ZSl9IHZhbHVlIHVzZXIgaW5wdXQuXG4gKiBAcmV0dXJuIHtEYXRlfVxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICghaXMuRGF0ZSh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IHV0aWwuc3RyaXAodmFsdWUpXG4gIH1cbiAgaWYgKGlzLlN0cmluZyh2YWx1ZSkpIHtcbiAgICBpZiAodGhpcy5pbnB1dEZvcm1hdHMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRGb3JtYXRzID0gZm9ybWF0cy5nZXRGb3JtYXQodGhpcy5pbnB1dEZvcm1hdFR5cGUpXG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5pbnB1dEZvcm1hdHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJwZGF0ZSh2YWx1ZSwgdGhpcy5pbnB1dEZvcm1hdHNbaV0pXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBwYXNzXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZCwge2NvZGU6ICdpbnZhbGlkJ30pXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIERhdGUgZnJvbSB0aGUgZ2l2ZW4gaW5wdXQgaWYgaXQncyB2YWxpZCBiYXNlZCBvbiBhIGZvcm1hdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdFxuICogQHJldHVybiB7RGF0ZX1cbiAqL1xuQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLnN0cnBkYXRlID0gZnVuY3Rpb24odmFsdWUsIGZvcm1hdCkge1xuICByZXR1cm4gdGltZS5zdHJwZGF0ZSh2YWx1ZSwgZm9ybWF0LCBsb2NhbGVzLmdldERlZmF1bHRMb2NhbGUoKSlcbn1cblxuQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLl9oYXNDaGFuZ2VkID0gZnVuY3Rpb24oaW5pdGlhbCwgZGF0YSkge1xuICB0cnkge1xuICAgIGRhdGEgPSB0aGlzLnRvSmF2YVNjcmlwdChkYXRhKVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHsgdGhyb3cgZSB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpbml0aWFsID0gdGhpcy50b0phdmFTY3JpcHQoaW5pdGlhbClcbiAgaWYgKCEhaW5pdGlhbCAmJiAhIWRhdGEpIHtcbiAgICByZXR1cm4gaW5pdGlhbC5nZXRUaW1lKCkgIT09IGRhdGEuZ2V0VGltZSgpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIGluaXRpYWwgIT09IGRhdGFcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBpcyBhIGRhdGUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtCYXNlVGVtcG9yYWxGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBEYXRlRmllbGQgPSBCYXNlVGVtcG9yYWxGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuRGF0ZUlucHV0XG4sIGlucHV0Rm9ybWF0VHlwZTogJ0RBVEVfSU5QVVRfRk9STUFUUydcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSB2YWxpZCBkYXRlLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBEYXRlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IERhdGVGaWVsZChrd2FyZ3MpIH1cbiAgICBCYXNlVGVtcG9yYWxGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgaW5wdXQgY2FuIGJlIGNvbnZlcnRlZCB0byBhIGRhdGUuXG4gKiBAcGFyYW0gez8oc3RyaW5nfERhdGUpfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHJldHVybiB7P0RhdGV9IGEgd2l0aCBpdHMgeWVhciwgbW9udGggYW5kIGRheSBhdHRyaWJ1dGVzIHNldCwgb3IgbnVsbCBmb3JcbiAqICAgZW1wdHkgdmFsdWVzIHdoZW4gdGhleSBhcmUgYWxsb3dlZC5cbiAqIEB0aHJvd3Mge1ZhbGlkYXRpb25FcnJvcn0gaWYgdGhlIGlucHV0IGlzIGludmFsaWQuXG4gKi9cbkRhdGVGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBuZXcgRGF0ZSh2YWx1ZS5nZXRGdWxsWWVhcigpLCB2YWx1ZS5nZXRNb250aCgpLCB2YWx1ZS5nZXREYXRlKCkpXG4gIH1cbiAgcmV0dXJuIEJhc2VUZW1wb3JhbEZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQuY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB0aW1lLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7QmFzZVRlbXBvcmFsRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgVGltZUZpZWxkID0gQmFzZVRlbXBvcmFsRmllbGQuZXh0ZW5kKHtcbiAgd2lkZ2V0OiB3aWRnZXRzLlRpbWVJbnB1dFxuLCBpbnB1dEZvcm1hdFR5cGU6ICdUSU1FX0lOUFVUX0ZPUk1BVFMnXG4sIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZDogJ0VudGVyIGEgdmFsaWQgdGltZS4nXG4gIH1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVGltZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBUaW1lRmllbGQoa3dhcmdzKSB9XG4gICAgQmFzZVRlbXBvcmFsRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgdGhlIGlucHV0IGNhbiBiZSBjb252ZXJ0ZWQgdG8gYSB0aW1lLlxuICogQHBhcmFtIHs/KHN0cmluZ3xEYXRlKX0gdmFsdWUgdXNlciBpbnB1dC5cbiAqIEByZXR1cm4gez9EYXRlfSBhIERhdGUgd2l0aCBpdHMgaG91ciwgbWludXRlIGFuZCBzZWNvbmQgYXR0cmlidXRlcyBzZXQsIG9yXG4gKiAgIG51bGwgZm9yIGVtcHR5IHZhbHVlcyB3aGVuIHRoZXkgYXJlIGFsbG93ZWQuXG4gKiBAdGhyb3dzIHtWYWxpZGF0aW9uRXJyb3J9IGlmIHRoZSBpbnB1dCBpcyBpbnZhbGlkLlxuICovXG5UaW1lRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoMTkwMCwgMCwgMSwgdmFsdWUuZ2V0SG91cnMoKSwgdmFsdWUuZ2V0TWludXRlcygpLCB2YWx1ZS5nZXRTZWNvbmRzKCkpXG4gIH1cbiAgcmV0dXJuIEJhc2VUZW1wb3JhbEZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQuY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgRGF0ZSByZXByZXNlbnRpbmcgYSB0aW1lIGZyb20gdGhlIGdpdmVuIGlucHV0IGlmIGl0J3MgdmFsaWQgYmFzZWRcbiAqIG9uIHRoZSBmb3JtYXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXRcbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblRpbWVGaWVsZC5wcm90b3R5cGUuc3RycGRhdGUgPSBmdW5jdGlvbih2YWx1ZSwgZm9ybWF0KSB7XG4gIHZhciB0ID0gdGltZS5zdHJwdGltZSh2YWx1ZSwgZm9ybWF0LCBsb2NhbGVzLmdldERlZmF1bHRMb2NhbGUoKSlcbiAgcmV0dXJuIG5ldyBEYXRlKDE5MDAsIDAsIDEsIHRbM10sIHRbNF0sIHRbNV0pXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgZGF0ZS90aW1lLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7QmFzZVRlbXBvcmFsRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRGF0ZVRpbWVGaWVsZCA9IEJhc2VUZW1wb3JhbEZpZWxkLmV4dGVuZCh7XG4gIHdpZGdldDogd2lkZ2V0cy5EYXRlVGltZUlucHV0XG4sIGlucHV0Rm9ybWF0VHlwZTogJ0RBVEVUSU1FX0lOUFVUX0ZPUk1BVFMnXG4sIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZDogJ0VudGVyIGEgdmFsaWQgZGF0ZS90aW1lLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBEYXRlVGltZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBEYXRlVGltZUZpZWxkKGt3YXJncykgfVxuICAgIEJhc2VUZW1wb3JhbEZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG4vKipcbiAqIEBwYXJhbSB7PyhzdHJpbmd8RGF0ZXxBcnJheS48c3RyaW5nPil9IHZhbHVlIHVzZXIgaW5wdXQuXG4gKiBAcmV0dXJuIHs/RGF0ZX1cbiAqIEB0aHJvd3Mge1ZhbGlkYXRpb25FcnJvcn0gaWYgdGhlIGlucHV0IGlzIGludmFsaWQuXG4gKi9cbkRhdGVUaW1lRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuICBpZiAoaXMuQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gSW5wdXQgY29tZXMgZnJvbSBhIFNwbGl0RGF0ZVRpbWVXaWRnZXQsIGZvciBleGFtcGxlLCBzbyBpdCdzIHR3b1xuICAgIC8vIGNvbXBvbmVudHM6IGRhdGUgYW5kIHRpbWUuXG4gICAgaWYgKHZhbHVlLmxlbmd0aCAhPSAyKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0VtcHR5VmFsdWUodmFsdWVbMF0pICYmIHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlWzFdKSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcgJylcbiAgfVxuICByZXR1cm4gQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdC5jYWxsKHRoaXMsIHZhbHVlKVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBtYXRjaGVzIGEgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7Q2hhckZpZWxkfVxuICogQHBhcmFtIHsoUmVnRXhwfHN0cmluZyl9IHJlZ2V4XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgUmVnZXhGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gUmVnZXhGaWVsZChyZWdleCwga3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IFJlZ2V4RmllbGQocmVnZXgsIGt3YXJncykgfVxuICAgIENoYXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICBpZiAoaXMuU3RyaW5nKHJlZ2V4KSkge1xuICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4KVxuICAgIH1cbiAgICB0aGlzLnJlZ2V4ID0gcmVnZXhcbiAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3JzLlJlZ2V4VmFsaWRhdG9yKHtyZWdleDogdGhpcy5yZWdleH0pKVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBhcHBlYXJzIHRvIGJlIGEgdmFsaWQgZS1tYWlsIGFkZHJlc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtDaGFyRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRW1haWxGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuRW1haWxJbnB1dFxuLCBkZWZhdWx0VmFsaWRhdG9yczogW3ZhbGlkYXRvcnMudmFsaWRhdGVFbWFpbF1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRW1haWxGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgRW1haWxGaWVsZChrd2FyZ3MpIH1cbiAgICBDaGFyRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbkVtYWlsRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSB1dGlsLnN0cmlwKHRoaXMudG9KYXZhU2NyaXB0KHZhbHVlKSlcbiAgcmV0dXJuIENoYXJGaWVsZC5wcm90b3R5cGUuY2xlYW4uY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCB1cGxvYWRlZCBmaWxlLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRmlsZUZpZWxkID0gRmllbGQuZXh0ZW5kKHtcbiAgd2lkZ2V0OiB3aWRnZXRzLkNsZWFyYWJsZUZpbGVJbnB1dFxuLCBkZWZhdWx0RXJyb3JNZXNzYWdlczoge1xuICAgIGludmFsaWQ6ICdObyBmaWxlIHdhcyBzdWJtaXR0ZWQuIENoZWNrIHRoZSBlbmNvZGluZyB0eXBlIG9uIHRoZSBmb3JtLidcbiAgLCBtaXNzaW5nOiAnTm8gZmlsZSB3YXMgc3VibWl0dGVkLidcbiAgLCBlbXB0eTogJ1RoZSBzdWJtaXR0ZWQgZmlsZSBpcyBlbXB0eS4nXG4gICwgbWF4TGVuZ3RoOiAnRW5zdXJlIHRoaXMgZmlsZW5hbWUgaGFzIGF0IG1vc3Qge21heH0gY2hhcmFjdGVycyAoaXQgaGFzIHtsZW5ndGh9KS4nXG4gICwgY29udHJhZGljdGlvbjogJ1BsZWFzZSBlaXRoZXIgc3VibWl0IGEgZmlsZSBvciBjaGVjayB0aGUgY2xlYXIgY2hlY2tib3gsIG5vdCBib3RoLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBGaWxlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IEZpbGVGaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHttYXhMZW5ndGg6IG51bGwsIGFsbG93RW1wdHlGaWxlOiBmYWxzZX0sIGt3YXJncylcbiAgICB0aGlzLm1heExlbmd0aCA9IGt3YXJncy5tYXhMZW5ndGhcbiAgICB0aGlzLmFsbG93RW1wdHlGaWxlID0ga3dhcmdzLmFsbG93RW1wdHlGaWxlXG4gICAgZGVsZXRlIGt3YXJncy5tYXhMZW5ndGhcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuRmlsZUZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbihkYXRhLCBpbml0aWFsKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZShkYXRhKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBpZiAoZW52LmJyb3dzZXIpIHtcbiAgICByZXR1cm4gZGF0YVxuICB9XG5cbiAgLy8gVXBsb2FkZWRGaWxlIG9iamVjdHMgc2hvdWxkIGhhdmUgbmFtZSBhbmQgc2l6ZSBhdHRyaWJ1dGVzXG4gIGlmICh0eXBlb2YgZGF0YS5uYW1lID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBkYXRhLnNpemUgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG5cbiAgdmFyIGZpbGVOYW1lID0gZGF0YS5uYW1lXG4gIHZhciBmaWxlU2l6ZSA9IGRhdGEuc2l6ZVxuXG4gIGlmICh0aGlzLm1heExlbmd0aCAhPT0gbnVsbCAmJiBmaWxlTmFtZS5sZW5ndGggPiB0aGlzLm1heExlbmd0aCkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMubWF4TGVuZ3RoLCB7XG4gICAgICBjb2RlOiAnbWF4TGVuZ3RoJ1xuICAgICwgcGFyYW1zOiB7bWF4OiB0aGlzLm1heExlbmd0aCwgbGVuZ3RoOiBmaWxlTmFtZS5sZW5ndGh9XG4gICAgfSlcbiAgfVxuICBpZiAoIWZpbGVOYW1lKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkLCB7Y29kZTogJ2ludmFsaWQnfSlcbiAgfVxuICBpZiAoIXRoaXMuYWxsb3dFbXB0eUZpbGUgJiYgIWZpbGVTaXplKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5lbXB0eSwge2NvZGU6ICdlbXB0eSd9KVxuICB9XG4gIHJldHVybiBkYXRhXG59XG5cbkZpbGVGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbihkYXRhLCBpbml0aWFsKSB7XG4gIC8vIElmIHRoZSB3aWRnZXQgZ290IGNvbnRyYWRpY3RvcnkgaW5wdXRzLCB3ZSByYWlzZSBhIHZhbGlkYXRpb24gZXJyb3JcbiAgaWYgKGRhdGEgPT09IHdpZGdldHMuRklMRV9JTlBVVF9DT05UUkFESUNUSU9OKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5jb250cmFkaWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29kZTogJ2NvbnRyYWRpY3Rpb24nfSlcbiAgfVxuICAvLyBmYWxzZSBtZWFucyB0aGUgZmllbGQgdmFsdWUgc2hvdWxkIGJlIGNsZWFyZWQ7IGZ1cnRoZXIgdmFsaWRhdGlvbiBpc1xuICAvLyBub3QgbmVlZGVkLlxuICBpZiAoZGF0YSA9PT0gZmFsc2UpIHtcbiAgICBpZiAoIXRoaXMucmVxdWlyZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICAvLyBJZiB0aGUgZmllbGQgaXMgcmVxdWlyZWQsIGNsZWFyaW5nIGlzIG5vdCBwb3NzaWJsZSAodGhlIHdpZGdldFxuICAgIC8vIHNob3VsZG4ndCByZXR1cm4gZmFsc2UgZGF0YSBpbiB0aGF0IGNhc2UgYW55d2F5KS4gZmFsc2UgaXMgbm90XG4gICAgLy8gaW4gRU1QVFlfVkFMVUVTOyBpZiBhIGZhbHNlIHZhbHVlIG1ha2VzIGl0IHRoaXMgZmFyIGl0IHNob3VsZCBiZVxuICAgIC8vIHZhbGlkYXRlZCBmcm9tIGhlcmUgb24gb3V0IGFzIG51bGwgKHNvIGl0IHdpbGwgYmUgY2F1Z2h0IGJ5IHRoZVxuICAgIC8vIHJlcXVpcmVkIGNoZWNrKS5cbiAgICBkYXRhID0gbnVsbFxuICB9XG4gIGlmICghZGF0YSAmJiBpbml0aWFsKSB7XG4gICAgcmV0dXJuIGluaXRpYWxcbiAgfVxuICByZXR1cm4gRmllbGQucHJvdG90eXBlLmNsZWFuLmNhbGwodGhpcywgZGF0YSlcbn1cblxuRmlsZUZpZWxkLnByb3RvdHlwZS5ib3VuZERhdGEgPSBmdW5jdGlvbihkYXRhLCBpbml0aWFsKSB7XG4gIGlmIChkYXRhID09PSBudWxsIHx8IGRhdGEgPT09IHdpZGdldHMuRklMRV9JTlBVVF9DT05UUkFESUNUSU9OKSB7XG4gICAgcmV0dXJuIGluaXRpYWxcbiAgfVxuICByZXR1cm4gZGF0YVxufVxuXG5GaWxlRmllbGQucHJvdG90eXBlLl9oYXNDaGFuZ2VkID0gZnVuY3Rpb24oaW5pdGlhbCwgZGF0YSkge1xuICByZXR1cm4gKGRhdGEgIT09IG51bGwpXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgdmFsaWQgdXBsb2FkZWQgaW1hZ2UuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBJbWFnZUZpZWxkID0gRmlsZUZpZWxkLmV4dGVuZCh7XG4gIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZEltYWdlOiAnVXBsb2FkIGEgdmFsaWQgaW1hZ2UuIFRoZSBmaWxlIHlvdSB1cGxvYWRlZCB3YXMgZWl0aGVyIG5vdCBhbiBpbWFnZSBvciBhIGNvcnJ1cHRlZCBpbWFnZS4nXG4gIH1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gSW1hZ2VGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgSW1hZ2VGaWVsZChrd2FyZ3MpIH1cbiAgICBGaWxlRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgdGhlIGZpbGUtdXBsb2FkIGZpZWxkIGRhdGEgY29udGFpbnMgYSB2YWxpZCBpbWFnZS5cbiAqL1xuSW1hZ2VGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24oZGF0YSwgaW5pdGlhbCkge1xuICB2YXIgZiA9IEZpbGVGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0LmNhbGwodGhpcywgZGF0YSwgaW5pdGlhbClcbiAgaWYgKGYgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gVE9ETyBQbHVnIGluIGltYWdlIHByb2Nlc3NpbmcgY29kZSB3aGVuIHJ1bm5pbmcgb24gdGhlIHNlcnZlclxuXG4gIHJldHVybiBmXG59XG5cbkltYWdlRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gIHZhciBhdHRycyA9IEZpbGVGaWVsZC5wcm90b3R5cGUud2lkZ2V0QXR0cnMuY2FsbCh0aGlzLCB3aWRnZXQpXG4gIGF0dHJzLmFjY2VwdCA9ICdpbWFnZS8qJ1xuICByZXR1cm4gYXR0cnNcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgYXBwZWFycyB0byBiZSBhIHZhbGlkIFVSTC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0NoYXJGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBVUkxGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuVVJMSW5wdXRcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSB2YWxpZCBVUkwuJ1xuICB9XG4sIGRlZmF1bHRWYWxpZGF0b3JzOiBbdmFsaWRhdG9ycy5VUkxWYWxpZGF0b3IoKV1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVVJMRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IFVSTEZpZWxkKGt3YXJncykgfVxuICAgIENoYXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuVVJMRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSkge1xuICAgIHZhciB1cmxGaWVsZHMgPSB1cmwucGFyc2VVcmkodmFsdWUpXG4gICAgaWYgKCF1cmxGaWVsZHMucHJvdG9jb2wpIHtcbiAgICAgIC8vIElmIG5vIFVSTCBwcm90b2NvbCBnaXZlbiwgYXNzdW1lIGh0dHA6Ly9cbiAgICAgIHVybEZpZWxkcy5wcm90b2NvbCA9ICdodHRwJ1xuICAgIH1cbiAgICBpZiAoIXVybEZpZWxkcy5wYXRoKSB7XG4gICAgICAvLyBUaGUgcGF0aCBwb3J0aW9uIG1heSBuZWVkIHRvIGJlIGFkZGVkIGJlZm9yZSBxdWVyeSBwYXJhbXNcbiAgICAgIHVybEZpZWxkcy5wYXRoID0gJy8nXG4gICAgfVxuICAgIHZhbHVlID0gdXJsLm1ha2VVcmkodXJsRmllbGRzKVxuICB9XG4gIHJldHVybiBDaGFyRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdC5jYWxsKHRoaXMsIHZhbHVlKVxufVxuXG5VUkxGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YWx1ZSA9IHV0aWwuc3RyaXAodGhpcy50b0phdmFTY3JpcHQodmFsdWUpKVxuICByZXR1cm4gQ2hhckZpZWxkLnByb3RvdHlwZS5jbGVhbi5jYWxsKHRoaXMsIHZhbHVlKVxufVxuXG4vKipcbiAqIE5vcm1hbGlzZXMgaXRzIGlucHV0IHRvIGEgQm9vbGVhbiBwcmltaXRpdmUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBCb29sZWFuRmllbGQgPSBGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuQ2hlY2tib3hJbnB1dFxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBCb29sZWFuRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IEJvb2xlYW5GaWVsZChrd2FyZ3MpIH1cbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuQm9vbGVhbkZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAvLyBFeHBsaWNpdGx5IGNoZWNrIGZvciBhICdmYWxzZScgc3RyaW5nLCB3aGljaCBpcyB3aGF0IGEgaGlkZGVuIGZpZWxkIHdpbGxcbiAgLy8gc3VibWl0IGZvciBmYWxzZS4gQWxzbyBjaGVjayBmb3IgJzAnLCBzaW5jZSB0aGlzIGlzIHdoYXQgUmFkaW9TZWxlY3Qgd2lsbFxuICAvLyBwcm92aWRlLiBCZWNhdXNlIEJvb2xlYW4oJ2FueXRoaW5nJykgPT0gdHJ1ZSwgd2UgZG9uJ3QgbmVlZCB0byBoYW5kbGUgdGhhdFxuICAvLyBleHBsaWNpdGx5LlxuICBpZiAoaXMuU3RyaW5nKHZhbHVlKSAmJiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PSAnZmFsc2UnIHx8IHZhbHVlID09ICcwJykpIHtcbiAgICB2YWx1ZSA9IGZhbHNlXG4gIH1cbiAgZWxzZSB7XG4gICAgdmFsdWUgPSBCb29sZWFuKHZhbHVlKVxuICB9XG4gIHZhbHVlID0gRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdC5jYWxsKHRoaXMsIHZhbHVlKVxuICBpZiAoIXZhbHVlICYmIHRoaXMucmVxdWlyZWQpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLnJlcXVpcmVkLCB7Y29kZTogJ3JlcXVpcmVkJ30pXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbkJvb2xlYW5GaWVsZC5wcm90b3R5cGUuX2hhc0NoYW5nZWQgPSBmdW5jdGlvbihpbml0aWFsLCBkYXRhKSB7XG4gIC8vIFNvbWV0aW1lcyBkYXRhIG9yIGluaXRpYWwgY291bGQgYmUgbnVsbCBvciAnJyB3aGljaCBzaG91bGQgYmUgdGhlIHNhbWVcbiAgLy8gdGhpbmcgYXMgZmFsc2UuXG4gIGlmIChpbml0aWFsID09PSAnZmFsc2UnKSB7XG4gICAgLy8gc2hvd0hpZGRlbkluaXRpYWwgbWF5IGhhdmUgdHJhbnNmb3JtZWQgZmFsc2UgdG8gJ2ZhbHNlJ1xuICAgIGluaXRpYWwgPSBmYWxzZVxuICB9XG4gIHJldHVybiAoQm9vbGVhbihpbml0aWFsKSAhPSBCb29sZWFuKGRhdGEpKVxufVxuXG4vKipcbiAqIEEgZmllbGQgd2hvc2UgdmFsaWQgdmFsdWVzIGFyZSBudWxsLCB0cnVlIGFuZCBmYWxzZS5cbiAqIEludmFsaWQgdmFsdWVzIGFyZSBjbGVhbmVkIHRvIG51bGwuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtCb29sZWFuRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTnVsbEJvb2xlYW5GaWVsZCA9IEJvb2xlYW5GaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuTnVsbEJvb2xlYW5TZWxlY3RcblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gTnVsbEJvb2xlYW5GaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgTnVsbEJvb2xlYW5GaWVsZChrd2FyZ3MpIH1cbiAgICBCb29sZWFuRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbk51bGxCb29sZWFuRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIEV4cGxpY2l0bHkgY2hlY2tzIGZvciB0aGUgc3RyaW5nICdUcnVlJyBhbmQgJ0ZhbHNlJywgd2hpY2ggaXMgd2hhdCBhXG4gIC8vIGhpZGRlbiBmaWVsZCB3aWxsIHN1Ym1pdCBmb3IgdHJ1ZSBhbmQgZmFsc2UsIGFuZCBmb3IgJzEnIGFuZCAnMCcsIHdoaWNoXG4gIC8vIGlzIHdoYXQgYSBSYWRpb0ZpZWxkIHdpbGwgc3VibWl0LiBVbmxpa2UgdGhlIEJvb2xlYW5GaWVsZCB3ZSBhbHNvIG5lZWRcbiAgLy8gdG8gY2hlY2sgZm9yIHRydWUsIGJlY2F1c2Ugd2UgYXJlIG5vdCB1c2luZyBCb29sZWFuKCkgZnVuY3Rpb24uXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PSAnVHJ1ZScgfHwgdmFsdWUgPT0gJ3RydWUnIHx8IHZhbHVlID09ICcxJykge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgZWxzZSBpZiAodmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09ICdGYWxzZScgfHwgdmFsdWUgPT0gJ2ZhbHNlJyB8fCB2YWx1ZSA9PSAnMCcpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5OdWxsQm9vbGVhbkZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7fVxuXG5OdWxsQm9vbGVhbkZpZWxkLnByb3RvdHlwZS5faGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKGluaXRpYWwsIGRhdGEpIHtcbiAgLy8gbnVsbCAodW5rbm93bikgYW5kIGZhbHNlIChObykgYXJlIG5vdCB0aGUgc2FtZVxuICBpZiAoaW5pdGlhbCAhPT0gbnVsbCkge1xuICAgICAgaW5pdGlhbCA9IEJvb2xlYW4oaW5pdGlhbClcbiAgfVxuICBpZiAoZGF0YSAhPT0gbnVsbCkge1xuICAgICAgZGF0YSA9IEJvb2xlYW4oZGF0YSlcbiAgfVxuICByZXR1cm4gaW5pdGlhbCAhPSBkYXRhXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIG9uZSBvZiBhIHZhbGlkIGxpc3Qgb2YgY2hvaWNlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENob2ljZUZpZWxkID0gRmllbGQuZXh0ZW5kKHtcbiAgd2lkZ2V0OiB3aWRnZXRzLlNlbGVjdFxuLCBkZWZhdWx0RXJyb3JNZXNzYWdlczoge1xuICAgIGludmFsaWRDaG9pY2U6ICdTZWxlY3QgYSB2YWxpZCBjaG9pY2UuIHt2YWx1ZX0gaXMgbm90IG9uZSBvZiB0aGUgYXZhaWxhYmxlIGNob2ljZXMuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIENob2ljZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBDaG9pY2VGaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtjaG9pY2VzOiBbXX0sIGt3YXJncylcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLnNldENob2ljZXMoa3dhcmdzLmNob2ljZXMpXG4gIH1cbn0pXG5cbkNob2ljZUZpZWxkLnByb3RvdHlwZS5jaG9pY2VzID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9jaG9pY2VzIH1cbkNob2ljZUZpZWxkLnByb3RvdHlwZS5zZXRDaG9pY2VzID0gZnVuY3Rpb24oY2hvaWNlcykge1xuICAvLyBTZXR0aW5nIGNob2ljZXMgYWxzbyBzZXRzIHRoZSBjaG9pY2VzIG9uIHRoZSB3aWRnZXRcbiAgdGhpcy5fY2hvaWNlcyA9IHRoaXMud2lkZ2V0LmNob2ljZXMgPSB1dGlsLm5vcm1hbGlzZUNob2ljZXMoY2hvaWNlcylcbn1cblxuQ2hvaWNlRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuICByZXR1cm4gJycrdmFsdWVcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgZ2l2ZW4gdmFsdWUgaXMgaW4gdGhpcyBmaWVsZCdzIGNob2ljZXMuXG4gKi9cbkNob2ljZUZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIEZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZS5jYWxsKHRoaXMsIHZhbHVlKVxuICBpZiAodmFsdWUgJiYgIXRoaXMudmFsaWRWYWx1ZSh2YWx1ZSkpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWRDaG9pY2UsIHtcbiAgICAgIGNvZGU6ICdpbnZhbGlkQ2hvaWNlJ1xuICAgICwgcGFyYW1zOiB7dmFsdWU6IHZhbHVlfVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBwcm92aWRlZCB2YWx1ZSBpcyBhIHZhbGlkIGNob2ljZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSB0aGUgdmFsdWUgdG8gYmUgdmFsaWRhdGVkLlxuICovXG5DaG9pY2VGaWVsZC5wcm90b3R5cGUudmFsaWRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciBjaG9pY2VzID0gdGhpcy5jaG9pY2VzKClcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaG9pY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChpcy5BcnJheShjaG9pY2VzW2ldWzFdKSkge1xuICAgICAgLy8gVGhpcyBpcyBhbiBvcHRncm91cCwgc28gbG9vayBpbnNpZGUgdGhlIGdyb3VwIGZvciBvcHRpb25zXG4gICAgICB2YXIgb3B0Z3JvdXBDaG9pY2VzID0gY2hvaWNlc1tpXVsxXVxuICAgICAgZm9yICh2YXIgaiA9IDAsIG0gPSBvcHRncm91cENob2ljZXMubGVuZ3RoOyBqIDwgbTsgaisrKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJycrb3B0Z3JvdXBDaG9pY2VzW2pdWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gJycrY2hvaWNlc1tpXVswXSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQSBDaG9pY2VGaWVsZCB3aGljaCByZXR1cm5zIGEgdmFsdWUgY29lcmNlZCBieSBzb21lIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7Q2hvaWNlRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgVHlwZWRDaG9pY2VGaWVsZCA9IENob2ljZUZpZWxkLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBUeXBlZENob2ljZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBUeXBlZENob2ljZUZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgY29lcmNlOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbCB9LCBlbXB0eVZhbHVlOiAnJ1xuICAgIH0sIGt3YXJncylcbiAgICB0aGlzLmNvZXJjZSA9IG9iamVjdC5wb3Aoa3dhcmdzLCAnY29lcmNlJylcbiAgICB0aGlzLmVtcHR5VmFsdWUgPSBvYmplY3QucG9wKGt3YXJncywgJ2VtcHR5VmFsdWUnKVxuICAgIENob2ljZUZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlIHRoYXQgdGhlIHZhbHVlIGNhbiBiZSBjb2VyY2VkIHRvIHRoZSByaWdodCB0eXBlIChpZiBub3QgZW1wdHkpLlxuICovXG5UeXBlZENob2ljZUZpZWxkLnByb3RvdHlwZS5fY29lcmNlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSB0aGlzLmVtcHR5VmFsdWUgfHwgdGhpcy5pc0VtcHR5VmFsdWUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1wdHlWYWx1ZVxuICB9XG4gIHRyeSB7XG4gICAgdmFsdWUgPSB0aGlzLmNvZXJjZSh2YWx1ZSlcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZENob2ljZSwge1xuICAgICAgY29kZTogJ2ludmFsaWRDaG9pY2UnXG4gICAgLCBwYXJhbXM6IHt2YWx1ZTogdmFsdWV9XG4gICAgfSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuVHlwZWRDaG9pY2VGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YWx1ZSA9IENob2ljZUZpZWxkLnByb3RvdHlwZS5jbGVhbi5jYWxsKHRoaXMsIHZhbHVlKVxuICByZXR1cm4gdGhpcy5fY29lcmNlKHZhbHVlKVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBpcyBvbmUgb3IgbW9yZSBvZiBhIHZhbGlkIGxpc3Qgb2YgY2hvaWNlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0Nob2ljZUZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIE11bHRpcGxlQ2hvaWNlRmllbGQgPSBDaG9pY2VGaWVsZC5leHRlbmQoe1xuICBoaWRkZW5XaWRnZXQ6IHdpZGdldHMuTXVsdGlwbGVIaWRkZW5JbnB1dFxuLCB3aWRnZXQ6IHdpZGdldHMuU2VsZWN0TXVsdGlwbGVcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkQ2hvaWNlOiAnU2VsZWN0IGEgdmFsaWQgY2hvaWNlLiB7dmFsdWV9IGlzIG5vdCBvbmUgb2YgdGhlIGF2YWlsYWJsZSBjaG9pY2VzLidcbiAgLCBpbnZhbGlkTGlzdDogJ0VudGVyIGEgbGlzdCBvZiB2YWx1ZXMuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE11bHRpcGxlQ2hvaWNlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IE11bHRpcGxlQ2hvaWNlRmllbGQoa3dhcmdzKSB9XG4gICAgQ2hvaWNlRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbk11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuICBlbHNlIGlmICghaXMuQXJyYXkodmFsdWUpKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkTGlzdCwge2NvZGU6ICdpbnZhbGlkTGlzdCd9KVxuICB9XG4gIHZhciBzdHJpbmdWYWx1ZXMgPSBbXVxuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHN0cmluZ1ZhbHVlcy5wdXNoKCcnK3ZhbHVlW2ldKVxuICB9XG4gIHJldHVybiBzdHJpbmdWYWx1ZXNcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgaW5wdXQgaXMgYSBsaXN0IGFuZCB0aGF0IGVhY2ggaXRlbSBpcyBpbiB0aGlzIGZpZWxkJ3NcbiAqIGNob2ljZXMuXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuTXVsdGlwbGVDaG9pY2VGaWVsZC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodGhpcy5yZXF1aXJlZCAmJiAhdmFsdWUubGVuZ3RoKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5yZXF1aXJlZCwge2NvZGU6ICdyZXF1aXJlZCd9KVxuICB9XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKCF0aGlzLnZhbGlkVmFsdWUodmFsdWVbaV0pKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWRDaG9pY2UsIHtcbiAgICAgICAgY29kZTogJ2ludmFsaWRDaG9pY2UnXG4gICAgICAsIHBhcmFtczoge3ZhbHVlOiB2YWx1ZVtpXX1cbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbk11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLl9oYXNDaGFuZ2VkID0gZnVuY3Rpb24oaW5pdGlhbCwgZGF0YSkge1xuICBpZiAoaW5pdGlhbCA9PT0gbnVsbCkge1xuICAgIGluaXRpYWwgPSBbXVxuICB9XG4gIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgZGF0YSA9IFtdXG4gIH1cbiAgaWYgKGluaXRpYWwubGVuZ3RoICE9IGRhdGEubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICB2YXIgZGF0YUxvb2t1cCA9IG9iamVjdC5sb29rdXAoZGF0YSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbml0aWFsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmICh0eXBlb2YgZGF0YUxvb2t1cFsnJytpbml0aWFsW2ldXSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQU11bHRpcGxlQ2hvaWNlRmllbGQgd2hpY2ggcmV0dXJucyB2YWx1ZXMgY29lcmNlZCBieSBzb21lIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7TXVsdGlwbGVDaG9pY2VGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBUeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQgPSBNdWx0aXBsZUNob2ljZUZpZWxkLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBUeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IFR5cGVkTXVsdGlwbGVDaG9pY2VGaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICAgIGNvZXJjZTogZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWwgfSwgZW1wdHlWYWx1ZTogW11cbiAgICB9LCBrd2FyZ3MpXG4gICAgdGhpcy5jb2VyY2UgPSBvYmplY3QucG9wKGt3YXJncywgJ2NvZXJjZScpXG4gICAgdGhpcy5lbXB0eVZhbHVlID0gb2JqZWN0LnBvcChrd2FyZ3MsICdlbXB0eVZhbHVlJylcbiAgICBNdWx0aXBsZUNob2ljZUZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG5UeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLl9jb2VyY2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodmFsdWUgPT09IHRoaXMuZW1wdHlWYWx1ZSB8fCB0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkgfHxcbiAgICAgIChpcy5BcnJheSh2YWx1ZSkgJiYgIXZhbHVlLmxlbmd0aCkpIHtcbiAgICByZXR1cm4gdGhpcy5lbXB0eVZhbHVlXG4gIH1cbiAgdmFyIG5ld1ZhbHVlID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB0cnkge1xuICAgICAgbmV3VmFsdWUucHVzaCh0aGlzLmNvZXJjZSh2YWx1ZVtpXSkpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWRDaG9pY2UsIHtcbiAgICAgICAgY29kZTogJ2ludmFsaWRDaG9pY2UnXG4gICAgICAsIHBhcmFtczoge3ZhbHVlOiB2YWx1ZVtpXX1cbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdWYWx1ZVxufVxuXG5UeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSBNdWx0aXBsZUNob2ljZUZpZWxkLnByb3RvdHlwZS5jbGVhbi5jYWxsKHRoaXMsIHZhbHVlKVxuICByZXR1cm4gdGhpcy5fY29lcmNlKHZhbHVlKVxufVxuXG5UeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlICE9PSB0aGlzLmVtcHR5VmFsdWUgfHwgKGlzLkFycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGgpKSB7XG4gICAgTXVsdGlwbGVDaG9pY2VGaWVsZC5wcm90b3R5cGUudmFsaWRhdGUuY2FsbCh0aGlzLCB2YWx1ZSlcbiAgfVxuICBlbHNlIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5yZXF1aXJlZCwge2NvZGU6ICdyZXF1aXJlZCd9KVxuICB9XG59XG5cbi8qKlxuICogQWxsb3dzIGNob29zaW5nIGZyb20gZmlsZXMgaW5zaWRlIGEgY2VydGFpbiBkaXJlY3RvcnkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtDaG9pY2VGaWVsZH1cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRmlsZVBhdGhGaWVsZCA9IENob2ljZUZpZWxkLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBGaWxlUGF0aEZpZWxkKHBhdGgsIGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBGaWxlUGF0aEZpZWxkKHBhdGgsIGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgbWF0Y2g6IG51bGwsIHJlY3Vyc2l2ZTogZmFsc2UsIHJlcXVpcmVkOiB0cnVlLCB3aWRnZXQ6IG51bGwsXG4gICAgICBsYWJlbDogbnVsbCwgaW5pdGlhbDogbnVsbCwgaGVscFRleHQ6IG51bGwsXG4gICAgICBhbGxvd0ZpbGVzOiB0cnVlLCBhbGxvd0ZvbGRlcnM6IGZhbHNlXG4gICAgfSwga3dhcmdzKVxuXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMubWF0Y2ggPSBvYmplY3QucG9wKGt3YXJncywgJ21hdGNoJylcbiAgICB0aGlzLnJlY3Vyc2l2ZSA9IG9iamVjdC5wb3Aoa3dhcmdzLCAncmVjdXJzaXZlJylcbiAgICB0aGlzLmFsbG93RmlsZXMgPSBvYmplY3QucG9wKGt3YXJncywgJ2FsbG93RmlsZXMnKVxuICAgIHRoaXMuYWxsb3dGb2xkZXJzID0gb2JqZWN0LnBvcChrd2FyZ3MsICdhbGxvd0ZvbGRlcnMnKVxuICAgIGRlbGV0ZSBrd2FyZ3MubWF0Y2hcbiAgICBkZWxldGUga3dhcmdzLnJlY3Vyc2l2ZVxuXG4gICAga3dhcmdzLmNob2ljZXMgPSBbXVxuICAgIENob2ljZUZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuXG4gICAgaWYgKHRoaXMucmVxdWlyZWQpIHtcbiAgICAgIHRoaXMuc2V0Q2hvaWNlcyhbXSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnNldENob2ljZXMoW1snJywgJy0tLS0tLS0tLSddXSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5tYXRjaFJFID0gbmV3IFJlZ0V4cCh0aGlzLm1hdGNoKVxuICAgIH1cblxuICAgIC8vIFRPRE8gUGx1ZyBpbiBmaWxlIHBhdGhzIHdoZW4gcnVubmluZyBvbiB0aGUgc2VydmVyXG5cbiAgICB0aGlzLndpZGdldC5jaG9pY2VzID0gdGhpcy5jaG9pY2VzKClcbiAgfVxufSlcblxuLyoqXG4gKiBBIEZpZWxkIHdob3NlIGNsZWFuKCkgbWV0aG9kIGNhbGxzIG11bHRpcGxlIEZpZWxkIGNsZWFuKCkgbWV0aG9kcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENvbWJvRmllbGQgPSBGaWVsZC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ29tYm9GaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgQ29tYm9GaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtmaWVsZHM6IFtdfSwga3dhcmdzKVxuICAgIEZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICAgIC8vIFNldCByZXF1aXJlZCB0byBGYWxzZSBvbiB0aGUgaW5kaXZpZHVhbCBmaWVsZHMsIGJlY2F1c2UgdGhlIHJlcXVpcmVkXG4gICAgLy8gdmFsaWRhdGlvbiB3aWxsIGJlIGhhbmRsZWQgYnkgQ29tYm9GaWVsZCwgbm90IGJ5IHRob3NlIGluZGl2aWR1YWwgZmllbGRzLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0ga3dhcmdzLmZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGt3YXJncy5maWVsZHNbaV0ucmVxdWlyZWQgPSBmYWxzZVxuICAgIH1cbiAgICB0aGlzLmZpZWxkcyA9IGt3YXJncy5maWVsZHNcbiAgfVxufSlcblxuQ29tYm9GaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICBGaWVsZC5wcm90b3R5cGUuY2xlYW4uY2FsbCh0aGlzLCB2YWx1ZSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YWx1ZSA9IHRoaXMuZmllbGRzW2ldLmNsZWFuKHZhbHVlKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIEEgRmllbGQgdGhhdCBhZ2dyZWdhdGVzIHRoZSBsb2dpYyBvZiBtdWx0aXBsZSBGaWVsZHMuXG4gKiBJdHMgY2xlYW4oKSBtZXRob2QgdGFrZXMgYSBcImRlY29tcHJlc3NlZFwiIGxpc3Qgb2YgdmFsdWVzLCB3aGljaCBhcmUgdGhlblxuICogY2xlYW5lZCBpbnRvIGEgc2luZ2xlIHZhbHVlIGFjY29yZGluZyB0byB0aGlzLmZpZWxkcy4gRWFjaCB2YWx1ZSBpbiB0aGlzXG4gKiBsaXN0IGlzIGNsZWFuZWQgYnkgdGhlIGNvcnJlc3BvbmRpbmcgZmllbGQgLS0gdGhlIGZpcnN0IHZhbHVlIGlzIGNsZWFuZWQgYnlcbiAqIHRoZSBmaXJzdCBmaWVsZCwgdGhlIHNlY29uZCB2YWx1ZSBpcyBjbGVhbmVkIGJ5IHRoZSBzZWNvbmQgZmllbGQsIGV0Yy4gT25jZVxuICogYWxsIGZpZWxkcyBhcmUgY2xlYW5lZCwgdGhlIGxpc3Qgb2YgY2xlYW4gdmFsdWVzIGlzIFwiY29tcHJlc3NlZFwiIGludG8gYVxuICogc2luZ2xlIHZhbHVlLlxuICogU3ViY2xhc3NlcyBzaG91bGQgbm90IGhhdmUgdG8gaW1wbGVtZW50IGNsZWFuKCkuIEluc3RlYWQsIHRoZXkgbXVzdFxuICogaW1wbGVtZW50IGNvbXByZXNzKCksIHdoaWNoIHRha2VzIGEgbGlzdCBvZiB2YWxpZCB2YWx1ZXMgYW5kIHJldHVybnMgYVxuICogXCJjb21wcmVzc2VkXCIgdmVyc2lvbiBvZiB0aG9zZSB2YWx1ZXMgLS0gYSBzaW5nbGUgdmFsdWUuXG4gKiBZb3UnbGwgcHJvYmFibHkgd2FudCB0byB1c2UgdGhpcyB3aXRoIE11bHRpV2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTXVsdGlWYWx1ZUZpZWxkID0gRmllbGQuZXh0ZW5kKHtcbiAgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSBsaXN0IG9mIHZhbHVlcy4nXG4gICwgaW5jb21wbGV0ZTogJ0VudGVyIGEgY29tcGxldGUgdmFsdWUuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE11bHRpVmFsdWVGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgTXVsdGlWYWx1ZUZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2ZpZWxkczogW119LCBrd2FyZ3MpXG4gICAgdGhpcy5yZXF1aXJlQWxsRmllbGRzID0gb2JqZWN0LnBvcChrd2FyZ3MsICdyZXF1aXJlQWxsRmllbGRzJywgdHJ1ZSlcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0ga3dhcmdzLmZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBmID0ga3dhcmdzLmZpZWxkc1tpXVxuICAgICAgb2JqZWN0LnNldERlZmF1bHQoZi5lcnJvck1lc3NhZ2VzLCAnaW5jb21wbGV0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZXMuaW5jb21wbGV0ZSlcbiAgICAgIGlmICh0aGlzLnJlcXVpcmVBbGxGaWVsZHMpIHtcbiAgICAgICAgLy8gU2V0IHJlcXVpcmVkIHRvIGZhbHNlIG9uIHRoZSBpbmRpdmlkdWFsIGZpZWxkcywgYmVjYXVzZSB0aGUgcmVxdWlyZWRcbiAgICAgICAgLy8gdmFsaWRhdGlvbiB3aWxsIGJlIGhhbmRsZWQgYnkgTXVsdGlWYWx1ZUZpZWxkLCBub3QgYnkgdGhvc2VcbiAgICAgICAgLy8gaW5kaXZpZHVhbCBmaWVsZHMuXG4gICAgICAgIGYucmVxdWlyZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmZpZWxkcyA9IGt3YXJncy5maWVsZHNcbiAgfVxufSlcblxuTXVsdGlWYWx1ZUZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge31cblxuLyoqXG4gKiBWYWxpZGF0ZXMgZXZlcnkgdmFsdWUgaW4gdGhlIGdpdmVuIGxpc3QuIEEgdmFsdWUgaXMgdmFsaWRhdGVkIGFnYWluc3QgdGhlXG4gKiBjb3JyZXNwb25kaW5nIEZpZWxkIGluIHRoaXMuZmllbGRzLlxuICogRm9yIGV4YW1wbGUsIGlmIHRoaXMgTXVsdGlWYWx1ZUZpZWxkIHdhcyBpbnN0YW50aWF0ZWQgd2l0aFxuICoge2ZpZWxkczogW2Zvcm1zLkRhdGVGaWVsZCgpLCBmb3Jtcy5UaW1lRmllbGQoKV19LCBjbGVhbigpIHdvdWxkIGNhbGxcbiAqIERhdGVGaWVsZC5jbGVhbih2YWx1ZVswXSkgYW5kIFRpbWVGaWVsZC5jbGVhbih2YWx1ZVsxXSkuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZSB1c2VyIGlucHV0IGZvciBlYWNoIGZpZWxkLlxuICogQHJldHVybiB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgY29tcHJlc3MoKSBvbiB0aGUgY2xlYW5lZCBpbnB1dC5cbiAqIEB0aHJvd3Mge1ZhbGlkYXRpb25FcnJvcn0gaWYgdGhlIGlucHV0IGlzIGludmFsaWQuXG4gKi9cbk11bHRpVmFsdWVGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YXIgY2xlYW5EYXRhID0gW11cbiAgdmFyIGVycm9ycyA9IFtdXG5cbiAgaWYgKCF2YWx1ZSB8fCBpcy5BcnJheSh2YWx1ZSkpIHtcbiAgICB2YXIgYWxsVmFsdWVzRW1wdHkgPSB0cnVlXG4gICAgaWYgKGlzLkFycmF5KHZhbHVlKSkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHZhbHVlW2ldKSB7XG4gICAgICAgICAgYWxsVmFsdWVzRW1wdHkgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXZhbHVlIHx8IGFsbFZhbHVlc0VtcHR5KSB7XG4gICAgICBpZiAodGhpcy5yZXF1aXJlZCkge1xuICAgICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLnJlcXVpcmVkLCB7Y29kZTogJ3JlcXVpcmVkJ30pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHJlc3MoW10pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZCwge2NvZGU6ICdpbnZhbGlkJ30pXG4gIH1cblxuICBmb3IgKGkgPSAwLCBsID0gdGhpcy5maWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5maWVsZHNbaV1cbiAgICB2YXIgZmllbGRWYWx1ZSA9IHZhbHVlW2ldXG4gICAgaWYgKGZpZWxkVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZmllbGRWYWx1ZSA9IG51bGxcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKGZpZWxkVmFsdWUpKSB7XG4gICAgICBpZiAodGhpcy5yZXF1aXJlQWxsRmllbGRzKSB7XG4gICAgICAgIC8vIFRocm93IGEgJ3JlcXVpcmVkJyBlcnJvciBpZiB0aGUgTXVsdGlWYWx1ZUZpZWxkIGlzIHJlcXVpcmVkIGFuZCBhbnlcbiAgICAgICAgLy8gZmllbGQgaXMgZW1wdHkuXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5yZXF1aXJlZCwge2NvZGU6ICdyZXF1aXJlZCd9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChmaWVsZC5yZXF1aXJlZCkge1xuICAgICAgICAvLyBPdGhlcndpc2UsIGFkZCBhbiAnaW5jb21wbGV0ZScgZXJyb3IgdG8gdGhlIGxpc3Qgb2YgY29sbGVjdGVkIGVycm9yc1xuICAgICAgICAvLyBhbmQgc2tpcCBmaWVsZCBjbGVhbmluZywgaWYgYSByZXF1aXJlZCBmaWVsZCBpcyBlbXB0eS5cbiAgICAgICAgaWYgKGVycm9ycy5pbmRleE9mKGZpZWxkLmVycm9yTWVzc2FnZXMuaW5jb21wbGV0ZSkgPT0gLTEpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChmaWVsZC5lcnJvck1lc3NhZ2VzLmluY29tcGxldGUpXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY2xlYW5EYXRhLnB1c2goZmllbGQuY2xlYW4oZmllbGRWYWx1ZSkpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICAgIC8vIENvbGxlY3QgYWxsIHZhbGlkYXRpb24gZXJyb3JzIGluIGEgc2luZ2xlIGxpc3QsIHdoaWNoIHdlJ2xsIHRocm93IGF0XG4gICAgICAvLyB0aGUgZW5kIG9mIGNsZWFuKCksIHJhdGhlciB0aGFuIHRocm93aW5nIGEgc2luZ2xlIGV4Y2VwdGlvbiBmb3IgdGhlXG4gICAgICAvLyBmaXJzdCBlcnJvciB3ZSBlbmNvdW50ZXIuIFNraXAgZHVwbGljYXRlcy5cbiAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZS5tZXNzYWdlcygpLmZpbHRlcihmdW5jdGlvbihtKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnMuaW5kZXhPZihtKSA9PSAtMVxuICAgICAgfSkpXG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ycy5sZW5ndGggIT09IDApIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IoZXJyb3JzKVxuICB9XG5cbiAgdmFyIG91dCA9IHRoaXMuY29tcHJlc3MoY2xlYW5EYXRhKVxuICB0aGlzLnZhbGlkYXRlKG91dClcbiAgdGhpcy5ydW5WYWxpZGF0b3JzKG91dClcbiAgcmV0dXJuIG91dFxufVxuXG4vKipcbiAqIFJldHVybnMgYSBzaW5nbGUgdmFsdWUgZm9yIHRoZSBnaXZlbiBsaXN0IG9mIHZhbHVlcy4gVGhlIHZhbHVlcyBjYW4gYmVcbiAqIGFzc3VtZWQgdG8gYmUgdmFsaWQuXG4gKiBGb3IgZXhhbXBsZSwgaWYgdGhpcyBNdWx0aVZhbHVlRmllbGQgd2FzIGluc3RhbnRpYXRlZCB3aXRoXG4gKiB7ZmllbGRzOiBbZm9ybXMuRGF0ZUZpZWxkKCksIGZvcm1zLlRpbWVGaWVsZCgpXX0sIHRoaXMgbWlnaHQgcmV0dXJuIGEgRGF0ZVxuICogb2JqZWN0IGNyZWF0ZWQgYnkgY29tYmluaW5nIHRoZSBkYXRlIGFuZCB0aW1lIGluIGRhdGFMaXN0LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YUxpc3RcbiAqIEBhYnN0cmFjdFxuICovXG5NdWx0aVZhbHVlRmllbGQucHJvdG90eXBlLmNvbXByZXNzID0gZnVuY3Rpb24oZGF0YUxpc3QpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdTdWJjbGFzc2VzIG11c3QgaW1wbGVtZW50IHRoaXMgbWV0aG9kLicpXG59XG5cbk11bHRpVmFsdWVGaWVsZC5wcm90b3R5cGUuX2hhc0NoYW5nZWQgPSBmdW5jdGlvbihpbml0aWFsLCBkYXRhKSB7XG4gIGlmIChpbml0aWFsID09PSBudWxsKSB7XG4gICAgaW5pdGlhbCA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaW5pdGlhbC5wdXNoKCcnKVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICghKGlzLkFycmF5KGluaXRpYWwpKSkge1xuICAgIGluaXRpYWwgPSB0aGlzLndpZGdldC5kZWNvbXByZXNzKGluaXRpYWwpXG4gIH1cblxuICBmb3IgKGkgPSAwLCBsID0gdGhpcy5maWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuZmllbGRzW2ldLl9oYXNDaGFuZ2VkKGluaXRpYWxbaV0sIGRhdGFbaV0pKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBBIE11bHRpVmFsdWVGaWVsZCBjb25zaXN0aW5nIG9mIGEgRGF0ZUZpZWxkIGFuZCBhIFRpbWVGaWVsZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge011bHRpVmFsdWVGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBTcGxpdERhdGVUaW1lRmllbGQgPSBNdWx0aVZhbHVlRmllbGQuZXh0ZW5kKHtcbiAgaGlkZGVuV2lkZ2V0OiB3aWRnZXRzLlNwbGl0SGlkZGVuRGF0ZVRpbWVXaWRnZXRcbiwgd2lkZ2V0OiB3aWRnZXRzLlNwbGl0RGF0ZVRpbWVXaWRnZXRcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkRGF0ZTogJ0VudGVyIGEgdmFsaWQgZGF0ZS4nXG4gICwgaW52YWxpZFRpbWU6ICdFbnRlciBhIHZhbGlkIHRpbWUuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFNwbGl0RGF0ZVRpbWVGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgU3BsaXREYXRlVGltZUZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgaW5wdXREYXRlRm9ybWF0czogbnVsbCwgaW5wdXRUaW1lRm9ybWF0czogbnVsbFxuICAgIH0sIGt3YXJncylcbiAgICB2YXIgZXJyb3JzID0gb2JqZWN0LmV4dGVuZCh7fSwgdGhpcy5kZWZhdWx0RXJyb3JNZXNzYWdlcylcbiAgICBpZiAodHlwZW9mIGt3YXJncy5lcnJvck1lc3NhZ2VzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBvYmplY3QuZXh0ZW5kKGVycm9ycywga3dhcmdzLmVycm9yTWVzc2FnZXMpXG4gICAgfVxuICAgIGt3YXJncy5maWVsZHMgPSBbXG4gICAgICBEYXRlRmllbGQoe2lucHV0Rm9ybWF0czoga3dhcmdzLmlucHV0RGF0ZUZvcm1hdHMsXG4gICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZXM6IHtpbnZhbGlkOiBlcnJvcnMuaW52YWxpZERhdGV9fSlcbiAgICAsIFRpbWVGaWVsZCh7aW5wdXRGb3JtYXRzOiBrd2FyZ3MuaW5wdXRUaW1lRm9ybWF0cyxcbiAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlczoge2ludmFsaWQ6IGVycm9ycy5pbnZhbGlkVGltZX19KVxuICAgIF1cbiAgICBNdWx0aVZhbHVlRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQsIGlmIGdpdmVuLCBpdHMgaW5wdXQgZG9lcyBub3QgY29udGFpbiBlbXB0eSB2YWx1ZXMuXG4gKiBAcGFyYW0gez9BcnJheS48RGF0ZT59IGRhdGFMaXN0IGEgdHdvLWl0ZW0gbGlzdCBjb25zaXN0aW5nIG9mIHR3byBEYXRlXG4gKiAgIG9iamVjdHMsIHRoZSBmaXJzdCBvZiB3aGljaCByZXByZXNlbnRzIGEgZGF0ZSwgdGhlIHNlY29uZCBhIHRpbWUuXG4gKiBAcmV0dXJuIHs/RGF0ZX0gYSBEYXJlIHJlcHJlc2VudGluZyB0aGUgZ2l2ZW4gZGF0ZSBhbmQgdGltZSwgb3IgbnVsbCBmb3JcbiAqICAgZW1wdHkgdmFsdWVzLlxuICovXG5TcGxpdERhdGVUaW1lRmllbGQucHJvdG90eXBlLmNvbXByZXNzID0gZnVuY3Rpb24oZGF0YUxpc3QpIHtcbiAgaWYgKGlzLkFycmF5KGRhdGFMaXN0KSAmJiBkYXRhTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGQgPSBkYXRhTGlzdFswXVxuICAgIHZhciB0ID0gZGF0YUxpc3RbMV1cbiAgICAvLyBSYWlzZSBhIHZhbGlkYXRpb24gZXJyb3IgaWYgZGF0ZSBvciB0aW1lIGlzIGVtcHR5IChwb3NzaWJsZSBpZlxuICAgIC8vIFNwbGl0RGF0ZVRpbWVGaWVsZCBoYXMgcmVxdWlyZWQgPT0gZmFsc2UpLlxuICAgIGlmICh0aGlzLmlzRW1wdHlWYWx1ZShkKSkge1xuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkRGF0ZSwge2NvZGU6ICdpbnZhbGlkRGF0ZSd9KVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0VtcHR5VmFsdWUodCkpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZFRpbWUsIHtjb2RlOiAnaW52YWxpZFRpbWUnfSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgZC5nZXRNb250aCgpLCBkLmdldERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgdC5nZXRIb3VycygpLCB0LmdldE1pbnV0ZXMoKSwgdC5nZXRTZWNvbmRzKCkpXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBJUHY0IGFkZHJlc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtDaGFyRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICogQGRlcHJlY2F0ZWQgaW4gZmF2b3VyIG9mIEdlbmVyaWNJUEFkZHJlc3NGaWVsZFxuICovXG52YXIgSVBBZGRyZXNzRmllbGQgPSBDaGFyRmllbGQuZXh0ZW5kKHtcbiAgZGVmYXVsdFZhbGlkYXRvcnM6IFt2YWxpZGF0b3JzLnZhbGlkYXRlSVB2NEFkZHJlc3NdXG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIElQQWRkcmVzc0ZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBJUEFkZHJlc3NGaWVsZChrd2FyZ3MpIH1cbiAgICBDaGFyRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbnZhciBHZW5lcmljSVBBZGRyZXNzRmllbGQgPSBDaGFyRmllbGQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEdlbmVyaWNJUEFkZHJlc3NGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgR2VuZXJpY0lQQWRkcmVzc0ZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe3Byb3RvY29sOiAnYm90aCcsIHVucGFja0lQdjQ6IGZhbHNlfSwga3dhcmdzKVxuICAgIHRoaXMudW5wYWNrSVB2NCA9IGt3YXJncy51bnBhY2tJUHY0XG4gICAgdGhpcy5kZWZhdWx0VmFsaWRhdG9ycyA9XG4gICAgICB2YWxpZGF0b3JzLmlwQWRkcmVzc1ZhbGlkYXRvcnMoa3dhcmdzLnByb3RvY29sLCBrd2FyZ3MudW5wYWNrSVB2NCkudmFsaWRhdG9yc1xuICAgIENoYXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuR2VuZXJpY0lQQWRkcmVzc0ZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgaWYgKHZhbHVlICYmIHZhbHVlLmluZGV4T2YoJzonKSAhPSAtMSkge1xuICAgIHJldHVybiBjbGVhbklQdjZBZGRyZXNzKHZhbHVlLCB7dW5wYWNrSVB2NDogdGhpcy51bnBhY2tJUHY0fSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBzbHVnLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7Q2hhckZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFNsdWdGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICBkZWZhdWx0VmFsaWRhdG9yczogW3ZhbGlkYXRvcnMudmFsaWRhdGVTbHVnXVxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU2x1Z0ZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBTbHVnRmllbGQoa3dhcmdzKSB9XG4gICAgQ2hhckZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG5TbHVnRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSB1dGlsLnN0cmlwKHRoaXMudG9KYXZhU2NyaXB0KHZhbHVlKSlcbiAgcmV0dXJuIENoYXJGaWVsZC5wcm90b3R5cGUuY2xlYW4uY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEZpZWxkOiBGaWVsZFxuLCBDaGFyRmllbGQ6IENoYXJGaWVsZFxuLCBJbnRlZ2VyRmllbGQ6IEludGVnZXJGaWVsZFxuLCBGbG9hdEZpZWxkOiBGbG9hdEZpZWxkXG4sIERlY2ltYWxGaWVsZDogRGVjaW1hbEZpZWxkXG4sIEJhc2VUZW1wb3JhbEZpZWxkOiBCYXNlVGVtcG9yYWxGaWVsZFxuLCBEYXRlRmllbGQ6IERhdGVGaWVsZFxuLCBUaW1lRmllbGQ6IFRpbWVGaWVsZFxuLCBEYXRlVGltZUZpZWxkOiBEYXRlVGltZUZpZWxkXG4sIFJlZ2V4RmllbGQ6IFJlZ2V4RmllbGRcbiwgRW1haWxGaWVsZDogRW1haWxGaWVsZFxuLCBGaWxlRmllbGQ6IEZpbGVGaWVsZFxuLCBJbWFnZUZpZWxkOiBJbWFnZUZpZWxkXG4sIFVSTEZpZWxkOiBVUkxGaWVsZFxuLCBCb29sZWFuRmllbGQ6IEJvb2xlYW5GaWVsZFxuLCBOdWxsQm9vbGVhbkZpZWxkOiBOdWxsQm9vbGVhbkZpZWxkXG4sIENob2ljZUZpZWxkOiBDaG9pY2VGaWVsZFxuLCBUeXBlZENob2ljZUZpZWxkOiBUeXBlZENob2ljZUZpZWxkXG4sIE11bHRpcGxlQ2hvaWNlRmllbGQ6IE11bHRpcGxlQ2hvaWNlRmllbGRcbiwgVHlwZWRNdWx0aXBsZUNob2ljZUZpZWxkOiBUeXBlZE11bHRpcGxlQ2hvaWNlRmllbGRcbiwgRmlsZVBhdGhGaWVsZDogRmlsZVBhdGhGaWVsZFxuLCBDb21ib0ZpZWxkOiBDb21ib0ZpZWxkXG4sIE11bHRpVmFsdWVGaWVsZDogTXVsdGlWYWx1ZUZpZWxkXG4sIFNwbGl0RGF0ZVRpbWVGaWVsZDogU3BsaXREYXRlVGltZUZpZWxkXG4sIElQQWRkcmVzc0ZpZWxkOiBJUEFkZHJlc3NGaWVsZFxuLCBHZW5lcmljSVBBZGRyZXNzRmllbGQ6IEdlbmVyaWNJUEFkZHJlc3NGaWVsZFxuLCBTbHVnRmllbGQ6IFNsdWdGaWVsZFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcblxudmFyIGxvY2FsZXMgPSByZXF1aXJlKCcuL2xvY2FsZXMnKVxuXG4vKipcbiAqIFN0YW5kYXJkIGlucHV0IGZvcm1hdHMgd2hpY2ggd2lsbCBhbHdheXMgYmUgYWNjZXB0ZWQuXG4gKi9cbnZhciBJU09fSU5QVVRfRk9STUFUUyA9IHtcbiAgJ0RBVEVfSU5QVVRfRk9STUFUUyc6IFsnJVktJW0tJWQnXVxuLCAnVElNRV9JTlBVVF9GT1JNQVRTJzogWyclSDolTTolUycsICclSDolTSddXG4sICdEQVRFVElNRV9JTlBVVF9GT1JNQVRTJzogW1xuICAgICclWS0lbS0lZCAlSDolTTolUydcbiAgLCAnJVktJW0tJWQgJUg6JU0nXG4gICwgJyVZLSVtLSVkJ1xuICBdXG59XG5cbnZhciBmb3JtYXRDYWNoZSA9IHt9XG5cbi8qKlxuICogR2V0cyBhbGwgYWNjZXB0YWJsZSBmb3JtYXRzIG9mIGEgY2VydGFpbiB0eXBlIChlLmcuIERBVEVfSU5QVVRfRk9STUFUUykgZm9yIGFcbiAqIHBhcnRpY3VsYXIgbGFuZ3VhZ2UgY29kZS4gQWxsIGRhdGUvdGltZSBmb3JtYXRzIHdpbGwgaGF2ZSB0aGUgYXBwbGljYWJsZSBJU09cbiAqIGZvcm1hdHMgYWRkZWQgYXMgbG93ZXN0LXByZWNlZGVuY2UuXG4gKiBJZiBhbiB1bmtub3duIGxhbmd1YWdlIGNvZGUgaXMgZ2l2ZW4sIHRoZSBkZWZhdWx0IGxvY2FsZSdzIGZvcm1hdHMgd2lsbCBiZVxuICogdXNlZCBpbnN0ZWFkLlxuICogSWYgdGhlIGxvY2FsZSBkb2Vzbid0IGhhdmUgY29uZmlndXJhdGlvbiBmb3IgdGhlIGZvcm1hdCB0eXBlLCBvbmx5IHRoZSBJU09cbiAqIGZvcm1hdHMgd2lsbCBiZSByZXR1cm5lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXRUeXBlXG4gKiBAcGFyYW0ge3N0cmluZz19IGxhbmcgbGFuZ3VhZ2UgY29kZSAtIGlmIG5vdCBnaXZlbiwgdGhlIGRlZmF1bHQgbG9jYWxlJ3NcbiAqICAgZm9ybWF0cyB3aWxsIGJlIHJldHVybmVkLlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IGEgbGlzdCBvZiBmb3JtYXRzXG4gKi9cbmZ1bmN0aW9uIGdldEZvcm1hdChmb3JtYXRUeXBlLCBsYW5nKSB7XG4gIGlmICghbGFuZykge1xuICAgIGxhbmcgPSBsb2NhbGVzLmdldERlZmF1bHRMb2NhbGUoKVxuICB9XG4gIHZhciBjYWNoZUtleSA9IGZvcm1hdFR5cGUgKyAnOicgKyBsYW5nXG4gIGlmICghb2JqZWN0Lmhhc093bihmb3JtYXRDYWNoZSwgY2FjaGVLZXkpKSB7XG4gICAgdmFyIGxhbmdMb2NhbGVzID0gbG9jYWxlcy5nZXRMb2NhbGVzKGxhbmcpXG4gICAgdmFyIGxvY2FsZUZvcm1hdHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGFuZ0xvY2FsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgbG9jYWxlID0gbGFuZ0xvY2FsZXNbaV1cbiAgICAgIGlmIChvYmplY3QuaGFzT3duKGxvY2FsZSwgZm9ybWF0VHlwZSkpIHtcbiAgICAgICAgLy8gQ29weSBsb2NhbGUtc3BlY2lmaWMgZm9ybWF0cywgYXMgd2UgbWF5IGJlIGFkZGluZyB0byB0aGVtXG4gICAgICAgIGxvY2FsZUZvcm1hdHMgPSBsb2NhbGVbZm9ybWF0VHlwZV0uc2xpY2UoKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2JqZWN0Lmhhc093bihJU09fSU5QVVRfRk9STUFUUywgZm9ybWF0VHlwZSkpIHtcbiAgICAgIHZhciBpc29Gb3JtYXRzID0gSVNPX0lOUFVUX0ZPUk1BVFNbZm9ybWF0VHlwZV1cbiAgICAgIGZvciAodmFyIGogPSAwLCBtID0gaXNvRm9ybWF0cy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgICAgdmFyIGlzb0Zvcm1hdCA9IGlzb0Zvcm1hdHNbal1cbiAgICAgICAgaWYgKGxvY2FsZUZvcm1hdHMuaW5kZXhPZihpc29Gb3JtYXQpID09IC0xKSB7XG4gICAgICAgICAgbG9jYWxlRm9ybWF0cy5wdXNoKGlzb0Zvcm1hdClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3JtYXRDYWNoZVtjYWNoZUtleV0gPSBsb2NhbGVGb3JtYXRzXG4gIH1cbiAgcmV0dXJuIGZvcm1hdENhY2hlW2NhY2hlS2V5XVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Rm9ybWF0OiBnZXRGb3JtYXRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgY29weSA9IHJlcXVpcmUoJ2lzb21vcnBoL2NvcHknKVxudmFyIGlzID0gcmVxdWlyZSgnaXNvbW9ycGgvaXMnKVxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKVxudmFyIHZhbGlkYXRvcnMgPSByZXF1aXJlKCd2YWxpZGF0b3JzJylcblxudmFyIGZpZWxkcyA9IHJlcXVpcmUoJy4vZmllbGRzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBCb3VuZEZpZWxkID0gcmVxdWlyZSgnLi9Cb3VuZEZpZWxkJylcbnZhciBFcnJvckxpc3QgPSByZXF1aXJlKCcuL0Vycm9yTGlzdCcpXG52YXIgRXJyb3JPYmplY3QgPSByZXF1aXJlKCcuL0Vycm9yT2JqZWN0JylcblxudmFyIEZpZWxkID0gZmllbGRzLkZpZWxkXG52YXIgRmlsZUZpZWxkID0gZmllbGRzLkZpbGVGaWVsZFxudmFyIFZhbGlkYXRpb25FcnJvciA9IHZhbGlkYXRvcnMuVmFsaWRhdGlvbkVycm9yXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxudmFyIHNlbnRpbmVsID0ge31cblxuLyoqIFByb3BlcnR5IHVuZGVyIHdoaWNoIG5vbi1maWVsZC1zcGVjaWZpYyBlcnJvcnMgYXJlIHN0b3JlZC4gKi9cbnZhciBOT05fRklFTERfRVJST1JTID0gJ19fYWxsX18nXG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZmllbGQncyB2aWV3IG9mIHJhdyBpbnB1dCBkYXRhICh2aWEgaXRzIFdpZGdldCkgaGFzIGNoYW5nZWQuXG4gKi9cbmZ1bmN0aW9uIGZpZWxkRGF0YUhhc0NoYW5nZWQocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgaWYgKGlzLkFycmF5KHByZXZpb3VzKSAmJiBpcy5BcnJheShjdXJyZW50KSkge1xuICAgIGlmIChwcmV2aW91cy5sZW5ndGggIT0gY3VycmVudC5sZW5ndGgpIHsgcmV0dXJuIHRydWUgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcHJldmlvdXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAocHJldmlvdXNbaV0gIT0gY3VycmVudFtpXSkgeyByZXR1cm4gdHJ1ZSB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBwcmV2aW91cyAhPSBjdXJyZW50XG59XG5cbmlmICgncHJvZHVjdGlvbicgIT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICB2YXIgd2FybmVkT25JbXBsaWVkVmFsaWRhdGVBdXRvID0gZmFsc2Vcbn1cblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgRmllbGRzIHRoYXQga25vd3MgaG93IHRvIHZhbGlkYXRlIGFuZCBkaXNwbGF5IGl0c2VsZi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj59IGt3YXJncyBmb3JtIG9wdGlvbnMuXG4gKi9cbnZhciBCYXNlRm9ybSA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQmFzZUZvcm0oa3dhcmdzKSB7XG4gICAgLy8gVE9ETyBQZXJmb3JtIFByb3BUeXBlIGNoZWNrcyBvbiBrd2FyZ3MgaW4gZGV2ZWxvcG1lbnQgbW9kZVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgZGF0YTogbnVsbCwgZmlsZXM6IG51bGwsIGF1dG9JZDogJ2lkX3tuYW1lfScsIHByZWZpeDogbnVsbCxcbiAgICAgIGluaXRpYWw6IG51bGwsIGVycm9yQ29uc3RydWN0b3I6IEVycm9yTGlzdCwgbGFiZWxTdWZmaXg6ICc6JyxcbiAgICAgIGVtcHR5UGVybWl0dGVkOiBmYWxzZSwgdmFsaWRhdGlvbjogbnVsbCwgY29udHJvbGxlZDogZmFsc2UsXG4gICAgICBvbkNoYW5nZTogbnVsbCwgZXJyb3JzOiBudWxsXG4gICAgfSwga3dhcmdzKVxuICAgIHRoaXMuaXNJbml0aWFsUmVuZGVyID0gKGt3YXJncy5kYXRhID09IG51bGwgJiYga3dhcmdzLmZpbGVzID09IG51bGwpXG4gICAgdGhpcy5kYXRhID0ga3dhcmdzLmRhdGEgfHwge31cbiAgICB0aGlzLmZpbGVzID0ga3dhcmdzLmZpbGVzIHx8IHt9XG4gICAgdGhpcy5hdXRvSWQgPSBrd2FyZ3MuYXV0b0lkXG4gICAgdGhpcy5wcmVmaXggPSBrd2FyZ3MucHJlZml4XG4gICAgdGhpcy5pbml0aWFsID0ga3dhcmdzLmluaXRpYWwgfHwge31cbiAgICB0aGlzLmNsZWFuZWREYXRhID0ge31cbiAgICB0aGlzLmVycm9yQ29uc3RydWN0b3IgPSBrd2FyZ3MuZXJyb3JDb25zdHJ1Y3RvclxuICAgIHRoaXMubGFiZWxTdWZmaXggPSBrd2FyZ3MubGFiZWxTdWZmaXhcbiAgICB0aGlzLmVtcHR5UGVybWl0dGVkID0ga3dhcmdzLmVtcHR5UGVybWl0dGVkXG4gICAgdGhpcy5jb250cm9sbGVkID0ga3dhcmdzLmNvbnRyb2xsZWRcbiAgICB0aGlzLm9uQ2hhbmdlID0ga3dhcmdzLm9uQ2hhbmdlXG5cbiAgICAvLyBBdXRvIHZhbGlkYXRpb24gaXMgaW1wbGllZCB3aGVuIG9uQ2hhbmdlIGlzIHBhc3NlZFxuICAgIGlmIChpcy5GdW5jdGlvbihrd2FyZ3Mub25DaGFuZ2UpKSB7XG4gICAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICAgICAgaWYgKCF3YXJuZWRPbkltcGxpZWRWYWxpZGF0ZUF1dG8gJiYga3dhcmdzLnZhbGlkYXRpb24gPT09ICdhdXRvJykge1xuICAgICAgICAgIHV0aWwuaW5mbygnUGFzc2luZyBvbkNoYW5nZSB0byBhIEZvcm0gb3IgRm9ybVNldCBjb25zdHJ1Y3RvciBhbHNvICcgK1xuICAgICAgICAgICAgICAgICAgICBcImltcGxpZXMgdmFsaWRhdGlvbjogJ2F1dG8nIGJ5IGRlZmF1bHQgLSB5b3UgZG9uJ3QgaGF2ZSBcIiArXG4gICAgICAgICAgICAgICAgICAgICd0byBzZXQgaXQgbWFudWFsbHkuJylcbiAgICAgICAgICB3YXJuZWRPbkltcGxpZWRWYWxpZGF0ZUF1dG8gPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChrd2FyZ3MudmFsaWRhdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIGt3YXJncy52YWxpZGF0aW9uID0gJ2F1dG8nXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudmFsaWRhdGlvbiA9IHV0aWwubm9ybWFsaXNlVmFsaWRhdGlvbihrd2FyZ3MudmFsaWRhdGlvbiB8fCAnbWFudWFsJylcblxuICAgIHRoaXMuX2Vycm9ycyA9IGt3YXJncy5lcnJvcnNcblxuICAgIC8vIENhbmNlbGxhYmxlIGRlYm91bmNlZCBmdW5jdGlvbnMgZm9yIGRlbGF5ZWQgZXZlbnQgdmFsaWRhdGlvblxuICAgIHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb24gPSB7fVxuICAgIC8vIElucHV0IGRhdGEgYXMgaXQgd2FzIGxhc3QgdGltZSB2YWxpZGF0aW9uIHdhcyBwZXJmb3JtZWQgb24gYSBmaWVsZFxuICAgIHRoaXMuX2xhc3RWYWxpZGF0ZWREYXRhID0ge31cbiAgICAvLyBDYWNoZWQgcmVzdWx0IG9mIHRoZSBsYXN0IGNhbGwgdG8gaGFzQ2hhbmdlZCgpXG4gICAgdGhpcy5fbGFzdEhhc0NoYW5nZWQgPSBudWxsXG5cbiAgICAvLyBMb29rdXAgZm9yIG5hbWVzIG9mIGZpZWxkcyBwZW5kaW5nIHZhbGlkYXRpb25cbiAgICB0aGlzLl9wZW5kaW5nVmFsaWRhdGlvbiA9IHt9XG4gICAgLy8gQ2FuY2VsbGFibGUgY2FsbGJhY2tzIGZvciBwZW5kaW5nIGFzeW5jIHZhbGlkYXRpb25cbiAgICB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uID0ge31cbiAgICAvLyBMb29rdXAgZm9yIG5hbWVzIG9mIGZpZWxkcyBwZW5kaW5nIHZhbGlkYXRpb24gd2hpY2ggY2xlYW4oKSBkZXBlbmRzIG9uXG4gICAgdGhpcy5fcnVuQ2xlYW5BZnRlciA9IHt9XG4gICAgLy8gQ2FsbGJhY2sgdG8gYmUgcnVuIHRoZSBuZXh0IHRpbWUgdmFsaWRhdGlvbiBmaW5pc2hlc1xuICAgIHRoaXMuX29uVmFsaWRhdGUgPSBudWxsXG5cbiAgICAvLyBUaGUgYmFzZUZpZWxkcyBhdHRyaWJ1dGUgaXMgdGhlICpwcm90b3R5cGUtd2lkZSogZGVmaW5pdGlvbiBvZiBmaWVsZHMuXG4gICAgLy8gQmVjYXVzZSBhIHBhcnRpY3VsYXIgKmluc3RhbmNlKiBtaWdodCB3YW50IHRvIGFsdGVyIHRoaXMuZmllbGRzLCB3ZVxuICAgIC8vIGNyZWF0ZSB0aGlzLmZpZWxkcyBoZXJlIGJ5IGRlZXAgY29weWluZyBiYXNlRmllbGRzLiBJbnN0YW5jZXMgc2hvdWxkXG4gICAgLy8gYWx3YXlzIG1vZGlmeSB0aGlzLmZpZWxkczsgdGhleSBzaG91bGQgbm90IG1vZGlmeSBiYXNlRmllbGRzLlxuICAgIHRoaXMuZmllbGRzID0gY29weS5kZWVwQ29weSh0aGlzLmJhc2VGaWVsZHMpXG5cbiAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICAgIC8vIE5vdyB0aGF0IGZvcm0uZmllbGRzIGV4aXN0cywgd2UgY2FuIGNoZWNrIGlmIHRoZXJlJ3MgYW55IGNvbmZpZ3VyYXRpb25cbiAgICAgIC8vIHdoaWNoICpuZWVkcyogb25DaGFuZ2Ugb24gdGhlIGZvcm0gb3IgaXRzIGZpZWxkcy5cbiAgICAgIGlmICghaXMuRnVuY3Rpb24oa3dhcmdzLm9uQ2hhbmdlKSAmJiB0aGlzLl9uZWVkc09uQ2hhbmdlKCkpIHtcbiAgICAgICAgdXRpbC53YXJuaW5nKFwiWW91IGRpZG4ndCBwcm92aWRlIGFuIG9uQ2hhbmdlIGNhbGxiYWNrIGZvciBhIFwiICtcbiAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2Zvcm1OYW1lKCkgKyAnIHdoaWNoIGhhcyBjb250cm9sbGVkIGZpZWxkcy4gVGhpcyAnICtcbiAgICAgICAgICAgICAgICAgICAgICd3aWxsIHJlc3VsdCBpbiByZWFkLW9ubHkgZmllbGRzLicpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29weSBpbml0aWFsIHZhbHVlcyB0byB0aGUgZGF0YSBvYmplY3QsIGFzIGl0IHJlcHJlc2VudHMgZm9ybSBpbnB1dCAtXG4gICAgLy8gbGl0ZXJhbGx5IHNvIGluIHRoZSBjYXNlIG9mIGNvbnRyb2xsZWQgY29tcG9uZW50cyBvbmNlIHdlIHN0YXJ0IHRha2luZ1xuICAgIC8vIHNvbWUgZGF0YSBhbmQgaXNJbml0aWFsUmVuZGVyIGZsaXBzIHRvIGZhbHNlLlxuICAgIGlmICh0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgICAgdGhpcy5fY29weUluaXRpYWxUb0RhdGEoKVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBDYWxscyB0aGUgb25DaGFuZ2UgZnVuY3Rpb24gaWYgaXQncyBiZWVuIHByb3ZpZGVkLiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZFxuICogZXZlcnkgdGltZSB0aGUgZm9ybSBtYWtlcyBhIGNoYW5nZSB0byBpdHMgc3RhdGUgd2hpY2ggcmVxdWlyZXMgcmVkaXNwbGF5LlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX3N0YXRlQ2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodHlwZW9mIHRoaXMub25DaGFuZ2UgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMub25DaGFuZ2UoKVxuICB9XG59XG5cbi8qKlxuICogQ29waWVzIGluaXRpYWwgZGF0YSB0byB0aGUgaW5wdXQgZGF0YSBvYmplY3QsIGFzIGl0IHJlcHJlc2VudHMgZm9ybSBpbnB1dCAtXG4gKiB3aGVuIHVzaW5nIGNvbnRyb2xsZWQgY29tcG9uZW50cyBvbmNlIHdlIHN0YXJ0IHRha2luZyBzb21lIGRhdGEsXG4gKiBpc0luaXRpYWxSZW5kZXIgZmxpcHMgdG8gZmFsc2UgYW5kIHRoaXMuZGF0YSBpcyB1c2VkIGZvciByZW5kZXJpbmcgd2lkZ2V0cy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9jb3B5SW5pdGlhbFRvRGF0YSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaW5pdGlhbERhdGEgPSBvYmplY3QuZXh0ZW5kKHRoaXMuX2ZpZWxkSW5pdGlhbERhdGEoKSwgdGhpcy5pbml0aWFsKVxuICB2YXIgaW5pdGlhbEZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyhpbml0aWFsRGF0YSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbml0aWFsRmllbGROYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgZmllbGROYW1lID0gaW5pdGlhbEZpZWxkTmFtZXNbaV1cbiAgICBpZiAodHlwZW9mIHRoaXMuZmllbGRzW2ZpZWxkTmFtZV0gPT0gJ3VuZGVmaW5lZCcpIHsgY29udGludWUgfVxuICAgIC8vIERvbid0IGNvcHkgaW5pdGlhbCB0byBpbnB1dCBkYXRhIGZvciBmaWVsZHMgd2hpY2ggY2FuJ3QgaGF2ZSB0aGVcbiAgICAvLyBpbml0aWFsIGRhdGEgc2V0IGFzIHRoZWlyIGN1cnJlbnQgdmFsdWUuXG4gICAgaWYgKCF0aGlzLmZpZWxkc1tmaWVsZE5hbWVdLndpZGdldC5pc1ZhbHVlU2V0dGFibGUpIHsgY29udGludWUgfVxuICAgIHRoaXMuZGF0YVt0aGlzLmFkZFByZWZpeChmaWVsZE5hbWUpXSA9IGluaXRpYWxEYXRhW2ZpZWxkTmFtZV1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgaW5pdGlhbCBkYXRhIGNvbmZpZ3VyZWQgaW4gdGhpcyBmb3JtJ3MgZmllbGRzLlxuICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsKj59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fZmllbGRJbml0aWFsRGF0YSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZmllbGRJbml0aWFsID0ge31cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhciBmaWVsZE5hbWUgPSBmaWVsZE5hbWVzW2ldXG4gICAgdmFyIGluaXRpYWwgPSB0aGlzLmZpZWxkc1tmaWVsZE5hbWVdLmluaXRpYWxcbiAgICBpZiAoaW5pdGlhbCAhPT0gbnVsbCkge1xuICAgICAgZmllbGRJbml0aWFsW2ZpZWxkTmFtZV0gPSBpbml0aWFsXG4gICAgfVxuICB9XG4gIHJldHVybiBmaWVsZEluaXRpYWxcbn1cblxuLyoqXG4gKiBUcmllcyB0byBjb25zdHJ1Y3QgYSBkaXNwbGF5IG5hbWUgZm9yIHRoZSBmb3JtIGZvciBkaXNwbGF5IGluIGVycm9yIG1lc3NhZ2VzLlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2Zvcm1OYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuYW1lID0gdGhpcy5kaXNwbGF5TmFtZSB8fCB0aGlzLmNvbnN0cnVjdG9yLm5hbWVcbiAgcmV0dXJuIChuYW1lID8gXCInXCIgKyBuYW1lICsgXCInXCIgOiAnRm9ybScpXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZm9ybSBvciBhbnkgb2YgaXRzIGZpZWxkcyBhcmUgY29uZmlndXJlZCB0b1xuICogICBnZW5lcmF0ZSBjb250cm9sbGVkIGNvbXBvbmVudHMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fbmVlZHNPbkNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5jb250cm9sbGVkID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICB2YXIgbmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAodGhpcy5maWVsZHNbbmFtZXNbaV1dLmNvbnRyb2xsZWQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBWYWxpZGF0aW9uID09PVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGUgZm9ybSBmcm9tIHNjcmF0Y2guIElmIGEgPGZvcm0+IGlzIGdpdmVuLCBkYXRhIGZyb20gaXQgd2lsbCBiZVxuICogc2V0IG9uIHRoaXMgZm9ybSBmaXJzdC4gT3RoZXJ3aXNlLCB2YWxpZGF0aW9uIHdpbGwgYmUgZG9uZSB3aXRoIHRoaXMgZm9ybSdzXG4gKiBjdXJyZW50IGlucHV0IGRhdGEuXG4gKiBAcGFyYW0geyhSZWFjdEVsZW1lbnR8SFRNTEZvcm1FbGVtZW50KT19IGZvcm0gdGhlIDxmb3JtPiBjb250YWluaW5nIHRoaXNcbiAqIGZvcm0ncyByZW5kZXJlZCB3aWRnZXRzIC0gdGhpcyBjYW4gYmUgYSBSZWFjdCA8Zm9ybT4gY29tcG9uZW50IG9yIGEgcmVhbFxuICogPGZvcm0+IERPTSBub2RlLlxuICogQHBhcmFtIHtmdW5jdGlvbihlcnIsIGlzVmFsaWQsIGNsZWFuZWREYXRhKT19IGNiIGNhbGxiYWNrIGZvciBhc3luY2hyb25vdXNcbiAqICAgdmFsaWRhdGlvbi5cbiAqIEByZXR1cm4ge2Jvb2xlYW58dW5kZWZpbmVkfSB0cnVlIGlmIHRoZSBmb3JtIG9ubHkgaGFzIHN5bmNocm9ub3VzIHZhbGlkYXRpb25cbiAqICAgYW5kIGlzIHZhbGlkLlxuICogQHRocm93cyBpZiB0aGUgZm9ybSBoYXMgYXN5bmNocm9ub3VzIHZhbGlkYXRpb24gYW5kIGEgY2FsbGJhY2sgaXMgbm90XG4gKiAgIHByb3ZpZGVkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihmb3JtLCBjYikge1xuICB0aGlzLl9jYW5jZWxQZW5kaW5nT3BlcmF0aW9ucygpXG4gIGlmIChpcy5GdW5jdGlvbihmb3JtKSkge1xuICAgIGNiID0gZm9ybVxuICAgIGZvcm0gPSBudWxsXG4gIH1cbiAgaWYgKGZvcm0pIHtcbiAgICBpZiAodHlwZW9mIGZvcm0uZ2V0RE9NTm9kZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmb3JtID0gZm9ybS5nZXRET01Ob2RlKClcbiAgICB9XG4gICAgdGhpcy5kYXRhID0gdXRpbC5mb3JtRGF0YShmb3JtKVxuICB9XG4gIHJldHVybiAodGhpcy5pc0FzeW5jKCkgPyB0aGlzLl92YWxpZGF0ZUFzeW5jKGNiKSA6IHRoaXMuX3ZhbGlkYXRlU3luYygpKVxufVxuXG5CYXNlRm9ybS5wcm90b3R5cGUuX3ZhbGlkYXRlQXN5bmMgPSBmdW5jdGlvbihjYikge1xuICBpZiAoIWlzLkZ1bmN0aW9uKGNiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdZb3UgbXVzdCBwcm92aWRlIGEgY2FsbGJhY2sgdG8gdmFsaWRhdGUoKSB3aGVuIGEgZm9ybSBoYXMgJyArXG4gICAgICAnYXN5bmNocm9ub3VzIHZhbGlkYXRpb24uJ1xuICAgIClcbiAgfVxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgdGhpcy5fb25WYWxpZGF0ZSA9IGNiXG4gIHRoaXMuZnVsbENsZWFuKClcbiAgLy8gRGlzcGxheSBhc3luYyBwcm9ncmVzcyBpbmRpY2F0b3JzXG4gIHRoaXMuX3N0YXRlQ2hhbmdlZCgpXG59XG5cbkJhc2VGb3JtLnByb3RvdHlwZS5fdmFsaWRhdGVTeW5jID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIHRoaXMuaXNJbml0aWFsUmVuZGVyID0gZmFsc2VcbiAgfVxuICB0aGlzLmZ1bGxDbGVhbigpXG4gIC8vIERpc3BsYXkgY2hhbmdlcyB0byB2YWxpZC9pbnZhbGlkIHN0YXRlXG4gIHRoaXMuX3N0YXRlQ2hhbmdlZCgpXG4gIHJldHVybiB0aGlzLmlzVmFsaWQoKVxufVxuXG4vKipcbiAqIENsZWFucyBkYXRhIGZvciBhbGwgZmllbGRzIGFuZCB0cmlnZ2VycyBjcm9zcy1mb3JtIGNsZWFuaW5nLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuZnVsbENsZWFuID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2Vycm9ycyA9IG5ldyBFcnJvck9iamVjdCgpXG4gIGlmICh0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIHJldHVybiAvLyBTdG9wIGZ1cnRoZXIgcHJvY2Vzc2luZ1xuICB9XG5cbiAgdGhpcy5jbGVhbmVkRGF0YSA9IHt9XG5cbiAgLy8gSWYgdGhlIGZvcm0gaXMgcGVybWl0dGVkIHRvIGJlIGVtcHR5LCBhbmQgbm9uZSBvZiB0aGUgZm9ybSBkYXRhIGhhc1xuICAvLyBjaGFuZ2VkIGZyb20gdGhlIGluaXRpYWwgZGF0YSwgc2hvcnQgY2lyY3VpdCBhbnkgdmFsaWRhdGlvbi5cbiAgaWYgKHRoaXMuZW1wdHlQZXJtaXR0ZWQgJiYgIXRoaXMuaGFzQ2hhbmdlZCgpKSB7XG4gICAgdGhpcy5fZmluaXNoZWRWYWxpZGF0aW9uKG51bGwpXG4gICAgcmV0dXJuXG4gIH1cblxuICB0aGlzLl9jbGVhbkZpZWxkcygpXG59XG5cbi8qKlxuICogQ2xlYW5zIGRhdGEgZm9yIHRoZSBnaXZlbiBmaWVsZCBuYW1lcyBhbmQgdHJpZ2dlcnMgY3Jvc3MtZm9ybSBjbGVhbmluZyBpblxuICogY2FzZSBhbnkgY2xlYW5lZERhdGEgaXQgdXNlcyBoYXMgY2hhbmdlZC5cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGZpZWxkcyBmaWVsZCBuYW1lcy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnBhcnRpYWxDbGVhbiA9IGZ1bmN0aW9uKGZpZWxkcykge1xuICB0aGlzLl9yZW1vdmVFcnJvcnMoZmllbGRzKVxuXG4gIC8vIElmIHRoZSBmb3JtIGlzIHBlcm1pdHRlZCB0byBiZSBlbXB0eSwgYW5kIG5vbmUgb2YgdGhlIGZvcm0gZGF0YSBoYXNcbiAgLy8gY2hhbmdlZCBmcm9tIHRoZSBpbml0aWFsIGRhdGEsIHNob3J0IGNpcmN1aXQgYW55IHZhbGlkYXRpb24uXG4gIGlmICh0aGlzLmVtcHR5UGVybWl0dGVkICYmICF0aGlzLmhhc0NoYW5nZWQoKSkge1xuICAgIGlmICh0aGlzLl9lcnJvcnMuaXNQb3B1bGF0ZWQoKSkge1xuICAgICAgdGhpcy5fZXJyb3JzID0gRXJyb3JPYmplY3QoKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIHRoaXMuX3ByZUNsZWFuRmllbGRzKGZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdGhpcy5fY2xlYW5GaWVsZChmaWVsZHNbaV0pXG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIGNsZWFucyBldmVyeSBmaWVsZCBpbiB0aGUgZm9ybS5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9jbGVhbkZpZWxkcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuZmllbGRzKVxuICB0aGlzLl9wcmVDbGVhbkZpZWxkcyhmaWVsZE5hbWVzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbCA7IGkrKykge1xuICAgIHRoaXMuX2NsZWFuRmllbGQoZmllbGROYW1lc1tpXSlcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgcGVuZGluZyB2YWxpZGF0aW9uIHN0YXRlIHByaW9yIHRvIGNsZWFuaW5nIGZpZWxkcyBhbmQgY29uZmlndXJlc1xuICogY3Jvc3MtZmllbGQgY2xlYW5pbmcgdG8gcnVuIGFmdGVyIGl0cyBkZXBlbmRlbnQgZmllbGRzIGhhdmUgYmVlbiBjbGVhbmVkLCBvclxuICogYWZ0ZXIgYWxsIGZpZWxkcyBoYXZlIGJlZW4gY2xlYW5lZCBpZiBkZXBlbmRlbmNpZXMgaGF2ZSBub3QgYmVlbiBjb25maWd1cmVkLlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gZmllbGROYW1lcyBmaWVsZHMgd2hpY2ggYXJlIGFib3V0IHRvIGJlIGNsZWFuZWQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fcHJlQ2xlYW5GaWVsZHMgPSBmdW5jdGlvbihmaWVsZE5hbWVzKSB7XG4gIC8vIEFkZCBhbGwgZmllbGQgbmFtZXMgdG8gdGhvc2UgcGVuZGluZyB2YWxpZGF0aW9uXG4gIG9iamVjdC5leHRlbmQodGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24sIG9iamVjdC5sb29rdXAoZmllbGROYW1lcykpXG5cbiAgLy8gQWRkIGFwcHJvcHJpYXRlIGZpZWxkIG5hbWVzIHRvIGRldGVybWluZSB3aGVuIHRvIHJ1biBjcm9zcy1maWVsZCBjbGVhbmluZ1xuICB2YXIgaSwgbFxuICBpZiAodHlwZW9mIHRoaXMuY2xlYW4uZmllbGRzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgZm9yIChpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5jbGVhbi5maWVsZHNbZmllbGROYW1lc1tpXV0pIHtcbiAgICAgICAgdGhpcy5fcnVuQ2xlYW5BZnRlcltmaWVsZE5hbWVzW2ldXSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gSWdub3JlIGFueSBpbnZhbGlkIGZpZWxkIG5hbWVzIGdpdmVuXG4gICAgZm9yIChpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5maWVsZHNbZmllbGROYW1lc1tpXV0pIHtcbiAgICAgICAgdGhpcy5fcnVuQ2xlYW5BZnRlcltmaWVsZE5hbWVzW2ldXSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIGNsZWFucyB0aGUgbmFtZWQgZmllbGQgYW5kIHJ1bnMgYW55IGN1c3RvbSB2YWxpZGF0aW9uIGZ1bmN0aW9uXG4gKiB0aGF0J3MgYmVlbiBwcm92aWRlZCBmb3IgaXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiBhIGZvcm0gZmllbGQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fY2xlYW5GaWVsZCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgaWYgKCFvYmplY3QuaGFzT3duKHRoaXMuZmllbGRzLCBuYW1lKSkge1xuICAgIHRocm93IG5ldyBFcnJvcih0aGlzLl9mb3JtTmFtZSgpICsgXCIgaGFzIG5vIGZpZWxkIG5hbWVkICdcIiArIG5hbWUgKyBcIidcIilcbiAgfVxuXG4gIHZhciBmaWVsZCA9IHRoaXMuZmllbGRzW25hbWVdXG4gIC8vIHZhbHVlRnJvbURhdGEoKSBnZXRzIHRoZSBkYXRhIGZyb20gdGhlIGRhdGEgb2JqZWN0cy5cbiAgLy8gRWFjaCB3aWRnZXQgdHlwZSBrbm93cyBob3cgdG8gcmV0cmlldmUgaXRzIG93biBkYXRhLCBiZWNhdXNlIHNvbWUgd2lkZ2V0c1xuICAvLyBzcGxpdCBkYXRhIG92ZXIgc2V2ZXJhbCBIVE1MIGZpZWxkcy5cbiAgdmFyIHZhbHVlID0gZmllbGQud2lkZ2V0LnZhbHVlRnJvbURhdGEodGhpcy5kYXRhLCB0aGlzLmZpbGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZFByZWZpeChuYW1lKSlcbiAgdmFyIGFzeW5jID0gZmFsc2VcbiAgdmFyIGVycm9yID0gbnVsbFxuXG4gIHRyeSB7XG4gICAgaWYgKGZpZWxkIGluc3RhbmNlb2YgRmlsZUZpZWxkKSB7XG4gICAgICB2YXIgaW5pdGlhbCA9IG9iamVjdC5nZXQodGhpcy5pbml0aWFsLCBuYW1lLCBmaWVsZC5pbml0aWFsKVxuICAgICAgdmFsdWUgPSBmaWVsZC5jbGVhbih2YWx1ZSwgaW5pdGlhbClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YWx1ZSA9IGZpZWxkLmNsZWFuKHZhbHVlKVxuICAgIH1cbiAgICB0aGlzLmNsZWFuZWREYXRhW25hbWVdID0gdmFsdWVcbiAgICB2YXIgY3VzdG9tQ2xlYW4gPSB0aGlzLl9nZXRDdXN0b21DbGVhbihuYW1lKVxuICAgIGlmIChpcy5GdW5jdGlvbihjdXN0b21DbGVhbikpIHtcbiAgICAgIGFzeW5jID0gdGhpcy5fcnVuQ3VzdG9tQ2xlYW4obmFtZSwgY3VzdG9tQ2xlYW4pXG4gICAgfVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IobmFtZSwgZSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlcnJvciA9IGVcbiAgICB9XG4gIH1cblxuICBpZiAoIWFzeW5jKSB7XG4gICAgdGhpcy5fZmllbGRDbGVhbmVkKG5hbWUsIGVycm9yKVxuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgY3VzdG9tIGNsZWFuaW5nIG1ldGhvZCBmb3IgYSBmaWVsZC4gVGhlc2UgY2FuIGJlIG5hbWVkIGNsZWFuPE5hbWU+XG4gKiBvciBjbGVhbl88bmFtZT4uXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGROYW1lXG4gKiBAcmV0dXJuIHtmdW5jdGlvbnx1bmRlZmluZWR9XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fZ2V0Q3VzdG9tQ2xlYW4gPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgcmV0dXJuICh0aGlzWydjbGVhbicgKyBmaWVsZE5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBmaWVsZE5hbWUuc3Vic3RyKDEpXSB8fFxuICAgICAgICAgIHRoaXNbJ2NsZWFuXycgKyBmaWVsZE5hbWVdKVxufVxuXG4vKipcbiAqIENhbGxzIGEgY3VzdG9tIGNsZWFuaW5nIG1ldGhvZCwgZXhwZWN0aW5nIHN5bmNocm9ub3VzIG9yIGFzeW5jaHJvbm91c1xuICogYmVoYXZpb3VyLCBkZXBlbmRpbmcgb24gaXRzIGFyaXR5LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkTmFtZSBhIGZpZWxkIG5hbWUuXG4gKiBAcGFyYW0geyhmdW5jdGlvbigpfGZ1bmN0aW9uKGZ1bmN0aW9uKEVycm9yLCBzdHJpbmcsIHN0cmluZ3xWYWxpZGF0aW9uRXJyb3IpKSl9IGN1c3RvbUNsZWFuXG4gKiAgIHRoZSBjdXN0b20gY2xlYW5pbmcgbWV0aG9kIGZvciB0aGUgZmllbGQuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNsZWFuaW5nIGlzIHJ1bm5pbmcgYXN5bmNocm9ub3VzbHksIGZhbHNlIGlmIGl0IGp1c3RcbiAqICAgcmFuIHN5bmNocm9ub3VzbHkuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fcnVuQ3VzdG9tQ2xlYW4gPSBmdW5jdGlvbihmaWVsZE5hbWUsIGN1c3RvbUNsZWFuKSB7XG4gIC8vIENoZWNrIGFyaXR5IHRvIHNlZSBpZiB3ZSBoYXZlIGEgY2FsbGJhY2sgaW4gdGhlIGZ1bmN0aW9uIHNpZ25hdHVyZVxuICBpZiAoY3VzdG9tQ2xlYW4ubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gU3luY2hyb25vdXMgcHJvY2Vzc2luZyBvbmx5IGV4cGVjdGVkXG4gICAgY3VzdG9tQ2xlYW4uY2FsbCh0aGlzKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgYXN5bmMgYW5kIHRoZXJlJ3Mgb25lIHBlbmRpbmcsIHByZXZlbnQgaXRzXG4gIC8vIGNhbGxiYWNrIGZyb20gZG9pbmcgYW55dGhpbmcuXG4gIGlmICh0eXBlb2YgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltmaWVsZE5hbWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgb2JqZWN0LnBvcCh0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uLCBmaWVsZE5hbWUpLmNhbmNlbCgpXG4gIH1cbiAgLy8gU2V0IHVwIGNhbGxiYWNrIGZvciBhc3luYyBwcm9jZXNzaW5nIC0gdGhlIGFyZ3VtZW50IGZvciBhZGRFcnJvcigpXG4gIC8vIHNob3VsZCBiZSBwYXNzZWQgdmlhIHRoZSBjYWxsYmFjayBhcyBjYWxsaW5nIGl0IGRpcmVjdGx5IHByZXZlbnRzIHVzXG4gIC8vIGZyb20gY29tcGxldGVseSBpZ25vcmluZyB0aGUgY2FsbGJhY2sgaWYgdmFsaWRhdGlvbiBmaXJlcyBhZ2Fpbi5cbiAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZXJyLCB2YWxpZGF0aW9uRXJyb3IpIHtcbiAgICBpZiAodmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKGZpZWxkTmFtZSA9PSBOT05fRklFTERfRVJST1JTID8gbnVsbCA6IGZpZWxkTmFtZSwgdmFsaWRhdGlvbkVycm9yKVxuICAgIH1cbiAgICB0aGlzLl9maWVsZENsZWFuZWQoZmllbGROYW1lLCBlcnIpXG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbiAgfS5iaW5kKHRoaXMpXG4gIHZhciBjYW5jZWxsYWJsZUNhbGxiYWNrID0gdXRpbC5jYW5jZWxsYWJsZShjYWxsYmFjaylcblxuICAvLyBBbiBleHBsaWNpdCByZXR1cm4gdmFsdWUgb2YgZmFsc2UgaW5kaWNhdGVzIHRoYXQgYXN5bmMgcHJvY2Vzc2luZyBpc1xuICAvLyBiZWluZyBza2lwcGVkIChlLmcuIGJlY2F1c2Ugc3luYyBjaGVja3MgaW4gdGhlIG1ldGhvZCBmYWlsZWQgZmlyc3QpXG4gIHZhciByZXR1cm5WYWx1ZSA9IGN1c3RvbUNsZWFuLmNhbGwodGhpcywgY2FuY2VsbGFibGVDYWxsYmFjaylcbiAgaWYgKHJldHVyblZhbHVlICE9PSBmYWxzZSkge1xuICAgIC8vIEFzeW5jIHByb2Nlc3NpbmcgaXMgaGFwcGVuaW5nISBNYWtlIHRoZSBjYWxsYmFjayBjYW5jZWxsYWJsZSBhbmRcbiAgICAvLyBob29rIHVwIGFueSBjdXN0b20gb25DYW5jZWwgaGFuZGxpbmcgcHJvdmlkZWQuXG4gICAgaWYgKHJldHVyblZhbHVlICYmIHR5cGVvZiByZXR1cm5WYWx1ZS5vbkNhbmNlbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjay5vbkNhbmNlbCA9IHJldHVyblZhbHVlLm9uQ2FuY2VsXG4gICAgfVxuICAgIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bZmllbGROYW1lXSA9IGNhbmNlbGxhYmxlQ2FsbGJhY2tcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIGNvbXBsZXRpb24gb2YgZmllbGQgY2xlYW5pbmcuIFRyaWdnZXJzIGZ1cnRoZXIgZmllbGQgY2xlYW5pbmcgb3JcbiAqIHNpZ25hbHMgdGhlIGVuZCBvZiB2YWxpZGF0aW9uLCBhcyBuZWNlc3NhcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGROYW1lXG4gKiBAcGFyYW0ge0Vycm9yPX0gZXJyIGFuIGVycm9yIGNhdWdodCB3aGlsZSBjbGVhbmluZyB0aGUgZmllbGQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fZmllbGRDbGVhbmVkID0gZnVuY3Rpb24oZmllbGROYW1lLCBlcnIpIHtcbiAgdmFyIHdhc1BlbmRpbmcgPSBkZWxldGUgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb25bZmllbGROYW1lXVxuICBpZiAodGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltmaWVsZE5hbWVdKSB7XG4gICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bZmllbGROYW1lXVxuICB9XG5cbiAgaWYgKGVycikge1xuICAgIGlmIChcInByb2R1Y3Rpb25cIiAhPT0gXCJkZXZlbG9wbWVudFwiKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjbGVhbmluZyAnICsgdGhpcy5fZm9ybU5hbWUoKSArICcuJyArIGZpZWxkTmFtZSArXG4gICAgICAgICAgICAgICAgICAgICc6JyArIGVyci5tZXNzYWdlKVxuICAgIH1cbiAgICAvLyBTdG9wIHRyYWNraW5nIHZhbGlkYXRpb24gcHJvZ3Jlc3Mgb24gZXJyb3IsIGFuZCBkb24ndCBjYWxsIGNsZWFuKClcbiAgICB0aGlzLl9wZW5kaW5nVmFsaWRhdGlvbiA9IHt9XG4gICAgdGhpcy5fcnVuQ2xlYW5BZnRlciA9IHt9XG4gICAgdGhpcy5fZmluaXNoZWRWYWxpZGF0aW9uKGVycilcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIFJ1biBjbGVhbigpIGlmIHRoaXMgdGhpcyB3YXMgdGhlIGxhc3QgZmllbGQgaXQgd2FzIHdhaXRpbmcgZm9yXG4gIGlmICh0aGlzLl9ydW5DbGVhbkFmdGVyW2ZpZWxkTmFtZV0pIHtcbiAgICBkZWxldGUgdGhpcy5fcnVuQ2xlYW5BZnRlcltmaWVsZE5hbWVdXG4gICAgaWYgKGlzLkVtcHR5KHRoaXMuX3J1bkNsZWFuQWZ0ZXIpKSB7XG4gICAgICB0aGlzLl9jbGVhbkZvcm0oKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG5cbiAgLy8gU2lnbmFsIHRoZSBlbmQgb2YgdmFsaWRhdGlvbiBpZiB0aGlzIHdhcyB0aGUgbGFzdCBmaWVsZCB3ZSB3ZXJlIHdhaXRpbmcgZm9yXG4gIGlmICh3YXNQZW5kaW5nICYmIGlzLkVtcHR5KHRoaXMuX3BlbmRpbmdWYWxpZGF0aW9uKSkge1xuICAgIHRoaXMuX2ZpbmlzaGVkVmFsaWRhdGlvbihudWxsKVxuICB9XG59XG5cbi8qKlxuICogSG9vayBmb3IgZG9pbmcgYW55IGV4dHJhIGZvcm0td2lkZSBjbGVhbmluZyBhZnRlciBlYWNoIEZpZWxkIGhhcyBiZWVuIGNsZWFuZWQuXG4gKiBBbnkgVmFsaWRhdGlvbkVycm9yIHRocm93biBieSBzeW5jaHJvbm91cyB2YWxpZGF0aW9uIGluIHRoaXMgbWV0aG9kIHdpbGwgbm90XG4gKiBiZSBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGZpZWxkOyBpdCB3aWxsIGhhdmUgYSBzcGVjaWFsLWNhc2UgYXNzb2NpYXRpb25cbiAqIHdpdGggdGhlIGZpZWxkIG5hbWVkICdfX2FsbF9fJy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oRXJyb3IsIHN0cmluZywgc3RyaW5nfFZhbGlkYXRpb25FcnJvcik9fSBjYiBhIGNhbGxiYWNrIHRvIHNpZ25hbCB0aGVcbiAqICAgZW5kIG9mIGFzeW5jaHJvbm91cyB2YWxpZGF0aW9uLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuY2xlYW4gPSBub29wXG5cbi8qKlxuICogQ2FsbHMgdGhlIGNsZWFuKCkgaG9vay5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9jbGVhbkZvcm0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFzeW5jID0gZmFsc2VcbiAgdmFyIGVycm9yID0gbnVsbFxuICB0cnkge1xuICAgIGlmICh0aGlzLmNsZWFuICE9PSBub29wKSB7XG4gICAgICBhc3luYyA9IHRoaXMuX3J1bkN1c3RvbUNsZWFuKE5PTl9GSUVMRF9FUlJPUlMsIHRoaXMuY2xlYW4pXG4gICAgfVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpIHtcbiAgICAgIHRoaXMuYWRkRXJyb3IobnVsbCwgZSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlcnJvciA9IGVcbiAgICB9XG4gIH1cblxuICBpZiAoIWFzeW5jKSB7XG4gICAgdGhpcy5fZmllbGRDbGVhbmVkKE5PTl9GSUVMRF9FUlJPUlMsIGVycm9yKVxuICB9XG59XG5cbkJhc2VGb3JtLnByb3RvdHlwZS5fZmluaXNoZWRWYWxpZGF0aW9uID0gZnVuY3Rpb24oZXJyKSB7XG4gIGlmICghdGhpcy5pc0FzeW5jKCkpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gICAgLy8gU3luY2hyb25vdXMgZm9ybSB2YWxpZGF0aW9uIHJlc3VsdHMgd2lsbCBiZSByZXR1cm5lZCB2aWEgdGhlIG9yaWdpbmFsXG4gICAgLy8gY2FsbCB3aGljaCB0cmlnZ2VyZWQgdmFsaWRhdGlvbi5cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXMuRnVuY3Rpb24odGhpcy5fb25WYWxpZGF0ZSkpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLl9vblZhbGlkYXRlXG4gICAgdGhpcy5fb25WYWxpZGF0ZSA9IG51bGxcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgIH1cbiAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZCgpXG4gICAgY2FsbGJhY2sobnVsbCwgaXNWYWxpZCwgaXNWYWxpZCA/IHRoaXMuY2xlYW5lZERhdGEgOiBudWxsKVxuICB9XG59XG5cbi8qKlxuICogQ2FuY2VscyBhbnkgcGVuZGluZyBmaWVsZCB2YWxpZGF0aW9ucyBhbmQgYXN5bmMgdmFsaWRhdGlvbnMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fY2FuY2VsUGVuZGluZ09wZXJhdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgT2JqZWN0LmtleXModGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbikuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuICAgIG9iamVjdC5wb3AodGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbiwgZmllbGQpLmNhbmNlbCgpXG4gIH0uYmluZCh0aGlzKSlcbiAgT2JqZWN0LmtleXModGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbikuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuICAgIG9iamVjdC5wb3AodGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbiwgZmllbGQpLmNhbmNlbCgpXG4gIH0uYmluZCh0aGlzKSlcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBFdmVudCBIYW5kbGluZyA9PT1cblxuLyoqXG4gKiBIYW5kbGVzIHZhbGlkYXRpbmcgdGhlIGZpZWxkIHdoaWNoIGlzIHRoZSB0YXJnZXQgb2YgdGhlIGdpdmVuIGV2ZW50IGJhc2VkXG4gKiBvbiBpdHMgdmFsaWRhdGlvbiBjb25maWcuIFRoaXMgd2lsbCBiZSBob29rZWQgdXAgdG8gdGhlIGFwcHJvcHJpYXRlIGV2ZW50XG4gKiBhcyBwZXIgdGhlIGZpZWxkJ3MgdmFsaWRhdGlvbiBjb25maWcuXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsaWRhdGlvbiB0aGUgZmllbGQncyB2YWxpZGF0aW9uIGNvbmZpZyBmb3IgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtTeW50aGV0aWNFdmVudH0gZSB0aGUgZXZlbnQgYmVpbmcgaGFuZGxlZC5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9oYW5kbGVGaWVsZEV2ZW50ID0gZnVuY3Rpb24odmFsaWRhdGlvbiwgZSkge1xuICAvLyBVcGRhdGUgZm9ybS5kYXRhIHdpdGggdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIGZpZWxkIHdoaWNoIGlzIHRoZSB0YXJnZXQgb2ZcbiAgLy8gdGhlIGV2ZW50LlxuICB2YXIgaHRtbE5hbWUgPSBlLnRhcmdldC5uYW1lXG4gIHZhciBmaWVsZE5hbWUgPSB0aGlzLnJlbW92ZVByZWZpeChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbmV3Zm9ybXMtZmllbGQnKSB8fCBodG1sTmFtZSlcbiAgdmFyIGZpZWxkID0gdGhpcy5maWVsZHNbZmllbGROYW1lXVxuICB2YXIgdGFyZ2V0RGF0YSA9IHV0aWwuZmllbGREYXRhKGUudGFyZ2V0LmZvcm0sIGh0bWxOYW1lKVxuICB0aGlzLmRhdGFbaHRtbE5hbWVdID0gdGFyZ2V0RGF0YVxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgaWYgKHRoaXMuY29udHJvbGxlZCB8fCBmaWVsZC5jb250cm9sbGVkKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbiAgfVxuXG4gIC8vIEJhaWwgb3V0IGVhcmx5IGlmIHRoZSBldmVudCBpcyBvbmx5IGJlaW5nIGhhbmRsZWQgdG8gdXBkYXRlIHRoZSBmaWVsZCdzIGRhdGFcbiAgaWYgKHZhbGlkYXRpb24udmFsaWRhdGUgPT09IGZhbHNlKSB7IHJldHVybiB9XG5cbiAgdmFyIHZhbGlkYXRlID0gZmFsc2VcblxuICAvLyBTcGVjaWFsIGNhc2VzIGZvciBvbkJsdXIsIGFzIGl0IGVuZHMgYSB1c2VyJ3MgaW50ZXJhY3Rpb24gd2l0aCBhIHRleHQgaW5wdXRcbiAgaWYgKHZhbGlkYXRpb24uZXZlbnQgPT0gJ29uQmx1cicpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBhbnkgcGVuZGluZyB2YWxpZGF0aW9uLCB0cmlnZ2VyIGl0IGltbWVkaWF0ZWx5XG4gICAgaWYgKHR5cGVvZiB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb25bZmllbGROYW1lXS50cmlnZ2VyKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBBbHdheXMgdmFsaWRhdGUgaWYgdGhlIGZpZWxkIGlzIHJlcXVpcmVkIGFuZCB0aGUgaW5wdXQgd2hpY2ggd2FzIGJsdXJyZWRcbiAgICAvLyB3YXMgZW1wdHkgKHNvbWUgZmllbGRzIGhhdmUgbXVsdGlwbGUgaW5wdXRzKS5cbiAgICB2YWxpZGF0ZSA9IChmaWVsZC5yZXF1aXJlZCAmJiBmaWVsZC5pc0VtcHR5VmFsdWUodGFyZ2V0RGF0YSkpXG4gIH1cblxuICAvLyBBbHdheXMgdmFsaWRhdGUgaWYgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgZmllbGQgaGFzIGJlZW4gaW50ZXJhY3RlZFxuICAvLyB3aXRoLlxuICBpZiAoIXZhbGlkYXRlKSB7XG4gICAgdmFyIGxhc3RWYWxpZGF0ZWREYXRhID0gb2JqZWN0LmdldCh0aGlzLl9sYXN0VmFsaWRhdGVkRGF0YSwgZmllbGROYW1lLCBzZW50aW5lbClcbiAgICB2YWxpZGF0ZSA9IChsYXN0VmFsaWRhdGVkRGF0YSA9PT0gc2VudGluZWwpXG4gIH1cblxuICAvLyBPdGhlcndpc2UsIHZhbGlkYXRlIGlmIGRhdGEgaGFzIGNoYW5nZWQgc2luY2UgdmFsaWRhdGlvbiB3YXMgbGFzdCBwZXJmb3JtZWRcbiAgLy8gLSB0aGlzIHByZXZlbnRzIGRpc3BsYXllZCB2YWxpZGF0aW9uIGVycm9ycyBiZWluZyBjbGVhcmVkIHVubmVjZXNzYXJpbHkuXG4gIGlmICghdmFsaWRhdGUpIHtcbiAgICB2YXIgZmllbGREYXRhID0gZmllbGQud2lkZ2V0LnZhbHVlRnJvbURhdGEodGhpcy5kYXRhLCBudWxsLCB0aGlzLmFkZFByZWZpeChmaWVsZE5hbWUpKVxuICAgIHZhbGlkYXRlID0gZmllbGREYXRhSGFzQ2hhbmdlZChsYXN0VmFsaWRhdGVkRGF0YSwgZmllbGREYXRhKVxuICB9XG5cbiAgLy8gQ2FuY2VsIGFueSBwZW5kaW5nIHZhbGlkYXRpb24gYXMgaXQncyBubyBsb25nZXIgbmVlZGVkIC0gdGhpcyBjYW4gaGFwcGVuXG4gIC8vIGlmIHRoZSB1c2VyIGVkaXRzIGEgZmllbGQgd2l0aCBkZWJvdW5jZWQgdmFsaWRhdGlvbiBhbmQgaXQgZW5kcyB1cCBiYWNrXG4gIC8vIGF0IGl0cyBvcmlnaW5hbCB2YWx1ZSBiZWZvcmUgdmFsaWRhdGlvbiBpcyB0cmlnZ2VyZWQuXG4gIGlmICghdmFsaWRhdGUgJiYgdHlwZW9mIHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb25bZmllbGROYW1lXSAhPSAndW5kZWZpbmVkJykge1xuICAgIG9iamVjdC5wb3AodGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbiwgZmllbGROYW1lKS5jYW5jZWwoKVxuICB9XG5cbiAgLy8gSWYgd2UgZG9uJ3QgbmVlZCB0byB2YWxpZGF0ZSwgd2UncmUgZG9uZSBoYW5kbGluZyB0aGUgZXZlbnRcbiAgaWYgKCF2YWxpZGF0ZSkgeyByZXR1cm4gfVxuXG4gIGlmICh2YWxpZGF0aW9uLmRlbGF5KSB7XG4gICAgdGhpcy5fZGVsYXllZEZpZWxkVmFsaWRhdGlvbihmaWVsZE5hbWUsIHZhbGlkYXRpb24uZGVsYXkpXG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5faW1tZWRpYXRlRmllbGRWYWxpZGF0aW9uKGZpZWxkTmFtZSlcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgZGVsYXllZCB2YWxpZGF0aW9uIG9mIGEgZmllbGQgd2l0aCBhIGRlYm91bmNlZCBmdW5jdGlvbiBhbmQgY2FsbHMgaXQsXG4gKiBvciBqdXN0IGNhbGxzIHRoZSBmdW5jdGlvbiBhZ2FpbiBpZiBpdCBhbHJlYWR5IGV4aXN0cywgdG8gcmVzZXQgdGhlIGRlbGF5LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkTmFtZVxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IGRlbGF5IHRpbWUgaW4gbXMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fZGVsYXllZEZpZWxkVmFsaWRhdGlvbiA9IGZ1bmN0aW9uKGZpZWxkTmFtZSwgZGVsYXkpIHtcbiAgaWYgKHR5cGVvZiB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0gPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0gPSB1dGlsLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb25bZmllbGROYW1lXVxuICAgICAgdGhpcy5faW1tZWRpYXRlRmllbGRWYWxpZGF0aW9uKGZpZWxkTmFtZSlcbiAgICB9LmJpbmQodGhpcyksIGRlbGF5KVxuICB9XG4gIHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb25bZmllbGROYW1lXSgpXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGEgZmllbGQgYW5kIG5vdGlmaWVzIHRoZSBSZWFjdCBjb21wb25lbnQgdGhhdCBzdGF0ZSBoYXMgY2hhbmdlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZE5hbWVcbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9pbW1lZGlhdGVGaWVsZFZhbGlkYXRpb24gPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgLy8gUmVtb3ZlIGFuZCBjYW5jZWwgYW55IHBlbmRpbmcgdmFsaWRhdGlvbiBmb3IgdGhlIGZpZWxkIHRvIGF2b2lkIGRvdWJsaW5nIHVwXG4gIC8vIHdoZW4gYm90aCBkZWxheWVkIGFuZCBpbW1lZGlhdGUgdmFsaWRhdGlvbiBhcmUgY29uZmlndXJlZC5cbiAgaWYgKHR5cGVvZiB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb24sIGZpZWxkTmFtZSkuY2FuY2VsKClcbiAgfVxuICB0aGlzLl9sYXN0VmFsaWRhdGVkRGF0YVtmaWVsZE5hbWVdID1cbiAgICAgIHRoaXMuZmllbGRzW2ZpZWxkTmFtZV0ud2lkZ2V0LnZhbHVlRnJvbURhdGEodGhpcy5kYXRhLCB0aGlzLmZpbGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZFByZWZpeChmaWVsZE5hbWUpKVxuICB0aGlzLnBhcnRpYWxDbGVhbihbZmllbGROYW1lXSlcbiAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gTXV0YWJpbGl0eSA9PT1cblxuLyoqXG4gKiBSZXNldHMgYSBmb3JtIGRhdGEgYmFjayB0byBpdHMgaW5pdGlhbCBzdGF0ZSwgb3B0aW9uYWxseSBwcm92aWRpbmcgbmV3IGluaXRpYWxcbiAqIGRhdGEuXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCAqPj19IG5ld0luaXRpYWwgbmV3IGluaXRpYWwgZGF0YSBmb3IgdGhlIGZvcm0uXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKG5ld0luaXRpYWwpIHtcbiAgdGhpcy5fY2FuY2VsUGVuZGluZ09wZXJhdGlvbnMoKVxuXG4gIGlmICh0eXBlb2YgbmV3SW5pdGlhbCAhPSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMuaW5pdGlhbCA9IG5ld0luaXRpYWxcbiAgfVxuXG4gIHRoaXMuZGF0YSA9IHt9XG4gIHRoaXMuY2xlYW5lZERhdGEgPSB7fVxuICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IHRydWVcblxuICB0aGlzLl9lcnJvcnMgPSBudWxsXG4gIHRoaXMuX2xhc3RIYXNDaGFuZ2VkID0gbnVsbFxuICB0aGlzLl9wZW5kaW5nVmFsaWRhdGlvbiA9IHt9XG4gIHRoaXMuX3J1bkNsZWFuQWZ0ZXIgPSB7fVxuICB0aGlzLl9sYXN0VmFsaWRhdGVkRGF0YSA9IHt9XG4gIHRoaXMuX29uVmFsaWRhdGUgPSBudWxsXG5cbiAgdGhpcy5fY29weUluaXRpYWxUb0RhdGEoKVxuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG4vKipcbiAqIFNldHMgdGhlIGZvcm0ncyBlbnRpcmUgaW5wdXQgZGF0YSwgYWxzbyB0cmlnZ2VyaW5nIHZhbGlkYXRpb24gYnkgZGVmYXVsdC5cbiAqIEBwYXJhbSB7b2JqZWN0LjxzdHJpbmcsKj59IGRhdGEgbmV3IGlucHV0IGRhdGEgZm9yIHRoZSBmb3JtLlxuICogQHBhcmFtIHtvYmplY3QuPHN0cmluZyxib29sZWFuPn0ga3dhcmdzIGRhdGEgc2V0dGluZyBvcHRpb25zLlxuICogQHJldHVybiB7Ym9vbGVhbnx1bmRlZmluZWR9IGlmIGRhdGEgc2V0dGluZyBvcHRpb25zIGluZGljYXRlIHRoZSBuZXcgZGF0YVxuICogICBzaG91bGQgYmUgdmFsaWRhdGVkIGFuZCB0aGUgZm9ybSBkb2VzIG5vdCBoYXZlIGFzeW5jaHJvbm91cyB2YWxpZGF0aW9uXG4gKiAgIGNvbmZpZ3VyZWQ6IHRydWUgaWYgdGhlIG5ldyBkYXRhIGlzIHZhbGlkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuc2V0RGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICBwcmVmaXhlZDogZmFsc2UsIHZhbGlkYXRlOiB0cnVlLCBfdHJpZ2dlclN0YXRlQ2hhbmdlOiB0cnVlXG4gIH0sIGt3YXJncylcblxuICB0aGlzLmRhdGEgPSAoa3dhcmdzLnByZWZpeGVkID8gZGF0YSA6IHRoaXMuX3ByZWZpeERhdGEoZGF0YSkpXG5cbiAgaWYgKHRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgdGhpcy5pc0luaXRpYWxSZW5kZXIgPSBmYWxzZVxuICB9XG4gIGlmIChrd2FyZ3MudmFsaWRhdGUpIHtcbiAgICB0aGlzLl9lcnJvcnMgPSBudWxsXG4gICAgLy8gVGhpcyBjYWxsIHVsdGltYXRlbHkgdHJpZ2dlcnMgYSBmdWxsQ2xlYW4oKSBiZWNhdXNlIF9lcnJvcnMgaXMgbnVsbFxuICAgIHZhciBpc1ZhbGlkID0gdGhpcy5pc1ZhbGlkKClcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBQcmV2ZW50IHZhbGlkYXRpb24gYmVpbmcgdHJpZ2dlcmVkIGlmIGVycm9ycygpIGlzIGFjY2Vzc2VkIGR1cmluZyByZW5kZXJcbiAgICB0aGlzLl9lcnJvcnMgPSBuZXcgRXJyb3JPYmplY3QoKVxuICB9XG5cbiAgaWYgKGt3YXJncy5fdHJpZ2dlclN0YXRlQ2hhbmdlKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbiAgfVxuXG4gIGlmIChrd2FyZ3MudmFsaWRhdGUgJiYgIXRoaXMuaXNBc3luYygpKSB7XG4gICAgcmV0dXJuIGlzVmFsaWRcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdGhlIGZvcm0ncyBlbnRpcmUgaW5wdXQgZGF0YSB3dGggZGF0YSBleHRyYWN0ZWQgZnJvbSBhIGBgPGZvcm0+YGAsIHdoaWNoXG4gKiB3aWxsIGJlIHByZWZpeGVkLCBpZiBwcmVmaXhlcyBhcmUgYmVpbmcgdXNlZC5cbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJvbmcsICo+fSBmb3JtRGF0YVxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgYm9vbGVhbj59IGt3YXJncyBzZXREYXRhIG9wdGlvbnMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5zZXRGb3JtRGF0YSA9IGZ1bmN0aW9uKGZvcm1EYXRhLCBrd2FyZ3MpIHtcbiAgcmV0dXJuIHRoaXMuc2V0RGF0YShmb3JtRGF0YSwgb2JqZWN0LmV4dGVuZChrd2FyZ3MgfHwge30sIHtwcmVmaXhlZDogdHJ1ZX0pKVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgc29tZSBvZiB0aGUgZm9ybSdzIGlucHV0IGRhdGEsIG9wdGlvbmFsbHkgdHJpZ2dlcmluZyB2YWxpZGF0aW9uIG9mXG4gKiB1cGRhdGVkIGZpZWxkcyBhbmQgZm9ybS13aWRlIGNsZWFuaW5nLCBvciBjbGVhcnMgZXhpc3RpbmcgZXJyb3JzIGZyb20gdGhlXG4gKiB1cGRhdGVkIGZpZWxkcy5cbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsICo+fSBkYXRhIHVwZGF0ZWQgaW5wdXQgZGF0YSBmb3IgdGhlIGZvcm0uXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBib29sZWFuPn0ga3dhcmdzIHVwZGF0ZSBvcHRpb25zLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUudXBkYXRlRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICBwcmVmaXhlZDogZmFsc2UsIHZhbGlkYXRlOiB0cnVlLCBjbGVhclZhbGlkYXRpb246IHRydWVcbiAgfSwga3dhcmdzKVxuXG4gIG9iamVjdC5leHRlbmQodGhpcy5kYXRhLCAoa3dhcmdzLnByZWZpeGVkID8gZGF0YSA6IHRoaXMuX3ByZWZpeERhdGEoZGF0YSkpKVxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cblxuICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXMoZGF0YSlcbiAgaWYgKGt3YXJncy5wcmVmaXhlZCkge1xuICAgIGZpZWxkcyA9IGZpZWxkcy5tYXAodGhpcy5yZW1vdmVQcmVmaXguYmluZCh0aGlzKSlcbiAgfVxuXG4gIGlmIChrd2FyZ3MudmFsaWRhdGUpIHtcbiAgICB0aGlzLnBhcnRpYWxDbGVhbihmaWVsZHMpXG4gIH1cbiAgZWxzZSBpZiAoa3dhcmdzLmNsZWFyVmFsaWRhdGlvbikge1xuICAgIHRoaXMuX3JlbW92ZUVycm9ycyhmaWVsZHMpXG4gICAgdGhpcy5fcmVtb3ZlQ2xlYW5lZERhdGEoZmllbGRzKVxuICAgIHRoaXMuX2NsZWFuRm9ybSgpXG4gIH1cblxuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYW55IGNsZWFuZWREYXRhIHByZXNlbnQgZm9yIHRoZSBnaXZlbiBmb3JtIGZpZWxkcy5cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGZpZWxkcyBmaWVsZCBuYW1lcy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9yZW1vdmVDbGVhbmVkRGF0YSA9IGZ1bmN0aW9uKGZpZWxkcykge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBkZWxldGUgdGhpcy5jbGVhbmVkRGF0YVtmaWVsZHNbaV1dXG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBCb3VuZEZpZWxkcyA9PT1cblxuLyoqXG4gKiBDcmVhdGVzIGEgQm91bmRGaWVsZCBmb3IgdGhlIGZpZWxkIHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBhIGZpZWxkIG5hbWUuXG4gKiBAcmV0dXJuIHtCb3VuZEZpZWxkfSBhIEJvdW5kRmllbGQgZm9yIHRoZSBmaWVsZC5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmJvdW5kRmllbGQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGlmICghb2JqZWN0Lmhhc093bih0aGlzLmZpZWxkcywgbmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fZm9ybU5hbWUoKSArIFwiIGRvZXMgbm90IGhhdmUgYSAnXCIgKyBuYW1lICsgXCInIGZpZWxkLlwiKVxuICB9XG4gIHJldHVybiBuZXcgQm91bmRGaWVsZCh0aGlzLCB0aGlzLmZpZWxkc1tuYW1lXSwgbmFtZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgQm91bmRGaWVsZCBmb3IgZWFjaCBmaWVsZCBpbiB0aGUgZm9ybSwgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHRoZVxuICogZmllbGRzIHdlcmUgY3JlYXRlZC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oRmllbGQsIHN0cmluZyk9fSB0ZXN0IGlmIHByb3ZpZGVkLCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmVcbiAqICAgY2FsbGVkIHdpdGggZmllbGQgYW5kIG5hbWUgYXJndW1lbnRzIC0gQm91bmRGaWVsZHMgd2lsbCBvbmx5IGJlIGdlbmVyYXRlZFxuICogICBmb3IgZmllbGRzIGZvciB3aGljaCB0cnVlIGlzIHJldHVybmVkLlxuICogQHJldHVybiB7QXJyYXkuPEJvdW5kRmllbGQ+fSBhIGxpc3Qgb2YgQm91bmRGaWVsZCBvYmplY3RzLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuYm91bmRGaWVsZHMgPSBmdW5jdGlvbih0ZXN0KSB7XG4gIHZhciBiZnMgPSBbXVxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuZmllbGRzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbCA7IGkrKykge1xuICAgIHZhciBmaWVsZE5hbWUgPSBmaWVsZE5hbWVzW2ldXG4gICAgaWYgKCF0ZXN0IHx8IHRlc3QodGhpcy5maWVsZHNbZmllbGROYW1lXSwgZmllbGROYW1lKSkge1xuICAgICAgYmZzLnB1c2gobmV3IEJvdW5kRmllbGQodGhpcywgdGhpcy5maWVsZHNbZmllbGROYW1lXSwgZmllbGROYW1lKSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJmc1xufVxuXG4vKipcbiAqIExpa2UgYm91bmRGaWVsZHMoKSwgYnV0IHJldHVybnMgYSBuYW1lIC0+IEJvdW5kRmllbGQgb2JqZWN0IGluc3RlYWQuXG4gKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZywgQm91bmRGaWVsZD59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5ib3VuZEZpZWxkc09iaiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYmZzID0ge31cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB2YXIgZmllbGROYW1lID0gZmllbGROYW1lc1tpXVxuICAgIGJmc1tmaWVsZE5hbWVdID0gbmV3IEJvdW5kRmllbGQodGhpcywgdGhpcy5maWVsZHNbZmllbGROYW1lXSwgZmllbGROYW1lKVxuICB9XG4gIHJldHVybiBiZnNcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIEJvdW5kRmllbGQgb2JqZWN0cyB0aGF0IGNvcnJlc3BvbmQgdG8gaGlkZGVuXG4gKiBmaWVsZHMuIFVzZWZ1bCBmb3IgbWFudWFsIGZvcm0gbGF5b3V0LlxuICogQHJldHVybiB7QXJyYXkuPEJvdW5kRmllbGQ+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaGlkZGVuRmllbGRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmJvdW5kRmllbGRzKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgcmV0dXJuIGZpZWxkLndpZGdldC5pc0hpZGRlblxuICB9KVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIEJvdW5kRmllbGQgb2JqZWN0cyB0aGF0IGRvIG5vdCBjb3JyZXNwb25kIHRvIGhpZGRlbiBmaWVsZHMuXG4gKiBUaGUgb3Bwb3NpdGUgb2YgdGhlIGhpZGRlbkZpZWxkcygpIG1ldGhvZC5cbiAqIEByZXR1cm4ge0FycmF5LjxCb3VuZEZpZWxkPn1cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnZpc2libGVGaWVsZHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYm91bmRGaWVsZHMoZnVuY3Rpb24oZmllbGQpIHtcbiAgICByZXR1cm4gIWZpZWxkLndpZGdldC5pc0hpZGRlblxuICB9KVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRXJyb3JzID09PVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGNvbnRlbnQgb2YgdGhpcy5fZXJyb3JzLlxuICogVGhlIGZpZWxkIGFyZ3VtZW50IGlzIHRoZSBuYW1lIG9mIHRoZSBmaWVsZCB0byB3aGljaCB0aGUgZXJyb3JzIHNob3VsZCBiZVxuICogYWRkZWQuIElmIGl0cyB2YWx1ZSBpcyBudWxsIHRoZSBlcnJvcnMgd2lsbCBiZSB0cmVhdGVkIGFzIE5PTl9GSUVMRF9FUlJPUlMuXG4gKiBUaGUgZXJyb3IgYXJndW1lbnQgY2FuIGJlIGEgc2luZ2xlIGVycm9yLCBhIGxpc3Qgb2YgZXJyb3JzLCBvciBhbiBvYmplY3QgdGhhdFxuICogbWFwcyBmaWVsZCBuYW1lcyB0byBsaXN0cyBvZiBlcnJvcnMuIFdoYXQgd2UgZGVmaW5lIGFzIGFuIFwiZXJyb3JcIiBjYW4gYmVcbiAqIGVpdGhlciBhIHNpbXBsZSBzdHJpbmcgb3IgYW4gaW5zdGFuY2Ugb2YgVmFsaWRhdGlvbkVycm9yIHdpdGggaXRzIG1lc3NhZ2VcbiAqIGF0dHJpYnV0ZSBzZXQgYW5kIHdoYXQgd2UgZGVmaW5lIGFzIGxpc3Qgb3Igb2JqZWN0IGNhbiBiZSBhbiBhY3R1YWwgbGlzdCBvclxuICogb2JqZWN0IG9yIGFuIGluc3RhbmNlIG9mIFZhbGlkYXRpb25FcnJvciB3aXRoIGl0cyBlcnJvckxpc3Qgb3IgZXJyb3JPYmpcbiAqIHByb3BlcnR5IHNldC5cbiAqIElmIGVycm9yIGlzIGFuIG9iamVjdCwgdGhlIGZpZWxkIGFyZ3VtZW50ICptdXN0KiBiZSBudWxsIGFuZCBlcnJvcnMgd2lsbCBiZVxuICogYWRkZWQgdG8gdGhlIGZpZWxkcyB0aGF0IGNvcnJlc3BvbmQgdG8gdGhlIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdC5cbiAqIEBwYXJhbSB7P3N0cmluZ30gZmllbGQgdGhlIG5hbWUgb2YgYSBmb3JtIGZpZWxkLlxuICogQHBhcmFtIHsoc3RyaW5nfFZhbGlkYXRpb25FcnJvcnxBcnJheS48KHN0cmluZ3xWYWxpZGF0aW9uRXJyb3IpPnxPYmplY3Q8c3RyaW5nLChzdHJpbmd8VmFsaWRhdGlvbkVycm9yfEFycmF5Ljwoc3RyaW5nfFZhbGlkYXRpb25FcnJvcik+KSl9IGVycm9yXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5hZGRFcnJvciA9IGZ1bmN0aW9uKGZpZWxkLCBlcnJvcikge1xuICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHtcbiAgICAvLyBOb3JtYWxpc2UgdG8gVmFsaWRhdGlvbkVycm9yIGFuZCBsZXQgaXRzIGNvbnN0cnVjdG9yIGRvIHRoZSBoYXJkIHdvcmsgb2ZcbiAgICAvLyBtYWtpbmcgc2Vuc2Ugb2YgdGhlIGlucHV0LlxuICAgIGVycm9yID0gVmFsaWRhdGlvbkVycm9yKGVycm9yKVxuICB9XG5cbiAgaWYgKG9iamVjdC5oYXNPd24oZXJyb3IsICdlcnJvck9iaicpKSB7XG4gICAgaWYgKGZpZWxkICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgJ2ZpZWxkJyBhcmd1bWVudCB0byBmb3JtLmFkZEVycm9yKCkgbXVzdCBiZSBudWxsIHdoZW4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIFwidGhlICdlcnJvcicgYXJndW1lbnQgY29udGFpbnMgZXJyb3JzIGZvciBtdWx0aXBsZSBmaWVsZHMuXCIpXG4gICAgfVxuICAgIGVycm9yID0gZXJyb3IuZXJyb3JPYmpcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgZXJyb3JMaXN0ID0gZXJyb3IuZXJyb3JMaXN0XG4gICAgZXJyb3IgPSB7fVxuICAgIGVycm9yW2ZpZWxkIHx8IE5PTl9GSUVMRF9FUlJPUlNdID0gZXJyb3JMaXN0XG4gIH1cblxuICB2YXIgZmllbGRzID0gT2JqZWN0LmtleXMoZXJyb3IpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZmllbGRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGZpZWxkID0gZmllbGRzW2ldXG4gICAgZXJyb3JMaXN0ID0gZXJyb3JbZmllbGRdXG4gICAgaWYgKCF0aGlzLl9lcnJvcnMuaGFzRmllbGQoZmllbGQpKSB7XG4gICAgICBpZiAoZmllbGQgIT09IE5PTl9GSUVMRF9FUlJPUlMgJiYgIW9iamVjdC5oYXNPd24odGhpcy5maWVsZHMsIGZpZWxkKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fZm9ybU5hbWUoKSArIFwiIGhhcyBubyBmaWVsZCBuYW1lZCAnXCIgKyBmaWVsZCArIFwiJ1wiKVxuICAgICAgfVxuICAgICAgdGhpcy5fZXJyb3JzLnNldChmaWVsZCwgbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcigpKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIEZpbHRlciBvdXQgYW55IGVycm9yIG1lc3NhZ2VzIHdoaWNoIGFyZSBkdXBsaWNhdGVzIG9mIGV4aXN0aW5nXG4gICAgICAvLyBtZXNzYWdlcy4gVGhpcyBjYW4gaGFwcGVuIGlmIG9uQ2hhbmdlIHZhbGlkYXRpb24gd2hpY2ggdXNlcyBhZGRFcnJvcigpXG4gICAgICAvLyBpcyBmaXJlZCByZXBlYXRlZGx5IGFuZCBpcyBhZGRpbmcgYW4gZXJyb3IgbWVzc2FnZSB0byBhIGZpZWxkIG90aGVyXG4gICAgICAvLyB0aGVuIHRoZSBvbmUgYmVpbmcgY2hhbmdlZC5cbiAgICAgIHZhciBtZXNzYWdlTG9va3VwID0gb2JqZWN0Lmxvb2t1cCh0aGlzLl9lcnJvcnMuZ2V0KGZpZWxkKS5tZXNzYWdlcygpKVxuICAgICAgdmFyIG5ld01lc3NhZ2VzID0gRXJyb3JMaXN0KGVycm9yTGlzdCkubWVzc2FnZXMoKVxuICAgICAgZm9yICh2YXIgaiA9IGVycm9yTGlzdC5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICBpZiAobWVzc2FnZUxvb2t1cFtuZXdNZXNzYWdlc1tqXV0pIHtcbiAgICAgICAgICBlcnJvckxpc3Quc3BsaWNlKGosIDEpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXJyb3JMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX2Vycm9ycy5nZXQoZmllbGQpLmV4dGVuZChlcnJvckxpc3QpXG4gICAgfVxuXG4gICAgaWYgKG9iamVjdC5oYXNPd24odGhpcy5jbGVhbmVkRGF0YSwgZmllbGQpKSB7XG4gICAgICBkZWxldGUgdGhpcy5jbGVhbmVkRGF0YVtmaWVsZF1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXR0ZXIgZm9yIGVycm9ycywgd2hpY2ggZmlyc3QgY2xlYW5zIHRoZSBmb3JtIGlmIHRoZXJlIGFyZSBubyBlcnJvcnNcbiAqIGRlZmluZWQgeWV0LlxuICogQHBhcmFtIHtzdHJpbmc9fSBuYW1lIGlmIGdpdmVuLCBlcnJvcnMgZm9yIHRoaXMgZmllbGQgbmFtZSB3aWxsIGJlIHJldHVybmVkXG4gKiAgIGluc3RlYWQgb2YgdGhlIGZ1bGwgZXJyb3Igb2JqZWN0LlxuICogQHJldHVybiB7RXJyb3JPYmplY3R8RXJyb3JMaXN0fSBmb3JtIG9yIGZpZWxkIGVycm9yc1xuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuZXJyb3JzID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAodGhpcy5fZXJyb3JzID09IG51bGwpIHtcbiAgICB0aGlzLmZ1bGxDbGVhbigpXG4gIH1cbiAgaWYgKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5fZXJyb3JzLmdldChuYW1lKVxuICB9XG4gIHJldHVybiB0aGlzLl9lcnJvcnNcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtFcnJvck9iamVjdH0gZXJyb3JzIHRoYXQgYXJlbid0IGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZmllbGQgLVxuICogICBpLmUuLCBlcnJvcnMgZ2VuZXJhdGVkIGJ5IGNsZWFuKCkuIFdpbGwgYmUgZW1wdHkgaWYgdGhlcmUgYXJlIG5vbmUuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5ub25GaWVsZEVycm9ycyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHRoaXMuZXJyb3JzKE5PTl9GSUVMRF9FUlJPUlMpIHx8IG5ldyB0aGlzLmVycm9yQ29uc3RydWN0b3IoKSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0Vycm9yT2JqZWN0fSBlcnJvcnNcbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnNldEVycm9ycyA9IGZ1bmN0aW9uKGVycm9ycykge1xuICB0aGlzLl9lcnJvcnMgPSBlcnJvcnNcbiAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFueSB2YWxpZGF0aW9uIGVycm9ycyBwcmVzZW50IGZvciB0aGUgZ2l2ZW4gZm9ybSBmaWVsZHMuIElmIHZhbGlkYXRpb25cbiAqIGhhcyBub3QgYmVlbiBwZXJmb3JtZWQgeWV0LCBpbml0aWFsaXNlcyB0aGUgZXJyb3JzIG9iamVjdC5cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGZpZWxkcyBmaWVsZCBuYW1lcy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9yZW1vdmVFcnJvcnMgPSBmdW5jdGlvbihmaWVsZHMpIHtcbiAgaWYgKHRoaXMuX2Vycm9ycyA9PSBudWxsKSB7XG4gICAgdGhpcy5fZXJyb3JzID0gRXJyb3JPYmplY3QoKVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIFRPRE8gdXNlIGNsZWFuLmZpZWxkcyBpZiBhdmFpbGFibGVcbiAgICB0aGlzLl9lcnJvcnMucmVtb3ZlKE5PTl9GSUVMRF9FUlJPUlMpXG4gICAgdGhpcy5fZXJyb3JzLnJlbW92ZUFsbChmaWVsZHMpXG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gQ2hhbmdlcyA9PT1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIGZpZWxkcyBoYXZlIGNoYW5nZWQgZnJvbSBpbml0aWFsIGZvcm0gZGF0YS5cbiAqIEBwYXJhbSB7Ym9vbGVhbj19IF9oYXNDaGFuZ2VkQ2hlY2sgaWYgdHJ1ZSwgdGhlIG1ldGhvZCBpcyBvbmx5IGJlaW5nIHJ1biB0b1xuICogICBkZXRlcm1pbmUgaWYgYW55IGZpZWxkcyBoYXZlIGNoYW5nZWQsIG5vdCB0byBnZXQgdGhlIGxpc3Qgb2YgZmllbGRzLlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz58Ym9vbGVhbn0gYSBsaXN0IG9mIGNoYW5nZWQgZmllbGQgbmFtZXMgb3IgdHJ1ZSBpZlxuICogICBvbmx5IGNoZWNraW5nIGZvciBjaGFuZ2VzIGFuZCBvbmUgaXMgZm91bmQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5jaGFuZ2VkRGF0YSA9IGZ1bmN0aW9uKF9oYXNDaGFuZ2VkQ2hlY2spIHtcbiAgdmFyIGNoYW5nZWREYXRhID0gW11cbiAgdmFyIGluaXRpYWxWYWx1ZVxuICAvLyBYWFg6IEZvciBub3cgd2UncmUgYXNraW5nIHRoZSBpbmRpdmlkdWFsIGZpZWxkcyB3aGV0aGVyIG9yIG5vdFxuICAvLyB0aGUgZGF0YSBoYXMgY2hhbmdlZC4gSXQgd291bGQgcHJvYmFibHkgYmUgbW9yZSBlZmZpY2llbnQgdG8gaGFzaFxuICAvLyB0aGUgaW5pdGlhbCBkYXRhLCBzdG9yZSBpdCBpbiBhIGhpZGRlbiBmaWVsZCwgYW5kIGNvbXBhcmUgYSBoYXNoXG4gIC8vIG9mIHRoZSBzdWJtaXR0ZWQgZGF0YSwgYnV0IHdlJ2QgbmVlZCBhIHdheSB0byBlYXNpbHkgZ2V0IHRoZVxuICAvLyBzdHJpbmcgdmFsdWUgZm9yIGEgZ2l2ZW4gZmllbGQuIFJpZ2h0IG5vdywgdGhhdCBsb2dpYyBpcyBlbWJlZGRlZFxuICAvLyBpbiB0aGUgcmVuZGVyIG1ldGhvZCBvZiBlYWNoIGZpZWxkJ3Mgd2lkZ2V0LlxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuZmllbGRzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbCA7IGkrKykge1xuICAgIHZhciBuYW1lID0gZmllbGROYW1lc1tpXVxuICAgIHZhciBmaWVsZCA9IHRoaXMuZmllbGRzW25hbWVdXG4gICAgdmFyIHByZWZpeGVkTmFtZSA9IHRoaXMuYWRkUHJlZml4KG5hbWUpXG4gICAgdmFyIGRhdGFWYWx1ZSA9IGZpZWxkLndpZGdldC52YWx1ZUZyb21EYXRhKHRoaXMuZGF0YSwgdGhpcy5maWxlcywgcHJlZml4ZWROYW1lKVxuICAgIGlmICghZmllbGQuc2hvd0hpZGRlbkluaXRpYWwpIHtcbiAgICAgIGluaXRpYWxWYWx1ZSA9IG9iamVjdC5nZXQodGhpcy5pbml0aWFsLCBuYW1lLCBmaWVsZC5pbml0aWFsKVxuICAgICAgaWYgKGlzLkZ1bmN0aW9uKGluaXRpYWxWYWx1ZSkpIHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlKClcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgaW5pdGlhbFByZWZpeGVkTmFtZSA9IHRoaXMuYWRkSW5pdGlhbFByZWZpeChuYW1lKVxuICAgICAgdmFyIGhpZGRlbldpZGdldCA9IG5ldyBmaWVsZC5oaWRkZW5XaWRnZXQoKVxuICAgICAgdHJ5IHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gaGlkZGVuV2lkZ2V0LnZhbHVlRnJvbURhdGEoXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLCB0aGlzLmZpbGVzLCBpbml0aWFsUHJlZml4ZWROYW1lKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHsgdGhyb3cgZSB9XG4gICAgICAgIC8vIEFsd2F5cyBhc3N1bWUgZGF0YSBoYXMgY2hhbmdlZCBpZiB2YWxpZGF0aW9uIGZhaWxzXG4gICAgICAgIGlmIChfaGFzQ2hhbmdlZENoZWNrKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBjaGFuZ2VkRGF0YS5wdXNoKG5hbWUpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChmaWVsZC5faGFzQ2hhbmdlZChpbml0aWFsVmFsdWUsIGRhdGFWYWx1ZSkpIHtcbiAgICAgIGlmIChfaGFzQ2hhbmdlZENoZWNrKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICBjaGFuZ2VkRGF0YS5wdXNoKG5hbWUpXG4gICAgfVxuICB9XG4gIGlmIChfaGFzQ2hhbmdlZENoZWNrKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoYW5nZWREYXRhXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBpbnB1dCBkYXRhIGRpZmZlcnMgZnJvbSBpbml0aWFsIGRhdGEuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5oYXNDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2xhc3RIYXNDaGFuZ2VkID0gdGhpcy5jaGFuZ2VkRGF0YSh0cnVlKVxuICByZXR1cm4gdGhpcy5fbGFzdEhhc0NoYW5nZWRcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFN0YXR1cyA9PT1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3JtIG5lZWRzIGEgY2FsbGJhY2sgYXJndW1lbnQgZm9yIGZpbmFsXG4gKiAgIHZhbGlkYXRpb24uXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5pc0FzeW5jID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNsZWFuLmxlbmd0aCA9PSAxKSB7IHJldHVybiB0cnVlIH1cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB2YXIgY3VzdG9tQ2xlYW4gPSB0aGlzLl9nZXRDdXN0b21DbGVhbihmaWVsZE5hbWVzW2ldKVxuICAgIGlmIChpcy5GdW5jdGlvbihjdXN0b21DbGVhbikgJiYgY3VzdG9tQ2xlYW4ubGVuZ3RoID09IDEpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYWxsIHJlcXVpcmVkIGZpZWxkcyBoYXZlIGJlZW4gY29tcGxldGVkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuaXNWYWxpZCgpIHx8IHRoaXMuaXNQZW5kaW5nKCkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuZmllbGRzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGZpZWxkTmFtZSA9IGZpZWxkTmFtZXNbaV1cbiAgICBpZiAodGhpcy5maWVsZHNbZmllbGROYW1lXS5yZXF1aXJlZCAmJlxuICAgICAgICB0eXBlb2YgdGhpcy5jbGVhbmVkRGF0YVtmaWVsZE5hbWVdID09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG11bHRpcGFydC1lbmNvZGVkLCBpbiBvdGhlclxuICogICB3b3JkcywgaWYgaXQgaGFzIGEgRmlsZUZpZWxkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNNdWx0aXBhcnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICBpZiAodGhpcy5maWVsZHNbZmllbGROYW1lc1tpXV0ud2lkZ2V0Lm5lZWRzTXVsdGlwYXJ0Rm9ybSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZm9ybSBpcyB3YWl0aW5nIGZvciBhc3luYyB2YWxpZGF0aW9uIHRvXG4gKiAgIGNvbXBsZXRlLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhaXMuRW1wdHkodGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbilcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3JtIGRvZXNuJ3QgaGF2ZSBhbnkgZXJyb3JzLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gIXRoaXMuZXJyb3JzKCkuaXNQb3B1bGF0ZWQoKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZvcm0gaXMgd2FpdGluZyBmb3IgYXN5bmMgdmFsaWRhdGlvbiBvZiBpdHNcbiAqICAgY2xlYW4oKSBtZXRob2QgdG8gY29tcGxldGUuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5ub25GaWVsZFBlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHR5cGVvZiB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW05PTl9GSUVMRF9FUlJPUlNdICE9ICd1bmRlZmluZWQnXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGlzIGZvcm0gaXMgYWxsb3dlZCB0byBiZSBlbXB0eSBhbmQgaWYgaW5wdXQgZGF0YVxuICogICBkaWZmZXJzIGZyb20gaW5pdGlhbCBkYXRhLiBUaGlzIGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSB3aGVuIHJlcXVpcmVkXG4gKiAgIGZpZWxkcyBpbiBhbiBleHRyYSBGb3JtU2V0IGZvcm0gYmVjb21lIHRydWx5IHJlcXVpcmVkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUubm90RW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLmVtcHR5UGVybWl0dGVkICYmIHRoaXMuX2xhc3RIYXNDaGFuZ2VkID09PSB0cnVlKVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFByZWZpeGVzID09PVxuXG4vKipcbiAqIEFkZHMgYW4gaW5pdGlhbCBwcmVmaXggZm9yIGNoZWNraW5nIGR5bmFtaWMgaW5pdGlhbCB2YWx1ZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGROYW1lIGEgZmllbGQgbmFtZS5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmFkZEluaXRpYWxQcmVmaXggPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgcmV0dXJuICdpbml0aWFsLScgKyB0aGlzLmFkZFByZWZpeChmaWVsZE5hbWUpXG59XG5cbi8qKlxuICogUHJlcGVuZHMgYSBwcmVmaXggdG8gYSBmaWVsZCBuYW1lIGlmIHRoaXMgZm9ybSBoYXMgb25lIHNldC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZE5hbWUgYSBmb3JtIGZpZWxkIG5hbWUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBmaWVsZCBuYW1lIHdpdGggYSBwcmVmaXggcHJlcGVuZGVkIGlmIHRoaXMgZm9ybSBoYXMgYVxuICogICBwcmVmaXggc2V0LCBvdGhlcndpc2UgdGhlIGZpZWxkIG5hbWUgYXMtaXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5hZGRQcmVmaXggPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgaWYgKHRoaXMucHJlZml4ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcmVmaXggKyAnLScgKyBmaWVsZE5hbWVcbiAgfVxuICByZXR1cm4gZmllbGROYW1lXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmllbGQgd2l0aCBhIHByZWZpeC1zaXplIGNodW5rIGNob3BwZWQgb2ZmIHRoZSBzdGFydCBpZiB0aGlzXG4gKiBmb3JtIGhhcyBhIHByZWZpeCBzZXQgYW5kIHRoZSBmaWVsZCBuYW1lIHN0YXJ0cyB3aXRoIGl0LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkTmFtZSBhIGZpZWxkIG5hbWUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5yZW1vdmVQcmVmaXggPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgaWYgKHRoaXMucHJlZml4ICE9PSBudWxsICYmIGZpZWxkTmFtZS5pbmRleE9mKHRoaXMucHJlZml4ICsgJy0nKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZpZWxkTmFtZS5zdWJzdHJpbmcodGhpcy5wcmVmaXgubGVuZ3RoICsgMSlcbiAgfVxuICByZXR1cm4gZmllbGROYW1lXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHZlcnNpb24gb2YgdGhlIGdpdmVuIGRhdGEgb2JqZWN0IHdpdGggcHJlZml4ZXMgcmVtb3ZlZCBmcm9tIHRoZVxuICogcHJvcGVydHkgbmFtZXMgaWYgdGhpcyBmb3JtIGhhcyBhIHByZWZpeCwgb3RoZXJ3aXNlIHJldHVybnMgdGhlIG9iamVjdFxuICogaXRzZWxmLlxuICogQHBhcmFtIHtvYmplY3QuPHN0cmluZywqPn0gZGF0YVxuICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsKj59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fZGVwcmVmaXhEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICBpZiAodGhpcy5wcmVmaXggPT0gbnVsbCkgeyByZXR1cm4gZGF0YSB9XG4gIHZhciBwcmVmaXhlZERhdGEgPSB7fVxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKGRhdGEpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZmllbGROYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBwcmVmaXhlZERhdGFbdGhpcy5yZW1vdmVQcmVmaXgoZmllbGROYW1lc1tpXSldID0gZGF0YVtmaWVsZE5hbWVzW2ldXVxuICB9XG4gIHJldHVybiBwcmVmaXhlZERhdGFcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdmVyc2lvbiBvZiB0aGUgZ2l2ZW4gZGF0YSBvYmplY3Qgd2l0aCBwcmVmaXhlcyBhZGRlZCB0byB0aGVcbiAqIHByb3BlcnR5IG5hbWVzIGlmIHRoaXMgZm9ybSBoYXMgYSBwcmVmaXgsIG90aGVyd2lzZSByZXR1cm5zIHRoZSBvYmplY3RcbiAqIGl0c2VsZi5cbiAqIEBwYXJhbSB7b2JqZWN0LjxzdHJpbmcsKj59IGRhdGFcbiAqIEByZXR1cm4ge09iamVjdC48c3RyaW5nLCo+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX3ByZWZpeERhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gIGlmICh0aGlzLnByZWZpeCA9PSBudWxsKSB7IHJldHVybiBkYXRhIH1cbiAgdmFyIHByZWZpeGVkRGF0YSA9IHt9XG4gIHZhciBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMoZGF0YSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHByZWZpeGVkRGF0YVt0aGlzLmFkZFByZWZpeChmaWVsZE5hbWVzW2ldKV0gPSBkYXRhW2ZpZWxkTmFtZXNbaV1dXG4gIH1cbiAgcmV0dXJuIHByZWZpeGVkRGF0YVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IERlZmF1bHQgUmVuZGVyaW5nID09PVxuXG4vKipcbiAqIERlZmF1bHQgcmVuZGVyIG1ldGhvZCwgd2hpY2gganVzdCBjYWxscyBhc1RhYmxlKCkuXG4gKiBAcmV0dXJuIHtBcnJheS48UmVhY3RFbGVtZW50Pn1cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5hc1RhYmxlKClcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBmb3JtJ3MgZmllbGRzLCB2YWxpZGF0aW9uIG1lc3NhZ2VzLCBhc3luYyBidXN5IGluZGljYXRvcnMgYW5kXG4gKiBoaWRkZW4gZmllbGRzIGFzIGEgbGlzdCBvZiA8dHI+cy5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuYXNUYWJsZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gbm9ybWFsUm93KGtleSwgY3NzQ2xhc3NlcywgbGFiZWwsIGZpZWxkLCBwZW5kaW5nLCBoZWxwVGV4dCwgZXJyb3JzLCBleHRyYUNvbnRlbnQpIHtcbiAgICB2YXIgY29udGVudHMgPSBbXVxuICAgIGlmIChlcnJvcnMpIHsgY29udGVudHMucHVzaChlcnJvcnMpIH1cbiAgICBjb250ZW50cy5wdXNoKGZpZWxkKVxuICAgIGlmIChwZW5kaW5nKSB7XG4gICAgICBjb250ZW50cy5wdXNoKFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2JyJywgbnVsbCkpXG4gICAgICBjb250ZW50cy5wdXNoKHBlbmRpbmcpXG4gICAgfVxuICAgIGlmIChoZWxwVGV4dCkge1xuICAgICAgY29udGVudHMucHVzaChSZWFjdC5jcmVhdGVFbGVtZW50KCdicicsIG51bGwpKVxuICAgICAgY29udGVudHMucHVzaChoZWxwVGV4dClcbiAgICB9XG4gICAgaWYgKGV4dHJhQ29udGVudCkgeyBjb250ZW50cy5wdXNoLmFwcGx5KGNvbnRlbnRzLCBleHRyYUNvbnRlbnQpIH1cbiAgICB2YXIgcm93QXR0cnMgPSB7a2V5OiBrZXl9XG4gICAgaWYgKGNzc0NsYXNzZXMpIHsgcm93QXR0cnMuY2xhc3NOYW1lID0gY3NzQ2xhc3NlcyB9XG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3RyJywgcm93QXR0cnNcbiAgICAsIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3RoJywgbnVsbCwgbGFiZWwpXG4gICAgLCBSZWFjdC5jcmVhdGVFbGVtZW50KCd0ZCcsIG51bGwsIGNvbnRlbnRzKVxuICAgIClcbiAgfVxuXG4gIGZ1bmN0aW9uIGVycm9yUm93KGtleSwgZXJyb3JzLCBleHRyYUNvbnRlbnQsIGNzc0NsYXNzZXMpIHtcbiAgICB2YXIgY29udGVudHMgPSBbXVxuICAgIGlmIChlcnJvcnMpIHsgY29udGVudHMucHVzaChlcnJvcnMpIH1cbiAgICBpZiAoZXh0cmFDb250ZW50KSB7IGNvbnRlbnRzLnB1c2guYXBwbHkoY29udGVudHMsIGV4dHJhQ29udGVudCkgfVxuICAgIHZhciByb3dBdHRycyA9IHtrZXk6IGtleX1cbiAgICBpZiAoY3NzQ2xhc3NlcykgeyByb3dBdHRycy5jbGFzc05hbWUgPSBjc3NDbGFzc2VzIH1cbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgndHInLCByb3dBdHRyc1xuICAgICwgUmVhY3QuY3JlYXRlRWxlbWVudCgndGQnLCB7Y29sU3BhbjogMn0sIGNvbnRlbnRzKVxuICAgIClcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX2h0bWxPdXRwdXQobm9ybWFsUm93LCBlcnJvclJvdykgfVxufSkoKVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZvcm0ncyBmaWVsZHMsIHZhbGlkYXRpb24gbWVzc2FnZXMsIGFzeW5jIGJ1c3kgaW5kaWNhdG9ycyBhbmRcbiAqIGhpZGRlbiBmaWVsZHMgYXMgYSBsaXN0IG9mIDxsaT5zLlxuICogQHJldHVybiB7QXJyYXkuPFJlYWN0RWxlbWVudD59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5hc1VsID0gX3NpbmdsZUVsZW1lbnRSb3coUmVhY3QuY3JlYXRlRmFjdG9yeSgnbGknKSlcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBmb3JtJ3MgZmllbGRzLCB2YWxpZGF0aW9uIG1lc3NhZ2VzLCBhc3luYyBidXN5IGluZGljYXRvcnMgYW5kXG4gKiBoaWRkZW4gZmllbGRzIGFzIGEgbGlzdCBvZiA8ZGl2PnMuXG4gKiBAcmV0dXJuIHtBcnJheS48UmVhY3RFbGVtZW50Pn1cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmFzRGl2ID0gX3NpbmdsZUVsZW1lbnRSb3coUmVhY3QuY3JlYXRlRmFjdG9yeSgnZGl2JykpXG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBvdXRwdXR0aW5nIEhUTUwuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBub3JtYWxSb3cgYSBmdW5jdGlvbiB3aGljaCBwcm9kdWNlcyBhIG5vcm1hbCByb3cuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBlcnJvclJvdyBhIGZ1bmN0aW9uIHdoaWNoIHByb2R1Y2VzIGFuIGVycm9yIHJvdy5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2h0bWxPdXRwdXQgPSBmdW5jdGlvbihub3JtYWxSb3csIGVycm9yUm93KSB7XG4gIHZhciBiZlxuICB2YXIgYmZFcnJvcnNcbiAgdmFyIHRvcEVycm9ycyA9IHRoaXMubm9uRmllbGRFcnJvcnMoKSAvLyBFcnJvcnMgdGhhdCBzaG91bGQgYmUgZGlzcGxheWVkIGFib3ZlIGFsbCBmaWVsZHNcblxuICB2YXIgaGlkZGVuRmllbGRzID0gW11cbiAgdmFyIGhpZGRlbkJvdW5kRmllbGRzID0gdGhpcy5oaWRkZW5GaWVsZHMoKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGhpZGRlbkJvdW5kRmllbGRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGJmID0gaGlkZGVuQm91bmRGaWVsZHNbaV1cbiAgICBiZkVycm9ycyA9IGJmLmVycm9ycygpXG4gICAgaWYgKGJmRXJyb3JzLmlzUG9wdWxhdGVkKSB7XG4gICAgICB0b3BFcnJvcnMuZXh0ZW5kKGJmRXJyb3JzLm1lc3NhZ2VzKCkubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIHJldHVybiAnKEhpZGRlbiBmaWVsZCAnICsgYmYubmFtZSArICcpICcgKyBlcnJvclxuICAgICAgfSkpXG4gICAgfVxuICAgIGhpZGRlbkZpZWxkcy5wdXNoKGJmLnJlbmRlcigpKVxuICB9XG5cbiAgdmFyIHJvd3MgPSBbXVxuICB2YXIgZXJyb3JzXG4gIHZhciBsYWJlbFxuICB2YXIgcGVuZGluZ1xuICB2YXIgaGVscFRleHRcbiAgdmFyIGV4dHJhQ29udGVudFxuICB2YXIgdmlzaWJsZUJvdW5kRmllbGRzID0gdGhpcy52aXNpYmxlRmllbGRzKClcbiAgZm9yIChpID0gMCwgbCA9IHZpc2libGVCb3VuZEZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBiZiA9IHZpc2libGVCb3VuZEZpZWxkc1tpXVxuICAgIGJmRXJyb3JzID0gYmYuZXJyb3JzKClcblxuICAgIC8vIFZhcmlhYmxlcyB3aGljaCBjYW4gYmUgb3B0aW9uYWwgaW4gZWFjaCByb3dcbiAgICBlcnJvcnMgPSAoYmZFcnJvcnMuaXNQb3B1bGF0ZWQoKSA/IGJmRXJyb3JzLnJlbmRlcigpIDogbnVsbClcbiAgICBsYWJlbCA9IChiZi5sYWJlbCA/IGJmLmxhYmVsVGFnKCkgOiBudWxsKVxuICAgIHBlbmRpbmcgPSAoYmYuaXNQZW5kaW5nKCkgPyBSZWFjdC5jcmVhdGVFbGVtZW50KCdwcm9ncmVzcycsIG51bGwsICcuLi4nKSA6IG51bGwpXG4gICAgaGVscFRleHQgPSBiZi5oZWxwVGV4dFRhZygpXG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCByb3csIGl0IHNob3VsZCBpbmNsdWRlIGFueSBoaWRkZW4gZmllbGRzXG4gICAgZXh0cmFDb250ZW50ID0gKGkgPT0gbCAtIDEgJiYgaGlkZGVuRmllbGRzLmxlbmd0aCA+IDAgPyBoaWRkZW5GaWVsZHMgOiBudWxsKVxuXG4gICAgcm93cy5wdXNoKG5vcm1hbFJvdyhiZi5odG1sTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJmLmNzc0NsYXNzZXMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmYucmVuZGVyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBwZW5kaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVscFRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYUNvbnRlbnQpKVxuICB9XG5cbiAgaWYgKHRvcEVycm9ycy5pc1BvcHVsYXRlZCgpKSB7XG4gICAgLy8gQWRkIGhpZGRlbiBmaWVsZHMgdG8gdGhlIHRvcCBlcnJvciByb3cgaWYgaXQncyBiZWluZyBkaXNwbGF5ZWQgYW5kXG4gICAgLy8gdGhlcmUgYXJlIG5vIG90aGVyIHJvd3MuXG4gICAgZXh0cmFDb250ZW50ID0gKGhpZGRlbkZpZWxkcy5sZW5ndGggPiAwICYmIHJvd3MubGVuZ3RoID09PSAwID8gaGlkZGVuRmllbGRzIDogbnVsbClcbiAgICByb3dzLnVuc2hpZnQoZXJyb3JSb3codGhpcy5hZGRQcmVmaXgoTk9OX0ZJRUxEX0VSUk9SUyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRvcEVycm9ycy5yZW5kZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yUm93Q3NzQ2xhc3MpKVxuICB9XG5cbiAgLy8gUHV0IGEgY3Jvc3MtZmllbGQgcGVuZGluZyBpbmRpY2F0b3IgaW4gaXRzIG93biByb3dcbiAgaWYgKHRoaXMubm9uRmllbGRQZW5kaW5nKCkpIHtcbiAgICBleHRyYUNvbnRlbnQgPSAoaGlkZGVuRmllbGRzLmxlbmd0aCA+IDAgJiYgcm93cy5sZW5ndGggPT09IDAgPyBoaWRkZW5GaWVsZHMgOiBudWxsKVxuICAgIHJvd3MucHVzaChlcnJvclJvdyh0aGlzLmFkZFByZWZpeCgnX19wZW5kaW5nX18nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncHJvZ3Jlc3MnLCBudWxsLCAnLi4uJyksXG4gICAgICAgICAgICAgICAgICAgICAgIGV4dHJhQ29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nUm93Q3NzQ2xhc3MpKVxuICB9XG5cbiAgLy8gUHV0IGhpZGRlbiBmaWVsZHMgaW4gdGhlaXIgb3duIHJvdyBpZiB0aGVyZSB3ZXJlIG5vIHJvd3MgdG8gZGlzcGxheS5cbiAgaWYgKGhpZGRlbkZpZWxkcy5sZW5ndGggPiAwICYmIHJvd3MubGVuZ3RoID09PSAwKSB7XG4gICAgcm93cy5wdXNoKGVycm9yUm93KHRoaXMuYWRkUHJlZml4KCdfX2hpZGRlbkZpZWxkc19fJyksXG4gICAgICAgICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbkZpZWxkcyxcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRkZW5GaWVsZFJvd0Nzc0NsYXNzKSlcbiAgfVxuXG4gIHJldHVybiByb3dzXG59XG5cbmZ1bmN0aW9uIF9ub3JtYWxSb3cocmVhY3RFbCwga2V5LCBjc3NDbGFzc2VzLCBsYWJlbCwgZmllbGQsIHBlbmRpbmcsIGhlbHBUZXh0LCBlcnJvcnMsIGV4dHJhQ29udGVudCkge1xuICB2YXIgcm93QXR0cnMgPSB7a2V5OiBrZXl9XG4gIGlmIChjc3NDbGFzc2VzKSB7IHJvd0F0dHJzLmNsYXNzTmFtZSA9IGNzc0NsYXNzZXMgfVxuICB2YXIgY29udGVudHMgPSBbcm93QXR0cnNdXG4gIGlmIChlcnJvcnMpIHsgY29udGVudHMucHVzaChlcnJvcnMpIH1cbiAgaWYgKGxhYmVsKSB7IGNvbnRlbnRzLnB1c2gobGFiZWwpIH1cbiAgY29udGVudHMucHVzaCgnICcpXG4gIGNvbnRlbnRzLnB1c2goZmllbGQpXG4gIGlmIChwZW5kaW5nKSB7XG4gICAgY29udGVudHMucHVzaCgnICcpXG4gICAgY29udGVudHMucHVzaChwZW5kaW5nKVxuICB9XG4gIGlmIChoZWxwVGV4dCkge1xuICAgIGNvbnRlbnRzLnB1c2goJyAnKVxuICAgIGNvbnRlbnRzLnB1c2goaGVscFRleHQpXG4gIH1cbiAgaWYgKGV4dHJhQ29udGVudCkgeyBjb250ZW50cy5wdXNoLmFwcGx5KGNvbnRlbnRzLCBleHRyYUNvbnRlbnQpIH1cbiAgcmV0dXJuIHJlYWN0RWwuYXBwbHkobnVsbCwgY29udGVudHMpXG59XG5cbmZ1bmN0aW9uIF9lcnJvclJvdyhyZWFjdEVsLCBrZXksIGVycm9ycywgZXh0cmFDb250ZW50LCBjc3NDbGFzc2VzKSB7XG4gIHZhciByb3dBdHRycyA9IHtrZXk6IGtleX1cbiAgaWYgKGNzc0NsYXNzZXMpIHsgcm93QXR0cnMuY2xhc3NOYW1lID0gY3NzQ2xhc3NlcyB9XG4gIHZhciBjb250ZW50cyA9IFtyb3dBdHRyc11cbiAgaWYgKGVycm9ycykgeyBjb250ZW50cy5wdXNoKGVycm9ycykgfVxuICBpZiAoZXh0cmFDb250ZW50KSB7IGNvbnRlbnRzLnB1c2guYXBwbHkoY29udGVudHMsIGV4dHJhQ29udGVudCkgfVxuICByZXR1cm4gcmVhY3RFbC5hcHBseShudWxsLCBjb250ZW50cylcbn1cblxuZnVuY3Rpb24gX3NpbmdsZUVsZW1lbnRSb3cocmVhY3RFbCkge1xuICB2YXIgbm9ybWFsUm93ID0gX25vcm1hbFJvdy5iaW5kKG51bGwsIHJlYWN0RWwpXG4gIHZhciBlcnJvclJvdyA9IF9lcnJvclJvdy5iaW5kKG51bGwsIHJlYWN0RWwpXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5faHRtbE91dHB1dChub3JtYWxSb3csIGVycm9yUm93KVxuICB9XG59XG5cbi8qKlxuICogUmVuZGVycyBhIFwicm93XCIgaW4gYSBmb3JtLiBUaGlzIGNhbiBjb250YWluIG1hbnVhbGx5IHByb3ZpZGVkIGNvbnRlbnRzLCBvclxuICogaWYgYSBCb3VuZEZpZWxkIGlzIGdpdmVuLCBpdCB3aWxsIGJlIHVzZWQgdG8gZGlzcGxheSBhIGZpZWxkJ3MgbGFiZWwsIHdpZGdldCxcbiAqIGVycm9yIG1lc3NhZ2UocyksIGhlbHAgdGV4dCBhbmQgYXN5bmMgcGVuZGluZyBpbmRpY2F0b3IuXG4gKi9cbnZhciBGb3JtUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBwcm9wVHlwZXM6IHtcbiAgICBiZjogUmVhY3QuUHJvcFR5cGVzLmluc3RhbmNlT2YoQm91bmRGaWVsZClcbiAgLCBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgLCBjb21wb25lbnQ6IFJlYWN0LlByb3BUeXBlcy5hbnlcbiAgLCBjb250ZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55XG4gICwgaGlkZGVuOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICAsIF9fYWxsX186IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICBpZiAoIXByb3BzLmJmICYmICFwcm9wcy5jb250ZW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0ludmFsaWQgcHJvcHMgc3VwcGxpZWQgdG8gYEZvcm1Sb3dgLCBlaXRoZXIgYGJmYCBvciBgY29udGVudGAgJyArXG4gICAgICAgICAgJ211c3QgYmUgc3BlY2lmaWVkLidcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgaWYgKHByb3BzLmJmICYmIHByb3BzLmNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgICAgICAnQm90aCBgYmZgIGFuZCBgY29udGVudGAgcHJvcHMgd2VyZSBwYXNzZWQgdG8gYEZvcm1Sb3dgIC0gYGJmYCAnICtcbiAgICAgICAgICAnd2lsbCBiZSBpZ25vcmVkLidcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnQ6ICdkaXYnXG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGF0dHJzID0ge31cbiAgICBpZiAodGhpcy5wcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgIGF0dHJzLmNsYXNzTmFtZSA9IHRoaXMucHJvcHMuY2xhc3NOYW1lXG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmhpZGRlbikge1xuICAgICAgYXR0cnMuc3R5bGUgPSB7ZGlzcGxheTogJ25vbmUnfVxuICAgIH1cbiAgICAvLyBJZiBjb250ZW50IHdhcyBnaXZlbiwgdXNlIGl0XG4gICAgaWYgKHRoaXMucHJvcHMuY29udGVudCkge1xuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQodGhpcy5wcm9wcy5jb21wb25lbnQsIGF0dHJzLCB0aGlzLnByb3BzLmNvbnRlbnQpXG4gICAgfVxuICAgIC8vIE90aGVyd2lzZSByZW5kZXIgYSBCb3VuZEZpZWxkXG4gICAgdmFyIGJmID0gdGhpcy5wcm9wcy5iZlxuICAgIHZhciBpc1BlbmRpbmcgPSBiZi5pc1BlbmRpbmcoKVxuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KHRoaXMucHJvcHMuY29tcG9uZW50LCBhdHRycyxcbiAgICAgIGJmLmxhYmVsVGFnKCksICcgJywgYmYucmVuZGVyKCksXG4gICAgICBpc1BlbmRpbmcgJiYgJyAnLFxuICAgICAgaXNQZW5kaW5nICYmIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3Byb2dyZXNzJywgbnVsbCwgJ1ZhbGlkYXRpbmcuLi4nKSxcbiAgICAgIGJmLmVycm9ycygpLnJlbmRlcigpLFxuICAgICAgYmYuaGVscFRleHRUYWcoKVxuICAgIClcbiAgfVxufSlcblxudmFyIGZvcm1Qcm9wcyA9IHtcbiAgYXV0b0lkOiB1dGlsLmF1dG9JZENoZWNrZXJcbiwgY29udHJvbGxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiwgZGF0YTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuLCBlbXB0eVBlcm1pdHRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiwgZXJyb3JDb25zdHJ1Y3RvcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiwgZXJyb3JzOiBSZWFjdC5Qcm9wVHlwZXMuaW5zdGFuY2VPZihFcnJvck9iamVjdClcbiwgZmlsZXM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3RcbiwgaW5pdGlhbDogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuLCBsYWJlbFN1ZmZpeDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuLCBvbkNoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiwgcHJlZml4OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4sIHZhbGlkYXRpb246IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgLCBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG4gIF0pXG59XG5cbmlmIChcInByb2R1Y3Rpb25cIiAhPT0gXCJkZXZlbG9wbWVudFwiKSB7XG4gIHZhciB3YXJuZWRBYm91dFJlYWN0QWRkb25zID0gZmFsc2Vcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgRm9ybS4gQSBmb3JtIGluc3RhbmNlIG9yIGNvbnN0cnVjdG9yIGNhbiBiZSBnaXZlbi4gSWYgYSBjb25zdHJ1Y3RvclxuICogaXMgZ2l2ZW4sIGFuIGluc3RhbmNlIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgbW91bnRlZCwgYW5kIGFueVxuICogYWRkaXRpb25hbCBwcm9wcyB3aWxsIGJlIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IgYXMgb3B0aW9ucy5cbiAqL1xudmFyIFJlbmRlckZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGRpc3BsYXlOYW1lOiAnUmVuZGVyRm9ybScsXG4gIHByb3BUeXBlczogb2JqZWN0LmV4dGVuZCh7fSwgZm9ybVByb3BzLCB7XG4gICAgY2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nICAgICAgLy8gQ2xhc3MgZm9yIHRoZSBjb21wb25lbnQgd3JhcHBpbmcgYWxsIHJvd3NcbiAgLCBjb21wb25lbnQ6IFJlYWN0LlByb3BUeXBlcy5hbnkgICAgICAgICAvLyBDb21wb25lbnQgdG8gd3JhcCBhbGwgcm93c1xuICAsIGZvcm06IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoWyAgICAgIC8vIEZvcm0gaW5zdGFuY2Ugb3IgY29uc3RydWN0b3JcbiAgICAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgICAgUmVhY3QuUHJvcFR5cGVzLmluc3RhbmNlT2YoQmFzZUZvcm0pXG4gICAgXSkuaXNSZXF1aXJlZFxuICAsIHJvdzogUmVhY3QuUHJvcFR5cGVzLmFueSAgICAgICAgICAgICAgIC8vIENvbXBvbmVudCB0byByZW5kZXIgZm9ybSByb3dzXG4gICwgcm93Q29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55ICAgICAgLy8gQ29tcG9uZW50IHRvIHdyYXAgZWFjaCByb3dcbiAgfSksXG5cbiAgY2hpbGRDb250ZXh0VHlwZXM6IHtcbiAgICBmb3JtOiBSZWFjdC5Qcm9wVHlwZXMuaW5zdGFuY2VPZihCYXNlRm9ybSlcbiAgfSxcblxuICBnZXRDaGlsZENvbnRleHQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7Zm9ybTogdGhpcy5mb3JtfVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudDogJ2RpdidcbiAgICAsIHJvdzogRm9ybVJvd1xuICAgICwgcm93Q29tcG9uZW50OiAnZGl2J1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnByb3BzLmZvcm0gaW5zdGFuY2VvZiBCYXNlRm9ybSkge1xuICAgICAgdGhpcy5mb3JtID0gdGhpcy5wcm9wcy5mb3JtXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5mb3JtID0gbmV3IHRoaXMucHJvcHMuZm9ybShvYmplY3QuZXh0ZW5kKHtcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMuZm9yY2VVcGRhdGUuYmluZCh0aGlzKVxuICAgICAgfSwgdXRpbC5nZXRQcm9wcyh0aGlzLnByb3BzLCBPYmplY3Qua2V5cyhmb3JtUHJvcHMpKSkpXG4gICAgfVxuICB9LFxuXG4gIGdldEZvcm06IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmZvcm1cbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIC8vIEFsbG93IGEgc2luZ2xlIGNoaWxkIHRvIGJlIHBhc3NlZCBmb3IgY3VzdG9tIHJlbmRlcmluZyAtIHBhc3NpbmcgYW55IG1vcmVcbiAgICAvLyB3aWxsIHRocm93IGFuIGVycm9yLlxuICAgIGlmIChSZWFjdC5DaGlsZHJlbi5jb3VudCh0aGlzLnByb3BzLmNoaWxkcmVuKSAhPT0gMCkge1xuICAgICAgcmV0dXJuIFJlYWN0LkNoaWxkcmVuLm9ubHkodGhpcy5wcm9wcy5jaGlsZHJlbilcbiAgICAgIC8vIFRPRE8gQ2xvbmluZyBzaG91bGQgbm8gbG9uZ2VyIGJlIG5lY2Vzc2FyeSB3aGVuIGZhY2Vib29rL3JlYWN0IzIxMTIgbGFuZHNcbiAgICAgIGlmIChSZWFjdC5hZGRvbnMpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0LmFkZG9ucy5jbG9uZVdpdGhQcm9wcyhSZWFjdC5DaGlsZHJlbi5vbmx5KHRoaXMucHJvcHMuY2hpbGRyZW4pLCB7Zm9ybTogdGhpcy5mb3JtfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICAgICAgICAgIGlmICghd2FybmVkQWJvdXRSZWFjdEFkZG9ucykge1xuICAgICAgICAgICAgdXRpbC53YXJuaW5nKFxuICAgICAgICAgICAgICAnQ2hpbGRyZW4gaGF2ZSBiZWVuIHBhc3NlZCB0byBSZW5kZXJGb3JtIGJ1dCBSZWFjdC5hZGRvbnMuJyArXG4gICAgICAgICAgICAgICdjbG9uZVdpdGhQcm9wcyBpcyBub3QgYXZhaWxhYmxlIHRvIGNsb25lIHRoZW0uICcgK1xuICAgICAgICAgICAgICAnVG8gdXNlIGN1c3RvbSByZW5kZXJpbmcsIHlvdSBtdXN0IHVzZSB0aGUgcmVhY3Qtd2l0aC1hZGRvbnMgJyArXG4gICAgICAgICAgICAgICdidWlsZCBvZiBSZWFjdC4nXG4gICAgICAgICAgICApXG4gICAgICAgICAgICB3YXJuZWRBYm91dFJlYWN0QWRkb25zID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlZmF1bHQgcmVuZGVyaW5nXG4gICAgdmFyIGZvcm0gPSB0aGlzLmZvcm1cbiAgICB2YXIgcHJvcHMgPSB0aGlzLnByb3BzXG4gICAgdmFyIGF0dHJzID0ge31cbiAgICBpZiAodGhpcy5wcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgIGF0dHJzLmNsYXNzTmFtZSA9IHByb3BzLmNsYXNzTmFtZVxuICAgIH1cbiAgICB2YXIgdG9wRXJyb3JzID0gZm9ybS5ub25GaWVsZEVycm9ycygpXG4gICAgdmFyIGhpZGRlbkZpZWxkcyA9IGZvcm0uaGlkZGVuRmllbGRzKCkubWFwKGZ1bmN0aW9uKGJmKSB7XG4gICAgICB2YXIgZXJyb3JzID0gYmYuZXJyb3JzKClcbiAgICAgIGlmIChlcnJvcnMuaXNQb3B1bGF0ZWQpIHtcbiAgICAgICAgdG9wRXJyb3JzLmV4dGVuZChlcnJvcnMubWVzc2FnZXMoKS5tYXAoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gJyhIaWRkZW4gZmllbGQgJyArIGJmLm5hbWUgKyAnKSAnICsgZXJyb3JcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgICByZXR1cm4gYmYucmVuZGVyKClcbiAgICB9KVxuXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQocHJvcHMuY29tcG9uZW50LCBhdHRycyxcbiAgICAgIHRvcEVycm9ycy5pc1BvcHVsYXRlZCgpICYmIFJlYWN0LmNyZWF0ZUVsZW1lbnQocHJvcHMucm93LCB7XG4gICAgICAgIGNsYXNzTmFtZTogZm9ybS5lcnJvckNzc0NsYXNzXG4gICAgICAsIGNvbnRlbnQ6IHRvcEVycm9ycy5yZW5kZXIoKVxuICAgICAgLCBrZXk6IGZvcm0uYWRkUHJlZml4KCdfX2FsbF9fJylcbiAgICAgICwgY29tcG9uZW50OiBwcm9wcy5yb3dDb21wb25lbnRcbiAgICAgIH0pLFxuICAgICAgZm9ybS52aXNpYmxlRmllbGRzKCkubWFwKGZ1bmN0aW9uKGJmKSB7XG4gICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KHByb3BzLnJvdywge1xuICAgICAgICAgIGJmOiBiZlxuICAgICAgICAsIGNsYXNzTmFtZTogYmYuY3NzQ2xhc3NlcygpXG4gICAgICAgICwga2V5OiBiZi5odG1sTmFtZVxuICAgICAgICAsIGNvbXBvbmVudDogcHJvcHMucm93Q29tcG9uZW50XG4gICAgICAgIH0pXG4gICAgICB9LmJpbmQodGhpcykpLFxuICAgICAgZm9ybS5ub25GaWVsZFBlbmRpbmcoKSAmJiBSZWFjdC5jcmVhdGVFbGVtZW50KHByb3BzLnJvdywge1xuICAgICAgICBjbGFzc05hbWU6IGZvcm0ucGVuZGluZ1Jvd0Nzc0NsYXNzXG4gICAgICAsIGNvbnRlbnQ6IFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3Byb2dyZXNzJywgbnVsbCwgJ1ZhbGlkYXRpbmcuLi4nKVxuICAgICAgLCBrZXk6IGZvcm0uYWRkUHJlZml4KCdfX3BlbmRpbmdfXycpXG4gICAgICAsIGNvbXBvbmVudDogcHJvcHMucm93Q29tcG9uZW50XG4gICAgICB9KSxcbiAgICAgIGhpZGRlbkZpZWxkcy5sZW5ndGggPiAwICYmIFJlYWN0LmNyZWF0ZUVsZW1lbnQocHJvcHMucm93LCB7XG4gICAgICAgIGNsYXNzTmFtZTogZm9ybS5oaWRkZW5GaWVsZFJvd0Nzc0NsYXNzXG4gICAgICAsIGNvbnRlbnQ6IGhpZGRlbkZpZWxkc1xuICAgICAgLCBoaWRkZW46IHRydWVcbiAgICAgICwga2V5OiBmb3JtLmFkZFByZWZpeCgnX19oaWRkZW5fXycpXG4gICAgICAsIGNvbXBvbmVudDogcHJvcHMucm93Q29tcG9uZW50XG4gICAgICB9KVxuICAgIClcbiAgfVxufSlcblxuLy8gVE9ETyBTdXBwb3J0IGRlY2xhcmluZyBwcm9wVHlwZXMgd2hlbiBleHRlbmRpbmcgZm9ybXMgLSBtZXJnZSB0aGVtIGluIGhlcmVcbi8qKlxuICogTWV0YSBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgZGVjbGFyYXRpdmUgZmllbGRzIGFuZCBpbmhlcml0aW5nIGZpZWxkcyBmcm9tXG4gKiBmb3JtcyBmdXJ0aGVyIHVwIHRoZSBpbmhlcml0YW5jZSBjaGFpbiBvciBiZWluZyBleHBsaWNpdGx5IG1peGVkLWluLCB3aGljaFxuICogc2V0cyB1cCBiYXNlRmllbGRzIGFuZCBkZWNsYXJlZEZpZWxkcyBvbiBhIG5ldyBGb3JtIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlLlxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywqPn0gcHJvdG90eXBlUHJvcHNcbiAqL1xuZnVuY3Rpb24gRGVjbGFyYXRpdmVGaWVsZHNNZXRhKHByb3RvdHlwZVByb3BzKSB7XG4gIC8vIFBvcCBGaWVsZHMgaW5zdGFuY2VzIGZyb20gcHJvdG90eXBlUHJvcHMgdG8gYnVpbGQgdXAgdGhlIG5ldyBmb3JtJ3Mgb3duXG4gIC8vIGRlY2xhcmVkRmllbGRzLlxuICB2YXIgZmllbGRzID0gW11cbiAgT2JqZWN0LmtleXMocHJvdG90eXBlUHJvcHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgIGlmIChwcm90b3R5cGVQcm9wc1tuYW1lXSBpbnN0YW5jZW9mIEZpZWxkKSB7XG4gICAgICBmaWVsZHMucHVzaChbbmFtZSwgcHJvdG90eXBlUHJvcHNbbmFtZV1dKVxuICAgICAgZGVsZXRlIHByb3RvdHlwZVByb3BzW25hbWVdXG4gICAgfVxuICB9KVxuICBmaWVsZHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGFbMV0uY3JlYXRpb25Db3VudGVyIC0gYlsxXS5jcmVhdGlvbkNvdW50ZXJcbiAgfSlcbiAgcHJvdG90eXBlUHJvcHMuZGVjbGFyZWRGaWVsZHMgPSBvYmplY3QuZnJvbUl0ZW1zKGZpZWxkcylcblxuICAvLyBCdWlsZCB1cCBmaW5hbCBkZWNsYXJlZEZpZWxkcyBmcm9tIHRoZSBmb3JtIGJlaW5nIGV4dGVuZGVkLCBmb3JtcyBiZWluZ1xuICAvLyBtaXhlZCBpbiBhbmQgdGhlIG5ldyBmb3JtJ3Mgb3duIGRlY2xhcmVkRmllbGRzLCBpbiB0aGF0IG9yZGVyIG9mXG4gIC8vIHByZWNlZGVuY2UuXG4gIHZhciBkZWNsYXJlZEZpZWxkcyA9IHt9XG5cbiAgLy8gSWYgd2UncmUgZXh0ZW5kaW5nIGFub3RoZXIgZm9ybSwgd2UgZG9uJ3QgbmVlZCB0byBjaGVjayBmb3Igc2hhZG93ZWRcbiAgLy8gZmllbGRzLCBhcyBpdCdzIGF0IHRoZSBib3R0b20gb2YgdGhlIHBpbGUgZm9yIGluaGVyaXRpbmcgZGVjbGFyZWRGaWVsZHMuXG4gIGlmIChvYmplY3QuaGFzT3duKHRoaXMsICdkZWNsYXJlZEZpZWxkcycpKSB7XG4gICAgb2JqZWN0LmV4dGVuZChkZWNsYXJlZEZpZWxkcywgdGhpcy5kZWNsYXJlZEZpZWxkcylcbiAgfVxuXG4gIC8vIElmIGFueSBtaXhpbnMgd2hpY2ggbG9vayBsaWtlIEZvcm0gY29uc3RydWN0b3JzIHdlcmUgZ2l2ZW4sIGluaGVyaXQgdGhlaXJcbiAgLy8gZGVjbGFyZWRGaWVsZHMgYW5kIGNoZWNrIGZvciBzaGFkb3dlZCBmaWVsZHMuXG4gIGlmIChvYmplY3QuaGFzT3duKHByb3RvdHlwZVByb3BzLCAnX19taXhpbnNfXycpKSB7XG4gICAgdmFyIG1peGlucyA9IHByb3RvdHlwZVByb3BzLl9fbWl4aW5zX19cbiAgICBpZiAoIWlzLkFycmF5KG1peGlucykpIHsgbWl4aW5zID0gW21peGluc10gfVxuICAgIC8vIFByb2Nlc3MgbWl4aW5zIGZyb20gbGVmdC10by1yaWdodCwgdGhlIHNhbWUgcHJlY2VkZW5jZSB0aGV5J2xsIGdldCBmb3JcbiAgICAvLyBoYXZpbmcgdGhlaXIgcHJvdG90eXBlIHByb3BlcnRpZXMgbWl4ZWQgaW4uXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBtaXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgbWl4aW4gPSBtaXhpbnNbaV1cbiAgICAgIGlmIChpcy5GdW5jdGlvbihtaXhpbikgJiYgb2JqZWN0Lmhhc093bihtaXhpbi5wcm90b3R5cGUsICdkZWNsYXJlZEZpZWxkcycpKSB7XG4gICAgICAgIC8vIEV4dGVuZCBtaXhlZC1pbiBkZWNsYXJlZEZpZWxkcyBvdmVyIHRoZSB0b3Agb2Ygd2hhdCdzIGFscmVhZHkgdGhlcmUsXG4gICAgICAgIC8vIHRoZW4gZGVsZXRlIGFueSBmaWVsZHMgd2hpY2ggaGF2ZSBiZWVuIHNoYWRvd2VkIGJ5IGEgbm9uLUZpZWxkXG4gICAgICAgIC8vIHByb3BlcnR5IGluIGl0cyBwcm90b3R5cGUuXG4gICAgICAgIG9iamVjdC5leHRlbmQoZGVjbGFyZWRGaWVsZHMsIG1peGluLnByb3RvdHlwZS5kZWNsYXJlZEZpZWxkcylcbiAgICAgICAgT2JqZWN0LmtleXMobWl4aW4ucHJvdG90eXBlKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICBpZiAob2JqZWN0Lmhhc093bihkZWNsYXJlZEZpZWxkcywgbmFtZSkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBkZWNsYXJlZEZpZWxkc1tuYW1lXVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLy8gVG8gYXZvaWQgb3ZlcndyaXRpbmcgdGhlIG5ldyBmb3JtJ3MgYmFzZUZpZWxkcywgZGVjbGFyZWRGaWVsZHMgb3JcbiAgICAgICAgLy8gY29uc3RydWN0b3Igd2hlbiB0aGUgcmVzdCBvZiB0aGUgbWl4aW4ncyBwcm90b3R5cGUgaXMgbWl4ZWQtaW4gYnlcbiAgICAgICAgLy8gQ29uY3VyLCByZXBsYWNlIHRoZSBtaXhpbiB3aXRoIGFuIG9iamVjdCBjb250YWluaW5nIG9ubHkgaXRzIG90aGVyXG4gICAgICAgIC8vIHByb3RvdHlwZSBwcm9wZXJ0aWVzLlxuICAgICAgICB2YXIgbWl4aW5Qcm90b3R5cGUgPSBvYmplY3QuZXh0ZW5kKHt9LCBtaXhpbi5wcm90b3R5cGUpXG4gICAgICAgIGRlbGV0ZSBtaXhpblByb3RvdHlwZS5iYXNlRmllbGRzXG4gICAgICAgIGRlbGV0ZSBtaXhpblByb3RvdHlwZS5kZWNsYXJlZEZpZWxkc1xuICAgICAgICBkZWxldGUgbWl4aW5Qcm90b3R5cGUuY29uc3RydWN0b3JcbiAgICAgICAgbWl4aW5zW2ldID0gbWl4aW5Qcm90b3R5cGVcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gV2UgbWF5IGhhdmUgd3JhcHBlZCBhIHNpbmdsZSBtaXhpbiBpbiBhbiBBcnJheSAtIGFzc2lnbiBpdCBiYWNrIHRvIHRoZVxuICAgIC8vIG5ldyBmb3JtJ3MgcHJvdG90eXBlIGZvciBwcm9jZXNzaW5nIGJ5IENvbmN1ci5cbiAgICBwcm90b3R5cGVQcm9wcy5fX21peGluc19fID0gbWl4aW5zXG4gIH1cblxuICAvLyBGaW5hbGx5IC0gZXh0ZW5kIHRoZSBuZXcgZm9ybSdzIG93biBkZWNsYXJlZEZpZWxkcyBvdmVyIHRoZSB0b3Agb2ZcbiAgLy8gZGVjbGFyZWRGaWVsZHMgYmVpbmcgaW5oZXJpdGVkLCB0aGVuIGRlbGV0ZSBhbnkgZmllbGRzIHdoaWNoIGhhdmUgYmVlblxuICAvLyBzaGFkb3dlZCBieSBhIG5vbi1GaWVsZCBwcm9wZXJ0eSBpbiBpdHMgcHJvdG90eXBlLlxuICBvYmplY3QuZXh0ZW5kKGRlY2xhcmVkRmllbGRzLCBwcm90b3R5cGVQcm9wcy5kZWNsYXJlZEZpZWxkcylcbiAgT2JqZWN0LmtleXMocHJvdG90eXBlUHJvcHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgIGlmIChvYmplY3QuaGFzT3duKGRlY2xhcmVkRmllbGRzLCBuYW1lKSkge1xuICAgICAgZGVsZXRlIGRlY2xhcmVkRmllbGRzW25hbWVdXG4gICAgfVxuICB9KVxuXG4gIHByb3RvdHlwZVByb3BzLmJhc2VGaWVsZHMgPSBkZWNsYXJlZEZpZWxkc1xuICBwcm90b3R5cGVQcm9wcy5kZWNsYXJlZEZpZWxkcyA9IGRlY2xhcmVkRmllbGRzXG5cbiAgLy8gSWYgYSBjbGVhbiBtZXRob2QgaXMgc3BlY2lmaWVkIGFzIFtmaWVsZDEsIGZpZWxkMiwgLi4uLCBjbGVhbkZ1bmN0aW9uXSxcbiAgLy8gcmVwbGFjZSBpdCB3aXRoIHRoZSBjbGVhbiBmdW5jdGlvbiBhbmQgYXR0YWNoIHRoZSBmaWVsZCBuYW1lcyB0byB0aGVcbiAgLy8gZnVuY3Rpb24uXG4gIGlmIChvYmplY3QuaGFzT3duKHByb3RvdHlwZVByb3BzLCAnY2xlYW4nKSAmJiBpcy5BcnJheShwcm90b3R5cGVQcm9wcy5jbGVhbikpIHtcbiAgICB2YXIgY2xlYW4gPSBwcm90b3R5cGVQcm9wcy5jbGVhbi5wb3AoKVxuICAgIGNsZWFuLmZpZWxkcyA9IG9iamVjdC5sb29rdXAocHJvdG90eXBlUHJvcHMuY2xlYW4pXG4gICAgcHJvdG90eXBlUHJvcHMuY2xlYW4gPSBjbGVhblxuICB9XG59XG5cbi8qKlxuICogQmFzZSBjb25zdHJ1Y3RvciB3aGljaCBhY3RzIGFzIHRoZSB1c2VyIEFQSSBmb3IgY3JlYXRpbmcgbmV3IGZvcm1cbiAqIGNvbnN0cnVjdG9ycywgZXh0ZW5kaW5nIEJhc2VGb3JtIGFuZCByZWdpc3RlcmluZyBEZWNsYXJhdGl2ZUZpZWxkc01ldGEgYXNcbiAqIGl0cyBfX21ldGFfXyBmdW5jdGlvbiB0byBoYW5kbGUgc2V0dGluZyB1cCBuZXcgZm9ybSBjb25zdHJ1Y3RvciBwcm90b3R5cGVzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7QmFzZUZvcm19XG4gKi9cbnZhciBGb3JtID0gQmFzZUZvcm0uZXh0ZW5kKHtcbiAgX19tZXRhX186IERlY2xhcmF0aXZlRmllbGRzTWV0YVxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRm9ybSgpIHtcbiAgICBCYXNlRm9ybS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH1cbn0pXG5cbnZhciBfZXh0ZW5kID0gRm9ybS5leHRlbmRcblxuRm9ybS5leHRlbmQgPSBmdW5jdGlvbihwcm90b3R5cGVQcm9wcywgY29uc3RydWN0b3JQcm9wcykge1xuICByZXR1cm4gX2V4dGVuZC5jYWxsKHRoaXMsIG9iamVjdC5leHRlbmQoe30sIHByb3RvdHlwZVByb3BzKSwgY29uc3RydWN0b3JQcm9wcylcbn1cblxuZnVuY3Rpb24gaXNGb3JtQXN5bmMoY29uc3RydWN0b3IpIHtcbiAgdmFyIHByb3RvID0gY29uc3RydWN0b3IucHJvdG90eXBlXG4gIGlmIChwcm90by5jbGVhbi5sZW5ndGggPT0gMSkgeyByZXR1cm4gdHJ1ZSB9XG4gIHZhciBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMocHJvdG8uYmFzZUZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB2YXIgY3VzdG9tQ2xlYW4gPSBwcm90by5fZ2V0Q3VzdG9tQ2xlYW4oZmllbGROYW1lc1tpXSlcbiAgICBpZiAoaXMuRnVuY3Rpb24oY3VzdG9tQ2xlYW4pICYmIGN1c3RvbUNsZWFuLmxlbmd0aCA9PSAxKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIE5PTl9GSUVMRF9FUlJPUlM6IE5PTl9GSUVMRF9FUlJPUlNcbiwgQmFzZUZvcm06IEJhc2VGb3JtXG4sIERlY2xhcmF0aXZlRmllbGRzTWV0YTogRGVjbGFyYXRpdmVGaWVsZHNNZXRhXG4sIEZvcm1Sb3c6IEZvcm1Sb3dcbiwgRm9ybTogRm9ybVxuLCBpc0Zvcm1Bc3luYzogaXNGb3JtQXN5bmNcbiwgUmVuZGVyRm9ybTogUmVuZGVyRm9ybVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciBpcyA9IHJlcXVpcmUoJ2lzb21vcnBoL2lzJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuUmVhY3QgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLlJlYWN0IDogbnVsbClcbnZhciB2YWxpZGF0b3JzID0gcmVxdWlyZSgndmFsaWRhdG9ycycpXG5cbnZhciBlbnYgPSByZXF1aXJlKCcuL2VudicpXG52YXIgZmllbGRzID0gcmVxdWlyZSgnLi9maWVsZHMnKVxudmFyIGZvcm1zID0gcmVxdWlyZSgnLi9mb3JtcycpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgd2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpXG52YXIgRXJyb3JMaXN0ID0gcmVxdWlyZSgnLi9FcnJvckxpc3QnKVxuXG52YXIgQm9vbGVhbkZpZWxkID0gZmllbGRzLkJvb2xlYW5GaWVsZFxudmFyIEhpZGRlbklucHV0ID0gd2lkZ2V0cy5IaWRkZW5JbnB1dFxudmFyIEludGVnZXJGaWVsZCA9IGZpZWxkcy5JbnRlZ2VyRmllbGRcbnZhciBWYWxpZGF0aW9uRXJyb3IgPSB2YWxpZGF0b3JzLlZhbGlkYXRpb25FcnJvclxuXG5mdW5jdGlvbiBub29wKCkge31cblxuLy8gTmFtZSBhc3NvY2lhdGVkIHdpdGggY2xlYW4oKSB2YWxpZGF0aW9uXG52YXIgQ0xFQU5fVkFMSURBVElPTiA9ICdjbGVhbidcblxuLy8gU3BlY2lhbCBmaWVsZCBuYW1lc1xudmFyIERFTEVUSU9OX0ZJRUxEX05BTUUgPSAnREVMRVRFJ1xudmFyIElOSVRJQUxfRk9STV9DT1VOVCA9ICdJTklUSUFMX0ZPUk1TJ1xudmFyIE1BWF9OVU1fRk9STV9DT1VOVCA9ICdNQVhfTlVNX0ZPUk1TJ1xudmFyIE1JTl9OVU1fRk9STV9DT1VOVCA9ICdNSU5fTlVNX0ZPUk1TJ1xudmFyIE9SREVSSU5HX0ZJRUxEX05BTUUgPSAnT1JERVInXG52YXIgVE9UQUxfRk9STV9DT1VOVCA9ICdUT1RBTF9GT1JNUydcblxuLy8gRGVmYXVsdCBtaW5pbXVtIG51bWJlciBvZiBmb3JtcyBpbiBhIGZvcm1zZXRcbnZhciBERUZBVUxUX01JTl9OVU0gPSAwXG5cbi8vIERlZmF1bHQgbWF4aW11bSBudW1iZXIgb2YgZm9ybXMgaW4gYSBmb3Jtc2V0LCB0byBwcmV2ZW50IG1lbW9yeSBleGhhdXN0aW9uXG52YXIgREVGQVVMVF9NQVhfTlVNID0gMTAwMFxuXG4vKipcbiAqIE1hbmFnZW1lbnRGb3JtIGlzIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBob3cgbWFueSBmb3JtIGluc3RhbmNlcyBhcmUgZGlzcGxheWVkXG4gKiBvbiB0aGUgcGFnZS4gSWYgYWRkaW5nIG5ldyBmb3JtcyB2aWEgSmF2YVNjcmlwdCwgeW91IHNob3VsZCBpbmNyZW1lbnQgdGhlXG4gKiBjb3VudCBmaWVsZCBvZiB0aGlzIGZvcm0gYXMgd2VsbC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgTWFuYWdlbWVudEZvcm0gPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBmaWVsZHMgPSB7fVxuICBmaWVsZHNbVE9UQUxfRk9STV9DT1VOVF0gPSBJbnRlZ2VyRmllbGQoe3dpZGdldDogSGlkZGVuSW5wdXR9KVxuICBmaWVsZHNbSU5JVElBTF9GT1JNX0NPVU5UXSA9IEludGVnZXJGaWVsZCh7d2lkZ2V0OiBIaWRkZW5JbnB1dH0pXG4gIC8vIE1JTl9OVU1fRk9STV9DT1VOVCBhbmQgTUFYX05VTV9GT1JNX0NPVU5UIGFyZSBvdXRwdXQgd2l0aCB0aGUgcmVzdCBvZlxuICAvLyB0aGUgbWFuYWdlbWVudCBmb3JtLCBidXQgb25seSBmb3IgdGhlIGNvbnZlbmllbmNlIG9mIGNsaWVudC1zaWRlXG4gIC8vIGNvZGUuIFRoZSBQT1NUIHZhbHVlIG9mIHRoZW0gcmV0dXJuZWQgZnJvbSB0aGUgY2xpZW50IGlzIG5vdCBjaGVja2VkLlxuICBmaWVsZHNbTUlOX05VTV9GT1JNX0NPVU5UXSA9IEludGVnZXJGaWVsZCh7cmVxdWlyZWQ6IGZhbHNlLCB3aWRnZXQ6IEhpZGRlbklucHV0fSlcbiAgZmllbGRzW01BWF9OVU1fRk9STV9DT1VOVF0gPSBJbnRlZ2VyRmllbGQoe3JlcXVpcmVkOiBmYWxzZSwgd2lkZ2V0OiBIaWRkZW5JbnB1dH0pXG4gIHJldHVybiBmb3Jtcy5Gb3JtLmV4dGVuZChmaWVsZHMpXG59KSgpXG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBGb3JtLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgQmFzZUZvcm1TZXQgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEJhc2VGb3JtU2V0KGt3YXJncykge1xuICAgIC8vIFRPRE8gUGVyZm9ybSBQcm9wVHlwZSBjaGVja3Mgb24ga3dhcmdzIGluIGRldmVsb3BtZW50IG1vZGVcbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICAgIGRhdGE6IG51bGwsIGZpbGVzOiBudWxsLCBhdXRvSWQ6ICdpZF97bmFtZX0nLCBwcmVmaXg6IG51bGwsXG4gICAgICBpbml0aWFsOiBudWxsLCBlcnJvckNvbnN0cnVjdG9yOiBFcnJvckxpc3QsIG1hbmFnZW1lbnRGb3JtQ3NzQ2xhc3M6IG51bGwsXG4gICAgICB2YWxpZGF0aW9uOiBudWxsLCBjb250cm9sbGVkOiBmYWxzZSwgb25DaGFuZ2U6IG51bGxcbiAgICB9LCBrd2FyZ3MpXG4gICAgdGhpcy5pc0luaXRpYWxSZW5kZXIgPSAoa3dhcmdzLmRhdGEgPT09IG51bGwgJiYga3dhcmdzLmZpbGVzID09PSBudWxsKVxuICAgIHRoaXMucHJlZml4ID0ga3dhcmdzLnByZWZpeCB8fCB0aGlzLmdldERlZmF1bHRQcmVmaXgoKVxuICAgIHRoaXMuYXV0b0lkID0ga3dhcmdzLmF1dG9JZFxuICAgIHRoaXMuZGF0YSA9IGt3YXJncy5kYXRhIHx8IHt9XG4gICAgdGhpcy5maWxlcyA9IGt3YXJncy5maWxlcyB8fCB7fVxuICAgIHRoaXMuaW5pdGlhbCA9IGt3YXJncy5pbml0aWFsXG4gICAgdGhpcy5lcnJvckNvbnN0cnVjdG9yID0ga3dhcmdzLmVycm9yQ29uc3RydWN0b3JcbiAgICB0aGlzLm1hbmFnZW1lbnRGb3JtQ3NzQ2xhc3MgPSBrd2FyZ3MubWFuYWdlbWVudEZvcm1Dc3NDbGFzc1xuICAgIHRoaXMudmFsaWRhdGlvbiA9IGt3YXJncy52YWxpZGF0aW9uXG4gICAgdGhpcy5jb250cm9sbGVkID0ga3dhcmdzLmNvbnRyb2xsZWRcbiAgICB0aGlzLm9uQ2hhbmdlID0ga3dhcmdzLm9uQ2hhbmdlXG5cbiAgICB0aGlzLl9mb3JtcyA9IG51bGxcbiAgICB0aGlzLl9lcnJvcnMgPSBudWxsXG4gICAgdGhpcy5fbm9uRm9ybUVycm9ycyA9IG51bGxcblxuICAgIC8vIExvb2t1cCBmb3IgcGVuZGluZyB2YWxpZGF0aW9uXG4gICAgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24gPSB7fVxuICAgIC8vIENhbmNlbGxhYmxlIGNhbGxiYWNrcyBmb3IgcGVuZGluZyBhc3luYyB2YWxpZGF0aW9uXG4gICAgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbiA9IHt9XG4gICAgLy8gTG9va3VwIGZvciBwZW5kaW5nIHZhbGlkYXRpb24gd2hpY2ggZm9ybXNldCBjbGVhbmluZyBkZXBlbmRzIG9uXG4gICAgdGhpcy5fY2xlYW5Gb3Jtc2V0QWZ0ZXIgPSB7fVxuICAgIC8vIENhbGxiYWNrIHRvIGJlIHJ1biB0aGUgbmV4dCB0aW1lIHZhbGlkYXRpb24gZmluaXNoZXNcbiAgICB0aGlzLl9vblZhbGlkYXRlID0gbnVsbFxuICB9XG59KVxuXG4vKipcbiAqIENhbGxzIHRoZSBvbkNoYW5nZSBmdW5jdGlvbiBpZiBpdCdzIGJlZW4gcHJvdmlkZWQuIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkXG4gKiBldmVyeSB0aW1lIHRoZSBmb3Jtc2V0IG1ha2VzIGEgY2hhbmdlIHRvIGl0cyBzdGF0ZSB3aGljaCByZXF1aXJlcyByZWRpc3BsYXkuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fc3RhdGVDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0eXBlb2YgdGhpcy5vbkNoYW5nZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5vbkNoYW5nZSgpXG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gVmFsaWRhdGlvbiA9PT1cblxuLyoqXG4gKiBGb3JjZXMgdGhlIGZvcm1zZXQgdG8gcmV2YWxpZGF0ZSBmcm9tIHNjcmF0Y2guIElmIGEgPGZvcm0+IGlzIGdpdmVuLCBkYXRhXG4gKiBmcm9tIGl0IHdpbGwgYmUgc2V0IG9uIHRoaXMgZm9ybXNldCdzIGZvcm1zIGZpcnN0LiBPdGhlcndpc2UsIHZhbGlkYXRpb24gd2lsbFxuICogYmUgZG9uZSB3aXRoIGN1cnJlbnQgaW5wdXQgZGF0YS5cbiAqIEBwYXJhbSB7KFJlYWN0RWxlbWVudHxIVE1MRm9ybUVsZW1lbnQpPX0gZm9ybSB0aGUgPGZvcm0+IGNvbnRhaW5pbmcgdGhpc1xuICogICBmb3Jtc2V0J3MgcmVuZGVyZWQgd2lkZ2V0cyAtIHRoaXMgY2FuIGJlIGEgUmVhY3QgPGZvcm0+IGNvbXBvbmVudCBvciBhIHJlYWxcbiAqICAgPGZvcm0+IERPTSBub2RlLlxuICogQHBhcmFtIHtmdW5jdGlvbihlcnIsIGlzVmFsaWQsIGNsZWFuZWREYXRhKT19IGNiIGNhbGxiYWNrIGZvciBhc3luY2hyb25vdXNcbiAqICAgdmFsaWRhdGlvbi5cbiAqIEByZXR1cm4ge2Jvb2xlYW58dW5kZWZpbmVkfSB0cnVlIGlmIHRoZSBmb3JtIG9ubHkgaGFzIHN5bmNocm9ub3VzIHZhbGlkYXRpb25cbiAqICAgYW5kIGlzIHZhbGlkLlxuICogQHRocm93cyBpZiB0aGUgZm9ybXNldCBvciBpdHMgZm9ybSBoYXMgYXN5bmNocm9ub3VzIHZhbGlkYXRpb24gYW5kIGEgY2FsbGJhY2tcbiAqICAgaXMgbm90IHByb3ZpZGVkLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihmb3JtLCBjYikge1xuICB0aGlzLl9jYW5jZWxQZW5kaW5nT3BlcmF0aW9ucygpXG4gIGlmIChpcy5GdW5jdGlvbihmb3JtKSkge1xuICAgIGNiID0gZm9ybVxuICAgIGZvcm0gPSBudWxsXG4gIH1cbiAgaWYgKGZvcm0pIHtcbiAgICBpZiAodHlwZW9mIGZvcm0uZ2V0RE9NTm9kZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmb3JtID0gZm9ybS5nZXRET01Ob2RlKClcbiAgICB9XG4gICAgdGhpcy5zZXREYXRhKHV0aWwuZm9ybURhdGEoZm9ybSksIHtcbiAgICAgIHZhbGlkYXRlOiBmYWxzZVxuICAgICwgX3RyaWdnZXJTdGF0ZUNoYW5nZTogZmFsc2VcbiAgICB9KVxuICB9XG4gIHJldHVybiAodGhpcy5pc0FzeW5jKCkgPyB0aGlzLl92YWxpZGF0ZUFzeW5jKGNiKSA6IHRoaXMuX3ZhbGlkYXRlU3luYygpKVxufVxuXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX3ZhbGlkYXRlQXN5bmMgPSBmdW5jdGlvbihjYikge1xuICBpZiAoIWlzLkZ1bmN0aW9uKGNiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdZb3UgbXVzdCBwcm92aWRlIGEgY2FsbGJhY2sgdG8gdmFsaWRhdGUoKSB3aGVuIGEgZm9ybXNldCBvciBpdHMgZm9ybSAnICtcbiAgICAgICdoYXMgYXN5bmNocm9ub3VzIHZhbGlkYXRpb24uJ1xuICAgIClcbiAgfVxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgdGhpcy5fb25WYWxpZGF0ZSA9IGNiXG4gIHRoaXMuZnVsbENsZWFuKClcbiAgLy8gVXBkYXRlIHN0YXRlIHRvIGRpc3BsYXkgYXN5bmMgcHJvZ3Jlc3MgaW5kaWNhdG9yc1xuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX3ZhbGlkYXRlU3luYyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgdGhpcy5mdWxsQ2xlYW4oKVxuICAvLyBEaXNwbGF5IGNoYW5nZXMgdG8gdmFsaWQvaW52YWxpZCBzdGF0ZVxuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICByZXR1cm4gdGhpcy5pc1ZhbGlkKClcbn1cblxuLyoqXG4gKiBDbGVhbnMgYWxsIG9mIHRoaXMuZGF0YSBhbmQgcG9wdWxhdGVzIHRoaXMuX2Vycm9ycyBhbmQgdGhpcy5fbm9uRm9ybUVycm9ycy5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmZ1bGxDbGVhbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9lcnJvcnMgPSBbXVxuICB0aGlzLl9ub25Gb3JtRXJyb3JzID0gbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcigpXG5cbiAgaWYgKHRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgcmV0dXJuIC8vIFN0b3AgZnVydGhlciBwcm9jZXNzaW5nXG4gIH1cblxuICB0aGlzLl9jbGVhbkZvcm1zKClcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIGNsZWFucyBldmVyeSBmb3JtIGluIHRoZSBmb3Jtc2V0LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NsZWFuRm9ybXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZvcm1zID0gdGhpcy5mb3JtcygpXG4gIHZhciBmb3JtSW5kZXhMb29rdXAgPSBvYmplY3QubG9va3VwKE9iamVjdC5rZXlzKGZvcm1zKSlcbiAgb2JqZWN0LmV4dGVuZCh0aGlzLl9wZW5kaW5nVmFsaWRhdGlvbiwgZm9ybUluZGV4TG9va3VwKVxuICBvYmplY3QuZXh0ZW5kKHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyLCBmb3JtSW5kZXhMb29rdXApXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZm9ybXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdGhpcy5fY2xlYW5Gb3JtKGksIGZvcm1zW2ldKVxuICB9XG4gIC8vIE1ha2Ugc3VyZSBjbGVhbiBnZXRzIGNhbGxlZCBldmVuIGlmIHRoZSBmb3Jtc2V0IGlzIGVtcHR5XG4gIGlmIChmb3Jtcy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9jbGVhbkZvcm1zZXRBZnRlci5lbXB0eSA9IHRydWVcbiAgICB0aGlzLl9mb3JtQ2xlYW5lZCgnZW1wdHknLCBudWxsKVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGFuZCBjbGVhbnMgdGhlIGZvcm0gYXQgdGhlIGdpdmVuIGluZGV4LlxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IHRoZSBpbmRleCBvZiB0aGUgZm9ybSBpbiB0aGUgZm9ybXNldC5cbiAqIEBwYXJhbSB7Rm9ybX0gZm9ybVxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NsZWFuRm9ybSA9IGZ1bmN0aW9uKGluZGV4LCBmb3JtKSB7XG4gIGlmICghZm9ybS5pc0FzeW5jKCkpIHtcbiAgICBmb3JtLnZhbGlkYXRlKClcbiAgICB0aGlzLl9lcnJvcnNbaW5kZXhdID0gZm9ybS5lcnJvcnMoKVxuICAgIHRoaXMuX2Zvcm1DbGVhbmVkKGluZGV4LCBudWxsKVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gSWYgdGhlIGZvcm0gaXMgYXN5bmMgYW5kIHRoZXJlJ3Mgb25lIHBlbmRpbmcsIHByZXZlbnQgaXRzIGNhbGxiYWNrIGZyb21cbiAgLy8gZG9pbmcgYW55dGhpbmcuXG4gIGlmICh0eXBlb2YgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltpbmRleF0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIGluZGV4KS5jYW5jZWwoKVxuICB9XG4gIC8vIFNldCB1cCBjYWxsYmFjayBmb3IgYXN5bmMgcHJvY2Vzc2luZ1xuICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihlcnIpIHtcbiAgICBpZiAoIWVycikge1xuICAgICAgdGhpcy5fZXJyb3JzW2luZGV4XSA9IGZvcm0uZXJyb3JzKClcbiAgICB9XG4gICAgdGhpcy5fZm9ybUNsZWFuZWQoaW5kZXgsIGVycilcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICB9LmJpbmQodGhpcylcbiAgY2FsbGJhY2sub25DYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICBmb3JtLl9jYW5jZWxQZW5kaW5nT3BlcmF0aW9ucygpXG4gIH1cbiAgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltpbmRleF0gPSB1dGlsLmNhbmNlbGxhYmxlKGNhbGxiYWNrKVxuICBmb3JtLnZhbGlkYXRlKGNhbGxiYWNrKVxufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBjb21wbGV0aW9uIG9mIGZvcm0gY2xlYW5pbmcuIFRyaWdnZXJzIGZvcm1zZXQgY2xlYW5pbmcgb3JcbiAqIHNpZ25hbHMgdGhlIGVuZCBvZiB2YWxpZGF0aW9uLCBhcyBuZWNlc3NhcnkuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IG5hbWUgdGhlIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjbGVhbmluZyB0aGF0J3MgY29tcGxldGVkLlxuICogQHBhcmFtIHtFcnJvcj19IGVyciBhbiBlcnJvciBjYXVnaHQgd2hpbGUgY2xlYW5pbmcuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fZm9ybUNsZWFuZWQgPSBmdW5jdGlvbihuYW1lLCBlcnIpIHtcbiAgZGVsZXRlIHRoaXMuX3BlbmRpbmdWYWxpZGF0aW9uW25hbWVdXG4gIGlmICh0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW25hbWVdKSB7XG4gICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bbmFtZV1cbiAgfVxuXG4gIGlmIChlcnIpIHtcbiAgICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY2xlYW5pbmcgZm9ybXNldFsnICsgbmFtZSArICddOicgKyBlcnIubWVzc2FnZSlcbiAgICB9XG4gICAgLy8gU3RvcCB0cmFja2luZyB2YWxpZGF0aW9uIHByb2dyZXNzIG9uIGVycm9yLCBhbmQgZG9uJ3QgY2FsbCBjbGVhbigpXG4gICAgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24gPSB7fVxuICAgIHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyID0ge31cbiAgICB0aGlzLl9maW5pc2hlZFZhbGlkYXRpb24oZXJyKVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gUnVuIGNsZWFuKCkgaWYgdGhpcyB0aGlzIHdhcyB0aGUgbGFzdCBmaWVsZCBpdCB3YXMgd2FpdGluZyBmb3JcbiAgaWYgKHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyW25hbWVdKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyW25hbWVdXG4gICAgaWYgKGlzLkVtcHR5KHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyKSkge1xuICAgICAgdGhpcy5fY2xlYW5Gb3Jtc2V0KClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIC8vIFNpZ25hbCB0aGUgZW5kIG9mIHZhbGlkYXRpb24gaWYgdGhpcyB3YXMgdGhlIGxhc3QgZmllbGQgd2Ugd2VyZSB3YWl0aW5nIGZvclxuICBpZiAobmFtZSA9PSBDTEVBTl9WQUxJREFUSU9OKSB7XG4gICAgdGhpcy5fZmluaXNoZWRWYWxpZGF0aW9uKG51bGwpXG4gIH1cbn1cblxuLyoqXG4gKiBIb29rIGZvciBkb2luZyBhbnkgZXh0cmEgZm9ybXNldC13aWRlIGNsZWFuaW5nIGFmdGVyIEZvcm0uY2xlYW4oKSBoYXMgYmVlblxuICogY2FsbGVkIG9uIGV2ZXJ5IGZvcm0uIEFueSBWYWxpZGF0aW9uRXJyb3IgcmFpc2VkIGJ5IHRoaXMgbWV0aG9kIHdpbGwgbm90IGJlXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGZvcm07IGl0IHdpbGwgYmUgYWNjZXNzaWJsZSB2aWFcbiAqIGZvcm1zZXQubm9uRm9ybUVycm9ycygpXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5jbGVhbiA9IG5vb3BcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhlIG51bWJlciBvZiBmb3JtcyBhbmQgY2FsbHMgdGhlIGNsZWFuKCkgaG9vay5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLl9jbGVhbkZvcm1zZXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFzeW5jID0gZmFsc2VcbiAgdmFyIGVycm9yID0gbnVsbFxuICB0cnkge1xuICAgIHZhciB0b3RhbEZvcm1Db3VudCA9IHRoaXMudG90YWxGb3JtQ291bnQoKVxuICAgIHZhciBkZWxldGVkRm9ybUNvdW50ID0gdGhpcy5kZWxldGVkRm9ybXMoKS5sZW5ndGhcbiAgICBpZiAoKHRoaXMudmFsaWRhdGVNYXggJiYgdG90YWxGb3JtQ291bnQgLSBkZWxldGVkRm9ybUNvdW50ID4gdGhpcy5tYXhOdW0pIHx8XG4gICAgICAgICghZW52LmJyb3dzZXIgJiYgdGhpcy5tYW5hZ2VtZW50Rm9ybSgpLmNsZWFuZWREYXRhW1RPVEFMX0ZPUk1fQ09VTlRdID4gdGhpcy5hYnNvbHV0ZU1heCkpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcignUGxlYXNlIHN1Ym1pdCAnICsgdGhpcy5tYXhOdW0gKyAnIG9yIGZld2VyIGZvcm1zLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvZGU6ICd0b29NYW55Rm9ybXMnfSlcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsaWRhdGVNaW4gJiYgdG90YWxGb3JtQ291bnQgLSBkZWxldGVkRm9ybUNvdW50IDwgdGhpcy5taW5OdW0pIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcignUGxlYXNlIHN1Ym1pdCAnICsgdGhpcy5taW5OdW0gKyAnIG9yIG1vcmUgZm9ybXMuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29kZTogJ3Rvb0Zld0Zvcm1zJ30pXG4gICAgfVxuICAgIC8vIEdpdmUgdGhpcy5jbGVhbigpIGEgY2hhbmNlIHRvIGRvIGNyb3NzLWZvcm0gdmFsaWRhdGlvbi5cbiAgICBpZiAodGhpcy5jbGVhbiAhPT0gbm9vcCkge1xuICAgICAgYXN5bmMgPSB0aGlzLl9ydW5DdXN0b21DbGVhbihDTEVBTl9WQUxJREFUSU9OLCB0aGlzLmNsZWFuKVxuICAgIH1cbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICB0aGlzLl9ub25Gb3JtRXJyb3JzID0gbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcihlLm1lc3NhZ2VzKCkpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXJyb3IgPSBlXG4gICAgfVxuICB9XG5cbiAgaWYgKCFhc3luYykge1xuICAgIHRoaXMuX2Zvcm1DbGVhbmVkKENMRUFOX1ZBTElEQVRJT04sIGVycm9yKVxuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgYSBjdXN0b20gY2xlYW5pbmcgbWV0aG9kLCBleHBlY3Rpbmcgc3luY2hyb25vdXMgb3IgYXN5bmNocm9ub3VzXG4gKiBiZWhhdmlvdXIsIGRlcGVuZGluZyBvbiBpdHMgYXJpdHkuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBhIG5hbWUgdG8gYXNzb2NpYXRlIHdpdGggdGhlIGNsZWFuaW5nIG1ldGhvZC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN1c3RvbUNsZWFuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNsZWFuaW5nIGlzIHJ1bm5pbmcgYXN5bmNocm9ub3VzbHksIGZhbHNlIGlmIGl0IGp1c3RcbiAqICAgcmFuIHN5bmNocm9ub3VzbHkuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fcnVuQ3VzdG9tQ2xlYW4gPSBmdW5jdGlvbihuYW1lLCBjdXN0b21DbGVhbikge1xuICAvLyBDaGVjayBhcml0eSB0byBzZWUgaWYgd2UgaGF2ZSBhIGNhbGxiYWNrIGluIHRoZSBmdW5jdGlvbiBzaWduYXR1cmVcbiAgaWYgKGN1c3RvbUNsZWFuLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIFN5bmNocm9ub3VzIHByb2Nlc3Npbmcgb25seSBleHBlY3RlZFxuICAgIGN1c3RvbUNsZWFuLmNhbGwodGhpcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGFzeW5jIGFuZCB0aGVyZSdzIG9uZSBwZW5kaW5nLCBwcmV2ZW50IGl0c1xuICAvLyBjYWxsYmFjayBmcm9tIGRvaW5nIGFueXRoaW5nLlxuICBpZiAodHlwZW9mIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bbmFtZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIG5hbWUpLmNhbmNlbCgpXG4gIH1cbiAgLy8gU2V0IHVwIGNhbGxiYWNrIGZvciBhc3luYyBwcm9jZXNzaW5nIC0gYXJndW1lbnRzIGZvciBhZGRFcnJvcigpXG4gIC8vIHNob3VsZCBiZSBwYXNzZWQgdmlhIHRoZSBjYWxsYmFjayBhcyBjYWxsaW5nIGl0IGRpcmVjdGx5IHByZXZlbnRzIHVzXG4gIC8vIGZyb20gY29tcGxldGVseSBpZ25vcmluZyB0aGUgY2FsbGJhY2sgaWYgdmFsaWRhdGlvbiBmaXJlcyBhZ2Fpbi5cbiAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZXJyLCB2YWxpZGF0aW9uRXJyb3IpIHtcbiAgICBpZiAodHlwZW9mIHZhbGlkYXRpb25FcnJvciAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5hZGRFcnJvcih2YWxpZGF0aW9uRXJyb3IpXG4gICAgfVxuICAgIHRoaXMuX2Zvcm1DbGVhbmVkKG5hbWUsIGVycilcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICB9LmJpbmQodGhpcylcblxuICAvLyBBbiBleHBsaWNpdCByZXR1cm4gdmFsdWUgb2YgZmFsc2UgaW5kaWNhdGVzIHRoYXQgYXN5bmMgcHJvY2Vzc2luZyBpc1xuICAvLyBiZWluZyBza2lwcGVkIChlLmcuIGJlY2F1c2Ugc3luYyBjaGVja3MgaW4gdGhlIG1ldGhvZCBmYWlsZWQgZmlyc3QpXG4gIHZhciByZXR1cm5WYWx1ZSA9IGN1c3RvbUNsZWFuLmNhbGwodGhpcywgY2FsbGJhY2spXG4gIGlmIChyZXR1cm5WYWx1ZSAhPT0gZmFsc2UpIHtcbiAgICAvLyBBc3luYyBwcm9jZXNzaW5nIGlzIGhhcHBlbmluZyEgTWFrZSB0aGUgY2FsbGJhY2sgY2FuY2VsbGFibGUgYW5kXG4gICAgLy8gaG9vayB1cCBhbnkgY3VzdG9tIG9uQ2FuY2VsIGhhbmRsaW5nIHByb3ZpZGVkLlxuICAgIGlmIChyZXR1cm5WYWx1ZSAmJiB0eXBlb2YgcmV0dXJuVmFsdWUub25DYW5jZWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sub25DYW5jZWwgPSByZXR1cm5WYWx1ZS5vbkNhbmNlbFxuICAgIH1cbiAgICB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW25hbWVdID0gdXRpbC5jYW5jZWxsYWJsZShjYWxsYmFjaylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fZmluaXNoZWRWYWxpZGF0aW9uID0gZnVuY3Rpb24oZXJyKSB7XG4gIGlmICghdGhpcy5pc0FzeW5jKCkpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gICAgLy8gU3luY2hyb25vdXMgZm9ybXNldCB2YWxpZGF0aW9uIHJlc3VsdHMgd2lsbCBiZSByZXR1cm5lZCB2aWEgdGhlIG9yaWdpbmFsXG4gICAgLy8gY2FsbCB3aGljaCB0cmlnZ2VyZWQgdmFsaWRhdGlvbi5cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXMuRnVuY3Rpb24odGhpcy5fb25WYWxpZGF0ZSkpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLl9vblZhbGlkYXRlXG4gICAgdGhpcy5fb25WYWxpZGF0ZSA9IG51bGxcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgIH1cbiAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZCgpXG4gICAgY2FsbGJhY2sobnVsbCwgaXNWYWxpZCwgaXNWYWxpZCA/IHRoaXMuY2xlYW5lZERhdGEoKSA6IG51bGwpXG4gIH1cbn1cblxuLyoqXG4gKiBDYW5jZWxzIGFueSBwZW5kaW5nIGFzeW5jIHZhbGlkYXRpb25zLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NhbmNlbFBlbmRpbmdPcGVyYXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIE9iamVjdC5rZXlzKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24pLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIGZpZWxkKS5jYW5jZWwoKVxuICB9LmJpbmQodGhpcykpXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZm9ybS5jbGVhbmVkRGF0YSBvYmplY3RzIGZvciBldmVyeSBmb3JtIGluIHRoaXMuZm9ybXMoKS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmNsZWFuZWREYXRhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmb3JtcyA9IHRoaXMuaW5pdGlhbEZvcm1zKClcbiAgLy8gRG9uJ3QgaW5jbHVkZSBlbXB0eSBvciBpbmNvbXBsZXRlIGV4dHJhIGZvcm1zXG4gIGZvcm1zLnB1c2guYXBwbHkoZm9ybXMsIHRoaXMuZXh0cmFGb3JtcygpLmZpbHRlcihmdW5jdGlvbihmb3JtKSB7XG4gICAgcmV0dXJuIGZvcm0uaGFzQ2hhbmdlZCgpICYmIGZvcm0uaXNDb21wbGV0ZSgpXG4gIH0pKVxuICByZXR1cm4gZm9ybXMubWFwKGZ1bmN0aW9uKGZvcm0pIHsgcmV0dXJuIGZvcm0uY2xlYW5lZERhdGEgfSlcbn1cblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBNdXRhYmlsaXR5ID09PVxuXG4vKipcbiAqIFNldHMgdGhlIGZvcm1zZXQncyBlbnRpcmUgaW5wdXQgZGF0YSwgYWxzbyB0cmlnZ2VyaW5nIHZhbGlkYXRpb24gYnkgZGVmYXVsdC5cbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IGRhdGEgbmV3IGlucHV0IGRhdGEgZm9yIGZvcm1zLCB3aGljaCBtdXN0IGJlXG4gKiAgIHByZWZpeGVkIGZvciB1bmlxdWVuZXNzLlxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZyxib29sZWFuPn0ga3dhcmdzIGRhdGEgc2V0dGluZyBvcHRpb25zLlxuICogQHJldHVybiB7Ym9vbGVhbn0gaWYgZGF0ZSBzZXR0aW5nIG9wdGlvbnMgaW5kaWNhdGUgdGhlIG5ldyBkYXRhIHNob3VsZCBiZVxuICogICB2YWxpZGF0ZWQsIHRydWUgaWYgdGhlIG5ldyBkYXRhIGlzIHZhbGlkLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuc2V0RGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHt2YWxpZGF0ZTogdHJ1ZSwgX3RyaWdnZXJTdGF0ZUNoYW5nZTogdHJ1ZX0sIGt3YXJncylcblxuICB0aGlzLmRhdGEgPSBkYXRhXG4gIHZhciBmb3JtRGF0YVNldHRpbmdPcHRpb25zID0ge1xuICAgIHByZWZpeGVkOiB0cnVlLCB2YWxpZGF0ZToga3dhcmdzLnZhbGlkYXRlLCBfdHJpZ2dlclN0YXRlQ2hhbmdlOiBmYWxzZVxuICB9XG4gIHRoaXMuZm9ybXMoKS5mb3JFYWNoKGZ1bmN0aW9uKGZvcm0pIHtcbiAgICBmb3JtLnNldERhdGEoZGF0YSwgZm9ybURhdGFTZXR0aW5nT3B0aW9ucylcbiAgfSlcblxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgaWYgKGt3YXJncy52YWxpZGF0ZSkge1xuICAgIHRoaXMuX2Vycm9ycyA9IG51bGxcbiAgICAvLyBUaGlzIGNhbGwgdWx0aW1hdGVseSB0cmlnZ2VycyBhIGZ1bGxDbGVhbigpIGJlY2F1c2UgX2Vycm9ycyBpcyBudWxsXG4gICAgdmFyIGlzVmFsaWQgPSB0aGlzLmlzVmFsaWQoKVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIFByZXZlbnQgdmFsaWRhdGlvbiBiZWluZyB0cmlnZ2VyZWQgaWYgZXJyb3JzKCkgaXMgYWNjZXNzZWQgZHVyaW5nIHJlbmRlclxuICAgIHRoaXMuX2Vycm9ycyA9IFtdXG4gICAgdGhpcy5fbm9uRm9ybUVycm9ycyA9IG5ldyB0aGlzLmVycm9yQ29uc3RydWN0b3IoKVxuICB9XG5cbiAgaWYgKGt3YXJncy5fdHJpZ2dlclN0YXRlQ2hhbmdlKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbiAgfVxuXG4gIGlmIChrd2FyZ3MudmFsaWRhdGUpIHtcbiAgICByZXR1cm4gaXNWYWxpZFxuICB9XG59XG5cbi8qKlxuICogQWxpYXMgdG8ga2VlcCB0aGUgRm9ybVNldCBkYXRhIHNldHRpbmcgQVBJIHRoZSBzYW1lIGFzIEZvcm0ncy5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLnNldEZvcm1EYXRhID0gQmFzZUZvcm1TZXQucHJvdG90eXBlLnNldERhdGFcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGb3JtcyA9PT1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBNYW5hZ2VtZW50Rm9ybSBpbnN0YW5jZSBmb3IgdGhpcyBGb3JtU2V0LlxuICogQGJyb3dzZXIgdGhlIGZvcm0gaXMgdW5ib3VuZCBhbmQgdXNlcyBpbml0aWFsIGRhdGEgZnJvbSB0aGlzIEZvcm1TZXQuXG4gKiBAc2VydmVyIHRoZSBmb3JtIGlzIGJvdW5kIHRvIHN1Ym1pdHRlZCBkYXRhLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUubWFuYWdlbWVudEZvcm0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZvcm1cbiAgaWYgKCFlbnYuYnJvd3NlciAmJiAhdGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICBmb3JtID0gbmV3IE1hbmFnZW1lbnRGb3JtKHtkYXRhOiB0aGlzLmRhdGEsIGF1dG9JZDogdGhpcy5hdXRvSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4OiB0aGlzLnByZWZpeH0pXG4gICAgaWYgKCFmb3JtLmlzVmFsaWQoKSkge1xuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKCdNYW5hZ2VtZW50Rm9ybSBkYXRhIGlzIG1pc3Npbmcgb3IgaGFzIGJlZW4gdGFtcGVyZWQgd2l0aCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvZGU6ICdtaXNzaW5nX21hbmFnZW1lbnRfZm9ybSd9KVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgaW5pdGlhbCA9IHt9XG4gICAgaW5pdGlhbFtUT1RBTF9GT1JNX0NPVU5UXSA9IHRoaXMudG90YWxGb3JtQ291bnQoKVxuICAgIGluaXRpYWxbSU5JVElBTF9GT1JNX0NPVU5UXSA9IHRoaXMuaW5pdGlhbEZvcm1Db3VudCgpXG4gICAgaW5pdGlhbFtNSU5fTlVNX0ZPUk1fQ09VTlRdID0gdGhpcy5taW5OdW1cbiAgICBpbml0aWFsW01BWF9OVU1fRk9STV9DT1VOVF0gPSB0aGlzLm1heE51bVxuICAgIGZvcm0gPSBuZXcgTWFuYWdlbWVudEZvcm0oe2F1dG9JZDogdGhpcy5hdXRvSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4OiB0aGlzLnByZWZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsOiBpbml0aWFsfSlcbiAgfVxuICBpZiAodGhpcy5tYW5hZ2VtZW50Rm9ybUNzc0NsYXNzICE9PSBudWxsKSB7XG4gICAgZm9ybS5oaWRkZW5GaWVsZFJvd0Nzc0NsYXNzID0gdGhpcy5tYW5hZ2VtZW50Rm9ybUNzc0NsYXNzXG4gIH1cbiAgcmV0dXJuIGZvcm1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBudW1iZXIgb2YgZm9ybSBpbnN0YW5jZXMgdGhpcyBmb3Jtc2V0IGNvbnRhaW5zLCBiYXNlZCBvblxuICogZWl0aGVyIHN1Ym1pdHRlZCBtYW5hZ2VtZW50IGRhdGEgb3IgaW5pdGlhbCBjb25maWd1cmF0aW9uLCBhcyBhcHByb3ByaWF0ZS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLnRvdGFsRm9ybUNvdW50ID0gZnVuY3Rpb24oKSB7XG4gIGlmICghZW52LmJyb3dzZXIgJiYgIXRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgLy8gUmV0dXJuIGFic29sdXRlTWF4IGlmIGl0IGlzIGxvd2VyIHRoYW4gdGhlIGFjdHVhbCB0b3RhbCBmb3JtIGNvdW50IGluXG4gICAgLy8gdGhlIGRhdGE7IHRoaXMgaXMgRG9TIHByb3RlY3Rpb24gdG8gcHJldmVudCBjbGllbnRzICBmcm9tIGZvcmNpbmcgdGhlXG4gICAgLy8gc2VydmVyIHRvIGluc3RhbnRpYXRlIGFyYml0cmFyeSBudW1iZXJzIG9mIGZvcm1zLlxuICAgIHJldHVybiBNYXRoLm1pbih0aGlzLm1hbmFnZW1lbnRGb3JtKCkuY2xlYW5lZERhdGFbVE9UQUxfRk9STV9DT1VOVF0sIHRoaXMuYWJzb2x1dGVNYXgpXG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIGluaXRpYWxGb3JtcyA9IHRoaXMuaW5pdGlhbEZvcm1Db3VudCgpXG4gICAgdmFyIHRvdGFsRm9ybXMgPSB0aGlzLmluaXRpYWxGb3JtQ291bnQoKSArIHRoaXMuZXh0cmFcbiAgICAvLyBBbGxvdyBhbGwgZXhpc3RpbmcgcmVsYXRlZCBvYmplY3RzL2lubGluZXMgdG8gYmUgZGlzcGxheWVkLCBidXQgZG9uJ3RcbiAgICAvLyBhbGxvdyBleHRyYSBiZXlvbmQgbWF4X251bS5cbiAgICBpZiAodGhpcy5tYXhOdW0gIT09IG51bGwgJiZcbiAgICAgICAgaW5pdGlhbEZvcm1zID4gdGhpcy5tYXhOdW0gJiZcbiAgICAgICAgdGhpcy5tYXhOdW0gPj0gMCkge1xuICAgICAgdG90YWxGb3JtcyA9IGluaXRpYWxGb3Jtc1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXhOdW0gIT09IG51bGwgJiZcbiAgICAgICAgdG90YWxGb3JtcyA+IHRoaXMubWF4TnVtICYmXG4gICAgICAgIHRoaXMubWF4TnVtID49IDApIHtcbiAgICAgIHRvdGFsRm9ybXMgPSB0aGlzLm1heE51bVxuICAgIH1cbiAgICByZXR1cm4gdG90YWxGb3Jtc1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbnVtYmVyIG9mIGluaXRpYWwgZm9ybSBpbnN0YW5jZXMgdGhpcyBmb3Jtc2V0IGNvbnRhaW5zLCBiYXNlZFxuICogb24gZWl0aGVyIHN1Ym1pdHRlZCBtYW5hZ2VtZW50IGRhdGEgb3IgaW5pdGlhbCBjb25maWd1cmF0aW9uLCBhcyBhcHByb3ByaWF0ZS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmluaXRpYWxGb3JtQ291bnQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCFlbnYuYnJvd3NlciAmJiAhdGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICByZXR1cm4gdGhpcy5tYW5hZ2VtZW50Rm9ybSgpLmNsZWFuZWREYXRhW0lOSVRJQUxfRk9STV9DT1VOVF1cbiAgfVxuICBlbHNlIHtcbiAgICAvLyBVc2UgdGhlIGxlbmd0aCBvZiB0aGUgaW5pdGlhbCBkYXRhIGlmIGl0J3MgdGhlcmUsIDAgb3RoZXJ3aXNlLlxuICAgIHJldHVybiAodGhpcy5pbml0aWFsICE9PSBudWxsICYmIHRoaXMuaW5pdGlhbC5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuaW5pdGlhbC5sZW5ndGhcbiAgICAgICAgICAgIDogMClcbiAgfVxufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBmb3JtcyB3aGVuIGZpcnN0IGFjY2Vzc2VkLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuZm9ybXMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX2Zvcm1zICE9PSBudWxsKSB7IHJldHVybiB0aGlzLl9mb3JtcyB9XG4gIHZhciBmb3JtcyA9IFtdXG4gIHZhciB0b3RhbEZvcm1Db3VudCA9IHRoaXMudG90YWxGb3JtQ291bnQoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRvdGFsRm9ybUNvdW50OyBpKyspIHtcbiAgICBmb3Jtcy5wdXNoKHRoaXMuX2NvbnN0cnVjdEZvcm0oaSkpXG4gIH1cbiAgdGhpcy5fZm9ybXMgPSBmb3Jtc1xuICByZXR1cm4gZm9ybXNcbn1cblxuLyoqXG4gKiBBZGRzIGFub3RoZXIgZm9ybSBhbmQgaW5jcmVtZW50cyBleHRyYS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmFkZEFub3RoZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGN1cnJlbnRGb3JtQ291bnQgPSB0aGlzLnRvdGFsRm9ybUNvdW50KClcbiAgdGhpcy5leHRyYSsrXG4gIGlmICh0aGlzLl9mb3JtcyAhPT0gbnVsbCkge1xuICAgIHRoaXMuX2Zvcm1zW2N1cnJlbnRGb3JtQ291bnRdID0gdGhpcy5fY29uc3RydWN0Rm9ybShjdXJyZW50Rm9ybUNvdW50KVxuICB9XG4gdGhpcy5fc3RhdGVDaGFuZ2VkKClcbn1cblxuLy8gQXNzdW1wdGlvbiAtIHRoZSBVSSB3aWxsIG9ubHkgbGV0IHRoZSB1c2VyIHJlbW92ZSBleHRyYSBmb3Jtc1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLnJlbW92ZUZvcm0gPSBmdW5jdGlvbihpbmRleCkge1xuICBpZiAodGhpcy5leHRyYSA9PT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHJlbW92ZSBhIGZvcm0gd2hlbiB0aGVyZSBhcmUgbm8gZXh0cmEgZm9ybXNcIilcbiAgfVxuICB0aGlzLmV4dHJhLS1cbiAgaWYgKHRoaXMuX2Zvcm1zICE9PSBudWxsKSB7XG4gICAgdGhpcy5fZm9ybXMuc3BsaWNlKGluZGV4LCAxKVxuICB9XG4gIGlmICh0aGlzLl9lcnJvcnMgIT09IG51bGwpIHtcbiAgICB0aGlzLl9lcnJvcnMuc3BsaWNlKGluZGV4LCAxKVxuICB9XG4gdGhpcy5fc3RhdGVDaGFuZ2VkKClcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIHJldHVybnMgdGhlIGl0aCBmb3JtIGluc3RhbmNlIGluIHRoZSBmb3Jtc2V0LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NvbnN0cnVjdEZvcm0gPSBmdW5jdGlvbihpKSB7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBhdXRvSWQ6IHRoaXMuYXV0b0lkXG4gICwgcHJlZml4OiB0aGlzLmFkZFByZWZpeChpKVxuICAsIGVycm9yQ29uc3RydWN0b3I6IHRoaXMuZXJyb3JDb25zdHJ1Y3RvclxuICAsIHZhbGlkYXRpb246IHRoaXMudmFsaWRhdGlvblxuICAsIGNvbnRyb2xsZWQ6IHRoaXMuY29udHJvbGxlZFxuICAsIG9uQ2hhbmdlOiB0aGlzLm9uQ2hhbmdlXG4gIH1cbiAgaWYgKCF0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIGRlZmF1bHRzLmRhdGEgPSB0aGlzLmRhdGFcbiAgICBkZWZhdWx0cy5maWxlcyA9IHRoaXMuZmlsZXNcbiAgfVxuICBpZiAodGhpcy5pbml0aWFsICE9PSBudWxsICYmIHRoaXMuaW5pdGlhbC5sZW5ndGggPiAwKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmluaXRpYWxbaV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGRlZmF1bHRzLmluaXRpYWwgPSB0aGlzLmluaXRpYWxbaV1cbiAgICB9XG4gIH1cbiAgLy8gQWxsb3cgZXh0cmEgZm9ybXMgdG8gYmUgZW1wdHlcbiAgaWYgKGkgPj0gdGhpcy5pbml0aWFsRm9ybUNvdW50KCkpIHtcbiAgICBkZWZhdWx0cy5lbXB0eVBlcm1pdHRlZCA9IHRydWVcbiAgfVxuXG4gIHZhciBmb3JtID0gbmV3IHRoaXMuZm9ybShkZWZhdWx0cylcbiAgdGhpcy5hZGRGaWVsZHMoZm9ybSwgaSlcbiAgcmV0dXJuIGZvcm1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGluaXRpYWwgZm9ybXMgaW4gdGhpcyBmb3Jtc2V0LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuaW5pdGlhbEZvcm1zID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZvcm1zKCkuc2xpY2UoMCwgdGhpcy5pbml0aWFsRm9ybUNvdW50KCkpXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBleHRyYSBmb3JtcyBpbiB0aGlzIGZvcm1zZXQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5leHRyYUZvcm1zID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZvcm1zKCkuc2xpY2UodGhpcy5pbml0aWFsRm9ybUNvdW50KCkpXG59XG5cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5lbXB0eUZvcm0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGt3YXJncyA9IHtcbiAgICBhdXRvSWQ6IHRoaXMuYXV0b0lkLFxuICAgIHByZWZpeDogdGhpcy5hZGRQcmVmaXgoJ19fcHJlZml4X18nKSxcbiAgICBlbXB0eVBlcm1pdHRlZDogdHJ1ZVxuICB9XG4gIHZhciBmb3JtID0gbmV3IHRoaXMuZm9ybShrd2FyZ3MpXG4gIHRoaXMuYWRkRmllbGRzKGZvcm0sIG51bGwpXG4gIHJldHVybiBmb3JtXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZm9ybXMgdGhhdCBoYXZlIGJlZW4gbWFya2VkIGZvciBkZWxldGlvbi5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmRlbGV0ZWRGb3JtcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuaXNWYWxpZCgpIHx8ICF0aGlzLmNhbkRlbGV0ZSkgeyByZXR1cm4gW10gfVxuXG4gIHZhciBmb3JtcyA9IHRoaXMuZm9ybXMoKVxuXG4gIC8vIENvbnN0cnVjdCBfZGVsZXRlZEZvcm1JbmRleGVzLCB3aGljaCBpcyBqdXN0IGEgbGlzdCBvZiBmb3JtIGluZGV4ZXNcbiAgLy8gdGhhdCBoYXZlIGhhZCB0aGVpciBkZWxldGlvbiB3aWRnZXQgc2V0IHRvIHRydWUuXG4gIGlmICh0eXBlb2YgdGhpcy5fZGVsZXRlZEZvcm1JbmRleGVzID09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5fZGVsZXRlZEZvcm1JbmRleGVzID0gW11cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGZvcm1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGZvcm0gPSBmb3Jtc1tpXVxuICAgICAgLy8gSWYgdGhpcyBpcyBhbiBleHRyYSBmb3JtIGFuZCBoYXNuJ3QgY2hhbmdlZCwgaWdub3JlIGl0XG4gICAgICBpZiAoaSA+PSB0aGlzLmluaXRpYWxGb3JtQ291bnQoKSAmJiAhZm9ybS5oYXNDaGFuZ2VkKCkpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9zaG91bGREZWxldGVGb3JtKGZvcm0pKSB7XG4gICAgICAgIHRoaXMuX2RlbGV0ZWRGb3JtSW5kZXhlcy5wdXNoKGkpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuX2RlbGV0ZWRGb3JtSW5kZXhlcy5tYXAoZnVuY3Rpb24oaSkgeyByZXR1cm4gZm9ybXNbaV0gfSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBmb3JtcyBpbiB0aGUgb3JkZXIgc3BlY2lmaWVkIGJ5IHRoZSBpbmNvbWluZyBkYXRhLlxuICogVGhyb3dzIGFuIEVycm9yIGlmIG9yZGVyaW5nIGlzIG5vdCBhbGxvd2VkLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUub3JkZXJlZEZvcm1zID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5pc1ZhbGlkKCkgfHwgIXRoaXMuY2FuT3JkZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5jb25zdHJ1Y3Rvci5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgXCIgb2JqZWN0IGhhcyBubyBhdHRyaWJ1dGUgJ29yZGVyZWRGb3JtcydcIilcbiAgfVxuXG4gIHZhciBmb3JtcyA9IHRoaXMuZm9ybXMoKVxuXG4gIC8vIENvbnN0cnVjdCBfb3JkZXJpbmcsIHdoaWNoIGlzIGEgbGlzdCBvZiBbZm9ybSBpbmRleCwgb3JkZXJGaWVsZFZhbHVlXVxuICAvLyBwYWlycy4gQWZ0ZXIgY29uc3RydWN0aW5nIHRoaXMgbGlzdCwgd2UnbGwgc29ydCBpdCBieSBvcmRlckZpZWxkVmFsdWVcbiAgLy8gc28gd2UgaGF2ZSBhIHdheSB0byBnZXQgdG8gdGhlIGZvcm0gaW5kZXhlcyBpbiB0aGUgb3JkZXIgc3BlY2lmaWVkIGJ5XG4gIC8vIHRoZSBmb3JtIGRhdGEuXG4gIGlmICh0eXBlb2YgdGhpcy5fb3JkZXJpbmcgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLl9vcmRlcmluZyA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmb3Jtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBmb3JtID0gZm9ybXNbaV1cbiAgICAgIC8vIElmIHRoaXMgaXMgYW4gZXh0cmEgZm9ybSBhbmQgaGFzbid0IGNoYW5nZWQsIGlnbm9yZSBpdFxuICAgICAgaWYgKGkgPj0gdGhpcy5pbml0aWFsRm9ybUNvdW50KCkgJiYgIWZvcm0uaGFzQ2hhbmdlZCgpKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICAvLyBEb24ndCBhZGQgZGF0YSBtYXJrZWQgZm9yIGRlbGV0aW9uXG4gICAgICBpZiAodGhpcy5jYW5EZWxldGUgJiYgdGhpcy5fc2hvdWxkRGVsZXRlRm9ybShmb3JtKSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgdGhpcy5fb3JkZXJpbmcucHVzaChbaSwgZm9ybS5jbGVhbmVkRGF0YVtPUkRFUklOR19GSUVMRF9OQU1FXV0pXG4gICAgfVxuXG4gICAgLy8gTnVsbCBzaG91bGQgYmUgc29ydGVkIGJlbG93IGFueXRoaW5nIGVsc2UuIEFsbG93aW5nIG51bGwgYXMgYVxuICAgIC8vIGNvbXBhcmlzb24gdmFsdWUgbWFrZXMgaXQgc28gd2UgY2FuIGxlYXZlIG9yZGVyaW5nIGZpZWxkcyBibGFuay5cbiAgICB0aGlzLl9vcmRlcmluZy5zb3J0KGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIGlmICh4WzFdID09PSBudWxsICYmIHlbMV0gPT09IG51bGwpIHtcbiAgICAgICAgLy8gU29ydCBieSBmb3JtIGluZGV4IGlmIGJvdGggb3JkZXIgZmllbGQgdmFsdWVzIGFyZSBudWxsXG4gICAgICAgIHJldHVybiB4WzBdIC0geVswXVxuICAgICAgfVxuICAgICAgaWYgKHhbMV0gPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIDFcbiAgICAgIH1cbiAgICAgIGlmICh5WzFdID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgcmV0dXJuIHhbMV0gLSB5WzFdXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB0aGlzLl9vcmRlcmluZy5tYXAoZnVuY3Rpb24ob3JkZXJpbmcpIHsgcmV0dXJuIGZvcm1zW29yZGVyaW5nWzBdXX0pXG59XG5cbi8qKlxuICogQSBob29rIGZvciBhZGRpbmcgZXh0cmEgZmllbGRzIG9uIHRvIGVhY2ggZm9ybSBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7Rm9ybX0gZm9ybSB0aGUgZm9ybSBmaWVsZHMgYXJlIHRvIGJlIGFkZGVkIHRvLlxuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IHRoZSBpbmRleCBvZiB0aGUgZ2l2ZW4gZm9ybSBpbiB0aGUgZm9ybXNldC5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmFkZEZpZWxkcyA9IGZ1bmN0aW9uKGZvcm0sIGluZGV4KSB7XG4gIGlmICh0aGlzLmNhbk9yZGVyKSB7XG4gICAgLy8gT25seSBwcmUtZmlsbCB0aGUgb3JkZXJpbmcgZmllbGQgZm9yIGluaXRpYWwgZm9ybXNcbiAgICBpZiAoaW5kZXggIT0gbnVsbCAmJiBpbmRleCA8IHRoaXMuaW5pdGlhbEZvcm1Db3VudCgpKSB7XG4gICAgICBmb3JtLmZpZWxkc1tPUkRFUklOR19GSUVMRF9OQU1FXSA9XG4gICAgICAgICAgSW50ZWdlckZpZWxkKHtsYWJlbDogJ09yZGVyJywgaW5pdGlhbDogaW5kZXggKyAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmb3JtLmZpZWxkc1tPUkRFUklOR19GSUVMRF9OQU1FXSA9XG4gICAgICAgICAgSW50ZWdlckZpZWxkKHtsYWJlbDogJ09yZGVyJywgcmVxdWlyZWQ6IGZhbHNlfSlcbiAgICB9XG4gIH1cbiAgaWYgKHRoaXMuY2FuRGVsZXRlKSB7XG4gICAgZm9ybS5maWVsZHNbREVMRVRJT05fRklFTERfTkFNRV0gPVxuICAgICAgICBCb29sZWFuRmllbGQoe2xhYmVsOiAnRGVsZXRlJywgcmVxdWlyZWQ6IGZhbHNlfSlcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGZvcm0gd2FzIG1hcmtlZCBmb3IgZGVsZXRpb24uXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fc2hvdWxkRGVsZXRlRm9ybSA9IGZ1bmN0aW9uKGZvcm0pIHtcbiAgcmV0dXJuIG9iamVjdC5nZXQoZm9ybS5jbGVhbmVkRGF0YSwgREVMRVRJT05fRklFTERfTkFNRSwgZmFsc2UpXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBFcnJvcnMgPT09XG5cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5hZGRFcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gIGlmICghKGVycm9yIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkge1xuICAgIC8vIE5vcm1hbGlzZSB0byBWYWxpZGF0aW9uRXJyb3IgYW5kIGxldCBpdHMgY29uc3RydWN0b3IgZG8gdGhlIGhhcmQgd29yayBvZlxuICAgIC8vIG1ha2luZyBzZW5zZSBvZiB0aGUgaW5wdXQuXG4gICAgZXJyb3IgPSBWYWxpZGF0aW9uRXJyb3IoZXJyb3IpXG4gIH1cblxuICB0aGlzLl9ub25Gb3JtRXJyb3JzLmV4dGVuZChlcnJvci5lcnJvckxpc3QpXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZm9ybS5lcnJvcnMgZm9yIGV2ZXJ5IGZvcm0gaW4gdGhpcy5mb3Jtcy5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmVycm9ycyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fZXJyb3JzID09PSBudWxsKSB7XG4gICAgdGhpcy5mdWxsQ2xlYW4oKVxuICB9XG4gIHJldHVybiB0aGlzLl9lcnJvcnNcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIEVycm9yTGlzdCBvZiBlcnJvcnMgdGhhdCBhcmVuJ3QgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhclxuICogZm9ybSAtLSBpLmUuLCBmcm9tIGZvcm1zZXQuY2xlYW4oKS4gUmV0dXJucyBhbiBlbXB0eSBFcnJvckxpc3QgaWYgdGhlcmUgYXJlXG4gKiBub25lLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUubm9uRm9ybUVycm9ycyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fbm9uRm9ybUVycm9ycyA9PT0gbnVsbCkge1xuICAgIHRoaXMuZnVsbENsZWFuKClcbiAgfVxuICByZXR1cm4gdGhpcy5fbm9uRm9ybUVycm9yc1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiBlcnJvcnMgYWNyb3NzIGFsbCBmb3JtcyBpbiB0aGUgZm9ybXNldC5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLnRvdGFsRXJyb3JDb3VudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHRoaXMubm9uRm9ybUVycm9ycygpLmxlbmd0aCgpICtcbiAgICAgICAgICB0aGlzLmVycm9ycygpLnJlZHVjZShmdW5jdGlvbihzdW0sIGZvcm1FcnJvcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBzdW0gKyBmb3JtRXJyb3JzLmxlbmd0aCgpXG4gICAgICAgICAgfSwgMCkpXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBTdGF0dXMgPT09XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGFueSBmb3JtIGRpZmZlcnMgZnJvbSBpbml0aWFsLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuaGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZm9ybXMgPSB0aGlzLmZvcm1zKClcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmb3Jtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoZm9ybXNbaV0uaGFzQ2hhbmdlZCgpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3Jtc2V0IG5lZWRzIGEgY2FsbGJhY2sgYXJndW1lbnQgZm9yIGZpbmFsXG4gKiAgIHZhbGlkYXRpb24uXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5pc0FzeW5jID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5jbGVhbi5sZW5ndGggPT0gMSB8fCBmb3Jtcy5pc0Zvcm1Bc3luYyh0aGlzLmZvcm0pKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZvcm1zZXQgbmVlZHMgdG8gYmUgbXVsdGlwYXJ0LWVuY29kZWQsIGkuZS4gaXRcbiAqIGhhcyBhIEZpbGVJbnB1dC4gT3RoZXJ3aXNlLCBmYWxzZS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmlzTXVsdGlwYXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5mb3JtcygpLmxlbmd0aCA+IDAgJiYgdGhpcy5mb3JtcygpWzBdLmlzTXVsdGlwYXJ0KCkpXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZm9ybXNldCBpcyB3YWl0aW5nIGZvciBhc3luYyB2YWxpZGF0aW9uIHRvXG4gKiAgIGNvbXBsZXRlLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhaXMuRW1wdHkodGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbilcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgZXZlcnkgZm9ybSBpbiB0aGlzLmZvcm1zKCkgaXMgdmFsaWQgYW5kIHRoZXJlIGFyZSBubyBub24tZm9ybVxuICogZXJyb3JzLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICAvLyBUcmlnZ2VycyBhIGZ1bGwgY2xlYW5cbiAgdmFyIGVycm9ycyA9IHRoaXMuZXJyb3JzKClcbiAgdmFyIGZvcm1zID0gdGhpcy5mb3JtcygpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZXJyb3JzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICBpZiAoZXJyb3JzW2ldLmlzUG9wdWxhdGVkKCkpIHtcbiAgICAgIGlmICh0aGlzLmNhbkRlbGV0ZSAmJiB0aGlzLl9zaG91bGREZWxldGVGb3JtKGZvcm1zW2ldKSkge1xuICAgICAgICAvLyBUaGlzIGZvcm0gaXMgZ29pbmcgdG8gYmUgZGVsZXRlZCBzbyBhbnkgb2YgaXRzIGVycm9ycyBzaG91bGRcbiAgICAgICAgLy8gbm90IGNhdXNlIHRoZSBlbnRpcmUgZm9ybXNldCB0byBiZSBpbnZhbGlkLlxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiAhdGhpcy5ub25Gb3JtRXJyb3JzKCkuaXNQb3B1bGF0ZWQoKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZvcm1zZXQgaXMgd2FpdGluZyBmb3IgYXN5bmMgdmFsaWRhdGlvbiBvZiBpdHNcbiAqICAgY2xlYW4oKSBtZXRob2QgdG8gY29tcGxldGUuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5ub25Gb3JtUGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHlwZW9mIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bQ0xFQU5fVkFMSURBVElPTl0gIT0gJ3VuZGVmaW5lZCdcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBQcmVmaXhlcyA9PT1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmb3Jtc2V0IHByZWZpeCB3aXRoIHRoZSBmb3JtIGluZGV4IGFwcGVuZGVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4IHRoZSBpbmRleCBvZiBhIGZvcm0gaW4gdGhlIGZvcm1zZXQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5hZGRQcmVmaXggPSBmdW5jdGlvbihpbmRleCkge1xuICByZXR1cm4gdGhpcy5wcmVmaXggKyAnLScgKyBpbmRleFxufVxuXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuZ2V0RGVmYXVsdFByZWZpeCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ2Zvcm0nXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRGVmYXVsdCBSZW5kZXJpbmcgPT09XG5cbi8qKlxuICogRGVmYXVsdCByZW5kZXIgbWV0aG9kLCB3aGljaCBqdXN0IGNhbGxzIGFzVGFibGUoKS5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmFzVGFibGUoKVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZvcm1zZXQgYXMgPHRyPnMgLSBleGNsdWRpbmcgdGhlIDx0YWJsZT4uXG4gKiBAcmV0dXJuIHtBcnJheS48UmVhY3RFbGVtZW50Pn1cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmFzVGFibGUgPSBmdW5jdGlvbigpIHtcbiAgLy8gWFhYOiB0aGVyZSBpcyBubyBzZW1hbnRpYyBkaXZpc2lvbiBiZXR3ZWVuIGZvcm1zIGhlcmUsIHRoZXJlIHByb2JhYmx5XG4gIC8vIHNob3VsZCBiZS4gSXQgbWlnaHQgbWFrZSBzZW5zZSB0byByZW5kZXIgZWFjaCBmb3JtIGFzIGEgdGFibGUgcm93IHdpdGhcbiAgLy8gZWFjaCBmaWVsZCBhcyBhIHRkLlxuICB2YXIgcm93cyA9IHRoaXMubWFuYWdlbWVudEZvcm0oKS5hc1RhYmxlKClcbiAgdGhpcy5mb3JtcygpLmZvckVhY2goZnVuY3Rpb24oZm9ybSkgeyByb3dzID0gcm93cy5jb25jYXQoZm9ybS5hc1RhYmxlKCkpIH0pXG4gIGlmICh0aGlzLm5vbkZvcm1QZW5kaW5nKCkpIHtcbiAgICByb3dzLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudCgndHInLCB7a2V5OiAnX19wZW5kaW5nX18nfVxuICAgICwgUmVhY3QuY3JlYXRlRWxlbWVudCgndGQnLCB7Y29sU3BhbjogMn1cbiAgICAgICwgUmVhY3QuY3JlYXRlRWxlbWVudCgncHJvZ3Jlc3MnLCBudWxsLCAnLi4uJylcbiAgICAgIClcbiAgICApKVxuICB9XG4gIHJldHVybiByb3dzXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZm9ybXNldCBhcyA8ZGl2PnMuXG4gKiBAcmV0dXJuIHtBcnJheS48UmVhY3RFbGVtZW50Pn1cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmFzRGl2ID0gZnVuY3Rpb24oKSB7XG4gIHZhciByb3dzID0gdGhpcy5tYW5hZ2VtZW50Rm9ybSgpLmFzRGl2KClcbiAgdGhpcy5mb3JtcygpLmZvckVhY2goZnVuY3Rpb24oZm9ybSkgeyByb3dzID0gcm93cy5jb25jYXQoZm9ybS5hc0RpdigpKSB9KVxuICBpZiAodGhpcy5ub25Gb3JtUGVuZGluZygpKSB7XG4gICAgcm93cy5wdXNoKFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtrZXk6ICdfX3BlbmRpbmdfXyd9XG4gICAgLCBSZWFjdC5jcmVhdGVFbGVtZW50KCdwcm9ncmVzcycsIG51bGwsICcuLi4nKVxuICAgICkpXG4gIH1cbiAgcmV0dXJuIHJvd3Ncbn1cblxudmFyIGZvcm1zZXRQcm9wcyA9IHtcbiAgYXV0b0lkOiB1dGlsLmF1dG9JZENoZWNrZXJcbiwgY29udHJvbGxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiwgZGF0YTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuLCBlcnJvckNvbnN0cnVjdG9yOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuLCBmaWxlczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuLCBpbml0aWFsOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG4sIG9uQ2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuLCBwcmVmaXg6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiwgdmFsaWRhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICAsIFJlYWN0LlByb3BUeXBlcy5vYmplY3RcbiAgXSlcbn1cblxudmFyIGZvcm1zZXRGYWN0b3J5UHJvcHMgPSB7XG4gIGNhbkRlbGV0ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiwgY2FuT3JkZXI6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4sIGV4dHJhOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4sIGZvcm1zZXQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4sIG1heE51bTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuLCBtaW5OdW06IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiwgdmFsaWRhdGVNYXg6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4sIHZhbGlkYXRlTWluOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBGb3Jtc2V0LiBBIGZvcm1zZXQgaW5zdGFuY2Ugb3IgY29uc3RydWN0b3IgY2FuIGJlIGdpdmVuLiBJZiBhXG4gKiBjb25zdHJ1Y3RvciBpcyBnaXZlbiwgYW4gaW5zdGFuY2Ugd2lsbCBiZSBjcmVhdGVkIHdoZW4gdGhlIGNvbXBvbmVudCBpc1xuICogbW91bnRlZCwgYW5kIGFueSBhZGRpdGlvbmFsIHByb3BzIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvciBhc1xuICogb3B0aW9ucy5cbiAqL1xudmFyIFJlbmRlckZvcm1TZXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGRpc3BsYXlOYW1lOiAnUmVuZGVyRm9ybVNldCcsXG4gIHByb3BUeXBlczogb2JqZWN0LmV4dGVuZCh7fSwgZm9ybXNldEZhY3RvcnlQcm9wcywgZm9ybXNldFByb3BzLCB7XG4gICAgY2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nICAgICAgICAgLy8gQ2xhc3MgZm9yIHRoZSBjb21wb25lbnQgd3JhcHBpbmcgYWxsIGZvcm1zXG4gICwgY29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55ICAgICAgICAgICAgLy8gQ29tcG9uZW50IHRvIHdyYXAgYWxsIGZvcm1zXG4gICwgZm9ybUNvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLmFueSAgICAgICAgLy8gQ29tcG9uZW50IHRvIHdyYXAgZWFjaCBmb3JtXG4gICwgZm9ybTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMgICAgICAgICAgICAgICAgLy8gRm9ybSBjb25zdHJ1Y3RvclxuICAsIGZvcm1zZXQ6IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoWyAgICAgIC8vIEZvcm1zZXQgaW5zdGFuY2Ugb3IgY29uc3RydWN0b3JcbiAgICAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgICAgUmVhY3QuUHJvcFR5cGVzLmluc3RhbmNlT2YoQmFzZUZvcm1TZXQpXG4gICAgXSlcbiAgLCByb3c6IFJlYWN0LlByb3BUeXBlcy5hbnkgICAgICAgICAgICAgICAgICAvLyBDb21wb25lbnQgdG8gcmVuZGVyIGZvcm0gcm93c1xuICAsIHJvd0NvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLmFueSAgICAgICAgIC8vIENvbXBvbmVudCB0byB3cmFwIGVhY2ggZm9ybSByb3dcbiAgLCB1c2VNYW5hZ2VtZW50Rm9ybTogUmVhY3QuUHJvcFR5cGVzLmJvb2wgICAvLyBTaG91bGQgTWFuYWdlbWVudEZvcm0gaGlkZGVuIGZpZWxkcyBiZSByZW5kZXJlZD9cbiAgLCBfX2FsbF9fOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgaWYgKCFwcm9wcy5mb3JtICYmICFwcm9wcy5mb3Jtc2V0KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0ludmFsaWQgcHJvcHMgc3VwcGxpZWQgdG8gYFJlbmRlckZvcm1TZXRgLCBlaXRoZXIgYGZvcm1gIG9yICcgK1xuICAgICAgICAgICdgZm9ybXNldGAgbXVzdCBiZSBzcGVjaWZpZWQuJ1xuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9KSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnQ6ICdkaXYnXG4gICAgLCBmb3JtQ29tcG9uZW50OiAnZGl2J1xuICAgICwgcm93OiBmb3Jtcy5Gb3JtUm93XG4gICAgLCByb3dDb21wb25lbnQ6ICdkaXYnXG4gICAgLCB1c2VNYW5hZ2VtZW50Rm9ybTogZmFsc2VcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9ybXNldCA9IHRoaXMucHJvcHMuZm9ybXNldFxuICAgIC8vIENyZWF0ZSBhIG5ldyBGb3JtU2V0IGNvbnN0cnVjdG9yIGlmIGEgRm9ybSBjb25zdHJ1Y3RvciB3YXMgZ2l2ZW5cbiAgICBpZiAodGhpcy5wcm9wcy5mb3JtKSB7XG4gICAgICBmb3Jtc2V0ID0gZm9ybXNldEZhY3RvcnkodGhpcy5wcm9wcy5mb3JtLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0aWwuZ2V0UHJvcHModGhpcy5wcm9wcywgT2JqZWN0LmtleXMoZm9ybXNldEZhY3RvcnlQcm9wcykpKVxuICAgIH1cbiAgICBpZiAoZm9ybXNldCBpbnN0YW5jZW9mIEJhc2VGb3JtU2V0KSB7XG4gICAgICB0aGlzLmZvcm1zZXQgPSBmb3Jtc2V0XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5mb3Jtc2V0ID0gbmV3IGZvcm1zZXQob2JqZWN0LmV4dGVuZCh7XG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLmZvcmNlVXBkYXRlLmJpbmQodGhpcylcbiAgICAgIH0sIHV0aWwuZ2V0UHJvcHModGhpcy5wcm9wcywgT2JqZWN0LmtleXMoZm9ybXNldFByb3BzKSkpKVxuICAgIH1cbiAgfSxcblxuICBnZXRGb3Jtc2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5mb3Jtc2V0XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9ybXNldCA9IHRoaXMuZm9ybXNldFxuICAgIHZhciBwcm9wcyA9IHRoaXMucHJvcHNcbiAgICB2YXIgYXR0cnMgPSB7fVxuICAgIGlmICh0aGlzLnByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgYXR0cnMuY2xhc3NOYW1lID0gcHJvcHMuY2xhc3NOYW1lXG4gICAgfVxuICAgIHZhciB0b3BFcnJvcnMgPSBmb3Jtc2V0Lm5vbkZvcm1FcnJvcnMoKVxuXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQocHJvcHMuY29tcG9uZW50LCBhdHRycyxcbiAgICAgIHRvcEVycm9ycy5pc1BvcHVsYXRlZCgpICYmIFJlYWN0LmNyZWF0ZUVsZW1lbnQocHJvcHMucm93LCB7XG4gICAgICAgIGNsYXNzTmFtZTogZm9ybXNldC5lcnJvckNzc0NsYXNzXG4gICAgICAsIGNvbnRlbnQ6IHRvcEVycm9ycy5yZW5kZXIoKVxuICAgICAgLCBrZXk6IGZvcm1zZXQuYWRkUHJlZml4KCdfX2FsbF9fJylcbiAgICAgICwgcm93Q29tcG9uZW50OiBwcm9wcy5yb3dDb21wb25lbnRcbiAgICAgIH0pLFxuICAgICAgZm9ybXNldC5mb3JtcygpLm1hcChmdW5jdGlvbihmb3JtKSB7XG4gICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KGZvcm1zLlJlbmRlckZvcm0sIHtcbiAgICAgICAgICBmb3JtOiBmb3JtXG4gICAgICAgICwgZm9ybUNvbXBvbmVudDogcHJvcHMuZm9ybUNvbXBvbmVudFxuICAgICAgICAsIHJvdzogcHJvcHMucm93XG4gICAgICAgICwgcm93Q29tcG9uZW50OiBwcm9wcy5yb3dDb21wb25lbnRcbiAgICAgICAgfSlcbiAgICAgIH0pLFxuICAgICAgZm9ybXNldC5ub25Gb3JtUGVuZGluZygpICYmIFJlYWN0LmNyZWF0ZUVsZW1lbnQocHJvcHMucm93LCB7XG4gICAgICAgIGNsYXNzTmFtZTogZm9ybXNldC5wZW5kaW5nUm93Q3NzQ2xhc3NcbiAgICAgICwgY29udGVudDogUmVhY3QuY3JlYXRlRWxlbWVudCgncHJvZ3Jlc3MnLCBudWxsLCAnVmFsaWRhdGluZy4uLicpXG4gICAgICAsIGtleTogZm9ybXNldC5hZGRQcmVmaXgoJ19fcGVuZGluZ19fJylcbiAgICAgICwgcm93Q29tcG9uZW50OiBwcm9wcy5yb3dDb21wb25lbnRcbiAgICAgIH0pLFxuICAgICAgcHJvcHMudXNlTWFuYWdlbWVudEZvcm0gJiYgUmVhY3QuY3JlYXRlRWxlbWVudChmb3Jtcy5SZW5kZXJGb3JtLCB7XG4gICAgICAgIGZvcm06IGZvcm1zZXQubWFuYWdlbWVudEZvcm0oKVxuICAgICAgLCBmb3JtQ29tcG9uZW50OiBwcm9wcy5mb3JtQ29tcG9uZW50XG4gICAgICAsIHJvdzogcHJvcHMucm93XG4gICAgICAsIHJvd0NvbXBvbmVudDogcHJvcHMucm93Q29tcG9uZW50XG4gICAgICB9KVxuICAgIClcbiAgfVxufSlcblxuLyoqXG4gKiBDcmVhdGVzIGEgRm9ybVNldCBjb25zdHJ1Y3RvciBmb3IgdGhlIGdpdmVuIEZvcm0gY29uc3RydWN0b3IuXG4gKiBAcGFyYW0ge0Zvcm19IGZvcm1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbmZ1bmN0aW9uIGZvcm1zZXRGYWN0b3J5KGZvcm0sIGt3YXJncykge1xuICAvLyBUT0RPIFBlcmZvcm0gUHJvcFR5cGUgY2hlY2tzIG9uIGt3YXJncyBpbiBkZXZlbG9wbWVudCBtb2RlXG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgIGZvcm1zZXQ6IEJhc2VGb3JtU2V0LCBleHRyYTogMSwgY2FuT3JkZXI6IGZhbHNlLCBjYW5EZWxldGU6IGZhbHNlLFxuICAgIG1heE51bTogREVGQVVMVF9NQVhfTlVNLCB2YWxpZGF0ZU1heDogZmFsc2UsXG4gICAgbWluTnVtOiBERUZBVUxUX01JTl9OVU0sIHZhbGlkYXRlTWluOiBmYWxzZVxuICB9LCBrd2FyZ3MpXG5cbiAgLy8gUmVtb3ZlIHNwZWNpYWwgcHJvcGVydGllcyBmcm9tIGt3YXJncywgYXMgaXQgd2lsbCBzdWJzZXF1ZW50bHkgYmUgdXNlZCB0b1xuICAvLyBhZGQgcHJvcGVydGllcyB0byB0aGUgbmV3IGZvcm1zZXQncyBwcm90b3R5cGUuXG4gIHZhciBmb3Jtc2V0ID0gb2JqZWN0LnBvcChrd2FyZ3MsICdmb3Jtc2V0JylcbiAgdmFyIGV4dHJhID0gb2JqZWN0LnBvcChrd2FyZ3MsICdleHRyYScpXG4gIHZhciBjYW5PcmRlciA9IG9iamVjdC5wb3Aoa3dhcmdzLCAnY2FuT3JkZXInKVxuICB2YXIgY2FuRGVsZXRlID0gb2JqZWN0LnBvcChrd2FyZ3MsICdjYW5EZWxldGUnKVxuICB2YXIgbWF4TnVtID0gb2JqZWN0LnBvcChrd2FyZ3MsICdtYXhOdW0nKVxuICB2YXIgdmFsaWRhdGVNYXggPSBvYmplY3QucG9wKGt3YXJncywgJ3ZhbGlkYXRlTWF4JylcbiAgdmFyIG1pbk51bSA9IG9iamVjdC5wb3Aoa3dhcmdzLCAnbWluTnVtJylcbiAgdmFyIHZhbGlkYXRlTWluID0gb2JqZWN0LnBvcChrd2FyZ3MsICd2YWxpZGF0ZU1pbicpXG5cbiAgLy8gSGFyZCBsaW1pdCBvbiBmb3JtcyBpbnN0YW50aWF0ZWQsIHRvIHByZXZlbnQgbWVtb3J5LWV4aGF1c3Rpb24gYXR0YWNrc1xuICAvLyBsaW1pdCBpcyBzaW1wbHkgbWF4TnVtICsgREVGQVVMVF9NQVhfTlVNICh3aGljaCBpcyAyICogREVGQVVMVF9NQVhfTlVNXG4gIC8vIGlmIG1heE51bSBpcyBub3QgcHJvdmlkZWQgaW4gdGhlIGZpcnN0IHBsYWNlKVxuICB2YXIgYWJzb2x1dGVNYXggPSBtYXhOdW0gKyBERUZBVUxUX01BWF9OVU1cbiAgZXh0cmEgKz0gbWluTnVtXG5cbiAga3dhcmdzLmNvbnN0cnVjdG9yID0gZnVuY3Rpb24oa3dhcmdzKSB7XG4gICAgdGhpcy5mb3JtID0gZm9ybVxuICAgIHRoaXMuZXh0cmEgPSBleHRyYVxuICAgIHRoaXMuY2FuT3JkZXIgPSBjYW5PcmRlclxuICAgIHRoaXMuY2FuRGVsZXRlID0gY2FuRGVsZXRlXG4gICAgdGhpcy5tYXhOdW0gPSBtYXhOdW1cbiAgICB0aGlzLnZhbGlkYXRlTWF4ID0gdmFsaWRhdGVNYXhcbiAgICB0aGlzLm1pbk51bSA9IG1pbk51bVxuICAgIHRoaXMudmFsaWRhdGVNaW4gPSB2YWxpZGF0ZU1pblxuICAgIHRoaXMuYWJzb2x1dGVNYXggPSBhYnNvbHV0ZU1heFxuICAgIGZvcm1zZXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cblxuICByZXR1cm4gZm9ybXNldC5leHRlbmQoa3dhcmdzKVxufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBldmVyeSBmb3Jtc2V0IGluIGZvcm1zZXRzIGlzIHZhbGlkLlxuICovXG5mdW5jdGlvbiBhbGxWYWxpZChmb3Jtc2V0cykge1xuICB2YXIgdmFsaWQgPSB0cnVlXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZm9ybXNldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKCFmb3Jtc2V0c1tpXS5pc1ZhbGlkKCkpIHtcbiAgICAgIHZhbGlkID0gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbGlkXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhbGxWYWxpZDogYWxsVmFsaWRcbiwgQmFzZUZvcm1TZXQ6IEJhc2VGb3JtU2V0XG4sIERFRkFVTFRfTUFYX05VTTogREVGQVVMVF9NQVhfTlVNXG4sIGZvcm1zZXRGYWN0b3J5OiBmb3Jtc2V0RmFjdG9yeVxuLCBSZW5kZXJGb3JtU2V0OiBSZW5kZXJGb3JtU2V0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIHRpbWUgPSByZXF1aXJlKCdpc29tb3JwaC90aW1lJylcblxudmFyIGRlZmF1bHRMb2NhbGUgPSB7bGFuZzogJ2VuJ31cblxudmFyIGxvY2FsZUNhY2hlID0ge1xuICBlbjoge1xuICAgIERBVEVfSU5QVVRfRk9STUFUUzogW1xuICAgICAgJyVZLSVtLSVkJyAgICAgICAgICAgICAgICAgICAgICAgIC8vICcyMDA2LTEwLTI1J1xuICAgICwgJyVtLyVkLyVZJywgJyVtLyVkLyV5JyAgICAgICAgICAgIC8vICcxMC8yNS8yMDA2JywgJzEwLzI1LzA2J1xuICAgICwgJyViICVkICVZJywgJyViICVkLCAlWScgICAgICAgICAgIC8vICdPY3QgMjUgMjAwNicsICdPY3QgMjUsIDIwMDYnXG4gICAgLCAnJWQgJWIgJVknLCAnJWQgJWIsICVZJyAgICAgICAgICAgLy8gJzI1IE9jdCAyMDA2JywgJzI1IE9jdCwgMjAwNidcbiAgICAsICclQiAlZCAlWScsICclQiAlZCwgJVknICAgICAgICAgICAvLyAnT2N0b2JlciAyNSAyMDA2JywgJ09jdG9iZXIgMjUsIDIwMDYnXG4gICAgLCAnJWQgJUIgJVknLCAnJWQgJUIsICVZJyAgICAgICAgICAgLy8gJzI1IE9jdG9iZXIgMjAwNicsICcyNSBPY3RvYmVyLCAyMDA2J1xuICAgIF1cbiAgLCBEQVRFVElNRV9JTlBVVF9GT1JNQVRTOiBbXG4gICAgICAnJVktJW0tJWQgJUg6JU06JVMnICAgICAgICAgICAgICAgLy8gJzIwMDYtMTAtMjUgMTQ6MzA6NTknXG4gICAgLCAnJVktJW0tJWQgJUg6JU0nICAgICAgICAgICAgICAgICAgLy8gJzIwMDYtMTAtMjUgMTQ6MzAnXG4gICAgLCAnJVktJW0tJWQnICAgICAgICAgICAgICAgICAgICAgICAgLy8gJzIwMDYtMTAtMjUnXG4gICAgLCAnJW0vJWQvJVkgJUg6JU06JVMnICAgICAgICAgICAgICAgLy8gJzEwLzI1LzIwMDYgMTQ6MzA6NTknXG4gICAgLCAnJW0vJWQvJVkgJUg6JU0nICAgICAgICAgICAgICAgICAgLy8gJzEwLzI1LzIwMDYgMTQ6MzAnXG4gICAgLCAnJW0vJWQvJVknICAgICAgICAgICAgICAgICAgICAgICAgLy8gJzEwLzI1LzIwMDYnXG4gICAgLCAnJW0vJWQvJXkgJUg6JU06JVMnICAgICAgICAgICAgICAgLy8gJzEwLzI1LzA2IDE0OjMwOjU5J1xuICAgICwgJyVtLyVkLyV5ICVIOiVNJyAgICAgICAgICAgICAgICAgIC8vICcxMC8yNS8wNiAxNDozMCdcbiAgICAsICclbS8lZC8leScgICAgICAgICAgICAgICAgICAgICAgICAvLyAnMTAvMjUvMDYnXG4gICAgXVxuICB9XG4sIGVuX0dCOiB7XG4gICAgREFURV9JTlBVVF9GT1JNQVRTOiBbXG4gICAgICAnJWQvJW0vJVknLCAnJWQvJW0vJXknICAgICAgICAgICAgLy8gJzI1LzEwLzIwMDYnLCAnMjUvMTAvMDYnXG4gICAgLCAnJWIgJWQgJVknLCAnJWIgJWQsICVZJyAgICAgICAgICAgLy8gJ09jdCAyNSAyMDA2JywgJ09jdCAyNSwgMjAwNidcbiAgICAsICclZCAlYiAlWScsICclZCAlYiwgJVknICAgICAgICAgICAvLyAnMjUgT2N0IDIwMDYnLCAnMjUgT2N0LCAyMDA2J1xuICAgICwgJyVCICVkICVZJywgJyVCICVkLCAlWScgICAgICAgICAgIC8vICdPY3RvYmVyIDI1IDIwMDYnLCAnT2N0b2JlciAyNSwgMjAwNidcbiAgICAsICclZCAlQiAlWScsICclZCAlQiwgJVknICAgICAgICAgICAvLyAnMjUgT2N0b2JlciAyMDA2JywgJzI1IE9jdG9iZXIsIDIwMDYnXG4gICAgXVxuICAsIERBVEVUSU1FX0lOUFVUX0ZPUk1BVFM6IFtcbiAgICAgICclWS0lbS0lZCAlSDolTTolUycgICAgICAgICAgICAgICAvLyAnMjAwNi0xMC0yNSAxNDozMDo1OSdcbiAgICAsICclWS0lbS0lZCAlSDolTScgICAgICAgICAgICAgICAgICAvLyAnMjAwNi0xMC0yNSAxNDozMCdcbiAgICAsICclWS0lbS0lZCcgICAgICAgICAgICAgICAgICAgICAgICAvLyAnMjAwNi0xMC0yNSdcbiAgICAsICclZC8lbS8lWSAlSDolTTolUycgICAgICAgICAgICAgICAvLyAnMjUvMTAvMjAwNiAxNDozMDo1OSdcbiAgICAsICclZC8lbS8lWSAlSDolTScgICAgICAgICAgICAgICAgICAvLyAnMjUvMTAvMjAwNiAxNDozMCdcbiAgICAsICclZC8lbS8lWScgICAgICAgICAgICAgICAgICAgICAgICAvLyAnMjUvMTAvMjAwNidcbiAgICAsICclZC8lbS8leSAlSDolTTolUycgICAgICAgICAgICAgICAvLyAnMjUvMTAvMDYgMTQ6MzA6NTknXG4gICAgLCAnJWQvJW0vJXkgJUg6JU0nICAgICAgICAgICAgICAgICAgLy8gJzI1LzEwLzA2IDE0OjMwJ1xuICAgICwgJyVkLyVtLyV5JyAgICAgICAgICAgICAgICAgICAgICAgIC8vICcyNS8xMC8wNidcbiAgICBdXG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIGEgbG9jYWxlIG9iamVjdCB0byBvdXIgb3duIGNhY2hlIChmb3IgZm9ybWF0cykgYW5kIGlzb21vcnBoLnRpbWUncyBjYWNoZVxuICogKGZvciB0aW1lIHBhcnNpbmcvZm9ybWF0dGluZykuXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ1xuICogQHBhcmFtIHtzdHJpbmc9fSBsb2NhbGVcbiAqL1xuZnVuY3Rpb24gYWRkTG9jYWxlKGxhbmcsIGxvY2FsZSkge1xuICBsb2NhbGVDYWNoZVtsYW5nXSA9IGxvY2FsZVxuICB0aW1lLmxvY2FsZXNbbGFuZ10gPSBsb2NhbGVcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtb3N0IGFwcGxpY2FibGUgbG9jYWxlLCBmYWxsaW5nIGJhY2sgdG8gdGhlIGxhbmd1YWdlIGNvZGUgaWZcbiAqIG5lY2Vzc2FyeSBhbmQgdG8gdGhlIGRlZmF1bHQgbG9jYWxlIGlmIG5vIG1hdGNoaW5nIGxvY2FsZSB3YXMgZm91bmQuXG4gKiBAcGFyYW0ge3N0cmluZz19IGxhbmdcbiAqL1xuZnVuY3Rpb24gZ2V0TG9jYWxlKGxhbmcpIHtcbiAgaWYgKGxhbmcpIHtcbiAgICBpZiAob2JqZWN0Lmhhc093bihsb2NhbGVDYWNoZSwgbGFuZykpIHtcbiAgICAgIHJldHVybiBsb2NhbGVDYWNoZVtsYW5nXVxuICAgIH1cbiAgICBpZiAobGFuZy5pbmRleE9mKCdfJykgIT0gLTEpIHtcbiAgICAgIGxhbmcgPSBsYW5nLnNwbGl0KCdfJylbMF1cbiAgICAgIGlmIChvYmplY3QuaGFzT3duKGxvY2FsZUNhY2hlLCBsYW5nKSkge1xuICAgICAgICByZXR1cm4gbG9jYWxlQ2FjaGVbbGFuZ11cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxvY2FsZUNhY2hlW2RlZmF1bHRMb2NhbGUubGFuZ11cbn1cblxuLyoqXG4gKiBHZXRzIGFsbCBhcHBsaWNhYmxlIGxvY2FsZXMsIHdpdGggdGhlIG1vc3Qgc3BlY2lmaWMgZmlyc3QsIGZhbGxpbmcgYmFjayB0b1xuICogdGhlIGRlZmF1bHQgbG9jYWxlIGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7c3RyaW5nPX0gbGFuZ1xuICogQHJldHVybiB7QXJyYXkuPE9iamVjdD59XG4gKi9cbmZ1bmN0aW9uIGdldExvY2FsZXMobGFuZykge1xuICBpZiAobGFuZykge1xuICAgIHZhciBsb2NhbGVzID0gW11cbiAgICBpZiAob2JqZWN0Lmhhc093bihsb2NhbGVDYWNoZSwgbGFuZykpIHtcbiAgICAgICBsb2NhbGVzLnB1c2gobG9jYWxlQ2FjaGVbbGFuZ10pXG4gICAgfVxuICAgIGlmIChsYW5nLmluZGV4T2YoJ18nKSAhPSAtMSkge1xuICAgICAgbGFuZyA9IGxhbmcuc3BsaXQoJ18nKVswXVxuICAgICAgaWYgKG9iamVjdC5oYXNPd24obG9jYWxlQ2FjaGUsIGxhbmcpKSB7XG4gICAgICAgIGxvY2FsZXMucHVzaChsb2NhbGVDYWNoZVtsYW5nXSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxvY2FsZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbG9jYWxlc1xuICAgIH1cbiAgfVxuICByZXR1cm4gW2xvY2FsZUNhY2hlW2RlZmF1bHRMb2NhbGUubGFuZ11dXG59XG5cbi8qKlxuICogU2V0cyB0aGUgbGFuZ3VhZ2UgY29kZSBmb3IgdGhlIGRlZmF1bHQgbG9jYWxlLlxuICogQHBhcmFtIHtzdHJpbmd9IGxhbmdcbiAqL1xuZnVuY3Rpb24gc2V0RGVmYXVsdExvY2FsZShsYW5nKSB7XG4gIGlmICghb2JqZWN0Lmhhc093bihsb2NhbGVDYWNoZSwgbGFuZykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbG9jYWxlOiAnICsgbGFuZylcbiAgfVxuICBkZWZhdWx0TG9jYWxlLmxhbmcgPSBsYW5nXG59XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgbGFuZ3VhZ2UgY29kZSBmb3IgdGhlIGRlZmF1bHQgbG9jYWxlLlxuICovXG5mdW5jdGlvbiBnZXREZWZhdWx0TG9jYWxlKCkge1xuICByZXR1cm4gZGVmYXVsdExvY2FsZS5sYW5nXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRMb2NhbGU6IGFkZExvY2FsZVxuLCBnZXREZWZhdWx0TG9jYWxlOiBnZXREZWZhdWx0TG9jYWxlXG4sIGdldExvY2FsZTogZ2V0TG9jYWxlXG4sIGdldExvY2FsZXM6IGdldExvY2FsZXNcbiwgc2V0RGVmYXVsdExvY2FsZTogc2V0RGVmYXVsdExvY2FsZVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXMgPSByZXF1aXJlKCdpc29tb3JwaC9pcycpXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcblxuLyoqXG4gKiBSZXBsYWNlcyBTdHJpbmcge3BsYWNlaG9sZGVyc30gd2l0aCBwcm9wZXJ0aWVzIG9mIGEgZ2l2ZW4gb2JqZWN0LCBidXRcbiAqIGludGVycG9sYXRlcyBpbnRvIGFuZCByZXR1cm5zIGFuIEFycmF5IGluc3RlYWQgb2YgYSBTdHJpbmcuXG4gKiBCeSBkZWZhdWx0LCBhbnkgcmVzdWx0aW5nIGVtcHR5IHN0cmluZ3MgYXJlIHN0cmlwcGVkIG91dCBvZiB0aGUgQXJyYXkuIFRvXG4gKiBkaXNhYmxlIHRoaXMsIHBhc3MgYW4gb3B0aW9ucyBvYmplY3Qgd2l0aCBhICdzdHJpcCcgcHJvcGVydHkgd2hpY2ggaXMgZmFsc2UuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRvQXJyYXkoc3RyLCBvYmosIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KC9cXHsoXFx3KylcXH0vZylcbiAgZm9yICh2YXIgaSA9IDEsIGwgPSBwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpICs9IDIpIHtcbiAgICBwYXJ0c1tpXSA9IChvYmplY3QuaGFzT3duKG9iaiwgcGFydHNbaV0pXG4gICAgICAgICAgICAgICAgPyBvYmpbcGFydHNbaV1dXG4gICAgICAgICAgICAgICAgOiAneycgKyBwYXJ0c1tpXSArICd9JylcbiAgfVxuICBpZiAoIW9wdGlvbnMgfHwgKG9wdGlvbnMgJiYgb3B0aW9ucy5zdHJpcCAhPT0gZmFsc2UpKSB7XG4gICAgcGFydHMgPSBwYXJ0cy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gcCAhPT0gJyd9KVxuICB9XG4gIHJldHVybiBwYXJ0c1xufVxuXG4vKipcbiAqIEdldCBuYW1lZCBwcm9wZXJ0aWVzIGZyb20gYW4gb2JqZWN0LlxuICogQHBhcmFtIHNyYyB7T2JqZWN0fVxuICogQHBhcmFtIHByb3BzIHtBcnJheS48c3RyaW5nPn1cbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuZnVuY3Rpb24gZ2V0UHJvcHMoc3JjLCBwcm9wcykge1xuICB2YXIgcmVzdWx0ID0ge31cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwcm9wcy5sZW5ndGg7IGkgPCBsIDsgaSsrKSB7XG4gICAgdmFyIHByb3AgPSBwcm9wc1tpXVxuICAgIGlmIChvYmplY3QuaGFzT3duKHNyYywgcHJvcCkpIHtcbiAgICAgIHJlc3VsdFtwcm9wXSA9IHNyY1twcm9wXVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8qKlxuICogR2V0IGEgbmFtZWQgcHJvcGVydHkgZnJvbSBhbiBvYmplY3QsIGNhbGxpbmcgaXQgYW5kIHJldHVybmluZyBpdHMgcmVzdWx0IGlmXG4gKiBpdCdzIGEgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIG1heWJlQ2FsbChvYmosIHByb3ApIHtcbiAgdmFyIHZhbHVlID0gb2JqW3Byb3BdXG4gIGlmIChpcy5GdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLmNhbGwob2JqKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBsaXN0IG9mIGNob2ljZSBwYWlycyBmcm9tIGEgbGlzdCBvZiBvYmplY3RzIHVzaW5nIHRoZSBnaXZlbiBuYW1lZFxuICogcHJvcGVydGllcyBmb3IgdGhlIHZhbHVlIGFuZCBsYWJlbC5cbiAqL1xuZnVuY3Rpb24gbWFrZUNob2ljZXMobGlzdCwgdmFsdWVQcm9wLCBsYWJlbFByb3ApIHtcbiAgcmV0dXJuIGxpc3QubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICByZXR1cm4gW21heWJlQ2FsbChpdGVtLCB2YWx1ZVByb3ApLCBtYXliZUNhbGwoaXRlbSwgbGFiZWxQcm9wKV1cbiAgfSlcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgY2hvaWNlIGlucHV0IGFuZCBub3JtYWxpc2VzIGxhenksIG5vbi1BcnJheSBjaG9pY2VzIHRvIGJlXG4gKiBbdmFsdWUsIGxhYmVsXSBwYWlyc1xuICogQHJldHVybiB7QXJyYXl9IGEgbm9ybWFsaXNlZCB2ZXJzaW9uIG9mIHRoZSBnaXZlbiBjaG9pY2VzLlxuICogQHRocm93cyBpZiBhbiBBcnJheSB3aXRoIGxlbmd0aCAhPSAyIHdhcyBmb3VuZCB3aGVyZSBhIGNob2ljZSBwYWlyIHdhcyBleHBlY3RlZC5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXNlQ2hvaWNlcyhjaG9pY2VzKSB7XG4gIGlmICghY2hvaWNlcy5sZW5ndGgpIHsgcmV0dXJuIGNob2ljZXMgfVxuXG4gIHZhciBub3JtYWxpc2VkQ2hvaWNlcyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBsID0gY2hvaWNlcy5sZW5ndGgsIGNob2ljZTsgaSA8IGw7IGkrKykge1xuICAgIGNob2ljZSA9IGNob2ljZXNbaV1cbiAgICBpZiAoIWlzLkFycmF5KGNob2ljZSkpIHtcbiAgICAgIC8vIFRPRE8gSW4gdGhlIGRldmVsb3BtZW50IGJ1aWxkLCBlbWl0IGEgd2FybmluZyBhYm91dCBhIGNob2ljZSBiZWluZ1xuICAgICAgLy8gICAgICBhdXRvbWF0aWNhbGx5IGNvbnZlcnRlZCBmcm9tICdibGFoJyB0byBbJ2JsYWgnLCAnYmxhaCddIGluIGNhc2UgaXRcbiAgICAgIC8vICAgICAgd2Fzbid0IGludGVudGlvbmFsXG4gICAgICBjaG9pY2UgPSBbY2hvaWNlLCBjaG9pY2VdXG4gICAgfVxuICAgIGlmIChjaG9pY2UubGVuZ3RoICE9IDIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2hvaWNlcyBpbiBhIGNob2ljZSBsaXN0IG11c3QgY29udGFpbiBleGFjdGx5IDIgdmFsdWVzLCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnYnV0IGdvdCAnICsgSlNPTi5zdHJpbmdpZnkoY2hvaWNlKSlcbiAgICB9XG4gICAgaWYgKGlzLkFycmF5KGNob2ljZVsxXSkpIHtcbiAgICAgIHZhciBub3JtYWxpc2VkT3B0Z3JvdXBDaG9pY2VzID0gW11cbiAgICAgIC8vIFRoaXMgaXMgYW4gb3B0Z3JvdXAsIHNvIGxvb2sgaW5zaWRlIHRoZSBncm91cCBmb3Igb3B0aW9uc1xuICAgICAgdmFyIG9wdGdyb3VwQ2hvaWNlcyA9IGNob2ljZVsxXVxuICAgICAgZm9yICh2YXIgaiA9IDAsIG0gPSBvcHRncm91cENob2ljZXMubGVuZ3RoLCBvcHRncm91cENob2ljZTsgaiA8IG07IGorKykge1xuICAgICAgICBvcHRncm91cENob2ljZSA9IG9wdGdyb3VwQ2hvaWNlc1tqXVxuICAgICAgICBpZiAoIWlzLkFycmF5KG9wdGdyb3VwQ2hvaWNlKSkge1xuICAgICAgICAgIG9wdGdyb3VwQ2hvaWNlID0gW29wdGdyb3VwQ2hvaWNlLCBvcHRncm91cENob2ljZV1cbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0Z3JvdXBDaG9pY2UubGVuZ3RoICE9IDIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nob2ljZXMgaW4gYW4gb3B0Z3JvdXAgY2hvaWNlIGxpc3QgbXVzdCBjb250YWluICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnZXhhY3RseSAyIHZhbHVlcywgYnV0IGdvdCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkob3B0Z3JvdXBDaG9pY2UpKVxuICAgICAgICB9XG4gICAgICAgIG5vcm1hbGlzZWRPcHRncm91cENob2ljZXMucHVzaChvcHRncm91cENob2ljZSlcbiAgICAgIH1cbiAgICAgIG5vcm1hbGlzZWRDaG9pY2VzLnB1c2goW2Nob2ljZVswXSwgbm9ybWFsaXNlZE9wdGdyb3VwQ2hvaWNlc10pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbm9ybWFsaXNlZENob2ljZXMucHVzaChjaG9pY2UpXG4gICAgfVxuICB9XG4gIHJldHVybiBub3JtYWxpc2VkQ2hvaWNlc1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGV2ZW50c1xuICovXG5mdW5jdGlvbiBub3JtYWxpc2VWYWxpZGF0aW9uRXZlbnRzKGV2ZW50cykge1xuICBldmVudHMgPSBldmVudHMubWFwKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmluZGV4T2YoJ29uJykgPT09IDApIHsgcmV0dXJuIGV2ZW50IH1cbiAgICByZXR1cm4gJ29uJyArIGV2ZW50LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZXZlbnQuc3Vic3RyKDEpXG4gIH0pXG4gIHZhciBvbkNoYW5nZUluZGV4ID0gZXZlbnRzLmluZGV4T2YoJ29uQ2hhbmdlJylcbiAgaWYgKG9uQ2hhbmdlSW5kZXggIT0gLTEpIHtcbiAgICBldmVudHMuc3BsaWNlKG9uQ2hhbmdlSW5kZXgsIDEpXG4gIH1cbiAgcmV0dXJuIHtldmVudHM6IGV2ZW50cywgb25DaGFuZ2U6IChvbkNoYW5nZUluZGV4ICE9IC0xKX1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRzXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGlzZVZhbGlkYXRpb25TdHJpbmcoZXZlbnRzKSB7XG4gIHJldHVybiBub3JtYWxpc2VWYWxpZGF0aW9uRXZlbnRzKHN0cmlwKGV2ZW50cykuc3BsaXQoLyArL2cpKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7KHN0cmluZ3xPYmplY3QpfSB2YWxpZGF0aW9uXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGlzZVZhbGlkYXRpb24odmFsaWRhdGlvbikge1xuICBpZiAoIXZhbGlkYXRpb24gfHwgdmFsaWRhdGlvbiA9PT0gJ21hbnVhbCcpIHtcbiAgICByZXR1cm4gdmFsaWRhdGlvblxuICB9XG4gIGVsc2UgaWYgKHZhbGlkYXRpb24gPT09ICdhdXRvJykge1xuICAgIHJldHVybiB7ZXZlbnRzOiBbJ29uQmx1ciddLCBvbkNoYW5nZTogdHJ1ZSwgb25DaGFuZ2VEZWxheTogMzY5fVxuICB9XG4gIGVsc2UgaWYgKGlzLlN0cmluZyh2YWxpZGF0aW9uKSkge1xuICAgIHJldHVybiBub3JtYWxpc2VWYWxpZGF0aW9uU3RyaW5nKHZhbGlkYXRpb24pXG4gIH1cbiAgZWxzZSBpZiAoaXMuT2JqZWN0KHZhbGlkYXRpb24pKSB7XG4gICAgdmFyIG5vcm1hbGlzZWRcbiAgICBpZiAoaXMuU3RyaW5nKHZhbGlkYXRpb24ub24pKSB7XG4gICAgICBub3JtYWxpc2VkID0gbm9ybWFsaXNlVmFsaWRhdGlvblN0cmluZyh2YWxpZGF0aW9uLm9uKVxuICAgIH1cbiAgICBlbHNlIGlmIChpcy5BcnJheSh2YWxpZGF0aW9uLm9uKSkge1xuICAgICAgbm9ybWFsaXNlZCA9IG5vcm1hbGlzZVZhbGlkYXRpb25FdmVudHModmFsaWRhdGlvbi5vbilcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWYWxpZGF0aW9uIGNvbmZpZyBPYmplY3RzIG11c3QgaGF2ZSBhbiAnb24nIFN0cmluZyBvciBBcnJheVwiKVxuICAgIH1cbiAgICBub3JtYWxpc2VkLm9uQ2hhbmdlRGVsYXkgPSBvYmplY3QuZ2V0KHZhbGlkYXRpb24sICdvbkNoYW5nZURlbGF5JywgdmFsaWRhdGlvbi5kZWxheSlcbiAgICByZXR1cm4gbm9ybWFsaXNlZFxuICB9XG4gIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCB2YWxpZGF0aW9uIGNvbmZpZzogJyArIHZhbGlkYXRpb24pXG59XG5cbi8qKlxuICogQ29udmVydHMgJ2ZpcnN0TmFtZScgYW5kICdmaXJzdF9uYW1lJyB0byAnRmlyc3QgbmFtZScsIGFuZFxuICogJ1NIT1VUSU5HX0xJS0VfVEhJUycgdG8gJ1NIT1VUSU5HIExJS0UgVEhJUycuXG4gKi9cbnZhciBwcmV0dHlOYW1lID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgY2Fwc1JFID0gLyhbQS1aXSspL2dcbiAgdmFyIHNwbGl0UkUgPSAvWyBfXSsvXG4gIHZhciBhbGxDYXBzUkUgPSAvXltBLVpdW0EtWjAtOV0rJC9cblxuICByZXR1cm4gZnVuY3Rpb24obmFtZSkge1xuICAgIC8vIFByZWZpeCBzZXF1ZW5jZXMgb2YgY2FwcyB3aXRoIHNwYWNlcyBhbmQgc3BsaXQgb24gYWxsIHNwYWNlXG4gICAgLy8gY2hhcmFjdGVycy5cbiAgICB2YXIgcGFydHMgPSBuYW1lLnJlcGxhY2UoY2Fwc1JFLCAnICQxJykuc3BsaXQoc3BsaXRSRSlcblxuICAgIC8vIElmIHdlIGhhZCBhbiBpbml0aWFsIGNhcC4uLlxuICAgIGlmIChwYXJ0c1swXSA9PT0gJycpIHtcbiAgICAgIHBhcnRzLnNwbGljZSgwLCAxKVxuICAgIH1cblxuICAgIC8vIEdpdmUgdGhlIGZpcnN0IHdvcmQgYW4gaW5pdGlhbCBjYXAgYW5kIGFsbCBzdWJzZXF1ZW50IHdvcmRzIGFuXG4gICAgLy8gaW5pdGlhbCBsb3dlcmNhc2UgaWYgbm90IGFsbCBjYXBzLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICBwYXJ0c1swXSA9IHBhcnRzWzBdLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICtcbiAgICAgICAgICAgICAgICAgICBwYXJ0c1swXS5zdWJzdHIoMSlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCFhbGxDYXBzUkUudGVzdChwYXJ0c1tpXSkpIHtcbiAgICAgICAgcGFydHNbaV0gPSBwYXJ0c1tpXS5jaGFyQXQoMCkudG9Mb3dlckNhc2UoKSArXG4gICAgICAgICAgICAgICAgICAgcGFydHNbaV0uc3Vic3RyKDEpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJyAnKVxuICB9XG59KSgpXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRm9ybUVsZW1lbnR8UmVhY3RFbGVtZW50fSBmb3JtIGEgZm9ybSBlbGVtZW50LlxuICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsKHN0cmluZ3xBcnJheS48c3RyaW5nPik+fSBhbiBvYmplY3QgY29udGFpbmluZyB0aGVcbiAqICAgc3VibWl0dGFibGUgdmFsdWUocykgaGVsZCBpbiBlYWNoIG9mIHRoZSBmb3JtJ3MgZWxlbWVudHMuXG4gKi9cbmZ1bmN0aW9uIGZvcm1EYXRhKGZvcm0pIHtcbiAgaWYgKCFmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdmb3JtRGF0YSB3YXMgZ2l2ZW4gZm9ybT0nICsgZm9ybSlcbiAgfVxuICBpZiAodHlwZW9mIGZvcm0uZ2V0RE9NTm9kZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgZm9ybSA9IGZvcm0uZ2V0RE9NTm9kZSgpXG4gIH1cbiAgdmFyIGRhdGEgPSB7fVxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZm9ybS5lbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgZWxlbWVudCA9IGZvcm0uZWxlbWVudHNbaV1cbiAgICB2YXIgdmFsdWUgPSBnZXRGb3JtRWxlbWVudFZhbHVlKGVsZW1lbnQpXG4gICAgLy8gQWRkIGFueSB2YWx1ZSBvYnRhaW5lZCB0byB0aGUgZGF0YSBvYmplY3RcbiAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgIGlmIChvYmplY3QuaGFzT3duKGRhdGEsIGVsZW1lbnQubmFtZSkpIHtcbiAgICAgICAgaWYgKGlzLkFycmF5KGRhdGFbZWxlbWVudC5uYW1lXSkpIHtcbiAgICAgICAgICBkYXRhW2VsZW1lbnQubmFtZV0gPSBkYXRhW2VsZW1lbnQubmFtZV0uY29uY2F0KHZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRhdGFbZWxlbWVudC5uYW1lXSA9IFtkYXRhW2VsZW1lbnQubmFtZV0sIHZhbHVlXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZGF0YVtlbGVtZW50Lm5hbWVdID0gdmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGF0YVxufVxuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEZvcm1FbGVtZW50fFJlYWN0RWxlbWVudH0gZm9ybSBhIGZvcm0gZWxlbWVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZCBhIGZpZWxkIG5hbWUuXG4gKiBAcmV0dXJuIHsoc3RyaW5nfEFycmF5LjxzdHJpbmc+KX0gdGhlIG5hbWVkIGZpZWxkJ3Mgc3VibWl0dGFibGUgdmFsdWUocyksXG4gKi9cbmZ1bmN0aW9uIGZpZWxkRGF0YShmb3JtLCBmaWVsZCkge1xuICAvKiBnbG9iYWwgTm9kZUxpc3QgKi9cbiAgaWYgKCFmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdmaWVsZERhdGEgd2FzIGdpdmVuIGZvcm09JyArIGZvcm0pXG4gIH1cbiAgaWYgKGZvcm0gJiYgdHlwZW9mIGZvcm0uZ2V0RE9NTm9kZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgZm9ybSA9IGZvcm0uZ2V0RE9NTm9kZSgpXG4gIH1cbiAgdmFyIGRhdGEgPSBudWxsXG4gIHZhciBlbGVtZW50ID0gZm9ybS5lbGVtZW50c1tmaWVsZF1cbiAgLy8gQ2hlY2sgaWYgd2UndmUgZ290IGEgTm9kZUxpc3RcbiAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlTGlzdCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZWxlbWVudC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGdldEZvcm1FbGVtZW50VmFsdWUoZWxlbWVudFtpXSlcbiAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoZGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmIChpcy5BcnJheShkYXRhKSkge1xuICAgICAgICAgICAgZGF0YT0gZGF0YS5jb25jYXQodmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IFtkYXRhLCB2YWx1ZV1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZGF0YSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGF0YSA9IGdldEZvcm1FbGVtZW50VmFsdWUoZWxlbWVudClcbiAgfVxuXG4gIHJldHVybiBkYXRhXG59XG5cbi8qKlxuICogTG9va3VwIGZvciA8aW5wdXQ+cyB3aG9zZSB2YWx1ZSBjYW4gYmUgYWNjZXNzZWQgd2l0aCAudmFsdWUuXG4gKi9cbnZhciB0ZXh0SW5wdXRUeXBlcyA9IG9iamVjdC5sb29rdXAoW1xuICAnaGlkZGVuJywgJ3Bhc3N3b3JkJywgJ3RleHQnLCAnZW1haWwnLCAndXJsJywgJ251bWJlcicsICdmaWxlJywgJ3RleHRhcmVhJ1xuXSlcblxuLyoqXG4gKiBMb29rdXAgZm9yIDxpbnB1dHM+IHdoaWNoIGhhdmUgYSAuY2hlY2tlZCBwcm9wZXJ0eS5cbiAqL1xudmFyIGNoZWNrZWRJbnB1dFR5cGVzID0gb2JqZWN0Lmxvb2t1cChbJ2NoZWNrYm94JywgJ3JhZGlvJ10pXG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudHxIVE1MU2VsZWN0RWxlbWVudH0gZWxlbWVudCBhIGZvcm0gZWxlbWVudC5cbiAqIEByZXR1cm4geyhzdHJpbmd8QXJyYXkuPHN0cmluZz4pfSB0aGUgZWxlbWVudCdzIHN1Ym1pdHRhYmxlIHZhbHVlKHMpLFxuICovXG5mdW5jdGlvbiBnZXRGb3JtRWxlbWVudFZhbHVlKGVsZW1lbnQpIHtcbiAgdmFyIHZhbHVlID0gbnVsbFxuICB2YXIgdHlwZSA9IGVsZW1lbnQudHlwZVxuXG4gIGlmICh0ZXh0SW5wdXRUeXBlc1t0eXBlXSB8fCBjaGVja2VkSW5wdXRUeXBlc1t0eXBlXSAmJiBlbGVtZW50LmNoZWNrZWQpIHtcbiAgICB2YWx1ZSA9IGVsZW1lbnQudmFsdWVcbiAgfVxuICBlbHNlIGlmICh0eXBlID09ICdzZWxlY3Qtb25lJykge1xuICAgIGlmIChlbGVtZW50Lm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZSA9IGVsZW1lbnQub3B0aW9uc1tlbGVtZW50LnNlbGVjdGVkSW5kZXhdLnZhbHVlXG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHR5cGUgPT0gJ3NlbGVjdC1tdWx0aXBsZScpIHtcbiAgICB2YWx1ZSA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbGVtZW50Lm9wdGlvbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoZWxlbWVudC5vcHRpb25zW2ldLnNlbGVjdGVkKSB7XG4gICAgICAgIHZhbHVlLnB1c2goZWxlbWVudC5vcHRpb25zW2ldLnZhbHVlKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIENvZXJjZXMgdG8gc3RyaW5nIGFuZCBzdHJpcHMgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VzLlxuICovXG52YXIgc3RyaXAgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN0cmlwUkUgPS8oXlxccyt8XFxzKyQpL2dcbiAgcmV0dXJuIGZ1bmN0aW9uIHN0cmlwKHMpIHtcbiAgICByZXR1cm4gKCcnK3MpLnJlcGxhY2Uoc3RyaXBSRSwgJycpXG4gIH1cbn0oKVxuXG4vKipcbiAqIEZyb20gVW5kZXJzY29yZS5qcyAxLjUuMlxuICogaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbiAqIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAqIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAqIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICogbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAqXG4gKiBNb2RpZmllZCB0byBnaXZlIHRoZSByZXR1cm5lZCBmdW5jdGlvbjpcbiAqIC0gYSAuY2FuY2VsKCkgbWV0aG9kIHdoaWNoIHByZXZlbnRzIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gYmVpbmcgY2FsbGVkLlxuICogLSBhIC50cmlnZ2VyKCkgbWV0aG9kIHdoaWNoIGNhbGxzIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaW1tZWRpYXRlbHkuXG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHRcbiAgdmFyIGRlYm91bmNlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnRleHQgPSB0aGlzXG4gICAgYXJncyA9IGFyZ3VtZW50c1xuICAgIHRpbWVzdGFtcCA9IG5ldyBEYXRlKClcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wXG4gICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZW91dCA9IG51bGxcbiAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHsgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSB9XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dFxuICAgIGlmICghdGltZW91dCkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpXG4gICAgfVxuICAgIGlmIChjYWxsTm93KSB7IHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncykgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8vIENsZWFyIGFueSBwZW5kaW5nIHRpbWVvdXRcbiAgZGVib3VuY2VkLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICB9XG4gIH1cblxuICAvLyBDbGVhciBhbnkgcGVuZGluZyB0aW1lb3V0IGFuZCBleGVjdXRlIHRoZSBmdW5jdGlvbiBpbW1lZGlhdGVseVxuICBkZWJvdW5jZWQudHJpZ2dlciA9IGZ1bmN0aW9uKCkge1xuICAgIGRlYm91bmNlZC5jYW5jZWwoKVxuICAgIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpXG4gIH1cblxuICByZXR1cm4gZGVib3VuY2VkXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHdpdGggYSAuY2FuY2VsKCkgZnVuY3Rpb24gd2hpY2ggY2FuIGJlIHVzZWQgdG8gcHJldmVudCB0aGVcbiAqIGdpdmVuIGZ1bmN0aW9uIGZyb20gYmVpbmcgY2FsbGVkLiBJZiB0aGUgZ2l2ZW4gZnVuY3Rpb24gaGFzIGFuIG9uQ2FuY2VsKCksXG4gKiBpdCB3aWxsIGJlIGNhbGxlZCB3aGVuIGl0J3MgYmVpbmcgY2FuY2VsbGVkLlxuICpcbiAqIFVzZSBjYXNlOiB0cmlnZ2VyaW5nIGFuIGFzeW5jaHJvbm91cyBmdW5jdGlvbiB3aXRoIG5ldyBkYXRhIHdoaWxlIGFuIGV4aXN0aW5nXG4gKiBmdW5jdGlvbiBmb3IgdGhlIHNhbWUgdGFzayBidXQgd2l0aCBvbGQgZGF0YSBpcyBzdGlsbCBwZW5kaW5nIGEgY2FsbGJhY2ssIHNvXG4gKiB0aGUgY2FsbGJhY2sgb25seSBnZXRzIGNhbGxlZCBmb3IgdGhlIGxhc3Qgb25lIHRvIHJ1bi5cbiAqL1xuZnVuY3Rpb24gY2FuY2VsbGFibGUoZnVuYykge1xuICB2YXIgY2FuY2VsbGVkID0gZmFsc2VcblxuICB2YXIgY2FuY2VsbGFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFjYW5jZWxsZWQpIHtcbiAgICAgIGZ1bmMuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxuXG4gIGNhbmNlbGxhYmxlZC5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICBjYW5jZWxsZWQgPSB0cnVlXG4gICAgaWYgKGlzLkZ1bmN0aW9uKGZ1bmMub25DYW5jZWwpKSB7XG4gICAgICBmdW5jLm9uQ2FuY2VsKClcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2FuY2VsbGFibGVkXG59XG5cbi8qKlxuICogRXh0cmFjdHMgZGF0YSBmcm9tIGEgPGZvcm0+IGFuZCB2YWxpZGF0ZXMgaXQgd2l0aCBhIGxpc3Qgb2YgZm9ybXMgYW5kL29yXG4gKiBmb3Jtc2V0cy5cbiAqIEBwYXJhbSBmb3JtIHRoZSA8Zm9ybT4gaW50byB3aGljaCBhbnkgZ2l2ZW4gZm9ybXMgYW5kIGZvcm1zZXRzIGhhdmUgYmVlblxuICogICByZW5kZXJlZCAtIHRoaXMgY2FuIGJlIGEgUmVhY3QgPGZvcm0+IGNvbXBvbmVudCBvciBhIHJlYWwgPGZvcm0+IERPTSBub2RlLlxuICogQHBhcmFtIHtBcnJheS48KEZvcm18QmFzZUZvcm1TZXQpPn0gZm9ybXNBbmRGb3Jtc2V0cyBhIGxpc3Qgb2YgZm9ybXMgYW5kL29yXG4gKiAgIGZvcm1zZXRzIHRvIGJlIHVzZWQgdG8gdmFsaWRhdGUgdGhlIDxmb3JtPidzIGlucHV0IGRhdGEuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSA8Zm9ybT4ncyBpbnB1dCBkYXRhIGFyZSB2YWxpZCBhY2NvcmRpbmcgdG8gYWxsXG4gKiAgIGdpdmVuIGZvcm1zIGFuZCBmb3Jtc2V0cy5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVBbGwoZm9ybSwgZm9ybXNBbmRGb3Jtc2V0cykge1xuICBpZiAoZm9ybSAmJiB0eXBlb2YgZm9ybS5nZXRET01Ob2RlID09ICdmdW5jdGlvbicpIHtcbiAgICBmb3JtID0gZm9ybS5nZXRET01Ob2RlKClcbiAgfVxuICB2YXIgZGF0YSA9IGZvcm1EYXRhKGZvcm0pXG4gIHZhciBpc1ZhbGlkID0gdHJ1ZVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZvcm1zQW5kRm9ybXNldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKCFmb3Jtc0FuZEZvcm1zZXRzW2ldLnNldEZvcm1EYXRhKGRhdGEpKSB7XG4gICAgICBpc1ZhbGlkID0gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlzVmFsaWRcbn1cblxudmFyIGluZm8gPSBmdW5jdGlvbigpIHt9XG52YXIgd2FybmluZyA9IGZ1bmN0aW9uKCkge31cblxuaWYgKCdwcm9kdWN0aW9uJyAhPT0gXCJkZXZlbG9wbWVudFwiKSB7XG4gIGluZm8gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgY29uc29sZS53YXJuKCdbbmV3Zm9ybXNdICcgKyBtZXNzYWdlKVxuICB9XG4gIHdhcm5pbmcgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgY29uc29sZS53YXJuKCdbbmV3Zm9ybXNdIFdhcm5pbmc6ICcgKyBtZXNzYWdlKVxuICB9XG59XG5cbmZ1bmN0aW9uIGF1dG9JZENoZWNrZXIocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbikge1xuICB2YXIgYXV0b0lkID0gcHJvcHMuYXV0b0lkXG4gIGlmIChwcm9wcy5hdXRvSWQgJiYgIShpcy5TdHJpbmcoYXV0b0lkKSAmJiBhdXRvSWQuaW5kZXhPZigne25hbWV9JykgIT0gLTEpKSB7XG4gICAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgICdJbnZhbGlkIGBhdXRvSWRgICcgKyBsb2NhdGlvbiArICcgc3VwcGxpZWQgdG8gJyArXG4gICAgICAnYCcgKyBjb21wb25lbnROYW1lICsgJ2AuIE11c3QgYmUgZmFsc3kgb3IgYSBTdHJpbmcgY29udGFpbmluZyBhICcgK1xuICAgICAgJ2B7bmFtZX1gIHBsYWNlaG9sZGVyJ1xuICAgIClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXV0b0lkQ2hlY2tlcjogYXV0b0lkQ2hlY2tlclxuLCBjYW5jZWxsYWJsZTogY2FuY2VsbGFibGVcbiwgZGVib3VuY2U6IGRlYm91bmNlXG4sIGluZm86IGluZm9cbiwgZmllbGREYXRhOiBmaWVsZERhdGFcbiwgZm9ybWF0VG9BcnJheTogZm9ybWF0VG9BcnJheVxuLCBmb3JtRGF0YTogZm9ybURhdGFcbiwgZ2V0UHJvcHM6IGdldFByb3BzXG4sIG1ha2VDaG9pY2VzOiBtYWtlQ2hvaWNlc1xuLCBub3JtYWxpc2VDaG9pY2VzOiBub3JtYWxpc2VDaG9pY2VzXG4sIG5vcm1hbGlzZVZhbGlkYXRpb246IG5vcm1hbGlzZVZhbGlkYXRpb25cbiwgcHJldHR5TmFtZTogcHJldHR5TmFtZVxuLCBzdHJpcDogc3RyaXBcbiwgdmFsaWRhdGVBbGw6IHZhbGlkYXRlQWxsXG4sIHdhcm5pbmc6IHdhcm5pbmdcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgaXMgPSByZXF1aXJlKCdpc29tb3JwaC9pcycpXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcbnZhciB0aW1lID0gcmVxdWlyZSgnaXNvbW9ycGgvdGltZScpXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKVxuXG52YXIgZW52ID0gcmVxdWlyZSgnLi9lbnYnKVxudmFyIGZvcm1hdHMgPSByZXF1aXJlKCcuL2Zvcm1hdHMnKVxudmFyIGxvY2FsZXMgPSByZXF1aXJlKCcuL2xvY2FsZXMnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxuXG4vKipcbiAqIFNvbWUgd2lkZ2V0cyBhcmUgbWFkZSBvZiBtdWx0aXBsZSBIVE1MIGVsZW1lbnRzIC0tIG5hbWVseSwgUmFkaW9TZWxlY3QuXG4gKiBUaGlzIHJlcHJlc2VudHMgdGhlIFwiaW5uZXJcIiBIVE1MIGVsZW1lbnQgb2YgYSB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIFN1YldpZGdldCA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3ViV2lkZ2V0KHBhcmVudFdpZGdldCwgbmFtZSwgdmFsdWUsIGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdWJXaWRnZXQpKSB7XG4gICAgICByZXR1cm4gbmV3IFN1YldpZGdldChwYXJlbnRXaWRnZXQsIG5hbWUsIHZhbHVlLCBrd2FyZ3MpXG4gICAgfVxuICAgIHRoaXMucGFyZW50V2lkZ2V0ID0gcGFyZW50V2lkZ2V0XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2F0dHJzOiBudWxsLCBjaG9pY2VzOiBbXX0sIGt3YXJncylcbiAgICB0aGlzLmF0dHJzID0ga3dhcmdzLmF0dHJzXG4gICAgdGhpcy5jaG9pY2VzID0ga3dhcmdzLmNob2ljZXNcbiAgfVxufSlcblxuU3ViV2lkZ2V0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGt3YXJncyA9IHthdHRyczogdGhpcy5hdHRyc31cbiAgaWYgKHRoaXMuY2hvaWNlcy5sZW5ndGgpIHtcbiAgICBrd2FyZ3MuY2hvaWNlcyA9IHRoaXMuY2hvaWNlc1xuICB9XG4gIHJldHVybiB0aGlzLnBhcmVudFdpZGdldC5yZW5kZXIodGhpcy5uYW1lLCB0aGlzLnZhbHVlLCBrd2FyZ3MpXG59XG5cbi8qKlxuICogQW4gSFRNTCBmb3JtIHdpZGdldC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFdpZGdldCA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gV2lkZ2V0KGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2F0dHJzOiBudWxsfSwga3dhcmdzKVxuICAgIHRoaXMuYXR0cnMgPSBvYmplY3QuZXh0ZW5kKHt9LCBrd2FyZ3MuYXR0cnMpXG4gIH1cbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGlzIGNvcnJlc3BvbmRzIHRvIGFuIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCI+LiAqL1xuLCBpc0hpZGRlbjogZmFsc2VcbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGlzIHdpZGdldCBuZWVkcyBhIG11bHRpcGFydC1lbmNvZGVkIGZvcm0uICovXG4sIG5lZWRzTXVsdGlwYXJ0Rm9ybTogZmFsc2VcbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGlzIHdpZGdldCBpcyBmb3IgYSByZXF1aXJlZCBmaWVsZC4gKi9cbiwgaXNSZXF1aXJlZDogZmFsc2VcbiAgLyoqIE92ZXJyaWRlIGZvciBhY3RpdmUgdmFsaWRhdGlvbiBjb25maWcgYSBwYXJ0aWN1bGFyIHdpZGdldCBuZWVkcyB0byB1c2UuICovXG4sIHZhbGlkYXRpb246IG51bGxcbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGlzIHdpZGdldCdzIHJlbmRlciBsb2dpYyBhbHdheXMgbmVlZHMgdG8gdXNlIHRoZSBpbml0aWFsIHZhbHVlLiAqL1xuLCBuZWVkc0luaXRpYWxWYWx1ZTogZmFsc2VcbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGlzIHdpZGdldCdzIHZhbHVlIGNhbiBiZSBzZXQuICovXG4sIGlzVmFsdWVTZXR0YWJsZTogdHJ1ZVxufSlcblxuLyoqXG4gKiBZaWVsZHMgYWxsIFwic3Vid2lkZ2V0c1wiIG9mIHRoaXMgd2lkZ2V0LiBVc2VkIG9ubHkgYnkgUmFkaW9TZWxlY3QgdG9cbiAqIGFsbG93IGFjY2VzcyB0byBpbmRpdmlkdWFsIDxpbnB1dCB0eXBlPVwicmFkaW9cIj4gYnV0dG9ucy5cbiAqIEFyZ3VtZW50cyBhcmUgdGhlIHNhbWUgYXMgZm9yIHJlbmRlcigpLlxuICogQHJldHVybiB7QXJyYXkuPFN1YldpZGdldD59XG4gKi9cbldpZGdldC5wcm90b3R5cGUuc3ViV2lkZ2V0cyA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAgcmV0dXJuIFtTdWJXaWRnZXQodGhpcywgbmFtZSwgdmFsdWUsIGt3YXJncyldXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGlzIFdpZGdldCByZW5kZXJlZCBhcyBIVE1MLlxuICogVGhlIHZhbHVlIGdpdmVuIGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHZhbGlkIGlucHV0LCBzbyBzdWJjbGFzc1xuICogaW1wbGVtZW50YXRpb25zIHNob3VsZCBwcm9ncmFtIGRlZmVuc2l2ZWx5LlxuICogQGFic3RyYWN0XG4gKi9cbldpZGdldC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnN0cnVjdG9ycyBleHRlbmRpbmcgV2lkZ2V0IG11c3QgaW1wbGVtZW50IGEgcmVuZGVyKCkgbWV0aG9kLicpXG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBidWlsZGluZyBhbiBIVE1MIGF0dHJpYnV0ZXMgb2JqZWN0LlxuICovXG5XaWRnZXQucHJvdG90eXBlLmJ1aWxkQXR0cnMgPSBmdW5jdGlvbihrd2FyZ0F0dHJzLCByZW5kZXJBdHRycykge1xuICByZXR1cm4gb2JqZWN0LmV4dGVuZCh7fSwgdGhpcy5hdHRycywgcmVuZGVyQXR0cnMsIGt3YXJnQXR0cnMpXG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgdmFsdWUgZm9yIHRoaXMgd2lkZ2V0IGZyb20gdGhlIGdpdmVuIGRhdGEuXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBmb3JtIGRhdGEuXG4gKiBAcGFyYW0ge09iamVjdH0gZmlsZXMgZmlsZSBkYXRhLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIGZpZWxkIG5hbWUgdG8gYmUgdXNlZCB0byByZXRyaWV2ZSBkYXRhLlxuICogQHJldHVybiBhIHZhbHVlIGZvciB0aGlzIHdpZGdldCwgb3IgbnVsbCBpZiBubyB2YWx1ZSB3YXMgcHJvdmlkZWQuXG4gKi9cbldpZGdldC5wcm90b3R5cGUudmFsdWVGcm9tRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGZpbGVzLCBuYW1lKSB7XG4gIHJldHVybiBvYmplY3QuZ2V0KGRhdGEsIG5hbWUsIG51bGwpXG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgSFRNTCBpZCBhdHRyaWJ1dGUgb2YgdGhpcyBXaWRnZXQgZm9yIHVzZSBieSBhXG4gKiA8bGFiZWw+LCBnaXZlbiB0aGUgaWQgb2YgdGhlIGZpZWxkLlxuICogVGhpcyBob29rIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNvbWUgd2lkZ2V0cyBoYXZlIG11bHRpcGxlIEhUTUwgZWxlbWVudHMgYW5kLFxuICogdGh1cywgbXVsdGlwbGUgaWRzLiBJbiB0aGF0IGNhc2UsIHRoaXMgbWV0aG9kIHNob3VsZCByZXR1cm4gYW4gSUQgdmFsdWUgdGhhdFxuICogY29ycmVzcG9uZHMgdG8gdGhlIGZpcnN0IGlkIGluIHRoZSB3aWRnZXQncyB0YWdzLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIGEgZmllbGQgaWQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBpZCB3aGljaCBzaG91bGQgYmUgdXNlZCBieSBhIDxsYWJlbD4gZm9yIHRoaXMgV2lkZ2V0LlxuICovXG5XaWRnZXQucHJvdG90eXBlLmlkRm9yTGFiZWwgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gaWRcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dD4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7V2lkZ2V0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIElucHV0ID0gV2lkZ2V0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IElucHV0KGt3YXJncykgfVxuICAgIFdpZGdldC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuICAvKiogVGhlIHR5cGUgYXR0cmlidXRlIG9mIHRoaXMgaW5wdXQgLSBzdWJjbGFzc2VzIG11c3QgZGVmaW5lIGl0LiAqL1xuLCBpbnB1dFR5cGU6IG51bGxcbn0pXG5cbklucHV0LnByb3RvdHlwZS5fZm9ybWF0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWVcbn1cblxuSW5wdXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7YXR0cnM6IG51bGx9LCBrd2FyZ3MpXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHZhbHVlID0gJydcbiAgfVxuICB2YXIgZmluYWxBdHRycyA9IHRoaXMuYnVpbGRBdHRycyhrd2FyZ3MuYXR0cnMsIHt0eXBlOiB0aGlzLmlucHV0VHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZX0pXG4gIC8vIEhpZGRlbiBpbnB1dHMgY2FuIGJlIG1hZGUgY29udHJvbGxlZCBpbnB1dHMgYnkgZGVmYXVsdCwgYXMgdGhlIHVzZXJcbiAgLy8gY2FuJ3QgZGlyZWN0bHkgaW50ZXJhY3Qgd2l0aCB0aGVtLlxuICB2YXIgdmFsdWVBdHRyID0gKGt3YXJncy5jb250cm9sbGVkIHx8IHRoaXMuaXNIaWRkZW4gPyAndmFsdWUnIDogJ2RlZmF1bHRWYWx1ZScpXG4gIGlmICghKHZhbHVlQXR0ciA9PSAnZGVmYXVsdFZhbHVlJyAmJiB2YWx1ZSA9PT0gJycpKSB7XG4gICAgZmluYWxBdHRyc1t2YWx1ZUF0dHJdID0gKHZhbHVlICE9PSAnJyA/ICcnK3RoaXMuX2Zvcm1hdFZhbHVlKHZhbHVlKSA6IHZhbHVlKVxuICB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbnB1dCcsIGZpbmFsQXR0cnMpXG59XG5cbi8qKlxuICogQW4gSFRNTCA8aW5wdXQgdHlwZT1cInRleHRcIj4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7SW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgVGV4dElucHV0ID0gSW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFRleHRJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFRleHRJbnB1dChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHthdHRyczogbnVsbH0sIGt3YXJncylcbiAgICBpZiAoa3dhcmdzLmF0dHJzICE9IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRUeXBlID0gb2JqZWN0LnBvcChrd2FyZ3MuYXR0cnMsICd0eXBlJywgdGhpcy5pbnB1dFR5cGUpXG4gICAgfVxuICAgIElucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGlucHV0VHlwZTogJ3RleHQnXG59KVxuXG4vKipcbiAqIEFuIEhUTUwgPGlucHV0IHR5cGU9XCJudW1iZXJcIj4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7VGV4dElucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIE51bWJlcklucHV0ID0gVGV4dElucHV0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBOdW1iZXJJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IE51bWJlcklucHV0KGt3YXJncykgfVxuICAgIFRleHRJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCBpbnB1dFR5cGU6ICdudW1iZXInXG59KVxuXG4vKipcbiAqIEFuIEhUTUwgPGlucHV0IHR5cGU9XCJlbWFpbFwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtUZXh0SW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRW1haWxJbnB1dCA9IFRleHRJbnB1dC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRW1haWxJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IEVtYWlsSW5wdXQoa3dhcmdzKSB9XG4gICAgVGV4dElucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGlucHV0VHlwZTogJ2VtYWlsJ1xufSlcblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dCB0eXBlPVwidXJsXCI+IHdpZGdldC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1RleHRJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBVUkxJbnB1dCA9IFRleHRJbnB1dC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVVJMSW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBVUkxJbnB1dChrd2FyZ3MpIH1cbiAgICBUZXh0SW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbiwgaW5wdXRUeXBlOiAndXJsJ1xufSlcblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIj4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7VGV4dElucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFBhc3N3b3JkSW5wdXQgPSBUZXh0SW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFBhc3N3b3JkSW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBQYXNzd29yZElucHV0KGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe3JlbmRlclZhbHVlOiBmYWxzZX0sIGt3YXJncylcbiAgICBUZXh0SW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgdGhpcy5yZW5kZXJWYWx1ZSA9IGt3YXJncy5yZW5kZXJWYWx1ZVxuICB9XG4sIGlucHV0VHlwZTogJ3Bhc3N3b3JkJ1xufSlcblxuUGFzc3dvcmRJbnB1dC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBpZiAoIWVudi5icm93c2VyICYmICF0aGlzLnJlbmRlclZhbHVlKSB7XG4gICAgdmFsdWUgPSAnJ1xuICB9XG4gIHJldHVybiBUZXh0SW5wdXQucHJvdG90eXBlLnJlbmRlci5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlLCBrd2FyZ3MpXG59XG5cbi8qKlxuICogQW4gSFRNTCA8aW5wdXQgdHlwZT1cImhpZGRlblwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBIaWRkZW5JbnB1dCA9IElucHV0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBIaWRkZW5JbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IEhpZGRlbklucHV0KGt3YXJncykgfVxuICAgIElucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGlucHV0VHlwZTogJ2hpZGRlbidcbiwgaXNIaWRkZW46IHRydWVcbn0pXG5cbi8qKlxuICogQSB3aWRnZXQgdGhhdCBoYW5kbGVzIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCI+IGZvciBmaWVsZHMgdGhhdCBoYXZlIGEgbGlzdCBvZlxuICogdmFsdWVzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7SGlkZGVuSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTXVsdGlwbGVIaWRkZW5JbnB1dCA9IEhpZGRlbklucHV0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBNdWx0aXBsZUhpZGRlbklucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgTXVsdGlwbGVIaWRkZW5JbnB1dChrd2FyZ3MpIH1cbiAgICBIaWRkZW5JbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuTXVsdGlwbGVIaWRkZW5JbnB1dC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHthdHRyczogbnVsbH0sIGt3YXJncylcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgdmFsdWUgPSBbXVxuICB9XG4gIHZhciBmaW5hbEF0dHJzID0gdGhpcy5idWlsZEF0dHJzKGt3YXJncy5hdHRycywge3R5cGU6IHRoaXMuaW5wdXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lfSlcbiAgdmFyIGlkID0gb2JqZWN0LmdldChmaW5hbEF0dHJzLCAnaWQnLCBudWxsKVxuICB2YXIga2V5ID0gb2JqZWN0LmdldChmaW5hbEF0dHJzLCAna2V5JywgbnVsbClcbiAgdmFyIGlucHV0cyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGlucHV0QXR0cnMgPSBvYmplY3QuZXh0ZW5kKHt9LCBmaW5hbEF0dHJzLCB7dmFsdWU6IHZhbHVlW2ldfSlcbiAgICAvLyBBZGQgbnVtZXJpYyBpbmRleCBzdWZmaXhlcyB0byBhdHRyaWJ1dGVzIHdoaWNoIHNob3VsZCBiZSB1bmlxdWVcbiAgICBpZiAoaWQpIHtcbiAgICAgIGlucHV0QXR0cnMuaWQgPSBpZCArICdfJyArIGlcbiAgICB9XG4gICAgaWYgKGtleSkge1xuICAgICAgaW5wdXRBdHRycy5rZXkgPSBpZCArICdfJyArIGlcbiAgICB9XG4gICAgaW5wdXRzLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudCgnaW5wdXQnLCBpbnB1dEF0dHJzKSlcbiAgfVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2JywgbnVsbCwgaW5wdXRzKVxufVxuXG5NdWx0aXBsZUhpZGRlbklucHV0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhID0gZnVuY3Rpb24oZGF0YSwgZmlsZXMsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBkYXRhW25hbWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIFtdLmNvbmNhdChkYXRhW25hbWVdKVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogQW4gSFRNTCA8aW5wdXQgdHlwZT1cImZpbGVcIj4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7SW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRmlsZUlucHV0ID0gSW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEZpbGVJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IEZpbGVJbnB1dChrd2FyZ3MpIH1cbiAgICBJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCBpbnB1dFR5cGU6ICdmaWxlJ1xuLCBuZWVkc011bHRpcGFydEZvcm06IHRydWVcbiwgdmFsaWRhdGlvbjoge29uQ2hhbmdlOiB0cnVlfVxuLCBpc1ZhbHVlU2V0dGFibGU6IGZhbHNlXG59KVxuXG5GaWxlSW5wdXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAgcmV0dXJuIElucHV0LnByb3RvdHlwZS5yZW5kZXIuY2FsbCh0aGlzLCBuYW1lLCBudWxsLCBrd2FyZ3MpXG59XG5cbi8qKlxuICogRmlsZSB3aWRnZXRzIHRha2UgZGF0YSBmcm9tIGZpbGUgd3JhcHBlcnMgb24gdGhlIHNlcnZlci4gT24gdGhlIGNsaWVudCwgdGhleVxuICogdGFrZSBpdCBmcm9tIGRhdGEgc28gdGhlIHByZXNlbmNlIG9mIGEgLnZhbHVlIGNhbiBiZSB2YWxpZGF0ZWQgd2hlbiByZXF1aXJlZC5cbiAqL1xuRmlsZUlucHV0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhID0gZnVuY3Rpb24oZGF0YSwgZmlsZXMsIG5hbWUpIHtcbiAgcmV0dXJuIG9iamVjdC5nZXQoZW52LmJyb3dzZXIgPyBkYXRhIDogZmlsZXMsIG5hbWUsIG51bGwpXG59XG5cbnZhciBGSUxFX0lOUFVUX0NPTlRSQURJQ1RJT04gPSB7fVxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpbGVJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBDbGVhcmFibGVGaWxlSW5wdXQgPSBGaWxlSW5wdXQuZXh0ZW5kKHtcbiAgbmVlZHNJbml0aWFsVmFsdWU6IHRydWVcbiwgaXNWYWx1ZVNldHRhYmxlOiBmYWxzZVxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2xlYXJhYmxlRmlsZUlucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgQ2xlYXJhYmxlRmlsZUlucHV0KGt3YXJncykgfVxuICAgIEZpbGVJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCBpbml0aWFsVGV4dDogJ0N1cnJlbnRseSdcbiwgaW5wdXRUZXh0OiAnQ2hhbmdlJ1xuLCBjbGVhckNoZWNrYm94TGFiZWw6ICdDbGVhcidcbiwgdGVtcGxhdGVXaXRoSW5pdGlhbDogZnVuY3Rpb24ocGFyYW1zKSB7XG4gICAgcmV0dXJuIHV0aWwuZm9ybWF0VG9BcnJheShcbiAgICAgICd7aW5pdGlhbFRleHR9OiB7aW5pdGlhbH0ge2NsZWFyVGVtcGxhdGV9e2JyfXtpbnB1dFRleHR9OiB7aW5wdXR9J1xuICAgICwgb2JqZWN0LmV4dGVuZChwYXJhbXMsIHticjogUmVhY3QuY3JlYXRlRWxlbWVudCgnYnInLCBudWxsKX0pXG4gICAgKVxuICB9XG4sIHRlbXBsYXRlV2l0aENsZWFyOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICByZXR1cm4gdXRpbC5mb3JtYXRUb0FycmF5KFxuICAgICAgJ3tjaGVja2JveH0ge2xhYmVsfSdcbiAgICAsIG9iamVjdC5leHRlbmQocGFyYW1zLCB7XG4gICAgICAgIGxhYmVsOiBSZWFjdC5jcmVhdGVFbGVtZW50KCdsYWJlbCcsIHtodG1sRm9yOiBwYXJhbXMuY2hlY2tib3hJZH0sIHBhcmFtcy5sYWJlbClcbiAgICAgIH0pXG4gICAgKVxuICB9XG4sIHVybE1hcmt1cFRlbXBsYXRlOiBmdW5jdGlvbihocmVmLCBuYW1lKSB7XG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2EnLCB7aHJlZjogaHJlZn0sIG5hbWUpXG4gIH1cbn0pXG5cbi8qKlxuICogR2l2ZW4gdGhlIG5hbWUgb2YgdGhlIGZpbGUgaW5wdXQsIHJldHVybiB0aGUgbmFtZSBvZiB0aGUgY2xlYXIgY2hlY2tib3hcbiAqIGlucHV0LlxuICovXG5DbGVhcmFibGVGaWxlSW5wdXQucHJvdG90eXBlLmNsZWFyQ2hlY2tib3hOYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gbmFtZSArICctY2xlYXInXG59XG5cbi8qKlxuICogR2l2ZW4gdGhlIG5hbWUgb2YgdGhlIGNsZWFyIGNoZWNrYm94IGlucHV0LCByZXR1cm4gdGhlIEhUTUwgaWQgZm9yIGl0LlxuICovXG5DbGVhcmFibGVGaWxlSW5wdXQucHJvdG90eXBlLmNsZWFyQ2hlY2tib3hJZCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIG5hbWUgKyAnX2lkJ1xufVxuXG5DbGVhcmFibGVGaWxlSW5wdXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7YXR0cnM6IHt9fSwga3dhcmdzKVxuICBrd2FyZ3MuYXR0cnMua2V5ID0gJ2lucHV0J1xuICB2YXIgaW5wdXQgPSBGaWxlSW5wdXQucHJvdG90eXBlLnJlbmRlci5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlLCBrd2FyZ3MpXG4gIHZhciBpbml0aWFsVmFsdWUgPSBrd2FyZ3MuaW5pdGlhbFZhbHVlXG4gIGlmICghaW5pdGlhbFZhbHVlICYmIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS51cmwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpbml0aWFsVmFsdWUgPSB2YWx1ZVxuICB9XG4gIGlmIChpbml0aWFsVmFsdWUgJiYgdHlwZW9mIGluaXRpYWxWYWx1ZS51cmwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgY2xlYXJUZW1wbGF0ZVxuICAgIGlmICghdGhpcy5pc1JlcXVpcmVkKSB7XG4gICAgICB2YXIgY2xlYXJDaGVja2JveE5hbWUgPSB0aGlzLmNsZWFyQ2hlY2tib3hOYW1lKG5hbWUpXG4gICAgICB2YXIgY2xlYXJDaGVja2JveElkID0gdGhpcy5jbGVhckNoZWNrYm94SWQoY2xlYXJDaGVja2JveE5hbWUpXG4gICAgICBjbGVhclRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVdpdGhDbGVhcih7XG4gICAgICAgIGNoZWNrYm94OiBDaGVja2JveElucHV0KCkucmVuZGVyKGNsZWFyQ2hlY2tib3hOYW1lLCBmYWxzZSwge2F0dHJzOiB7J2lkJzogY2xlYXJDaGVja2JveElkfX0pXG4gICAgICAsIGNoZWNrYm94SWQ6IGNsZWFyQ2hlY2tib3hJZFxuICAgICAgLCBsYWJlbDogdGhpcy5jbGVhckNoZWNrYm94TGFiZWxcbiAgICAgIH0pXG4gICAgfVxuICAgIHZhciBjb250ZW50cyA9IHRoaXMudGVtcGxhdGVXaXRoSW5pdGlhbCh7XG4gICAgICBpbml0aWFsVGV4dDogdGhpcy5pbml0aWFsVGV4dFxuICAgICwgaW5pdGlhbDogdGhpcy51cmxNYXJrdXBUZW1wbGF0ZShpbml0aWFsVmFsdWUudXJsLCAnJytpbml0aWFsVmFsdWUpXG4gICAgLCBjbGVhclRlbXBsYXRlOiBjbGVhclRlbXBsYXRlXG4gICAgLCBpbnB1dFRleHQ6IHRoaXMuaW5wdXRUZXh0XG4gICAgLCBpbnB1dDogaW5wdXRcbiAgICB9KVxuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdzcGFuJywgbnVsbCwgY29udGVudHMpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nLCBudWxsLCBpbnB1dClcbiAgfVxufVxuXG5DbGVhcmFibGVGaWxlSW5wdXQucHJvdG90eXBlLnZhbHVlRnJvbURhdGEgPSBmdW5jdGlvbihkYXRhLCBmaWxlcywgbmFtZSkge1xuICB2YXIgdXBsb2FkID0gRmlsZUlucHV0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhKGRhdGEsIGZpbGVzLCBuYW1lKVxuICBpZiAoIXRoaXMuaXNSZXF1aXJlZCAmJlxuICAgICAgQ2hlY2tib3hJbnB1dC5wcm90b3R5cGUudmFsdWVGcm9tRGF0YS5jYWxsKHRoaXMsIGRhdGEsIGZpbGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDaGVja2JveE5hbWUobmFtZSkpKSB7XG4gICAgaWYgKHVwbG9hZCkge1xuICAgICAgLy8gSWYgdGhlIHVzZXIgY29udHJhZGljdHMgdGhlbXNlbHZlcyAodXBsb2FkcyBhIG5ldyBmaWxlIEFORFxuICAgICAgLy8gY2hlY2tzIHRoZSBcImNsZWFyXCIgY2hlY2tib3gpLCB3ZSByZXR1cm4gYSB1bmlxdWUgbWFya2VyXG4gICAgICAvLyBvYmplY3QgdGhhdCBGaWxlRmllbGQgd2lsbCB0dXJuIGludG8gYSBWYWxpZGF0aW9uRXJyb3IuXG4gICAgICByZXR1cm4gRklMRV9JTlBVVF9DT05UUkFESUNUSU9OXG4gICAgfVxuICAgIC8vIGZhbHNlIHNpZ25hbHMgdG8gY2xlYXIgYW55IGV4aXN0aW5nIHZhbHVlLCBhcyBvcHBvc2VkIHRvIGp1c3QgbnVsbFxuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB1cGxvYWRcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDx0ZXh0YXJlYT4gd2lkZ2V0LlxuICogQHBhcmFtIHtPYmplY3R9IFtrd2FyZ3NdIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICogQGNvbmZpZyB7b2JqZWN0fSBbYXR0cnNdIEhUTUwgYXR0cmlidXRlcyBmb3IgdGhlIHJlbmRlcmVkIHdpZGdldC4gRGVmYXVsdFxuICogICByb3dzIGFuZCBjb2xzIGF0dHJpYnV0ZXMgd2lsbCBiZSB1c2VkIGlmIG5vdCBwcm92aWRlZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1dpZGdldH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBUZXh0YXJlYSA9IFdpZGdldC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVGV4dGFyZWEoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBUZXh0YXJlYShrd2FyZ3MpIH1cbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBzb21ldGhpbmcgaW4gYXR0cnNcbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHthdHRyczogbnVsbH0sIGt3YXJncylcbiAgICAvLyBQcm92aWRlIGRlZmF1bHQgJ2NvbHMnIGFuZCAncm93cycgYXR0cmlidXRlc1xuICAgIGt3YXJncy5hdHRycyA9IG9iamVjdC5leHRlbmQoe3Jvd3M6ICczJywgY29sczogJzQwJ30sIGt3YXJncy5hdHRycylcbiAgICBXaWRnZXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cblRleHRhcmVhLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe30sIGt3YXJncylcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgdmFsdWUgPSAnJ1xuICB9XG4gIHZhciBmaW5hbEF0dHJzID0gdGhpcy5idWlsZEF0dHJzKGt3YXJncy5hdHRycywge25hbWU6IG5hbWV9KVxuICB2YXIgdmFsdWVBdHRyID0gKGt3YXJncy5jb250cm9sbGVkID8gJ3ZhbHVlJyA6ICdkZWZhdWx0VmFsdWUnKVxuICBmaW5hbEF0dHJzW3ZhbHVlQXR0cl0gPSB2YWx1ZVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnLCBmaW5hbEF0dHJzKVxufVxuXG4vKipcbiAqIEEgPGlucHV0IHR5cGU9XCJ0ZXh0XCI+IHdoaWNoLCBpZiBnaXZlbiBhIERhdGUgb2JqZWN0IHRvIGRpc3BsYXksIGZvcm1hdHMgaXQgYXNcbiAqIGFuIGFwcHJvcHJpYXRlIGRhdGUvdGltZSBTdHJpbmcuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtUZXh0SW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRGF0ZVRpbWVCYXNlSW5wdXQgPSBUZXh0SW5wdXQuZXh0ZW5kKHtcbiAgZm9ybWF0VHlwZTogJydcbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIERhdGVUaW1lQmFzZUlucHV0KGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2Zvcm1hdDogbnVsbH0sIGt3YXJncylcbiAgICBUZXh0SW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgdGhpcy5mb3JtYXQgPSBrd2FyZ3MuZm9ybWF0XG4gIH1cbn0pXG5cbkRhdGVUaW1lQmFzZUlucHV0LnByb3RvdHlwZS5fZm9ybWF0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoaXMuRGF0ZSh2YWx1ZSkpIHtcbiAgICBpZiAodGhpcy5mb3JtYXQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuZm9ybWF0ID0gZm9ybWF0cy5nZXRGb3JtYXQodGhpcy5mb3JtYXRUeXBlKVswXVxuICAgIH1cbiAgICByZXR1cm4gdGltZS5zdHJmdGltZSh2YWx1ZSwgdGhpcy5mb3JtYXQsIGxvY2FsZXMuZ2V0RGVmYXVsdExvY2FsZSgpKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0RhdGVUaW1lQmFzZUlucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIERhdGVJbnB1dCA9IERhdGVUaW1lQmFzZUlucHV0LmV4dGVuZCh7XG4gIGZvcm1hdFR5cGU6ICdEQVRFX0lOUFVUX0ZPUk1BVFMnXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBEYXRlSW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIERhdGVJbnB1dCkpIHsgcmV0dXJuIG5ldyBEYXRlSW5wdXQoa3dhcmdzKSB9XG4gICAgRGF0ZVRpbWVCYXNlSW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RGF0ZVRpbWVCYXNlSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRGF0ZVRpbWVJbnB1dCA9IERhdGVUaW1lQmFzZUlucHV0LmV4dGVuZCh7XG4gIGZvcm1hdFR5cGU6ICdEQVRFVElNRV9JTlBVVF9GT1JNQVRTJ1xuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRGF0ZVRpbWVJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRGF0ZVRpbWVJbnB1dCkpIHsgcmV0dXJuIG5ldyBEYXRlVGltZUlucHV0KGt3YXJncykgfVxuICAgIERhdGVUaW1lQmFzZUlucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0RhdGVUaW1lQmFzZUlucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFRpbWVJbnB1dCA9IERhdGVUaW1lQmFzZUlucHV0LmV4dGVuZCh7XG4gIGZvcm1hdFR5cGU6ICdUSU1FX0lOUFVUX0ZPUk1BVFMnXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBUaW1lSW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFRpbWVJbnB1dCkpIHsgcmV0dXJuIG5ldyBUaW1lSW5wdXQoa3dhcmdzKSB9XG4gICAgRGF0ZVRpbWVCYXNlSW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbnZhciBkZWZhdWx0Q2hlY2tUZXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuICh2YWx1ZSAhPT0gZmFsc2UgJiZcbiAgICAgICAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgIHZhbHVlICE9PSAnJylcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7V2lkZ2V0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENoZWNrYm94SW5wdXQgPSBXaWRnZXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIENoZWNrYm94SW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBDaGVja2JveElucHV0KGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2NoZWNrVGVzdDogZGVmYXVsdENoZWNrVGVzdH0sIGt3YXJncylcbiAgICBXaWRnZXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgdGhpcy5jaGVja1Rlc3QgPSBrd2FyZ3MuY2hlY2tUZXN0XG4gIH1cbiwgdmFsaWRhdGlvbjoge29uQ2hhbmdlOiB0cnVlfVxufSlcblxuQ2hlY2tib3hJbnB1dC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHt9LCBrd2FyZ3MpXG4gIHZhciBmaW5hbEF0dHJzID0gdGhpcy5idWlsZEF0dHJzKGt3YXJncy5hdHRycywge3R5cGU6ICdjaGVja2JveCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWV9KVxuICBpZiAodmFsdWUgIT09ICcnICYmIHZhbHVlICE9PSB0cnVlICYmIHZhbHVlICE9PSBmYWxzZSAmJiB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgYWRkIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgaWYgdmFsdWUgaXMgbm9uLWVtcHR5XG4gICAgZmluYWxBdHRycy52YWx1ZSA9IHZhbHVlXG4gIH1cbiAgdmFyIGNoZWNrZWRBdHRyID0gKGt3YXJncy5jb250cm9sbGVkID8gJ2NoZWNrZWQnIDogJ2RlZmF1bHRDaGVja2VkJylcbiAgZmluYWxBdHRyc1tjaGVja2VkQXR0cl0gPSB0aGlzLmNoZWNrVGVzdCh2YWx1ZSlcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JywgZmluYWxBdHRycylcbn1cblxuQ2hlY2tib3hJbnB1dC5wcm90b3R5cGUudmFsdWVGcm9tRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGZpbGVzLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZGF0YVtuYW1lXSA9PSAndW5kZWZpbmVkJykge1xuICAgIC8vICBBIG1pc3NpbmcgdmFsdWUgbWVhbnMgRmFsc2UgYmVjYXVzZSBIVE1MIGZvcm0gc3VibWlzc2lvbiBkb2VzIG5vdFxuICAgIC8vIHNlbmQgcmVzdWx0cyBmb3IgdW5zZWxlY3RlZCBjaGVja2JveGVzLlxuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHZhciB2YWx1ZSA9IGRhdGFbbmFtZV1cbiAgdmFyIHZhbHVlcyA9IHsndHJ1ZSc6IHRydWUsICdmYWxzZSc6IGZhbHNlfVxuICAvLyBUcmFuc2xhdGUgdHJ1ZSBhbmQgZmFsc2Ugc3RyaW5ncyB0byBib29sZWFuIHZhbHVlc1xuICBpZiAoaXMuU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhbHVlID0gb2JqZWN0LmdldCh2YWx1ZXMsIHZhbHVlLnRvTG93ZXJDYXNlKCksIHZhbHVlKVxuICB9XG4gIHJldHVybiAhIXZhbHVlXG59XG5cbi8qKlxuICogQW4gSFRNTCA8c2VsZWN0PiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtXaWRnZXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgU2VsZWN0ID0gV2lkZ2V0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBTZWxlY3Qoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBTZWxlY3Qoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7Y2hvaWNlczogW119LCBrd2FyZ3MpXG4gICAgV2lkZ2V0LmNhbGwodGhpcywga3dhcmdzKVxuICAgIHRoaXMuY2hvaWNlcyA9IHV0aWwubm9ybWFsaXNlQ2hvaWNlcyhrd2FyZ3MuY2hvaWNlcylcbiAgfVxuLCBhbGxvd011bHRpcGxlU2VsZWN0ZWQ6IGZhbHNlXG4sIHZhbGlkYXRpb246IHtvbkNoYW5nZTogdHJ1ZX1cbn0pXG5cbi8qKlxuICogUmVuZGVycyB0aGUgd2lkZ2V0LlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIGZpZWxkIG5hbWUuXG4gKiBAcGFyYW0geyp9IHNlbGVjdGVkVmFsdWUgdGhlIHZhbHVlIG9mIGFuIG9wdGlvbiB3aGljaCBzaG91bGQgYmUgbWFya2VkIGFzXG4gKiAgIHNlbGVjdGVkLCBvciBudWxsIGlmIG5vIHZhbHVlIGlzIHNlbGVjdGVkIC0tIHdpbGwgYmUgbm9ybWFsaXNlZCB0byBhIFN0cmluZ1xuICogICBmb3IgY29tcGFyaXNvbiB3aXRoIGNob2ljZSB2YWx1ZXMuXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJncyByZW5kZXJpbmcgb3B0aW9uc1xuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3MuYXR0cnMgYWRkaXRpb25hbCBIVE1MIGF0dHJpYnV0ZXMgZm9yIHRoZSByZW5kZXJlZCB3aWRnZXQuXG4gKiBAcGFyYW0ge0FycmF5PX0ga3dhcmdzLmNob2ljZXMgY2hvaWNlcyB0byBiZSB1c2VkIHdoZW4gcmVuZGVyaW5nIHRoZSB3aWRnZXQsIGluXG4gKiAgIGFkZGl0aW9uIHRvIHRob3NlIGFscmVhZHkgaGVsZCBieSB0aGUgd2lkZ2V0IGl0c2VsZi5cbiAqIEByZXR1cm4gYSA8c2VsZWN0PiBlbGVtZW50LlxuICovXG5TZWxlY3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHNlbGVjdGVkVmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtjaG9pY2VzOiBbXX0sIGt3YXJncylcbiAgaWYgKHNlbGVjdGVkVmFsdWUgPT09IG51bGwpIHtcbiAgICBzZWxlY3RlZFZhbHVlID0gJydcbiAgfVxuICB2YXIgZmluYWxBdHRycyA9IHRoaXMuYnVpbGRBdHRycyhrd2FyZ3MuYXR0cnMsIHtuYW1lOiBuYW1lfSlcbiAgdmFyIG9wdGlvbnMgPSB0aGlzLnJlbmRlck9wdGlvbnMoa3dhcmdzLmNob2ljZXMsIFtzZWxlY3RlZFZhbHVlXSlcbiAgdmFyIHZhbHVlQXR0ciA9IChrd2FyZ3MuY29udHJvbGxlZCA/ICd2YWx1ZScgOiAnZGVmYXVsdFZhbHVlJylcbiAgZmluYWxBdHRyc1t2YWx1ZUF0dHJdID0gc2VsZWN0ZWRWYWx1ZVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnc2VsZWN0JywgZmluYWxBdHRycywgb3B0aW9ucylcbn1cblxuU2VsZWN0LnByb3RvdHlwZS5yZW5kZXJPcHRpb25zID0gZnVuY3Rpb24oYWRkaXRpb25hbENob2ljZXMsIHNlbGVjdGVkVmFsdWVzKSB7XG4gIHZhciBzZWxlY3RlZFZhbHVlc0xvb2t1cCA9IG9iamVjdC5sb29rdXAoc2VsZWN0ZWRWYWx1ZXMpXG4gIHZhciBvcHRpb25zID0gW11cbiAgdmFyIGNob2ljZXMgPSB0aGlzLmNob2ljZXMuY29uY2F0KHV0aWwubm9ybWFsaXNlQ2hvaWNlcyhhZGRpdGlvbmFsQ2hvaWNlcykpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gY2hvaWNlcy5sZW5ndGgsIGNob2ljZTsgaSA8IGw7IGkrKykge1xuICAgIGNob2ljZSA9IGNob2ljZXNbaV1cbiAgICBpZiAoaXMuQXJyYXkoY2hvaWNlWzFdKSkge1xuICAgICAgdmFyIG9wdGdyb3VwT3B0aW9ucyA9IFtdXG4gICAgICB2YXIgb3B0Z3JvdXBDaG9pY2VzID0gY2hvaWNlWzFdXG4gICAgICBmb3IgKHZhciBqID0gMCwgbSA9IG9wdGdyb3VwQ2hvaWNlcy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgICAgb3B0Z3JvdXBPcHRpb25zLnB1c2godGhpcy5yZW5kZXJPcHRpb24oc2VsZWN0ZWRWYWx1ZXNMb29rdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGdyb3VwQ2hvaWNlc1tqXVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0Z3JvdXBDaG9pY2VzW2pdWzFdKSlcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMucHVzaChSZWFjdC5jcmVhdGVFbGVtZW50KCdvcHRncm91cCcsIHtsYWJlbDogY2hvaWNlWzBdfSwgb3B0Z3JvdXBPcHRpb25zKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBvcHRpb25zLnB1c2godGhpcy5yZW5kZXJPcHRpb24oc2VsZWN0ZWRWYWx1ZXNMb29rdXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNob2ljZVsxXSkpXG4gICAgfVxuICB9XG4gIHJldHVybiBvcHRpb25zXG59XG5cblNlbGVjdC5wcm90b3R5cGUucmVuZGVyT3B0aW9uID0gZnVuY3Rpb24oc2VsZWN0ZWRWYWx1ZXNMb29rdXAsIG9wdFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRMYWJlbCkge1xuICBvcHRWYWx1ZSA9ICcnK29wdFZhbHVlXG4gIHZhciBhdHRycyA9IHt2YWx1ZTogb3B0VmFsdWV9XG4gIGlmICh0eXBlb2Ygc2VsZWN0ZWRWYWx1ZXNMb29rdXBbb3B0VmFsdWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgYXR0cnNbJ3NlbGVjdGVkJ10gPSAnc2VsZWN0ZWQnXG4gICAgaWYgKCF0aGlzLmFsbG93TXVsdGlwbGVTZWxlY3RlZCkge1xuICAgICAgLy8gT25seSBhbGxvdyBmb3IgYSBzaW5nbGUgc2VsZWN0aW9uIHdpdGggdGhpcyB2YWx1ZVxuICAgICAgZGVsZXRlIHNlbGVjdGVkVmFsdWVzTG9va3VwW29wdFZhbHVlXVxuICAgIH1cbiAgfVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnb3B0aW9uJywgYXR0cnMsIG9wdExhYmVsKVxufVxuXG4vKipcbiAqIEEgPHNlbGVjdD4gd2lkZ2V0IGludGVuZGVkIHRvIGJlIHVzZWQgd2l0aCBOdWxsQm9vbGVhbkZpZWxkLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7U2VsZWN0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIE51bGxCb29sZWFuU2VsZWN0ID0gU2VsZWN0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBOdWxsQm9vbGVhblNlbGVjdChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IE51bGxCb29sZWFuU2VsZWN0KGt3YXJncykgfVxuICAgIGt3YXJncyA9IGt3YXJncyB8fCB7fVxuICAgIC8vIFNldCBvciBvdmVycmlkZSBjaG9pY2VzXG4gICAga3dhcmdzLmNob2ljZXMgPSBbWycxJywgJ1Vua25vd24nXSwgWycyJywgJ1llcyddLCBbJzMnLCAnTm8nXV1cbiAgICBTZWxlY3QuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbk51bGxCb29sZWFuU2VsZWN0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PSAnMicpIHtcbiAgICB2YWx1ZSA9ICcyJ1xuICB9XG4gIGVsc2UgaWYgKHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PSAnMycpIHtcbiAgICB2YWx1ZSA9ICczJ1xuICB9XG4gIGVsc2Uge1xuICAgIHZhbHVlID0gJzEnXG4gIH1cbiAgcmV0dXJuIFNlbGVjdC5wcm90b3R5cGUucmVuZGVyLmNhbGwodGhpcywgbmFtZSwgdmFsdWUsIGt3YXJncylcbn1cblxuTnVsbEJvb2xlYW5TZWxlY3QucHJvdG90eXBlLnZhbHVlRnJvbURhdGEgPSBmdW5jdGlvbihkYXRhLCBmaWxlcywgbmFtZSkge1xuICB2YXIgdmFsdWUgPSBudWxsXG4gIGlmICh0eXBlb2YgZGF0YVtuYW1lXSAhPSAndW5kZWZpbmVkJykge1xuICAgIHZhciBkYXRhVmFsdWUgPSBkYXRhW25hbWVdXG4gICAgaWYgKGRhdGFWYWx1ZSA9PT0gdHJ1ZSB8fCBkYXRhVmFsdWUgPT0gJ1RydWUnIHx8IGRhdGFWYWx1ZSA9PSAndHJ1ZScgfHxcbiAgICAgICAgZGF0YVZhbHVlID09ICcyJykge1xuICAgICAgdmFsdWUgPSB0cnVlXG4gICAgfVxuICAgIGVsc2UgaWYgKGRhdGFWYWx1ZSA9PT0gZmFsc2UgfHwgZGF0YVZhbHVlID09ICdGYWxzZScgfHxcbiAgICAgICAgICAgICBkYXRhVmFsdWUgPT0gJ2ZhbHNlJyB8fCBkYXRhVmFsdWUgPT0gJzMnKSB7XG4gICAgICB2YWx1ZSA9IGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIEFuIEhUTUwgPHNlbGVjdD4gd2lkZ2V0IHdoaWNoIGFsbG93cyBtdWx0aXBsZSBzZWxlY3Rpb25zLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7U2VsZWN0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFNlbGVjdE11bHRpcGxlID0gU2VsZWN0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBTZWxlY3RNdWx0aXBsZShrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFNlbGVjdE11bHRpcGxlKGt3YXJncykgfVxuICAgIFNlbGVjdC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCBhbGxvd011bHRpcGxlU2VsZWN0ZWQ6IHRydWVcbiwgdmFsaWRhdGlvbjoge29uQ2hhbmdlOiB0cnVlfVxufSlcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSB3aWRnZXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZmllbGQgbmFtZS5cbiAqIEBwYXJhbSB7QXJyYXl9IHNlbGVjdGVkVmFsdWVzIHRoZSB2YWx1ZXMgb2Ygb3B0aW9ucyB3aGljaCBzaG91bGQgYmUgbWFya2VkIGFzXG4gKiAgIHNlbGVjdGVkLCBvciBudWxsIGlmIG5vIHZhbHVlcyBhcmUgc2VsZWN0ZWQgLSB0aGVzZSB3aWxsIGJlIG5vcm1hbGlzZWQgdG9cbiAqICAgU3RyaW5ncyBmb3IgY29tcGFyaXNvbiB3aXRoIGNob2ljZSB2YWx1ZXMuXG4gKiBAcGFyYW0ge09iamVjdH0gW2t3YXJnc10gYWRkaXRpb25hbCByZW5kZXJpbmcgb3B0aW9ucy5cbiAqIEByZXR1cm4gYSA8c2VsZWN0PiBlbGVtZW50IHdoaWNoIGFsbG93cyBtdWx0aXBsZSBzZWxlY3Rpb25zLlxuICovXG5TZWxlY3RNdWx0aXBsZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgc2VsZWN0ZWRWYWx1ZXMsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtjaG9pY2VzOiBbXX0sIGt3YXJncylcbiAgaWYgKHNlbGVjdGVkVmFsdWVzID09PSBudWxsKSB7XG4gICAgc2VsZWN0ZWRWYWx1ZXMgPSBbXVxuICB9XG4gIGlmICghaXMuQXJyYXkoc2VsZWN0ZWRWYWx1ZXMpKSB7XG4gICAgc2VsZWN0ZWRWYWx1ZXMgPSBbc2VsZWN0ZWRWYWx1ZXNdXG4gIH1cbiAgdmFyIGZpbmFsQXR0cnMgPSB0aGlzLmJ1aWxkQXR0cnMoa3dhcmdzLmF0dHJzLCB7bmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGU6ICdtdWx0aXBsZSd9KVxuICB2YXIgb3B0aW9ucyA9IHRoaXMucmVuZGVyT3B0aW9ucyhrd2FyZ3MuY2hvaWNlcywgc2VsZWN0ZWRWYWx1ZXMpXG4gIHZhciB2YWx1ZUF0dHIgPSAoa3dhcmdzLmNvbnRyb2xsZWQgPyAndmFsdWUnIDogJ2RlZmF1bHRWYWx1ZScpXG4gIGZpbmFsQXR0cnNbdmFsdWVBdHRyXSA9IHNlbGVjdGVkVmFsdWVzXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnLCBmaW5hbEF0dHJzLCBvcHRpb25zKVxufVxuXG4vKipcbiAqIFJldHJpZXZlcyB2YWx1ZXMgZm9yIHRoaXMgd2lkZ2V0IGZyb20gdGhlIGdpdmVuIGRhdGEuXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBmb3JtIGRhdGEuXG4gKiBAcGFyYW0ge09iamVjdH0gZmlsZXMgZmlsZSBkYXRhLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIGZpZWxkIG5hbWUgdG8gYmUgdXNlZCB0byByZXRyaWV2ZSBkYXRhLlxuICogQHJldHVybiB7QXJyYXl9IHZhbHVlcyBmb3IgdGhpcyB3aWRnZXQsIG9yIG51bGwgaWYgbm8gdmFsdWVzIHdlcmUgcHJvdmlkZWQuXG4gKi9cblNlbGVjdE11bHRpcGxlLnByb3RvdHlwZS52YWx1ZUZyb21EYXRhID0gZnVuY3Rpb24oZGF0YSwgZmlsZXMsIG5hbWUpIHtcbiAgaWYgKG9iamVjdC5oYXNPd24oZGF0YSwgbmFtZSkgJiYgZGF0YVtuYW1lXSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIFtdLmNvbmNhdChkYXRhW25hbWVdKVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHVzZWQgYnkgQ2hvaWNlRmllbGRSZW5kZXJlciB0aGF0IHJlcHJlc2VudHMgYSBzaW5nbGVcbiAqIDxpbnB1dD4uXG4gKi9cbnZhciBDaG9pY2VJbnB1dCA9IFN1YldpZGdldC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2hvaWNlSW5wdXQobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2UsIGluZGV4KSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuYXR0cnMgPSBhdHRyc1xuICAgIHRoaXMuY29udHJvbGxlZCA9IGNvbnRyb2xsZWRcbiAgICB0aGlzLmNob2ljZVZhbHVlID0gJycrY2hvaWNlWzBdXG4gICAgdGhpcy5jaG9pY2VMYWJlbCA9ICcnK2Nob2ljZVsxXVxuICAgIHRoaXMuaW5kZXggPSBpbmRleFxuICAgIGlmICh0eXBlb2YgdGhpcy5hdHRycy5pZCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5hdHRycy5pZCArPSAnXycgKyB0aGlzLmluZGV4XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdGhpcy5hdHRycy5rZXkgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuYXR0cnMua2V5ICs9ICdfJyArIHRoaXMuaW5kZXhcbiAgICB9XG4gIH1cbiwgaW5wdXRUeXBlOiBudWxsIC8vIFN1YmNsYXNzZXMgbXVzdCBkZWZpbmUgdGhpc1xufSlcblxuLyoqXG4gKiBSZW5kZXJzIGEgPGxhYmVsPiBlbmNsb3NpbmcgdGhlIHdpZGdldCBhbmQgaXRzIGxhYmVsIHRleHQuXG4gKi9cbkNob2ljZUlucHV0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGxhYmVsQXR0cnMgPSB7fVxuICBpZiAodGhpcy5pZEZvckxhYmVsKCkpIHtcbiAgICBsYWJlbEF0dHJzLmh0bWxGb3IgPSB0aGlzLmlkRm9yTGFiZWwoKVxuICB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdsYWJlbCcsIGxhYmVsQXR0cnMsIHRoaXMudGFnKCksICcgJywgdGhpcy5jaG9pY2VMYWJlbClcbn1cblxuQ2hvaWNlSW5wdXQucHJvdG90eXBlLmlzQ2hlY2tlZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy52YWx1ZSA9PT0gdGhpcy5jaG9pY2VWYWx1ZVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIDxpbnB1dD4gcG9ydGlvbiBvZiB0aGUgd2lkZ2V0LlxuICovXG5DaG9pY2VJbnB1dC5wcm90b3R5cGUudGFnID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmaW5hbEF0dHJzID0gV2lkZ2V0LnByb3RvdHlwZS5idWlsZEF0dHJzLmNhbGwodGhpcywge30sIHtcbiAgICB0eXBlOiB0aGlzLmlucHV0VHlwZSwgbmFtZTogdGhpcy5uYW1lLCB2YWx1ZTogdGhpcy5jaG9pY2VWYWx1ZVxuICB9KVxuICB2YXIgY2hlY2tlZEF0dHIgPSAodGhpcy5jb250cm9sbGVkID8gJ2NoZWNrZWQnIDogJ2RlZmF1bHRDaGVja2VkJylcbiAgZmluYWxBdHRyc1tjaGVja2VkQXR0cl0gPSB0aGlzLmlzQ2hlY2tlZCgpXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbnB1dCcsIGZpbmFsQXR0cnMpXG59XG5cbkNob2ljZUlucHV0LnByb3RvdHlwZS5pZEZvckxhYmVsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBvYmplY3QuZ2V0KHRoaXMuYXR0cnMsICdpZCcsICcnKVxufVxuXG52YXIgUmFkaW9DaG9pY2VJbnB1dCA9IENob2ljZUlucHV0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBSYWRpb0Nob2ljZUlucHV0KG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlLCBpbmRleCkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSYWRpb0Nob2ljZUlucHV0KSkge1xuICAgICAgcmV0dXJuIG5ldyBSYWRpb0Nob2ljZUlucHV0KG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlLCBpbmRleClcbiAgICB9XG4gICAgQ2hvaWNlSW5wdXQuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZSwgaW5kZXgpXG4gICAgdGhpcy52YWx1ZSA9ICcnK3RoaXMudmFsdWVcbiAgfVxuLCBpbnB1dFR5cGU6ICdyYWRpbydcbn0pXG5cbnZhciBDaGVja2JveENob2ljZUlucHV0ID0gQ2hvaWNlSW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIENoZWNrYm94Q2hvaWNlSW5wdXQobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2UsIGluZGV4KSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENoZWNrYm94Q2hvaWNlSW5wdXQpKSB7XG4gICAgICByZXR1cm4gbmV3IENoZWNrYm94Q2hvaWNlSW5wdXQobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2UsIGluZGV4KVxuICAgIH1cbiAgICBpZiAoIWlzLkFycmF5KHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSBbdmFsdWVdXG4gICAgfVxuICAgIENob2ljZUlucHV0LmNhbGwodGhpcywgbmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2UsIGluZGV4KVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy52YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHRoaXMudmFsdWVbaV0gPSAnJyt0aGlzLnZhbHVlW2ldXG4gICAgfVxuICB9XG4sIGlucHV0VHlwZTogJ2NoZWNrYm94J1xufSlcblxuQ2hlY2tib3hDaG9pY2VJbnB1dC5wcm90b3R5cGUuaXNDaGVja2VkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlLmluZGV4T2YodGhpcy5jaG9pY2VWYWx1ZSkgIT09IC0xXG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHVzZWQgYnkgY2hvaWNlIFNlbGVjdHMgdG8gZW5hYmxlIGN1c3RvbWlzYXRpb24gb2YgY2hvaWNlIHdpZGdldHMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyc1xuICogQHBhcmFtIHtib29sZWFufSBjb250cm9sbGVkXG4gKiBAcGFyYW0ge0FycmF5fSBjaG9pY2VzXG4gKi9cbnZhciBDaG9pY2VGaWVsZFJlbmRlcmVyID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBDaG9pY2VGaWVsZFJlbmRlcmVyKG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlcykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDaG9pY2VGaWVsZFJlbmRlcmVyKSkge1xuICAgICAgcmV0dXJuIG5ldyBDaG9pY2VGaWVsZFJlbmRlcmVyKG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlcylcbiAgICB9XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuYXR0cnMgPSBhdHRyc1xuICAgIHRoaXMuY29udHJvbGxlZCA9IGNvbnRyb2xsZWRcbiAgICB0aGlzLmNob2ljZXMgPSBjaG9pY2VzXG4gIH1cbiwgY2hvaWNlSW5wdXRDb25zdHJ1Y3RvcjogbnVsbFxufSlcblxuQ2hvaWNlRmllbGRSZW5kZXJlci5wcm90b3R5cGUuY2hvaWNlSW5wdXRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpbnB1dHMgPSBbXVxuICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuY2hvaWNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpbnB1dHMucHVzaCh0aGlzLmNob2ljZUlucHV0Q29uc3RydWN0b3IodGhpcy5uYW1lLCB0aGlzLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZXh0ZW5kKHt9LCB0aGlzLmF0dHJzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250cm9sbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob2ljZXNbaV0sIGkpKVxuICB9XG4gIHJldHVybiBpbnB1dHNcbn1cblxuQ2hvaWNlRmllbGRSZW5kZXJlci5wcm90b3R5cGUuY2hvaWNlSW5wdXQgPSBmdW5jdGlvbihpKSB7XG4gIGlmIChpID49IHRoaXMuY2hvaWNlcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZGV4IG91dCBvZiBib3VuZHM6ICcgKyBpKVxuICB9XG4gIHJldHVybiB0aGlzLmNob2ljZUlucHV0Q29uc3RydWN0b3IodGhpcy5uYW1lLCB0aGlzLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5leHRlbmQoe30sIHRoaXMuYXR0cnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob2ljZXNbaV0sIGkpXG4gIH1cblxuLyoqXG4gKiBPdXRwdXRzIGEgPHVsPiBmb3IgdGhpcyBzZXQgb2YgY2hvaWNlIGZpZWxkcy5cbiAqIElmIGFuIGlkIHdhcyBnaXZlbiB0byB0aGUgZmllbGQsIGl0IGlzIGFwcGxpZWQgdG8gdGhlIDx1bD4gKGVhY2ggaXRlbSBpbiB0aGVcbiAqIGxpc3Qgd2lsbCBnZXQgYW4gaWQgb2YgYCRpZF8kaWApLlxuICovXG5DaG9pY2VGaWVsZFJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlkID0gb2JqZWN0LmdldCh0aGlzLmF0dHJzLCAnaWQnLCBudWxsKVxuICB2YXIga2V5ID0gb2JqZWN0LnBvcCh0aGlzLmF0dHJzLCAna2V5JywgbnVsbClcbiAgdmFyIGl0ZW1zID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmNob2ljZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGNob2ljZSA9IHRoaXMuY2hvaWNlc1tpXVxuICAgIHZhciBjaG9pY2VWYWx1ZSA9IGNob2ljZVswXVxuICAgIHZhciBjaG9pY2VMYWJlbCA9IGNob2ljZVsxXVxuICAgIGlmIChpcy5BcnJheShjaG9pY2VMYWJlbCkpIHtcbiAgICAgIHZhciBhdHRyc1BsdXMgPSBvYmplY3QuZXh0ZW5kKHt9LCB0aGlzLmF0dHJzKVxuICAgICAgaWYgKGlkKSB7XG4gICAgICAgIGF0dHJzUGx1cy5pZCArPSdfJyArIGlcbiAgICAgIH1cbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgYXR0cnNQbHVzLmtleSArPSAnXycgKyBpXG4gICAgICB9XG4gICAgICB2YXIgc3ViUmVuZGVyZXIgPSBDaG9pY2VGaWVsZFJlbmRlcmVyKHRoaXMubmFtZSwgdGhpcy52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnNQbHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNob2ljZUxhYmVsKVxuICAgICAgc3ViUmVuZGVyZXIuY2hvaWNlSW5wdXRDb25zdHJ1Y3RvciA9IHRoaXMuY2hvaWNlSW5wdXRDb25zdHJ1Y3RvclxuICAgICAgaXRlbXMucHVzaChSZWFjdC5jcmVhdGVFbGVtZW50KCdsaScsIG51bGwsIGNob2ljZVZhbHVlLCBzdWJSZW5kZXJlci5yZW5kZXIoKSkpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFyIHcgPSB0aGlzLmNob2ljZUlucHV0Q29uc3RydWN0b3IodGhpcy5uYW1lLCB0aGlzLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmV4dGVuZCh7fSwgdGhpcy5hdHRycyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaG9pY2UsIGkpXG4gICAgICBpdGVtcy5wdXNoKFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywgbnVsbCwgdy5yZW5kZXIoKSkpXG4gICAgfVxuICB9XG4gIHZhciBsaXN0QXR0cnMgPSB7fVxuICBpZiAoaWQpIHtcbiAgICBsaXN0QXR0cnMuaWQgPSBpZFxuICB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIGxpc3RBdHRycywgaXRlbXMpXG59XG5cbnZhciBSYWRpb0ZpZWxkUmVuZGVyZXIgPSBDaG9pY2VGaWVsZFJlbmRlcmVyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBSYWRpb0ZpZWxkUmVuZGVyZXIobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2VzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJhZGlvRmllbGRSZW5kZXJlcikpIHtcbiAgICAgIHJldHVybiBuZXcgUmFkaW9GaWVsZFJlbmRlcmVyKG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlcylcbiAgICB9XG4gICAgQ2hvaWNlRmllbGRSZW5kZXJlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH1cbiwgY2hvaWNlSW5wdXRDb25zdHJ1Y3RvcjogUmFkaW9DaG9pY2VJbnB1dFxufSlcblxudmFyIENoZWNrYm94RmllbGRSZW5kZXJlciA9IENob2ljZUZpZWxkUmVuZGVyZXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIENoZWNrYm94RmllbGRSZW5kZXJlcihuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZXMpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2hlY2tib3hGaWVsZFJlbmRlcmVyKSkge1xuICAgICAgcmV0dXJuIG5ldyBDaGVja2JveEZpZWxkUmVuZGVyZXIobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2VzKVxuICAgIH1cbiAgICBDaG9pY2VGaWVsZFJlbmRlcmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxuLCBjaG9pY2VJbnB1dENvbnN0cnVjdG9yOiBDaGVja2JveENob2ljZUlucHV0XG59KVxuXG52YXIgUmVuZGVyZXJNaXhpbiA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gUmVuZGVyZXJNaXhpbihrd2FyZ3MpIHtcbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtyZW5kZXJlcjogbnVsbH0sIGt3YXJncylcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCByZW5kZXJlciBpZiB3ZSB3ZXJlIHBhc3NlZCBvbmVcbiAgICBpZiAoa3dhcmdzLnJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnJlbmRlcmVyID0ga3dhcmdzLnJlbmRlcmVyXG4gICAgfVxuICB9XG4sIF9lbXB0eVZhbHVlOiBudWxsXG4sIHZhbGlkYXRpb246IHtvbkNoYW5nZTogdHJ1ZX1cbn0pXG5cblJlbmRlcmVyTWl4aW4ucHJvdG90eXBlLnN1YldpZGdldHMgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIHJldHVybiB0aGlzLmdldFJlbmRlcmVyKG5hbWUsIHZhbHVlLCBrd2FyZ3MpLmNob2ljZUlucHV0cygpXG59XG5cbi8qKlxuICogQHJldHVybiBhbiBpbnN0YW5jZSBvZiB0aGUgcmVuZGVyZXIgdG8gYmUgdXNlZCB0byByZW5kZXIgdGhpcyB3aWRnZXQuXG4gKi9cblJlbmRlcmVyTWl4aW4ucHJvdG90eXBlLmdldFJlbmRlcmVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtjaG9pY2VzOiBbXSwgY29udHJvbGxlZDogZmFsc2V9LCBrd2FyZ3MpXG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgIHZhbHVlID0gdGhpcy5fZW1wdHlWYWx1ZVxuICB9XG4gIHZhciBmaW5hbEF0dHJzID0gdGhpcy5idWlsZEF0dHJzKGt3YXJncy5hdHRycylcbiAgdmFyIGNob2ljZXMgPSB0aGlzLmNob2ljZXMuY29uY2F0KGt3YXJncy5jaG9pY2VzKVxuICByZXR1cm4gbmV3IHRoaXMucmVuZGVyZXIobmFtZSwgdmFsdWUsIGZpbmFsQXR0cnMsIGt3YXJncy5jb250cm9sbGVkLCBjaG9pY2VzKVxufVxuXG5SZW5kZXJlck1peGluLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIHJldHVybiB0aGlzLmdldFJlbmRlcmVyKG5hbWUsIHZhbHVlLCBrd2FyZ3MpLnJlbmRlcigpXG59XG5cbi8qKlxuICogV2lkZ2V0cyB1c2luZyB0aGlzIFJlbmRlcmVyTWl4aW4gYXJlIG1hZGUgb2YgYSBjb2xsZWN0aW9uIG9mIHN1YndpZGdldHMsIGVhY2hcbiAqIHdpdGggdGhlaXIgb3duIDxsYWJlbD4sIGFuZCBkaXN0aW5jdCBJRC5cbiAqIFRoZSBJRHMgYXJlIG1hZGUgZGlzdGluY3QgYnkgeSBcIl9YXCIgc3VmZml4LCB3aGVyZSBYIGlzIHRoZSB6ZXJvLWJhc2VkIGluZGV4XG4gKiBvZiB0aGUgY2hvaWNlIGZpZWxkLiBUaHVzLCB0aGUgbGFiZWwgZm9yIHRoZSBtYWluIHdpZGdldCBzaG91bGQgcmVmZXJlbmNlIHRoZVxuICogZmlyc3Qgc3Vid2lkZ2V0LCBoZW5jZSB0aGUgXCJfMFwiIHN1ZmZpeC5cbiAqL1xuUmVuZGVyZXJNaXhpbi5wcm90b3R5cGUuaWRGb3JMYWJlbCA9IGZ1bmN0aW9uKGlkKSB7XG4gIGlmIChpZCkge1xuICAgIGlkICs9ICdfMCdcbiAgfVxuICByZXR1cm4gaWRcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgc2luZ2xlIHNlbGVjdCBhcyBhIGxpc3Qgb2YgPGlucHV0IHR5cGU9XCJyYWRpb1wiPiBlbGVtZW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1NlbGVjdH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBSYWRpb1NlbGVjdCA9IFNlbGVjdC5leHRlbmQoe1xuICBfX21peGluc19fOiBbUmVuZGVyZXJNaXhpbl1cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSYWRpb1NlbGVjdCkpIHsgcmV0dXJuIG5ldyBSYWRpb1NlbGVjdChrd2FyZ3MpIH1cbiAgICBSZW5kZXJlck1peGluLmNhbGwodGhpcywga3dhcmdzKVxuICAgIFNlbGVjdC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCByZW5kZXJlcjogUmFkaW9GaWVsZFJlbmRlcmVyXG4sIF9lbXB0eVZhbHVlOiAnJ1xufSlcblxuLyoqXG4gKiBNdWx0aXBsZSBzZWxlY3Rpb25zIHJlcHJlc2VudGVkIGFzIGEgbGlzdCBvZiA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+IHdpZGdldHMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtTZWxlY3RNdWx0aXBsZX1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBDaGVja2JveFNlbGVjdE11bHRpcGxlID0gU2VsZWN0TXVsdGlwbGUuZXh0ZW5kKHtcbiAgX19taXhpbnNfXzogW1JlbmRlcmVyTWl4aW5dXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2hlY2tib3hTZWxlY3RNdWx0aXBsZSkpIHsgcmV0dXJuIG5ldyBDaGVja2JveFNlbGVjdE11bHRpcGxlKGt3YXJncykgfVxuICAgIFJlbmRlcmVyTWl4aW4uY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgU2VsZWN0TXVsdGlwbGUuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbiwgcmVuZGVyZXI6IENoZWNrYm94RmllbGRSZW5kZXJlclxuLCBfZW1wdHlWYWx1ZTogW11cbn0pXG5cbi8qKlxuICogQSB3aWRnZXQgdGhhdCBpcyBjb21wb3NlZCBvZiBtdWx0aXBsZSB3aWRnZXRzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7V2lkZ2V0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIE11bHRpV2lkZ2V0ID0gV2lkZ2V0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBNdWx0aVdpZGdldCh3aWRnZXRzLCBrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IE11bHRpV2lkZ2V0KHdpZGdldHMsIGt3YXJncykgfVxuICAgIHRoaXMud2lkZ2V0cyA9IFtdXG4gICAgdmFyIG5lZWRzTXVsdGlwYXJ0Rm9ybSA9IGZhbHNlXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB3aWRnZXRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHdpZGdldCA9IHdpZGdldHNbaV0gaW5zdGFuY2VvZiBXaWRnZXQgPyB3aWRnZXRzW2ldIDogbmV3IHdpZGdldHNbaV0oKVxuICAgICAgaWYgKHdpZGdldC5uZWVkc011bHRpcGFydEZvcm0pIHtcbiAgICAgICAgbmVlZHNNdWx0aXBhcnRGb3JtID0gdHJ1ZVxuICAgICAgfVxuICAgICAgdGhpcy53aWRnZXRzLnB1c2god2lkZ2V0KVxuICAgIH1cbiAgICB0aGlzLm5lZWRzTXVsdGlwYXJ0Rm9ybSA9IG5lZWRzTXVsdGlwYXJ0Rm9ybVxuICAgIFdpZGdldC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBkaWZmZXJlbnQgdGhhbiBvdGhlciB3aWRnZXRzJywgYmVjYXVzZSBpdCBoYXMgdG8gZmlndXJlIG91dFxuICogaG93IHRvIHNwbGl0IGEgc2luZ2xlIHZhbHVlIGZvciBkaXNwbGF5IGluIG11bHRpcGxlIHdpZGdldHMuXG4gKlxuICogSWYgdGhlIGdpdmVuIHZhbHVlIGlzIE5PVCBhIGxpc3QsIGl0IHdpbGwgZmlyc3QgYmUgXCJkZWNvbXByZXNzZWRcIiBpbnRvIGEgbGlzdFxuICogYmVmb3JlIGl0IGlzIHJlbmRlcmVkIGJ5IGNhbGxpbmcgdGhlICBNdWx0aVdpZGdldCNkZWNvbXByZXNzIGZ1bmN0aW9uLlxuICpcbiAqIEVhY2ggdmFsdWUgaW4gdGhlIGxpc3QgaXMgcmVuZGVyZWQgIHdpdGggdGhlIGNvcnJlc3BvbmRpbmcgd2lkZ2V0IC0tIHRoZVxuICogZmlyc3QgdmFsdWUgaXMgcmVuZGVyZWQgaW4gdGhlIGZpcnN0IHdpZGdldCwgdGhlIHNlY29uZCB2YWx1ZSBpcyByZW5kZXJlZCBpblxuICogdGhlIHNlY29uZCB3aWRnZXQsIGFuZCBzbyBvbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZmllbGQgbmFtZS5cbiAqIEBwYXJhbSB7KGFycmF5LjwqPnwqKX0gdmFsdWUgYSBsaXN0IG9mIHZhbHVlcywgb3IgYSBub3JtYWwgdmFsdWUgKGUuZy4sIGEgU3RyaW5nIHRoYXQgaGFzXG4gKiAgIGJlZW4gXCJjb21wcmVzc2VkXCIgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzKS5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIHJlbmRlcmluZyBvcHRpb25zLlxuICogQHJldHVybiBhIHJlbmRlcmVkIGNvbGxlY3Rpb24gb2Ygd2lkZ2V0cy5cbiAqL1xuTXVsdGlXaWRnZXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7fSwga3dhcmdzKVxuICBpZiAoIShpcy5BcnJheSh2YWx1ZSkpKSB7XG4gICAgdmFsdWUgPSB0aGlzLmRlY29tcHJlc3ModmFsdWUpXG4gIH1cbiAgdmFyIGZpbmFsQXR0cnMgPSB0aGlzLmJ1aWxkQXR0cnMoa3dhcmdzLmF0dHJzLCB7J2RhdGEtbmV3Zm9ybXMtZmllbGQnOiBuYW1lfSlcbiAgdmFyIGlkID0gb2JqZWN0LmdldChmaW5hbEF0dHJzLCAnaWQnLCBudWxsKVxuICB2YXIga2V5ID0gb2JqZWN0LmdldChmaW5hbEF0dHJzLCAna2V5JywgbnVsbClcbiAgdmFyIHJlbmRlcmVkV2lkZ2V0cyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy53aWRnZXRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldHNbaV1cbiAgICB2YXIgd2lkZ2V0VmFsdWUgPSBudWxsXG4gICAgaWYgKHR5cGVvZiB2YWx1ZVtpXSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgd2lkZ2V0VmFsdWUgPSB2YWx1ZVtpXVxuICAgIH1cbiAgICBpZiAoaWQpIHtcbiAgICAgIGZpbmFsQXR0cnMuaWQgPSBpZCArICdfJyArIGlcbiAgICB9XG4gICAgaWYgKGtleSkge1xuICAgICAgZmluYWxBdHRycy5rZXkgPSBrZXkgKyAnXycgKyBpXG4gICAgfVxuICAgIHJlbmRlcmVkV2lkZ2V0cy5wdXNoKFxuICAgICAgICB3aWRnZXQucmVuZGVyKG5hbWUgKyAnXycgKyBpLCB3aWRnZXRWYWx1ZSwge2F0dHJzOiBmaW5hbEF0dHJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZWQ6IGt3YXJncy5jb250cm9sbGVkfSkpXG4gIH1cbiAgcmV0dXJuIHRoaXMuZm9ybWF0T3V0cHV0KHJlbmRlcmVkV2lkZ2V0cylcbn1cblxuTXVsdGlXaWRnZXQucHJvdG90eXBlLmlkRm9yTGFiZWwgPSBmdW5jdGlvbihpZCkge1xuICBpZiAoaWQpIHtcbiAgICBpZCArPSAnXzAnXG4gIH1cbiAgcmV0dXJuIGlkXG59XG5cbk11bHRpV2lkZ2V0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhID0gZnVuY3Rpb24oZGF0YSwgZmlsZXMsIG5hbWUpIHtcbiAgdmFyIHZhbHVlcyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy53aWRnZXRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhbHVlc1tpXSA9IHRoaXMud2lkZ2V0c1tpXS52YWx1ZUZyb21EYXRhKGRhdGEsIGZpbGVzLCBuYW1lICsgJ18nICsgaSlcbiAgfVxuICByZXR1cm4gdmFsdWVzXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbGVtZW50IGNvbnRhaW5pbmcgYSBnaXZlbiBsaXN0IG9mIHJlbmRlcmVkIHdpZGdldHMuXG4gKlxuICogVGhpcyBob29rIGFsbG93cyB5b3UgdG8gZm9ybWF0IHRoZSBIVE1MIGRlc2lnbiBvZiB0aGUgd2lkZ2V0cywgaWYgbmVlZGVkLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHJlbmRlcmVkV2lkZ2V0cyBhIGxpc3Qgb2YgcmVuZGVyZWQgd2lkZ2V0cy5cbiAqIEByZXR1cm4gYSA8ZGl2PiBjb250YWluaW5nIHRoZSByZW5kZXJlZCB3aWRnZXRzLlxuICovXG5NdWx0aVdpZGdldC5wcm90b3R5cGUuZm9ybWF0T3V0cHV0ID0gZnVuY3Rpb24ocmVuZGVyZWRXaWRnZXRzKSB7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCBudWxsLCByZW5kZXJlZFdpZGdldHMpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxpc3Qgb2YgZGVjb21wcmVzc2VkIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGNvbXByZXNzZWQgdmFsdWUuXG4gKiBAYWJzdHJhY3RcbiAqIEBwYXJhbSB2YWx1ZSBhIGNvbXByZXNzZWQgdmFsdWUsIHdoaWNoIGNhbiBiZSBhc3N1bWVkIHRvIGJlIHZhbGlkLCBidXQgbm90XG4gKiAgIG5lY2Vzc2FyaWx5IG5vbi1lbXB0eS5cbiAqIEByZXR1cm4gYSBsaXN0IG9mIGRlY29tcHJlc3NlZCB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBjb21wcmVzc2VkIHZhbHVlLlxuICovXG5NdWx0aVdpZGdldC5wcm90b3R5cGUuZGVjb21wcmVzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHRocm93IG5ldyBFcnJvcignTXVsdGlXaWRnZXQgc3ViY2xhc3NlcyBtdXN0IGltcGxlbWVudCBhIGRlY29tcHJlc3MoKSBtZXRob2QuJylcbn1cblxuLyoqXG4gKiBTcGxpdHMgRGF0ZSBpbnB1dCBpbnRvIHR3byA8aW5wdXQgdHlwZT1cInRleHRcIj4gZWxlbWVudHMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtNdWx0aVdpZGdldH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBTcGxpdERhdGVUaW1lV2lkZ2V0ID0gTXVsdGlXaWRnZXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFNwbGl0RGF0ZVRpbWVXaWRnZXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBTcGxpdERhdGVUaW1lV2lkZ2V0KGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2RhdGVGb3JtYXQ6IG51bGwsIHRpbWVGb3JtYXQ6IG51bGx9LCBrd2FyZ3MpXG4gICAgdmFyIHdpZGdldHMgPSBbXG4gICAgICBEYXRlSW5wdXQoe2F0dHJzOiBrd2FyZ3MuYXR0cnMsIGZvcm1hdDoga3dhcmdzLmRhdGVGb3JtYXR9KVxuICAgICwgVGltZUlucHV0KHthdHRyczoga3dhcmdzLmF0dHJzLCBmb3JtYXQ6IGt3YXJncy50aW1lRm9ybWF0fSlcbiAgICBdXG4gICAgTXVsdGlXaWRnZXQuY2FsbCh0aGlzLCB3aWRnZXRzLCBrd2FyZ3MuYXR0cnMpXG4gIH1cbn0pXG5cblNwbGl0RGF0ZVRpbWVXaWRnZXQucHJvdG90eXBlLmRlY29tcHJlc3MgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgbmV3IERhdGUodmFsdWUuZ2V0RnVsbFllYXIoKSwgdmFsdWUuZ2V0TW9udGgoKSwgdmFsdWUuZ2V0RGF0ZSgpKVxuICAgICwgbmV3IERhdGUoMTkwMCwgMCwgMSwgdmFsdWUuZ2V0SG91cnMoKSwgdmFsdWUuZ2V0TWludXRlcygpLCB2YWx1ZS5nZXRTZWNvbmRzKCkpXG4gICAgXVxuICB9XG4gIHJldHVybiBbbnVsbCwgbnVsbF1cbn1cblxuLyoqXG4gKiBTcGxpdHMgRGF0ZSBpbnB1dCBpbnRvIHR3byA8aW5wdXQgdHlwZT1cImhpZGRlblwiPiBlbGVtZW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1NwbGl0RGF0ZVRpbWVXaWRnZXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgU3BsaXRIaWRkZW5EYXRlVGltZVdpZGdldCA9IFNwbGl0RGF0ZVRpbWVXaWRnZXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFNwbGl0SGlkZGVuRGF0ZVRpbWVXaWRnZXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBTcGxpdEhpZGRlbkRhdGVUaW1lV2lkZ2V0KGt3YXJncykgfVxuICAgIFNwbGl0RGF0ZVRpbWVXaWRnZXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLndpZGdldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0aGlzLndpZGdldHNbaV0uaW5wdXRUeXBlID0gJ2hpZGRlbidcbiAgICAgIHRoaXMud2lkZ2V0c1tpXS5pc0hpZGRlbiA9IHRydWVcbiAgICB9XG4gIH1cbiwgaXNIaWRkZW46IHRydWVcbn0pXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBTdWJXaWRnZXQ6IFN1YldpZGdldFxuLCBXaWRnZXQ6IFdpZGdldFxuLCBJbnB1dDogSW5wdXRcbiwgVGV4dElucHV0OiBUZXh0SW5wdXRcbiwgTnVtYmVySW5wdXQ6IE51bWJlcklucHV0XG4sIEVtYWlsSW5wdXQ6IEVtYWlsSW5wdXRcbiwgVVJMSW5wdXQ6IFVSTElucHV0XG4sIFBhc3N3b3JkSW5wdXQ6IFBhc3N3b3JkSW5wdXRcbiwgSGlkZGVuSW5wdXQ6IEhpZGRlbklucHV0XG4sIE11bHRpcGxlSGlkZGVuSW5wdXQ6IE11bHRpcGxlSGlkZGVuSW5wdXRcbiwgRmlsZUlucHV0OiBGaWxlSW5wdXRcbiwgRklMRV9JTlBVVF9DT05UUkFESUNUSU9OOiBGSUxFX0lOUFVUX0NPTlRSQURJQ1RJT05cbiwgQ2xlYXJhYmxlRmlsZUlucHV0OiBDbGVhcmFibGVGaWxlSW5wdXRcbiwgVGV4dGFyZWE6IFRleHRhcmVhXG4sIERhdGVJbnB1dDogRGF0ZUlucHV0XG4sIERhdGVUaW1lSW5wdXQ6IERhdGVUaW1lSW5wdXRcbiwgVGltZUlucHV0OiBUaW1lSW5wdXRcbiwgQ2hlY2tib3hJbnB1dDogQ2hlY2tib3hJbnB1dFxuLCBTZWxlY3Q6IFNlbGVjdFxuLCBOdWxsQm9vbGVhblNlbGVjdDogTnVsbEJvb2xlYW5TZWxlY3RcbiwgU2VsZWN0TXVsdGlwbGU6IFNlbGVjdE11bHRpcGxlXG4sIENob2ljZUlucHV0OiBDaG9pY2VJbnB1dFxuLCBSYWRpb0Nob2ljZUlucHV0OiBSYWRpb0Nob2ljZUlucHV0XG4sIENoZWNrYm94Q2hvaWNlSW5wdXQ6IENoZWNrYm94Q2hvaWNlSW5wdXRcbiwgQ2hvaWNlRmllbGRSZW5kZXJlcjogQ2hvaWNlRmllbGRSZW5kZXJlclxuLCBSZW5kZXJlck1peGluOiBSZW5kZXJlck1peGluXG4sIFJhZGlvRmllbGRSZW5kZXJlcjogUmFkaW9GaWVsZFJlbmRlcmVyXG4sIENoZWNrYm94RmllbGRSZW5kZXJlcjogQ2hlY2tib3hGaWVsZFJlbmRlcmVyXG4sIFJhZGlvU2VsZWN0OiBSYWRpb1NlbGVjdFxuLCBDaGVja2JveFNlbGVjdE11bHRpcGxlOiBDaGVja2JveFNlbGVjdE11bHRpcGxlXG4sIE11bHRpV2lkZ2V0OiBNdWx0aVdpZGdldFxuLCBTcGxpdERhdGVUaW1lV2lkZ2V0OiBTcGxpdERhdGVUaW1lV2lkZ2V0XG4sIFNwbGl0SGlkZGVuRGF0ZVRpbWVXaWRnZXQ6IFNwbGl0SGlkZGVuRGF0ZVRpbWVXaWRnZXRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblxuZnVuY3Rpb24gdHlwZShvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKVxufVxuXG5mdW5jdGlvbiBpbmhlcml0cyhjaGlsZENvbnN0cnVjdG9yLCBwYXJlbnRDb25zdHJ1Y3Rvcikge1xuICB2YXIgRiA9IGZ1bmN0aW9uKCkge31cbiAgRi5wcm90b3R5cGUgPSBwYXJlbnRDb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgY2hpbGRDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBuZXcgRigpXG4gIGNoaWxkQ29uc3RydWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY2hpbGRDb25zdHJ1Y3RvclxuICByZXR1cm4gY2hpbGRDb25zdHJ1Y3RvclxufVxuXG5mdW5jdGlvbiBleHRlbmQoZGVzdCwgc3JjKSB7XG4gIGZvciAodmFyIHByb3AgaW4gc3JjKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKHNyYywgcHJvcCkpIHtcbiAgICAgIGRlc3RbcHJvcF0gPSBzcmNbcHJvcF1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlc3Rcbn1cblxuLyoqXG4gKiBNaXhlcyBpbiBwcm9wZXJ0aWVzIGZyb20gb25lIG9iamVjdCB0byBhbm90aGVyLiBJZiB0aGUgc291cmNlIG9iamVjdCBpcyBhXG4gKiBGdW5jdGlvbiwgaXRzIHByb3RvdHlwZSBpcyBtaXhlZCBpbiBpbnN0ZWFkLlxuICovXG5mdW5jdGlvbiBtaXhpbihkZXN0LCBzcmMpIHtcbiAgaWYgKHR5cGUoc3JjKSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgZXh0ZW5kKGRlc3QsIHNyYy5wcm90b3R5cGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgZXh0ZW5kKGRlc3QsIHNyYylcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgbWl4aW5zIHNwZWNpZmllZCBhcyBhIF9fbWl4aW5zX18gcHJvcGVydHkgb24gdGhlIGdpdmVuIHByb3BlcnRpZXNcbiAqIG9iamVjdCwgcmV0dXJuaW5nIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBtaXhlZCBpbiBwcm9wZXJ0aWVzLlxuICovXG5mdW5jdGlvbiBhcHBseU1peGlucyhwcm9wZXJ0aWVzKSB7XG4gIHZhciBtaXhpbnMgPSBwcm9wZXJ0aWVzLl9fbWl4aW5zX19cbiAgaWYgKHR5cGUobWl4aW5zKSAhPSAnYXJyYXknKSB7XG4gICAgbWl4aW5zID0gW21peGluc11cbiAgfVxuICB2YXIgbWl4ZWRQcm9wZXJ0aWVzID0ge31cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBtaXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgbWl4aW4obWl4ZWRQcm9wZXJ0aWVzLCBtaXhpbnNbaV0pXG4gIH1cbiAgZGVsZXRlIHByb3BlcnRpZXMuX19taXhpbnNfX1xuICByZXR1cm4gZXh0ZW5kKG1peGVkUHJvcGVydGllcywgcHJvcGVydGllcylcbn1cblxuLyoqXG4gKiBJbmhlcml0cyBhbm90aGVyIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlIGFuZCBzZXRzIGl0cyBwcm90b3R5cGUgYW5kXG4gKiBjb25zdHJ1Y3RvciBwcm9wZXJ0aWVzIGluIG9uZSBmZWxsIHN3b29wLlxuICpcbiAqIElmIGEgY2hpbGQgY29uc3RydWN0b3IgaXMgbm90IHByb3ZpZGVkIHZpYSBwcm90b3R5cGVQcm9wcy5jb25zdHJ1Y3RvcixcbiAqIGEgbmV3IGNvbnN0cnVjdG9yIHdpbGwgYmUgY3JlYXRlZC5cbiAqL1xuZnVuY3Rpb24gaW5oZXJpdEZyb20ocGFyZW50Q29uc3RydWN0b3IsIGNoaWxkQ29uc3RydWN0b3IsIHByb3RvdHlwZVByb3BzLCBjb25zdHJ1Y3RvclByb3BzKSB7XG4gIC8vIENyZWF0ZSBhIGNoaWxkIGNvbnN0cnVjdG9yIGlmIG9uZSB3YXNuJ3QgZ2l2ZW5cbiAgaWYgKGNoaWxkQ29uc3RydWN0b3IgPT0gbnVsbCkge1xuICAgIGNoaWxkQ29uc3RydWN0b3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHBhcmVudENvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cblxuICAvLyBNYWtlIHN1cmUgdGhlIG5ldyBwcm90b3R5cGUgaGFzIHRoZSBjb3JyZWN0IGNvbnN0cnVjdG9yIHNldCB1cFxuICBwcm90b3R5cGVQcm9wcy5jb25zdHJ1Y3RvciA9IGNoaWxkQ29uc3RydWN0b3JcblxuICAvLyBCYXNlIGNvbnN0cnVjdG9ycyBzaG91bGQgb25seSBoYXZlIHRoZSBwcm9wZXJ0aWVzIHRoZXkncmUgZGVmaW5lZCB3aXRoXG4gIGlmIChwYXJlbnRDb25zdHJ1Y3RvciAhPT0gQ29uY3VyKSB7XG4gICAgLy8gSW5oZXJpdCB0aGUgcGFyZW50J3MgcHJvdG90eXBlXG4gICAgaW5oZXJpdHMoY2hpbGRDb25zdHJ1Y3RvciwgcGFyZW50Q29uc3RydWN0b3IpXG4gICAgY2hpbGRDb25zdHJ1Y3Rvci5fX3N1cGVyX18gPSBwYXJlbnRDb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgfVxuXG4gIC8vIEFkZCBwcm90b3R5cGUgcHJvcGVydGllcyAtIHRoaXMgaXMgd2h5IHdlIHRvb2sgYSBjb3B5IG9mIHRoZSBjaGlsZFxuICAvLyBjb25zdHJ1Y3RvciByZWZlcmVuY2UgaW4gZXh0ZW5kKCkgLSBpZiBhIC5jb25zdHJ1Y3RvciBoYWQgYmVlbiBwYXNzZWQgYXMgYVxuICAvLyBfX21peGluc19fIGFuZCBvdmVyaXR0ZW4gcHJvdG90eXBlUHJvcHMuY29uc3RydWN0b3IsIHRoZXNlIHByb3BlcnRpZXMgd291bGRcbiAgLy8gYmUgZ2V0dGluZyBzZXQgb24gdGhlIG1peGVkLWluIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlLlxuICBleHRlbmQoY2hpbGRDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvdHlwZVByb3BzKVxuXG4gIC8vIEFkZCBjb25zdHJ1Y3RvciBwcm9wZXJ0aWVzXG4gIGV4dGVuZChjaGlsZENvbnN0cnVjdG9yLCBjb25zdHJ1Y3RvclByb3BzKVxuXG4gIHJldHVybiBjaGlsZENvbnN0cnVjdG9yXG59XG5cbi8qKlxuICogTmFtZXNwYWNlIGFuZCBkdW1teSBjb25zdHJ1Y3RvciBmb3IgaW5pdGlhbCBleHRlbnNpb24uXG4gKi9cbnZhciBDb25jdXIgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge31cblxuLyoqXG4gKiBEZXRhaWxzIG9mIGEgY29uc3RydWN0b3IncyBpbmhlcml0YW5jZSBjaGFpbiAtIENvbmN1ciBqdXN0IGZhY2lsaXRhdGVzIHN1Z2FyXG4gKiBzbyB3ZSBkb24ndCBpbmNsdWRlIGl0IGluIHRoZSBpbml0aWFsIGNoYWluLiBBcmd1YWJseSwgT2JqZWN0LnByb3RvdHlwZSBjb3VsZFxuICogZ28gaGVyZSwgYnV0IGl0J3MganVzdCBub3QgdGhhdCBpbnRlcmVzdGluZy5cbiAqL1xuQ29uY3VyLl9fbXJvX18gPSBbXVxuXG4vKipcbiAqIENyZWF0ZXMgb3IgdXNlcyBhIGNoaWxkIGNvbnN0cnVjdG9yIHRvIGluaGVyaXQgZnJvbSB0aGUgdGhlIGNhbGxcbiAqIGNvbnRleHQsIHdoaWNoIGlzIGV4cGVjdGVkIHRvIGJlIGEgY29uc3RydWN0b3IuXG4gKi9cbkNvbmN1ci5leHRlbmQgPSBmdW5jdGlvbihwcm90b3R5cGVQcm9wcywgY29uc3RydWN0b3JQcm9wcykge1xuICAvLyBFbnN1cmUgd2UgaGF2ZSBwcm9wIG9iamVjdHMgdG8gd29yayB3aXRoXG4gIHByb3RvdHlwZVByb3BzID0gcHJvdG90eXBlUHJvcHMgfHwge31cbiAgY29uc3RydWN0b3JQcm9wcyA9IGNvbnN0cnVjdG9yUHJvcHMgfHwge31cblxuICAvLyBJZiB0aGUgY29uc3RydWN0b3IgYmVpbmcgaW5oZXJpdGVkIGZyb20gaGFzIGEgX19tZXRhX18gZnVuY3Rpb24gc29tZXdoZXJlXG4gIC8vIGluIGl0cyBwcm90b3R5cGUgY2hhaW4sIGNhbGwgaXQgdG8gY3VzdG9taXNlIHByb3RvdHlwZSBhbmQgY29uc3RydWN0b3JcbiAgLy8gcHJvcGVydGllcyBiZWZvcmUgdGhleSdyZSB1c2VkIHRvIHNldCB1cCB0aGUgbmV3IGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlLlxuICBpZiAodHlwZW9mIHRoaXMucHJvdG90eXBlLl9fbWV0YV9fICE9ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5wcm90b3R5cGUuX19tZXRhX18ocHJvdG90eXBlUHJvcHMsIGNvbnN0cnVjdG9yUHJvcHMpXG4gIH1cblxuICAvLyBBbnkgY2hpbGQgY29uc3RydWN0b3IgcGFzc2VkIGluIHNob3VsZCB0YWtlIHByZWNlZGVuY2UgLSBncmFiIGEgcmVmZXJlbmNlXG4gIC8vIHRvIGl0IGJlZm9lciB3ZSBhcHBseSBhbnkgbWl4aW5zLlxuICB2YXIgY2hpbGRDb25zdHJ1Y3RvciA9IChoYXNPd24uY2FsbChwcm90b3R5cGVQcm9wcywgJ2NvbnN0cnVjdG9yJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyBwcm90b3R5cGVQcm9wcy5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bGwpXG5cbiAgLy8gSWYgYW55IG1peGlucyBhcmUgc3BlY2lmaWVkLCBtaXggdGhlbSBpbnRvIHRoZSBwcm9wZXJ0eSBvYmplY3RzXG4gIGlmIChoYXNPd24uY2FsbChwcm90b3R5cGVQcm9wcywgJ19fbWl4aW5zX18nKSkge1xuICAgIHByb3RvdHlwZVByb3BzID0gYXBwbHlNaXhpbnMocHJvdG90eXBlUHJvcHMpXG4gIH1cbiAgaWYgKGhhc093bi5jYWxsKGNvbnN0cnVjdG9yUHJvcHMsICdfX21peGluc19fJykpIHtcbiAgICBjb25zdHJ1Y3RvclByb3BzID0gYXBwbHlNaXhpbnMoY29uc3RydWN0b3JQcm9wcylcbiAgfVxuXG4gIC8vIFNldCB1cCB0aGUgbmV3IGNoaWxkIGNvbnN0cnVjdG9yIGFuZCBpdHMgcHJvdG90eXBlXG4gIGNoaWxkQ29uc3RydWN0b3IgPSBpbmhlcml0RnJvbSh0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRDb25zdHJ1Y3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZVByb3BzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RydWN0b3JQcm9wcylcblxuICAvLyBQYXNzIG9uIHRoZSBleHRlbmQgZnVuY3Rpb24gZm9yIGV4dGVuc2lvbiBpbiB0dXJuXG4gIGNoaWxkQ29uc3RydWN0b3IuZXh0ZW5kID0gdGhpcy5leHRlbmRcblxuICAvLyBFeHBvc2UgdGhlIGluaGVyaXRhbmNlIGNoYWluIGZvciBwcm9ncmFtbWF0aWMgYWNjZXNzXG4gIGNoaWxkQ29uc3RydWN0b3IuX19tcm9fXyA9IFtjaGlsZENvbnN0cnVjdG9yXS5jb25jYXQodGhpcy5fX21yb19fKVxuXG4gIHJldHVybiBjaGlsZENvbnN0cnVjdG9yXG59XG4iLCIvKiEgaHR0cDovL210aHMuYmUvcHVueWNvZGUgdjEuMi40IGJ5IEBtYXRoaWFzICovXG47KGZ1bmN0aW9uKHJvb3QpIHtcblxuXHQvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGVzICovXG5cdHZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHM7XG5cdHZhciBmcmVlTW9kdWxlID0gdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiZcblx0XHRtb2R1bGUuZXhwb3J0cyA9PSBmcmVlRXhwb3J0cyAmJiBtb2R1bGU7XG5cdHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWw7XG5cdGlmIChmcmVlR2xvYmFsLmdsb2JhbCA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsLndpbmRvdyA9PT0gZnJlZUdsb2JhbCkge1xuXHRcdHJvb3QgPSBmcmVlR2xvYmFsO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcHVueWNvZGVgIG9iamVjdC5cblx0ICogQG5hbWUgcHVueWNvZGVcblx0ICogQHR5cGUgT2JqZWN0XG5cdCAqL1xuXHR2YXIgcHVueWNvZGUsXG5cblx0LyoqIEhpZ2hlc3QgcG9zaXRpdmUgc2lnbmVkIDMyLWJpdCBmbG9hdCB2YWx1ZSAqL1xuXHRtYXhJbnQgPSAyMTQ3NDgzNjQ3LCAvLyBha2EuIDB4N0ZGRkZGRkYgb3IgMl4zMS0xXG5cblx0LyoqIEJvb3RzdHJpbmcgcGFyYW1ldGVycyAqL1xuXHRiYXNlID0gMzYsXG5cdHRNaW4gPSAxLFxuXHR0TWF4ID0gMjYsXG5cdHNrZXcgPSAzOCxcblx0ZGFtcCA9IDcwMCxcblx0aW5pdGlhbEJpYXMgPSA3Mixcblx0aW5pdGlhbE4gPSAxMjgsIC8vIDB4ODBcblx0ZGVsaW1pdGVyID0gJy0nLCAvLyAnXFx4MkQnXG5cblx0LyoqIFJlZ3VsYXIgZXhwcmVzc2lvbnMgKi9cblx0cmVnZXhQdW55Y29kZSA9IC9eeG4tLS8sXG5cdHJlZ2V4Tm9uQVNDSUkgPSAvW14gLX5dLywgLy8gdW5wcmludGFibGUgQVNDSUkgY2hhcnMgKyBub24tQVNDSUkgY2hhcnNcblx0cmVnZXhTZXBhcmF0b3JzID0gL1xceDJFfFxcdTMwMDJ8XFx1RkYwRXxcXHVGRjYxL2csIC8vIFJGQyAzNDkwIHNlcGFyYXRvcnNcblxuXHQvKiogRXJyb3IgbWVzc2FnZXMgKi9cblx0ZXJyb3JzID0ge1xuXHRcdCdvdmVyZmxvdyc6ICdPdmVyZmxvdzogaW5wdXQgbmVlZHMgd2lkZXIgaW50ZWdlcnMgdG8gcHJvY2VzcycsXG5cdFx0J25vdC1iYXNpYyc6ICdJbGxlZ2FsIGlucHV0ID49IDB4ODAgKG5vdCBhIGJhc2ljIGNvZGUgcG9pbnQpJyxcblx0XHQnaW52YWxpZC1pbnB1dCc6ICdJbnZhbGlkIGlucHV0J1xuXHR9LFxuXG5cdC8qKiBDb252ZW5pZW5jZSBzaG9ydGN1dHMgKi9cblx0YmFzZU1pbnVzVE1pbiA9IGJhc2UgLSB0TWluLFxuXHRmbG9vciA9IE1hdGguZmxvb3IsXG5cdHN0cmluZ0Zyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXG5cblx0LyoqIFRlbXBvcmFyeSB2YXJpYWJsZSAqL1xuXHRrZXk7XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJpYyBlcnJvciB1dGlsaXR5IGZ1bmN0aW9uLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgZXJyb3IgdHlwZS5cblx0ICogQHJldHVybnMge0Vycm9yfSBUaHJvd3MgYSBgUmFuZ2VFcnJvcmAgd2l0aCB0aGUgYXBwbGljYWJsZSBlcnJvciBtZXNzYWdlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZXJyb3IodHlwZSkge1xuXHRcdHRocm93IFJhbmdlRXJyb3IoZXJyb3JzW3R5cGVdKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgYEFycmF5I21hcGAgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5IGFycmF5XG5cdCAqIGl0ZW0uXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcChhcnJheSwgZm4pIHtcblx0XHR2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXHRcdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdFx0YXJyYXlbbGVuZ3RoXSA9IGZuKGFycmF5W2xlbmd0aF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJyYXk7XG5cdH1cblxuXHQvKipcblx0ICogQSBzaW1wbGUgYEFycmF5I21hcGAtbGlrZSB3cmFwcGVyIHRvIHdvcmsgd2l0aCBkb21haW4gbmFtZSBzdHJpbmdzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5XG5cdCAqIGNoYXJhY3Rlci5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBzdHJpbmcgb2YgY2hhcmFjdGVycyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2tcblx0ICogZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXBEb21haW4oc3RyaW5nLCBmbikge1xuXHRcdHJldHVybiBtYXAoc3RyaW5nLnNwbGl0KHJlZ2V4U2VwYXJhdG9ycyksIGZuKS5qb2luKCcuJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIHRoZSBudW1lcmljIGNvZGUgcG9pbnRzIG9mIGVhY2ggVW5pY29kZVxuXHQgKiBjaGFyYWN0ZXIgaW4gdGhlIHN0cmluZy4gV2hpbGUgSmF2YVNjcmlwdCB1c2VzIFVDUy0yIGludGVybmFsbHksXG5cdCAqIHRoaXMgZnVuY3Rpb24gd2lsbCBjb252ZXJ0IGEgcGFpciBvZiBzdXJyb2dhdGUgaGFsdmVzIChlYWNoIG9mIHdoaWNoXG5cdCAqIFVDUy0yIGV4cG9zZXMgYXMgc2VwYXJhdGUgY2hhcmFjdGVycykgaW50byBhIHNpbmdsZSBjb2RlIHBvaW50LFxuXHQgKiBtYXRjaGluZyBVVEYtMTYuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZW5jb2RlYFxuXHQgKiBAc2VlIDxodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBkZWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZyBUaGUgVW5pY29kZSBpbnB1dCBzdHJpbmcgKFVDUy0yKS5cblx0ICogQHJldHVybnMge0FycmF5fSBUaGUgbmV3IGFycmF5IG9mIGNvZGUgcG9pbnRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmRlY29kZShzdHJpbmcpIHtcblx0XHR2YXIgb3V0cHV0ID0gW10sXG5cdFx0ICAgIGNvdW50ZXIgPSAwLFxuXHRcdCAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuXHRcdCAgICB2YWx1ZSxcblx0XHQgICAgZXh0cmE7XG5cdFx0d2hpbGUgKGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdHZhbHVlID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRcdGlmICh2YWx1ZSA+PSAweEQ4MDAgJiYgdmFsdWUgPD0gMHhEQkZGICYmIGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdFx0Ly8gaGlnaCBzdXJyb2dhdGUsIGFuZCB0aGVyZSBpcyBhIG5leHQgY2hhcmFjdGVyXG5cdFx0XHRcdGV4dHJhID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRcdFx0aWYgKChleHRyYSAmIDB4RkMwMCkgPT0gMHhEQzAwKSB7IC8vIGxvdyBzdXJyb2dhdGVcblx0XHRcdFx0XHRvdXRwdXQucHVzaCgoKHZhbHVlICYgMHgzRkYpIDw8IDEwKSArIChleHRyYSAmIDB4M0ZGKSArIDB4MTAwMDApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIHVubWF0Y2hlZCBzdXJyb2dhdGU7IG9ubHkgYXBwZW5kIHRoaXMgY29kZSB1bml0LCBpbiBjYXNlIHRoZSBuZXh0XG5cdFx0XHRcdFx0Ly8gY29kZSB1bml0IGlzIHRoZSBoaWdoIHN1cnJvZ2F0ZSBvZiBhIHN1cnJvZ2F0ZSBwYWlyXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdGNvdW50ZXItLTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gb3V0cHV0O1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBzdHJpbmcgYmFzZWQgb24gYW4gYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHNlZSBgcHVueWNvZGUudWNzMi5kZWNvZGVgXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGVuY29kZVxuXHQgKiBAcGFyYW0ge0FycmF5fSBjb2RlUG9pbnRzIFRoZSBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmV3IFVuaWNvZGUgc3RyaW5nIChVQ1MtMikuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZW5jb2RlKGFycmF5KSB7XG5cdFx0cmV0dXJuIG1hcChhcnJheSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdHZhciBvdXRwdXQgPSAnJztcblx0XHRcdGlmICh2YWx1ZSA+IDB4RkZGRikge1xuXHRcdFx0XHR2YWx1ZSAtPSAweDEwMDAwO1xuXHRcdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKTtcblx0XHRcdFx0dmFsdWUgPSAweERDMDAgfCB2YWx1ZSAmIDB4M0ZGO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSk7XG5cdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdH0pLmpvaW4oJycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgYmFzaWMgY29kZSBwb2ludCBpbnRvIGEgZGlnaXQvaW50ZWdlci5cblx0ICogQHNlZSBgZGlnaXRUb0Jhc2ljKClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlUG9pbnQgVGhlIGJhc2ljIG51bWVyaWMgY29kZSBwb2ludCB2YWx1ZS5cblx0ICogQHJldHVybnMge051bWJlcn0gVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50IChmb3IgdXNlIGluXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaW4gdGhlIHJhbmdlIGAwYCB0byBgYmFzZSAtIDFgLCBvciBgYmFzZWAgaWZcblx0ICogdGhlIGNvZGUgcG9pbnQgZG9lcyBub3QgcmVwcmVzZW50IGEgdmFsdWUuXG5cdCAqL1xuXHRmdW5jdGlvbiBiYXNpY1RvRGlnaXQoY29kZVBvaW50KSB7XG5cdFx0aWYgKGNvZGVQb2ludCAtIDQ4IDwgMTApIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSAyMjtcblx0XHR9XG5cdFx0aWYgKGNvZGVQb2ludCAtIDY1IDwgMjYpIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSA2NTtcblx0XHR9XG5cdFx0aWYgKGNvZGVQb2ludCAtIDk3IDwgMjYpIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSA5Nztcblx0XHR9XG5cdFx0cmV0dXJuIGJhc2U7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBkaWdpdC9pbnRlZ2VyIGludG8gYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAc2VlIGBiYXNpY1RvRGlnaXQoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGRpZ2l0IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHJldHVybnMge051bWJlcn0gVGhlIGJhc2ljIGNvZGUgcG9pbnQgd2hvc2UgdmFsdWUgKHdoZW4gdXNlZCBmb3Jcblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpcyBgZGlnaXRgLCB3aGljaCBuZWVkcyB0byBiZSBpbiB0aGUgcmFuZ2Vcblx0ICogYDBgIHRvIGBiYXNlIC0gMWAuIElmIGBmbGFnYCBpcyBub24temVybywgdGhlIHVwcGVyY2FzZSBmb3JtIGlzXG5cdCAqIHVzZWQ7IGVsc2UsIHRoZSBsb3dlcmNhc2UgZm9ybSBpcyB1c2VkLiBUaGUgYmVoYXZpb3IgaXMgdW5kZWZpbmVkXG5cdCAqIGlmIGBmbGFnYCBpcyBub24temVybyBhbmQgYGRpZ2l0YCBoYXMgbm8gdXBwZXJjYXNlIGZvcm0uXG5cdCAqL1xuXHRmdW5jdGlvbiBkaWdpdFRvQmFzaWMoZGlnaXQsIGZsYWcpIHtcblx0XHQvLyAgMC4uMjUgbWFwIHRvIEFTQ0lJIGEuLnogb3IgQS4uWlxuXHRcdC8vIDI2Li4zNSBtYXAgdG8gQVNDSUkgMC4uOVxuXHRcdHJldHVybiBkaWdpdCArIDIyICsgNzUgKiAoZGlnaXQgPCAyNikgLSAoKGZsYWcgIT0gMCkgPDwgNSk7XG5cdH1cblxuXHQvKipcblx0ICogQmlhcyBhZGFwdGF0aW9uIGZ1bmN0aW9uIGFzIHBlciBzZWN0aW9uIDMuNCBvZiBSRkMgMzQ5Mi5cblx0ICogaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzQ5MiNzZWN0aW9uLTMuNFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWRhcHQoZGVsdGEsIG51bVBvaW50cywgZmlyc3RUaW1lKSB7XG5cdFx0dmFyIGsgPSAwO1xuXHRcdGRlbHRhID0gZmlyc3RUaW1lID8gZmxvb3IoZGVsdGEgLyBkYW1wKSA6IGRlbHRhID4+IDE7XG5cdFx0ZGVsdGEgKz0gZmxvb3IoZGVsdGEgLyBudW1Qb2ludHMpO1xuXHRcdGZvciAoLyogbm8gaW5pdGlhbGl6YXRpb24gKi87IGRlbHRhID4gYmFzZU1pbnVzVE1pbiAqIHRNYXggPj4gMTsgayArPSBiYXNlKSB7XG5cdFx0XHRkZWx0YSA9IGZsb29yKGRlbHRhIC8gYmFzZU1pbnVzVE1pbik7XG5cdFx0fVxuXHRcdHJldHVybiBmbG9vcihrICsgKGJhc2VNaW51c1RNaW4gKyAxKSAqIGRlbHRhIC8gKGRlbHRhICsgc2tldykpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scyB0byBhIHN0cmluZyBvZiBVbmljb2RlXG5cdCAqIHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGRlY29kZShpbnB1dCkge1xuXHRcdC8vIERvbid0IHVzZSBVQ1MtMlxuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGgsXG5cdFx0ICAgIG91dCxcblx0XHQgICAgaSA9IDAsXG5cdFx0ICAgIG4gPSBpbml0aWFsTixcblx0XHQgICAgYmlhcyA9IGluaXRpYWxCaWFzLFxuXHRcdCAgICBiYXNpYyxcblx0XHQgICAgaixcblx0XHQgICAgaW5kZXgsXG5cdFx0ICAgIG9sZGksXG5cdFx0ICAgIHcsXG5cdFx0ICAgIGssXG5cdFx0ICAgIGRpZ2l0LFxuXHRcdCAgICB0LFxuXHRcdCAgICAvKiogQ2FjaGVkIGNhbGN1bGF0aW9uIHJlc3VsdHMgKi9cblx0XHQgICAgYmFzZU1pbnVzVDtcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHM6IGxldCBgYmFzaWNgIGJlIHRoZSBudW1iZXIgb2YgaW5wdXQgY29kZVxuXHRcdC8vIHBvaW50cyBiZWZvcmUgdGhlIGxhc3QgZGVsaW1pdGVyLCBvciBgMGAgaWYgdGhlcmUgaXMgbm9uZSwgdGhlbiBjb3B5XG5cdFx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0XHRiYXNpYyA9IGlucHV0Lmxhc3RJbmRleE9mKGRlbGltaXRlcik7XG5cdFx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdFx0YmFzaWMgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaiA9IDA7IGogPCBiYXNpYzsgKytqKSB7XG5cdFx0XHQvLyBpZiBpdCdzIG5vdCBhIGJhc2ljIGNvZGUgcG9pbnRcblx0XHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdFx0ZXJyb3IoJ25vdC1iYXNpYycpO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBkZWNvZGluZyBsb29wOiBzdGFydCBqdXN0IGFmdGVyIHRoZSBsYXN0IGRlbGltaXRlciBpZiBhbnkgYmFzaWMgY29kZVxuXHRcdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0XHRmb3IgKGluZGV4ID0gYmFzaWMgPiAwID8gYmFzaWMgKyAxIDogMDsgaW5kZXggPCBpbnB1dExlbmd0aDsgLyogbm8gZmluYWwgZXhwcmVzc2lvbiAqLykge1xuXG5cdFx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0XHQvLyBEZWNvZGUgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlciBpbnRvIGBkZWx0YWAsXG5cdFx0XHQvLyB3aGljaCBnZXRzIGFkZGVkIHRvIGBpYC4gVGhlIG92ZXJmbG93IGNoZWNraW5nIGlzIGVhc2llclxuXHRcdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHRcdC8vIHZhbHVlIGF0IHRoZSBlbmQgdG8gb2J0YWluIGBkZWx0YWAuXG5cdFx0XHRmb3IgKG9sZGkgPSBpLCB3ID0gMSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cblx0XHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ2ludmFsaWQtaW5wdXQnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA+PSBiYXNlIHx8IGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblxuXHRcdFx0XHRpZiAoZGlnaXQgPCB0KSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXNlTWludXNUID0gYmFzZSAtIHQ7XG5cdFx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdFx0fVxuXG5cdFx0XHRvdXQgPSBvdXRwdXQubGVuZ3RoICsgMTtcblx0XHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0XHQvLyBgaWAgd2FzIHN1cHBvc2VkIHRvIHdyYXAgYXJvdW5kIGZyb20gYG91dGAgdG8gYDBgLFxuXHRcdFx0Ly8gaW5jcmVtZW50aW5nIGBuYCBlYWNoIHRpbWUsIHNvIHdlJ2xsIGZpeCB0aGF0IG5vdzpcblx0XHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0XHRpICU9IG91dDtcblxuXHRcdFx0Ly8gSW5zZXJ0IGBuYCBhdCBwb3NpdGlvbiBgaWAgb2YgdGhlIG91dHB1dFxuXHRcdFx0b3V0cHV0LnNwbGljZShpKyssIDAsIG4pO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVjczJlbmNvZGUob3V0cHV0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMgdG8gYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seVxuXHQgKiBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmNvZGUoaW5wdXQpIHtcblx0XHR2YXIgbixcblx0XHQgICAgZGVsdGEsXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50LFxuXHRcdCAgICBiYXNpY0xlbmd0aCxcblx0XHQgICAgYmlhcyxcblx0XHQgICAgaixcblx0XHQgICAgbSxcblx0XHQgICAgcSxcblx0XHQgICAgayxcblx0XHQgICAgdCxcblx0XHQgICAgY3VycmVudFZhbHVlLFxuXHRcdCAgICBvdXRwdXQgPSBbXSxcblx0XHQgICAgLyoqIGBpbnB1dExlbmd0aGAgd2lsbCBob2xkIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgaW4gYGlucHV0YC4gKi9cblx0XHQgICAgaW5wdXRMZW5ndGgsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsXG5cdFx0ICAgIGJhc2VNaW51c1QsXG5cdFx0ICAgIHFNaW51c1Q7XG5cblx0XHQvLyBDb252ZXJ0IHRoZSBpbnB1dCBpbiBVQ1MtMiB0byBVbmljb2RlXG5cdFx0aW5wdXQgPSB1Y3MyZGVjb2RlKGlucHV0KTtcblxuXHRcdC8vIENhY2hlIHRoZSBsZW5ndGhcblx0XHRpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIHN0YXRlXG5cdFx0biA9IGluaXRpYWxOO1xuXHRcdGRlbHRhID0gMDtcblx0XHRiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzXG5cdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IDB4ODApIHtcblx0XHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGggPSBvdXRwdXQubGVuZ3RoO1xuXG5cdFx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdFx0Ly8gYGJhc2ljTGVuZ3RoYCBpcyB0aGUgbnVtYmVyIG9mIGJhc2ljIGNvZGUgcG9pbnRzLlxuXG5cdFx0Ly8gRmluaXNoIHRoZSBiYXNpYyBzdHJpbmcgLSBpZiBpdCBpcyBub3QgZW1wdHkgLSB3aXRoIGEgZGVsaW1pdGVyXG5cdFx0aWYgKGJhc2ljTGVuZ3RoKSB7XG5cdFx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHRcdH1cblxuXHRcdC8vIE1haW4gZW5jb2RpbmcgbG9vcDpcblx0XHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0XHQvLyBBbGwgbm9uLWJhc2ljIGNvZGUgcG9pbnRzIDwgbiBoYXZlIGJlZW4gaGFuZGxlZCBhbHJlYWR5LiBGaW5kIHRoZSBuZXh0XG5cdFx0XHQvLyBsYXJnZXIgb25lOlxuXHRcdFx0Zm9yIChtID0gbWF4SW50LCBqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdFx0bSA9IGN1cnJlbnRWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJbmNyZWFzZSBgZGVsdGFgIGVub3VnaCB0byBhZHZhbmNlIHRoZSBkZWNvZGVyJ3MgPG4saT4gc3RhdGUgdG8gPG0sMD4sXG5cdFx0XHQvLyBidXQgZ3VhcmQgYWdhaW5zdCBvdmVyZmxvd1xuXHRcdFx0aGFuZGxlZENQQ291bnRQbHVzT25lID0gaGFuZGxlZENQQ291bnQgKyAxO1xuXHRcdFx0aWYgKG0gLSBuID4gZmxvb3IoKG1heEludCAtIGRlbHRhKSAvIGhhbmRsZWRDUENvdW50UGx1c09uZSkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGRlbHRhICs9IChtIC0gbikgKiBoYW5kbGVkQ1BDb3VudFBsdXNPbmU7XG5cdFx0XHRuID0gbTtcblxuXHRcdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IG4gJiYgKytkZWx0YSA+IG1heEludCkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PSBuKSB7XG5cdFx0XHRcdFx0Ly8gUmVwcmVzZW50IGRlbHRhIGFzIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXJcblx0XHRcdFx0XHRmb3IgKHEgPSBkZWx0YSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblx0XHRcdFx0XHRcdGlmIChxIDwgdCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHFNaW51c1QgPSBxIC0gdDtcblx0XHRcdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKFxuXHRcdFx0XHRcdFx0XHRzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHQgKyBxTWludXNUICUgYmFzZU1pbnVzVCwgMCkpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cSA9IGZsb29yKHFNaW51c1QgLyBiYXNlTWludXNUKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdFx0YmlhcyA9IGFkYXB0KGRlbHRhLCBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsIGhhbmRsZWRDUENvdW50ID09IGJhc2ljTGVuZ3RoKTtcblx0XHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdFx0KytoYW5kbGVkQ1BDb3VudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQrK2RlbHRhO1xuXHRcdFx0KytuO1xuXG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgdG8gVW5pY29kZS4gT25seSB0aGVcblx0ICogUHVueWNvZGVkIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCwgaS5lLiBpdCBkb2Vzbid0XG5cdCAqIG1hdHRlciBpZiB5b3UgY2FsbCBpdCBvbiBhIHN0cmluZyB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gY29udmVydGVkIHRvXG5cdCAqIFVuaWNvZGUuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBQdW55Y29kZSBkb21haW4gbmFtZSB0byBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoZG9tYWluKSB7XG5cdFx0cmV0dXJuIG1hcERvbWFpbihkb21haW4sIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4UHVueWNvZGUudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gZGVjb2RlKHN0cmluZy5zbGljZSg0KS50b0xvd2VyQ2FzZSgpKVxuXHRcdFx0XHQ6IHN0cmluZztcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFVuaWNvZGUgc3RyaW5nIHJlcHJlc2VudGluZyBhIGRvbWFpbiBuYW1lIHRvIFB1bnljb2RlLiBPbmx5IHRoZVxuXHQgKiBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLCBpLmUuIGl0IGRvZXNuJ3Rcblx0ICogbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW4gQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZSB0byBjb252ZXJ0LCBhcyBhIFVuaWNvZGUgc3RyaW5nLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgUHVueWNvZGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIGRvbWFpbiBuYW1lLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShkb21haW4pIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGRvbWFpbiwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhOb25BU0NJSS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyAneG4tLScgKyBlbmNvZGUoc3RyaW5nKVxuXHRcdFx0XHQ6IHN0cmluZztcblx0XHR9KTtcblx0fVxuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKiBEZWZpbmUgdGhlIHB1YmxpYyBBUEkgKi9cblx0cHVueWNvZGUgPSB7XG5cdFx0LyoqXG5cdFx0ICogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IFB1bnljb2RlLmpzIHZlcnNpb24gbnVtYmVyLlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIFN0cmluZ1xuXHRcdCAqL1xuXHRcdCd2ZXJzaW9uJzogJzEuMi40Jyxcblx0XHQvKipcblx0XHQgKiBBbiBvYmplY3Qgb2YgbWV0aG9kcyB0byBjb252ZXJ0IGZyb20gSmF2YVNjcmlwdCdzIGludGVybmFsIGNoYXJhY3RlclxuXHRcdCAqIHJlcHJlc2VudGF0aW9uIChVQ1MtMikgdG8gVW5pY29kZSBjb2RlIHBvaW50cywgYW5kIGJhY2suXG5cdFx0ICogQHNlZSA8aHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBPYmplY3Rcblx0XHQgKi9cblx0XHQndWNzMic6IHtcblx0XHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdFx0J2VuY29kZSc6IHVjczJlbmNvZGVcblx0XHR9LFxuXHRcdCdkZWNvZGUnOiBkZWNvZGUsXG5cdFx0J2VuY29kZSc6IGVuY29kZSxcblx0XHQndG9BU0NJSSc6IHRvQVNDSUksXG5cdFx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxuXHR9O1xuXG5cdC8qKiBFeHBvc2UgYHB1bnljb2RlYCAqL1xuXHQvLyBTb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzLCBsaWtlIHIuanMsIGNoZWNrIGZvciBzcGVjaWZpYyBjb25kaXRpb24gcGF0dGVybnNcblx0Ly8gbGlrZSB0aGUgZm9sbG93aW5nOlxuXHRpZiAoXG5cdFx0dHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXG5cdFx0dHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiZcblx0XHRkZWZpbmUuYW1kXG5cdCkge1xuXHRcdGRlZmluZSgncHVueWNvZGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBwdW55Y29kZTtcblx0XHR9KTtcblx0fSBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiAhZnJlZUV4cG9ydHMubm9kZVR5cGUpIHtcblx0XHRpZiAoZnJlZU1vZHVsZSkgeyAvLyBpbiBOb2RlLmpzIG9yIFJpbmdvSlMgdjAuOC4wK1xuXHRcdFx0ZnJlZU1vZHVsZS5leHBvcnRzID0gcHVueWNvZGU7XG5cdFx0fSBlbHNlIHsgLy8gaW4gTmFyd2hhbCBvciBSaW5nb0pTIHYwLjcuMC1cblx0XHRcdGZvciAoa2V5IGluIHB1bnljb2RlKSB7XG5cdFx0XHRcdHB1bnljb2RlLmhhc093blByb3BlcnR5KGtleSkgJiYgKGZyZWVFeHBvcnRzW2tleV0gPSBwdW55Y29kZVtrZXldKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7IC8vIGluIFJoaW5vIG9yIGEgd2ViIGJyb3dzZXJcblx0XHRyb290LnB1bnljb2RlID0gcHVueWNvZGU7XG5cdH1cblxufSh0aGlzKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG52YXIgdHlwZSA9IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpIH1cblxudmFyIHByaW1pdGl2ZVdyYXBwZXJUeXBlcyA9IHtcbiAgYm9vbGVhbjogdHJ1ZVxuLCBudW1iZXI6IHRydWVcbiwgc3RyaW5nOiB0cnVlXG59XG5cbnZhciBzdHJpbmdQcm9wc1JFID0gL14oPzpcXGQrfGxlbmd0aCkkL1xuXG4vKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBPV0wgSmF2YVNjcmlwdCBVdGlsaXRpZXMuXG5cbk9XTCBKYXZhU2NyaXB0IFV0aWxpdGllcyBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3Jcbm1vZGlmeSBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYXMgcHVibGlzaGVkIGJ5IHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2ZcbnRoZSBMaWNlbnNlLCBvciAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5PV0wgSmF2YVNjcmlwdCBVdGlsaXRpZXMgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpY1xuTGljZW5zZSBhbG9uZyB3aXRoIE9XTCBKYXZhU2NyaXB0IFV0aWxpdGllcy4gIElmIG5vdCwgc2VlXG48aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG4vLyBSZS11c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gdXNlZCBieSBjbG9uZSgpXG5mdW5jdGlvbiBDbG9uZSgpIHt9XG5cbi8vIENsb25lIG9iamVjdHMsIHNraXAgb3RoZXIgdHlwZXNcbmZ1bmN0aW9uIGNsb25lKHRhcmdldCkge1xuICBpZiAodHlwZW9mIHRhcmdldCA9PSAnb2JqZWN0Jykge1xuICAgIENsb25lLnByb3RvdHlwZSA9IHRhcmdldFxuICAgIHJldHVybiBuZXcgQ2xvbmUoKVxuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiB0YXJnZXRcbiAgfVxufVxuXG4vLyBTaGFsbG93IENvcHlcbmZ1bmN0aW9uIGNvcHkodGFyZ2V0KSB7XG4gIHZhciBjLCBwcm9wZXJ0eVxuICBpZiAodHlwZW9mIHRhcmdldCAhPSAnb2JqZWN0Jykge1xuICAgIC8vIE5vbi1vYmplY3RzIGhhdmUgdmFsdWUgc2VtYW50aWNzLCBzbyB0YXJnZXQgaXMgYWxyZWFkeSBhIGNvcHlcbiAgICByZXR1cm4gdGFyZ2V0XG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIHZhbHVlID0gdGFyZ2V0LnZhbHVlT2YoKVxuICAgIGlmICh0YXJnZXQgPT0gdmFsdWUpIHtcbiAgICAgIC8vIFRoZSBvYmplY3QgaXMgYSBzdGFuZGFyZCBvYmplY3Qgd3JhcHBlciBmb3IgYSBuYXRpdmUgdHlwZSwgc2F5IFN0cmluZy5cbiAgICAgIC8vIHdlIGNhbiBtYWtlIGEgY29weSBieSBpbnN0YW50aWF0aW5nIGEgbmV3IG9iamVjdCBhcm91bmQgdGhlIHZhbHVlLlxuICAgICAgYyA9IG5ldyB0YXJnZXQuY29uc3RydWN0b3IodmFsdWUpXG4gICAgICB2YXIgbm90U3RyaW5nID0gdHlwZSh0YXJnZXQpICE9ICdzdHJpbmcnXG5cbiAgICAgIC8vIFdyYXBwZXJzIGNhbiBoYXZlIHByb3BlcnRpZXMgYWRkZWQgdG8gdGhlbVxuICAgICAgZm9yIChwcm9wZXJ0eSBpbiB0YXJnZXQpIHtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHRhcmdldCwgcHJvcGVydHkpICYmIChub3RTdHJpbmcgfHwgIXN0cmluZ1Byb3BzUkUudGVzdChwcm9wZXJ0eSkpKSB7XG4gICAgICAgICAgY1twcm9wZXJ0eV0gPSB0YXJnZXRbcHJvcGVydHldXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXZSBoYXZlIGEgbm9ybWFsIG9iamVjdC4gSWYgcG9zc2libGUsIHdlJ2xsIGNsb25lIHRoZSBvcmlnaW5hbCdzXG4gICAgICAvLyBwcm90b3R5cGUgKG5vdCB0aGUgb3JpZ2luYWwpIHRvIGdldCBhbiBlbXB0eSBvYmplY3Qgd2l0aCB0aGUgc2FtZVxuICAgICAgLy8gcHJvdG90eXBlIGNoYWluIGFzIHRoZSBvcmlnaW5hbC4gSWYganVzdCBjb3B5IHRoZSBpbnN0YW5jZSBwcm9wZXJ0aWVzLlxuICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSBoYXZlIHRvIGNvcHkgdGhlIHdob2xlIHRoaW5nLCBwcm9wZXJ0eS1ieS1wcm9wZXJ0eS5cbiAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiB0YXJnZXQuY29uc3RydWN0b3IgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yICE9PSBPYmplY3QpIHtcbiAgICAgICAgYyA9IGNsb25lKHRhcmdldC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpXG5cbiAgICAgICAgLy8gR2l2ZSB0aGUgY29weSBhbGwgdGhlIGluc3RhbmNlIHByb3BlcnRpZXMgb2YgdGFyZ2V0LiBJdCBoYXMgdGhlIHNhbWVcbiAgICAgICAgLy8gcHJvdG90eXBlIGFzIHRhcmdldCwgc28gaW5oZXJpdGVkIHByb3BlcnRpZXMgYXJlIGFscmVhZHkgdGhlcmUuXG4gICAgICAgIGZvciAocHJvcGVydHkgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgaWYgKGhhc093bi5jYWxsKHRhcmdldCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICBjW3Byb3BlcnR5XSA9IHRhcmdldFtwcm9wZXJ0eV1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjID0ge31cbiAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiB0YXJnZXQpIHtcbiAgICAgICAgICBjW3Byb3BlcnR5XSA9IHRhcmdldFtwcm9wZXJ0eV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY1xuICAgIH1cbiAgfVxufVxuXG4vLyBEZWVwIENvcHlcbnZhciBkZWVwQ29waWVycyA9IFtdXG5cbmZ1bmN0aW9uIERlZXBDb3BpZXIoY29uZmlnKSB7XG4gIGZvciAodmFyIGtleSBpbiBjb25maWcpIHtcbiAgICB0aGlzW2tleV0gPSBjb25maWdba2V5XVxuICB9XG59XG5cbkRlZXBDb3BpZXIucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogRGVlcENvcGllclxuXG4gIC8vIERldGVybWluZXMgaWYgdGhpcyBEZWVwQ29waWVyIGNhbiBoYW5kbGUgdGhlIGdpdmVuIG9iamVjdC5cbiwgY2FuQ29weTogZnVuY3Rpb24oc291cmNlKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gU3RhcnRzIHRoZSBkZWVwIGNvcHlpbmcgcHJvY2VzcyBieSBjcmVhdGluZyB0aGUgY29weSBvYmplY3QuIFlvdSBjYW5cbiAgLy8gaW5pdGlhbGl6ZSBhbnkgcHJvcGVydGllcyB5b3Ugd2FudCwgYnV0IHlvdSBjYW4ndCBjYWxsIHJlY3Vyc2l2ZWx5IGludG8gdGhlXG4gIC8vIERlZXBDb3B5QWxnb3JpdGhtLlxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSkge31cblxuICAvLyBDb21wbGV0ZXMgdGhlIGRlZXAgY29weSBvZiB0aGUgc291cmNlIG9iamVjdCBieSBwb3B1bGF0aW5nIGFueSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgbmVlZCB0byBiZSByZWN1cnNpdmVseSBkZWVwIGNvcGllZC4gWW91IGNhbiBkbyB0aGlzIGJ5IHVzaW5nIHRoZVxuICAvLyBwcm92aWRlZCBkZWVwQ29weUFsZ29yaXRobSBpbnN0YW5jZSdzIGRlZXBDb3B5KCkgbWV0aG9kLiBUaGlzIHdpbGwgaGFuZGxlXG4gIC8vIGN5Y2xpYyByZWZlcmVuY2VzIGZvciBvYmplY3RzIGFscmVhZHkgZGVlcENvcGllZCwgaW5jbHVkaW5nIHRoZSBzb3VyY2VcbiAgLy8gb2JqZWN0IGl0c2VsZi4gVGhlIFwicmVzdWx0XCIgcGFzc2VkIGluIGlzIHRoZSBvYmplY3QgcmV0dXJuZWQgZnJvbSBjcmVhdGUoKS5cbiwgcG9wdWxhdGU6IGZ1bmN0aW9uKGRlZXBDb3B5QWxnb3JpdGhtLCBzb3VyY2UsIHJlc3VsdCkge31cbn1cblxuZnVuY3Rpb24gRGVlcENvcHlBbGdvcml0aG0oKSB7XG4gIC8vIGNvcGllZE9iamVjdHMga2VlcHMgdHJhY2sgb2Ygb2JqZWN0cyBhbHJlYWR5IGNvcGllZCBieSB0aGlzIGRlZXBDb3B5XG4gIC8vIG9wZXJhdGlvbiwgc28gd2UgY2FuIGNvcnJlY3RseSBoYW5kbGUgY3ljbGljIHJlZmVyZW5jZXMuXG4gIHRoaXMuY29waWVkT2JqZWN0cyA9IFtdXG4gIHZhciB0aGlzUGFzcyA9IHRoaXNcbiAgdGhpcy5yZWN1cnNpdmVEZWVwQ29weSA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiB0aGlzUGFzcy5kZWVwQ29weShzb3VyY2UpXG4gIH1cbiAgdGhpcy5kZXB0aCA9IDBcbn1cbkRlZXBDb3B5QWxnb3JpdGhtLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IERlZXBDb3B5QWxnb3JpdGhtXG5cbiwgbWF4RGVwdGg6IDI1NlxuXG4gIC8vIEFkZCBhbiBvYmplY3QgdG8gdGhlIGNhY2hlLiAgTm8gYXR0ZW1wdCBpcyBtYWRlIHRvIGZpbHRlciBkdXBsaWNhdGVzOyB3ZVxuICAvLyBhbHdheXMgY2hlY2sgZ2V0Q2FjaGVkUmVzdWx0KCkgYmVmb3JlIGNhbGxpbmcgaXQuXG4sIGNhY2hlUmVzdWx0OiBmdW5jdGlvbihzb3VyY2UsIHJlc3VsdCkge1xuICAgIHRoaXMuY29waWVkT2JqZWN0cy5wdXNoKFtzb3VyY2UsIHJlc3VsdF0pXG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBjYWNoZWQgY29weSBvZiBhIGdpdmVuIG9iamVjdCwgb3IgdW5kZWZpbmVkIGlmIGl0J3MgYW4gb2JqZWN0XG4gIC8vIHdlIGhhdmVuJ3Qgc2VlbiBiZWZvcmUuXG4sIGdldENhY2hlZFJlc3VsdDogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgdmFyIGNvcGllZE9iamVjdHMgPSB0aGlzLmNvcGllZE9iamVjdHNcbiAgICB2YXIgbGVuZ3RoID0gY29waWVkT2JqZWN0cy5sZW5ndGhcbiAgICBmb3IgKCB2YXIgaT0wOyBpPGxlbmd0aDsgaSsrICkge1xuICAgICAgaWYgKCBjb3BpZWRPYmplY3RzW2ldWzBdID09PSBzb3VyY2UgKSB7XG4gICAgICAgIHJldHVybiBjb3BpZWRPYmplY3RzW2ldWzFdXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuXG4gIC8vIGRlZXBDb3B5IGhhbmRsZXMgdGhlIHNpbXBsZSBjYXNlcyBpdHNlbGY6IG5vbi1vYmplY3RzIGFuZCBvYmplY3QncyB3ZSd2ZVxuICAvLyBzZWVuIGJlZm9yZS4gRm9yIGNvbXBsZXggY2FzZXMsIGl0IGZpcnN0IGlkZW50aWZpZXMgYW4gYXBwcm9wcmlhdGVcbiAgLy8gRGVlcENvcGllciwgdGhlbiBjYWxscyBhcHBseURlZXBDb3BpZXIoKSB0byBkZWxlZ2F0ZSB0aGUgZGV0YWlscyBvZiBjb3B5aW5nXG4gIC8vIHRoZSBvYmplY3QgdG8gdGhhdCBEZWVwQ29waWVyLlxuLCBkZWVwQ29weTogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgLy8gbnVsbCBpcyBhIHNwZWNpYWwgY2FzZTogaXQncyB0aGUgb25seSB2YWx1ZSBvZiB0eXBlICdvYmplY3QnIHdpdGhvdXRcbiAgICAvLyBwcm9wZXJ0aWVzLlxuICAgIGlmIChzb3VyY2UgPT09IG51bGwpIHsgcmV0dXJuIG51bGwgfVxuXG4gICAgLy8gQWxsIG5vbi1vYmplY3RzIHVzZSB2YWx1ZSBzZW1hbnRpY3MgYW5kIGRvbid0IG5lZWQgZXhwbGljdCBjb3B5aW5nXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT0gJ29iamVjdCcpIHsgcmV0dXJuIHNvdXJjZSB9XG5cbiAgICB2YXIgY2FjaGVkUmVzdWx0ID0gdGhpcy5nZXRDYWNoZWRSZXN1bHQoc291cmNlKVxuXG4gICAgLy8gV2UndmUgYWxyZWFkeSBzZWVuIHRoaXMgb2JqZWN0IGR1cmluZyB0aGlzIGRlZXAgY29weSBvcGVyYXRpb24gc28gY2FuXG4gICAgLy8gaW1tZWRpYXRlbHkgcmV0dXJuIHRoZSByZXN1bHQuIFRoaXMgcHJlc2VydmVzIHRoZSBjeWNsaWMgcmVmZXJlbmNlXG4gICAgLy8gc3RydWN0dXJlIGFuZCBwcm90ZWN0cyB1cyBmcm9tIGluZmluaXRlIHJlY3Vyc2lvbi5cbiAgICBpZiAoY2FjaGVkUmVzdWx0KSB7IHJldHVybiBjYWNoZWRSZXN1bHQgfVxuXG4gICAgLy8gT2JqZWN0cyBtYXkgbmVlZCBzcGVjaWFsIGhhbmRsaW5nIGRlcGVuZGluZyBvbiB0aGVpciBjbGFzcy4gVGhlcmUgaXMgYVxuICAgIC8vIGNsYXNzIG9mIGhhbmRsZXJzIGNhbGwgXCJEZWVwQ29waWVyc1wiIHRoYXQga25vdyBob3cgdG8gY29weSBjZXJ0YWluXG4gICAgLy8gb2JqZWN0cy4gVGhlcmUgaXMgYWxzbyBhIGZpbmFsLCBnZW5lcmljIGRlZXAgY29waWVyIHRoYXQgY2FuIGhhbmRsZSBhbnlcbiAgICAvLyBvYmplY3QuXG4gICAgZm9yICh2YXIgaT0wOyBpPGRlZXBDb3BpZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZGVlcENvcGllciA9IGRlZXBDb3BpZXJzW2ldXG4gICAgICBpZiAoZGVlcENvcGllci5jYW5Db3B5KHNvdXJjZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHlEZWVwQ29waWVyKGRlZXBDb3BpZXIsIHNvdXJjZSlcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gVGhlIGdlbmVyaWMgY29waWVyIGNhbiBoYW5kbGUgYW55dGhpbmcsIHNvIHdlIHNob3VsZCBuZXZlciByZWFjaCB0aGlzXG4gICAgLy8gbGluZS5cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIERlZXBDb3BpZXIgaXMgYWJsZSB0byBjb3B5ICcgKyBzb3VyY2UpXG4gIH1cblxuICAvLyBPbmNlIHdlJ3ZlIGlkZW50aWZpZWQgd2hpY2ggRGVlcENvcGllciB0byB1c2UsIHdlIG5lZWQgdG8gY2FsbCBpdCBpbiBhXG4gIC8vIHZlcnkgcGFydGljdWxhciBvcmRlcjogY3JlYXRlLCBjYWNoZSwgcG9wdWxhdGUuVGhpcyBpcyB0aGUga2V5IHRvIGRldGVjdGluZ1xuICAvLyBjeWNsZXMuIFdlIGFsc28ga2VlcCB0cmFjayBvZiByZWN1cnNpb24gZGVwdGggd2hlbiBjYWxsaW5nIHRoZSBwb3RlbnRpYWxseVxuICAvLyByZWN1cnNpdmUgcG9wdWxhdGUoKTogdGhpcyBpcyBhIGZhaWwtZmFzdCB0byBwcmV2ZW50IGFuIGluZmluaXRlIGxvb3AgZnJvbVxuICAvLyBjb25zdW1pbmcgYWxsIGF2YWlsYWJsZSBtZW1vcnkgYW5kIGNyYXNoaW5nIG9yIHNsb3dpbmcgZG93biB0aGUgYnJvd3Nlci5cbiwgYXBwbHlEZWVwQ29waWVyOiBmdW5jdGlvbihkZWVwQ29waWVyLCBzb3VyY2UpIHtcbiAgICAvLyBTdGFydCBieSBjcmVhdGluZyBhIHN0dWIgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgY29weS5cbiAgICB2YXIgcmVzdWx0ID0gZGVlcENvcGllci5jcmVhdGUoc291cmNlKVxuXG4gICAgLy8gV2Ugbm93IGtub3cgdGhlIGRlZXAgY29weSBvZiBzb3VyY2Ugc2hvdWxkIGFsd2F5cyBiZSByZXN1bHQsIHNvIGlmIHdlXG4gICAgLy8gZW5jb3VudGVyIHNvdXJjZSBhZ2FpbiBkdXJpbmcgdGhpcyBkZWVwIGNvcHkgd2UgY2FuIGltbWVkaWF0ZWx5IHVzZVxuICAgIC8vIHJlc3VsdCBpbnN0ZWFkIG9mIGRlc2NlbmRpbmcgaW50byBpdCByZWN1cnNpdmVseS5cbiAgICB0aGlzLmNhY2hlUmVzdWx0KHNvdXJjZSwgcmVzdWx0KVxuXG4gICAgLy8gT25seSBEZWVwQ29waWVyLnBvcHVsYXRlKCkgY2FuIHJlY3Vyc2l2ZWx5IGRlZXAgY29weS4gU28sIHRvIGtlZXAgdHJhY2tcbiAgICAvLyBvZiByZWN1cnNpb24gZGVwdGgsIHdlIGluY3JlbWVudCB0aGlzIHNoYXJlZCBjb3VudGVyIGJlZm9yZSBjYWxsaW5nIGl0LFxuICAgIC8vIGFuZCBkZWNyZW1lbnQgaXQgYWZ0ZXJ3YXJkcy5cbiAgICB0aGlzLmRlcHRoKytcbiAgICBpZiAodGhpcy5kZXB0aCA+IHRoaXMubWF4RGVwdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4Y2VlZGVkIG1heCByZWN1cnNpb24gZGVwdGggaW4gZGVlcCBjb3B5LlwiKVxuICAgIH1cblxuICAgIC8vIEl0J3Mgbm93IHNhZmUgdG8gbGV0IHRoZSBkZWVwQ29waWVyIHJlY3Vyc2l2ZWx5IGRlZXAgY29weSBpdHMgcHJvcGVydGllc1xuICAgIGRlZXBDb3BpZXIucG9wdWxhdGUodGhpcy5yZWN1cnNpdmVEZWVwQ29weSwgc291cmNlLCByZXN1bHQpXG5cbiAgICB0aGlzLmRlcHRoLS1cblxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuXG4vLyBFbnRyeSBwb2ludCBmb3IgZGVlcCBjb3B5LlxuLy8gICBzb3VyY2UgaXMgdGhlIG9iamVjdCB0byBiZSBkZWVwIGNvcGllZC5cbi8vICAgbWF4RGVwdGggaXMgYW4gb3B0aW9uYWwgcmVjdXJzaW9uIGxpbWl0LiBEZWZhdWx0cyB0byAyNTYuXG5mdW5jdGlvbiBkZWVwQ29weShzb3VyY2UsIG1heERlcHRoKSB7XG4gIHZhciBkZWVwQ29weUFsZ29yaXRobSA9IG5ldyBEZWVwQ29weUFsZ29yaXRobSgpXG4gIGlmIChtYXhEZXB0aCkge1xuICAgIGRlZXBDb3B5QWxnb3JpdGhtLm1heERlcHRoID0gbWF4RGVwdGhcbiAgfVxuICByZXR1cm4gZGVlcENvcHlBbGdvcml0aG0uZGVlcENvcHkoc291cmNlKVxufVxuXG4vLyBQdWJsaWNseSBleHBvc2UgdGhlIERlZXBDb3BpZXIgY2xhc3NcbmRlZXBDb3B5LkRlZXBDb3BpZXIgPSBEZWVwQ29waWVyXG5cbi8vIFB1YmxpY2x5IGV4cG9zZSB0aGUgbGlzdCBvZiBkZWVwQ29waWVyc1xuZGVlcENvcHkuZGVlcENvcGllcnMgPSBkZWVwQ29waWVyc1xuXG4vLyBNYWtlIGRlZXBDb3B5KCkgZXh0ZW5zaWJsZSBieSBhbGxvd2luZyBvdGhlcnMgdG8gcmVnaXN0ZXIgdGhlaXIgb3duIGN1c3RvbVxuLy8gRGVlcENvcGllcnMuXG5kZWVwQ29weS5yZWdpc3RlciA9IGZ1bmN0aW9uKGRlZXBDb3BpZXIpIHtcbiAgaWYgKCEoZGVlcENvcGllciBpbnN0YW5jZW9mIERlZXBDb3BpZXIpKSB7XG4gICAgZGVlcENvcGllciA9IG5ldyBEZWVwQ29waWVyKGRlZXBDb3BpZXIpXG4gIH1cbiAgZGVlcENvcGllcnMudW5zaGlmdChkZWVwQ29waWVyKVxufVxuXG4vLyBHZW5lcmljIE9iamVjdCBjb3BpZXJcbi8vIFRoZSB1bHRpbWF0ZSBmYWxsYmFjayBEZWVwQ29waWVyLCB3aGljaCB0cmllcyB0byBoYW5kbGUgdGhlIGdlbmVyaWMgY2FzZS5cbi8vIFRoaXMgc2hvdWxkIHdvcmsgZm9yIGJhc2UgT2JqZWN0cyBhbmQgbWFueSB1c2VyLWRlZmluZWQgY2xhc3Nlcy5cbmRlZXBDb3B5LnJlZ2lzdGVyKHtcbiAgY2FuQ29weTogZnVuY3Rpb24oc291cmNlKSB7IHJldHVybiB0cnVlIH1cblxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBzb3VyY2UuY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBjbG9uZShzb3VyY2UuY29uc3RydWN0b3IucHJvdG90eXBlKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB7fVxuICAgIH1cbiAgfVxuXG4sIHBvcHVsYXRlOiBmdW5jdGlvbihkZWVwQ29weSwgc291cmNlLCByZXN1bHQpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICBpZiAoaGFzT3duLmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gZGVlcENvcHkoc291cmNlW2tleV0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufSlcblxuLy8gU3RhbmRhcmQgcHJpbWl0aXZlIHdyYXBwZXIgY29waWVyXG5kZWVwQ29weS5yZWdpc3Rlcih7XG4gIGNhbkNvcHk6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiBwcmltaXRpdmVXcmFwcGVyVHlwZXNbdHlwZShzb3VyY2UpXVxuICB9XG5cbiwgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICByZXR1cm4gbmV3IHNvdXJjZS5jb25zdHJ1Y3Rvcihzb3VyY2UudmFsdWVPZigpKVxuICB9XG5cbiwgcG9wdWxhdGU6IGZ1bmN0aW9uKGRlZXBDb3B5LCBzb3VyY2UsIHJlc3VsdCkge1xuICAgIHZhciBub3RTdHJpbmcgPSB0eXBlKHNvdXJjZSkgIT0gJ3N0cmluZydcbiAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICBpZiAoaGFzT3duLmNhbGwoc291cmNlLCBrZXkpICYmIChub3RTdHJpbmcgfHwgIXN0cmluZ1Byb3BzUkUudGVzdChrZXkpKSkge1xuICAgICAgICByZXN1bHRba2V5XSA9IGRlZXBDb3B5KHNvdXJjZVtrZXldKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn0pXG5cbi8vIFJlZ0V4cCBjb3BpZXJcbmRlZXBDb3B5LnJlZ2lzdGVyKHtcbiAgY2FuQ29weTogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgcmV0dXJuIHR5cGUoc291cmNlKSA9PSAncmVnZXhwJ1xuICB9XG5cbiwgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICByZXR1cm4gc291cmNlXG4gIH1cblxuXG59KVxuXG4vLyBEYXRlIGNvcGllclxuZGVlcENvcHkucmVnaXN0ZXIoe1xuICBjYW5Db3B5OiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICByZXR1cm4gdHlwZShzb3VyY2UpID09ICdkYXRlJ1xuICB9XG5cbiwgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoc291cmNlKVxuICB9XG59KVxuXG4vLyBBcnJheSBjb3BpZXJcbmRlZXBDb3B5LnJlZ2lzdGVyKHtcbiAgY2FuQ29weTogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgcmV0dXJuIHR5cGUoc291cmNlKSA9PSAnYXJyYXknXG4gIH1cblxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiBuZXcgc291cmNlLmNvbnN0cnVjdG9yKClcbiAgfVxuXG4sIHBvcHVsYXRlOiBmdW5jdGlvbihkZWVwQ29weSwgc291cmNlLCByZXN1bHQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0LnB1c2goZGVlcENvcHkoc291cmNlW2ldKSlcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRGVlcENvcHlBbGdvcml0aG06IERlZXBDb3B5QWxnb3JpdGhtXG4sIGNvcHk6IGNvcHlcbiwgY2xvbmU6IGNsb25lXG4sIGRlZXBDb3B5OiBkZWVwQ29weVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcbiAgLCBmb3JtYXRSZWdFeHAgPSAvJVslc10vZ1xuICAsIGZvcm1hdE9ialJlZ0V4cCA9IC8oe3s/KShcXHcrKX0vZ1xuXG4vKipcbiAqIFJlcGxhY2VzICVzIHBsYWNlaG9sZGVycyBpbiBhIHN0cmluZyB3aXRoIHBvc2l0aW9uYWwgYXJndW1lbnRzLlxuICovXG5mdW5jdGlvbiBmb3JtYXQocykge1xuICByZXR1cm4gZm9ybWF0QXJyKHMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcbn1cblxuLyoqXG4gKiBSZXBsYWNlcyAlcyBwbGFjZWhvbGRlcnMgaW4gYSBzdHJpbmcgd2l0aCBhcnJheSBjb250ZW50cy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0QXJyKHMsIGEpIHtcbiAgdmFyIGkgPSAwXG4gIHJldHVybiBzLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbihtKSB7IHJldHVybiBtID09ICclJScgPyAnJScgOiBhW2krK10gfSlcbn1cblxuLyoqXG4gKiBSZXBsYWNlcyB7cHJvcGVydHlOYW1lfSBwbGFjZWhvbGRlcnMgaW4gYSBzdHJpbmcgd2l0aCBvYmplY3QgcHJvcGVydGllcy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0T2JqKHMsIG8pIHtcbiAgcmV0dXJuIHMucmVwbGFjZShmb3JtYXRPYmpSZWdFeHAsIGZ1bmN0aW9uKG0sIGIsIHApIHsgcmV0dXJuIGIubGVuZ3RoID09IDIgPyBtLnNsaWNlKDEpIDogb1twXSB9KVxufVxuXG52YXIgdW5pdHMgPSAna01HVFBFWlknXG4gICwgc3RyaXBEZWNpbWFscyA9IC9cXC4wMCR8MCQvXG5cbi8qKlxuICogRm9ybWF0cyBieXRlcyBhcyBhIGZpbGUgc2l6ZSB3aXRoIHRoZSBhcHByb3ByaWF0ZWx5IHNjYWxlZCB1bml0cy5cbiAqL1xuZnVuY3Rpb24gZmlsZVNpemUoYnl0ZXMsIHRocmVzaG9sZCkge1xuICB0aHJlc2hvbGQgPSBNYXRoLm1pbih0aHJlc2hvbGQgfHwgNzY4LCAxMDI0KVxuICB2YXIgaSA9IC0xXG4gICAgLCB1bml0ID0gJ2J5dGVzJ1xuICAgICwgc2l6ZSA9IGJ5dGVzXG4gIHdoaWxlIChzaXplID4gdGhyZXNob2xkICYmIGkgPCB1bml0cy5sZW5ndGgpIHtcbiAgICBzaXplID0gc2l6ZSAvIDEwMjRcbiAgICBpKytcbiAgfVxuICBpZiAoaSA+IC0xKSB7XG4gICAgdW5pdCA9IHVuaXRzLmNoYXJBdChpKSArICdCJ1xuICB9XG4gIHJldHVybiBzaXplLnRvRml4ZWQoMikucmVwbGFjZShzdHJpcERlY2ltYWxzLCAnJykgKyAnICcgKyB1bml0XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBmb3JtYXQ6IGZvcm1hdFxuLCBmb3JtYXRBcnI6IGZvcm1hdEFyclxuLCBmb3JtYXRPYmo6IGZvcm1hdE9ialxuLCBmaWxlU2l6ZTogZmlsZVNpemVcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuXG4vLyBUeXBlIGNoZWNrc1xuXG5mdW5jdGlvbiBpc0FycmF5KG8pIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwobykgPT0gJ1tvYmplY3QgQXJyYXldJ1xufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW4obykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBCb29sZWFuXSdcbn1cblxuZnVuY3Rpb24gaXNEYXRlKG8pIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwobykgPT0gJ1tvYmplY3QgRGF0ZV0nXG59XG5cbmZ1bmN0aW9uIGlzRXJyb3Iobykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBFcnJvcl0nXG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24obykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBGdW5jdGlvbl0nXG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKG8pIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwobykgPT0gJ1tvYmplY3QgTnVtYmVyXSdcbn1cblxuZnVuY3Rpb24gaXNPYmplY3Qobykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBPYmplY3RdJ1xufVxuXG5mdW5jdGlvbiBpc1JlZ0V4cChvKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG8pID09ICdbb2JqZWN0IFJlZ0V4cF0nXG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKG8pIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwobykgPT0gJ1tvYmplY3QgU3RyaW5nXSdcbn1cblxuLy8gQ29udGVudCBjaGVja3NcblxuZnVuY3Rpb24gaXNFbXB0eShvKSB7XG4gIC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cbiAgZm9yICh2YXIgcHJvcCBpbiBvKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgLyoganNoaW50IGlnbm9yZTplbmQgKi9cbiAgcmV0dXJuIHRydWVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEFycmF5OiBpc0FycmF5XG4sIEJvb2xlYW46IGlzQm9vbGVhblxuLCBEYXRlOiBpc0RhdGVcbiwgRW1wdHk6IGlzRW1wdHlcbiwgRXJyb3I6IGlzRXJyb3JcbiwgRnVuY3Rpb246IGlzRnVuY3Rpb25cbiwgTmFOOiBpc05hTlxuLCBOdW1iZXI6IGlzTnVtYmVyXG4sIE9iamVjdDogaXNPYmplY3RcbiwgUmVnRXhwOiBpc1JlZ0V4cFxuLCBTdHJpbmc6IGlzU3RyaW5nXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogV3JhcHMgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgpIHNvIGl0IGNhbiBiZSBjYWxsZWQgd2l0aCBhbiBvYmplY3RcbiAqIGFuZCBwcm9wZXJ0eSBuYW1lLlxuICovXG52YXIgaGFzT3duID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gIHJldHVybiBmdW5jdGlvbihvYmosIHByb3ApIHsgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSB9XG59KSgpXG5cbi8qKlxuICogUmV0dXJucyB0aGUgdHlwZSBvZiBhbiBvYmplY3QgYXMgYSBsb3dlcmNhc2Ugc3RyaW5nLlxuICovXG52YXIgdHlwZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7IHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCkgfVxufSkoKVxuXG4vKipcbiAqIENvcGllcyBvd24gcHJvcGVydGllcyBmcm9tIGFueSBnaXZlbiBvYmplY3RzIHRvIGEgZGVzdGluYXRpb24gb2JqZWN0LlxuICovXG5mdW5jdGlvbiBleHRlbmQoZGVzdCkge1xuICBmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3VtZW50cy5sZW5ndGgsIHNyYzsgaSA8IGw7IGkrKykge1xuICAgIHNyYyA9IGFyZ3VtZW50c1tpXVxuICAgIGlmIChzcmMpIHtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gc3JjKSB7XG4gICAgICAgIGlmIChoYXNPd24oc3JjLCBwcm9wKSkge1xuICAgICAgICAgIGRlc3RbcHJvcF0gPSBzcmNbcHJvcF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZGVzdFxufVxuXG4vKipcbiAqIE1ha2VzIGEgY29uc3RydWN0b3IgaW5oZXJpdCBhbm90aGVyIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlIHdpdGhvdXRcbiAqIGhhdmluZyB0byBhY3R1YWxseSB1c2UgdGhlIGNvbnN0cnVjdG9yLlxuICovXG5mdW5jdGlvbiBpbmhlcml0cyhjaGlsZENvbnN0cnVjdG9yLCBwYXJlbnRDb25zdHJ1Y3Rvcikge1xuICB2YXIgRiA9IGZ1bmN0aW9uKCkge31cbiAgRi5wcm90b3R5cGUgPSBwYXJlbnRDb25zdHJ1Y3Rvci5wcm90b3R5cGVcbiAgY2hpbGRDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBuZXcgRigpXG4gIGNoaWxkQ29uc3RydWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY2hpbGRDb25zdHJ1Y3RvclxuICByZXR1cm4gY2hpbGRDb25zdHJ1Y3RvclxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gQXJyYXkgb2YgW3Byb3BlcnR5LCB2YWx1ZV0gcGFpcnMgZnJvbSBhbiBPYmplY3QuXG4gKi9cbmZ1bmN0aW9uIGl0ZW1zKG9iaikge1xuICB2YXIgaXRlbXNfID0gW11cbiAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duKG9iaiwgcHJvcCkpIHtcbiAgICAgIGl0ZW1zXy5wdXNoKFtwcm9wLCBvYmpbcHJvcF1dKVxuICAgIH1cbiAgfVxuICByZXR1cm4gaXRlbXNfXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBPYmplY3QgZnJvbSBhbiBBcnJheSBvZiBbcHJvcGVydHksIHZhbHVlXSBwYWlycy5cbiAqL1xuZnVuY3Rpb24gZnJvbUl0ZW1zKGl0ZW1zKSB7XG4gIHZhciBvYmogPSB7fVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aCwgaXRlbTsgaSA8IGw7IGkrKykge1xuICAgIGl0ZW0gPSBpdGVtc1tpXVxuICAgIG9ialtpdGVtWzBdXSA9IGl0ZW1bMV1cbiAgfVxuICByZXR1cm4gb2JqXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvb2t1cCBPYmplY3QgZnJvbSBhbiBBcnJheSwgY29lcmNpbmcgZWFjaCBpdGVtIHRvIGEgU3RyaW5nLlxuICovXG5mdW5jdGlvbiBsb29rdXAoYXJyKSB7XG4gIHZhciBvYmogPSB7fVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFyci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBvYmpbJycrYXJyW2ldXSA9IHRydWVcbiAgfVxuICByZXR1cm4gb2JqXG59XG5cbi8qKlxuICogSWYgdGhlIGdpdmVuIG9iamVjdCBoYXMgdGhlIGdpdmVuIHByb3BlcnR5LCByZXR1cm5zIGl0cyB2YWx1ZSwgb3RoZXJ3aXNlXG4gKiByZXR1cm5zIHRoZSBnaXZlbiBkZWZhdWx0IHZhbHVlLlxuICovXG5mdW5jdGlvbiBnZXQob2JqLCBwcm9wLCBkZWZhdWx0VmFsdWUpIHtcbiAgcmV0dXJuIChoYXNPd24ob2JqLCBwcm9wKSA/IG9ialtwcm9wXSA6IGRlZmF1bHRWYWx1ZSlcbn1cblxuLyoqXG4gKiBEZWxldGVzIGFuZCByZXR1cm5zIGFuIG93biBwcm9wZXJ0eSBmcm9tIGFuIG9iamVjdCwgb3B0aW9uYWxseSByZXR1cm5pbmcgYVxuICogZGVmYXVsdCB2YWx1ZSBpZiB0aGUgb2JqZWN0IGRpZG4ndCBoYXZlIHRoZXByb3BlcnR5LlxuICogQHRocm93cyBpZiBnaXZlbiBhbiBvYmplY3Qgd2hpY2ggaXMgbnVsbCAob3IgdW5kZWZpbmVkKSwgb3IgaWYgdGhlIHByb3BlcnR5XG4gKiAgIGRvZXNuJ3QgZXhpc3QgYW5kIHRoZXJlIHdhcyBubyBkZWZhdWx0VmFsdWUgZ2l2ZW4uXG4gKi9cbmZ1bmN0aW9uIHBvcChvYmosIHByb3AsIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAob2JqID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3BvcCB3YXMgZ2l2ZW4gJyArIG9iailcbiAgfVxuICBpZiAoaGFzT3duKG9iaiwgcHJvcCkpIHtcbiAgICB2YXIgdmFsdWUgPSBvYmpbcHJvcF1cbiAgICBkZWxldGUgb2JqW3Byb3BdXG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cbiAgZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwicG9wIHdhcyBnaXZlbiBhbiBvYmplY3Qgd2hpY2ggZGlkbid0IGhhdmUgYW4gb3duICdcIiArXG4gICAgICAgICAgICAgICAgICAgIHByb3AgKyBcIicgcHJvcGVydHksIHdpdGhvdXQgYSBkZWZhdWx0IHZhbHVlIHRvIHJldHVyblwiKVxuICB9XG4gIHJldHVybiBkZWZhdWx0VmFsdWVcbn1cblxuLyoqXG4gKiBJZiB0aGUgcHJvcCBpcyBpbiB0aGUgb2JqZWN0LCByZXR1cm4gaXRzIHZhbHVlLiBJZiBub3QsIHNldCB0aGUgcHJvcCB0b1xuICogZGVmYXVsdFZhbHVlIGFuZCByZXR1cm4gZGVmYXVsdFZhbHVlLlxuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0KG9iaiwgcHJvcCwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmIChvYmogPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0RGVmYXVsdCB3YXMgZ2l2ZW4gJyArIG9iailcbiAgfVxuICBkZWZhdWx0VmFsdWUgPSBkZWZhdWx0VmFsdWUgfHwgbnVsbFxuICBpZiAoaGFzT3duKG9iaiwgcHJvcCkpIHtcbiAgICByZXR1cm4gb2JqW3Byb3BdXG4gIH1cbiAgZWxzZSB7XG4gICAgb2JqW3Byb3BdID0gZGVmYXVsdFZhbHVlXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBoYXNPd246IGhhc093blxuLCB0eXBlOiB0eXBlXG4sIGV4dGVuZDogZXh0ZW5kXG4sIGluaGVyaXRzOiBpbmhlcml0c1xuLCBpdGVtczogaXRlbXNcbiwgZnJvbUl0ZW1zOiBmcm9tSXRlbXNcbiwgbG9va3VwOiBsb29rdXBcbiwgZ2V0OiBnZXRcbiwgcG9wOiBwb3Bcbiwgc2V0RGVmYXVsdDogc2V0RGVmYXVsdFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXMgPSByZXF1aXJlKCcuL2lzJylcblxuLyoqXG4gKiBQYWRzIGEgbnVtYmVyIHdpdGggYSBsZWFkaW5nIHplcm8gaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBwYWQobnVtYmVyKSB7XG4gIHJldHVybiAobnVtYmVyIDwgMTAgPyAnMCcgKyBudW1iZXIgOiBudW1iZXIpXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgaXRlbSBpbiBsaXN0LCBvciAtMSBpZiBpdCdzIG5vdCBpbiBsaXN0LlxuICovXG5mdW5jdGlvbiBpbmRleE9mKGl0ZW0sIGxpc3QpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChpdGVtID09PSBsaXN0W2ldKSB7XG4gICAgICByZXR1cm4gaVxuICAgIH1cbiAgfVxuICByZXR1cm4gLTFcbn1cblxuLyoqXG4gKiBNYXBzIGRpcmVjdGl2ZSBjb2RlcyB0byByZWd1bGFyIGV4cHJlc3Npb24gcGF0dGVybnMgd2hpY2ggd2lsbCBjYXB0dXJlIHRoZVxuICogZGF0YSB0aGUgZGlyZWN0aXZlIGNvcnJlc3BvbmRzIHRvLCBvciBpbiB0aGUgY2FzZSBvZiBsb2NhbGUtZGVwZW5kZW50XG4gKiBkaXJlY3RpdmVzLCBhIGZ1bmN0aW9uIHdoaWNoIHRha2VzIGEgbG9jYWxlIGFuZCBnZW5lcmF0ZXMgYSByZWd1bGFyXG4gKiBleHByZXNzaW9uIHBhdHRlcm4uXG4gKi9cbnZhciBwYXJzZXJEaXJlY3RpdmVzID0ge1xuICAvLyBMb2NhbGUncyBhYmJyZXZpYXRlZCBtb250aCBuYW1lXG4gICdiJzogZnVuY3Rpb24obCkgeyByZXR1cm4gJygnICsgbC5iLmpvaW4oJ3wnKSArICcpJyB9XG4gIC8vIExvY2FsZSdzIGZ1bGwgbW9udGggbmFtZVxuLCAnQic6IGZ1bmN0aW9uKGwpIHsgcmV0dXJuICcoJyArIGwuQi5qb2luKCd8JykgKyAnKScgfVxuICAvLyBMb2NhbGUncyBlcXVpdmFsZW50IG9mIGVpdGhlciBBTSBvciBQTS5cbiwgJ3AnOiBmdW5jdGlvbihsKSB7IHJldHVybiAnKCcgKyBsLkFNICsgJ3wnICsgbC5QTSArICcpJyB9XG4sICdkJzogJyhcXFxcZFxcXFxkPyknIC8vIERheSBvZiB0aGUgbW9udGggYXMgYSBkZWNpbWFsIG51bWJlciBbMDEsMzFdXG4sICdIJzogJyhcXFxcZFxcXFxkPyknIC8vIEhvdXIgKDI0LWhvdXIgY2xvY2spIGFzIGEgZGVjaW1hbCBudW1iZXIgWzAwLDIzXVxuLCAnSSc6ICcoXFxcXGRcXFxcZD8pJyAvLyBIb3VyICgxMi1ob3VyIGNsb2NrKSBhcyBhIGRlY2ltYWwgbnVtYmVyIFswMSwxMl1cbiwgJ20nOiAnKFxcXFxkXFxcXGQ/KScgLy8gTW9udGggYXMgYSBkZWNpbWFsIG51bWJlciBbMDEsMTJdXG4sICdNJzogJyhcXFxcZFxcXFxkPyknIC8vIE1pbnV0ZSBhcyBhIGRlY2ltYWwgbnVtYmVyIFswMCw1OV1cbiwgJ1MnOiAnKFxcXFxkXFxcXGQ/KScgLy8gU2Vjb25kIGFzIGEgZGVjaW1hbCBudW1iZXIgWzAwLDU5XVxuLCAneSc6ICcoXFxcXGRcXFxcZD8pJyAvLyBZZWFyIHdpdGhvdXQgY2VudHVyeSBhcyBhIGRlY2ltYWwgbnVtYmVyIFswMCw5OV1cbiwgJ1knOiAnKFxcXFxkezR9KScgIC8vIFllYXIgd2l0aCBjZW50dXJ5IGFzIGEgZGVjaW1hbCBudW1iZXJcbiwgJyUnOiAnJScgICAgICAgICAvLyBBIGxpdGVyYWwgJyUnIGNoYXJhY3RlclxufVxuXG4vKipcbiAqIE1hcHMgZGlyZWN0aXZlIGNvZGVzIHRvIGZ1bmN0aW9ucyB3aGljaCB0YWtlIHRoZSBkYXRlIHRvIGJlIGZvcm1hdHRlZCBhbmRcbiAqIGxvY2FsZSBkZXRhaWxzIChpZiByZXF1aXJlZCksIHJldHVybmluZyBhbiBhcHByb3ByaWF0ZSBmb3JtYXR0ZWQgdmFsdWUuXG4gKi9cbnZhciBmb3JtYXR0ZXJEaXJlY3RpdmVzID0ge1xuICAnYSc6IGZ1bmN0aW9uKGQsIGwpIHsgcmV0dXJuIGwuYVtkLmdldERheSgpXSB9XG4sICdBJzogZnVuY3Rpb24oZCwgbCkgeyByZXR1cm4gbC5BW2QuZ2V0RGF5KCldIH1cbiwgJ2InOiBmdW5jdGlvbihkLCBsKSB7IHJldHVybiBsLmJbZC5nZXRNb250aCgpXSB9XG4sICdCJzogZnVuY3Rpb24oZCwgbCkgeyByZXR1cm4gbC5CW2QuZ2V0TW9udGgoKV0gfVxuLCAnZCc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBhZChkLmdldERhdGUoKSwgMikgfVxuLCAnSCc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBhZChkLmdldEhvdXJzKCksIDIpIH1cbiwgJ00nOiBmdW5jdGlvbihkKSB7IHJldHVybiBwYWQoZC5nZXRNaW51dGVzKCksIDIpIH1cbiwgJ20nOiBmdW5jdGlvbihkKSB7IHJldHVybiBwYWQoZC5nZXRNb250aCgpICsgMSwgMikgfVxuLCAnUyc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBhZChkLmdldFNlY29uZHMoKSwgMikgfVxuLCAndyc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0RGF5KCkgfVxuLCAnWSc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZ2V0RnVsbFllYXIoKSB9XG4sICclJzogZnVuY3Rpb24oZCkgeyByZXR1cm4gJyUnIH1cbn1cblxuLyoqIFRlc3QgZm9yIGhhbmdpbmcgcGVyY2VudGFnZSBzeW1ib2xzLiAqL1xudmFyIHN0cmZ0aW1lRm9ybWF0Q2hlY2sgPSAvW14lXSUkL1xuXG4vKipcbiAqIEEgcGFydGlhbCBpbXBsZW1lbnRhdGlvbiBvZiBzdHJwdGltZSB3aGljaCBwYXJzZXMgdGltZSBkZXRhaWxzIGZyb20gYSBzdHJpbmcsXG4gKiBiYXNlZCBvbiBhIGZvcm1hdCBzdHJpbmcuXG4gKiBAcGFyYW0ge1N0cmluZ30gZm9ybWF0XG4gKiBAcGFyYW0ge09iamVjdH0gbG9jYWxlXG4gKi9cbmZ1bmN0aW9uIFRpbWVQYXJzZXIoZm9ybWF0LCBsb2NhbGUpIHtcbiAgdGhpcy5mb3JtYXQgPSBmb3JtYXRcbiAgdGhpcy5sb2NhbGUgPSBsb2NhbGVcbiAgdmFyIGNhY2hlZFBhdHRlcm4gPSBUaW1lUGFyc2VyLl9jYWNoZVtsb2NhbGUubmFtZSArICd8JyArIGZvcm1hdF1cbiAgaWYgKGNhY2hlZFBhdHRlcm4gIT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMucmUgPSBjYWNoZWRQYXR0ZXJuWzBdXG4gICAgdGhpcy5tYXRjaE9yZGVyID0gY2FjaGVkUGF0dGVyblsxXVxuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuY29tcGlsZVBhdHRlcm4oKVxuICB9XG59XG5cbi8qKlxuICogQ2FjaGVzIFJlZ0V4cHMgYW5kIG1hdGNoIG9yZGVycyBnZW5lcmF0ZWQgcGVyIGxvY2FsZS9mb3JtYXQgc3RyaW5nIGNvbWJvLlxuICovXG5UaW1lUGFyc2VyLl9jYWNoZSA9IHt9XG5cblRpbWVQYXJzZXIucHJvdG90eXBlLmNvbXBpbGVQYXR0ZXJuID0gZnVuY3Rpb24oKSB7XG4gIC8vIE5vcm1hbGlzZSB3aGl0ZXNwYWNlIGJlZm9yZSBmdXJ0aGVyIHByb2Nlc3NpbmdcbiAgdmFyIGZvcm1hdCA9IHRoaXMuZm9ybWF0LnNwbGl0KC8oPzpcXHN8XFx0fFxcbikrLykuam9pbignICcpXG4gICAgLCBwYXR0ZXJuID0gW11cbiAgICAsIG1hdGNoT3JkZXIgPSBbXVxuICAgICwgY1xuICAgICwgZGlyZWN0aXZlXG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmb3JtYXQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgYyA9IGZvcm1hdC5jaGFyQXQoaSlcbiAgICBpZiAoYyAhPSAnJScpIHtcbiAgICAgIGlmIChjID09PSAnICcpIHtcbiAgICAgICAgcGF0dGVybi5wdXNoKCcgKycpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcGF0dGVybi5wdXNoKGMpXG4gICAgICB9XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChpID09IGwgLSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0cnB0aW1lIGZvcm1hdCBlbmRzIHdpdGggcmF3ICUnKVxuICAgIH1cblxuICAgIGMgPSBmb3JtYXQuY2hhckF0KCsraSlcbiAgICBkaXJlY3RpdmUgPSBwYXJzZXJEaXJlY3RpdmVzW2NdXG4gICAgaWYgKGRpcmVjdGl2ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0cnB0aW1lIGZvcm1hdCBjb250YWlucyBhbiB1bmtub3duIGRpcmVjdGl2ZTogJScgKyBjKVxuICAgIH1cbiAgICBlbHNlIGlmIChpcy5GdW5jdGlvbihkaXJlY3RpdmUpKSB7XG4gICAgICBwYXR0ZXJuLnB1c2goZGlyZWN0aXZlKHRoaXMubG9jYWxlKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwYXR0ZXJuLnB1c2goZGlyZWN0aXZlKVxuICAgIH1cblxuICAgIGlmIChjICE9ICclJykge1xuICAgICAgIG1hdGNoT3JkZXIucHVzaChjKVxuICAgIH1cbiAgfVxuXG4gIHRoaXMucmUgPSBuZXcgUmVnRXhwKCdeJyArIHBhdHRlcm4uam9pbignJykgKyAnJCcpXG4gIHRoaXMubWF0Y2hPcmRlciA9IG1hdGNoT3JkZXJcbiAgVGltZVBhcnNlci5fY2FjaGVbdGhpcy5sb2NhbGUubmFtZSArICd8JyArIHRoaXMuZm9ybWF0XSA9IFt0aGlzLnJlLCBtYXRjaE9yZGVyXVxufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIGV4dHJhY3QgZGF0ZSBhbmQgdGltZSBkZXRhaWxzIGZyb20gdGhlIGdpdmVuIGlucHV0LlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0XG4gKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn1cbiAqL1xuVGltZVBhcnNlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgbWF0Y2hlcyA9IHRoaXMucmUuZXhlYyhpbnB1dClcbiAgaWYgKG1hdGNoZXMgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RpbWUgZGF0YSBkaWQgbm90IG1hdGNoIGZvcm1hdDogZGF0YT0nICsgaW5wdXQgK1xuICAgICAgICAgICAgICAgICAgICAnLCBmb3JtYXQ9JyArIHRoaXMuZm9ybWF0KVxuICB9XG5cbiAgICAvLyBEZWZhdWx0IHZhbHVlcyBmb3Igd2hlbiBtb3JlIGFjY3VyYXRlIHZhbHVlcyBjYW5ub3QgYmUgaW5mZXJyZWRcbiAgdmFyIHRpbWUgPSBbMTkwMCwgMSwgMSwgMCwgMCwgMF1cbiAgICAvLyBNYXRjaGVkIHRpbWUgZGF0YSwga2V5ZWQgYnkgZGlyZWN0aXZlIGNvZGVcbiAgICAsIGRhdGEgPSB7fVxuXG4gIGZvciAodmFyIGkgPSAxLCBsID0gbWF0Y2hlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBkYXRhW3RoaXMubWF0Y2hPcmRlcltpIC0gMV1dID0gbWF0Y2hlc1tpXVxuICB9XG5cbiAgLy8gRXh0cmFjdCB5ZWFyXG4gIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdZJykpIHtcbiAgICB0aW1lWzBdID0gcGFyc2VJbnQoZGF0YS5ZLCAxMClcbiAgfVxuICBlbHNlIGlmIChkYXRhLmhhc093blByb3BlcnR5KCd5JykpIHtcbiAgICB2YXIgeWVhciA9IHBhcnNlSW50KGRhdGEueSwgMTApXG4gICAgaWYgKHllYXIgPCA2OCkge1xuICAgICAgICB5ZWFyID0gMjAwMCArIHllYXJcbiAgICB9XG4gICAgZWxzZSBpZiAoeWVhciA8IDEwMCkge1xuICAgICAgICB5ZWFyID0gMTkwMCArIHllYXJcbiAgICB9XG4gICAgdGltZVswXSA9IHllYXJcbiAgfVxuXG4gIC8vIEV4dHJhY3QgbW9udGhcbiAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ20nKSkge1xuICAgIHZhciBtb250aCA9IHBhcnNlSW50KGRhdGEubSwgMTApXG4gICAgaWYgKG1vbnRoIDwgMSB8fCBtb250aCA+IDEyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vbnRoIGlzIG91dCBvZiByYW5nZTogJyArIG1vbnRoKVxuICAgIH1cbiAgICB0aW1lWzFdID0gbW9udGhcbiAgfVxuICBlbHNlIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdCJykpIHtcbiAgICB0aW1lWzFdID0gaW5kZXhPZihkYXRhLkIsIHRoaXMubG9jYWxlLkIpICsgMVxuICB9XG4gIGVsc2UgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ2InKSkge1xuICAgIHRpbWVbMV0gPSBpbmRleE9mKGRhdGEuYiwgdGhpcy5sb2NhbGUuYikgKyAxXG4gIH1cblxuICAvLyBFeHRyYWN0IGRheSBvZiBtb250aFxuICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnZCcpKSB7XG4gICAgdmFyIGRheSA9IHBhcnNlSW50KGRhdGEuZCwgMTApXG4gICAgaWYgKGRheSA8IDEgfHwgZGF5ID4gMzEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGF5IGlzIG91dCBvZiByYW5nZTogJyArIGRheSlcbiAgICB9XG4gICAgdGltZVsyXSA9IGRheVxuICB9XG5cbiAgLy8gRXh0cmFjdCBob3VyXG4gIHZhciBob3VyXG4gIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdIJykpIHtcbiAgICBob3VyID0gcGFyc2VJbnQoZGF0YS5ILCAxMClcbiAgICBpZiAoaG91ciA+IDIzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hvdXIgaXMgb3V0IG9mIHJhbmdlOiAnICsgaG91cilcbiAgICB9XG4gICAgdGltZVszXSA9IGhvdXJcbiAgfVxuICBlbHNlIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdJJykpIHtcbiAgICBob3VyID0gcGFyc2VJbnQoZGF0YS5JLCAxMClcbiAgICBpZiAoaG91ciA8IDEgfHwgaG91ciA+IDEyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hvdXIgaXMgb3V0IG9mIHJhbmdlOiAnICsgaG91cilcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBkb24ndCBnZXQgYW55IG1vcmUgaW5mb3JtYXRpb24sIHdlJ2xsIGFzc3VtZSB0aGlzIHRpbWUgaXNcbiAgICAvLyBhLm0uIC0gMTIgYS5tLiBpcyBtaWRuaWdodC5cbiAgICBpZiAoaG91ciA9PSAxMikge1xuICAgICAgICBob3VyID0gMFxuICAgIH1cblxuICAgIHRpbWVbM10gPSBob3VyXG5cbiAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSgncCcpKSB7XG4gICAgICBpZiAoZGF0YS5wID09IHRoaXMubG9jYWxlLlBNKSB7XG4gICAgICAgIC8vIFdlJ3ZlIGFscmVhZHkgaGFuZGxlZCB0aGUgbWlkbmlnaHQgc3BlY2lhbCBjYXNlLCBzbyBpdCdzXG4gICAgICAgIC8vIHNhZmUgdG8gYnVtcCB0aGUgdGltZSBieSAxMiBob3VycyB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgICAgICB0aW1lWzNdID0gdGltZVszXSArIDEyXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRXh0cmFjdCBtaW51dGVcbiAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ00nKSkge1xuICAgIHZhciBtaW51dGUgPSBwYXJzZUludChkYXRhLk0sIDEwKVxuICAgIGlmIChtaW51dGUgPiA1OSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pbnV0ZSBpcyBvdXQgb2YgcmFuZ2U6ICcgKyBtaW51dGUpXG4gICAgfVxuICAgIHRpbWVbNF0gPSBtaW51dGVcbiAgfVxuXG4gIC8vIEV4dHJhY3Qgc2Vjb25kc1xuICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnUycpKSB7XG4gICAgdmFyIHNlY29uZCA9IHBhcnNlSW50KGRhdGEuUywgMTApXG4gICAgaWYgKHNlY29uZCA+IDU5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY29uZCBpcyBvdXQgb2YgcmFuZ2U6ICcgKyBzZWNvbmQpXG4gICAgfVxuICAgIHRpbWVbNV0gPSBzZWNvbmRcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGRheSBvZiBtb250aFxuICBkYXkgPSB0aW1lWzJdLCBtb250aCA9IHRpbWVbMV0sIHllYXIgPSB0aW1lWzBdXG4gIGlmICgoKG1vbnRoID09IDQgfHwgbW9udGggPT0gNiB8fCBtb250aCA9PSA5IHx8IG1vbnRoID09IDExKSAmJlxuICAgICAgZGF5ID4gMzApIHx8XG4gICAgICAobW9udGggPT0gMiAmJiBkYXkgPiAoKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeWVhciAlIDQwMCA9PT0gMCkgPyAyOSA6IDI4KSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0RheSBpcyBvdXQgb2YgcmFuZ2U6ICcgKyBkYXkpXG4gIH1cblxuICByZXR1cm4gdGltZVxufVxuXG52YXIgdGltZSAgPSB7XG4gIC8qKiBEZWZhdWx0IGxvY2FsZSBuYW1lLiAqL1xuICBkZWZhdWx0TG9jYWxlOiAnZW4nXG5cbiAgLyoqIExvY2FsZSBkZXRhaWxzLiAqL1xuLCBsb2NhbGVzOiB7XG4gICAgZW46IHtcbiAgICAgIG5hbWU6ICdlbidcbiAgICAsIGE6IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J11cbiAgICAsIEE6IFsnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsXG4gICAgICAgICAgJ0ZyaWRheScsICdTYXR1cmRheSddXG4gICAgLCBBTTogJ0FNJ1xuICAgICwgYjogWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ11cbiAgICAsIEI6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JyxcbiAgICAgICAgICAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ11cbiAgICAsIFBNOiAnUE0nXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBsb2NhbGUgd2l0aCB0aGUgZ2l2ZW4gY29kZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbnZhciBnZXRMb2NhbGUgPSB0aW1lLmdldExvY2FsZSA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgaWYgKGNvZGUpIHtcbiAgICBpZiAodGltZS5sb2NhbGVzLmhhc093blByb3BlcnR5KGNvZGUpKSB7XG4gICAgICByZXR1cm4gdGltZS5sb2NhbGVzW2NvZGVdXG4gICAgfVxuICAgIGVsc2UgaWYgKGNvZGUubGVuZ3RoID4gMikge1xuICAgICAgLy8gSWYgd2UgYXBwZWFyIHRvIGhhdmUgbW9yZSB0aGFuIGEgbGFuZ3VhZ2UgY29kZSwgdHJ5IHRoZVxuICAgICAgLy8gbGFuZ3VhZ2UgY29kZSBvbiBpdHMgb3duLlxuICAgICAgdmFyIGxhbmd1YWdlQ29kZSA9IGNvZGUuc3Vic3RyaW5nKDAsIDIpXG4gICAgICBpZiAodGltZS5sb2NhbGVzLmhhc093blByb3BlcnR5KGxhbmd1YWdlQ29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHRpbWUubG9jYWxlc1tsYW5ndWFnZUNvZGVdXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0aW1lLmxvY2FsZXNbdGltZS5kZWZhdWx0TG9jYWxlXVxufVxuXG4vKipcbiAqIFBhcnNlcyB0aW1lIGRldGFpbHMgZnJvbSBhIHN0cmluZywgYmFzZWQgb24gYSBmb3JtYXQgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0XG4gKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0XG4gKiBAcGFyYW0ge3N0cmluZz19IGxvY2FsZVxuICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59XG4gKi9cbnZhciBzdHJwdGltZSA9IHRpbWUuc3RycHRpbWUgPSBmdW5jdGlvbihpbnB1dCwgZm9ybWF0LCBsb2NhbGUpIHtcbiAgcmV0dXJuIG5ldyBUaW1lUGFyc2VyKGZvcm1hdCwgZ2V0TG9jYWxlKGxvY2FsZSkpLnBhcnNlKGlucHV0KVxufVxuXG4vKipcbiAqIENvbnZlbmllbmNlIHdyYXBwZXIgYXJvdW5kIHRpbWUuc3RycHRpbWUgd2hpY2ggcmV0dXJucyBhIEphdmFTY3JpcHQgRGF0ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFxuICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdFxuICogQHBhcmFtIHtzdHJpbmc9fSBsb2NhbGVcbiAqIEByZXR1cm4ge2RhdGV9XG4gKi9cbnRpbWUuc3RycGRhdGUgPSBmdW5jdGlvbihpbnB1dCwgZm9ybWF0LCBsb2NhbGUpIHtcbiAgdmFyIHQgPSBzdHJwdGltZShpbnB1dCwgZm9ybWF0LCBsb2NhbGUpXG4gIHJldHVybiBuZXcgRGF0ZSh0WzBdLCB0WzFdIC0gMSwgdFsyXSwgdFszXSwgdFs0XSwgdFs1XSlcbn1cblxuLyoqXG4gKiBBIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gb2YgPGNvZGU+c3RyZnRpbWU8L2NvZGU+LCB3aGljaCBmb3JtYXRzIGEgZGF0ZVxuICogYWNjb3JkaW5nIHRvIGEgZm9ybWF0IHN0cmluZy4gQW4gRXJyb3Igd2lsbCBiZSB0aHJvd24gaWYgYW4gaW52YWxpZFxuICogZm9ybWF0IHN0cmluZyBpcyBnaXZlbi5cbiAqIEBwYXJhbSB7ZGF0ZX0gZGF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdFxuICogQHBhcmFtIHtzdHJpbmc9fSBsb2NhbGVcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xudGltZS5zdHJmdGltZSA9IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCwgbG9jYWxlKSB7XG4gIGlmIChzdHJmdGltZUZvcm1hdENoZWNrLnRlc3QoZm9ybWF0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcignc3RyZnRpbWUgZm9ybWF0IGVuZHMgd2l0aCByYXcgJScpXG4gIH1cbiAgbG9jYWxlID0gZ2V0TG9jYWxlKGxvY2FsZSlcbiAgcmV0dXJuIGZvcm1hdC5yZXBsYWNlKC8oJS4pL2csIGZ1bmN0aW9uKHMsIGYpIHtcbiAgICB2YXIgY29kZSA9IGYuY2hhckF0KDEpXG4gICAgaWYgKHR5cGVvZiBmb3JtYXR0ZXJEaXJlY3RpdmVzW2NvZGVdID09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0cmZ0aW1lIGZvcm1hdCBjb250YWlucyBhbiB1bmtub3duIGRpcmVjdGl2ZTogJyArIGYpXG4gICAgfVxuICAgIHJldHVybiBmb3JtYXR0ZXJEaXJlY3RpdmVzW2NvZGVdKGRhdGUsIGxvY2FsZSlcbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aW1lXG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIHBhcnNlVXJpIDEuMi4yXG4vLyAoYykgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4vLyBNSVQgTGljZW5zZVxuZnVuY3Rpb24gcGFyc2VVcmkgKHN0cikge1xuICB2YXIgbyA9IHBhcnNlVXJpLm9wdGlvbnNcbiAgICAsIG0gPSBvLnBhcnNlcltvLnN0cmljdE1vZGUgPyBcInN0cmljdFwiIDogXCJsb29zZVwiXS5leGVjKHN0cilcbiAgICAsIHVyaSA9IHt9XG4gICAgLCBpID0gMTRcblxuICB3aGlsZSAoaS0tKSB7IHVyaVtvLmtleVtpXV0gPSBtW2ldIHx8IFwiXCIgfVxuXG4gIHVyaVtvLnEubmFtZV0gPSB7fTtcbiAgdXJpW28ua2V5WzEyXV0ucmVwbGFjZShvLnEucGFyc2VyLCBmdW5jdGlvbiAoJDAsICQxLCAkMikge1xuICAgIGlmICgkMSkgeyB1cmlbby5xLm5hbWVdWyQxXSA9ICQyIH1cbiAgfSlcblxuICByZXR1cm4gdXJpXG59XG5cbnBhcnNlVXJpLm9wdGlvbnMgPSB7XG4gIHN0cmljdE1vZGU6IGZhbHNlXG4sIGtleTogWydzb3VyY2UnLCdwcm90b2NvbCcsJ2F1dGhvcml0eScsJ3VzZXJJbmZvJywndXNlcicsJ3Bhc3N3b3JkJywnaG9zdCcsJ3BvcnQnLCdyZWxhdGl2ZScsJ3BhdGgnLCdkaXJlY3RvcnknLCdmaWxlJywncXVlcnknLCdhbmNob3InXVxuLCBxOiB7XG4gICAgbmFtZTogJ3F1ZXJ5S2V5J1xuICAsIHBhcnNlcjogLyg/Ol58JikoW14mPV0qKT0/KFteJl0qKS9nXG4gIH1cbiwgcGFyc2VyOiB7XG4gICAgc3RyaWN0OiAvXig/OihbXjpcXC8/I10rKTopPyg/OlxcL1xcLygoPzooKFteOkBdKikoPzo6KFteOkBdKikpPyk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvXG4gICwgbG9vc2U6IC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pL1xuICB9XG59XG5cbi8vIG1ha2VVUkkgMS4yLjIgLSBjcmVhdGUgYSBVUkkgZnJvbSBhbiBvYmplY3Qgc3BlY2lmaWNhdGlvbjsgY29tcGF0aWJsZSB3aXRoXG4vLyBwYXJzZVVSSSAoaHR0cDovL2Jsb2cuc3RldmVubGV2aXRoYW4uY29tL2FyY2hpdmVzL3BhcnNldXJpKVxuLy8gKGMpIE5pYWxsIFNtYXJ0IDxuaWFsbHNtYXJ0LmNvbT5cbi8vIE1JVCBMaWNlbnNlXG5mdW5jdGlvbiBtYWtlVXJpKHUpIHtcbiAgdmFyIHVyaSA9ICcnXG4gIGlmICh1LnByb3RvY29sKSB7XG4gICAgdXJpICs9IHUucHJvdG9jb2wgKyAnOi8vJ1xuICB9XG4gIGlmICh1LnVzZXIpIHtcbiAgICB1cmkgKz0gdS51c2VyXG4gIH1cbiAgaWYgKHUucGFzc3dvcmQpIHtcbiAgICB1cmkgKz0gJzonICsgdS5wYXNzd29yZFxuICB9XG4gIGlmICh1LnVzZXIgfHwgdS5wYXNzd29yZCkge1xuICAgIHVyaSArPSAnQCdcbiAgfVxuICBpZiAodS5ob3N0KSB7XG4gICAgdXJpICs9IHUuaG9zdFxuICB9XG4gIGlmICh1LnBvcnQpIHtcbiAgICB1cmkgKz0gJzonICsgdS5wb3J0XG4gIH1cbiAgaWYgKHUucGF0aCkge1xuICAgIHVyaSArPSB1LnBhdGhcbiAgfVxuICB2YXIgcWsgPSB1LnF1ZXJ5S2V5XG4gIHZhciBxcyA9IFtdXG4gIGZvciAodmFyIGsgaW4gcWspIHtcbiAgICBpZiAoIXFrLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICB2YXIgdiA9IGVuY29kZVVSSUNvbXBvbmVudChxa1trXSlcbiAgICBrID0gZW5jb2RlVVJJQ29tcG9uZW50KGspXG4gICAgaWYgKHYpIHtcbiAgICAgIHFzLnB1c2goayArICc9JyArIHYpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcXMucHVzaChrKVxuICAgIH1cbiAgfVxuICBpZiAocXMubGVuZ3RoID4gMCkge1xuICAgIHVyaSArPSAnPycgKyBxcy5qb2luKCcmJylcbiAgfVxuICBpZiAodS5hbmNob3IpIHtcbiAgICB1cmkgKz0gJyMnICsgdS5hbmNob3JcbiAgfVxuICByZXR1cm4gdXJpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwYXJzZVVyaTogcGFyc2VVcmlcbiwgbWFrZVVyaTogbWFrZVVyaVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciBmb3JtYXQgPSByZXF1aXJlKCdpc29tb3JwaC9mb3JtYXQnKS5mb3JtYXRPYmpcbnZhciBpcyA9IHJlcXVpcmUoJ2lzb21vcnBoL2lzJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxuXG52YXIgTk9OX0ZJRUxEX0VSUk9SUyA9ICdfX2FsbF9fJ1xuXG4vKipcbiAqIEEgdmFsaWRhdGlvbiBlcnJvciwgY29udGFpbmluZyBhIGxpc3Qgb2YgbWVzc2FnZXMuIFNpbmdsZSBtZXNzYWdlcyAoZS5nLlxuICogdGhvc2UgcHJvZHVjZWQgYnkgdmFsaWRhdG9ycykgbWF5IGhhdmUgYW4gYXNzb2NpYXRlZCBlcnJvciBjb2RlIGFuZFxuICogcGFyYW1ldGVycyB0byBhbGxvdyBjdXN0b21pc2F0aW9uIGJ5IGZpZWxkcy5cbiAqXG4gKiBUaGUgbWVzc2FnZSBhcmd1bWVudCBjYW4gYmUgYSBzaW5nbGUgZXJyb3IsIGEgbGlzdCBvZiBlcnJvcnMsIG9yIGFuIG9iamVjdFxuICogdGhhdCBtYXBzIGZpZWxkIG5hbWVzIHRvIGxpc3RzIG9mIGVycm9ycy4gV2hhdCB3ZSBkZWZpbmUgYXMgYW4gXCJlcnJvclwiIGNhblxuICogYmUgZWl0aGVyIGEgc2ltcGxlIHN0cmluZyBvciBhbiBpbnN0YW5jZSBvZiBWYWxpZGF0aW9uRXJyb3Igd2l0aCBpdHMgbWVzc2FnZVxuICogYXR0cmlidXRlIHNldCwgYW5kIHdoYXQgd2UgZGVmaW5lIGFzIGxpc3Qgb3Igb2JqZWN0IGNhbiBiZSBhbiBhY3R1YWwgbGlzdCBvclxuICogb2JqZWN0IG9yIGFuIGluc3RhbmNlIG9mIFZhbGlkYXRpb25FcnJvciB3aXRoIGl0cyBlcnJvckxpc3Qgb3IgZXJyb3JPYmpcbiAqIHByb3BlcnR5IHNldC5cbiAqL1xudmFyIFZhbGlkYXRpb25FcnJvciA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVmFsaWRhdGlvbkVycm9yKG1lc3NhZ2UsIGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7IHJldHVybiBuZXcgVmFsaWRhdGlvbkVycm9yKG1lc3NhZ2UsIGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2NvZGU6IG51bGwsIHBhcmFtczogbnVsbH0sIGt3YXJncylcblxuICAgIHZhciBjb2RlID0ga3dhcmdzLmNvZGVcbiAgICB2YXIgcGFyYW1zID0ga3dhcmdzLnBhcmFtc1xuXG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpIHtcbiAgICAgIGlmIChvYmplY3QuaGFzT3duKG1lc3NhZ2UsICdlcnJvck9iaicpKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLmVycm9yT2JqXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvYmplY3QuaGFzT3duKG1lc3NhZ2UsICdtZXNzYWdlJykpIHtcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UuZXJyb3JMaXN0XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29kZSA9IG1lc3NhZ2UuY29kZVxuICAgICAgICBwYXJhbXMgPSBtZXNzYWdlLnBhcmFtc1xuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5tZXNzYWdlXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzLk9iamVjdChtZXNzYWdlKSkge1xuICAgICAgdGhpcy5lcnJvck9iaiA9IHt9XG4gICAgICBPYmplY3Qua2V5cyhtZXNzYWdlKS5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHZhciBtZXNzYWdlcyA9IG1lc3NhZ2VbZmllbGRdXG4gICAgICAgIGlmICghKG1lc3NhZ2VzIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkge1xuICAgICAgICAgIG1lc3NhZ2VzID0gVmFsaWRhdGlvbkVycm9yKG1lc3NhZ2VzKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXJyb3JPYmpbZmllbGRdID0gbWVzc2FnZXMuZXJyb3JMaXN0XG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLkFycmF5KG1lc3NhZ2UpKSB7XG4gICAgICB0aGlzLmVycm9yTGlzdCA9IFtdXG4gICAgICBtZXNzYWdlLmZvckVhY2goZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAvLyBOb3JtYWxpemUgc3RyaW5ncyB0byBpbnN0YW5jZXMgb2YgVmFsaWRhdGlvbkVycm9yXG4gICAgICAgIGlmICghKG1lc3NhZ2UgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IFZhbGlkYXRpb25FcnJvcihtZXNzYWdlKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXJyb3JMaXN0LnB1c2guYXBwbHkodGhpcy5lcnJvckxpc3QsIG1lc3NhZ2UuZXJyb3JMaXN0KVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgIHRoaXMuY29kZSA9IGNvZGVcbiAgICAgIHRoaXMucGFyYW1zID0gcGFyYW1zXG4gICAgICB0aGlzLmVycm9yTGlzdCA9IFt0aGlzXVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBSZXR1cm5zIHZhbGlkYXRpb24gbWVzc2FnZXMgYXMgYW4gb2JqZWN0IHdpdGggZmllbGQgbmFtZXMgYXMgcHJvcGVydGllcy5cbiAqIFRocm93cyBhbiBlcnJvciBpZiB0aGlzIHZhbGlkYXRpb24gZXJyb3Igd2FzIG5vdCBjcmVhdGVkIHdpdGggYSBmaWVsZCBlcnJvclxuICogb2JqZWN0LlxuICovXG5WYWxpZGF0aW9uRXJyb3IucHJvdG90eXBlLm1lc3NhZ2VPYmogPSBmdW5jdGlvbigpIHtcbiAgaWYgKCFvYmplY3QuaGFzT3duKHRoaXMsICdlcnJvck9iaicpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdWYWxpZGF0aW9uRXJyb3IgaGFzIG5vIGVycm9yT2JqJylcbiAgfVxuICByZXR1cm4gdGhpcy5fX2l0ZXJfXygpXG59XG5cbi8qKlxuICogUmV0dXJucyB2YWxpZGF0aW9uIG1lc3NhZ2VzIGFzIGEgbGlzdC5cbiAqL1xuVmFsaWRhdGlvbkVycm9yLnByb3RvdHlwZS5tZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAob2JqZWN0Lmhhc093bih0aGlzLCAnZXJyb3JPYmonKSkge1xuICAgIHZhciBtZXNzYWdlcyA9IFtdXG4gICAgT2JqZWN0LmtleXModGhpcy5lcnJvck9iaikuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuICAgICAgdmFyIGVycm9ycyA9IHRoaXMuZXJyb3JPYmpbZmllbGRdXG4gICAgICBtZXNzYWdlcy5wdXNoLmFwcGx5KG1lc3NhZ2VzLCBWYWxpZGF0aW9uRXJyb3IoZXJyb3JzKS5fX2l0ZXJfXygpKVxuICAgIH0uYmluZCh0aGlzKSlcbiAgICByZXR1cm4gbWVzc2FnZXNcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5fX2l0ZXJfXygpXG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYW4gb2JqZWN0IG9mIGZpZWxkIGVycm9yIG1lc3NhZ3Mgb3IgYSBsaXN0IG9mIGVycm9yIG1lc3NhZ2VzXG4gKiBkZXBlbmRpbmcgb24gaG93IHRoaXMgVmFsaWRhdGlvbkVycm9yIGhhcyBiZWVuIGNvbnN0cnVjdGVkLlxuICovXG5WYWxpZGF0aW9uRXJyb3IucHJvdG90eXBlLl9faXRlcl9fID0gZnVuY3Rpb24oKSB7XG4gIGlmIChvYmplY3QuaGFzT3duKHRoaXMsICdlcnJvck9iaicpKSB7XG4gICAgdmFyIG1lc3NhZ2VPYmogPSB7fVxuICAgIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JPYmopLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgIHZhciBlcnJvcnMgPSB0aGlzLmVycm9yT2JqW2ZpZWxkXVxuICAgICAgbWVzc2FnZU9ialtmaWVsZF0gPSBWYWxpZGF0aW9uRXJyb3IoZXJyb3JzKS5fX2l0ZXJfXygpXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHJldHVybiBtZXNzYWdlT2JqXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMuZXJyb3JMaXN0Lm1hcChmdW5jdGlvbihlcnJvcikge1xuICAgICAgdmFyIG1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlXG4gICAgICBpZiAoZXJyb3IucGFyYW1zKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBmb3JtYXQobWVzc2FnZSwgZXJyb3IucGFyYW1zKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1lc3NhZ2VcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogUGFzc2VzIHRoaXMgZXJyb3IncyBtZXNzYWdlcyBvbiB0byB0aGUgZ2l2ZW4gZXJyb3Igb2JqZWN0LCBhZGRpbmcgdG8gYVxuICogcGFydGljdWxhciBmaWVsZCdzIGVycm9yIG1lc3NhZ2VzIGlmIGFscmVhZHkgcHJlc2VudC5cbiAqL1xuVmFsaWRhdGlvbkVycm9yLnByb3RvdHlwZS51cGRhdGVFcnJvck9iaiA9IGZ1bmN0aW9uKGVycm9yT2JqKSB7XG4gIGlmIChvYmplY3QuaGFzT3duKHRoaXMsICdlcnJvck9iaicpKSB7XG4gICAgaWYgKGVycm9yT2JqKSB7XG4gICAgICBPYmplY3Qua2V5cyh0aGlzLmVycm9yT2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIGlmICghb2JqZWN0Lmhhc093bihlcnJvck9iaiwgZmllbGQpKSB7XG4gICAgICAgICAgZXJyb3JPYmpbZmllbGRdID0gW11cbiAgICAgICAgfVxuICAgICAgICB2YXIgZXJyb3JzID0gZXJyb3JPYmpbZmllbGRdXG4gICAgICAgIGVycm9ycy5wdXNoLmFwcGx5KGVycm9ycywgdGhpcy5lcnJvck9ialtmaWVsZF0pXG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXJyb3JPYmogPSB0aGlzLmVycm9yT2JqXG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGlmICghb2JqZWN0Lmhhc093bihlcnJvck9iaiwgTk9OX0ZJRUxEX0VSUk9SUykpIHtcbiAgICAgIGVycm9yT2JqW05PTl9GSUVMRF9FUlJPUlNdID0gW11cbiAgICB9XG4gICAgdmFyIG5vbkZpZWxkRXJyb3JzID0gZXJyb3JPYmpbTk9OX0ZJRUxEX0VSUk9SU11cbiAgICBub25GaWVsZEVycm9ycy5wdXNoLmFwcGx5KG5vbkZpZWxkRXJyb3JzLCB0aGlzLmVycm9yTGlzdClcbiAgfVxuICByZXR1cm4gZXJyb3JPYmpcbn1cblxuVmFsaWRhdGlvbkVycm9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKCdWYWxpZGF0aW9uRXJyb3IoJyArIEpTT04uc3RyaW5naWZ5KHRoaXMuX19pdGVyX18oKSkgKyAnKScpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBWYWxpZGF0aW9uRXJyb3I6IFZhbGlkYXRpb25FcnJvclxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBIQUNLOiByZXF1aXJpbmcgJy4vdmFsaWRhdG9ycycgaGVyZSBtYWtlcyB0aGUgY2lyY3VsYXIgaW1wb3J0IGluIGlwdjYuanMgd29ya1xuLy8gICAgICAgYWZ0ZXIgYnJvd3NlcmlmaWNhdGlvbi5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi92YWxpZGF0b3JzJykiLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxuXG52YXIgZXJyb3JzID0gcmVxdWlyZSgnLi9lcnJvcnMnKVxuXG52YXIgVmFsaWRhdGlvbkVycm9yID0gZXJyb3JzLlZhbGlkYXRpb25FcnJvclxuXG52YXIgaGV4UkUgPSAvXlswLTlhLWZdKyQvXG5cbi8qKlxuICogQ2xlYW5zIGEgSVB2NiBhZGRyZXNzIHN0cmluZy5cbiAqXG4gKiBWYWxpZGl0eSBpcyBjaGVja2VkIGJ5IGNhbGxpbmcgaXNWYWxpZElQdjZBZGRyZXNzKCkgLSBpZiBhbiBpbnZhbGlkIGFkZHJlc3NcbiAqIGlzIHBhc3NlZCwgYSBWYWxpZGF0aW9uRXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIFJlcGxhY2VzIHRoZSBsb25nZXN0IGNvbnRpbmlvdXMgemVyby1zZXF1ZW5jZSB3aXRoICc6OicgYW5kIHJlbW92ZXMgbGVhZGluZ1xuICogemVyb2VzIGFuZCBtYWtlcyBzdXJlIGFsbCBoZXh0ZXRzIGFyZSBsb3dlcmNhc2UuXG4gKi9cbmZ1bmN0aW9uIGNsZWFuSVB2NkFkZHJlc3MoaXBTdHIsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICB1bnBhY2tJUHY0OiBmYWxzZSwgZXJyb3JNZXNzYWdlOiAnVGhpcyBpcyBub3QgYSB2YWxpZCBJUHY2IGFkZHJlc3MuJ1xuICB9LCBrd2FyZ3MpXG5cbiAgdmFyIGJlc3REb3VibGVjb2xvblN0YXJ0ID0gLTFcbiAgdmFyIGJlc3REb3VibGVjb2xvbkxlbiA9IDBcbiAgdmFyIGRvdWJsZWNvbG9uU3RhcnQgPSAtMVxuICB2YXIgZG91YmxlY29sb25MZW4gPSAwXG5cbiAgaWYgKCFpc1ZhbGlkSVB2NkFkZHJlc3MoaXBTdHIpKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKGt3YXJncy5lcnJvck1lc3NhZ2UsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG5cbiAgLy8gVGhpcyBhbGdvcml0aG0gY2FuIG9ubHkgaGFuZGxlIGZ1bGx5IGV4cGxvZGVkIElQIHN0cmluZ3NcbiAgaXBTdHIgPSBfZXhwbG9kZVNob3J0aGFuZElQc3RyaW5nKGlwU3RyKVxuICBpcFN0ciA9IF9zYW5pdGlzZUlQdjRNYXBwaW5nKGlwU3RyKVxuXG4gIC8vIElmIG5lZWRlZCwgdW5wYWNrIHRoZSBJUHY0IGFuZCByZXR1cm4gc3RyYWlnaHQgYXdheVxuICBpZiAoa3dhcmdzLnVucGFja0lQdjQpIHtcbiAgICB2YXIgaXB2NFVucGFja2VkID0gX3VucGFja0lQdjQoaXBTdHIpXG4gICAgaWYgKGlwdjRVbnBhY2tlZCkge1xuICAgICAgcmV0dXJuIGlwdjRVbnBhY2tlZFxuICAgIH1cbiAgfVxuXG4gIHZhciBoZXh0ZXRzID0gaXBTdHIuc3BsaXQoJzonKVxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaGV4dGV0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAvLyBSZW1vdmUgbGVhZGluZyB6ZXJvZXNcbiAgICBoZXh0ZXRzW2ldID0gaGV4dGV0c1tpXS5yZXBsYWNlKC9eMCsvLCAnJylcbiAgICBpZiAoaGV4dGV0c1tpXSA9PT0gJycpIHtcbiAgICAgIGhleHRldHNbaV0gPSAnMCdcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgYmVzdCBoZXh0ZXQgdG8gY29tcHJlc3NcbiAgICBpZiAoaGV4dGV0c1tpXSA9PSAnMCcpIHtcbiAgICAgIGRvdWJsZWNvbG9uTGVuICs9IDFcbiAgICAgIGlmIChkb3VibGVjb2xvblN0YXJ0ID09IC0xKSB7XG4gICAgICAgIC8vIFN0YXJ0IGEgc2VxdWVuY2Ugb2YgemVyb3NcbiAgICAgICAgZG91YmxlY29sb25TdGFydCA9IGlcbiAgICAgIH1cbiAgICAgIGlmIChkb3VibGVjb2xvbkxlbiA+IGJlc3REb3VibGVjb2xvbkxlbikge1xuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb25nZXN0IHNlcXVlbmNlIHNvIGZhclxuICAgICAgICBiZXN0RG91YmxlY29sb25MZW4gPSBkb3VibGVjb2xvbkxlblxuICAgICAgICBiZXN0RG91YmxlY29sb25TdGFydCA9IGRvdWJsZWNvbG9uU3RhcnRcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkb3VibGVjb2xvbkxlbiA9IDBcbiAgICAgIGRvdWJsZWNvbG9uU3RhcnQgPSAtMVxuICAgIH1cbiAgfVxuXG4gIC8vIENvbXByZXNzIHRoZSBtb3N0IHN1aXRhYmxlIGhleHRldFxuICBpZiAoYmVzdERvdWJsZWNvbG9uTGVuID4gMSkge1xuICAgIHZhciBiZXN0RG91YmxlY29sb25FbmQgPSBiZXN0RG91YmxlY29sb25TdGFydCArIGJlc3REb3VibGVjb2xvbkxlblxuICAgIC8vIEZvciB6ZXJvcyBhdCB0aGUgZW5kIG9mIHRoZSBhZGRyZXNzXG4gICAgaWYgKGJlc3REb3VibGVjb2xvbkVuZCA9PSBoZXh0ZXRzLmxlbmd0aCkge1xuICAgICAgaGV4dGV0cy5wdXNoKCcnKVxuICAgIH1cbiAgICBoZXh0ZXRzLnNwbGljZShiZXN0RG91YmxlY29sb25TdGFydCwgYmVzdERvdWJsZWNvbG9uTGVuLCAnJylcbiAgICAvLyBGb3IgemVyb3MgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgYWRkcmVzc1xuICAgIGlmIChiZXN0RG91YmxlY29sb25TdGFydCA9PT0gMCkge1xuICAgICAgaGV4dGV0cy51bnNoaWZ0KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBoZXh0ZXRzLmpvaW4oJzonKS50b0xvd2VyQ2FzZSgpXG59XG5cbi8qKlxuICogU2FuaXRpc2VzIElQdjQgbWFwcGluZyBpbiBhIGV4cGFuZGVkIElQdjYgYWRkcmVzcy5cbiAqXG4gKiBUaGlzIGNvbnZlcnRzIDo6ZmZmZjowYTBhOjBhMGEgdG8gOjpmZmZmOjEwLjEwLjEwLjEwLlxuICogSWYgdGhlcmUgaXMgbm90aGluZyB0byBzYW5pdGlzZSwgcmV0dXJucyBhbiB1bmNoYW5nZWQgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBfc2FuaXRpc2VJUHY0TWFwcGluZyhpcFN0cikge1xuICBpZiAoaXBTdHIudG9Mb3dlckNhc2UoKS5pbmRleE9mKCcwMDAwOjAwMDA6MDAwMDowMDAwOjAwMDA6ZmZmZjonKSAhPT0gMCkge1xuICAgIC8vIE5vdCBhbiBpcHY0IG1hcHBpbmdcbiAgICByZXR1cm4gaXBTdHJcbiAgfVxuXG4gIHZhciBoZXh0ZXRzID0gaXBTdHIuc3BsaXQoJzonKVxuXG4gIGlmIChoZXh0ZXRzW2hleHRldHMubGVuZ3RoIC0gMV0uaW5kZXhPZignLicpICE9IC0xKSB7XG4gICAgLy8gQWxyZWFkeSBzYW5pdGl6ZWRcbiAgICByZXR1cm4gaXBTdHJcbiAgfVxuXG4gIHZhciBpcHY0QWRkcmVzcyA9IFtcbiAgICBwYXJzZUludChoZXh0ZXRzWzZdLnN1YnN0cmluZygwLCAyKSwgMTYpXG4gICwgcGFyc2VJbnQoaGV4dGV0c1s2XS5zdWJzdHJpbmcoMiwgNCksIDE2KVxuICAsIHBhcnNlSW50KGhleHRldHNbN10uc3Vic3RyaW5nKDAsIDIpLCAxNilcbiAgLCBwYXJzZUludChoZXh0ZXRzWzddLnN1YnN0cmluZygyLCA0KSwgMTYpXG4gIF0uam9pbignLicpXG5cbiAgcmV0dXJuIGhleHRldHMuc2xpY2UoMCwgNikuam9pbignOicpICsgICc6JyArIGlwdjRBZGRyZXNzXG59XG5cbi8qKlxuICogVW5wYWNrcyBhbiBJUHY0IGFkZHJlc3MgdGhhdCB3YXMgbWFwcGVkIGluIGEgY29tcHJlc3NlZCBJUHY2IGFkZHJlc3MuXG4gKlxuICogVGhpcyBjb252ZXJ0cyAwMDAwOjAwMDA6MDAwMDowMDAwOjAwMDA6ZmZmZjoxMC4xMC4xMC4xMCB0byAxMC4xMC4xMC4xMC5cbiAqIElmIHRoZXJlIGlzIG5vdGhpbmcgdG8gc2FuaXRpemUsIHJldHVybnMgbnVsbC5cbiAqL1xuZnVuY3Rpb24gX3VucGFja0lQdjQoaXBTdHIpIHtcbiAgaWYgKGlwU3RyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignMDAwMDowMDAwOjAwMDA6MDAwMDowMDAwOmZmZmY6JykgIT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgdmFyIGhleHRldHMgPSBpcFN0ci5zcGxpdCgnOicpXG4gIHJldHVybiBoZXh0ZXRzLnBvcCgpXG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB3ZSBoYXZlIGEgdmFsaWQgSVB2NiBhZGRyZXNzLlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkSVB2NkFkZHJlc3MoaXBTdHIpIHtcbiAgdmFyIHZhbGlkYXRlSVB2NEFkZHJlc3MgPSByZXF1aXJlKCcuL3ZhbGlkYXRvcnMnKS52YWxpZGF0ZUlQdjRBZGRyZXNzXG5cbiAgLy8gV2UgbmVlZCB0byBoYXZlIGF0IGxlYXN0IG9uZSAnOidcbiAgaWYgKGlwU3RyLmluZGV4T2YoJzonKSA9PSAtMSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gV2UgY2FuIG9ubHkgaGF2ZSBvbmUgJzo6JyBzaG9ydGVuZXJcbiAgaWYgKFN0cmluZ19jb3VudChpcFN0ciwgJzo6JykgPiAxKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyAnOjonIHNob3VsZCBiZSBlbmNvbXBhc3NlZCBieSBzdGFydCwgZGlnaXRzIG9yIGVuZFxuICBpZiAoaXBTdHIuaW5kZXhPZignOjo6JykgIT0gLTEpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIEEgc2luZ2xlIGNvbG9uIGNhbiBuZWl0aGVyIHN0YXJ0IG5vciBlbmQgYW4gYWRkcmVzc1xuICBpZiAoKGlwU3RyLmNoYXJBdCgwKSA9PSAnOicgJiYgaXBTdHIuY2hhckF0KDEpICE9ICc6JykgfHxcbiAgICAgIChpcFN0ci5jaGFyQXQoaXBTdHIubGVuZ3RoIC0gMSkgPT0gJzonICYmXG4gICAgICAgaXBTdHIuY2hhckF0KGlwU3RyLmxlbmd0aCAtIDIpICE9ICc6JykpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIFdlIGNhbiBuZXZlciBoYXZlIG1vcmUgdGhhbiA3ICc6JyAoMTo6MjozOjQ6NTo2Ojc6OCBpcyBpbnZhbGlkKVxuICBpZiAoU3RyaW5nX2NvdW50KGlwU3RyLCAnOicpID4gNykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gSWYgd2UgaGF2ZSBubyBjb25jYXRlbmF0aW9uLCB3ZSBuZWVkIHRvIGhhdmUgOCBmaWVsZHMgd2l0aCA3ICc6J1xuICBpZiAoaXBTdHIuaW5kZXhPZignOjonKSA9PSAtMSAmJiBTdHJpbmdfY291bnQoaXBTdHIsICc6JykgIT0gNykge1xuICAgIC8vIFdlIG1pZ2h0IGhhdmUgYW4gSVB2NCBtYXBwZWQgYWRkcmVzc1xuICAgIGlmIChTdHJpbmdfY291bnQoaXBTdHIsICcuJykgIT0gMykge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgaXBTdHIgPSBfZXhwbG9kZVNob3J0aGFuZElQc3RyaW5nKGlwU3RyKVxuXG4gIC8vIE5vdyB0aGF0IHdlIGhhdmUgdGhhdCBhbGwgc3F1YXJlZCBhd2F5LCBsZXQncyBjaGVjayB0aGF0IGVhY2ggb2YgdGhlXG4gIC8vIGhleHRldHMgYXJlIGJldHdlZW4gMHgwIGFuZCAweEZGRkYuXG4gIHZhciBoZXh0ZXRzID0gaXBTdHIuc3BsaXQoJzonKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGhleHRldHMubGVuZ3RoLCBoZXh0ZXQ7IGkgPCBsOyBpKyspIHtcbiAgICBoZXh0ZXQgPSBoZXh0ZXRzW2ldXG4gICAgaWYgKFN0cmluZ19jb3VudChoZXh0ZXQsICcuJykgPT0gMykge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBJUHY0IG1hcHBlZCBhZGRyZXNzLCB0aGUgSVB2NCBwb3J0aW9uIGhhcyB0b1xuICAgICAgLy8gYmUgYXQgdGhlIGVuZCBvZiB0aGUgSVB2NiBwb3J0aW9uLlxuICAgICAgaWYgKGlwU3RyLnNwbGl0KCc6JykucG9wKCkgIT0gaGV4dGV0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFsaWRhdGVJUHY0QWRkcmVzcyhoZXh0ZXQpXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkge1xuICAgICAgICAgIHRocm93IGVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoIWhleFJFLnRlc3QoaGV4dGV0KSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIHZhciBpbnRWYWx1ZSA9IHBhcnNlSW50KGhleHRldCwgMTYpXG4gICAgICBpZiAoaXNOYU4oaW50VmFsdWUpIHx8IGludFZhbHVlIDwgMHgwIHx8IGludFZhbHVlID4gMHhGRkZGKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogRXhwYW5kcyBhIHNob3J0ZW5lZCBJUHY2IGFkZHJlc3MuXG4gKi9cbmZ1bmN0aW9uIF9leHBsb2RlU2hvcnRoYW5kSVBzdHJpbmcoaXBTdHIpIHtcbiAgaWYgKCFfaXNTaG9ydEhhbmQoaXBTdHIpKSB7XG4gICAgLy8gV2UndmUgYWxyZWFkeSBnb3QgYSBsb25naGFuZCBpcFN0clxuICAgIHJldHVybiBpcFN0clxuICB9XG5cbiAgdmFyIG5ld0lwID0gW11cbiAgdmFyIGhleHRldHMgPSBpcFN0ci5zcGxpdCgnOjonKVxuXG4gIC8vIElmIHRoZXJlIGlzIGEgOjosIHdlIG5lZWQgdG8gZXhwYW5kIGl0IHdpdGggemVyb2VzIHRvIGdldCB0byA4IGhleHRldHMgLVxuICAvLyB1bmxlc3MgdGhlcmUgaXMgYSBkb3QgaW4gdGhlIGxhc3QgaGV4dGV0LCBtZWFuaW5nIHdlJ3JlIGRvaW5nIHY0LW1hcHBpbmdcbiAgdmFyIGZpbGxUbyA9IChpcFN0ci5zcGxpdCgnOicpLnBvcCgpLmluZGV4T2YoJy4nKSAhPSAtMSkgPyA3IDogOFxuXG4gIGlmIChoZXh0ZXRzLmxlbmd0aCA+IDEpIHtcbiAgICB2YXIgc2VwID0gaGV4dGV0c1swXS5zcGxpdCgnOicpLmxlbmd0aCArIGhleHRldHNbMV0uc3BsaXQoJzonKS5sZW5ndGhcbiAgICBuZXdJcCA9IGhleHRldHNbMF0uc3BsaXQoJzonKVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZmlsbFRvIC0gc2VwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBuZXdJcC5wdXNoKCcwMDAwJylcbiAgICB9XG4gICAgbmV3SXAgPSBuZXdJcC5jb25jYXQoaGV4dGV0c1sxXS5zcGxpdCgnOicpKVxuICB9XG4gIGVsc2Uge1xuICAgIG5ld0lwID0gaXBTdHIuc3BsaXQoJzonKVxuICB9XG5cbiAgLy8gTm93IG5lZWQgdG8gbWFrZSBzdXJlIGV2ZXJ5IGhleHRldCBpcyA0IGxvd2VyIGNhc2UgY2hhcmFjdGVycy5cbiAgLy8gSWYgYSBoZXh0ZXQgaXMgPCA0IGNoYXJhY3RlcnMsIHdlJ3ZlIGdvdCBtaXNzaW5nIGxlYWRpbmcgMCdzLlxuICB2YXIgcmV0SXAgPSBbXVxuICBmb3IgKGkgPSAwLCBsID0gbmV3SXAubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcmV0SXAucHVzaCh6ZXJvUGFkZGluZyhuZXdJcFtpXSwgNCkgKyBuZXdJcFtpXS50b0xvd2VyQ2FzZSgpKVxuICB9XG4gIHJldHVybiByZXRJcC5qb2luKCc6Jylcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIHRoZSBhZGRyZXNzIGlzIHNob3J0ZW5lZC5cbiAqL1xuZnVuY3Rpb24gX2lzU2hvcnRIYW5kKGlwU3RyKSB7XG4gIGlmIChTdHJpbmdfY291bnQoaXBTdHIsICc6OicpID09IDEpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHZhciBwYXJ0cyA9IGlwU3RyLnNwbGl0KCc6JylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAocGFydHNbaV0ubGVuZ3RoIDwgNCkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIFV0aWxpdGllc1xuXG5mdW5jdGlvbiB6ZXJvUGFkZGluZyhzdHIsIGxlbmd0aCkge1xuICBpZiAoc3RyLmxlbmd0aCA+PSBsZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuICByZXR1cm4gbmV3IEFycmF5KGxlbmd0aCAtIHN0ci5sZW5ndGggKyAxKS5qb2luKCcwJylcbn1cblxuZnVuY3Rpb24gU3RyaW5nX2NvdW50KHN0ciwgc3ViU3RyKSB7XG4gIHJldHVybiBzdHIuc3BsaXQoc3ViU3RyKS5sZW5ndGggLSAxXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjbGVhbklQdjZBZGRyZXNzOiBjbGVhbklQdjZBZGRyZXNzXG4sIGlzVmFsaWRJUHY2QWRkcmVzczogaXNWYWxpZElQdjZBZGRyZXNzXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25jdXIgPSByZXF1aXJlKCdDb25jdXInKVxudmFyIGlzID0gcmVxdWlyZSgnaXNvbW9ycGgvaXMnKVxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG52YXIgcHVueWNvZGUgPSByZXF1aXJlKCdwdW55Y29kZScpXG52YXIgdXJsID0gcmVxdWlyZSgnaXNvbW9ycGgvdXJsJylcblxudmFyIGVycm9ycyA9IHJlcXVpcmUoJy4vZXJyb3JzJylcbnZhciBpcHY2ID0gcmVxdWlyZSgnLi9pcHY2JylcblxudmFyIFZhbGlkYXRpb25FcnJvciA9IGVycm9ycy5WYWxpZGF0aW9uRXJyb3JcbnZhciBpc1ZhbGlkSVB2NkFkZHJlc3MgPSBpcHY2LmlzVmFsaWRJUHY2QWRkcmVzc1xuXG52YXIgRU1QVFlfVkFMVUVTID0gW251bGwsIHVuZGVmaW5lZCwgJyddXG5cbmZ1bmN0aW9uIFN0cmluZ19yc3BsaXQoc3RyLCBzZXAsIG1heHNwbGl0KSB7XG4gIHZhciBzcGxpdCA9IHN0ci5zcGxpdChzZXApXG4gIHJldHVybiBtYXhzcGxpdCA/IFtzcGxpdC5zbGljZSgwLCAtbWF4c3BsaXQpLmpvaW4oc2VwKV0uY29uY2F0KHNwbGl0LnNsaWNlKC1tYXhzcGxpdCkpIDogc3BsaXRcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBtYXRjaGVzIGEgcmVndWxhciBleHByZXNzaW9uLlxuICovXG52YXIgUmVnZXhWYWxpZGF0b3IgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZWdleFZhbGlkYXRvcikpIHsgcmV0dXJuIG5ldyBSZWdleFZhbGlkYXRvcihrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICAgIHJlZ2V4OiBudWxsLCBtZXNzYWdlOiBudWxsLCBjb2RlOiBudWxsLCBpbnZlcnNlTWF0Y2g6IG51bGxcbiAgICB9LCBrd2FyZ3MpXG4gICAgaWYgKGt3YXJncy5yZWdleCkge1xuICAgICAgdGhpcy5yZWdleCA9IGt3YXJncy5yZWdleFxuICAgIH1cbiAgICBpZiAoa3dhcmdzLm1lc3NhZ2UpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IGt3YXJncy5tZXNzYWdlXG4gICAgfVxuICAgIGlmIChrd2FyZ3MuY29kZSkge1xuICAgICAgdGhpcy5jb2RlID0ga3dhcmdzLmNvZGVcbiAgICB9XG4gICAgaWYgKGt3YXJncy5pbnZlcnNlTWF0Y2gpIHtcbiAgICAgIHRoaXMuaW52ZXJzZU1hdGNoID0ga3dhcmdzLmludmVyc2VNYXRjaFxuICAgIH1cbiAgICAvLyBDb21waWxlIHRoZSByZWdleCBpZiBpdCB3YXMgbm90IHBhc3NlZCBwcmUtY29tcGlsZWRcbiAgICBpZiAoaXMuU3RyaW5nKHRoaXMucmVnZXgpKSB7XG4gICAgICB0aGlzLnJlZ2V4ID0gbmV3IFJlZ0V4cCh0aGlzLnJlZ2V4KVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2NhbGxfXy5iaW5kKHRoaXMpXG4gIH1cbiwgcmVnZXg6ICcnXG4sIG1lc3NhZ2U6ICdFbnRlciBhIHZhbGlkIHZhbHVlLidcbiwgY29kZTogJ2ludmFsaWQnXG4sIGludmVyc2VNYXRjaDogZmFsc2VcbiwgX19jYWxsX186IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuaW52ZXJzZU1hdGNoID09PSB0aGlzLnJlZ2V4LnRlc3QoJycrdmFsdWUpKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5tZXNzYWdlLCB7Y29kZTogdGhpcy5jb2RlfSlcbiAgICB9XG4gIH1cbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaW5wdXQgbG9va3MgbGlrZSBhIHZhbGlkIFVSTC5cbiAqL1xudmFyIFVSTFZhbGlkYXRvciA9IFJlZ2V4VmFsaWRhdG9yLmV4dGVuZCh7XG4gIHJlZ2V4OiBuZXcgUmVnRXhwKFxuICAgICdeKD86W2EtejAtOVxcXFwuXFxcXC1dKik6Ly8nICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYSBpcyB2YWxpZGF0ZWQgc2VwYXJhdGVseVxuICArICcoPzooPzpbQS1aMC05XSg/OltBLVowLTktXXswLDYxfVtBLVowLTldKT9cXFxcLikrKD86W0EtWl17Miw2fVxcXFwuP3xbQS1aMC05LV17Mix9XFxcXC4/KXwnIC8vIERvbWFpbi4uLlxuICArICdsb2NhbGhvc3R8JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9jYWxob3N0Li4uXG4gICsgJ1xcXFxkezEsM31cXFxcLlxcXFxkezEsM31cXFxcLlxcXFxkezEsM31cXFxcLlxcXFxkezEsM318JyAgICAgIC8vIC4uLm9yIElQdjRcbiAgKyAnXFxcXFs/W0EtRjAtOV0qOltBLUYwLTk6XStcXFxcXT8pJyAgICAgICAgICAgICAgICAgICAvLyAuLi5vciBJUHY2XG4gICsgJyg/OjpcXFxcZCspPycgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wdGlvbmFsIHBvcnRcbiAgKyAnKD86Lz98Wy8/XVxcXFxTKykkJ1xuICAsICdpJ1xuICApXG4sIG1lc3NhZ2U6ICdFbnRlciBhIHZhbGlkIFVSTC4nXG4sIHNjaGVtZXM6IFsnaHR0cCcsICdodHRwcycsICdmdHAnLCAnZnRwcyddXG5cbiwgY29uc3RydWN0b3I6ZnVuY3Rpb24oa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFVSTFZhbGlkYXRvcikpIHsgcmV0dXJuIG5ldyBVUkxWYWxpZGF0b3Ioa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7c2NoZW1lczogbnVsbH0sIGt3YXJncylcbiAgICBSZWdleFZhbGlkYXRvci5jYWxsKHRoaXMsIGt3YXJncylcbiAgICBpZiAoa3dhcmdzLnNjaGVtZXMgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZW1lcyA9IGt3YXJncy5zY2hlbWVzXG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fY2FsbF9fLmJpbmQodGhpcylcbiAgfVxuXG4sIF9fY2FsbF9fOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhbHVlID0gJycrdmFsdWVcbiAgICAvLyBDaGVjayBpZiB0aGUgc2NoZW1lIGlzIHZhbGlkIGZpcnN0XG4gICAgdmFyIHNjaGVtZSA9IHZhbHVlLnNwbGl0KCc6Ly8nKVswXS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKHRoaXMuc2NoZW1lcy5pbmRleE9mKHNjaGVtZSkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5tZXNzYWdlLCB7Y29kZTogdGhpcy5jb2RlfSlcbiAgICB9XG5cbiAgICAvLyBDaGVjayB0aGUgZnVsbCBVUkxcbiAgICB0cnkge1xuICAgICAgUmVnZXhWYWxpZGF0b3IucHJvdG90eXBlLl9fY2FsbF9fLmNhbGwodGhpcywgdmFsdWUpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cblxuICAgICAgLy8gVHJpdmlhbCBjYXNlIGZhaWxlZCAtIHRyeSBmb3IgcG9zc2libGUgSUROIGRvbWFpblxuICAgICAgdmFyIHVybEZpZWxkcyA9IHVybC5wYXJzZVVyaSh2YWx1ZSlcbiAgICAgIHRyeSB7XG4gICAgICAgIHVybEZpZWxkcy5ob3N0ID0gcHVueWNvZGUudG9BU0NJSSh1cmxGaWVsZHMuaG9zdClcbiAgICAgIH1cbiAgICAgIGNhdGNoICh1bmljb2RlRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZVxuICAgICAgfVxuICAgICAgdmFsdWUgPSB1cmwubWFrZVVyaSh1cmxGaWVsZHMpXG4gICAgICBSZWdleFZhbGlkYXRvci5wcm90b3R5cGUuX19jYWxsX18uY2FsbCh0aGlzLCB2YWx1ZSlcbiAgICB9XG4gIH1cbn0pXG5cbi8qKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBsb29rcyBsaWtlIGEgdmFsaWQgZS1tYWlsIGFkZHJlc3MuICovXG52YXIgRW1haWxWYWxpZGF0b3IgPSBDb25jdXIuZXh0ZW5kKHtcbiAgbWVzc2FnZTogJ0VudGVyIGEgdmFsaWQgZW1haWwgYWRkcmVzcy4nXG4sIGNvZGU6ICdpbnZhbGlkJ1xuLCB1c2VyUmVnZXg6IG5ldyBSZWdFeHAoXG4gICAgXCIoXlstISMkJSYnKisvPT9eX2B7fXx+MC05QS1aXSsoXFxcXC5bLSEjJCUmJyorLz0/Xl9ge318fjAtOUEtWl0rKSokXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb3QtYXRvbVxuICArICd8XlwiKFtcXFxcMDAxLVxcXFwwMTBcXFxcMDEzXFxcXDAxNFxcXFwwMTYtXFxcXDAzNyEjLVxcXFxbXFxcXF0tXFxcXDE3N118XFxcXFxcXFxbXFxcXDAwMS1cXFxcMDExXFxcXDAxM1xcXFwwMTRcXFxcMDE2LVxcXFwxNzddKSpcIiQpJyAvLyBRdW90ZWQtc3RyaW5nXG4gICwgJ2knKVxuLCBkb21haW5SZWdleDogbmV3IFJlZ0V4cChcbiAgICAnXig/OltBLVowLTldKD86W0EtWjAtOS1dezAsNjF9W0EtWjAtOV0pP1xcXFwuKSsoPzpbQS1aXXsyLDZ9fFtBLVowLTktXXsyLH0pJCcgICAgICAgICAgLy8gRG9tYWluXG4gICsgJ3xeXFxcXFsoMjVbMC01XXwyWzAtNF1cXFxcZHxbMC0xXT9cXFxcZD9cXFxcZCkoXFxcXC4oMjVbMC01XXwyWzAtNF1cXFxcZHxbMC0xXT9cXFxcZD9cXFxcZCkpezN9XFxcXF0kJyAvLyBMaXRlcmFsIGZvcm0sIGlwdjQgYWRkcmVzcyAoU01UUCA0LjEuMylcbiAgLCAnaScpXG4sIGRvbWFpbldoaXRlbGlzdDogWydsb2NhbGhvc3QnXVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRW1haWxWYWxpZGF0b3IpKSB7IHJldHVybiBuZXcgRW1haWxWYWxpZGF0b3Ioa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7bWVzc2FnZTogbnVsbCwgY29kZTogbnVsbCwgd2hpdGVsaXN0OiBudWxsfSwga3dhcmdzKVxuICAgIGlmIChrd2FyZ3MubWVzc2FnZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5tZXNzYWdlID0ga3dhcmdzLm1lc3NhZ2VcbiAgICB9XG4gICAgaWYgKGt3YXJncy5jb2RlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNvZGUgPSBrd2FyZ3MuY29kZVxuICAgIH1cbiAgICBpZiAoa3dhcmdzLndoaXRlbGlzdCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5kb21haW5XaGl0ZWxpc3QgPSBrd2FyZ3Mud2hpdGVsaXN0XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fY2FsbF9fLmJpbmQodGhpcylcbiAgfVxuXG4sIF9fY2FsbF9fIDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YWx1ZSA9ICcnK3ZhbHVlXG5cbiAgICBpZiAoIXZhbHVlIHx8IHZhbHVlLmluZGV4T2YoJ0AnKSA9PSAtMSkge1xuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMubWVzc2FnZSwge2NvZGU6IHRoaXMuY29kZX0pXG4gICAgfVxuXG4gICAgdmFyIHBhcnRzID0gU3RyaW5nX3JzcGxpdCh2YWx1ZSwgJ0AnLCAxKVxuICAgIHZhciB1c2VyUGFydCA9IHBhcnRzWzBdXG4gICAgdmFyIGRvbWFpblBhcnQgPSBwYXJ0c1sxXVxuXG4gICAgaWYgKCF0aGlzLnVzZXJSZWdleC50ZXN0KHVzZXJQYXJ0KSkge1xuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMubWVzc2FnZSwge2NvZGU6IHRoaXMuY29kZX0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZG9tYWluV2hpdGVsaXN0LmluZGV4T2YoZG9tYWluUGFydCkgPT0gLTEgJiZcbiAgICAgICAgIXRoaXMuZG9tYWluUmVnZXgudGVzdChkb21haW5QYXJ0KSkge1xuICAgICAgLy8gVHJ5IGZvciBwb3NzaWJsZSBJRE4gZG9tYWluLXBhcnRcbiAgICAgIHRyeSB7XG4gICAgICAgIGRvbWFpblBhcnQgPSBwdW55Y29kZS50b0FTQ0lJKGRvbWFpblBhcnQpXG4gICAgICAgIGlmICh0aGlzLmRvbWFpblJlZ2V4LnRlc3QoZG9tYWluUGFydCkpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2F0Y2ggKHVuaWNvZGVFcnJvcikge1xuICAgICAgICAvLyBQYXNzIHRocm91Z2ggdG8gdGhyb3cgdGhlIFZhbGlkYXRpb25FcnJvclxuICAgICAgfVxuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMubWVzc2FnZSwge2NvZGU6IHRoaXMuY29kZX0pXG4gICAgfVxuICB9XG59KVxuXG52YXIgdmFsaWRhdGVFbWFpbCA9IEVtYWlsVmFsaWRhdG9yKClcblxudmFyIFNMVUdfUkUgPSAvXlstYS16QS1aMC05X10rJC9cbi8qKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBpcyBhIHZhbGlkIHNsdWcuICovXG52YXIgdmFsaWRhdGVTbHVnID0gUmVnZXhWYWxpZGF0b3Ioe1xuICByZWdleDogU0xVR19SRVxuLCBtZXNzYWdlOiAnRW50ZXIgYSB2YWxpZCBcInNsdWdcIiBjb25zaXN0aW5nIG9mIGxldHRlcnMsIG51bWJlcnMsIHVuZGVyc2NvcmVzIG9yIGh5cGhlbnMuJ1xuLCBjb2RlOiAnaW52YWxpZCdcbn0pXG5cbnZhciBJUFY0X1JFID0gL14oMjVbMC01XXwyWzAtNF1cXGR8WzAtMV0/XFxkP1xcZCkoXFwuKDI1WzAtNV18MlswLTRdXFxkfFswLTFdP1xcZD9cXGQpKXszfSQvXG4vKiogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgYSB2YWxpZCBJUHY0IGFkZHJlc3MuICovXG52YXIgdmFsaWRhdGVJUHY0QWRkcmVzcyA9IFJlZ2V4VmFsaWRhdG9yKHtcbiAgcmVnZXg6IElQVjRfUkVcbiwgbWVzc2FnZTogJ0VudGVyIGEgdmFsaWQgSVB2NCBhZGRyZXNzLidcbiwgY29kZTogJ2ludmFsaWQnXG59KVxuXG4vKiogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgYSB2YWxpZCBJUHY2IGFkZHJlc3MuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUlQdjZBZGRyZXNzKHZhbHVlKSB7XG4gIGlmICghaXNWYWxpZElQdjZBZGRyZXNzKHZhbHVlKSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcignRW50ZXIgYSB2YWxpZCBJUHY2IGFkZHJlc3MuJywge2NvZGU6ICdpbnZhbGlkJ30pXG4gIH1cbn1cblxuLyoqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGlzIGEgdmFsaWQgSVB2NCBvciBJUHY2IGFkZHJlc3MuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUlQdjQ2QWRkcmVzcyh2YWx1ZSkge1xuICB0cnkge1xuICAgIHZhbGlkYXRlSVB2NEFkZHJlc3ModmFsdWUpXG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICB0cnkge1xuICAgICAgdmFsaWRhdGVJUHY2QWRkcmVzcyh2YWx1ZSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7IHRocm93IGUgfVxuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKCdFbnRlciBhIHZhbGlkIElQdjQgb3IgSVB2NiBhZGRyZXNzLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvZGU6ICdpbnZhbGlkJ30pXG4gICAgfVxuICB9XG59XG5cbnZhciBpcEFkZHJlc3NWYWxpZGF0b3JMb29rdXAgPSB7XG4gIGJvdGg6IHt2YWxpZGF0b3JzOiBbdmFsaWRhdGVJUHY0NkFkZHJlc3NdLCBtZXNzYWdlOiAnRW50ZXIgYSB2YWxpZCBJUHY0IG9yIElQdjYgYWRkcmVzcy4nfVxuLCBpcHY0OiB7dmFsaWRhdG9yczogW3ZhbGlkYXRlSVB2NEFkZHJlc3NdLCBtZXNzYWdlOiAnRW50ZXIgYSB2YWxpZCBJUHY0IGFkZHJlc3MuJ31cbiwgaXB2Njoge3ZhbGlkYXRvcnM6IFt2YWxpZGF0ZUlQdjZBZGRyZXNzXSwgbWVzc2FnZTogJ0VudGVyIGEgdmFsaWQgSVB2NiBhZGRyZXNzLid9XG59XG5cbi8qKlxuICogRGVwZW5kaW5nIG9uIHRoZSBnaXZlbiBwYXJhbWV0ZXJzIHJldHVybnMgdGhlIGFwcHJvcHJpYXRlIHZhbGlkYXRvcnMgZm9yXG4gKiBhIEdlbmVyaWNJUEFkZHJlc3NGaWVsZC5cbiAqL1xuZnVuY3Rpb24gaXBBZGRyZXNzVmFsaWRhdG9ycyhwcm90b2NvbCwgdW5wYWNrSVB2NCkge1xuICBpZiAocHJvdG9jb2wgIT0gJ2JvdGgnICYmIHVucGFja0lQdjQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW4gb25seSB1c2UgdW5wYWNrSVB2NCBpZiBwcm90b2NvbCBpcyBzZXQgdG8gXCJib3RoXCInKVxuICB9XG4gIHByb3RvY29sID0gcHJvdG9jb2wudG9Mb3dlckNhc2UoKVxuICBpZiAodHlwZW9mIGlwQWRkcmVzc1ZhbGlkYXRvckxvb2t1cFtwcm90b2NvbF0gPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm90b2NvbCBcIicgKyBwcm90b2NvbCArJ1wiIGlzIHVua25vd24nKVxuICB9XG4gIHJldHVybiBpcEFkZHJlc3NWYWxpZGF0b3JMb29rdXBbcHJvdG9jb2xdXG59XG5cbnZhciBDT01NQV9TRVBBUkFURURfSU5UX0xJU1RfUkUgPSAvXltcXGQsXSskL1xuLyoqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGlzIGEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgaW50ZWdlcnMuICovXG52YXIgdmFsaWRhdGVDb21tYVNlcGFyYXRlZEludGVnZXJMaXN0ID0gUmVnZXhWYWxpZGF0b3Ioe1xuICByZWdleDogQ09NTUFfU0VQQVJBVEVEX0lOVF9MSVNUX1JFXG4sIG1lc3NhZ2U6ICdFbnRlciBvbmx5IGRpZ2l0cyBzZXBhcmF0ZWQgYnkgY29tbWFzLidcbiwgY29kZTogJ2ludmFsaWQnXG59KVxuXG4vKipcbiAqIEJhc2UgZm9yIHZhbGlkYXRvcnMgd2hpY2ggY29tcGFyZSBpbnB1dCBhZ2FpbnN0IGEgZ2l2ZW4gdmFsdWUuXG4gKi9cbnZhciBCYXNlVmFsaWRhdG9yID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihsaW1pdFZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJhc2VWYWxpZGF0b3IpKSB7IHJldHVybiBuZXcgQmFzZVZhbGlkYXRvcihsaW1pdFZhbHVlKSB9XG4gICAgdGhpcy5saW1pdFZhbHVlID0gbGltaXRWYWx1ZVxuICAgIHJldHVybiB0aGlzLl9fY2FsbF9fLmJpbmQodGhpcylcbiAgfVxuLCBjb21wYXJlOiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICE9PSBiIH1cbiwgY2xlYW46IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHggfVxuLCBtZXNzYWdlOiAnRW5zdXJlIHRoaXMgdmFsdWUgaXMge2xpbWl0VmFsdWV9IChpdCBpcyB7c2hvd1ZhbHVlfSkuJ1xuLCBjb2RlOiAnbGltaXRWYWx1ZSdcbiwgX19jYWxsX186IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGNsZWFuZWQgPSB0aGlzLmNsZWFuKHZhbHVlKVxuICAgIHZhciBwYXJhbXMgPSB7bGltaXRWYWx1ZTogdGhpcy5saW1pdFZhbHVlLCBzaG93VmFsdWU6IGNsZWFuZWR9XG4gICAgaWYgKHRoaXMuY29tcGFyZShjbGVhbmVkLCB0aGlzLmxpbWl0VmFsdWUpKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5tZXNzYWdlLCB7Y29kZTogdGhpcy5jb2RlLCBwYXJhbXM6IHBhcmFtc30pXG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBhIGdpdmVuIHZhbHVlLlxuICovXG52YXIgTWF4VmFsdWVWYWxpZGF0b3IgPSBCYXNlVmFsaWRhdG9yLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihsaW1pdFZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1heFZhbHVlVmFsaWRhdG9yKSkgeyByZXR1cm4gbmV3IE1heFZhbHVlVmFsaWRhdG9yKGxpbWl0VmFsdWUpIH1cbiAgICByZXR1cm4gQmFzZVZhbGlkYXRvci5jYWxsKHRoaXMsIGxpbWl0VmFsdWUpXG4gIH1cbiwgY29tcGFyZTogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSA+IGIgfVxuLCBtZXNzYWdlOiAnRW5zdXJlIHRoaXMgdmFsdWUgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHtsaW1pdFZhbHVlfS4nXG4sIGNvZGU6ICdtYXhWYWx1ZSdcbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGEgZ2l2ZW4gdmFsdWUuXG4gKi9cbnZhciBNaW5WYWx1ZVZhbGlkYXRvciA9IEJhc2VWYWxpZGF0b3IuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGxpbWl0VmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWluVmFsdWVWYWxpZGF0b3IpKSB7IHJldHVybiBuZXcgTWluVmFsdWVWYWxpZGF0b3IobGltaXRWYWx1ZSkgfVxuICAgIHJldHVybiBCYXNlVmFsaWRhdG9yLmNhbGwodGhpcywgbGltaXRWYWx1ZSlcbiAgfVxuLCBjb21wYXJlOiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIDwgYiB9XG4sIG1lc3NhZ2U6ICdFbnN1cmUgdGhpcyB2YWx1ZSBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8ge2xpbWl0VmFsdWV9LidcbiwgY29kZTogJ21pblZhbHVlJ1xufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBpcyBhdCBsZWFzdCBhIGdpdmVuIGxlbmd0aC5cbiAqL1xudmFyIE1pbkxlbmd0aFZhbGlkYXRvciA9IEJhc2VWYWxpZGF0b3IuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGxpbWl0VmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWluTGVuZ3RoVmFsaWRhdG9yKSkgeyByZXR1cm4gbmV3IE1pbkxlbmd0aFZhbGlkYXRvcihsaW1pdFZhbHVlKSB9XG4gICAgcmV0dXJuIEJhc2VWYWxpZGF0b3IuY2FsbCh0aGlzLCBsaW1pdFZhbHVlKVxuICB9XG4sIGNvbXBhcmU6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgPCBiIH1cbiwgY2xlYW46IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgubGVuZ3RoIH1cbiwgbWVzc2FnZTogJ0Vuc3VyZSB0aGlzIHZhbHVlIGhhcyBhdCBsZWFzdCB7bGltaXRWYWx1ZX0gY2hhcmFjdGVycyAoaXQgaGFzIHtzaG93VmFsdWV9KS4nXG4sIGNvZGU6ICdtaW5MZW5ndGgnXG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGlzIGF0IG1vc3QgYSBnaXZlbiBsZW5ndGguXG4gKi9cbnZhciBNYXhMZW5ndGhWYWxpZGF0b3IgPSBCYXNlVmFsaWRhdG9yLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihsaW1pdFZhbHVlKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1heExlbmd0aFZhbGlkYXRvcikpIHsgcmV0dXJuIG5ldyBNYXhMZW5ndGhWYWxpZGF0b3IobGltaXRWYWx1ZSkgfVxuICAgIHJldHVybiBCYXNlVmFsaWRhdG9yLmNhbGwodGhpcywgbGltaXRWYWx1ZSlcbiAgfVxuLCBjb21wYXJlOiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhID4gYiB9XG4sIGNsZWFuOiBmdW5jdGlvbih4KSB7IHJldHVybiB4Lmxlbmd0aCB9XG4sIG1lc3NhZ2U6ICdFbnN1cmUgdGhpcyB2YWx1ZSBoYXMgYXQgbW9zdCB7bGltaXRWYWx1ZX0gY2hhcmFjdGVycyAoaXQgaGFzIHtzaG93VmFsdWV9KS4nXG4sIGNvZGU6ICdtYXhMZW5ndGgnXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgRU1QVFlfVkFMVUVTOiBFTVBUWV9WQUxVRVNcbiwgUmVnZXhWYWxpZGF0b3I6IFJlZ2V4VmFsaWRhdG9yXG4sIFVSTFZhbGlkYXRvcjogVVJMVmFsaWRhdG9yXG4sIEVtYWlsVmFsaWRhdG9yOiBFbWFpbFZhbGlkYXRvclxuLCB2YWxpZGF0ZUVtYWlsOiB2YWxpZGF0ZUVtYWlsXG4sIHZhbGlkYXRlU2x1ZzogdmFsaWRhdGVTbHVnXG4sIHZhbGlkYXRlSVB2NEFkZHJlc3M6IHZhbGlkYXRlSVB2NEFkZHJlc3NcbiwgdmFsaWRhdGVJUHY2QWRkcmVzczogdmFsaWRhdGVJUHY2QWRkcmVzc1xuLCB2YWxpZGF0ZUlQdjQ2QWRkcmVzczogdmFsaWRhdGVJUHY0NkFkZHJlc3NcbiwgaXBBZGRyZXNzVmFsaWRhdG9yczogaXBBZGRyZXNzVmFsaWRhdG9yc1xuLCB2YWxpZGF0ZUNvbW1hU2VwYXJhdGVkSW50ZWdlckxpc3Q6IHZhbGlkYXRlQ29tbWFTZXBhcmF0ZWRJbnRlZ2VyTGlzdFxuLCBCYXNlVmFsaWRhdG9yOiBCYXNlVmFsaWRhdG9yXG4sIE1heFZhbHVlVmFsaWRhdG9yOiBNYXhWYWx1ZVZhbGlkYXRvclxuLCBNaW5WYWx1ZVZhbGlkYXRvcjogTWluVmFsdWVWYWxpZGF0b3JcbiwgTWF4TGVuZ3RoVmFsaWRhdG9yOiBNYXhMZW5ndGhWYWxpZGF0b3JcbiwgTWluTGVuZ3RoVmFsaWRhdG9yOiBNaW5MZW5ndGhWYWxpZGF0b3JcbiwgVmFsaWRhdGlvbkVycm9yOiBWYWxpZGF0aW9uRXJyb3JcbiwgaXB2NjogaXB2NlxufVxuIl19
