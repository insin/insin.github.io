/**
 * newforms 0.10.0-alpha (dev build at Sun, 07 Dec 2014 16:40:54 GMT) - https://github.com/insin/newforms
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

module.exports = ErrorList

},{"Concur":13,"validators":22}],4:[function(require,module,exports){
'use strict';

var Concur = require('Concur')
var object = require('isomorph/object')
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)

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

module.exports = ErrorObject

},{"Concur":13,"isomorph/object":18}],5:[function(require,module,exports){
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
      onChange: null
    }, kwargs)
    this.isInitialRender = (kwargs.data === null && kwargs.files === null)
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
      if (kwargs.validation === null) {
        kwargs.validation = 'auto'
      }
    }
    this.validation = util.normaliseValidation(kwargs.validation || 'manual')

    this._errors = null

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
 * Validates the form using its current input data.
 * @param {function(err, isValid, cleanedData)=} cb callback for asynchronous
 *   validation.
 * @return {boolean|undefined} true if the form only has synchronous validation
 *   and is valid.
 * @throws if the form has asynchronous validation and a callback is not
 *   provided.
 */
BaseForm.prototype.validate = function(cb) {
  this._cancelPendingOperations()
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
  if (this._errors === null) {
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
 * Removes any validation errors present for the given form fields. If validation
 * has not been performed yet, initialises the errors object.
 * @param {Array.<string>} fields field names.
 */
BaseForm.prototype._removeErrors = function(fields) {
  if (this._errors === null) {
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
  if (this.prefix === null) { return data }
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
  if (this.prefix === null) { return data }
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
 * Validates the formset using its forms' current input data.
 * @param {function(err, isValid, cleanedData)=} cb callback for asynchronous
 *   validation.
 * @return {boolean|undefined} true if the form only has synchronous validation
 *   and is valid.
 * @throws if the formset or its form has asynchronous validation and a callback
 *   is not provided.
 */
BaseFormSet.prototype.validate = function(cb) {
  this._cancelPendingOperations()
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
 * @param {Object.<string,*>} data new input data for form, which must be
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwibGliXFxuZXdmb3Jtcy5qcyIsImxpYlxcQm91bmRGaWVsZC5qcyIsImxpYlxcRXJyb3JMaXN0LmpzIiwibGliXFxFcnJvck9iamVjdC5qcyIsImxpYlxcZW52LmpzIiwibGliXFxmaWVsZHMuanMiLCJsaWJcXGZvcm1hdHMuanMiLCJsaWJcXGZvcm1zLmpzIiwibGliXFxmb3Jtc2V0cy5qcyIsImxpYlxcbG9jYWxlcy5qcyIsImxpYlxcdXRpbC5qcyIsImxpYlxcd2lkZ2V0cy5qcyIsIm5vZGVfbW9kdWxlc1xcQ29uY3VyXFxsaWJcXGNvbmN1ci5qcyIsIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxwdW55Y29kZVxccHVueWNvZGUuanMiLCJub2RlX21vZHVsZXNcXGlzb21vcnBoXFxjb3B5LmpzIiwibm9kZV9tb2R1bGVzXFxpc29tb3JwaFxcZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzXFxpc29tb3JwaFxcaXMuanMiLCJub2RlX21vZHVsZXNcXGlzb21vcnBoXFxvYmplY3QuanMiLCJub2RlX21vZHVsZXNcXGlzb21vcnBoXFx0aW1lLmpzIiwibm9kZV9tb2R1bGVzXFxpc29tb3JwaFxcdXJsLmpzIiwibm9kZV9tb2R1bGVzXFx2YWxpZGF0b3JzXFxsaWJcXGVycm9ycy5qcyIsIm5vZGVfbW9kdWxlc1xcdmFsaWRhdG9yc1xcbGliXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xcdmFsaWRhdG9yc1xcbGliXFxpcHY2LmpzIiwibm9kZV9tb2R1bGVzXFx2YWxpZGF0b3JzXFxsaWJcXHZhbGlkYXRvcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9WQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG52YXIgdmFsaWRhdG9ycyA9IHJlcXVpcmUoJ3ZhbGlkYXRvcnMnKVxuXG52YXIgZW52ID0gcmVxdWlyZSgnLi9lbnYnKVxudmFyIGZpZWxkcyA9IHJlcXVpcmUoJy4vZmllbGRzJylcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJylcbnZhciBmb3JtcyA9IHJlcXVpcmUoJy4vZm9ybXMnKVxudmFyIGZvcm1zZXRzID0gcmVxdWlyZSgnLi9mb3Jtc2V0cycpXG52YXIgbG9jYWxlcyA9IHJlcXVpcmUoJy4vbG9jYWxlcycpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG52YXIgd2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpXG5cbnZhciBCb3VuZEZpZWxkID0gcmVxdWlyZSgnLi9Cb3VuZEZpZWxkJylcbnZhciBFcnJvckxpc3QgPSByZXF1aXJlKCcuL0Vycm9yTGlzdCcpXG52YXIgRXJyb3JPYmplY3QgPSByZXF1aXJlKCcuL0Vycm9yT2JqZWN0JylcblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3QuZXh0ZW5kKHtcbiAgYWRkTG9jYWxlOiBsb2NhbGVzLmFkZExvY2FsZVxuLCBCb3VuZEZpZWxkOiBCb3VuZEZpZWxkXG4sIGVudjogZW52XG4sIEVycm9yTGlzdDogRXJyb3JMaXN0XG4sIEVycm9yT2JqZWN0OiBFcnJvck9iamVjdFxuLCBmb3JtYXRzOiBmb3JtYXRzXG4sIGZvcm1EYXRhOiB1dGlsLmZvcm1EYXRhXG4sIGxvY2FsZXM6IGxvY2FsZXNcbiwgc2V0RGVmYXVsdExvY2FsZTogbG9jYWxlcy5zZXREZWZhdWx0TG9jYWxlXG4sIHV0aWw6IHV0aWxcbiwgdmFsaWRhdGVBbGw6IHV0aWwudmFsaWRhdGVBbGxcbiwgVmFsaWRhdGlvbkVycm9yOiB2YWxpZGF0b3JzLlZhbGlkYXRpb25FcnJvclxuLCB2YWxpZGF0b3JzOiB2YWxpZGF0b3JzXG59LCBmaWVsZHMsIGZvcm1zLCBmb3Jtc2V0cywgd2lkZ2V0cylcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgaXMgPSByZXF1aXJlKCdpc29tb3JwaC9pcycpXG52YXIgZm9ybWF0ID0gcmVxdWlyZSgnaXNvbW9ycGgvZm9ybWF0JykuZm9ybWF0T2JqXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpXG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJylcblxuLyoqXG4gKiBBIGhlbHBlciBmb3IgcmVuZGVyaW5nIGEgZmllbGQuXG4gKiBAcGFyYW0ge0Zvcm19IGZvcm0gdGhlIGZvcm0gaW5zdGFuY2Ugd2hpY2ggdGhlIGZpZWxkIGlzIGEgcGFydCBvZi5cbiAqIEBwYXJhbSB7RmllbGR9IGZpZWxkIHRoZSBmaWVsZCB0byBiZSByZW5kZXJlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGUgZmllbGQgaW4gdGhlIGZvcm0uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIEJvdW5kRmllbGQgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEJvdW5kRmllbGQoZm9ybSwgZmllbGQsIG5hbWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQm91bmRGaWVsZCkpIHsgcmV0dXJuIG5ldyBCb3VuZEZpZWxkKGZvcm0sIGZpZWxkLCBuYW1lKSB9XG4gICAgdGhpcy5mb3JtID0gZm9ybVxuICAgIHRoaXMuZmllbGQgPSBmaWVsZFxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmh0bWxOYW1lID0gZm9ybS5hZGRQcmVmaXgobmFtZSlcbiAgICB0aGlzLmh0bWxJbml0aWFsTmFtZSA9IGZvcm0uYWRkSW5pdGlhbFByZWZpeChuYW1lKVxuICAgIHRoaXMuaHRtbEluaXRpYWxJZCA9IGZvcm0uYWRkSW5pdGlhbFByZWZpeCh0aGlzLmF1dG9JZCgpKVxuICAgIHRoaXMubGFiZWwgPSB0aGlzLmZpZWxkLmxhYmVsICE9PSBudWxsID8gdGhpcy5maWVsZC5sYWJlbCA6IHV0aWwucHJldHR5TmFtZShuYW1lKVxuICAgIHRoaXMuaGVscFRleHQgPSBmaWVsZC5oZWxwVGV4dCB8fCAnJ1xuICB9XG59KVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gU3RhdHVzID09PVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHZhbHVlIHdoaWNoIHdpbGwgYmUgZGlzcGxheWVkIGluIHRoZSBmaWVsZCdzXG4gKiAgIHdpZGdldCBpcyBlbXB0eS5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWVsZC5pc0VtcHR5VmFsdWUodGhpcy52YWx1ZSgpKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZpZWxkIGhhcyBhIHBlbmRpbmcgYXN5bmMgdmFsaWRhdGlvbi5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0eXBlb2YgdGhpcy5mb3JtLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW3RoaXMubmFtZV0gIT0gJ3VuZGVmaW5lZCdcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmaWVsZCBoYXMgc29tZSBkYXRhIGluIGl0cyBmb3JtJ3MgY2xlYW5lZERhdGEuXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmlzQ2xlYW5lZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdHlwZW9mIHRoaXMuZm9ybS5jbGVhbmVkRGF0YVt0aGlzLm5hbWVdICE9ICd1bmRlZmluZWQnXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZmllbGQncyB3aWRnZXQgd2lsbCByZW5kZXIgaGlkZGVuIGZpZWxkKHMpLlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5pc0hpZGRlbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWVsZC53aWRnZXQuaXNIaWRkZW5cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBmaWVsZCdzIGN1cmVudCBzdGF0dXMgaW4gdGhlIGZvcm0uIFN0YXR1c2VzIGFyZSBkZXRlcm1pbmVkIGluXG4gKiB0aGUgZm9sbG93aW5nIG9yZGVyOlxuICogKiAncGVuZGluZycgLSB0aGUgZmllbGQgaGFzIGEgcGVuZGluZyBhc3luYyB2YWxpZGF0aW9uLlxuICogKiAnZXJyb3InIC0gdGhlIGZpZWxkIGhhcyBhIHZhbGlkYXRpb24gZXJyb3IuXG4gKiAqICd2YWxpZCcgLSB0aGUgZmllbGQgaGFzIGEgdmFsdWUgaW4gZm9ybS5jbGVhbmVkRGF0YS5cbiAqICogJ2RlZmF1bHQnIC0gdGhlIGZpZWxkIG1lZXRzIG5vbmUgb2YgdGhlIGFib3ZlIGNyaXRlcmlhLCBlLmcuIGl0J3MgYmVlblxuICogICByZW5kZXJlZCBidXQgaGFzbid0IGJlZW4gaW50ZXJhY3RlZCB3aXRoIG9yIHZhbGlkYXRlZCB5ZXQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLnN0YXR1cyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc1BlbmRpbmcoKSkgeyByZXR1cm4gJ3BlbmRpbmcnIH1cbiAgaWYgKHRoaXMuZXJyb3JzKCkuaXNQb3B1bGF0ZWQoKSkgeyByZXR1cm4gJ2Vycm9yJyB9XG4gIGlmICh0aGlzLmlzQ2xlYW5lZCgpKSB7IHJldHVybiAndmFsaWQnIH1cbiAgcmV0dXJuICdkZWZhdWx0J1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBGaWVsZCBEYXRhID09PVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgYW5kIHJldHVybnMgdGhlIGlkIGF0dHJpYnV0ZSBmb3IgdGhpcyBCb3VuZEZpZWxkIGlmIHRoZSBhc3NvY2lhdGVkXG4gKiBmb3JtIGhhcyBhbiBhdXRvSWQuIFJldHVybnMgYW4gZW1wdHkgc3RyaW5nIG90aGVyd2lzZS5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuYXV0b0lkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhdXRvSWQgPSB0aGlzLmZvcm0uYXV0b0lkXG4gIGlmIChhdXRvSWQpIHtcbiAgICBhdXRvSWQgPSAnJythdXRvSWRcbiAgICBpZiAoYXV0b0lkLmluZGV4T2YoJ3tuYW1lfScpICE9IC0xKSB7XG4gICAgICByZXR1cm4gZm9ybWF0KGF1dG9JZCwge25hbWU6IHRoaXMuaHRtbE5hbWV9KVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5odG1sTmFtZVxuICB9XG4gIHJldHVybiAnJ1xufVxuXG4vKipcbiAqIEByZXR1cm4geyp9IHVzZXIgaW5wdXQgZGF0YSBmb3IgdGhlIGZpZWxkLCBvciBudWxsIGlmIG5vbmUgaGFzIGJlZW4gZ2l2ZW4uXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZmllbGQud2lkZ2V0LnZhbHVlRnJvbURhdGEodGhpcy5mb3JtLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybS5maWxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5odG1sTmFtZSlcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtFcnJvck9iamVjdH0gZXJyb3JzIGZvciB0aGUgZmllbGQsIHdoaWNoIG1heSBiZSBlbXB0eS5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuZXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZvcm0uZXJyb3JzKHRoaXMubmFtZSkgfHwgbmV3IHRoaXMuZm9ybS5lcnJvckNvbnN0cnVjdG9yKClcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmc9fSB0aGUgZmlyc3QgZXJyb3IgbWVzc2FnZSBmb3IgdGhlIGZpZWxkLCBvciB1bmRlZmluZWQgaWZcbiAqICAgdGhlcmUgd2VyZSBub25lLlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5lcnJvck1lc3NhZ2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZXJyb3JzKCkuZmlyc3QoKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fSBhbGwgZXJyb3IgbWVzc2FnZXMgZm9yIHRoZSBmaWVsZCwgd2lsbCBiZSBlbXB0eSBpZlxuICogICB0aGVyZSB3ZXJlIG5vbmUuXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmVycm9yTWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZXJyb3JzKCkubWVzc2FnZXMoKVxufVxuXG4vKipcbiAqIEdldHMgb3IgZ2VuZXJhdGVzIGFuIGlkIGZvciB0aGUgZmllbGQncyA8bGFiZWw+LlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5pZEZvckxhYmVsID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3aWRnZXQgPSB0aGlzLmZpZWxkLndpZGdldFxuICB2YXIgaWQgPSBvYmplY3QuZ2V0KHdpZGdldC5hdHRycywgJ2lkJywgdGhpcy5hdXRvSWQoKSlcbiAgcmV0dXJuIHdpZGdldC5pZEZvckxhYmVsKGlkKVxufVxuXG4vKipcbiAqIEByZXR1cm4geyp9IHRoZSB2YWx1ZSB0byBiZSBkaXNwbGF5ZWQgaW4gdGhlIGZpZWxkJ3Mgd2lkZ2V0LlxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGF0YVxuICBpZiAodGhpcy5mb3JtLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIGRhdGEgPSB0aGlzLmluaXRpYWxWYWx1ZSgpXG4gIH1cbiAgZWxzZSB7XG4gICAgZGF0YSA9IHRoaXMuZmllbGQuYm91bmREYXRhKHRoaXMuZGF0YSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZ2V0KHRoaXMuZm9ybS5pbml0aWFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLmluaXRpYWwpKVxuICB9XG4gIHJldHVybiB0aGlzLmZpZWxkLnByZXBhcmVWYWx1ZShkYXRhKVxufVxuXG4vKipcbiAqIEByZXR1cm4geyp9IHRoZSBpbml0aWFsIHZhbHVlIGZvciB0aGUgZmllbGQsIHdpbGwgYmUgbnVsbCBpZiBub25lIHdhc1xuICogICBjb25maWd1cmVkIG9uIHRoZSBmaWVsZCBvciBnaXZlbiB0byB0aGUgZm9ybS5cbiAqL1xuQm91bmRGaWVsZC5wcm90b3R5cGUuaW5pdGlhbFZhbHVlID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2YWx1ZSA9IG9iamVjdC5nZXQodGhpcy5mb3JtLmluaXRpYWwsIHRoaXMubmFtZSwgdGhpcy5maWVsZC5pbml0aWFsKVxuICBpZiAoaXMuRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFsdWUgPSB2YWx1ZSgpXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBSZW5kZXJpbmcgPT09XG5cbi8qKlxuICogUmVuZGVycyBhIHdpZGdldCBmb3IgdGhlIGZpZWxkLlxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3Mgd2lkZ2V0cyBvcHRpb25zLlxuICogQHBhcmFtIHtXaWRnZXR9IGt3YXJncy53aWRnZXQgYW4gb3ZlcnJpZGUgZm9yIHRoZSB3aWRnZXQgdXNlZCB0byByZW5kZXIgdGhlXG4gKiAgIGZpZWxkIC0gaWYgbm90IHByb3ZpZGVkLCB0aGUgZmllbGQncyBjb25maWd1cmVkIHdpZGdldCB3aWxsIGJlIHVzZWQuXG4gKiBAcGFyYW0ge09iamVjdH0ga3dhcmdzLmF0dHJzIGFkZGl0aW9uYWwgYXR0cmlidXRlcyB0byBiZSBhZGRlZCB0byB0aGUgZmllbGQnc1xuICogICB3aWRnZXQuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmFzV2lkZ2V0ID0gZnVuY3Rpb24oa3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgIHdpZGdldDogbnVsbCwgYXR0cnM6IG51bGwsIG9ubHlJbml0aWFsOiBmYWxzZVxuICB9LCBrd2FyZ3MpXG4gIHZhciB3aWRnZXQgPSAoa3dhcmdzLndpZGdldCAhPT0gbnVsbCA/IGt3YXJncy53aWRnZXQgOiB0aGlzLmZpZWxkLndpZGdldClcbiAgdmFyIGF0dHJzID0gKGt3YXJncy5hdHRycyAhPT0gbnVsbCA/IGt3YXJncy5hdHRycyA6IHt9KVxuICB2YXIgYXV0b0lkID0gdGhpcy5hdXRvSWQoKVxuICB2YXIgbmFtZSA9ICFrd2FyZ3Mub25seUluaXRpYWwgPyB0aGlzLmh0bWxOYW1lIDogdGhpcy5odG1sSW5pdGlhbE5hbWVcbiAgaWYgKGF1dG9JZCAmJlxuICAgICAgdHlwZW9mIGF0dHJzLmlkID09ICd1bmRlZmluZWQnICYmXG4gICAgICB0eXBlb2Ygd2lkZ2V0LmF0dHJzLmlkID09ICd1bmRlZmluZWQnKSB7XG4gICAgYXR0cnMuaWQgPSAoIWt3YXJncy5vbmx5SW5pdGlhbCA/IGF1dG9JZCA6IHRoaXMuaHRtbEluaXRpYWxJZClcbiAgfVxuICBpZiAodHlwZW9mIGF0dHJzLmtleSA9PSAndW5kZWZpbmVkJykge1xuICAgIGF0dHJzLmtleSA9IG5hbWVcbiAgfVxuICB2YXIgY29udHJvbGxlZCA9IHRoaXMuX2lzQ29udHJvbGxlZCh3aWRnZXQpXG4gIHZhciB2YWxpZGF0aW9uID0gdGhpcy5fdmFsaWRhdGlvbih3aWRnZXQpXG5cbiAgLy8gQWx3YXlzIEFkZCBhbiBvbkNoYW5nZSBldmVudCBoYW5kbGVyIHRvIHVwZGF0ZSBmb3JtLmRhdGEgd2hlbiB0aGUgZmllbGQgaXNcbiAgLy8gY2hhbmdlZC5cbiAgYXR0cnMub25DaGFuZ2UgPSB0aGlzLmZvcm0uX2hhbmRsZUZpZWxkRXZlbnQuYmluZCh0aGlzLmZvcm0sIHtcbiAgICBldmVudDogJ29uQ2hhbmdlJ1xuICAsIHZhbGlkYXRlOiAhIXZhbGlkYXRpb24ub25DaGFuZ2VcbiAgLCBkZWxheTogdmFsaWRhdGlvbi5vbkNoYW5nZURlbGF5XG4gIH0pXG5cbiAgLy8gSWYgdmFsaWRhdGlvbiBzaG91bGQgaGFwcGVuIG9uIGV2ZW50cyBvdGhlciB0aGFuIG9uQ2hhbmdlLCBhbHNvIGFkZCBldmVudFxuICAvLyBoYW5kbGVycyBmb3IgdGhlbS5cbiAgaWYgKHZhbGlkYXRpb24gIT0gJ21hbnVhbCcgJiYgdmFsaWRhdGlvbi5ldmVudHMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbGlkYXRpb24uZXZlbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGV2ZW50TmFtZSA9IHZhbGlkYXRpb24uZXZlbnRzW2ldXG4gICAgICBhdHRyc1tldmVudE5hbWVdID1cbiAgICAgICAgdGhpcy5mb3JtLl9oYW5kbGVGaWVsZEV2ZW50LmJpbmQodGhpcy5mb3JtLCB7ZXZlbnQ6IGV2ZW50TmFtZX0pXG4gICAgfVxuICB9XG5cbiAgdmFyIHJlbmRlckt3YXJncyA9IHthdHRyczogYXR0cnMsIGNvbnRyb2xsZWQ6IGNvbnRyb2xsZWR9XG4gIGlmICh3aWRnZXQubmVlZHNJbml0aWFsVmFsdWUpIHtcbiAgICByZW5kZXJLd2FyZ3MuaW5pdGlhbFZhbHVlID0gdGhpcy5pbml0aWFsVmFsdWUoKVxuICB9XG4gIHJldHVybiB3aWRnZXQucmVuZGVyKG5hbWUsIHRoaXMudmFsdWUoKSwgcmVuZGVyS3dhcmdzKVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZpZWxkIGFzIGEgaGlkZGVuIGZpZWxkLlxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3Mgd2lkZ2V0IG9wdGlvbnMuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmFzSGlkZGVuID0gZnVuY3Rpb24oa3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe30sIGt3YXJncywge3dpZGdldDogbmV3IHRoaXMuZmllbGQuaGlkZGVuV2lkZ2V0KCl9KVxuICByZXR1cm4gdGhpcy5hc1dpZGdldChrd2FyZ3MpXG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgZmllbGQgYXMgYSB0ZXh0IGlucHV0LlxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3Mgd2lkZ2V0IG9wdGlvbnMuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmFzVGV4dCA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHt9LCBrd2FyZ3MsIHt3aWRnZXQ6IHdpZGdldHMuVGV4dElucHV0KCl9KVxuICByZXR1cm4gdGhpcy5hc1dpZGdldChrd2FyZ3MpXG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgZmllbGQgYXMgYSB0ZXh0YXJlYS5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIHdpZGdldCBvcHRpb25zLlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5hc1RleHRhcmVhID0gZnVuY3Rpb24oa3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe30sIGt3YXJncywge3dpZGdldDogd2lkZ2V0cy5UZXh0YXJlYSgpfSlcbiAgcmV0dXJuIHRoaXMuYXNXaWRnZXQoa3dhcmdzKVxufVxuXG4vKipcbiAqIERldGVybWluZXMgQ1NTIGNsYXNzZXMgZm9yIHRoaXMgZmllbGQgYmFzZWQgb24gd2hhdCdzIGNvbmZpZ3VyZWQgaW4gdGhlIGZpZWxkXG4gKiBhbmQgZm9ybSwgYW5kIHRoZSBmaWVsZCdzIGN1cnJlbnQgc3RhdHVzLlxuICogQHBhcmFtIHtzdHJpbmc9fSBleHRyYUNzc0NsYXNzZXMgYWRkaXRpb25hbCBDU1MgY2xhc3NlcyBmb3IgdGhlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzZXMgZm9yIHRoaXMgZmllbGQuXG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLmNzc0NsYXNzZXMgPSBmdW5jdGlvbihleHRyYUNzc0NsYXNzZXMpIHtcbiAgdmFyIGNzc0NsYXNzZXMgPSAoZXh0cmFDc3NDbGFzc2VzID8gW2V4dHJhQ3NzQ2xhc3Nlc10gOiBbXSlcblxuICAvLyBGaWVsZC9yb3cgY2xhc3Nlc1xuICBpZiAodGhpcy5maWVsZC5jc3NDbGFzcyAhPT0gbnVsbCkge1xuICAgIGNzc0NsYXNzZXMucHVzaCh0aGlzLmZpZWxkLmNzc0NsYXNzKVxuICB9XG4gIGlmICh0eXBlb2YgdGhpcy5mb3JtLnJvd0Nzc0NsYXNzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgY3NzQ2xhc3Nlcy5wdXNoKHRoaXMuZm9ybS5yb3dDc3NDbGFzcylcbiAgfVxuXG4gIC8vIFN0YXR1cyBjbGFzc1xuICB2YXIgc3RhdHVzID0gdGhpcy5zdGF0dXMoKVxuICBpZiAodHlwZW9mIHRoaXMuZm9ybVtzdGF0dXMgKyAnQ3NzQ2xhc3MnXSAhPSAndW5kZWZpbmVkJykge1xuICAgIGNzc0NsYXNzZXMucHVzaCh0aGlzLmZvcm1bc3RhdHVzICsgJ0Nzc0NsYXNzJ10pXG4gIH1cblxuICAvLyBSZXF1aXJlZC1uZXNzIGNsYXNzZXNcbiAgaWYgKHRoaXMuZmllbGQucmVxdWlyZWQpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZm9ybS5yZXF1aXJlZENzc0NsYXNzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBjc3NDbGFzc2VzLnB1c2godGhpcy5mb3JtLnJlcXVpcmVkQ3NzQ2xhc3MpXG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiB0aGlzLmZvcm0ub3B0aW9uYWxDc3NDbGFzcyAhPSAndW5kZWZpbmVkJykge1xuICAgIGNzc0NsYXNzZXMucHVzaCh0aGlzLmZvcm0ub3B0aW9uYWxDc3NDbGFzcylcbiAgfVxuXG4gIHJldHVybiBjc3NDbGFzc2VzLmpvaW4oJyAnKVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSB0YWcgY29udGFpbmluZyBoZWxwIHRleHQgZm9yIHRoZSBmaWVsZC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrd2FyZ3MudGFnTmFtZSBhbGxvd3Mgb3ZlcnJpZGluZyB0aGUgdHlwZSBvZiB0YWcgLSBkZWZhdWx0c1xuICogICB0byAnc3BhbicuXG4gKiBAcGFyYW0ge3N0cmluZ30ga3dhcmdzLmNvbnRlbnRzIGhlbHAgdGV4dCBjb250ZW50cyAtIGlmIG5vdCBwcm92aWRlZCxcbiAqICAgY29udGVudHMgd2lsbCBiZSB0YWtlbiBmcm9tIHRoZSBmaWVsZCBpdHNlbGYuIFRvIHJlbmRlciByYXcgSFRNTCBpbiBoZWxwXG4gKiAgIHRleHQsIGl0IHNob3VsZCBiZSBzcGVjaWZpZWQgdXNpbmcgdGhlIFJlYWN0IGNvbnZlbnRpb24gZm9yIHJhdyBIVE1MLFxuICogICB3aGljaCBpcyB0byBwcm92aWRlIGFuIG9iamVjdCB3aXRoIGEgX19odG1sIHByb3BlcnR5LlxuICogQHBhcmFtIHtPYmplY3R9IGt3YXJncy5hdHRycyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMgdG8gYmUgYWRkZWQgdG8gdGhlIHRhZyAtXG4gKiAgIGJ5IGRlZmF1bHQgaXQgd2lsbCBnZXQgYSBjbGFzc05hbWUgb2YgJ2hlbHBUZXh0J1xuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5oZWxwVGV4dFRhZyA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICB0YWdOYW1lOiAnc3BhbicsIGF0dHJzOiBudWxsLCBjb250ZW50czogdGhpcy5oZWxwVGV4dFxuICB9LCBrd2FyZ3MpXG4gIGlmIChrd2FyZ3MuY29udGVudHMpIHtcbiAgICB2YXIgYXR0cnMgPSBvYmplY3QuZXh0ZW5kKHtjbGFzc05hbWU6ICdoZWxwVGV4dCd9LCBrd2FyZ3MuYXR0cnMpXG4gICAgdmFyIGNvbnRlbnRzID0ga3dhcmdzLmNvbnRlbnRzXG4gICAgaWYgKGlzLk9iamVjdChjb250ZW50cykgJiYgb2JqZWN0Lmhhc093bihjb250ZW50cywgJ19faHRtbCcpKSB7XG4gICAgICBhdHRycy5kYW5nZXJvdXNseVNldElubmVySFRNTCA9IGNvbnRlbnRzXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChrd2FyZ3MudGFnTmFtZSwgYXR0cnMpXG4gICAgfVxuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KGt3YXJncy50YWdOYW1lLCBhdHRycywgY29udGVudHMpXG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyB0aGUgZ2l2ZW4gY29udGVudHMgaW4gYSA8bGFiZWw+IGlmIHRoZSBmaWVsZCBoYXMgYW4gaWQgYXR0cmlidXRlLiBJZlxuICogY29udGVudHMgYXJlbid0IGdpdmVuLCB1c2VzIHRoZSBmaWVsZCdzIGxhYmVsLlxuICogSWYgYXR0cnMgYXJlIGdpdmVuLCB0aGV5J3JlIHVzZWQgYXMgSFRNTCBhdHRyaWJ1dGVzIG9uIHRoZSA8bGFiZWw+IHRhZy5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrd2FyZ3MuY29udGVudHMgY29udGVudHMgZm9yIHRoZSBsYWJlbCAtIGlmIG5vdCBwcm92aWRlZCxcbiAqICAgbGFiZWwgY29udGVudHMgd2lsbCBiZSBnZW5lcmF0ZWQgZnJvbSB0aGUgZmllbGQgaXRzZWxmLlxuICogQHBhcmFtIHtPYmplY3R9IGt3YXJncy5hdHRycyBhZGRpdGlvbmFsIGF0dHJpYnV0ZXMgdG8gYmUgYWRkZWQgdG8gdGhlIGxhYmVsLlxuICogQHBhcmFtIHtzdHJpbmd9IGt3YXJncy5sYWJlbFN1ZmZpeCBhbGxvd3Mgb3ZlcnJpZGluZyB0aGUgZm9ybSdzIGxhYmVsU3VmZml4LlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5sYWJlbFRhZyA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICBjb250ZW50czogdGhpcy5sYWJlbCwgYXR0cnM6IG51bGwsIGxhYmVsU3VmZml4OiB0aGlzLmZvcm0ubGFiZWxTdWZmaXhcbiAgfSwga3dhcmdzKVxuICB2YXIgY29udGVudHMgPSB0aGlzLl9hZGRMYWJlbFN1ZmZpeChrd2FyZ3MuY29udGVudHMsIGt3YXJncy5sYWJlbFN1ZmZpeClcbiAgdmFyIHdpZGdldCA9IHRoaXMuZmllbGQud2lkZ2V0XG4gIHZhciBpZCA9IG9iamVjdC5nZXQod2lkZ2V0LmF0dHJzLCAnaWQnLCB0aGlzLmF1dG9JZCgpKVxuICBpZiAoaWQpIHtcbiAgICB2YXIgYXR0cnMgPSBvYmplY3QuZXh0ZW5kKGt3YXJncy5hdHRycyB8fCB7fSwge2h0bWxGb3I6IHdpZGdldC5pZEZvckxhYmVsKGlkKX0pXG4gICAgY29udGVudHMgPSBSZWFjdC5jcmVhdGVFbGVtZW50KCdsYWJlbCcsIGF0dHJzLCBjb250ZW50cylcbiAgfVxuICByZXR1cm4gY29udGVudHNcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGt3YXJncykge1xuICBpZiAodGhpcy5maWVsZC5zaG93SGlkZGVuSW5pdGlhbCkge1xuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCBudWxsLCB0aGlzLmFzV2lkZ2V0KGt3YXJncyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hc0hpZGRlbih7b25seUluaXRpYWw6IHRydWV9KSlcbiAgfVxuICByZXR1cm4gdGhpcy5hc1dpZGdldChrd2FyZ3MpXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgU3ViV2lkZ2V0cyB0aGF0IGNvbXByaXNlIGFsbCB3aWRnZXRzIGluIHRoaXMgQm91bmRGaWVsZC5cbiAqIFRoaXMgcmVhbGx5IGlzIG9ubHkgdXNlZnVsIGZvciBSYWRpb1NlbGVjdCBhbmQgQ2hlY2tib3hTZWxlY3RNdWx0aXBsZVxuICogd2lkZ2V0cywgc28gdGhhdCB5b3UgY2FuIGl0ZXJhdGUgb3ZlciBpbmRpdmlkdWFsIGlucHV0cyB3aGVuIHJlbmRlcmluZy5cbiAqIEByZXR1cm4ge0FycmF5LjxTdWJXaWRnZXQ+fVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5zdWJXaWRnZXRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpZCA9IHRoaXMuZmllbGQud2lkZ2V0LmF0dHJzLmlkIHx8IHRoaXMuYXV0b0lkKClcbiAgdmFyIGt3YXJncyA9IHthdHRyczoge319XG4gIGlmIChpZCkge1xuICAgIGt3YXJncy5hdHRycy5pZCA9IGlkXG4gIH1cbiAgcmV0dXJuIHRoaXMuZmllbGQud2lkZ2V0LnN1YldpZGdldHModGhpcy5odG1sTmFtZSwgdGhpcy52YWx1ZSgpLCBrd2FyZ3MpXG59XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5Cb3VuZEZpZWxkLnByb3RvdHlwZS5fYWRkTGFiZWxTdWZmaXggPSBmdW5jdGlvbihsYWJlbCwgbGFiZWxTdWZmaXgpIHtcbiAgLy8gT25seSBhZGQgdGhlIHN1ZmZpeCBpZiB0aGUgbGFiZWwgZG9lcyBub3QgZW5kIGluIHB1bmN0dWF0aW9uXG4gIGlmIChsYWJlbFN1ZmZpeCAmJiAnOj8uIScuaW5kZXhPZihsYWJlbC5jaGFyQXQobGFiZWwubGVuZ3RoIC0gMSkpID09IC0xKSB7XG4gICAgcmV0dXJuIGxhYmVsICsgbGFiZWxTdWZmaXhcbiAgfVxuICByZXR1cm4gbGFiZWxcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIHRoZSB3aWRnZXQgc2hvdWxkIGJlIGEgY29udHJvbGxlZCBvciB1bmNvbnRyb2xsZWQgUmVhY3RcbiAqIGNvbXBvbmVudC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLl9pc0NvbnRyb2xsZWQgPSBmdW5jdGlvbih3aWRnZXQpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICB3aWRnZXQgPSB0aGlzLmZpZWxkLndpZGdldFxuICB9XG4gIHZhciBjb250cm9sbGVkID0gZmFsc2VcbiAgaWYgKHdpZGdldC5pc1ZhbHVlU2V0dGFibGUpIHtcbiAgICAvLyBJZiB0aGUgZmllbGQgaGFzIGFueSBjb250cm9sbGVkIGNvbmZpZyBzZXQsIGl0IHNob3VsZCB0YWtlIHByZWNlZGVuY2UsXG4gICAgLy8gb3RoZXJ3aXNlIHVzZSB0aGUgZm9ybSdzIGFzIGl0IGhhcyBhIGRlZmF1bHQuXG4gICAgY29udHJvbGxlZCA9ICh0aGlzLmZpZWxkLmNvbnRyb2xsZWQgIT09IG51bGxcbiAgICAgICAgICAgICAgICAgID8gdGhpcy5maWVsZC5jb250cm9sbGVkXG4gICAgICAgICAgICAgICAgICA6IHRoaXMuZm9ybS5jb250cm9sbGVkKVxuICB9XG4gIHJldHVybiBjb250cm9sbGVkXG59XG5cbi8qKlxuICogR2V0cyB0aGUgY29uZmlndXJlZCB2YWxpZGF0aW9uIGZvciB0aGUgZmllbGQgb3IgZm9ybSwgYWxsb3dpbmcgdGhlIHdpZGdldFxuICogd2hpY2ggaXMgZ29pbmcgdG8gYmUgcmVuZGVyZWQgdG8gb3ZlcnJpZGUgaXQgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtXaWRnZXQ9fSB3aWRnZXRcbiAqIEByZXR1cm4gez8oT2JqZWN0fHN0cmluZyl9XG4gKi9cbkJvdW5kRmllbGQucHJvdG90eXBlLl92YWxpZGF0aW9uID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgd2lkZ2V0ID0gdGhpcy5maWVsZC53aWRnZXRcbiAgfVxuICAvLyBJZiB0aGUgZmllbGQgaGFzIGFueSB2YWxpZGF0aW9uIGNvbmZpZyBzZXQsIGl0IHNob3VsZCB0YWtlIHByZWNlZGVuY2UsXG4gIC8vIG90aGVyd2lzZSB1c2UgdGhlIGZvcm0ncyBhcyBpdCBoYXMgYSBkZWZhdWx0LlxuICB2YXIgdmFsaWRhdGlvbiA9IHRoaXMuZmllbGQudmFsaWRhdGlvbiB8fCB0aGlzLmZvcm0udmFsaWRhdGlvblxuICAvLyBBbGxvdyB3aWRnZXRzIHRvIG92ZXJyaWRlIHRoZSB0eXBlIG9mIHZhbGlkYXRpb24gdGhhdCdzIHVzZWQgZm9yIHRoZW0gLVxuICAvLyBwcmltYXJpbHkgZm9yIGlucHV0cyB3aGljaCBjYW4gb25seSBiZSBjaGFuZ2VkIGJ5IGNsaWNrL3NlbGVjdGlvbi5cbiAgaWYgKHZhbGlkYXRpb24gIT09ICdtYW51YWwnICYmIHdpZGdldC52YWxpZGF0aW9uICE9PSBudWxsKSB7XG4gICAgdmFsaWRhdGlvbiA9IHdpZGdldC52YWxpZGF0aW9uXG4gIH1cbiAgcmV0dXJuIHZhbGlkYXRpb25cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCb3VuZEZpZWxkIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciB2YWxpZGF0b3JzID0gcmVxdWlyZSgndmFsaWRhdG9ycycpXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKVxuXG52YXIgVmFsaWRhdGlvbkVycm9yID0gdmFsaWRhdG9ycy5WYWxpZGF0aW9uRXJyb3JcblxuLyoqXG4gKiBBIGxpc3Qgb2YgZXJyb3JzIHdoaWNoIGtub3dzIGhvdyB0byBkaXNwbGF5IGl0c2VsZiBpbiB2YXJpb3VzIGZvcm1hdHMuXG4gKiBAcGFyYW0ge0FycmF5PX0gbGlzdCBhIGxpc3Qgb2YgZXJyb3JzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBFcnJvckxpc3QgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEVycm9yTGlzdChsaXN0KSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEVycm9yTGlzdCkpIHsgcmV0dXJuIG5ldyBFcnJvckxpc3QobGlzdCkgfVxuICAgIHRoaXMuZGF0YSA9IGxpc3QgfHwgW11cbiAgfVxufSlcblxuLyoqXG4gKiBBZGRzIG1vcmUgZXJyb3JzLlxuICogQHBhcmFtIHtBcnJheX0gZXJyb3JMaXN0IGEgbGlzdCBvZiBlcnJvcnMuXG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24oZXJyb3JMaXN0KSB7XG4gIHRoaXMuZGF0YS5wdXNoLmFwcGx5KHRoaXMuZGF0YSwgZXJyb3JMaXN0KVxufVxuXG4vKipcbiAqIEByZXR1cm4ge251bWJlcn0gdGhlIG51bWJlciBvZiBlcnJvcnMuXG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhbnkgZXJyb3JzIGFyZSBwcmVzZW50LlxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmlzUG9wdWxhdGVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5sZW5ndGgoKSA+IDApXG59XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgZmlyc3QgbWVzc2FnZSBoZWxkIGluIHRoaXMgRXJyb3JMaXN0LlxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmZpcnN0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRhdGEubGVuZ3RoID4gMCkge1xuICAgIHZhciBlcnJvciA9IHRoaXMuZGF0YVswXVxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikge1xuICAgICAgZXJyb3IgPSBlcnJvci5tZXNzYWdlcygpWzBdXG4gICAgfVxuICAgIHJldHVybiBlcnJvclxuICB9XG59XG5cbi8qKlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IHRoZSBsaXN0IG9mIG1lc3NhZ2VzIGhlbGQgaW4gdGhpcyBFcnJvckxpc3QuXG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUubWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1lc3NhZ2VzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGVycm9yID0gdGhpcy5kYXRhW2ldXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICBlcnJvciA9IGVycm9yLm1lc3NhZ2VzKClbMF1cbiAgICB9XG4gICAgbWVzc2FnZXMucHVzaChlcnJvcilcbiAgfVxuICByZXR1cm4gbWVzc2FnZXNcbn1cblxuLyoqXG4gKiBEZWZhdWx0IGRpc3BsYXkgaXMgYXMgYSBsaXN0LlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5hc1VsKClcbn1cblxuLyoqXG4gKiBEaXNwbGF5cyBlcnJvcnMgYXMgYSBsaXN0LlxuICogQHJldHVybiB7UmVhY3RFbGVtZW50fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmFzVWwgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmlzUG9wdWxhdGVkKCkpIHtcbiAgICByZXR1cm5cbiAgfVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgndWwnLCB7Y2xhc3NOYW1lOiAnZXJyb3JsaXN0J31cbiAgLCB0aGlzLm1lc3NhZ2VzKCkubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCBudWxsLCBlcnJvcilcbiAgICB9KVxuICApXG59XG5cbi8qKlxuICogRGlzcGxheXMgZXJyb3JzIGFzIHRleHQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkVycm9yTGlzdC5wcm90b3R5cGUuYXNUZXh0ID0gRXJyb3JMaXN0LnByb3RvdHlwZS50b1N0cmluZyA9ZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLm1lc3NhZ2VzKCkubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgcmV0dXJuICcqICcgKyBlcnJvclxuICB9KS5qb2luKCdcXG4nKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLmFzRGF0YSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5kYXRhXG59XG5cbi8qKlxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5FcnJvckxpc3QucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFZhbGlkYXRpb25FcnJvcih0aGlzLmRhdGEpLmVycm9yTGlzdC5tYXAoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZXMoKVswXVxuICAgICwgY29kZTogZXJyb3IuY29kZSB8fCAnJ1xuICAgIH1cbiAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFcnJvckxpc3RcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpXG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIGZpZWxkIGVycm9ycyB0aGF0IGtub3dzIGhvdyB0byBkaXNwbGF5IGl0c2VsZiBpbiB2YXJpb3VzXG4gKiBmb3JtYXRzLiBUaGlzIG9iamVjdCdzIC5lcnJvciBwcm9wZXJ0aWVzIGFyZSB0aGUgZmllbGQgbmFtZXMgYW5kXG4gKiBjb3JyZXNwb25kaW5nIHZhbHVlcyBhcmUgdGhlIGVycm9ycy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IGVycm9yc1xuICovXG52YXIgRXJyb3JPYmplY3QgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEVycm9yT2JqZWN0KGVycm9ycykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBFcnJvck9iamVjdCkpIHsgcmV0dXJuIG5ldyBFcnJvck9iamVjdChlcnJvcnMpIH1cbiAgICB0aGlzLmVycm9ycyA9IGVycm9ycyB8fCB7fVxuICB9XG59KVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZFxuICogQHBhcmFtIHtFcnJvckxpc3R9IGVycm9yXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihmaWVsZCwgZXJyb3IpIHtcbiAgdGhpcy5lcnJvcnNbZmllbGRdID0gZXJyb3Jcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge0Vycm9yTGlzdH1cbiAqL1xuRXJyb3JPYmplY3QucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiB0aGlzLmVycm9yc1tmaWVsZF1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlcmUgd2VyZSBlcnJvcnMgZm9yIHRoZSBnaXZlbiBmaWVsZC5cbiAqL1xuRXJyb3JPYmplY3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiBkZWxldGUgdGhpcy5lcnJvcnNbZmllbGRdXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gZmllbGRzXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbihmaWVsZHMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgZGVsZXRlIHRoaXMuZXJyb3JzW2ZpZWxkc1tpXV1cbiAgfVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZpZWxkIGhhcyBlcnJvcnMuXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5oYXNGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIHJldHVybiBvYmplY3QuaGFzT3duKHRoaXMuZXJyb3JzLCBmaWVsZClcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzKS5sZW5ndGhcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGFueSBlcnJvcnMgYXJlIHByZXNlbnQuXG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5pc1BvcHVsYXRlZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHRoaXMubGVuZ3RoKCkgPiAwKVxufVxuXG4vKipcbiAqIERlZmF1bHQgZGlzcGxheSBpcyBhcyBhIGxpc3QuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYXNVbCgpXG59XG5cbi8qKlxuICogRGlzcGxheXMgZXJyb3IgZGV0YWlscyBhcyBhIGxpc3QuXG4gKiBAcmV0dXJuIHtSZWFjdEVsZW1lbnR9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5hc1VsID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtcyA9IE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzKS5tYXAoZnVuY3Rpb24oZmllbGQpIHtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCBudWxsLCBmaWVsZCwgdGhpcy5lcnJvcnNbZmllbGRdLmFzVWwoKSlcbiAgfS5iaW5kKHRoaXMpKVxuICBpZiAoaXRlbXMubGVuZ3RoID09PSAwKSB7IHJldHVybiB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCd1bCcsIHtjbGFzc05hbWU6ICdlcnJvcmxpc3QnfSwgaXRlbXMpXG59XG5cbi8qKlxuICogRGlzcGxheXMgZXJyb3IgZGV0YWlscyBhcyB0ZXh0LlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5FcnJvck9iamVjdC5wcm90b3R5cGUuYXNUZXh0ID0gRXJyb3JPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVycm9ycykubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgdmFyIG1lc3NhZ2VzID0gdGhpcy5lcnJvcnNbZmllbGRdLm1lc3NhZ2VzKClcbiAgICByZXR1cm4gWycqICcgKyBmaWVsZF0uY29uY2F0KG1lc3NhZ2VzLm1hcChmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICByZXR1cm4gKCcgICogJyArIG1lc3NhZ2UpXG4gICAgfSkpLmpvaW4oJ1xcbicpXG4gIH0uYmluZCh0aGlzKSkuam9pbignXFxuJylcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbkVycm9yT2JqZWN0LnByb3RvdHlwZS5hc0RhdGEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRhdGEgPSB7fVxuICBPYmplY3Qua2V5cyh0aGlzLmVycm9ycykubWFwKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgZGF0YVtmaWVsZF0gPSB0aGlzLmVycm9yc1tmaWVsZF0uYXNEYXRhKClcbiAgfS5iaW5kKHRoaXMpKVxuICByZXR1cm4gZGF0YVxufVxuXG4vKipcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuRXJyb3JPYmplY3QucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xuICB2YXIganNvbk9iaiA9IHt9XG4gIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JzKS5tYXAoZnVuY3Rpb24oZmllbGQpIHtcbiAgICBqc29uT2JqW2ZpZWxkXSA9IHRoaXMuZXJyb3JzW2ZpZWxkXS50b0pTT04oKVxuICB9LmJpbmQodGhpcykpXG4gIHJldHVybiBqc29uT2JqXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRXJyb3JPYmplY3RcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJyb3dzZXI6IHR5cGVvZiBwcm9jZXNzID09ICd1bmRlZmluZWQnXG59IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciBpcyA9IHJlcXVpcmUoJ2lzb21vcnBoL2lzJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIHRpbWUgPSByZXF1aXJlKCdpc29tb3JwaC90aW1lJylcbnZhciB1cmwgPSByZXF1aXJlKCdpc29tb3JwaC91cmwnKVxudmFyIHZhbGlkYXRvcnMgPSByZXF1aXJlKCd2YWxpZGF0b3JzJylcblxudmFyIGVudiA9IHJlcXVpcmUoJy4vZW52JylcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJylcbnZhciBsb2NhbGVzID0gcmVxdWlyZSgnLi9sb2NhbGVzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJylcblxudmFyIFZhbGlkYXRpb25FcnJvciA9IHZhbGlkYXRvcnMuVmFsaWRhdGlvbkVycm9yXG52YXIgV2lkZ2V0ID0gd2lkZ2V0cy5XaWRnZXRcbnZhciBjbGVhbklQdjZBZGRyZXNzID0gdmFsaWRhdG9ycy5pcHY2LmNsZWFuSVB2NkFkZHJlc3NcblxuLyoqXG4gKiBBbiBvYmplY3QgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgZG9pbmcgdmFsaWRhdGlvbiBhbmQgbm9ybWFsaXNhdGlvbiwgb3JcbiAqIFwiY2xlYW5pbmdcIiwgZm9yIGV4YW1wbGU6IGFuIEVtYWlsRmllbGQgbWFrZXMgc3VyZSBpdHMgZGF0YSBpcyBhIHZhbGlkXG4gKiBlLW1haWwgYWRkcmVzcyBhbmQgbWFrZXMgc3VyZSB0aGF0IGFjY2VwdGFibGUgXCJibGFua1wiIHZhbHVlcyBhbGwgaGF2ZSB0aGVcbiAqIHNhbWUgcmVwcmVzZW50YXRpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBGaWVsZCA9IENvbmN1ci5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuVGV4dElucHV0ICAgICAgICAgLy8gRGVmYXVsdCB3aWRnZXQgdG8gdXNlIHdoZW4gcmVuZGVyaW5nIHRoaXMgdHlwZSBvZiBGaWVsZFxuLCBoaWRkZW5XaWRnZXQ6IHdpZGdldHMuSGlkZGVuSW5wdXQgLy8gRGVmYXVsdCB3aWRnZXQgdG8gdXNlIHdoZW4gcmVuZGVyaW5nIHRoaXMgYXMgXCJoaWRkZW5cIlxuLCBkZWZhdWx0VmFsaWRhdG9yczogW10gICAgICAgICAgICAgLy8gRGVmYXVsdCBsaXN0IG9mIHZhbGlkYXRvcnNcbiAgLy8gQWRkIGFuICdpbnZhbGlkJyBlbnRyeSB0byBkZWZhdWx0RXJyb3JNZXNzYWdlcyBpZiB5b3Ugd2FudCBhIHNwZWNpZmljXG4gIC8vIGZpZWxkIGVycm9yIG1lc3NhZ2Ugbm90IHJhaXNlZCBieSB0aGUgZmllbGQgdmFsaWRhdG9ycy5cbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICByZXF1aXJlZDogJ1RoaXMgZmllbGQgaXMgcmVxdWlyZWQuJ1xuICB9XG4sIGVtcHR5VmFsdWVzOiB2YWxpZGF0b3JzLkVNUFRZX1ZBTFVFUy5zbGljZSgpXG4sIGVtcHR5VmFsdWVBcnJheTogdHJ1ZSAvLyBTaG91bGQgaXNFbXB0eVZhbHVlIGNoZWNrIGZvciBlbXB0eSBBcnJheXM/XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEZpZWxkKGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgcmVxdWlyZWQ6IHRydWUsIHdpZGdldDogbnVsbCwgbGFiZWw6IG51bGwsIGluaXRpYWw6IG51bGwsXG4gICAgICBoZWxwVGV4dDogbnVsbCwgZXJyb3JNZXNzYWdlczogbnVsbCwgc2hvd0hpZGRlbkluaXRpYWw6IGZhbHNlLFxuICAgICAgdmFsaWRhdG9yczogW10sIGNzc0NsYXNzOiBudWxsLCB2YWxpZGF0aW9uOiBudWxsLCBjb250cm9sbGVkOiBudWxsLFxuICAgICAgY3VzdG9tOiBudWxsXG4gICAgfSwga3dhcmdzKVxuICAgIHRoaXMucmVxdWlyZWQgPSBrd2FyZ3MucmVxdWlyZWRcbiAgICB0aGlzLmxhYmVsID0ga3dhcmdzLmxhYmVsXG4gICAgdGhpcy5pbml0aWFsID0ga3dhcmdzLmluaXRpYWxcbiAgICB0aGlzLnNob3dIaWRkZW5Jbml0aWFsID0ga3dhcmdzLnNob3dIaWRkZW5Jbml0aWFsXG4gICAgdGhpcy5oZWxwVGV4dCA9IGt3YXJncy5oZWxwVGV4dCB8fCAnJ1xuICAgIHRoaXMuY3NzQ2xhc3MgPSBrd2FyZ3MuY3NzQ2xhc3NcbiAgICB0aGlzLnZhbGlkYXRpb24gPSB1dGlsLm5vcm1hbGlzZVZhbGlkYXRpb24oa3dhcmdzLnZhbGlkYXRpb24pXG4gICAgdGhpcy5jb250cm9sbGVkID0ga3dhcmdzLmNvbnRyb2xsZWRcbiAgICB0aGlzLmN1c3RvbSA9IGt3YXJncy5jdXN0b21cblxuICAgIHZhciB3aWRnZXQgPSBrd2FyZ3Mud2lkZ2V0IHx8IHRoaXMud2lkZ2V0XG4gICAgaWYgKCEod2lkZ2V0IGluc3RhbmNlb2YgV2lkZ2V0KSkge1xuICAgICAgLy8gV2UgbXVzdCBoYXZlIGEgV2lkZ2V0IGNvbnN0cnVjdG9yLCBzbyBjb25zdHJ1Y3Qgd2l0aCBpdFxuICAgICAgd2lkZ2V0ID0gbmV3IHdpZGdldCgpXG4gICAgfVxuICAgIC8vIExldCB0aGUgd2lkZ2V0IGtub3cgd2hldGhlciBpdCBzaG91bGQgZGlzcGxheSBhcyByZXF1aXJlZFxuICAgIHdpZGdldC5pc1JlcXVpcmVkID0gdGhpcy5yZXF1aXJlZFxuICAgIC8vIEhvb2sgaW50byB0aGlzLndpZGdldEF0dHJzKCkgZm9yIGFueSBGaWVsZC1zcGVjaWZpYyBIVE1MIGF0dHJpYnV0ZXNcbiAgICBvYmplY3QuZXh0ZW5kKHdpZGdldC5hdHRycywgdGhpcy53aWRnZXRBdHRycyh3aWRnZXQpKVxuICAgIHRoaXMud2lkZ2V0ID0gd2lkZ2V0XG5cbiAgICAvLyBJbmNyZW1lbnQgdGhlIGNyZWF0aW9uIGNvdW50ZXIgYW5kIHNhdmUgb3VyIGxvY2FsIGNvcHlcbiAgICB0aGlzLmNyZWF0aW9uQ291bnRlciA9IEZpZWxkLmNyZWF0aW9uQ291bnRlcisrXG5cbiAgICAvLyBDb3B5IGVycm9yIG1lc3NhZ2VzIGZvciB0aGlzIGluc3RhbmNlIGludG8gYSBuZXcgb2JqZWN0IGFuZCBvdmVycmlkZVxuICAgIC8vIHdpdGggYW55IHByb3ZpZGVkIGVycm9yIG1lc3NhZ2VzLlxuICAgIHZhciBtZXNzYWdlcyA9IFt7fV1cbiAgICBmb3IgKHZhciBpID0gdGhpcy5jb25zdHJ1Y3Rvci5fX21yb19fLmxlbmd0aCAtIDE7IGkgPj0wOyBpLS0pIHtcbiAgICAgIG1lc3NhZ2VzLnB1c2gob2JqZWN0LmdldCh0aGlzLmNvbnN0cnVjdG9yLl9fbXJvX19baV0ucHJvdG90eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkZWZhdWx0RXJyb3JNZXNzYWdlcycsIG51bGwpKVxuICAgIH1cbiAgICBtZXNzYWdlcy5wdXNoKGt3YXJncy5lcnJvck1lc3NhZ2VzKVxuICAgIHRoaXMuZXJyb3JNZXNzYWdlcyA9IG9iamVjdC5leHRlbmQuYXBwbHkob2JqZWN0LCBtZXNzYWdlcylcblxuICAgIHRoaXMudmFsaWRhdG9ycyA9IHRoaXMuZGVmYXVsdFZhbGlkYXRvcnMuY29uY2F0KGt3YXJncy52YWxpZGF0b3JzKVxuICB9XG59KVxuXG4vKipcbiAqIFRyYWNrcyBlYWNoIHRpbWUgYSBGaWVsZCBpbnN0YW5jZSBpcyBjcmVhdGVkOyB1c2VkIHRvIHJldGFpbiBvcmRlci5cbiAqL1xuRmllbGQuY3JlYXRpb25Db3VudGVyID0gMFxuXG5GaWVsZC5wcm90b3R5cGUucHJlcGFyZVZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQHBhcmFtIHsqfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIENoZWNrcyBmb3IgdGhlIGdpdmVuIHZhbHVlIGJlaW5nID09PSBvbmUgb2YgdGhlIGNvbmZpZ3VyZWQgZW1wdHkgdmFsdWVzLCBwbHVzXG4gKiBhbnkgYWRkaXRpb25hbCBjaGVja3MgcmVxdWlyZWQgZHVlIHRvIEphdmFTY3JpcHQncyBsYWNrIG9mIGEgZ2VuZXJpYyBvYmplY3RcbiAqIGVxdWFsaXR5IGNoZWNraW5nIG1lY2hhbmlzbS5cbiAqL1xuRmllbGQucHJvdG90eXBlLmlzRW1wdHlWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmVtcHR5VmFsdWVzLmluZGV4T2YodmFsdWUpICE9IC0xKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gKHRoaXMuZW1wdHlWYWx1ZUFycmF5ID09PSB0cnVlICYmIGlzLkFycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApXG59XG5cbkZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLnJlcXVpcmVkICYmIHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMucmVxdWlyZWQsIHtjb2RlOiAncmVxdWlyZWQnfSlcbiAgfVxufVxuXG5GaWVsZC5wcm90b3R5cGUucnVuVmFsaWRhdG9ycyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgZXJyb3JzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnZhbGlkYXRvcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIHZhbGlkYXRvciA9IHRoaXMudmFsaWRhdG9yc1tpXVxuICAgIHRyeSB7XG4gICAgICB2YWxpZGF0b3IodmFsdWUpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICAgIGlmIChvYmplY3QuaGFzT3duKGUsICdjb2RlJykgJiZcbiAgICAgICAgICBvYmplY3QuaGFzT3duKHRoaXMuZXJyb3JNZXNzYWdlcywgZS5jb2RlKSkge1xuICAgICAgICBlLm1lc3NhZ2UgPSB0aGlzLmVycm9yTWVzc2FnZXNbZS5jb2RlXVxuICAgICAgfVxuICAgICAgZXJyb3JzLnB1c2guYXBwbHkoZXJyb3JzLCBlLmVycm9yTGlzdClcbiAgICB9XG4gIH1cbiAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKGVycm9ycylcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGUgZ2l2ZW4gdmFsdWUgYW5kIHJldHVybnMgaXRzIFwiY2xlYW5lZFwiIHZhbHVlIGFzIGFuIGFwcHJvcHJpYXRlXG4gKiBKYXZhU2NyaXB0IG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSB0aGlzLnRvSmF2YVNjcmlwdCh2YWx1ZSlcbiAgdGhpcy52YWxpZGF0ZSh2YWx1ZSlcbiAgdGhpcy5ydW5WYWxpZGF0b3JzKHZhbHVlKVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGJlIHNob3duIGZvciB0aGlzIGZpZWxkIG9uIHJlbmRlciBvZiBhIGJvdW5kXG4gKiBmb3JtLCBnaXZlbiB0aGUgc3VibWl0dGVkIGRhdGEgZm9yIHRoZSBmaWVsZCBhbmQgdGhlIGluaXRpYWwgZGF0YSwgaWYgYW55LlxuICogRm9yIG1vc3QgZmllbGRzLCB0aGlzIHdpbGwgc2ltcGx5IGJlIGRhdGE7IEZpbGVGaWVsZHMgbmVlZCB0byBoYW5kbGUgaXQgYSBiaXRcbiAqIGRpZmZlcmVudGx5LlxuICovXG5GaWVsZC5wcm90b3R5cGUuYm91bmREYXRhID0gZnVuY3Rpb24oZGF0YSwgaW5pdGlhbCkge1xuICByZXR1cm4gZGF0YVxufVxuXG4vKipcbiAqIFNwZWNpZmllcyBIVE1MIGF0dHJpYnV0ZXMgd2hpY2ggc2hvdWxkIGJlIGFkZGVkIHRvIGEgZ2l2ZW4gd2lkZ2V0IGZvciB0aGlzXG4gKiBmaWVsZC5cbiAqIEBwYXJhbSB7V2lkZ2V0fSB3aWRnZXQgYSB3aWRnZXQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFuIG9iamVjdCBzcGVjaWZ5aW5nIEhUTUwgYXR0cmlidXRlcyB0aGF0IHNob3VsZCBiZSBhZGRlZCB0b1xuICogICB0aGUgZ2l2ZW4gd2lkZ2V0IHdoZW4gcmVuZGVyZWQsIGJhc2VkIG9uIHRoaXMgZmllbGQuXG4gKi9cbkZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICByZXR1cm4ge31cbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGRhdGEgZGlmZmVycyBmcm9tIGluaXRpYWwuXG4gKi9cbkZpZWxkLnByb3RvdHlwZS5faGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKGluaXRpYWwsIGRhdGEpIHtcbiAgLy8gRm9yIHB1cnBvc2VzIG9mIHNlZWluZyB3aGV0aGVyIHNvbWV0aGluZyBoYXMgY2hhbmdlZCwgbnVsbCBpcyB0aGUgc2FtZVxuICAvLyBhcyBhbiBlbXB0eSBzdHJpbmcsIGlmIHRoZSBkYXRhIG9yIGluaXRpYWwgdmFsdWUgd2UgZ2V0IGlzIG51bGwsIHJlcGxhY2VcbiAgLy8gaXQgd2l0aCAnJy5cbiAgdmFyIGluaXRpYWxWYWx1ZSA9IChpbml0aWFsID09PSBudWxsID8gJycgOiBpbml0aWFsKVxuICB0cnkge1xuICAgIGRhdGEgPSB0aGlzLnRvSmF2YVNjcmlwdChkYXRhKVxuICAgIGlmICh0eXBlb2YgdGhpcy5fY29lcmNlID09ICdmdW5jdGlvbicpIHtcbiAgICAgIGRhdGEgPSB0aGlzLl9jb2VyY2UoZGF0YSlcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHZhciBkYXRhVmFsdWUgPSAoZGF0YSA9PT0gbnVsbCA/ICcnIDogZGF0YSlcbiAgcmV0dXJuICgnJytpbml0aWFsVmFsdWUgIT0gJycrZGF0YVZhbHVlKSAvLyBUT0RPIGlzIGZvcmNpbmcgdG8gc3RyaW5nIG5lY2Vzc2FyeT9cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBTdHJpbmcuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBDaGFyRmllbGQgPSBGaWVsZC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2hhckZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBDaGFyRmllbGQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7bWF4TGVuZ3RoOiBudWxsLCBtaW5MZW5ndGg6IG51bGx9LCBrd2FyZ3MpXG4gICAgdGhpcy5tYXhMZW5ndGggPSBrd2FyZ3MubWF4TGVuZ3RoXG4gICAgdGhpcy5taW5MZW5ndGggPSBrd2FyZ3MubWluTGVuZ3RoXG4gICAgRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgaWYgKHRoaXMubWluTGVuZ3RoICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3JzLk1pbkxlbmd0aFZhbGlkYXRvcih0aGlzLm1pbkxlbmd0aCkpXG4gICAgfVxuICAgIGlmICh0aGlzLm1heExlbmd0aCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2godmFsaWRhdG9ycy5NYXhMZW5ndGhWYWxpZGF0b3IodGhpcy5tYXhMZW5ndGgpKVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkNoYXJGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHJldHVybiAnJ1xuICB9XG4gIHJldHVybiAnJyt2YWx1ZVxufVxuXG4vKipcbiAqIElmIHRoaXMgZmllbGQgaXMgY29uZmlndXJlZCB0byBlbmZvcmNlIGEgbWF4aW11bSBsZW5ndGgsIGFkZHMgYSBzdWl0YWJsZVxuICogbWF4TGVuZ3RoIGF0dHJpYnV0ZSB0byB0ZXh0IGlucHV0IGZpZWxkcy5cbiAqIEBwYXJhbSB7V2lkZ2V0fSB3aWRnZXQgdGhlIHdpZGdldCBiZWluZyB1c2VkIHRvIHJlbmRlciB0aGlzIGZpZWxkJ3MgdmFsdWUuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFkZGl0aW9uYWwgYXR0cmlidXRlcyB3aGljaCBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHdpZGdldC5cbiAqL1xuQ2hhckZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICB2YXIgYXR0cnMgPSB7fVxuICBpZiAodGhpcy5tYXhMZW5ndGggIT09IG51bGwgJiYgKHdpZGdldCBpbnN0YW5jZW9mIHdpZGdldHMuVGV4dElucHV0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkZ2V0IGluc3RhbmNlb2Ygd2lkZ2V0cy5QYXNzd29yZElucHV0KSkge1xuICAgIGF0dHJzLm1heExlbmd0aCA9ICcnK3RoaXMubWF4TGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGF0dHJzXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgdmFsaWQgaW50ZWdlci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIEludGVnZXJGaWVsZCA9IEZpZWxkLmV4dGVuZCh7XG4gIHdpZGdldDogd2lkZ2V0cy5OdW1iZXJJbnB1dFxuLCBkZWZhdWx0RXJyb3JNZXNzYWdlczoge1xuICAgIGludmFsaWQ6ICdFbnRlciBhIHdob2xlIG51bWJlci4nXG4gIH1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gSW50ZWdlckZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBJbnRlZ2VyRmllbGQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7bWF4VmFsdWU6IG51bGwsIG1pblZhbHVlOiBudWxsfSwga3dhcmdzKVxuICAgIHRoaXMubWF4VmFsdWUgPSBrd2FyZ3MubWF4VmFsdWVcbiAgICB0aGlzLm1pblZhbHVlID0ga3dhcmdzLm1pblZhbHVlXG4gICAgRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG5cbiAgICBpZiAodGhpcy5taW5WYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy52YWxpZGF0b3JzLnB1c2godmFsaWRhdG9ycy5NaW5WYWx1ZVZhbGlkYXRvcih0aGlzLm1pblZhbHVlKSlcbiAgICB9XG4gICAgaWYgKHRoaXMubWF4VmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMudmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcnMuTWF4VmFsdWVWYWxpZGF0b3IodGhpcy5tYXhWYWx1ZSkpXG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IE51bWJlcigpIGNhbiBiZSBjYWxsZWQgb24gdGhlIGlucHV0IHdpdGggYSByZXN1bHQgdGhhdCBpc24ndFxuICogTmFOIGFuZCBkb2Vzbid0IGNvbnRhaW4gYW55IGRlY2ltYWwgcG9pbnRzLlxuICogQHBhcmFtIHsqfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHJldHVybiB7P251bWJlcn0gdGhlIHJlc3VsdCBvZiBOdW1iZXIoKSwgb3IgbnVsbCBmb3IgZW1wdHkgdmFsdWVzLlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuSW50ZWdlckZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YWx1ZSA9IEZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQuY2FsbCh0aGlzLCB2YWx1ZSlcbiAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgdmFsdWUgPSBOdW1iZXIodmFsdWUpXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUudG9TdHJpbmcoKS5pbmRleE9mKCcuJykgIT0gLTEpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG5JbnRlZ2VyRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gIHZhciBhdHRycyA9IEZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycy5jYWxsKHRoaXMsIHdpZGdldClcbiAgaWYgKHdpZGdldCBpbnN0YW5jZW9mIHdpZGdldHMuTnVtYmVySW5wdXQpIHtcbiAgICBpZiAodGhpcy5taW5WYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgYXR0cnMubWluID0gdGhpcy5taW5WYWx1ZVxuICAgIH1cbiAgICBpZiAodGhpcy5tYXhWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgYXR0cnMubWF4ID0gdGhpcy5tYXhWYWx1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXR0cnNcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBmbG9hdC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ludGVnZXJGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBGbG9hdEZpZWxkID0gSW50ZWdlckZpZWxkLmV4dGVuZCh7XG4gIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZDogJ0VudGVyIGEgbnVtYmVyLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBGbG9hdEZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBGbG9hdEZpZWxkKGt3YXJncykgfVxuICAgIEludGVnZXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqIEZsb2F0IHZhbGlkYXRpb24gcmVndWxhciBleHByZXNzaW9uLCBhcyBwYXJzZUZsb2F0KCkgaXMgdG9vIGZvcmdpdmluZy4gKi9cbkZsb2F0RmllbGQuRkxPQVRfUkVHRVhQID0gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98KD86XFxkKyk/XFwuXFxkKykkL1xuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IHRoZSBpbnB1dCBsb29rcyBsaWtlIHZhbGlkIGlucHV0IGZvciBwYXJzZUZsb2F0KCkgYW5kIHRoZVxuICogcmVzdWx0IG9mIGNhbGxpbmcgaXQgaXNuJ3QgTmFOLlxuICogQHBhcmFtIHsqfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHJldHVybiBhIE51bWJlciBvYnRhaW5lZCBmcm9tIHBhcnNlRmxvYXQoKSwgb3IgbnVsbCBmb3IgZW1wdHkgdmFsdWVzLlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuRmxvYXRGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSBGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0LmNhbGwodGhpcywgdmFsdWUpXG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHZhbHVlID0gdXRpbC5zdHJpcCh2YWx1ZSlcbiAgaWYgKCFGbG9hdEZpZWxkLkZMT0FUX1JFR0VYUC50ZXN0KHZhbHVlKSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZCwge2NvZGU6ICdpbnZhbGlkJ30pXG4gIH1cbiAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKVxuICBpZiAoaXNOYU4odmFsdWUpKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkLCB7Y29kZTogJ2ludmFsaWQnfSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGRhdGEgaGFzIGNoYW5nZWQgZnJvbSBpbml0aWFsLiBJbiBKYXZhU2NyaXB0LCB0cmFpbGluZyB6ZXJvZXNcbiAqIGluIGZsb2F0cyBhcmUgZHJvcHBlZCB3aGVuIGEgZmxvYXQgaXMgY29lcmNlZCB0byBhIFN0cmluZywgc28gZS5nLiwgYW5cbiAqIGluaXRpYWwgdmFsdWUgb2YgMS4wIHdvdWxkIG5vdCBtYXRjaCBhIGRhdGEgdmFsdWUgb2YgJzEuMCcgaWYgd2Ugd2VyZSB0byB1c2VcbiAqIHRoZSBXaWRnZXQgb2JqZWN0J3MgX2hhc0NoYW5nZWQsIHdoaWNoIGNoZWNrcyBjb2VyY2VkIFN0cmluZyB2YWx1ZXMuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGRhdGEgaGFzIGNoYW5nZWQgZnJvbSBpbml0aWFsLlxuICovXG5GbG9hdEZpZWxkLnByb3RvdHlwZS5faGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKGluaXRpYWwsIGRhdGEpIHtcbiAgLy8gRm9yIHB1cnBvc2VzIG9mIHNlZWluZyB3aGV0aGVyIHNvbWV0aGluZyBoYXMgY2hhbmdlZCwgbnVsbCBpcyB0aGUgc2FtZVxuICAvLyBhcyBhbiBlbXB0eSBzdHJpbmcsIGlmIHRoZSBkYXRhIG9yIGluaXRpYWwgdmFsdWUgd2UgZ2V0IGlzIG51bGwsIHJlcGxhY2VcbiAgLy8gaXQgd2l0aCAnJy5cbiAgdmFyIGRhdGFWYWx1ZSA9IChkYXRhID09PSBudWxsID8gJycgOiBkYXRhKVxuICB2YXIgaW5pdGlhbFZhbHVlID0gKGluaXRpYWwgPT09IG51bGwgPyAnJyA6IGluaXRpYWwpXG4gIGlmIChpbml0aWFsVmFsdWUgPT09IGRhdGFWYWx1ZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGVsc2UgaWYgKGluaXRpYWxWYWx1ZSA9PT0gJycgfHwgZGF0YVZhbHVlID09PSAnJykge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcmV0dXJuIChwYXJzZUZsb2F0KCcnK2luaXRpYWxWYWx1ZSkgIT0gcGFyc2VGbG9hdCgnJytkYXRhVmFsdWUpKVxufVxuXG5GbG9hdEZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICB2YXIgYXR0cnMgPSBJbnRlZ2VyRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzLmNhbGwodGhpcywgd2lkZ2V0KVxuICBpZiAod2lkZ2V0IGluc3RhbmNlb2Ygd2lkZ2V0cy5OdW1iZXJJbnB1dCAmJlxuICAgICAgIW9iamVjdC5oYXNPd24od2lkZ2V0LmF0dHJzLCAnc3RlcCcpKSB7XG4gICAgb2JqZWN0LnNldERlZmF1bHQoYXR0cnMsICdzdGVwJywgJ2FueScpXG4gIH1cbiAgcmV0dXJuIGF0dHJzXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgZGVjaW1hbCBudW1iZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBEZWNpbWFsRmllbGQgPSBJbnRlZ2VyRmllbGQuZXh0ZW5kKHtcbiAgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSBudW1iZXIuJ1xuICAsIG1heERpZ2l0czogJ0Vuc3VyZSB0aGF0IHRoZXJlIGFyZSBubyBtb3JlIHRoYW4ge21heH0gZGlnaXRzIGluIHRvdGFsLidcbiAgLCBtYXhEZWNpbWFsUGxhY2VzOiAnRW5zdXJlIHRoYXQgdGhlcmUgYXJlIG5vIG1vcmUgdGhhbiB7bWF4fSBkZWNpbWFsIHBsYWNlcy4nXG4gICwgbWF4V2hvbGVEaWdpdHM6ICdFbnN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gbW9yZSB0aGFuIHttYXh9IGRpZ2l0cyBiZWZvcmUgdGhlIGRlY2ltYWwgcG9pbnQuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIERlY2ltYWxGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgRGVjaW1hbEZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe21heERpZ2l0czogbnVsbCwgZGVjaW1hbFBsYWNlczogbnVsbH0sIGt3YXJncylcbiAgICB0aGlzLm1heERpZ2l0cyA9IGt3YXJncy5tYXhEaWdpdHNcbiAgICB0aGlzLmRlY2ltYWxQbGFjZXMgPSBrd2FyZ3MuZGVjaW1hbFBsYWNlc1xuICAgIEludGVnZXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqIERlY2ltYWwgdmFsaWRhdGlvbiByZWd1bGFyIGV4cHJlc3Npb24sIGluIGxpZXUgb2YgYSBEZWNpbWFsIHR5cGUuICovXG5EZWNpbWFsRmllbGQuREVDSU1BTF9SRUdFWFAgPSAvXlstK10/KD86XFxkKyg/OlxcLlxcZCopP3woPzpcXGQrKT9cXC5cXGQrKSQvXG5cbi8qKlxuICogRGVjaW1hbEZpZWxkIG92ZXJyaWRlcyB0aGUgY2xlYW4oKSBtZXRob2QgYXMgaXQgcGVyZm9ybXMgaXRzIG93biB2YWxpZGF0aW9uXG4gKiBhZ2FpbnN0IGEgZGlmZmVyZW50IHZhbHVlIHRoYW4gdGhhdCBnaXZlbiB0byBhbnkgZGVmaW5lZCB2YWxpZGF0b3JzLCBkdWUgdG9cbiAqIEphdmFTY3JpcHQgbGFja2luZyBhIGJ1aWx0LWluIERlY2ltYWwgdHlwZS4gRGVjaW1hbCBmb3JtYXQgYW5kIGNvbXBvbmVudCBzaXplXG4gKiBjaGVja3Mgd2lsbCBiZSBwZXJmb3JtZWQgYWdhaW5zdCBhIG5vcm1hbGlzZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZVxuICogaW5wdXQsIHdoZXJlYXMgVmFsaWRhdG9ycyB3aWxsIGJlIHBhc3NlZCBhIGZsb2F0IHZlcnNpb24gb2YgdGhlIHZhbHVlIGZvclxuICogbWluL21heCBjaGVja2luZy5cbiAqIEBwYXJhbSB7c3RyaW5nfE51bWJlcn0gdmFsdWVcbiAqIEByZXR1cm4ge3N0cmluZ30gYSBub3JtYWxpc2VkIHZlcnNpb24gb2YgdGhlIGlucHV0LlxuICovXG5EZWNpbWFsRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgLy8gVGFrZSBjYXJlIG9mIGVtcHR5LCByZXF1aXJlZCB2YWxpZGF0aW9uXG4gIEZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZS5jYWxsKHRoaXMsIHZhbHVlKVxuICBpZiAodGhpcy5pc0VtcHR5VmFsdWUodmFsdWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIENvZXJjZSB0byBzdHJpbmcgYW5kIHZhbGlkYXRlIHRoYXQgaXQgbG9va3MgRGVjaW1hbC1saWtlXG4gIHZhbHVlID0gdXRpbC5zdHJpcCgnJyt2YWx1ZSlcbiAgaWYgKCFEZWNpbWFsRmllbGQuREVDSU1BTF9SRUdFWFAudGVzdCh2YWx1ZSkpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG5cbiAgLy8gSW4gbGlldSBvZiBhIERlY2ltYWwgdHlwZSwgRGVjaW1hbEZpZWxkIHZhbGlkYXRlcyBhZ2FpbnN0IGEgc3RyaW5nXG4gIC8vIHJlcHJlc2VudGF0aW9uIG9mIGEgRGVjaW1hbCwgaW4gd2hpY2g6XG4gIC8vICogQW55IGxlYWRpbmcgc2lnbiBoYXMgYmVlbiBzdHJpcHBlZFxuICB2YXIgbmVnYXRpdmUgPSBmYWxzZVxuICBpZiAodmFsdWUuY2hhckF0KDApID09ICcrJyB8fCB2YWx1ZS5jaGFyQXQoMCkgPT0gJy0nKSB7XG4gICAgbmVnYXRpdmUgPSAodmFsdWUuY2hhckF0KDApID09ICctJylcbiAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cigxKVxuICB9XG4gIC8vICogTGVhZGluZyB6ZXJvcyBoYXZlIGJlZW4gc3RyaXBwZWQgZnJvbSBkaWdpdHMgYmVmb3JlIHRoZSBkZWNpbWFsIHBvaW50LFxuICAvLyAgIGJ1dCB0cmFpbGluZyBkaWdpdHMgYXJlIHJldGFpbmVkIGFmdGVyIHRoZSBkZWNpbWFsIHBvaW50LlxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL14wKy8sICcnKVxuICAvLyAqIElmIHRoZSBpbnB1dCBlbmRlZCB3aXRoIGEgJy4nLCBpdCBpcyBzdHJpcHBlZFxuICBpZiAodmFsdWUuaW5kZXhPZignLicpID09IHZhbHVlLmxlbmd0aCAtIDEpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCB2YWx1ZS5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gUGVyZm9ybSBvd24gdmFsaWRhdGlvblxuICB2YXIgcGllY2VzID0gdmFsdWUuc3BsaXQoJy4nKVxuICB2YXIgd2hvbGVEaWdpdHMgPSBwaWVjZXNbMF0ubGVuZ3RoXG4gIHZhciBkZWNpbWFscyA9IChwaWVjZXMubGVuZ3RoID09IDIgPyBwaWVjZXNbMV0ubGVuZ3RoIDogMClcbiAgdmFyIGRpZ2l0cyA9IHdob2xlRGlnaXRzICsgZGVjaW1hbHNcbiAgaWYgKHRoaXMubWF4RGlnaXRzICE9PSBudWxsICYmIGRpZ2l0cyA+IHRoaXMubWF4RGlnaXRzKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5tYXhEaWdpdHMsIHtcbiAgICAgIGNvZGU6ICdtYXhEaWdpdHMnXG4gICAgLCBwYXJhbXM6IHttYXg6IHRoaXMubWF4RGlnaXRzfVxuICAgIH0pXG4gIH1cbiAgaWYgKHRoaXMuZGVjaW1hbFBsYWNlcyAhPT0gbnVsbCAmJiBkZWNpbWFscyA+IHRoaXMuZGVjaW1hbFBsYWNlcykge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMubWF4RGVjaW1hbFBsYWNlcywge1xuICAgICAgY29kZTogJ21heERlY2ltYWxQbGFjZXMnXG4gICAgLCBwYXJhbXM6IHttYXg6IHRoaXMuZGVjaW1hbFBsYWNlc31cbiAgICB9KVxuICB9XG4gIGlmICh0aGlzLm1heERpZ2l0cyAhPT0gbnVsbCAmJlxuICAgICAgdGhpcy5kZWNpbWFsUGxhY2VzICE9PSBudWxsICYmXG4gICAgICB3aG9sZURpZ2l0cyA+ICh0aGlzLm1heERpZ2l0cyAtIHRoaXMuZGVjaW1hbFBsYWNlcykpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLm1heFdob2xlRGlnaXRzLCB7XG4gICAgICBjb2RlOiAnbWF4V2hvbGVEaWdpdHMnXG4gICAgLCBwYXJhbXM6IHttYXg6ICh0aGlzLm1heERpZ2l0cyAtIHRoaXMuZGVjaW1hbFBsYWNlcyl9XG4gICAgfSlcbiAgfVxuXG4gIC8vICogVmFsdWVzIHdoaWNoIGRpZCBub3QgaGF2ZSBhIGxlYWRpbmcgemVybyBnYWluIGEgc2luZ2xlIGxlYWRpbmcgemVyb1xuICBpZiAodmFsdWUuY2hhckF0KDApID09ICcuJykge1xuICAgIHZhbHVlID0gJzAnICsgdmFsdWVcbiAgfVxuICAvLyBSZXN0b3JlIHNpZ24gaWYgbmVjZXNzYXJ5XG4gIGlmIChuZWdhdGl2ZSkge1xuICAgIHZhbHVlID0gJy0nICsgdmFsdWVcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGFnYWluc3QgYSBmbG9hdCB2YWx1ZSAtIGJlc3Qgd2UgY2FuIGRvIGluIHRoZSBtZWFudGltZVxuICB0aGlzLnJ1blZhbGlkYXRvcnMocGFyc2VGbG9hdCh2YWx1ZSkpXG5cbiAgLy8gUmV0dXJuIHRoZSBub3JtYWxpc2VkIFN0cmluZyByZXByZXNlbnRhdGlvblxuICByZXR1cm4gdmFsdWVcbn1cblxuRGVjaW1hbEZpZWxkLnByb3RvdHlwZS53aWRnZXRBdHRycyA9IGZ1bmN0aW9uKHdpZGdldCkge1xuICB2YXIgYXR0cnMgPSBJbnRlZ2VyRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzLmNhbGwodGhpcywgd2lkZ2V0KVxuICBpZiAod2lkZ2V0IGluc3RhbmNlb2Ygd2lkZ2V0cy5OdW1iZXJJbnB1dCAmJlxuICAgICAgIW9iamVjdC5oYXNPd24od2lkZ2V0LmF0dHJzLCAnc3RlcCcpKSB7XG4gICAgdmFyIHN0ZXAgPSAnYW55J1xuICAgIGlmICh0aGlzLmRlY2ltYWxQbGFjZXMgIT09IG51bGwpIHtcbiAgICAgIC8vIFVzZSBleHBvbmVudGlhbCBub3RhdGlvbiBmb3Igc21hbGwgdmFsdWVzIHNpbmNlIHRoZXkgbWlnaHRcbiAgICAgIC8vIGJlIHBhcnNlZCBhcyAwIG90aGVyd2lzZS5cbiAgICAgIGlmICh0aGlzLmRlY2ltYWxQbGFjZXMgPT09IDApIHtcbiAgICAgICAgc3RlcCA9ICcxJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodGhpcy5kZWNpbWFsUGxhY2VzIDwgNykge1xuICAgICAgICBzdGVwID0gJzAuJyArICcwMDAwMDEnLnNsaWNlKC10aGlzLmRlY2ltYWxQbGFjZXMpXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc3RlcCA9ICcxZS0nICsgdGhpcy5kZWNpbWFsUGxhY2VzXG4gICAgICB9XG4gICAgfVxuICAgIG9iamVjdC5zZXREZWZhdWx0KGF0dHJzLCAnc3RlcCcsIHN0ZXApXG4gIH1cbiAgcmV0dXJuIGF0dHJzXG59XG5cbi8qKlxuICogQmFzZSBmaWVsZCBmb3IgZmllbGRzIHdoaWNoIHZhbGlkYXRlIHRoYXQgdGhlaXIgaW5wdXQgaXMgYSBkYXRlIG9yIHRpbWUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBCYXNlVGVtcG9yYWxGaWVsZCA9IEZpZWxkLmV4dGVuZCh7XG4gIGlucHV0Rm9ybWF0VHlwZTogJydcbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEJhc2VUZW1wb3JhbEZpZWxkKGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2lucHV0Rm9ybWF0czogbnVsbH0sIGt3YXJncylcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLmlucHV0Rm9ybWF0cyA9IGt3YXJncy5pbnB1dEZvcm1hdHNcbiAgfVxufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBkYXRlIG9yIHRpbWUuXG4gKiBAcGFyYW0geyhzdHJpbmd8RGF0ZSl9IHZhbHVlIHVzZXIgaW5wdXQuXG4gKiBAcmV0dXJuIHtEYXRlfVxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICghaXMuRGF0ZSh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IHV0aWwuc3RyaXAodmFsdWUpXG4gIH1cbiAgaWYgKGlzLlN0cmluZyh2YWx1ZSkpIHtcbiAgICBpZiAodGhpcy5pbnB1dEZvcm1hdHMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW5wdXRGb3JtYXRzID0gZm9ybWF0cy5nZXRGb3JtYXQodGhpcy5pbnB1dEZvcm1hdFR5cGUpXG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5pbnB1dEZvcm1hdHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJwZGF0ZSh2YWx1ZSwgdGhpcy5pbnB1dEZvcm1hdHNbaV0pXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICAvLyBwYXNzXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZCwge2NvZGU6ICdpbnZhbGlkJ30pXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIERhdGUgZnJvbSB0aGUgZ2l2ZW4gaW5wdXQgaWYgaXQncyB2YWxpZCBiYXNlZCBvbiBhIGZvcm1hdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdFxuICogQHJldHVybiB7RGF0ZX1cbiAqL1xuQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLnN0cnBkYXRlID0gZnVuY3Rpb24odmFsdWUsIGZvcm1hdCkge1xuICByZXR1cm4gdGltZS5zdHJwZGF0ZSh2YWx1ZSwgZm9ybWF0LCBsb2NhbGVzLmdldERlZmF1bHRMb2NhbGUoKSlcbn1cblxuQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLl9oYXNDaGFuZ2VkID0gZnVuY3Rpb24oaW5pdGlhbCwgZGF0YSkge1xuICB0cnkge1xuICAgIGRhdGEgPSB0aGlzLnRvSmF2YVNjcmlwdChkYXRhKVxuICB9XG4gIGNhdGNoIChlKSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHsgdGhyb3cgZSB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBpbml0aWFsID0gdGhpcy50b0phdmFTY3JpcHQoaW5pdGlhbClcbiAgaWYgKCEhaW5pdGlhbCAmJiAhIWRhdGEpIHtcbiAgICByZXR1cm4gaW5pdGlhbC5nZXRUaW1lKCkgIT09IGRhdGEuZ2V0VGltZSgpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIGluaXRpYWwgIT09IGRhdGFcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBpcyBhIGRhdGUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtCYXNlVGVtcG9yYWxGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBEYXRlRmllbGQgPSBCYXNlVGVtcG9yYWxGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuRGF0ZUlucHV0XG4sIGlucHV0Rm9ybWF0VHlwZTogJ0RBVEVfSU5QVVRfRk9STUFUUydcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSB2YWxpZCBkYXRlLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBEYXRlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IERhdGVGaWVsZChrd2FyZ3MpIH1cbiAgICBCYXNlVGVtcG9yYWxGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgaW5wdXQgY2FuIGJlIGNvbnZlcnRlZCB0byBhIGRhdGUuXG4gKiBAcGFyYW0gez8oc3RyaW5nfERhdGUpfSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHJldHVybiB7P0RhdGV9IGEgd2l0aCBpdHMgeWVhciwgbW9udGggYW5kIGRheSBhdHRyaWJ1dGVzIHNldCwgb3IgbnVsbCBmb3JcbiAqICAgZW1wdHkgdmFsdWVzIHdoZW4gdGhleSBhcmUgYWxsb3dlZC5cbiAqIEB0aHJvd3Mge1ZhbGlkYXRpb25FcnJvcn0gaWYgdGhlIGlucHV0IGlzIGludmFsaWQuXG4gKi9cbkRhdGVGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBuZXcgRGF0ZSh2YWx1ZS5nZXRGdWxsWWVhcigpLCB2YWx1ZS5nZXRNb250aCgpLCB2YWx1ZS5nZXREYXRlKCkpXG4gIH1cbiAgcmV0dXJuIEJhc2VUZW1wb3JhbEZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQuY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB0aW1lLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7QmFzZVRlbXBvcmFsRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgVGltZUZpZWxkID0gQmFzZVRlbXBvcmFsRmllbGQuZXh0ZW5kKHtcbiAgd2lkZ2V0OiB3aWRnZXRzLlRpbWVJbnB1dFxuLCBpbnB1dEZvcm1hdFR5cGU6ICdUSU1FX0lOUFVUX0ZPUk1BVFMnXG4sIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZDogJ0VudGVyIGEgdmFsaWQgdGltZS4nXG4gIH1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVGltZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBUaW1lRmllbGQoa3dhcmdzKSB9XG4gICAgQmFzZVRlbXBvcmFsRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgdGhlIGlucHV0IGNhbiBiZSBjb252ZXJ0ZWQgdG8gYSB0aW1lLlxuICogQHBhcmFtIHs/KHN0cmluZ3xEYXRlKX0gdmFsdWUgdXNlciBpbnB1dC5cbiAqIEByZXR1cm4gez9EYXRlfSBhIERhdGUgd2l0aCBpdHMgaG91ciwgbWludXRlIGFuZCBzZWNvbmQgYXR0cmlidXRlcyBzZXQsIG9yXG4gKiAgIG51bGwgZm9yIGVtcHR5IHZhbHVlcyB3aGVuIHRoZXkgYXJlIGFsbG93ZWQuXG4gKiBAdGhyb3dzIHtWYWxpZGF0aW9uRXJyb3J9IGlmIHRoZSBpbnB1dCBpcyBpbnZhbGlkLlxuICovXG5UaW1lRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoMTkwMCwgMCwgMSwgdmFsdWUuZ2V0SG91cnMoKSwgdmFsdWUuZ2V0TWludXRlcygpLCB2YWx1ZS5nZXRTZWNvbmRzKCkpXG4gIH1cbiAgcmV0dXJuIEJhc2VUZW1wb3JhbEZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQuY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgRGF0ZSByZXByZXNlbnRpbmcgYSB0aW1lIGZyb20gdGhlIGdpdmVuIGlucHV0IGlmIGl0J3MgdmFsaWQgYmFzZWRcbiAqIG9uIHRoZSBmb3JtYXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXRcbiAqIEByZXR1cm4ge0RhdGV9XG4gKi9cblRpbWVGaWVsZC5wcm90b3R5cGUuc3RycGRhdGUgPSBmdW5jdGlvbih2YWx1ZSwgZm9ybWF0KSB7XG4gIHZhciB0ID0gdGltZS5zdHJwdGltZSh2YWx1ZSwgZm9ybWF0LCBsb2NhbGVzLmdldERlZmF1bHRMb2NhbGUoKSlcbiAgcmV0dXJuIG5ldyBEYXRlKDE5MDAsIDAsIDEsIHRbM10sIHRbNF0sIHRbNV0pXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgZGF0ZS90aW1lLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7QmFzZVRlbXBvcmFsRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRGF0ZVRpbWVGaWVsZCA9IEJhc2VUZW1wb3JhbEZpZWxkLmV4dGVuZCh7XG4gIHdpZGdldDogd2lkZ2V0cy5EYXRlVGltZUlucHV0XG4sIGlucHV0Rm9ybWF0VHlwZTogJ0RBVEVUSU1FX0lOUFVUX0ZPUk1BVFMnXG4sIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZDogJ0VudGVyIGEgdmFsaWQgZGF0ZS90aW1lLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBEYXRlVGltZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBEYXRlVGltZUZpZWxkKGt3YXJncykgfVxuICAgIEJhc2VUZW1wb3JhbEZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG4vKipcbiAqIEBwYXJhbSB7PyhzdHJpbmd8RGF0ZXxBcnJheS48c3RyaW5nPil9IHZhbHVlIHVzZXIgaW5wdXQuXG4gKiBAcmV0dXJuIHs/RGF0ZX1cbiAqIEB0aHJvd3Mge1ZhbGlkYXRpb25FcnJvcn0gaWYgdGhlIGlucHV0IGlzIGludmFsaWQuXG4gKi9cbkRhdGVUaW1lRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuICBpZiAoaXMuQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gSW5wdXQgY29tZXMgZnJvbSBhIFNwbGl0RGF0ZVRpbWVXaWRnZXQsIGZvciBleGFtcGxlLCBzbyBpdCdzIHR3b1xuICAgIC8vIGNvbXBvbmVudHM6IGRhdGUgYW5kIHRpbWUuXG4gICAgaWYgKHZhbHVlLmxlbmd0aCAhPSAyKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0VtcHR5VmFsdWUodmFsdWVbMF0pICYmIHRoaXMuaXNFbXB0eVZhbHVlKHZhbHVlWzFdKSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcgJylcbiAgfVxuICByZXR1cm4gQmFzZVRlbXBvcmFsRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdC5jYWxsKHRoaXMsIHZhbHVlKVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBtYXRjaGVzIGEgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7Q2hhckZpZWxkfVxuICogQHBhcmFtIHsoUmVnRXhwfHN0cmluZyl9IHJlZ2V4XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgUmVnZXhGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gUmVnZXhGaWVsZChyZWdleCwga3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IFJlZ2V4RmllbGQocmVnZXgsIGt3YXJncykgfVxuICAgIENoYXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICBpZiAoaXMuU3RyaW5nKHJlZ2V4KSkge1xuICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4KVxuICAgIH1cbiAgICB0aGlzLnJlZ2V4ID0gcmVnZXhcbiAgICB0aGlzLnZhbGlkYXRvcnMucHVzaCh2YWxpZGF0b3JzLlJlZ2V4VmFsaWRhdG9yKHtyZWdleDogdGhpcy5yZWdleH0pKVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBhcHBlYXJzIHRvIGJlIGEgdmFsaWQgZS1tYWlsIGFkZHJlc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtDaGFyRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRW1haWxGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuRW1haWxJbnB1dFxuLCBkZWZhdWx0VmFsaWRhdG9yczogW3ZhbGlkYXRvcnMudmFsaWRhdGVFbWFpbF1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRW1haWxGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgRW1haWxGaWVsZChrd2FyZ3MpIH1cbiAgICBDaGFyRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbkVtYWlsRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSB1dGlsLnN0cmlwKHRoaXMudG9KYXZhU2NyaXB0KHZhbHVlKSlcbiAgcmV0dXJuIENoYXJGaWVsZC5wcm90b3R5cGUuY2xlYW4uY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCB1cGxvYWRlZCBmaWxlLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRmlsZUZpZWxkID0gRmllbGQuZXh0ZW5kKHtcbiAgd2lkZ2V0OiB3aWRnZXRzLkNsZWFyYWJsZUZpbGVJbnB1dFxuLCBkZWZhdWx0RXJyb3JNZXNzYWdlczoge1xuICAgIGludmFsaWQ6ICdObyBmaWxlIHdhcyBzdWJtaXR0ZWQuIENoZWNrIHRoZSBlbmNvZGluZyB0eXBlIG9uIHRoZSBmb3JtLidcbiAgLCBtaXNzaW5nOiAnTm8gZmlsZSB3YXMgc3VibWl0dGVkLidcbiAgLCBlbXB0eTogJ1RoZSBzdWJtaXR0ZWQgZmlsZSBpcyBlbXB0eS4nXG4gICwgbWF4TGVuZ3RoOiAnRW5zdXJlIHRoaXMgZmlsZW5hbWUgaGFzIGF0IG1vc3Qge21heH0gY2hhcmFjdGVycyAoaXQgaGFzIHtsZW5ndGh9KS4nXG4gICwgY29udHJhZGljdGlvbjogJ1BsZWFzZSBlaXRoZXIgc3VibWl0IGEgZmlsZSBvciBjaGVjayB0aGUgY2xlYXIgY2hlY2tib3gsIG5vdCBib3RoLidcbiAgfVxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBGaWxlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IEZpbGVGaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHttYXhMZW5ndGg6IG51bGwsIGFsbG93RW1wdHlGaWxlOiBmYWxzZX0sIGt3YXJncylcbiAgICB0aGlzLm1heExlbmd0aCA9IGt3YXJncy5tYXhMZW5ndGhcbiAgICB0aGlzLmFsbG93RW1wdHlGaWxlID0ga3dhcmdzLmFsbG93RW1wdHlGaWxlXG4gICAgZGVsZXRlIGt3YXJncy5tYXhMZW5ndGhcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuRmlsZUZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbihkYXRhLCBpbml0aWFsKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZShkYXRhKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBpZiAoZW52LmJyb3dzZXIpIHtcbiAgICByZXR1cm4gZGF0YVxuICB9XG5cbiAgLy8gVXBsb2FkZWRGaWxlIG9iamVjdHMgc2hvdWxkIGhhdmUgbmFtZSBhbmQgc2l6ZSBhdHRyaWJ1dGVzXG4gIGlmICh0eXBlb2YgZGF0YS5uYW1lID09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBkYXRhLnNpemUgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWQsIHtjb2RlOiAnaW52YWxpZCd9KVxuICB9XG5cbiAgdmFyIGZpbGVOYW1lID0gZGF0YS5uYW1lXG4gIHZhciBmaWxlU2l6ZSA9IGRhdGEuc2l6ZVxuXG4gIGlmICh0aGlzLm1heExlbmd0aCAhPT0gbnVsbCAmJiBmaWxlTmFtZS5sZW5ndGggPiB0aGlzLm1heExlbmd0aCkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMubWF4TGVuZ3RoLCB7XG4gICAgICBjb2RlOiAnbWF4TGVuZ3RoJ1xuICAgICwgcGFyYW1zOiB7bWF4OiB0aGlzLm1heExlbmd0aCwgbGVuZ3RoOiBmaWxlTmFtZS5sZW5ndGh9XG4gICAgfSlcbiAgfVxuICBpZiAoIWZpbGVOYW1lKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkLCB7Y29kZTogJ2ludmFsaWQnfSlcbiAgfVxuICBpZiAoIXRoaXMuYWxsb3dFbXB0eUZpbGUgJiYgIWZpbGVTaXplKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5lbXB0eSwge2NvZGU6ICdlbXB0eSd9KVxuICB9XG4gIHJldHVybiBkYXRhXG59XG5cbkZpbGVGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbihkYXRhLCBpbml0aWFsKSB7XG4gIC8vIElmIHRoZSB3aWRnZXQgZ290IGNvbnRyYWRpY3RvcnkgaW5wdXRzLCB3ZSByYWlzZSBhIHZhbGlkYXRpb24gZXJyb3JcbiAgaWYgKGRhdGEgPT09IHdpZGdldHMuRklMRV9JTlBVVF9DT05UUkFESUNUSU9OKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5jb250cmFkaWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29kZTogJ2NvbnRyYWRpY3Rpb24nfSlcbiAgfVxuICAvLyBmYWxzZSBtZWFucyB0aGUgZmllbGQgdmFsdWUgc2hvdWxkIGJlIGNsZWFyZWQ7IGZ1cnRoZXIgdmFsaWRhdGlvbiBpc1xuICAvLyBub3QgbmVlZGVkLlxuICBpZiAoZGF0YSA9PT0gZmFsc2UpIHtcbiAgICBpZiAoIXRoaXMucmVxdWlyZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICAvLyBJZiB0aGUgZmllbGQgaXMgcmVxdWlyZWQsIGNsZWFyaW5nIGlzIG5vdCBwb3NzaWJsZSAodGhlIHdpZGdldFxuICAgIC8vIHNob3VsZG4ndCByZXR1cm4gZmFsc2UgZGF0YSBpbiB0aGF0IGNhc2UgYW55d2F5KS4gZmFsc2UgaXMgbm90XG4gICAgLy8gaW4gRU1QVFlfVkFMVUVTOyBpZiBhIGZhbHNlIHZhbHVlIG1ha2VzIGl0IHRoaXMgZmFyIGl0IHNob3VsZCBiZVxuICAgIC8vIHZhbGlkYXRlZCBmcm9tIGhlcmUgb24gb3V0IGFzIG51bGwgKHNvIGl0IHdpbGwgYmUgY2F1Z2h0IGJ5IHRoZVxuICAgIC8vIHJlcXVpcmVkIGNoZWNrKS5cbiAgICBkYXRhID0gbnVsbFxuICB9XG4gIGlmICghZGF0YSAmJiBpbml0aWFsKSB7XG4gICAgcmV0dXJuIGluaXRpYWxcbiAgfVxuICByZXR1cm4gRmllbGQucHJvdG90eXBlLmNsZWFuLmNhbGwodGhpcywgZGF0YSlcbn1cblxuRmlsZUZpZWxkLnByb3RvdHlwZS5ib3VuZERhdGEgPSBmdW5jdGlvbihkYXRhLCBpbml0aWFsKSB7XG4gIGlmIChkYXRhID09PSBudWxsIHx8IGRhdGEgPT09IHdpZGdldHMuRklMRV9JTlBVVF9DT05UUkFESUNUSU9OKSB7XG4gICAgcmV0dXJuIGluaXRpYWxcbiAgfVxuICByZXR1cm4gZGF0YVxufVxuXG5GaWxlRmllbGQucHJvdG90eXBlLl9oYXNDaGFuZ2VkID0gZnVuY3Rpb24oaW5pdGlhbCwgZGF0YSkge1xuICByZXR1cm4gKGRhdGEgIT09IG51bGwpXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIGEgdmFsaWQgdXBsb2FkZWQgaW1hZ2UuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBJbWFnZUZpZWxkID0gRmlsZUZpZWxkLmV4dGVuZCh7XG4gIGRlZmF1bHRFcnJvck1lc3NhZ2VzOiB7XG4gICAgaW52YWxpZEltYWdlOiAnVXBsb2FkIGEgdmFsaWQgaW1hZ2UuIFRoZSBmaWxlIHlvdSB1cGxvYWRlZCB3YXMgZWl0aGVyIG5vdCBhbiBpbWFnZSBvciBhIGNvcnJ1cHRlZCBpbWFnZS4nXG4gIH1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gSW1hZ2VGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgSW1hZ2VGaWVsZChrd2FyZ3MpIH1cbiAgICBGaWxlRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgdGhlIGZpbGUtdXBsb2FkIGZpZWxkIGRhdGEgY29udGFpbnMgYSB2YWxpZCBpbWFnZS5cbiAqL1xuSW1hZ2VGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0ID0gZnVuY3Rpb24oZGF0YSwgaW5pdGlhbCkge1xuICB2YXIgZiA9IEZpbGVGaWVsZC5wcm90b3R5cGUudG9KYXZhU2NyaXB0LmNhbGwodGhpcywgZGF0YSwgaW5pdGlhbClcbiAgaWYgKGYgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gVE9ETyBQbHVnIGluIGltYWdlIHByb2Nlc3NpbmcgY29kZSB3aGVuIHJ1bm5pbmcgb24gdGhlIHNlcnZlclxuXG4gIHJldHVybiBmXG59XG5cbkltYWdlRmllbGQucHJvdG90eXBlLndpZGdldEF0dHJzID0gZnVuY3Rpb24od2lkZ2V0KSB7XG4gIHZhciBhdHRycyA9IEZpbGVGaWVsZC5wcm90b3R5cGUud2lkZ2V0QXR0cnMuY2FsbCh0aGlzLCB3aWRnZXQpXG4gIGF0dHJzLmFjY2VwdCA9ICdpbWFnZS8qJ1xuICByZXR1cm4gYXR0cnNcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgYXBwZWFycyB0byBiZSBhIHZhbGlkIFVSTC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0NoYXJGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBVUkxGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuVVJMSW5wdXRcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSB2YWxpZCBVUkwuJ1xuICB9XG4sIGRlZmF1bHRWYWxpZGF0b3JzOiBbdmFsaWRhdG9ycy5VUkxWYWxpZGF0b3IoKV1cblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVVJMRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IFVSTEZpZWxkKGt3YXJncykgfVxuICAgIENoYXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuVVJMRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSkge1xuICAgIHZhciB1cmxGaWVsZHMgPSB1cmwucGFyc2VVcmkodmFsdWUpXG4gICAgaWYgKCF1cmxGaWVsZHMucHJvdG9jb2wpIHtcbiAgICAgIC8vIElmIG5vIFVSTCBwcm90b2NvbCBnaXZlbiwgYXNzdW1lIGh0dHA6Ly9cbiAgICAgIHVybEZpZWxkcy5wcm90b2NvbCA9ICdodHRwJ1xuICAgIH1cbiAgICBpZiAoIXVybEZpZWxkcy5wYXRoKSB7XG4gICAgICAvLyBUaGUgcGF0aCBwb3J0aW9uIG1heSBuZWVkIHRvIGJlIGFkZGVkIGJlZm9yZSBxdWVyeSBwYXJhbXNcbiAgICAgIHVybEZpZWxkcy5wYXRoID0gJy8nXG4gICAgfVxuICAgIHZhbHVlID0gdXJsLm1ha2VVcmkodXJsRmllbGRzKVxuICB9XG4gIHJldHVybiBDaGFyRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdC5jYWxsKHRoaXMsIHZhbHVlKVxufVxuXG5VUkxGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YWx1ZSA9IHV0aWwuc3RyaXAodGhpcy50b0phdmFTY3JpcHQodmFsdWUpKVxuICByZXR1cm4gQ2hhckZpZWxkLnByb3RvdHlwZS5jbGVhbi5jYWxsKHRoaXMsIHZhbHVlKVxufVxuXG4vKipcbiAqIE5vcm1hbGlzZXMgaXRzIGlucHV0IHRvIGEgQm9vbGVhbiBwcmltaXRpdmUuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBCb29sZWFuRmllbGQgPSBGaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuQ2hlY2tib3hJbnB1dFxuXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBCb29sZWFuRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IEJvb2xlYW5GaWVsZChrd2FyZ3MpIH1cbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuQm9vbGVhbkZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAvLyBFeHBsaWNpdGx5IGNoZWNrIGZvciBhICdmYWxzZScgc3RyaW5nLCB3aGljaCBpcyB3aGF0IGEgaGlkZGVuIGZpZWxkIHdpbGxcbiAgLy8gc3VibWl0IGZvciBmYWxzZS4gQWxzbyBjaGVjayBmb3IgJzAnLCBzaW5jZSB0aGlzIGlzIHdoYXQgUmFkaW9TZWxlY3Qgd2lsbFxuICAvLyBwcm92aWRlLiBCZWNhdXNlIEJvb2xlYW4oJ2FueXRoaW5nJykgPT0gdHJ1ZSwgd2UgZG9uJ3QgbmVlZCB0byBoYW5kbGUgdGhhdFxuICAvLyBleHBsaWNpdGx5LlxuICBpZiAoaXMuU3RyaW5nKHZhbHVlKSAmJiAodmFsdWUudG9Mb3dlckNhc2UoKSA9PSAnZmFsc2UnIHx8IHZhbHVlID09ICcwJykpIHtcbiAgICB2YWx1ZSA9IGZhbHNlXG4gIH1cbiAgZWxzZSB7XG4gICAgdmFsdWUgPSBCb29sZWFuKHZhbHVlKVxuICB9XG4gIHZhbHVlID0gRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdC5jYWxsKHRoaXMsIHZhbHVlKVxuICBpZiAoIXZhbHVlICYmIHRoaXMucmVxdWlyZWQpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLnJlcXVpcmVkLCB7Y29kZTogJ3JlcXVpcmVkJ30pXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbkJvb2xlYW5GaWVsZC5wcm90b3R5cGUuX2hhc0NoYW5nZWQgPSBmdW5jdGlvbihpbml0aWFsLCBkYXRhKSB7XG4gIC8vIFNvbWV0aW1lcyBkYXRhIG9yIGluaXRpYWwgY291bGQgYmUgbnVsbCBvciAnJyB3aGljaCBzaG91bGQgYmUgdGhlIHNhbWVcbiAgLy8gdGhpbmcgYXMgZmFsc2UuXG4gIGlmIChpbml0aWFsID09PSAnZmFsc2UnKSB7XG4gICAgLy8gc2hvd0hpZGRlbkluaXRpYWwgbWF5IGhhdmUgdHJhbnNmb3JtZWQgZmFsc2UgdG8gJ2ZhbHNlJ1xuICAgIGluaXRpYWwgPSBmYWxzZVxuICB9XG4gIHJldHVybiAoQm9vbGVhbihpbml0aWFsKSAhPSBCb29sZWFuKGRhdGEpKVxufVxuXG4vKipcbiAqIEEgZmllbGQgd2hvc2UgdmFsaWQgdmFsdWVzIGFyZSBudWxsLCB0cnVlIGFuZCBmYWxzZS5cbiAqIEludmFsaWQgdmFsdWVzIGFyZSBjbGVhbmVkIHRvIG51bGwuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtCb29sZWFuRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTnVsbEJvb2xlYW5GaWVsZCA9IEJvb2xlYW5GaWVsZC5leHRlbmQoe1xuICB3aWRnZXQ6IHdpZGdldHMuTnVsbEJvb2xlYW5TZWxlY3RcblxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gTnVsbEJvb2xlYW5GaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgTnVsbEJvb2xlYW5GaWVsZChrd2FyZ3MpIH1cbiAgICBCb29sZWFuRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbk51bGxCb29sZWFuRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIEV4cGxpY2l0bHkgY2hlY2tzIGZvciB0aGUgc3RyaW5nICdUcnVlJyBhbmQgJ0ZhbHNlJywgd2hpY2ggaXMgd2hhdCBhXG4gIC8vIGhpZGRlbiBmaWVsZCB3aWxsIHN1Ym1pdCBmb3IgdHJ1ZSBhbmQgZmFsc2UsIGFuZCBmb3IgJzEnIGFuZCAnMCcsIHdoaWNoXG4gIC8vIGlzIHdoYXQgYSBSYWRpb0ZpZWxkIHdpbGwgc3VibWl0LiBVbmxpa2UgdGhlIEJvb2xlYW5GaWVsZCB3ZSBhbHNvIG5lZWRcbiAgLy8gdG8gY2hlY2sgZm9yIHRydWUsIGJlY2F1c2Ugd2UgYXJlIG5vdCB1c2luZyBCb29sZWFuKCkgZnVuY3Rpb24uXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PSAnVHJ1ZScgfHwgdmFsdWUgPT0gJ3RydWUnIHx8IHZhbHVlID09ICcxJykge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgZWxzZSBpZiAodmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09ICdGYWxzZScgfHwgdmFsdWUgPT0gJ2ZhbHNlJyB8fCB2YWx1ZSA9PSAnMCcpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5OdWxsQm9vbGVhbkZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7fVxuXG5OdWxsQm9vbGVhbkZpZWxkLnByb3RvdHlwZS5faGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKGluaXRpYWwsIGRhdGEpIHtcbiAgLy8gbnVsbCAodW5rbm93bikgYW5kIGZhbHNlIChObykgYXJlIG5vdCB0aGUgc2FtZVxuICBpZiAoaW5pdGlhbCAhPT0gbnVsbCkge1xuICAgICAgaW5pdGlhbCA9IEJvb2xlYW4oaW5pdGlhbClcbiAgfVxuICBpZiAoZGF0YSAhPT0gbnVsbCkge1xuICAgICAgZGF0YSA9IEJvb2xlYW4oZGF0YSlcbiAgfVxuICByZXR1cm4gaW5pdGlhbCAhPSBkYXRhXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaXRzIGlucHV0IGlzIG9uZSBvZiBhIHZhbGlkIGxpc3Qgb2YgY2hvaWNlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENob2ljZUZpZWxkID0gRmllbGQuZXh0ZW5kKHtcbiAgd2lkZ2V0OiB3aWRnZXRzLlNlbGVjdFxuLCBkZWZhdWx0RXJyb3JNZXNzYWdlczoge1xuICAgIGludmFsaWRDaG9pY2U6ICdTZWxlY3QgYSB2YWxpZCBjaG9pY2UuIHt2YWx1ZX0gaXMgbm90IG9uZSBvZiB0aGUgYXZhaWxhYmxlIGNob2ljZXMuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIENob2ljZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBDaG9pY2VGaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtjaG9pY2VzOiBbXX0sIGt3YXJncylcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLnNldENob2ljZXMoa3dhcmdzLmNob2ljZXMpXG4gIH1cbn0pXG5cbkNob2ljZUZpZWxkLnByb3RvdHlwZS5jaG9pY2VzID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9jaG9pY2VzIH1cbkNob2ljZUZpZWxkLnByb3RvdHlwZS5zZXRDaG9pY2VzID0gZnVuY3Rpb24oY2hvaWNlcykge1xuICAvLyBTZXR0aW5nIGNob2ljZXMgYWxzbyBzZXRzIHRoZSBjaG9pY2VzIG9uIHRoZSB3aWRnZXRcbiAgdGhpcy5fY2hvaWNlcyA9IHRoaXMud2lkZ2V0LmNob2ljZXMgPSB1dGlsLm5vcm1hbGlzZUNob2ljZXMoY2hvaWNlcylcbn1cblxuQ2hvaWNlRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuICByZXR1cm4gJycrdmFsdWVcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgZ2l2ZW4gdmFsdWUgaXMgaW4gdGhpcyBmaWVsZCdzIGNob2ljZXMuXG4gKi9cbkNob2ljZUZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIEZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZS5jYWxsKHRoaXMsIHZhbHVlKVxuICBpZiAodmFsdWUgJiYgIXRoaXMudmFsaWRWYWx1ZSh2YWx1ZSkpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWRDaG9pY2UsIHtcbiAgICAgIGNvZGU6ICdpbnZhbGlkQ2hvaWNlJ1xuICAgICwgcGFyYW1zOiB7dmFsdWU6IHZhbHVlfVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBwcm92aWRlZCB2YWx1ZSBpcyBhIHZhbGlkIGNob2ljZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSB0aGUgdmFsdWUgdG8gYmUgdmFsaWRhdGVkLlxuICovXG5DaG9pY2VGaWVsZC5wcm90b3R5cGUudmFsaWRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciBjaG9pY2VzID0gdGhpcy5jaG9pY2VzKClcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaG9pY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChpcy5BcnJheShjaG9pY2VzW2ldWzFdKSkge1xuICAgICAgLy8gVGhpcyBpcyBhbiBvcHRncm91cCwgc28gbG9vayBpbnNpZGUgdGhlIGdyb3VwIGZvciBvcHRpb25zXG4gICAgICB2YXIgb3B0Z3JvdXBDaG9pY2VzID0gY2hvaWNlc1tpXVsxXVxuICAgICAgZm9yICh2YXIgaiA9IDAsIG0gPSBvcHRncm91cENob2ljZXMubGVuZ3RoOyBqIDwgbTsgaisrKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gJycrb3B0Z3JvdXBDaG9pY2VzW2pdWzBdKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gJycrY2hvaWNlc1tpXVswXSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQSBDaG9pY2VGaWVsZCB3aGljaCByZXR1cm5zIGEgdmFsdWUgY29lcmNlZCBieSBzb21lIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7Q2hvaWNlRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgVHlwZWRDaG9pY2VGaWVsZCA9IENob2ljZUZpZWxkLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBUeXBlZENob2ljZUZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBUeXBlZENob2ljZUZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgY29lcmNlOiBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbCB9LCBlbXB0eVZhbHVlOiAnJ1xuICAgIH0sIGt3YXJncylcbiAgICB0aGlzLmNvZXJjZSA9IG9iamVjdC5wb3Aoa3dhcmdzLCAnY29lcmNlJylcbiAgICB0aGlzLmVtcHR5VmFsdWUgPSBvYmplY3QucG9wKGt3YXJncywgJ2VtcHR5VmFsdWUnKVxuICAgIENob2ljZUZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG4vKipcbiAqIFZhbGlkYXRlIHRoYXQgdGhlIHZhbHVlIGNhbiBiZSBjb2VyY2VkIHRvIHRoZSByaWdodCB0eXBlIChpZiBub3QgZW1wdHkpLlxuICovXG5UeXBlZENob2ljZUZpZWxkLnByb3RvdHlwZS5fY29lcmNlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSB0aGlzLmVtcHR5VmFsdWUgfHwgdGhpcy5pc0VtcHR5VmFsdWUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1wdHlWYWx1ZVxuICB9XG4gIHRyeSB7XG4gICAgdmFsdWUgPSB0aGlzLmNvZXJjZSh2YWx1ZSlcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZENob2ljZSwge1xuICAgICAgY29kZTogJ2ludmFsaWRDaG9pY2UnXG4gICAgLCBwYXJhbXM6IHt2YWx1ZTogdmFsdWV9XG4gICAgfSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuVHlwZWRDaG9pY2VGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YWx1ZSA9IENob2ljZUZpZWxkLnByb3RvdHlwZS5jbGVhbi5jYWxsKHRoaXMsIHZhbHVlKVxuICByZXR1cm4gdGhpcy5fY29lcmNlKHZhbHVlKVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGl0cyBpbnB1dCBpcyBvbmUgb3IgbW9yZSBvZiBhIHZhbGlkIGxpc3Qgb2YgY2hvaWNlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0Nob2ljZUZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIE11bHRpcGxlQ2hvaWNlRmllbGQgPSBDaG9pY2VGaWVsZC5leHRlbmQoe1xuICBoaWRkZW5XaWRnZXQ6IHdpZGdldHMuTXVsdGlwbGVIaWRkZW5JbnB1dFxuLCB3aWRnZXQ6IHdpZGdldHMuU2VsZWN0TXVsdGlwbGVcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkQ2hvaWNlOiAnU2VsZWN0IGEgdmFsaWQgY2hvaWNlLiB7dmFsdWV9IGlzIG5vdCBvbmUgb2YgdGhlIGF2YWlsYWJsZSBjaG9pY2VzLidcbiAgLCBpbnZhbGlkTGlzdDogJ0VudGVyIGEgbGlzdCBvZiB2YWx1ZXMuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE11bHRpcGxlQ2hvaWNlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IE11bHRpcGxlQ2hvaWNlRmllbGQoa3dhcmdzKSB9XG4gICAgQ2hvaWNlRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbk11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLnRvSmF2YVNjcmlwdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gW11cbiAgfVxuICBlbHNlIGlmICghaXMuQXJyYXkodmFsdWUpKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkTGlzdCwge2NvZGU6ICdpbnZhbGlkTGlzdCd9KVxuICB9XG4gIHZhciBzdHJpbmdWYWx1ZXMgPSBbXVxuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHN0cmluZ1ZhbHVlcy5wdXNoKCcnK3ZhbHVlW2ldKVxuICB9XG4gIHJldHVybiBzdHJpbmdWYWx1ZXNcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCB0aGUgaW5wdXQgaXMgYSBsaXN0IGFuZCB0aGF0IGVhY2ggaXRlbSBpcyBpbiB0aGlzIGZpZWxkJ3NcbiAqIGNob2ljZXMuXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSB2YWx1ZSB1c2VyIGlucHV0LlxuICogQHRocm93cyB7VmFsaWRhdGlvbkVycm9yfSBpZiB0aGUgaW5wdXQgaXMgaW52YWxpZC5cbiAqL1xuTXVsdGlwbGVDaG9pY2VGaWVsZC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodGhpcy5yZXF1aXJlZCAmJiAhdmFsdWUubGVuZ3RoKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5yZXF1aXJlZCwge2NvZGU6ICdyZXF1aXJlZCd9KVxuICB9XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKCF0aGlzLnZhbGlkVmFsdWUodmFsdWVbaV0pKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWRDaG9pY2UsIHtcbiAgICAgICAgY29kZTogJ2ludmFsaWRDaG9pY2UnXG4gICAgICAsIHBhcmFtczoge3ZhbHVlOiB2YWx1ZVtpXX1cbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbk11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLl9oYXNDaGFuZ2VkID0gZnVuY3Rpb24oaW5pdGlhbCwgZGF0YSkge1xuICBpZiAoaW5pdGlhbCA9PT0gbnVsbCkge1xuICAgIGluaXRpYWwgPSBbXVxuICB9XG4gIGlmIChkYXRhID09PSBudWxsKSB7XG4gICAgZGF0YSA9IFtdXG4gIH1cbiAgaWYgKGluaXRpYWwubGVuZ3RoICE9IGRhdGEubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICB2YXIgZGF0YUxvb2t1cCA9IG9iamVjdC5sb29rdXAoZGF0YSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBpbml0aWFsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmICh0eXBlb2YgZGF0YUxvb2t1cFsnJytpbml0aWFsW2ldXSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQU11bHRpcGxlQ2hvaWNlRmllbGQgd2hpY2ggcmV0dXJucyB2YWx1ZXMgY29lcmNlZCBieSBzb21lIHByb3ZpZGVkIGZ1bmN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7TXVsdGlwbGVDaG9pY2VGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBUeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQgPSBNdWx0aXBsZUNob2ljZUZpZWxkLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBUeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZpZWxkKSkgeyByZXR1cm4gbmV3IFR5cGVkTXVsdGlwbGVDaG9pY2VGaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtcbiAgICAgIGNvZXJjZTogZnVuY3Rpb24odmFsKSB7IHJldHVybiB2YWwgfSwgZW1wdHlWYWx1ZTogW11cbiAgICB9LCBrd2FyZ3MpXG4gICAgdGhpcy5jb2VyY2UgPSBvYmplY3QucG9wKGt3YXJncywgJ2NvZXJjZScpXG4gICAgdGhpcy5lbXB0eVZhbHVlID0gb2JqZWN0LnBvcChrd2FyZ3MsICdlbXB0eVZhbHVlJylcbiAgICBNdWx0aXBsZUNob2ljZUZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG5UeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLl9jb2VyY2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodmFsdWUgPT09IHRoaXMuZW1wdHlWYWx1ZSB8fCB0aGlzLmlzRW1wdHlWYWx1ZSh2YWx1ZSkgfHxcbiAgICAgIChpcy5BcnJheSh2YWx1ZSkgJiYgIXZhbHVlLmxlbmd0aCkpIHtcbiAgICByZXR1cm4gdGhpcy5lbXB0eVZhbHVlXG4gIH1cbiAgdmFyIG5ld1ZhbHVlID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB0cnkge1xuICAgICAgbmV3VmFsdWUucHVzaCh0aGlzLmNvZXJjZSh2YWx1ZVtpXSkpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLmludmFsaWRDaG9pY2UsIHtcbiAgICAgICAgY29kZTogJ2ludmFsaWRDaG9pY2UnXG4gICAgICAsIHBhcmFtczoge3ZhbHVlOiB2YWx1ZVtpXX1cbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdWYWx1ZVxufVxuXG5UeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSBNdWx0aXBsZUNob2ljZUZpZWxkLnByb3RvdHlwZS5jbGVhbi5jYWxsKHRoaXMsIHZhbHVlKVxuICByZXR1cm4gdGhpcy5fY29lcmNlKHZhbHVlKVxufVxuXG5UeXBlZE11bHRpcGxlQ2hvaWNlRmllbGQucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlICE9PSB0aGlzLmVtcHR5VmFsdWUgfHwgKGlzLkFycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGgpKSB7XG4gICAgTXVsdGlwbGVDaG9pY2VGaWVsZC5wcm90b3R5cGUudmFsaWRhdGUuY2FsbCh0aGlzLCB2YWx1ZSlcbiAgfVxuICBlbHNlIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5yZXF1aXJlZCwge2NvZGU6ICdyZXF1aXJlZCd9KVxuICB9XG59XG5cbi8qKlxuICogQWxsb3dzIGNob29zaW5nIGZyb20gZmlsZXMgaW5zaWRlIGEgY2VydGFpbiBkaXJlY3RvcnkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtDaG9pY2VGaWVsZH1cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRmlsZVBhdGhGaWVsZCA9IENob2ljZUZpZWxkLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBGaWxlUGF0aEZpZWxkKHBhdGgsIGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBGaWxlUGF0aEZpZWxkKHBhdGgsIGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgbWF0Y2g6IG51bGwsIHJlY3Vyc2l2ZTogZmFsc2UsIHJlcXVpcmVkOiB0cnVlLCB3aWRnZXQ6IG51bGwsXG4gICAgICBsYWJlbDogbnVsbCwgaW5pdGlhbDogbnVsbCwgaGVscFRleHQ6IG51bGwsXG4gICAgICBhbGxvd0ZpbGVzOiB0cnVlLCBhbGxvd0ZvbGRlcnM6IGZhbHNlXG4gICAgfSwga3dhcmdzKVxuXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMubWF0Y2ggPSBvYmplY3QucG9wKGt3YXJncywgJ21hdGNoJylcbiAgICB0aGlzLnJlY3Vyc2l2ZSA9IG9iamVjdC5wb3Aoa3dhcmdzLCAncmVjdXJzaXZlJylcbiAgICB0aGlzLmFsbG93RmlsZXMgPSBvYmplY3QucG9wKGt3YXJncywgJ2FsbG93RmlsZXMnKVxuICAgIHRoaXMuYWxsb3dGb2xkZXJzID0gb2JqZWN0LnBvcChrd2FyZ3MsICdhbGxvd0ZvbGRlcnMnKVxuICAgIGRlbGV0ZSBrd2FyZ3MubWF0Y2hcbiAgICBkZWxldGUga3dhcmdzLnJlY3Vyc2l2ZVxuXG4gICAga3dhcmdzLmNob2ljZXMgPSBbXVxuICAgIENob2ljZUZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuXG4gICAgaWYgKHRoaXMucmVxdWlyZWQpIHtcbiAgICAgIHRoaXMuc2V0Q2hvaWNlcyhbXSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnNldENob2ljZXMoW1snJywgJy0tLS0tLS0tLSddXSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5tYXRjaFJFID0gbmV3IFJlZ0V4cCh0aGlzLm1hdGNoKVxuICAgIH1cblxuICAgIC8vIFRPRE8gUGx1ZyBpbiBmaWxlIHBhdGhzIHdoZW4gcnVubmluZyBvbiB0aGUgc2VydmVyXG5cbiAgICB0aGlzLndpZGdldC5jaG9pY2VzID0gdGhpcy5jaG9pY2VzKClcbiAgfVxufSlcblxuLyoqXG4gKiBBIEZpZWxkIHdob3NlIGNsZWFuKCkgbWV0aG9kIGNhbGxzIG11bHRpcGxlIEZpZWxkIGNsZWFuKCkgbWV0aG9kcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0ZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENvbWJvRmllbGQgPSBGaWVsZC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ29tYm9GaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgQ29tYm9GaWVsZChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtmaWVsZHM6IFtdfSwga3dhcmdzKVxuICAgIEZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICAgIC8vIFNldCByZXF1aXJlZCB0byBGYWxzZSBvbiB0aGUgaW5kaXZpZHVhbCBmaWVsZHMsIGJlY2F1c2UgdGhlIHJlcXVpcmVkXG4gICAgLy8gdmFsaWRhdGlvbiB3aWxsIGJlIGhhbmRsZWQgYnkgQ29tYm9GaWVsZCwgbm90IGJ5IHRob3NlIGluZGl2aWR1YWwgZmllbGRzLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0ga3dhcmdzLmZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGt3YXJncy5maWVsZHNbaV0ucmVxdWlyZWQgPSBmYWxzZVxuICAgIH1cbiAgICB0aGlzLmZpZWxkcyA9IGt3YXJncy5maWVsZHNcbiAgfVxufSlcblxuQ29tYm9GaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICBGaWVsZC5wcm90b3R5cGUuY2xlYW4uY2FsbCh0aGlzLCB2YWx1ZSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YWx1ZSA9IHRoaXMuZmllbGRzW2ldLmNsZWFuKHZhbHVlKVxuICB9XG4gIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIEEgRmllbGQgdGhhdCBhZ2dyZWdhdGVzIHRoZSBsb2dpYyBvZiBtdWx0aXBsZSBGaWVsZHMuXG4gKiBJdHMgY2xlYW4oKSBtZXRob2QgdGFrZXMgYSBcImRlY29tcHJlc3NlZFwiIGxpc3Qgb2YgdmFsdWVzLCB3aGljaCBhcmUgdGhlblxuICogY2xlYW5lZCBpbnRvIGEgc2luZ2xlIHZhbHVlIGFjY29yZGluZyB0byB0aGlzLmZpZWxkcy4gRWFjaCB2YWx1ZSBpbiB0aGlzXG4gKiBsaXN0IGlzIGNsZWFuZWQgYnkgdGhlIGNvcnJlc3BvbmRpbmcgZmllbGQgLS0gdGhlIGZpcnN0IHZhbHVlIGlzIGNsZWFuZWQgYnlcbiAqIHRoZSBmaXJzdCBmaWVsZCwgdGhlIHNlY29uZCB2YWx1ZSBpcyBjbGVhbmVkIGJ5IHRoZSBzZWNvbmQgZmllbGQsIGV0Yy4gT25jZVxuICogYWxsIGZpZWxkcyBhcmUgY2xlYW5lZCwgdGhlIGxpc3Qgb2YgY2xlYW4gdmFsdWVzIGlzIFwiY29tcHJlc3NlZFwiIGludG8gYVxuICogc2luZ2xlIHZhbHVlLlxuICogU3ViY2xhc3NlcyBzaG91bGQgbm90IGhhdmUgdG8gaW1wbGVtZW50IGNsZWFuKCkuIEluc3RlYWQsIHRoZXkgbXVzdFxuICogaW1wbGVtZW50IGNvbXByZXNzKCksIHdoaWNoIHRha2VzIGEgbGlzdCBvZiB2YWxpZCB2YWx1ZXMgYW5kIHJldHVybnMgYVxuICogXCJjb21wcmVzc2VkXCIgdmVyc2lvbiBvZiB0aG9zZSB2YWx1ZXMgLS0gYSBzaW5nbGUgdmFsdWUuXG4gKiBZb3UnbGwgcHJvYmFibHkgd2FudCB0byB1c2UgdGhpcyB3aXRoIE11bHRpV2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTXVsdGlWYWx1ZUZpZWxkID0gRmllbGQuZXh0ZW5kKHtcbiAgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkOiAnRW50ZXIgYSBsaXN0IG9mIHZhbHVlcy4nXG4gICwgaW5jb21wbGV0ZTogJ0VudGVyIGEgY29tcGxldGUgdmFsdWUuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE11bHRpVmFsdWVGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgTXVsdGlWYWx1ZUZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2ZpZWxkczogW119LCBrd2FyZ3MpXG4gICAgdGhpcy5yZXF1aXJlQWxsRmllbGRzID0gb2JqZWN0LnBvcChrd2FyZ3MsICdyZXF1aXJlQWxsRmllbGRzJywgdHJ1ZSlcbiAgICBGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0ga3dhcmdzLmZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBmID0ga3dhcmdzLmZpZWxkc1tpXVxuICAgICAgb2JqZWN0LnNldERlZmF1bHQoZi5lcnJvck1lc3NhZ2VzLCAnaW5jb21wbGV0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWVzc2FnZXMuaW5jb21wbGV0ZSlcbiAgICAgIGlmICh0aGlzLnJlcXVpcmVBbGxGaWVsZHMpIHtcbiAgICAgICAgLy8gU2V0IHJlcXVpcmVkIHRvIGZhbHNlIG9uIHRoZSBpbmRpdmlkdWFsIGZpZWxkcywgYmVjYXVzZSB0aGUgcmVxdWlyZWRcbiAgICAgICAgLy8gdmFsaWRhdGlvbiB3aWxsIGJlIGhhbmRsZWQgYnkgTXVsdGlWYWx1ZUZpZWxkLCBub3QgYnkgdGhvc2VcbiAgICAgICAgLy8gaW5kaXZpZHVhbCBmaWVsZHMuXG4gICAgICAgIGYucmVxdWlyZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmZpZWxkcyA9IGt3YXJncy5maWVsZHNcbiAgfVxufSlcblxuTXVsdGlWYWx1ZUZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKCkge31cblxuLyoqXG4gKiBWYWxpZGF0ZXMgZXZlcnkgdmFsdWUgaW4gdGhlIGdpdmVuIGxpc3QuIEEgdmFsdWUgaXMgdmFsaWRhdGVkIGFnYWluc3QgdGhlXG4gKiBjb3JyZXNwb25kaW5nIEZpZWxkIGluIHRoaXMuZmllbGRzLlxuICogRm9yIGV4YW1wbGUsIGlmIHRoaXMgTXVsdGlWYWx1ZUZpZWxkIHdhcyBpbnN0YW50aWF0ZWQgd2l0aFxuICoge2ZpZWxkczogW2Zvcm1zLkRhdGVGaWVsZCgpLCBmb3Jtcy5UaW1lRmllbGQoKV19LCBjbGVhbigpIHdvdWxkIGNhbGxcbiAqIERhdGVGaWVsZC5jbGVhbih2YWx1ZVswXSkgYW5kIFRpbWVGaWVsZC5jbGVhbih2YWx1ZVsxXSkuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZSB1c2VyIGlucHV0IGZvciBlYWNoIGZpZWxkLlxuICogQHJldHVybiB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgY29tcHJlc3MoKSBvbiB0aGUgY2xlYW5lZCBpbnB1dC5cbiAqIEB0aHJvd3Mge1ZhbGlkYXRpb25FcnJvcn0gaWYgdGhlIGlucHV0IGlzIGludmFsaWQuXG4gKi9cbk11bHRpVmFsdWVGaWVsZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICB2YXIgY2xlYW5EYXRhID0gW11cbiAgdmFyIGVycm9ycyA9IFtdXG5cbiAgaWYgKCF2YWx1ZSB8fCBpcy5BcnJheSh2YWx1ZSkpIHtcbiAgICB2YXIgYWxsVmFsdWVzRW1wdHkgPSB0cnVlXG4gICAgaWYgKGlzLkFycmF5KHZhbHVlKSkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKHZhbHVlW2ldKSB7XG4gICAgICAgICAgYWxsVmFsdWVzRW1wdHkgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXZhbHVlIHx8IGFsbFZhbHVlc0VtcHR5KSB7XG4gICAgICBpZiAodGhpcy5yZXF1aXJlZCkge1xuICAgICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5lcnJvck1lc3NhZ2VzLnJlcXVpcmVkLCB7Y29kZTogJ3JlcXVpcmVkJ30pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHJlc3MoW10pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZCwge2NvZGU6ICdpbnZhbGlkJ30pXG4gIH1cblxuICBmb3IgKGkgPSAwLCBsID0gdGhpcy5maWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5maWVsZHNbaV1cbiAgICB2YXIgZmllbGRWYWx1ZSA9IHZhbHVlW2ldXG4gICAgaWYgKGZpZWxkVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZmllbGRWYWx1ZSA9IG51bGxcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNFbXB0eVZhbHVlKGZpZWxkVmFsdWUpKSB7XG4gICAgICBpZiAodGhpcy5yZXF1aXJlQWxsRmllbGRzKSB7XG4gICAgICAgIC8vIFRocm93IGEgJ3JlcXVpcmVkJyBlcnJvciBpZiB0aGUgTXVsdGlWYWx1ZUZpZWxkIGlzIHJlcXVpcmVkIGFuZCBhbnlcbiAgICAgICAgLy8gZmllbGQgaXMgZW1wdHkuXG4gICAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5yZXF1aXJlZCwge2NvZGU6ICdyZXF1aXJlZCd9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChmaWVsZC5yZXF1aXJlZCkge1xuICAgICAgICAvLyBPdGhlcndpc2UsIGFkZCBhbiAnaW5jb21wbGV0ZScgZXJyb3IgdG8gdGhlIGxpc3Qgb2YgY29sbGVjdGVkIGVycm9yc1xuICAgICAgICAvLyBhbmQgc2tpcCBmaWVsZCBjbGVhbmluZywgaWYgYSByZXF1aXJlZCBmaWVsZCBpcyBlbXB0eS5cbiAgICAgICAgaWYgKGVycm9ycy5pbmRleE9mKGZpZWxkLmVycm9yTWVzc2FnZXMuaW5jb21wbGV0ZSkgPT0gLTEpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChmaWVsZC5lcnJvck1lc3NhZ2VzLmluY29tcGxldGUpXG4gICAgICAgIH1cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY2xlYW5EYXRhLnB1c2goZmllbGQuY2xlYW4oZmllbGRWYWx1ZSkpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSkgeyB0aHJvdyBlIH1cbiAgICAgIC8vIENvbGxlY3QgYWxsIHZhbGlkYXRpb24gZXJyb3JzIGluIGEgc2luZ2xlIGxpc3QsIHdoaWNoIHdlJ2xsIHRocm93IGF0XG4gICAgICAvLyB0aGUgZW5kIG9mIGNsZWFuKCksIHJhdGhlciB0aGFuIHRocm93aW5nIGEgc2luZ2xlIGV4Y2VwdGlvbiBmb3IgdGhlXG4gICAgICAvLyBmaXJzdCBlcnJvciB3ZSBlbmNvdW50ZXIuIFNraXAgZHVwbGljYXRlcy5cbiAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZS5tZXNzYWdlcygpLmZpbHRlcihmdW5jdGlvbihtKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnMuaW5kZXhPZihtKSA9PSAtMVxuICAgICAgfSkpXG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ycy5sZW5ndGggIT09IDApIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IoZXJyb3JzKVxuICB9XG5cbiAgdmFyIG91dCA9IHRoaXMuY29tcHJlc3MoY2xlYW5EYXRhKVxuICB0aGlzLnZhbGlkYXRlKG91dClcbiAgdGhpcy5ydW5WYWxpZGF0b3JzKG91dClcbiAgcmV0dXJuIG91dFxufVxuXG4vKipcbiAqIFJldHVybnMgYSBzaW5nbGUgdmFsdWUgZm9yIHRoZSBnaXZlbiBsaXN0IG9mIHZhbHVlcy4gVGhlIHZhbHVlcyBjYW4gYmVcbiAqIGFzc3VtZWQgdG8gYmUgdmFsaWQuXG4gKiBGb3IgZXhhbXBsZSwgaWYgdGhpcyBNdWx0aVZhbHVlRmllbGQgd2FzIGluc3RhbnRpYXRlZCB3aXRoXG4gKiB7ZmllbGRzOiBbZm9ybXMuRGF0ZUZpZWxkKCksIGZvcm1zLlRpbWVGaWVsZCgpXX0sIHRoaXMgbWlnaHQgcmV0dXJuIGEgRGF0ZVxuICogb2JqZWN0IGNyZWF0ZWQgYnkgY29tYmluaW5nIHRoZSBkYXRlIGFuZCB0aW1lIGluIGRhdGFMaXN0LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YUxpc3RcbiAqIEBhYnN0cmFjdFxuICovXG5NdWx0aVZhbHVlRmllbGQucHJvdG90eXBlLmNvbXByZXNzID0gZnVuY3Rpb24oZGF0YUxpc3QpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdTdWJjbGFzc2VzIG11c3QgaW1wbGVtZW50IHRoaXMgbWV0aG9kLicpXG59XG5cbk11bHRpVmFsdWVGaWVsZC5wcm90b3R5cGUuX2hhc0NoYW5nZWQgPSBmdW5jdGlvbihpbml0aWFsLCBkYXRhKSB7XG4gIGlmIChpbml0aWFsID09PSBudWxsKSB7XG4gICAgaW5pdGlhbCA9IFtdXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaW5pdGlhbC5wdXNoKCcnKVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICghKGlzLkFycmF5KGluaXRpYWwpKSkge1xuICAgIGluaXRpYWwgPSB0aGlzLndpZGdldC5kZWNvbXByZXNzKGluaXRpYWwpXG4gIH1cblxuICBmb3IgKGkgPSAwLCBsID0gdGhpcy5maWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuZmllbGRzW2ldLl9oYXNDaGFuZ2VkKGluaXRpYWxbaV0sIGRhdGFbaV0pKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBBIE11bHRpVmFsdWVGaWVsZCBjb25zaXN0aW5nIG9mIGEgRGF0ZUZpZWxkIGFuZCBhIFRpbWVGaWVsZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge011bHRpVmFsdWVGaWVsZH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBTcGxpdERhdGVUaW1lRmllbGQgPSBNdWx0aVZhbHVlRmllbGQuZXh0ZW5kKHtcbiAgaGlkZGVuV2lkZ2V0OiB3aWRnZXRzLlNwbGl0SGlkZGVuRGF0ZVRpbWVXaWRnZXRcbiwgd2lkZ2V0OiB3aWRnZXRzLlNwbGl0RGF0ZVRpbWVXaWRnZXRcbiwgZGVmYXVsdEVycm9yTWVzc2FnZXM6IHtcbiAgICBpbnZhbGlkRGF0ZTogJ0VudGVyIGEgdmFsaWQgZGF0ZS4nXG4gICwgaW52YWxpZFRpbWU6ICdFbnRlciBhIHZhbGlkIHRpbWUuJ1xuICB9XG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFNwbGl0RGF0ZVRpbWVGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgU3BsaXREYXRlVGltZUZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgaW5wdXREYXRlRm9ybWF0czogbnVsbCwgaW5wdXRUaW1lRm9ybWF0czogbnVsbFxuICAgIH0sIGt3YXJncylcbiAgICB2YXIgZXJyb3JzID0gb2JqZWN0LmV4dGVuZCh7fSwgdGhpcy5kZWZhdWx0RXJyb3JNZXNzYWdlcylcbiAgICBpZiAodHlwZW9mIGt3YXJncy5lcnJvck1lc3NhZ2VzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBvYmplY3QuZXh0ZW5kKGVycm9ycywga3dhcmdzLmVycm9yTWVzc2FnZXMpXG4gICAgfVxuICAgIGt3YXJncy5maWVsZHMgPSBbXG4gICAgICBEYXRlRmllbGQoe2lucHV0Rm9ybWF0czoga3dhcmdzLmlucHV0RGF0ZUZvcm1hdHMsXG4gICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZXM6IHtpbnZhbGlkOiBlcnJvcnMuaW52YWxpZERhdGV9fSlcbiAgICAsIFRpbWVGaWVsZCh7aW5wdXRGb3JtYXRzOiBrd2FyZ3MuaW5wdXRUaW1lRm9ybWF0cyxcbiAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlczoge2ludmFsaWQ6IGVycm9ycy5pbnZhbGlkVGltZX19KVxuICAgIF1cbiAgICBNdWx0aVZhbHVlRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQsIGlmIGdpdmVuLCBpdHMgaW5wdXQgZG9lcyBub3QgY29udGFpbiBlbXB0eSB2YWx1ZXMuXG4gKiBAcGFyYW0gez9BcnJheS48RGF0ZT59IGRhdGFMaXN0IGEgdHdvLWl0ZW0gbGlzdCBjb25zaXN0aW5nIG9mIHR3byBEYXRlXG4gKiAgIG9iamVjdHMsIHRoZSBmaXJzdCBvZiB3aGljaCByZXByZXNlbnRzIGEgZGF0ZSwgdGhlIHNlY29uZCBhIHRpbWUuXG4gKiBAcmV0dXJuIHs/RGF0ZX0gYSBEYXJlIHJlcHJlc2VudGluZyB0aGUgZ2l2ZW4gZGF0ZSBhbmQgdGltZSwgb3IgbnVsbCBmb3JcbiAqICAgZW1wdHkgdmFsdWVzLlxuICovXG5TcGxpdERhdGVUaW1lRmllbGQucHJvdG90eXBlLmNvbXByZXNzID0gZnVuY3Rpb24oZGF0YUxpc3QpIHtcbiAgaWYgKGlzLkFycmF5KGRhdGFMaXN0KSAmJiBkYXRhTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGQgPSBkYXRhTGlzdFswXVxuICAgIHZhciB0ID0gZGF0YUxpc3RbMV1cbiAgICAvLyBSYWlzZSBhIHZhbGlkYXRpb24gZXJyb3IgaWYgZGF0ZSBvciB0aW1lIGlzIGVtcHR5IChwb3NzaWJsZSBpZlxuICAgIC8vIFNwbGl0RGF0ZVRpbWVGaWVsZCBoYXMgcmVxdWlyZWQgPT0gZmFsc2UpLlxuICAgIGlmICh0aGlzLmlzRW1wdHlWYWx1ZShkKSkge1xuICAgICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKHRoaXMuZXJyb3JNZXNzYWdlcy5pbnZhbGlkRGF0ZSwge2NvZGU6ICdpbnZhbGlkRGF0ZSd9KVxuICAgIH1cbiAgICBpZiAodGhpcy5pc0VtcHR5VmFsdWUodCkpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLmVycm9yTWVzc2FnZXMuaW52YWxpZFRpbWUsIHtjb2RlOiAnaW52YWxpZFRpbWUnfSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgZC5nZXRNb250aCgpLCBkLmdldERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgdC5nZXRIb3VycygpLCB0LmdldE1pbnV0ZXMoKSwgdC5nZXRTZWNvbmRzKCkpXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBJUHY0IGFkZHJlc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtDaGFyRmllbGR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICogQGRlcHJlY2F0ZWQgaW4gZmF2b3VyIG9mIEdlbmVyaWNJUEFkZHJlc3NGaWVsZFxuICovXG52YXIgSVBBZGRyZXNzRmllbGQgPSBDaGFyRmllbGQuZXh0ZW5kKHtcbiAgZGVmYXVsdFZhbGlkYXRvcnM6IFt2YWxpZGF0b3JzLnZhbGlkYXRlSVB2NEFkZHJlc3NdXG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIElQQWRkcmVzc0ZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBJUEFkZHJlc3NGaWVsZChrd2FyZ3MpIH1cbiAgICBDaGFyRmllbGQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbnZhciBHZW5lcmljSVBBZGRyZXNzRmllbGQgPSBDaGFyRmllbGQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEdlbmVyaWNJUEFkZHJlc3NGaWVsZChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRmllbGQpKSB7IHJldHVybiBuZXcgR2VuZXJpY0lQQWRkcmVzc0ZpZWxkKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe3Byb3RvY29sOiAnYm90aCcsIHVucGFja0lQdjQ6IGZhbHNlfSwga3dhcmdzKVxuICAgIHRoaXMudW5wYWNrSVB2NCA9IGt3YXJncy51bnBhY2tJUHY0XG4gICAgdGhpcy5kZWZhdWx0VmFsaWRhdG9ycyA9XG4gICAgICB2YWxpZGF0b3JzLmlwQWRkcmVzc1ZhbGlkYXRvcnMoa3dhcmdzLnByb3RvY29sLCBrd2FyZ3MudW5wYWNrSVB2NCkudmFsaWRhdG9yc1xuICAgIENoYXJGaWVsZC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuR2VuZXJpY0lQQWRkcmVzc0ZpZWxkLnByb3RvdHlwZS50b0phdmFTY3JpcHQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgaWYgKHZhbHVlICYmIHZhbHVlLmluZGV4T2YoJzonKSAhPSAtMSkge1xuICAgIHJldHVybiBjbGVhbklQdjZBZGRyZXNzKHZhbHVlLCB7dW5wYWNrSVB2NDogdGhpcy51bnBhY2tJUHY0fSlcbiAgfVxuICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpdHMgaW5wdXQgaXMgYSB2YWxpZCBzbHVnLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7Q2hhckZpZWxkfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFNsdWdGaWVsZCA9IENoYXJGaWVsZC5leHRlbmQoe1xuICBkZWZhdWx0VmFsaWRhdG9yczogW3ZhbGlkYXRvcnMudmFsaWRhdGVTbHVnXVxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU2x1Z0ZpZWxkKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBGaWVsZCkpIHsgcmV0dXJuIG5ldyBTbHVnRmllbGQoa3dhcmdzKSB9XG4gICAgQ2hhckZpZWxkLmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG5TbHVnRmllbGQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFsdWUgPSB1dGlsLnN0cmlwKHRoaXMudG9KYXZhU2NyaXB0KHZhbHVlKSlcbiAgcmV0dXJuIENoYXJGaWVsZC5wcm90b3R5cGUuY2xlYW4uY2FsbCh0aGlzLCB2YWx1ZSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEZpZWxkOiBGaWVsZFxuLCBDaGFyRmllbGQ6IENoYXJGaWVsZFxuLCBJbnRlZ2VyRmllbGQ6IEludGVnZXJGaWVsZFxuLCBGbG9hdEZpZWxkOiBGbG9hdEZpZWxkXG4sIERlY2ltYWxGaWVsZDogRGVjaW1hbEZpZWxkXG4sIEJhc2VUZW1wb3JhbEZpZWxkOiBCYXNlVGVtcG9yYWxGaWVsZFxuLCBEYXRlRmllbGQ6IERhdGVGaWVsZFxuLCBUaW1lRmllbGQ6IFRpbWVGaWVsZFxuLCBEYXRlVGltZUZpZWxkOiBEYXRlVGltZUZpZWxkXG4sIFJlZ2V4RmllbGQ6IFJlZ2V4RmllbGRcbiwgRW1haWxGaWVsZDogRW1haWxGaWVsZFxuLCBGaWxlRmllbGQ6IEZpbGVGaWVsZFxuLCBJbWFnZUZpZWxkOiBJbWFnZUZpZWxkXG4sIFVSTEZpZWxkOiBVUkxGaWVsZFxuLCBCb29sZWFuRmllbGQ6IEJvb2xlYW5GaWVsZFxuLCBOdWxsQm9vbGVhbkZpZWxkOiBOdWxsQm9vbGVhbkZpZWxkXG4sIENob2ljZUZpZWxkOiBDaG9pY2VGaWVsZFxuLCBUeXBlZENob2ljZUZpZWxkOiBUeXBlZENob2ljZUZpZWxkXG4sIE11bHRpcGxlQ2hvaWNlRmllbGQ6IE11bHRpcGxlQ2hvaWNlRmllbGRcbiwgVHlwZWRNdWx0aXBsZUNob2ljZUZpZWxkOiBUeXBlZE11bHRpcGxlQ2hvaWNlRmllbGRcbiwgRmlsZVBhdGhGaWVsZDogRmlsZVBhdGhGaWVsZFxuLCBDb21ib0ZpZWxkOiBDb21ib0ZpZWxkXG4sIE11bHRpVmFsdWVGaWVsZDogTXVsdGlWYWx1ZUZpZWxkXG4sIFNwbGl0RGF0ZVRpbWVGaWVsZDogU3BsaXREYXRlVGltZUZpZWxkXG4sIElQQWRkcmVzc0ZpZWxkOiBJUEFkZHJlc3NGaWVsZFxuLCBHZW5lcmljSVBBZGRyZXNzRmllbGQ6IEdlbmVyaWNJUEFkZHJlc3NGaWVsZFxuLCBTbHVnRmllbGQ6IFNsdWdGaWVsZFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcblxudmFyIGxvY2FsZXMgPSByZXF1aXJlKCcuL2xvY2FsZXMnKVxuXG4vKipcbiAqIFN0YW5kYXJkIGlucHV0IGZvcm1hdHMgd2hpY2ggd2lsbCBhbHdheXMgYmUgYWNjZXB0ZWQuXG4gKi9cbnZhciBJU09fSU5QVVRfRk9STUFUUyA9IHtcbiAgJ0RBVEVfSU5QVVRfRk9STUFUUyc6IFsnJVktJW0tJWQnXVxuLCAnVElNRV9JTlBVVF9GT1JNQVRTJzogWyclSDolTTolUycsICclSDolTSddXG4sICdEQVRFVElNRV9JTlBVVF9GT1JNQVRTJzogW1xuICAgICclWS0lbS0lZCAlSDolTTolUydcbiAgLCAnJVktJW0tJWQgJUg6JU0nXG4gICwgJyVZLSVtLSVkJ1xuICBdXG59XG5cbnZhciBmb3JtYXRDYWNoZSA9IHt9XG5cbi8qKlxuICogR2V0cyBhbGwgYWNjZXB0YWJsZSBmb3JtYXRzIG9mIGEgY2VydGFpbiB0eXBlIChlLmcuIERBVEVfSU5QVVRfRk9STUFUUykgZm9yIGFcbiAqIHBhcnRpY3VsYXIgbGFuZ3VhZ2UgY29kZS4gQWxsIGRhdGUvdGltZSBmb3JtYXRzIHdpbGwgaGF2ZSB0aGUgYXBwbGljYWJsZSBJU09cbiAqIGZvcm1hdHMgYWRkZWQgYXMgbG93ZXN0LXByZWNlZGVuY2UuXG4gKiBJZiBhbiB1bmtub3duIGxhbmd1YWdlIGNvZGUgaXMgZ2l2ZW4sIHRoZSBkZWZhdWx0IGxvY2FsZSdzIGZvcm1hdHMgd2lsbCBiZVxuICogdXNlZCBpbnN0ZWFkLlxuICogSWYgdGhlIGxvY2FsZSBkb2Vzbid0IGhhdmUgY29uZmlndXJhdGlvbiBmb3IgdGhlIGZvcm1hdCB0eXBlLCBvbmx5IHRoZSBJU09cbiAqIGZvcm1hdHMgd2lsbCBiZSByZXR1cm5lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXRUeXBlXG4gKiBAcGFyYW0ge3N0cmluZz19IGxhbmcgbGFuZ3VhZ2UgY29kZSAtIGlmIG5vdCBnaXZlbiwgdGhlIGRlZmF1bHQgbG9jYWxlJ3NcbiAqICAgZm9ybWF0cyB3aWxsIGJlIHJldHVybmVkLlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IGEgbGlzdCBvZiBmb3JtYXRzXG4gKi9cbmZ1bmN0aW9uIGdldEZvcm1hdChmb3JtYXRUeXBlLCBsYW5nKSB7XG4gIGlmICghbGFuZykge1xuICAgIGxhbmcgPSBsb2NhbGVzLmdldERlZmF1bHRMb2NhbGUoKVxuICB9XG4gIHZhciBjYWNoZUtleSA9IGZvcm1hdFR5cGUgKyAnOicgKyBsYW5nXG4gIGlmICghb2JqZWN0Lmhhc093bihmb3JtYXRDYWNoZSwgY2FjaGVLZXkpKSB7XG4gICAgdmFyIGxhbmdMb2NhbGVzID0gbG9jYWxlcy5nZXRMb2NhbGVzKGxhbmcpXG4gICAgdmFyIGxvY2FsZUZvcm1hdHMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGFuZ0xvY2FsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgbG9jYWxlID0gbGFuZ0xvY2FsZXNbaV1cbiAgICAgIGlmIChvYmplY3QuaGFzT3duKGxvY2FsZSwgZm9ybWF0VHlwZSkpIHtcbiAgICAgICAgLy8gQ29weSBsb2NhbGUtc3BlY2lmaWMgZm9ybWF0cywgYXMgd2UgbWF5IGJlIGFkZGluZyB0byB0aGVtXG4gICAgICAgIGxvY2FsZUZvcm1hdHMgPSBsb2NhbGVbZm9ybWF0VHlwZV0uc2xpY2UoKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2JqZWN0Lmhhc093bihJU09fSU5QVVRfRk9STUFUUywgZm9ybWF0VHlwZSkpIHtcbiAgICAgIHZhciBpc29Gb3JtYXRzID0gSVNPX0lOUFVUX0ZPUk1BVFNbZm9ybWF0VHlwZV1cbiAgICAgIGZvciAodmFyIGogPSAwLCBtID0gaXNvRm9ybWF0cy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgICAgdmFyIGlzb0Zvcm1hdCA9IGlzb0Zvcm1hdHNbal1cbiAgICAgICAgaWYgKGxvY2FsZUZvcm1hdHMuaW5kZXhPZihpc29Gb3JtYXQpID09IC0xKSB7XG4gICAgICAgICAgbG9jYWxlRm9ybWF0cy5wdXNoKGlzb0Zvcm1hdClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3JtYXRDYWNoZVtjYWNoZUtleV0gPSBsb2NhbGVGb3JtYXRzXG4gIH1cbiAgcmV0dXJuIGZvcm1hdENhY2hlW2NhY2hlS2V5XVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Rm9ybWF0OiBnZXRGb3JtYXRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgY29weSA9IHJlcXVpcmUoJ2lzb21vcnBoL2NvcHknKVxudmFyIGlzID0gcmVxdWlyZSgnaXNvbW9ycGgvaXMnKVxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5SZWFjdCA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuUmVhY3QgOiBudWxsKVxudmFyIHZhbGlkYXRvcnMgPSByZXF1aXJlKCd2YWxpZGF0b3JzJylcblxudmFyIGZpZWxkcyA9IHJlcXVpcmUoJy4vZmllbGRzJylcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJylcbnZhciBCb3VuZEZpZWxkID0gcmVxdWlyZSgnLi9Cb3VuZEZpZWxkJylcbnZhciBFcnJvckxpc3QgPSByZXF1aXJlKCcuL0Vycm9yTGlzdCcpXG52YXIgRXJyb3JPYmplY3QgPSByZXF1aXJlKCcuL0Vycm9yT2JqZWN0JylcblxudmFyIEZpZWxkID0gZmllbGRzLkZpZWxkXG52YXIgRmlsZUZpZWxkID0gZmllbGRzLkZpbGVGaWVsZFxudmFyIFZhbGlkYXRpb25FcnJvciA9IHZhbGlkYXRvcnMuVmFsaWRhdGlvbkVycm9yXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxudmFyIHNlbnRpbmVsID0ge31cblxuLyoqIFByb3BlcnR5IHVuZGVyIHdoaWNoIG5vbi1maWVsZC1zcGVjaWZpYyBlcnJvcnMgYXJlIHN0b3JlZC4gKi9cbnZhciBOT05fRklFTERfRVJST1JTID0gJ19fYWxsX18nXG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZmllbGQncyB2aWV3IG9mIHJhdyBpbnB1dCBkYXRhICh2aWEgaXRzIFdpZGdldCkgaGFzIGNoYW5nZWQuXG4gKi9cbmZ1bmN0aW9uIGZpZWxkRGF0YUhhc0NoYW5nZWQocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgaWYgKGlzLkFycmF5KHByZXZpb3VzKSAmJiBpcy5BcnJheShjdXJyZW50KSkge1xuICAgIGlmIChwcmV2aW91cy5sZW5ndGggIT0gY3VycmVudC5sZW5ndGgpIHsgcmV0dXJuIHRydWUgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcHJldmlvdXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAocHJldmlvdXNbaV0gIT0gY3VycmVudFtpXSkgeyByZXR1cm4gdHJ1ZSB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBwcmV2aW91cyAhPSBjdXJyZW50XG59XG5cbmlmICgncHJvZHVjdGlvbicgIT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICB2YXIgd2FybmVkT25JbXBsaWVkVmFsaWRhdGVBdXRvID0gZmFsc2Vcbn1cblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgRmllbGRzIHRoYXQga25vd3MgaG93IHRvIHZhbGlkYXRlIGFuZCBkaXNwbGF5IGl0c2VsZi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj59IGt3YXJncyBmb3JtIG9wdGlvbnMuXG4gKi9cbnZhciBCYXNlRm9ybSA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQmFzZUZvcm0oa3dhcmdzKSB7XG4gICAgLy8gVE9ETyBQZXJmb3JtIFByb3BUeXBlIGNoZWNrcyBvbiBrd2FyZ3MgaW4gZGV2ZWxvcG1lbnQgbW9kZVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgZGF0YTogbnVsbCwgZmlsZXM6IG51bGwsIGF1dG9JZDogJ2lkX3tuYW1lfScsIHByZWZpeDogbnVsbCxcbiAgICAgIGluaXRpYWw6IG51bGwsIGVycm9yQ29uc3RydWN0b3I6IEVycm9yTGlzdCwgbGFiZWxTdWZmaXg6ICc6JyxcbiAgICAgIGVtcHR5UGVybWl0dGVkOiBmYWxzZSwgdmFsaWRhdGlvbjogbnVsbCwgY29udHJvbGxlZDogZmFsc2UsXG4gICAgICBvbkNoYW5nZTogbnVsbFxuICAgIH0sIGt3YXJncylcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IChrd2FyZ3MuZGF0YSA9PT0gbnVsbCAmJiBrd2FyZ3MuZmlsZXMgPT09IG51bGwpXG4gICAgdGhpcy5kYXRhID0ga3dhcmdzLmRhdGEgfHwge31cbiAgICB0aGlzLmZpbGVzID0ga3dhcmdzLmZpbGVzIHx8IHt9XG4gICAgdGhpcy5hdXRvSWQgPSBrd2FyZ3MuYXV0b0lkXG4gICAgdGhpcy5wcmVmaXggPSBrd2FyZ3MucHJlZml4XG4gICAgdGhpcy5pbml0aWFsID0ga3dhcmdzLmluaXRpYWwgfHwge31cbiAgICB0aGlzLmNsZWFuZWREYXRhID0ge31cbiAgICB0aGlzLmVycm9yQ29uc3RydWN0b3IgPSBrd2FyZ3MuZXJyb3JDb25zdHJ1Y3RvclxuICAgIHRoaXMubGFiZWxTdWZmaXggPSBrd2FyZ3MubGFiZWxTdWZmaXhcbiAgICB0aGlzLmVtcHR5UGVybWl0dGVkID0ga3dhcmdzLmVtcHR5UGVybWl0dGVkXG4gICAgdGhpcy5jb250cm9sbGVkID0ga3dhcmdzLmNvbnRyb2xsZWRcbiAgICB0aGlzLm9uQ2hhbmdlID0ga3dhcmdzLm9uQ2hhbmdlXG5cbiAgICAvLyBBdXRvIHZhbGlkYXRpb24gaXMgaW1wbGllZCB3aGVuIG9uQ2hhbmdlIGlzIHBhc3NlZFxuICAgIGlmIChpcy5GdW5jdGlvbihrd2FyZ3Mub25DaGFuZ2UpKSB7XG4gICAgICBpZiAoJ3Byb2R1Y3Rpb24nICE9PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICAgICAgaWYgKCF3YXJuZWRPbkltcGxpZWRWYWxpZGF0ZUF1dG8gJiYga3dhcmdzLnZhbGlkYXRpb24gPT09ICdhdXRvJykge1xuICAgICAgICAgIHV0aWwuaW5mbygnUGFzc2luZyBvbkNoYW5nZSB0byBhIEZvcm0gb3IgRm9ybVNldCBjb25zdHJ1Y3RvciBhbHNvICcgK1xuICAgICAgICAgICAgICAgICAgICBcImltcGxpZXMgdmFsaWRhdGlvbjogJ2F1dG8nIGJ5IGRlZmF1bHQgLSB5b3UgZG9uJ3QgaGF2ZSBcIiArXG4gICAgICAgICAgICAgICAgICAgICd0byBzZXQgaXQgbWFudWFsbHkuJylcbiAgICAgICAgICB3YXJuZWRPbkltcGxpZWRWYWxpZGF0ZUF1dG8gPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChrd2FyZ3MudmFsaWRhdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICBrd2FyZ3MudmFsaWRhdGlvbiA9ICdhdXRvJ1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnZhbGlkYXRpb24gPSB1dGlsLm5vcm1hbGlzZVZhbGlkYXRpb24oa3dhcmdzLnZhbGlkYXRpb24gfHwgJ21hbnVhbCcpXG5cbiAgICB0aGlzLl9lcnJvcnMgPSBudWxsXG5cbiAgICAvLyBDYW5jZWxsYWJsZSBkZWJvdW5jZWQgZnVuY3Rpb25zIGZvciBkZWxheWVkIGV2ZW50IHZhbGlkYXRpb25cbiAgICB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uID0ge31cbiAgICAvLyBJbnB1dCBkYXRhIGFzIGl0IHdhcyBsYXN0IHRpbWUgdmFsaWRhdGlvbiB3YXMgcGVyZm9ybWVkIG9uIGEgZmllbGRcbiAgICB0aGlzLl9sYXN0VmFsaWRhdGVkRGF0YSA9IHt9XG4gICAgLy8gQ2FjaGVkIHJlc3VsdCBvZiB0aGUgbGFzdCBjYWxsIHRvIGhhc0NoYW5nZWQoKVxuICAgIHRoaXMuX2xhc3RIYXNDaGFuZ2VkID0gbnVsbFxuXG4gICAgLy8gTG9va3VwIGZvciBuYW1lcyBvZiBmaWVsZHMgcGVuZGluZyB2YWxpZGF0aW9uXG4gICAgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24gPSB7fVxuICAgIC8vIENhbmNlbGxhYmxlIGNhbGxiYWNrcyBmb3IgcGVuZGluZyBhc3luYyB2YWxpZGF0aW9uXG4gICAgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbiA9IHt9XG4gICAgLy8gTG9va3VwIGZvciBuYW1lcyBvZiBmaWVsZHMgcGVuZGluZyB2YWxpZGF0aW9uIHdoaWNoIGNsZWFuKCkgZGVwZW5kcyBvblxuICAgIHRoaXMuX3J1bkNsZWFuQWZ0ZXIgPSB7fVxuICAgIC8vIENhbGxiYWNrIHRvIGJlIHJ1biB0aGUgbmV4dCB0aW1lIHZhbGlkYXRpb24gZmluaXNoZXNcbiAgICB0aGlzLl9vblZhbGlkYXRlID0gbnVsbFxuXG4gICAgLy8gVGhlIGJhc2VGaWVsZHMgYXR0cmlidXRlIGlzIHRoZSAqcHJvdG90eXBlLXdpZGUqIGRlZmluaXRpb24gb2YgZmllbGRzLlxuICAgIC8vIEJlY2F1c2UgYSBwYXJ0aWN1bGFyICppbnN0YW5jZSogbWlnaHQgd2FudCB0byBhbHRlciB0aGlzLmZpZWxkcywgd2VcbiAgICAvLyBjcmVhdGUgdGhpcy5maWVsZHMgaGVyZSBieSBkZWVwIGNvcHlpbmcgYmFzZUZpZWxkcy4gSW5zdGFuY2VzIHNob3VsZFxuICAgIC8vIGFsd2F5cyBtb2RpZnkgdGhpcy5maWVsZHM7IHRoZXkgc2hvdWxkIG5vdCBtb2RpZnkgYmFzZUZpZWxkcy5cbiAgICB0aGlzLmZpZWxkcyA9IGNvcHkuZGVlcENvcHkodGhpcy5iYXNlRmllbGRzKVxuXG4gICAgaWYgKCdwcm9kdWN0aW9uJyAhPT0gXCJkZXZlbG9wbWVudFwiKSB7XG4gICAgICAvLyBOb3cgdGhhdCBmb3JtLmZpZWxkcyBleGlzdHMsIHdlIGNhbiBjaGVjayBpZiB0aGVyZSdzIGFueSBjb25maWd1cmF0aW9uXG4gICAgICAvLyB3aGljaCAqbmVlZHMqIG9uQ2hhbmdlIG9uIHRoZSBmb3JtIG9yIGl0cyBmaWVsZHMuXG4gICAgICBpZiAoIWlzLkZ1bmN0aW9uKGt3YXJncy5vbkNoYW5nZSkgJiYgdGhpcy5fbmVlZHNPbkNoYW5nZSgpKSB7XG4gICAgICAgIHV0aWwud2FybmluZyhcIllvdSBkaWRuJ3QgcHJvdmlkZSBhbiBvbkNoYW5nZSBjYWxsYmFjayBmb3IgYSBcIiArXG4gICAgICAgICAgICAgICAgICAgICB0aGlzLl9mb3JtTmFtZSgpICsgJyB3aGljaCBoYXMgY29udHJvbGxlZCBmaWVsZHMuIFRoaXMgJyArXG4gICAgICAgICAgICAgICAgICAgICAnd2lsbCByZXN1bHQgaW4gcmVhZC1vbmx5IGZpZWxkcy4nKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvcHkgaW5pdGlhbCB2YWx1ZXMgdG8gdGhlIGRhdGEgb2JqZWN0LCBhcyBpdCByZXByZXNlbnRzIGZvcm0gaW5wdXQgLVxuICAgIC8vIGxpdGVyYWxseSBzbyBpbiB0aGUgY2FzZSBvZiBjb250cm9sbGVkIGNvbXBvbmVudHMgb25jZSB3ZSBzdGFydCB0YWtpbmdcbiAgICAvLyBzb21lIGRhdGEgYW5kIGlzSW5pdGlhbFJlbmRlciBmbGlwcyB0byBmYWxzZS5cbiAgICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICAgIHRoaXMuX2NvcHlJbml0aWFsVG9EYXRhKClcbiAgICB9XG4gIH1cbn0pXG5cbi8qKlxuICogQ2FsbHMgdGhlIG9uQ2hhbmdlIGZ1bmN0aW9uIGlmIGl0J3MgYmVlbiBwcm92aWRlZC4gVGhpcyBtZXRob2Qgd2lsbCBiZSBjYWxsZWRcbiAqIGV2ZXJ5IHRpbWUgdGhlIGZvcm0gbWFrZXMgYSBjaGFuZ2UgdG8gaXRzIHN0YXRlIHdoaWNoIHJlcXVpcmVzIHJlZGlzcGxheS5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9zdGF0ZUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHR5cGVvZiB0aGlzLm9uQ2hhbmdlID09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLm9uQ2hhbmdlKClcbiAgfVxufVxuXG4vKipcbiAqIENvcGllcyBpbml0aWFsIGRhdGEgdG8gdGhlIGlucHV0IGRhdGEgb2JqZWN0LCBhcyBpdCByZXByZXNlbnRzIGZvcm0gaW5wdXQgLVxuICogd2hlbiB1c2luZyBjb250cm9sbGVkIGNvbXBvbmVudHMgb25jZSB3ZSBzdGFydCB0YWtpbmcgc29tZSBkYXRhLFxuICogaXNJbml0aWFsUmVuZGVyIGZsaXBzIHRvIGZhbHNlIGFuZCB0aGlzLmRhdGEgaXMgdXNlZCBmb3IgcmVuZGVyaW5nIHdpZGdldHMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fY29weUluaXRpYWxUb0RhdGEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGluaXRpYWxEYXRhID0gb2JqZWN0LmV4dGVuZCh0aGlzLl9maWVsZEluaXRpYWxEYXRhKCksIHRoaXMuaW5pdGlhbClcbiAgdmFyIGluaXRpYWxGaWVsZE5hbWVzID0gT2JqZWN0LmtleXMoaW5pdGlhbERhdGEpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaW5pdGlhbEZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGZpZWxkTmFtZSA9IGluaXRpYWxGaWVsZE5hbWVzW2ldXG4gICAgaWYgKHR5cGVvZiB0aGlzLmZpZWxkc1tmaWVsZE5hbWVdID09ICd1bmRlZmluZWQnKSB7IGNvbnRpbnVlIH1cbiAgICAvLyBEb24ndCBjb3B5IGluaXRpYWwgdG8gaW5wdXQgZGF0YSBmb3IgZmllbGRzIHdoaWNoIGNhbid0IGhhdmUgdGhlXG4gICAgLy8gaW5pdGlhbCBkYXRhIHNldCBhcyB0aGVpciBjdXJyZW50IHZhbHVlLlxuICAgIGlmICghdGhpcy5maWVsZHNbZmllbGROYW1lXS53aWRnZXQuaXNWYWx1ZVNldHRhYmxlKSB7IGNvbnRpbnVlIH1cbiAgICB0aGlzLmRhdGFbdGhpcy5hZGRQcmVmaXgoZmllbGROYW1lKV0gPSBpbml0aWFsRGF0YVtmaWVsZE5hbWVdXG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIGluaXRpYWwgZGF0YSBjb25maWd1cmVkIGluIHRoaXMgZm9ybSdzIGZpZWxkcy5cbiAqIEByZXR1cm4ge09iamVjdC48c3RyaW5nLCo+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2ZpZWxkSW5pdGlhbERhdGEgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZpZWxkSW5pdGlhbCA9IHt9XG4gIHZhciBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy5maWVsZHMpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZmllbGROYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgZmllbGROYW1lID0gZmllbGROYW1lc1tpXVxuICAgIHZhciBpbml0aWFsID0gdGhpcy5maWVsZHNbZmllbGROYW1lXS5pbml0aWFsXG4gICAgaWYgKGluaXRpYWwgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkSW5pdGlhbFtmaWVsZE5hbWVdID0gaW5pdGlhbFxuICAgIH1cbiAgfVxuICByZXR1cm4gZmllbGRJbml0aWFsXG59XG5cbi8qKlxuICogVHJpZXMgdG8gY29uc3RydWN0IGEgZGlzcGxheSBuYW1lIGZvciB0aGUgZm9ybSBmb3IgZGlzcGxheSBpbiBlcnJvciBtZXNzYWdlcy5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9mb3JtTmFtZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmFtZSA9IHRoaXMuZGlzcGxheU5hbWUgfHwgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lXG4gIHJldHVybiAobmFtZSA/IFwiJ1wiICsgbmFtZSArIFwiJ1wiIDogJ0Zvcm0nKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZvcm0gb3IgYW55IG9mIGl0cyBmaWVsZHMgYXJlIGNvbmZpZ3VyZWQgdG9cbiAqICAgZ2VuZXJhdGUgY29udHJvbGxlZCBjb21wb25lbnRzLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX25lZWRzT25DaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY29udHJvbGxlZCA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgdmFyIG5hbWVzID0gT2JqZWN0LmtleXModGhpcy5maWVsZHMpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuZmllbGRzW25hbWVzW2ldXS5jb250cm9sbGVkID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gVmFsaWRhdGlvbiA9PT1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhlIGZvcm0gdXNpbmcgaXRzIGN1cnJlbnQgaW5wdXQgZGF0YS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oZXJyLCBpc1ZhbGlkLCBjbGVhbmVkRGF0YSk9fSBjYiBjYWxsYmFjayBmb3IgYXN5bmNocm9ub3VzXG4gKiAgIHZhbGlkYXRpb24uXG4gKiBAcmV0dXJuIHtib29sZWFufHVuZGVmaW5lZH0gdHJ1ZSBpZiB0aGUgZm9ybSBvbmx5IGhhcyBzeW5jaHJvbm91cyB2YWxpZGF0aW9uXG4gKiAgIGFuZCBpcyB2YWxpZC5cbiAqIEB0aHJvd3MgaWYgdGhlIGZvcm0gaGFzIGFzeW5jaHJvbm91cyB2YWxpZGF0aW9uIGFuZCBhIGNhbGxiYWNrIGlzIG5vdFxuICogICBwcm92aWRlZC5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnZhbGlkYXRlID0gZnVuY3Rpb24oY2IpIHtcbiAgdGhpcy5fY2FuY2VsUGVuZGluZ09wZXJhdGlvbnMoKVxuICByZXR1cm4gKHRoaXMuaXNBc3luYygpID8gdGhpcy5fdmFsaWRhdGVBc3luYyhjYikgOiB0aGlzLl92YWxpZGF0ZVN5bmMoKSlcbn1cblxuQmFzZUZvcm0ucHJvdG90eXBlLl92YWxpZGF0ZUFzeW5jID0gZnVuY3Rpb24oY2IpIHtcbiAgaWYgKCFpcy5GdW5jdGlvbihjYikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnWW91IG11c3QgcHJvdmlkZSBhIGNhbGxiYWNrIHRvIHZhbGlkYXRlKCkgd2hlbiBhIGZvcm0gaGFzICcgK1xuICAgICAgJ2FzeW5jaHJvbm91cyB2YWxpZGF0aW9uLidcbiAgICApXG4gIH1cbiAgaWYgKHRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgdGhpcy5pc0luaXRpYWxSZW5kZXIgPSBmYWxzZVxuICB9XG4gIHRoaXMuX29uVmFsaWRhdGUgPSBjYlxuICB0aGlzLmZ1bGxDbGVhbigpXG4gIC8vIERpc3BsYXkgYXN5bmMgcHJvZ3Jlc3MgaW5kaWNhdG9yc1xuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG5CYXNlRm9ybS5wcm90b3R5cGUuX3ZhbGlkYXRlU3luYyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgdGhpcy5mdWxsQ2xlYW4oKVxuICAvLyBEaXNwbGF5IGNoYW5nZXMgdG8gdmFsaWQvaW52YWxpZCBzdGF0ZVxuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICByZXR1cm4gdGhpcy5pc1ZhbGlkKClcbn1cblxuLyoqXG4gKiBDbGVhbnMgZGF0YSBmb3IgYWxsIGZpZWxkcyBhbmQgdHJpZ2dlcnMgY3Jvc3MtZm9ybSBjbGVhbmluZy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmZ1bGxDbGVhbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9lcnJvcnMgPSBuZXcgRXJyb3JPYmplY3QoKVxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICByZXR1cm4gLy8gU3RvcCBmdXJ0aGVyIHByb2Nlc3NpbmdcbiAgfVxuXG4gIHRoaXMuY2xlYW5lZERhdGEgPSB7fVxuXG4gIC8vIElmIHRoZSBmb3JtIGlzIHBlcm1pdHRlZCB0byBiZSBlbXB0eSwgYW5kIG5vbmUgb2YgdGhlIGZvcm0gZGF0YSBoYXNcbiAgLy8gY2hhbmdlZCBmcm9tIHRoZSBpbml0aWFsIGRhdGEsIHNob3J0IGNpcmN1aXQgYW55IHZhbGlkYXRpb24uXG4gIGlmICh0aGlzLmVtcHR5UGVybWl0dGVkICYmICF0aGlzLmhhc0NoYW5nZWQoKSkge1xuICAgIHRoaXMuX2ZpbmlzaGVkVmFsaWRhdGlvbihudWxsKVxuICAgIHJldHVyblxuICB9XG5cbiAgdGhpcy5fY2xlYW5GaWVsZHMoKVxufVxuXG4vKipcbiAqIENsZWFucyBkYXRhIGZvciB0aGUgZ2l2ZW4gZmllbGQgbmFtZXMgYW5kIHRyaWdnZXJzIGNyb3NzLWZvcm0gY2xlYW5pbmcgaW5cbiAqIGNhc2UgYW55IGNsZWFuZWREYXRhIGl0IHVzZXMgaGFzIGNoYW5nZWQuXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBmaWVsZHMgZmllbGQgbmFtZXMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5wYXJ0aWFsQ2xlYW4gPSBmdW5jdGlvbihmaWVsZHMpIHtcbiAgdGhpcy5fcmVtb3ZlRXJyb3JzKGZpZWxkcylcblxuICAvLyBJZiB0aGUgZm9ybSBpcyBwZXJtaXR0ZWQgdG8gYmUgZW1wdHksIGFuZCBub25lIG9mIHRoZSBmb3JtIGRhdGEgaGFzXG4gIC8vIGNoYW5nZWQgZnJvbSB0aGUgaW5pdGlhbCBkYXRhLCBzaG9ydCBjaXJjdWl0IGFueSB2YWxpZGF0aW9uLlxuICBpZiAodGhpcy5lbXB0eVBlcm1pdHRlZCAmJiAhdGhpcy5oYXNDaGFuZ2VkKCkpIHtcbiAgICBpZiAodGhpcy5fZXJyb3JzLmlzUG9wdWxhdGVkKCkpIHtcbiAgICAgIHRoaXMuX2Vycm9ycyA9IEVycm9yT2JqZWN0KClcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cblxuICB0aGlzLl9wcmVDbGVhbkZpZWxkcyhmaWVsZHMpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZmllbGRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHRoaXMuX2NsZWFuRmllbGQoZmllbGRzW2ldKVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGFuZCBjbGVhbnMgZXZlcnkgZmllbGQgaW4gdGhlIGZvcm0uXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fY2xlYW5GaWVsZHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgdGhpcy5fcHJlQ2xlYW5GaWVsZHMoZmllbGROYW1lcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB0aGlzLl9jbGVhbkZpZWxkKGZpZWxkTmFtZXNbaV0pXG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIHBlbmRpbmcgdmFsaWRhdGlvbiBzdGF0ZSBwcmlvciB0byBjbGVhbmluZyBmaWVsZHMgYW5kIGNvbmZpZ3VyZXNcbiAqIGNyb3NzLWZpZWxkIGNsZWFuaW5nIHRvIHJ1biBhZnRlciBpdHMgZGVwZW5kZW50IGZpZWxkcyBoYXZlIGJlZW4gY2xlYW5lZCwgb3JcbiAqIGFmdGVyIGFsbCBmaWVsZHMgaGF2ZSBiZWVuIGNsZWFuZWQgaWYgZGVwZW5kZW5jaWVzIGhhdmUgbm90IGJlZW4gY29uZmlndXJlZC5cbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGZpZWxkTmFtZXMgZmllbGRzIHdoaWNoIGFyZSBhYm91dCB0byBiZSBjbGVhbmVkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX3ByZUNsZWFuRmllbGRzID0gZnVuY3Rpb24oZmllbGROYW1lcykge1xuICAvLyBBZGQgYWxsIGZpZWxkIG5hbWVzIHRvIHRob3NlIHBlbmRpbmcgdmFsaWRhdGlvblxuICBvYmplY3QuZXh0ZW5kKHRoaXMuX3BlbmRpbmdWYWxpZGF0aW9uLCBvYmplY3QubG9va3VwKGZpZWxkTmFtZXMpKVxuXG4gIC8vIEFkZCBhcHByb3ByaWF0ZSBmaWVsZCBuYW1lcyB0byBkZXRlcm1pbmUgd2hlbiB0byBydW4gY3Jvc3MtZmllbGQgY2xlYW5pbmdcbiAgdmFyIGksIGxcbiAgaWYgKHR5cGVvZiB0aGlzLmNsZWFuLmZpZWxkcyAhPSAndW5kZWZpbmVkJykge1xuICAgIGZvciAoaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRoaXMuY2xlYW4uZmllbGRzW2ZpZWxkTmFtZXNbaV1dKSB7XG4gICAgICAgIHRoaXMuX3J1bkNsZWFuQWZ0ZXJbZmllbGROYW1lc1tpXV0gPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIElnbm9yZSBhbnkgaW52YWxpZCBmaWVsZCBuYW1lcyBnaXZlblxuICAgIGZvciAoaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZmllbGRzW2ZpZWxkTmFtZXNbaV1dKSB7XG4gICAgICAgIHRoaXMuX3J1bkNsZWFuQWZ0ZXJbZmllbGROYW1lc1tpXV0gPSB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGFuZCBjbGVhbnMgdGhlIG5hbWVkIGZpZWxkIGFuZCBydW5zIGFueSBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvblxuICogdGhhdCdzIGJlZW4gcHJvdmlkZWQgZm9yIGl0LlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgYSBmb3JtIGZpZWxkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2NsZWFuRmllbGQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGlmICghb2JqZWN0Lmhhc093bih0aGlzLmZpZWxkcywgbmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5fZm9ybU5hbWUoKSArIFwiIGhhcyBubyBmaWVsZCBuYW1lZCAnXCIgKyBuYW1lICsgXCInXCIpXG4gIH1cblxuICB2YXIgZmllbGQgPSB0aGlzLmZpZWxkc1tuYW1lXVxuICAvLyB2YWx1ZUZyb21EYXRhKCkgZ2V0cyB0aGUgZGF0YSBmcm9tIHRoZSBkYXRhIG9iamVjdHMuXG4gIC8vIEVhY2ggd2lkZ2V0IHR5cGUga25vd3MgaG93IHRvIHJldHJpZXZlIGl0cyBvd24gZGF0YSwgYmVjYXVzZSBzb21lIHdpZGdldHNcbiAgLy8gc3BsaXQgZGF0YSBvdmVyIHNldmVyYWwgSFRNTCBmaWVsZHMuXG4gIHZhciB2YWx1ZSA9IGZpZWxkLndpZGdldC52YWx1ZUZyb21EYXRhKHRoaXMuZGF0YSwgdGhpcy5maWxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQcmVmaXgobmFtZSkpXG4gIHZhciBhc3luYyA9IGZhbHNlXG4gIHZhciBlcnJvciA9IG51bGxcblxuICB0cnkge1xuICAgIGlmIChmaWVsZCBpbnN0YW5jZW9mIEZpbGVGaWVsZCkge1xuICAgICAgdmFyIGluaXRpYWwgPSBvYmplY3QuZ2V0KHRoaXMuaW5pdGlhbCwgbmFtZSwgZmllbGQuaW5pdGlhbClcbiAgICAgIHZhbHVlID0gZmllbGQuY2xlYW4odmFsdWUsIGluaXRpYWwpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsdWUgPSBmaWVsZC5jbGVhbih2YWx1ZSlcbiAgICB9XG4gICAgdGhpcy5jbGVhbmVkRGF0YVtuYW1lXSA9IHZhbHVlXG4gICAgdmFyIGN1c3RvbUNsZWFuID0gdGhpcy5fZ2V0Q3VzdG9tQ2xlYW4obmFtZSlcbiAgICBpZiAoaXMuRnVuY3Rpb24oY3VzdG9tQ2xlYW4pKSB7XG4gICAgICBhc3luYyA9IHRoaXMuX3J1bkN1c3RvbUNsZWFuKG5hbWUsIGN1c3RvbUNsZWFuKVxuICAgIH1cbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKG5hbWUsIGUpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXJyb3IgPSBlXG4gICAgfVxuICB9XG5cbiAgaWYgKCFhc3luYykge1xuICAgIHRoaXMuX2ZpZWxkQ2xlYW5lZChuYW1lLCBlcnJvcilcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIGN1c3RvbSBjbGVhbmluZyBtZXRob2QgZm9yIGEgZmllbGQuIFRoZXNlIGNhbiBiZSBuYW1lZCBjbGVhbjxOYW1lPlxuICogb3IgY2xlYW5fPG5hbWU+LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkTmFtZVxuICogQHJldHVybiB7ZnVuY3Rpb258dW5kZWZpbmVkfVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2dldEN1c3RvbUNsZWFuID0gZnVuY3Rpb24oZmllbGROYW1lKSB7XG4gIHJldHVybiAodGhpc1snY2xlYW4nICsgZmllbGROYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZmllbGROYW1lLnN1YnN0cigxKV0gfHxcbiAgICAgICAgICB0aGlzWydjbGVhbl8nICsgZmllbGROYW1lXSlcbn1cblxuLyoqXG4gKiBDYWxscyBhIGN1c3RvbSBjbGVhbmluZyBtZXRob2QsIGV4cGVjdGluZyBzeW5jaHJvbm91cyBvciBhc3luY2hyb25vdXNcbiAqIGJlaGF2aW91ciwgZGVwZW5kaW5nIG9uIGl0cyBhcml0eS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZE5hbWUgYSBmaWVsZCBuYW1lLlxuICogQHBhcmFtIHsoZnVuY3Rpb24oKXxmdW5jdGlvbihmdW5jdGlvbihFcnJvciwgc3RyaW5nLCBzdHJpbmd8VmFsaWRhdGlvbkVycm9yKSkpfSBjdXN0b21DbGVhblxuICogICB0aGUgY3VzdG9tIGNsZWFuaW5nIG1ldGhvZCBmb3IgdGhlIGZpZWxkLlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBjbGVhbmluZyBpcyBydW5uaW5nIGFzeW5jaHJvbm91c2x5LCBmYWxzZSBpZiBpdCBqdXN0XG4gKiAgIHJhbiBzeW5jaHJvbm91c2x5LlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX3J1bkN1c3RvbUNsZWFuID0gZnVuY3Rpb24oZmllbGROYW1lLCBjdXN0b21DbGVhbikge1xuICAvLyBDaGVjayBhcml0eSB0byBzZWUgaWYgd2UgaGF2ZSBhIGNhbGxiYWNrIGluIHRoZSBmdW5jdGlvbiBzaWduYXR1cmVcbiAgaWYgKGN1c3RvbUNsZWFuLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIFN5bmNocm9ub3VzIHByb2Nlc3Npbmcgb25seSBleHBlY3RlZFxuICAgIGN1c3RvbUNsZWFuLmNhbGwodGhpcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGFzeW5jIGFuZCB0aGVyZSdzIG9uZSBwZW5kaW5nLCBwcmV2ZW50IGl0c1xuICAvLyBjYWxsYmFjayBmcm9tIGRvaW5nIGFueXRoaW5nLlxuICBpZiAodHlwZW9mIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bZmllbGROYW1lXSAhPSAndW5kZWZpbmVkJykge1xuICAgIG9iamVjdC5wb3AodGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbiwgZmllbGROYW1lKS5jYW5jZWwoKVxuICB9XG4gIC8vIFNldCB1cCBjYWxsYmFjayBmb3IgYXN5bmMgcHJvY2Vzc2luZyAtIHRoZSBhcmd1bWVudCBmb3IgYWRkRXJyb3IoKVxuICAvLyBzaG91bGQgYmUgcGFzc2VkIHZpYSB0aGUgY2FsbGJhY2sgYXMgY2FsbGluZyBpdCBkaXJlY3RseSBwcmV2ZW50cyB1c1xuICAvLyBmcm9tIGNvbXBsZXRlbHkgaWdub3JpbmcgdGhlIGNhbGxiYWNrIGlmIHZhbGlkYXRpb24gZmlyZXMgYWdhaW4uXG4gIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGVyciwgdmFsaWRhdGlvbkVycm9yKSB7XG4gICAgaWYgKHZhbGlkYXRpb25FcnJvcikge1xuICAgICAgdGhpcy5hZGRFcnJvcihmaWVsZE5hbWUgPT0gTk9OX0ZJRUxEX0VSUk9SUyA/IG51bGwgOiBmaWVsZE5hbWUsIHZhbGlkYXRpb25FcnJvcilcbiAgICB9XG4gICAgdGhpcy5fZmllbGRDbGVhbmVkKGZpZWxkTmFtZSwgZXJyKVxuICAgIHRoaXMuX3N0YXRlQ2hhbmdlZCgpXG4gIH0uYmluZCh0aGlzKVxuICB2YXIgY2FuY2VsbGFibGVDYWxsYmFjayA9IHV0aWwuY2FuY2VsbGFibGUoY2FsbGJhY2spXG5cbiAgLy8gQW4gZXhwbGljaXQgcmV0dXJuIHZhbHVlIG9mIGZhbHNlIGluZGljYXRlcyB0aGF0IGFzeW5jIHByb2Nlc3NpbmcgaXNcbiAgLy8gYmVpbmcgc2tpcHBlZCAoZS5nLiBiZWNhdXNlIHN5bmMgY2hlY2tzIGluIHRoZSBtZXRob2QgZmFpbGVkIGZpcnN0KVxuICB2YXIgcmV0dXJuVmFsdWUgPSBjdXN0b21DbGVhbi5jYWxsKHRoaXMsIGNhbmNlbGxhYmxlQ2FsbGJhY2spXG4gIGlmIChyZXR1cm5WYWx1ZSAhPT0gZmFsc2UpIHtcbiAgICAvLyBBc3luYyBwcm9jZXNzaW5nIGlzIGhhcHBlbmluZyEgTWFrZSB0aGUgY2FsbGJhY2sgY2FuY2VsbGFibGUgYW5kXG4gICAgLy8gaG9vayB1cCBhbnkgY3VzdG9tIG9uQ2FuY2VsIGhhbmRsaW5nIHByb3ZpZGVkLlxuICAgIGlmIChyZXR1cm5WYWx1ZSAmJiB0eXBlb2YgcmV0dXJuVmFsdWUub25DYW5jZWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sub25DYW5jZWwgPSByZXR1cm5WYWx1ZS5vbkNhbmNlbFxuICAgIH1cbiAgICB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW2ZpZWxkTmFtZV0gPSBjYW5jZWxsYWJsZUNhbGxiYWNrXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBjb21wbGV0aW9uIG9mIGZpZWxkIGNsZWFuaW5nLiBUcmlnZ2VycyBmdXJ0aGVyIGZpZWxkIGNsZWFuaW5nIG9yXG4gKiBzaWduYWxzIHRoZSBlbmQgb2YgdmFsaWRhdGlvbiwgYXMgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkTmFtZVxuICogQHBhcmFtIHtFcnJvcj19IGVyciBhbiBlcnJvciBjYXVnaHQgd2hpbGUgY2xlYW5pbmcgdGhlIGZpZWxkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2ZpZWxkQ2xlYW5lZCA9IGZ1bmN0aW9uKGZpZWxkTmFtZSwgZXJyKSB7XG4gIHZhciB3YXNQZW5kaW5nID0gZGVsZXRlIHRoaXMuX3BlbmRpbmdWYWxpZGF0aW9uW2ZpZWxkTmFtZV1cbiAgaWYgKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bZmllbGROYW1lXSkge1xuICAgIGRlbGV0ZSB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW2ZpZWxkTmFtZV1cbiAgfVxuXG4gIGlmIChlcnIpIHtcbiAgICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY2xlYW5pbmcgJyArIHRoaXMuX2Zvcm1OYW1lKCkgKyAnLicgKyBmaWVsZE5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAnOicgKyBlcnIubWVzc2FnZSlcbiAgICB9XG4gICAgLy8gU3RvcCB0cmFja2luZyB2YWxpZGF0aW9uIHByb2dyZXNzIG9uIGVycm9yLCBhbmQgZG9uJ3QgY2FsbCBjbGVhbigpXG4gICAgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24gPSB7fVxuICAgIHRoaXMuX3J1bkNsZWFuQWZ0ZXIgPSB7fVxuICAgIHRoaXMuX2ZpbmlzaGVkVmFsaWRhdGlvbihlcnIpXG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBSdW4gY2xlYW4oKSBpZiB0aGlzIHRoaXMgd2FzIHRoZSBsYXN0IGZpZWxkIGl0IHdhcyB3YWl0aW5nIGZvclxuICBpZiAodGhpcy5fcnVuQ2xlYW5BZnRlcltmaWVsZE5hbWVdKSB7XG4gICAgZGVsZXRlIHRoaXMuX3J1bkNsZWFuQWZ0ZXJbZmllbGROYW1lXVxuICAgIGlmIChpcy5FbXB0eSh0aGlzLl9ydW5DbGVhbkFmdGVyKSkge1xuICAgICAgdGhpcy5fY2xlYW5Gb3JtKClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIC8vIFNpZ25hbCB0aGUgZW5kIG9mIHZhbGlkYXRpb24gaWYgdGhpcyB3YXMgdGhlIGxhc3QgZmllbGQgd2Ugd2VyZSB3YWl0aW5nIGZvclxuICBpZiAod2FzUGVuZGluZyAmJiBpcy5FbXB0eSh0aGlzLl9wZW5kaW5nVmFsaWRhdGlvbikpIHtcbiAgICB0aGlzLl9maW5pc2hlZFZhbGlkYXRpb24obnVsbClcbiAgfVxufVxuXG4vKipcbiAqIEhvb2sgZm9yIGRvaW5nIGFueSBleHRyYSBmb3JtLXdpZGUgY2xlYW5pbmcgYWZ0ZXIgZWFjaCBGaWVsZCBoYXMgYmVlbiBjbGVhbmVkLlxuICogQW55IFZhbGlkYXRpb25FcnJvciB0aHJvd24gYnkgc3luY2hyb25vdXMgdmFsaWRhdGlvbiBpbiB0aGlzIG1ldGhvZCB3aWxsIG5vdFxuICogYmUgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhciBmaWVsZDsgaXQgd2lsbCBoYXZlIGEgc3BlY2lhbC1jYXNlIGFzc29jaWF0aW9uXG4gKiB3aXRoIHRoZSBmaWVsZCBuYW1lZCAnX19hbGxfXycuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEVycm9yLCBzdHJpbmcsIHN0cmluZ3xWYWxpZGF0aW9uRXJyb3IpPX0gY2IgYSBjYWxsYmFjayB0byBzaWduYWwgdGhlXG4gKiAgIGVuZCBvZiBhc3luY2hyb25vdXMgdmFsaWRhdGlvbi5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmNsZWFuID0gbm9vcFxuXG4vKipcbiAqIENhbGxzIHRoZSBjbGVhbigpIGhvb2suXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fY2xlYW5Gb3JtID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhc3luYyA9IGZhbHNlXG4gIHZhciBlcnJvciA9IG51bGxcbiAgdHJ5IHtcbiAgICBpZiAodGhpcy5jbGVhbiAhPT0gbm9vcCkge1xuICAgICAgYXN5bmMgPSB0aGlzLl9ydW5DdXN0b21DbGVhbihOT05fRklFTERfRVJST1JTLCB0aGlzLmNsZWFuKVxuICAgIH1cbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICB0aGlzLmFkZEVycm9yKG51bGwsIGUpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXJyb3IgPSBlXG4gICAgfVxuICB9XG5cbiAgaWYgKCFhc3luYykge1xuICAgIHRoaXMuX2ZpZWxkQ2xlYW5lZChOT05fRklFTERfRVJST1JTLCBlcnJvcilcbiAgfVxufVxuXG5CYXNlRm9ybS5wcm90b3R5cGUuX2ZpbmlzaGVkVmFsaWRhdGlvbiA9IGZ1bmN0aW9uKGVycikge1xuICBpZiAoIXRoaXMuaXNBc3luYygpKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICAgIC8vIFN5bmNocm9ub3VzIGZvcm0gdmFsaWRhdGlvbiByZXN1bHRzIHdpbGwgYmUgcmV0dXJuZWQgdmlhIHRoZSBvcmlnaW5hbFxuICAgIC8vIGNhbGwgd2hpY2ggdHJpZ2dlcmVkIHZhbGlkYXRpb24uXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKGlzLkZ1bmN0aW9uKHRoaXMuX29uVmFsaWRhdGUpKSB7XG4gICAgdmFyIGNhbGxiYWNrID0gdGhpcy5fb25WYWxpZGF0ZVxuICAgIHRoaXMuX29uVmFsaWRhdGUgPSBudWxsXG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycilcbiAgICB9XG4gICAgdmFyIGlzVmFsaWQgPSB0aGlzLmlzVmFsaWQoKVxuICAgIGNhbGxiYWNrKG51bGwsIGlzVmFsaWQsIGlzVmFsaWQgPyB0aGlzLmNsZWFuZWREYXRhIDogbnVsbClcbiAgfVxufVxuXG4vKipcbiAqIENhbmNlbHMgYW55IHBlbmRpbmcgZmllbGQgdmFsaWRhdGlvbnMgYW5kIGFzeW5jIHZhbGlkYXRpb25zLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2NhbmNlbFBlbmRpbmdPcGVyYXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIE9iamVjdC5rZXlzKHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb24pLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb24sIGZpZWxkKS5jYW5jZWwoKVxuICB9LmJpbmQodGhpcykpXG4gIE9iamVjdC5rZXlzKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24pLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIGZpZWxkKS5jYW5jZWwoKVxuICB9LmJpbmQodGhpcykpXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRXZlbnQgSGFuZGxpbmcgPT09XG5cbi8qKlxuICogSGFuZGxlcyB2YWxpZGF0aW5nIHRoZSBmaWVsZCB3aGljaCBpcyB0aGUgdGFyZ2V0IG9mIHRoZSBnaXZlbiBldmVudCBiYXNlZFxuICogb24gaXRzIHZhbGlkYXRpb24gY29uZmlnLiBUaGlzIHdpbGwgYmUgaG9va2VkIHVwIHRvIHRoZSBhcHByb3ByaWF0ZSBldmVudFxuICogYXMgcGVyIHRoZSBmaWVsZCdzIHZhbGlkYXRpb24gY29uZmlnLlxuICogQHBhcmFtIHtPYmplY3R9IHZhbGlkYXRpb24gdGhlIGZpZWxkJ3MgdmFsaWRhdGlvbiBjb25maWcgZm9yIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7U3ludGhldGljRXZlbnR9IGUgdGhlIGV2ZW50IGJlaW5nIGhhbmRsZWQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5faGFuZGxlRmllbGRFdmVudCA9IGZ1bmN0aW9uKHZhbGlkYXRpb24sIGUpIHtcbiAgLy8gVXBkYXRlIGZvcm0uZGF0YSB3aXRoIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBmaWVsZCB3aGljaCBpcyB0aGUgdGFyZ2V0IG9mXG4gIC8vIHRoZSBldmVudC5cbiAgdmFyIGh0bWxOYW1lID0gZS50YXJnZXQubmFtZVxuICB2YXIgZmllbGROYW1lID0gdGhpcy5yZW1vdmVQcmVmaXgoZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5ld2Zvcm1zLWZpZWxkJykgfHwgaHRtbE5hbWUpXG4gIHZhciBmaWVsZCA9IHRoaXMuZmllbGRzW2ZpZWxkTmFtZV1cbiAgdmFyIHRhcmdldERhdGEgPSB1dGlsLmZpZWxkRGF0YShlLnRhcmdldC5mb3JtLCBodG1sTmFtZSlcbiAgdGhpcy5kYXRhW2h0bWxOYW1lXSA9IHRhcmdldERhdGFcbiAgaWYgKHRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgdGhpcy5pc0luaXRpYWxSZW5kZXIgPSBmYWxzZVxuICB9XG4gIGlmICh0aGlzLmNvbnRyb2xsZWQgfHwgZmllbGQuY29udHJvbGxlZCkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlZCgpXG4gIH1cblxuICAvLyBCYWlsIG91dCBlYXJseSBpZiB0aGUgZXZlbnQgaXMgb25seSBiZWluZyBoYW5kbGVkIHRvIHVwZGF0ZSB0aGUgZmllbGQncyBkYXRhXG4gIGlmICh2YWxpZGF0aW9uLnZhbGlkYXRlID09PSBmYWxzZSkgeyByZXR1cm4gfVxuXG4gIHZhciB2YWxpZGF0ZSA9IGZhbHNlXG5cbiAgLy8gU3BlY2lhbCBjYXNlcyBmb3Igb25CbHVyLCBhcyBpdCBlbmRzIGEgdXNlcidzIGludGVyYWN0aW9uIHdpdGggYSB0ZXh0IGlucHV0XG4gIGlmICh2YWxpZGF0aW9uLmV2ZW50ID09ICdvbkJsdXInKSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgYW55IHBlbmRpbmcgdmFsaWRhdGlvbiwgdHJpZ2dlciBpdCBpbW1lZGlhdGVseVxuICAgIGlmICh0eXBlb2YgdGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbltmaWVsZE5hbWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0udHJpZ2dlcigpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy8gQWx3YXlzIHZhbGlkYXRlIGlmIHRoZSBmaWVsZCBpcyByZXF1aXJlZCBhbmQgdGhlIGlucHV0IHdoaWNoIHdhcyBibHVycmVkXG4gICAgLy8gd2FzIGVtcHR5IChzb21lIGZpZWxkcyBoYXZlIG11bHRpcGxlIGlucHV0cykuXG4gICAgdmFsaWRhdGUgPSAoZmllbGQucmVxdWlyZWQgJiYgZmllbGQuaXNFbXB0eVZhbHVlKHRhcmdldERhdGEpKVxuICB9XG5cbiAgLy8gQWx3YXlzIHZhbGlkYXRlIGlmIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgdGhlIGZpZWxkIGhhcyBiZWVuIGludGVyYWN0ZWRcbiAgLy8gd2l0aC5cbiAgaWYgKCF2YWxpZGF0ZSkge1xuICAgIHZhciBsYXN0VmFsaWRhdGVkRGF0YSA9IG9iamVjdC5nZXQodGhpcy5fbGFzdFZhbGlkYXRlZERhdGEsIGZpZWxkTmFtZSwgc2VudGluZWwpXG4gICAgdmFsaWRhdGUgPSAobGFzdFZhbGlkYXRlZERhdGEgPT09IHNlbnRpbmVsKVxuICB9XG5cbiAgLy8gT3RoZXJ3aXNlLCB2YWxpZGF0ZSBpZiBkYXRhIGhhcyBjaGFuZ2VkIHNpbmNlIHZhbGlkYXRpb24gd2FzIGxhc3QgcGVyZm9ybWVkXG4gIC8vIC0gdGhpcyBwcmV2ZW50cyBkaXNwbGF5ZWQgdmFsaWRhdGlvbiBlcnJvcnMgYmVpbmcgY2xlYXJlZCB1bm5lY2Vzc2FyaWx5LlxuICBpZiAoIXZhbGlkYXRlKSB7XG4gICAgdmFyIGZpZWxkRGF0YSA9IGZpZWxkLndpZGdldC52YWx1ZUZyb21EYXRhKHRoaXMuZGF0YSwgbnVsbCwgdGhpcy5hZGRQcmVmaXgoZmllbGROYW1lKSlcbiAgICB2YWxpZGF0ZSA9IGZpZWxkRGF0YUhhc0NoYW5nZWQobGFzdFZhbGlkYXRlZERhdGEsIGZpZWxkRGF0YSlcbiAgfVxuXG4gIC8vIENhbmNlbCBhbnkgcGVuZGluZyB2YWxpZGF0aW9uIGFzIGl0J3Mgbm8gbG9uZ2VyIG5lZWRlZCAtIHRoaXMgY2FuIGhhcHBlblxuICAvLyBpZiB0aGUgdXNlciBlZGl0cyBhIGZpZWxkIHdpdGggZGVib3VuY2VkIHZhbGlkYXRpb24gYW5kIGl0IGVuZHMgdXAgYmFja1xuICAvLyBhdCBpdHMgb3JpZ2luYWwgdmFsdWUgYmVmb3JlIHZhbGlkYXRpb24gaXMgdHJpZ2dlcmVkLlxuICBpZiAoIXZhbGlkYXRlICYmIHR5cGVvZiB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdFdmVudFZhbGlkYXRpb24sIGZpZWxkTmFtZSkuY2FuY2VsKClcbiAgfVxuXG4gIC8vIElmIHdlIGRvbid0IG5lZWQgdG8gdmFsaWRhdGUsIHdlJ3JlIGRvbmUgaGFuZGxpbmcgdGhlIGV2ZW50XG4gIGlmICghdmFsaWRhdGUpIHsgcmV0dXJuIH1cblxuICBpZiAodmFsaWRhdGlvbi5kZWxheSkge1xuICAgIHRoaXMuX2RlbGF5ZWRGaWVsZFZhbGlkYXRpb24oZmllbGROYW1lLCB2YWxpZGF0aW9uLmRlbGF5KVxuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuX2ltbWVkaWF0ZUZpZWxkVmFsaWRhdGlvbihmaWVsZE5hbWUpXG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGRlbGF5ZWQgdmFsaWRhdGlvbiBvZiBhIGZpZWxkIHdpdGggYSBkZWJvdW5jZWQgZnVuY3Rpb24gYW5kIGNhbGxzIGl0LFxuICogb3IganVzdCBjYWxscyB0aGUgZnVuY3Rpb24gYWdhaW4gaWYgaXQgYWxyZWFkeSBleGlzdHMsIHRvIHJlc2V0IHRoZSBkZWxheS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZE5hbWVcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZWxheSBkZWxheSB0aW1lIGluIG1zLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX2RlbGF5ZWRGaWVsZFZhbGlkYXRpb24gPSBmdW5jdGlvbihmaWVsZE5hbWUsIGRlbGF5KSB7XG4gIGlmICh0eXBlb2YgdGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbltmaWVsZE5hbWVdID09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbltmaWVsZE5hbWVdID0gdXRpbC5kZWJvdW5jZShmdW5jdGlvbigpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV1cbiAgICAgIHRoaXMuX2ltbWVkaWF0ZUZpZWxkVmFsaWRhdGlvbihmaWVsZE5hbWUpXG4gICAgfS5iaW5kKHRoaXMpLCBkZWxheSlcbiAgfVxuICB0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uW2ZpZWxkTmFtZV0oKVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBhIGZpZWxkIGFuZCBub3RpZmllcyB0aGUgUmVhY3QgY29tcG9uZW50IHRoYXQgc3RhdGUgaGFzIGNoYW5nZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGROYW1lXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5faW1tZWRpYXRlRmllbGRWYWxpZGF0aW9uID0gZnVuY3Rpb24oZmllbGROYW1lKSB7XG4gIC8vIFJlbW92ZSBhbmQgY2FuY2VsIGFueSBwZW5kaW5nIHZhbGlkYXRpb24gZm9yIHRoZSBmaWVsZCB0byBhdm9pZCBkb3VibGluZyB1cFxuICAvLyB3aGVuIGJvdGggZGVsYXllZCBhbmQgaW1tZWRpYXRlIHZhbGlkYXRpb24gYXJlIGNvbmZpZ3VyZWQuXG4gIGlmICh0eXBlb2YgdGhpcy5fcGVuZGluZ0V2ZW50VmFsaWRhdGlvbltmaWVsZE5hbWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgb2JqZWN0LnBvcCh0aGlzLl9wZW5kaW5nRXZlbnRWYWxpZGF0aW9uLCBmaWVsZE5hbWUpLmNhbmNlbCgpXG4gIH1cbiAgdGhpcy5fbGFzdFZhbGlkYXRlZERhdGFbZmllbGROYW1lXSA9XG4gICAgICB0aGlzLmZpZWxkc1tmaWVsZE5hbWVdLndpZGdldC52YWx1ZUZyb21EYXRhKHRoaXMuZGF0YSwgdGhpcy5maWxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRQcmVmaXgoZmllbGROYW1lKSlcbiAgdGhpcy5wYXJ0aWFsQ2xlYW4oW2ZpZWxkTmFtZV0pXG4gIHRoaXMuX3N0YXRlQ2hhbmdlZCgpXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IE11dGFiaWxpdHkgPT09XG5cbi8qKlxuICogUmVzZXRzIGEgZm9ybSBkYXRhIGJhY2sgdG8gaXRzIGluaXRpYWwgc3RhdGUsIG9wdGlvbmFsbHkgcHJvdmlkaW5nIG5ldyBpbml0aWFsXG4gKiBkYXRhLlxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj49fSBuZXdJbml0aWFsIG5ldyBpbml0aWFsIGRhdGEgZm9yIHRoZSBmb3JtLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihuZXdJbml0aWFsKSB7XG4gIHRoaXMuX2NhbmNlbFBlbmRpbmdPcGVyYXRpb25zKClcblxuICBpZiAodHlwZW9mIG5ld0luaXRpYWwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLmluaXRpYWwgPSBuZXdJbml0aWFsXG4gIH1cblxuICB0aGlzLmRhdGEgPSB7fVxuICB0aGlzLmNsZWFuZWREYXRhID0ge31cbiAgdGhpcy5pc0luaXRpYWxSZW5kZXIgPSB0cnVlXG5cbiAgdGhpcy5fZXJyb3JzID0gbnVsbFxuICB0aGlzLl9sYXN0SGFzQ2hhbmdlZCA9IG51bGxcbiAgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24gPSB7fVxuICB0aGlzLl9ydW5DbGVhbkFmdGVyID0ge31cbiAgdGhpcy5fbGFzdFZhbGlkYXRlZERhdGEgPSB7fVxuICB0aGlzLl9vblZhbGlkYXRlID0gbnVsbFxuXG4gIHRoaXMuX2NvcHlJbml0aWFsVG9EYXRhKClcbiAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBmb3JtJ3MgZW50aXJlIGlucHV0IGRhdGEsIGFsc28gdHJpZ2dlcmluZyB2YWxpZGF0aW9uIGJ5IGRlZmF1bHQuXG4gKiBAcGFyYW0ge29iamVjdC48c3RyaW5nLCo+fSBkYXRhIG5ldyBpbnB1dCBkYXRhIGZvciB0aGUgZm9ybS5cbiAqIEBwYXJhbSB7b2JqZWN0LjxzdHJpbmcsYm9vbGVhbj59IGt3YXJncyBkYXRhIHNldHRpbmcgb3B0aW9ucy5cbiAqIEByZXR1cm4ge2Jvb2xlYW58dW5kZWZpbmVkfSBpZiBkYXRhIHNldHRpbmcgb3B0aW9ucyBpbmRpY2F0ZSB0aGUgbmV3IGRhdGFcbiAqICAgc2hvdWxkIGJlIHZhbGlkYXRlZCBhbmQgdGhlIGZvcm0gZG9lcyBub3QgaGF2ZSBhc3luY2hyb25vdXMgdmFsaWRhdGlvblxuICogICBjb25maWd1cmVkOiB0cnVlIGlmIHRoZSBuZXcgZGF0YSBpcyB2YWxpZC5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnNldERhdGEgPSBmdW5jdGlvbihkYXRhLCBrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7XG4gICAgcHJlZml4ZWQ6IGZhbHNlLCB2YWxpZGF0ZTogdHJ1ZSwgX3RyaWdnZXJTdGF0ZUNoYW5nZTogdHJ1ZVxuICB9LCBrd2FyZ3MpXG5cbiAgdGhpcy5kYXRhID0gKGt3YXJncy5wcmVmaXhlZCA/IGRhdGEgOiB0aGlzLl9wcmVmaXhEYXRhKGRhdGEpKVxuXG4gIGlmICh0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIHRoaXMuaXNJbml0aWFsUmVuZGVyID0gZmFsc2VcbiAgfVxuICBpZiAoa3dhcmdzLnZhbGlkYXRlKSB7XG4gICAgdGhpcy5fZXJyb3JzID0gbnVsbFxuICAgIC8vIFRoaXMgY2FsbCB1bHRpbWF0ZWx5IHRyaWdnZXJzIGEgZnVsbENsZWFuKCkgYmVjYXVzZSBfZXJyb3JzIGlzIG51bGxcbiAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZCgpXG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gUHJldmVudCB2YWxpZGF0aW9uIGJlaW5nIHRyaWdnZXJlZCBpZiBlcnJvcnMoKSBpcyBhY2Nlc3NlZCBkdXJpbmcgcmVuZGVyXG4gICAgdGhpcy5fZXJyb3JzID0gbmV3IEVycm9yT2JqZWN0KClcbiAgfVxuXG4gIGlmIChrd2FyZ3MuX3RyaWdnZXJTdGF0ZUNoYW5nZSkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlZCgpXG4gIH1cblxuICBpZiAoa3dhcmdzLnZhbGlkYXRlICYmICF0aGlzLmlzQXN5bmMoKSkge1xuICAgIHJldHVybiBpc1ZhbGlkXG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBmb3JtJ3MgZW50aXJlIGlucHV0IGRhdGEgd3RoIGRhdGEgZXh0cmFjdGVkIGZyb20gYSBgYDxmb3JtPmBgLCB3aGljaFxuICogd2lsbCBiZSBwcmVmaXhlZCwgaWYgcHJlZml4ZXMgYXJlIGJlaW5nIHVzZWQuXG4gKiBAcGFyYW0ge09iamVjdC48c3Ryb25nLCAqPn0gZm9ybURhdGFcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsIGJvb2xlYW4+fSBrd2FyZ3Mgc2V0RGF0YSBvcHRpb25zLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuc2V0Rm9ybURhdGEgPSBmdW5jdGlvbihmb3JtRGF0YSwga3dhcmdzKSB7XG4gIHJldHVybiB0aGlzLnNldERhdGEoZm9ybURhdGEsIG9iamVjdC5leHRlbmQoa3dhcmdzIHx8IHt9LCB7cHJlZml4ZWQ6IHRydWV9KSlcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHNvbWUgb2YgdGhlIGZvcm0ncyBpbnB1dCBkYXRhLCBvcHRpb25hbGx5IHRyaWdnZXJpbmcgdmFsaWRhdGlvbiBvZlxuICogdXBkYXRlZCBmaWVsZHMgYW5kIGZvcm0td2lkZSBjbGVhbmluZywgb3IgY2xlYXJzIGV4aXN0aW5nIGVycm9ycyBmcm9tIHRoZVxuICogdXBkYXRlZCBmaWVsZHMuXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCAqPn0gZGF0YSB1cGRhdGVkIGlucHV0IGRhdGEgZm9yIHRoZSBmb3JtLlxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgYm9vbGVhbj59IGt3YXJncyB1cGRhdGUgb3B0aW9ucy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLnVwZGF0ZURhdGEgPSBmdW5jdGlvbihkYXRhLCBrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7XG4gICAgcHJlZml4ZWQ6IGZhbHNlLCB2YWxpZGF0ZTogdHJ1ZSwgY2xlYXJWYWxpZGF0aW9uOiB0cnVlXG4gIH0sIGt3YXJncylcblxuICBvYmplY3QuZXh0ZW5kKHRoaXMuZGF0YSwgKGt3YXJncy5wcmVmaXhlZCA/IGRhdGEgOiB0aGlzLl9wcmVmaXhEYXRhKGRhdGEpKSlcbiAgaWYgKHRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgdGhpcy5pc0luaXRpYWxSZW5kZXIgPSBmYWxzZVxuICB9XG5cbiAgdmFyIGZpZWxkcyA9IE9iamVjdC5rZXlzKGRhdGEpXG4gIGlmIChrd2FyZ3MucHJlZml4ZWQpIHtcbiAgICBmaWVsZHMgPSBmaWVsZHMubWFwKHRoaXMucmVtb3ZlUHJlZml4LmJpbmQodGhpcykpXG4gIH1cblxuICBpZiAoa3dhcmdzLnZhbGlkYXRlKSB7XG4gICAgdGhpcy5wYXJ0aWFsQ2xlYW4oZmllbGRzKVxuICB9XG4gIGVsc2UgaWYgKGt3YXJncy5jbGVhclZhbGlkYXRpb24pIHtcbiAgICB0aGlzLl9yZW1vdmVFcnJvcnMoZmllbGRzKVxuICAgIHRoaXMuX3JlbW92ZUNsZWFuZWREYXRhKGZpZWxkcylcbiAgICB0aGlzLl9jbGVhbkZvcm0oKVxuICB9XG5cbiAgdGhpcy5fc3RhdGVDaGFuZ2VkKClcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFueSBjbGVhbmVkRGF0YSBwcmVzZW50IGZvciB0aGUgZ2l2ZW4gZm9ybSBmaWVsZHMuXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBmaWVsZHMgZmllbGQgbmFtZXMuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fcmVtb3ZlQ2xlYW5lZERhdGEgPSBmdW5jdGlvbihmaWVsZHMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgZGVsZXRlIHRoaXMuY2xlYW5lZERhdGFbZmllbGRzW2ldXVxuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gQm91bmRGaWVsZHMgPT09XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJvdW5kRmllbGQgZm9yIHRoZSBmaWVsZCB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgYSBmaWVsZCBuYW1lLlxuICogQHJldHVybiB7Qm91bmRGaWVsZH0gYSBCb3VuZEZpZWxkIGZvciB0aGUgZmllbGQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5ib3VuZEZpZWxkID0gZnVuY3Rpb24obmFtZSkge1xuICBpZiAoIW9iamVjdC5oYXNPd24odGhpcy5maWVsZHMsIG5hbWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX2Zvcm1OYW1lKCkgKyBcIiBkb2VzIG5vdCBoYXZlIGEgJ1wiICsgbmFtZSArIFwiJyBmaWVsZC5cIilcbiAgfVxuICByZXR1cm4gbmV3IEJvdW5kRmllbGQodGhpcywgdGhpcy5maWVsZHNbbmFtZV0sIG5hbWUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJvdW5kRmllbGQgZm9yIGVhY2ggZmllbGQgaW4gdGhlIGZvcm0sIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aGVcbiAqIGZpZWxkcyB3ZXJlIGNyZWF0ZWQuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKEZpZWxkLCBzdHJpbmcpPX0gdGVzdCBpZiBwcm92aWRlZCwgdGhpcyBmdW5jdGlvbiB3aWxsIGJlXG4gKiAgIGNhbGxlZCB3aXRoIGZpZWxkIGFuZCBuYW1lIGFyZ3VtZW50cyAtIEJvdW5kRmllbGRzIHdpbGwgb25seSBiZSBnZW5lcmF0ZWRcbiAqICAgZm9yIGZpZWxkcyBmb3Igd2hpY2ggdHJ1ZSBpcyByZXR1cm5lZC5cbiAqIEByZXR1cm4ge0FycmF5LjxCb3VuZEZpZWxkPn0gYSBsaXN0IG9mIEJvdW5kRmllbGQgb2JqZWN0cy5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmJvdW5kRmllbGRzID0gZnVuY3Rpb24odGVzdCkge1xuICB2YXIgYmZzID0gW11cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB2YXIgZmllbGROYW1lID0gZmllbGROYW1lc1tpXVxuICAgIGlmICghdGVzdCB8fCB0ZXN0KHRoaXMuZmllbGRzW2ZpZWxkTmFtZV0sIGZpZWxkTmFtZSkpIHtcbiAgICAgIGJmcy5wdXNoKG5ldyBCb3VuZEZpZWxkKHRoaXMsIHRoaXMuZmllbGRzW2ZpZWxkTmFtZV0sIGZpZWxkTmFtZSkpXG4gICAgfVxuICB9XG4gIHJldHVybiBiZnNcbn1cblxuLyoqXG4gKiBMaWtlIGJvdW5kRmllbGRzKCksIGJ1dCByZXR1cm5zIGEgbmFtZSAtPiBCb3VuZEZpZWxkIG9iamVjdCBpbnN0ZWFkLlxuICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsIEJvdW5kRmllbGQ+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuYm91bmRGaWVsZHNPYmogPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJmcyA9IHt9XG4gIHZhciBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXModGhpcy5maWVsZHMpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZmllbGROYW1lcy5sZW5ndGg7IGkgPCBsIDsgaSsrKSB7XG4gICAgdmFyIGZpZWxkTmFtZSA9IGZpZWxkTmFtZXNbaV1cbiAgICBiZnNbZmllbGROYW1lXSA9IG5ldyBCb3VuZEZpZWxkKHRoaXMsIHRoaXMuZmllbGRzW2ZpZWxkTmFtZV0sIGZpZWxkTmFtZSlcbiAgfVxuICByZXR1cm4gYmZzXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBCb3VuZEZpZWxkIG9iamVjdHMgdGhhdCBjb3JyZXNwb25kIHRvIGhpZGRlblxuICogZmllbGRzLiBVc2VmdWwgZm9yIG1hbnVhbCBmb3JtIGxheW91dC5cbiAqIEByZXR1cm4ge0FycmF5LjxCb3VuZEZpZWxkPn1cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmhpZGRlbkZpZWxkcyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5ib3VuZEZpZWxkcyhmdW5jdGlvbihmaWVsZCkge1xuICAgIHJldHVybiBmaWVsZC53aWRnZXQuaXNIaWRkZW5cbiAgfSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBCb3VuZEZpZWxkIG9iamVjdHMgdGhhdCBkbyBub3QgY29ycmVzcG9uZCB0byBoaWRkZW4gZmllbGRzLlxuICogVGhlIG9wcG9zaXRlIG9mIHRoZSBoaWRkZW5GaWVsZHMoKSBtZXRob2QuXG4gKiBAcmV0dXJuIHtBcnJheS48Qm91bmRGaWVsZD59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS52aXNpYmxlRmllbGRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmJvdW5kRmllbGRzKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgcmV0dXJuICFmaWVsZC53aWRnZXQuaXNIaWRkZW5cbiAgfSlcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEVycm9ycyA9PT1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBjb250ZW50IG9mIHRoaXMuX2Vycm9ycy5cbiAqIFRoZSBmaWVsZCBhcmd1bWVudCBpcyB0aGUgbmFtZSBvZiB0aGUgZmllbGQgdG8gd2hpY2ggdGhlIGVycm9ycyBzaG91bGQgYmVcbiAqIGFkZGVkLiBJZiBpdHMgdmFsdWUgaXMgbnVsbCB0aGUgZXJyb3JzIHdpbGwgYmUgdHJlYXRlZCBhcyBOT05fRklFTERfRVJST1JTLlxuICogVGhlIGVycm9yIGFyZ3VtZW50IGNhbiBiZSBhIHNpbmdsZSBlcnJvciwgYSBsaXN0IG9mIGVycm9ycywgb3IgYW4gb2JqZWN0IHRoYXRcbiAqIG1hcHMgZmllbGQgbmFtZXMgdG8gbGlzdHMgb2YgZXJyb3JzLiBXaGF0IHdlIGRlZmluZSBhcyBhbiBcImVycm9yXCIgY2FuIGJlXG4gKiBlaXRoZXIgYSBzaW1wbGUgc3RyaW5nIG9yIGFuIGluc3RhbmNlIG9mIFZhbGlkYXRpb25FcnJvciB3aXRoIGl0cyBtZXNzYWdlXG4gKiBhdHRyaWJ1dGUgc2V0IGFuZCB3aGF0IHdlIGRlZmluZSBhcyBsaXN0IG9yIG9iamVjdCBjYW4gYmUgYW4gYWN0dWFsIGxpc3Qgb3JcbiAqIG9iamVjdCBvciBhbiBpbnN0YW5jZSBvZiBWYWxpZGF0aW9uRXJyb3Igd2l0aCBpdHMgZXJyb3JMaXN0IG9yIGVycm9yT2JqXG4gKiBwcm9wZXJ0eSBzZXQuXG4gKiBJZiBlcnJvciBpcyBhbiBvYmplY3QsIHRoZSBmaWVsZCBhcmd1bWVudCAqbXVzdCogYmUgbnVsbCBhbmQgZXJyb3JzIHdpbGwgYmVcbiAqIGFkZGVkIHRvIHRoZSBmaWVsZHMgdGhhdCBjb3JyZXNwb25kIHRvIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3QuXG4gKiBAcGFyYW0gez9zdHJpbmd9IGZpZWxkIHRoZSBuYW1lIG9mIGEgZm9ybSBmaWVsZC5cbiAqIEBwYXJhbSB7KHN0cmluZ3xWYWxpZGF0aW9uRXJyb3J8QXJyYXkuPChzdHJpbmd8VmFsaWRhdGlvbkVycm9yKT58T2JqZWN0PHN0cmluZywoc3RyaW5nfFZhbGlkYXRpb25FcnJvcnxBcnJheS48KHN0cmluZ3xWYWxpZGF0aW9uRXJyb3IpPikpfSBlcnJvclxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuYWRkRXJyb3IgPSBmdW5jdGlvbihmaWVsZCwgZXJyb3IpIHtcbiAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7XG4gICAgLy8gTm9ybWFsaXNlIHRvIFZhbGlkYXRpb25FcnJvciBhbmQgbGV0IGl0cyBjb25zdHJ1Y3RvciBkbyB0aGUgaGFyZCB3b3JrIG9mXG4gICAgLy8gbWFraW5nIHNlbnNlIG9mIHRoZSBpbnB1dC5cbiAgICBlcnJvciA9IFZhbGlkYXRpb25FcnJvcihlcnJvcilcbiAgfVxuXG4gIGlmIChvYmplY3QuaGFzT3duKGVycm9yLCAnZXJyb3JPYmonKSkge1xuICAgIGlmIChmaWVsZCAhPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlICdmaWVsZCcgYXJndW1lbnQgdG8gZm9ybS5hZGRFcnJvcigpIG11c3QgYmUgbnVsbCB3aGVuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICBcInRoZSAnZXJyb3InIGFyZ3VtZW50IGNvbnRhaW5zIGVycm9ycyBmb3IgbXVsdGlwbGUgZmllbGRzLlwiKVxuICAgIH1cbiAgICBlcnJvciA9IGVycm9yLmVycm9yT2JqXG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIGVycm9yTGlzdCA9IGVycm9yLmVycm9yTGlzdFxuICAgIGVycm9yID0ge31cbiAgICBlcnJvcltmaWVsZCB8fCBOT05fRklFTERfRVJST1JTXSA9IGVycm9yTGlzdFxuICB9XG5cbiAgdmFyIGZpZWxkcyA9IE9iamVjdC5rZXlzKGVycm9yKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBmaWVsZCA9IGZpZWxkc1tpXVxuICAgIGVycm9yTGlzdCA9IGVycm9yW2ZpZWxkXVxuICAgIGlmICghdGhpcy5fZXJyb3JzLmhhc0ZpZWxkKGZpZWxkKSkge1xuICAgICAgaWYgKGZpZWxkICE9PSBOT05fRklFTERfRVJST1JTICYmICFvYmplY3QuaGFzT3duKHRoaXMuZmllbGRzLCBmaWVsZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX2Zvcm1OYW1lKCkgKyBcIiBoYXMgbm8gZmllbGQgbmFtZWQgJ1wiICsgZmllbGQgKyBcIidcIilcbiAgICAgIH1cbiAgICAgIHRoaXMuX2Vycm9ycy5zZXQoZmllbGQsIG5ldyB0aGlzLmVycm9yQ29uc3RydWN0b3IoKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBGaWx0ZXIgb3V0IGFueSBlcnJvciBtZXNzYWdlcyB3aGljaCBhcmUgZHVwbGljYXRlcyBvZiBleGlzdGluZ1xuICAgICAgLy8gbWVzc2FnZXMuIFRoaXMgY2FuIGhhcHBlbiBpZiBvbkNoYW5nZSB2YWxpZGF0aW9uIHdoaWNoIHVzZXMgYWRkRXJyb3IoKVxuICAgICAgLy8gaXMgZmlyZWQgcmVwZWF0ZWRseSBhbmQgaXMgYWRkaW5nIGFuIGVycm9yIG1lc3NhZ2UgdG8gYSBmaWVsZCBvdGhlclxuICAgICAgLy8gdGhlbiB0aGUgb25lIGJlaW5nIGNoYW5nZWQuXG4gICAgICB2YXIgbWVzc2FnZUxvb2t1cCA9IG9iamVjdC5sb29rdXAodGhpcy5fZXJyb3JzLmdldChmaWVsZCkubWVzc2FnZXMoKSlcbiAgICAgIHZhciBuZXdNZXNzYWdlcyA9IEVycm9yTGlzdChlcnJvckxpc3QpLm1lc3NhZ2VzKClcbiAgICAgIGZvciAodmFyIGogPSBlcnJvckxpc3QubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VMb29rdXBbbmV3TWVzc2FnZXNbal1dKSB7XG4gICAgICAgICAgZXJyb3JMaXN0LnNwbGljZShqLCAxKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVycm9yTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9lcnJvcnMuZ2V0KGZpZWxkKS5leHRlbmQoZXJyb3JMaXN0KVxuICAgIH1cblxuICAgIGlmIChvYmplY3QuaGFzT3duKHRoaXMuY2xlYW5lZERhdGEsIGZpZWxkKSkge1xuICAgICAgZGVsZXRlIHRoaXMuY2xlYW5lZERhdGFbZmllbGRdXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0dGVyIGZvciBlcnJvcnMsIHdoaWNoIGZpcnN0IGNsZWFucyB0aGUgZm9ybSBpZiB0aGVyZSBhcmUgbm8gZXJyb3JzXG4gKiBkZWZpbmVkIHlldC5cbiAqIEBwYXJhbSB7c3RyaW5nPX0gbmFtZSBpZiBnaXZlbiwgZXJyb3JzIGZvciB0aGlzIGZpZWxkIG5hbWUgd2lsbCBiZSByZXR1cm5lZFxuICogICBpbnN0ZWFkIG9mIHRoZSBmdWxsIGVycm9yIG9iamVjdC5cbiAqIEByZXR1cm4ge0Vycm9yT2JqZWN0fEVycm9yTGlzdH0gZm9ybSBvciBmaWVsZCBlcnJvcnNcbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmVycm9ycyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgaWYgKHRoaXMuX2Vycm9ycyA9PT0gbnVsbCkge1xuICAgIHRoaXMuZnVsbENsZWFuKClcbiAgfVxuICBpZiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLl9lcnJvcnMuZ2V0KG5hbWUpXG4gIH1cbiAgcmV0dXJuIHRoaXMuX2Vycm9yc1xufVxuXG4vKipcbiAqIEByZXR1cm4ge0Vycm9yT2JqZWN0fSBlcnJvcnMgdGhhdCBhcmVuJ3QgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhciBmaWVsZCAtXG4gKiAgIGkuZS4sIGVycm9ycyBnZW5lcmF0ZWQgYnkgY2xlYW4oKS4gV2lsbCBiZSBlbXB0eSBpZiB0aGVyZSBhcmUgbm9uZS5cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLm5vbkZpZWxkRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5lcnJvcnMoTk9OX0ZJRUxEX0VSUk9SUykgfHwgbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcigpKVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYW55IHZhbGlkYXRpb24gZXJyb3JzIHByZXNlbnQgZm9yIHRoZSBnaXZlbiBmb3JtIGZpZWxkcy4gSWYgdmFsaWRhdGlvblxuICogaGFzIG5vdCBiZWVuIHBlcmZvcm1lZCB5ZXQsIGluaXRpYWxpc2VzIHRoZSBlcnJvcnMgb2JqZWN0LlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gZmllbGRzIGZpZWxkIG5hbWVzLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuX3JlbW92ZUVycm9ycyA9IGZ1bmN0aW9uKGZpZWxkcykge1xuICBpZiAodGhpcy5fZXJyb3JzID09PSBudWxsKSB7XG4gICAgdGhpcy5fZXJyb3JzID0gRXJyb3JPYmplY3QoKVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIFRPRE8gdXNlIGNsZWFuLmZpZWxkcyBpZiBhdmFpbGFibGVcbiAgICB0aGlzLl9lcnJvcnMucmVtb3ZlKE5PTl9GSUVMRF9FUlJPUlMpXG4gICAgdGhpcy5fZXJyb3JzLnJlbW92ZUFsbChmaWVsZHMpXG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gQ2hhbmdlcyA9PT1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIGZpZWxkcyBoYXZlIGNoYW5nZWQgZnJvbSBpbml0aWFsIGZvcm0gZGF0YS5cbiAqIEBwYXJhbSB7Ym9vbGVhbj19IF9oYXNDaGFuZ2VkQ2hlY2sgaWYgdHJ1ZSwgdGhlIG1ldGhvZCBpcyBvbmx5IGJlaW5nIHJ1biB0b1xuICogICBkZXRlcm1pbmUgaWYgYW55IGZpZWxkcyBoYXZlIGNoYW5nZWQsIG5vdCB0byBnZXQgdGhlIGxpc3Qgb2YgZmllbGRzLlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz58Ym9vbGVhbn0gYSBsaXN0IG9mIGNoYW5nZWQgZmllbGQgbmFtZXMgb3IgdHJ1ZSBpZlxuICogICBvbmx5IGNoZWNraW5nIGZvciBjaGFuZ2VzIGFuZCBvbmUgaXMgZm91bmQuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5jaGFuZ2VkRGF0YSA9IGZ1bmN0aW9uKF9oYXNDaGFuZ2VkQ2hlY2spIHtcbiAgdmFyIGNoYW5nZWREYXRhID0gW11cbiAgdmFyIGluaXRpYWxWYWx1ZVxuICAvLyBYWFg6IEZvciBub3cgd2UncmUgYXNraW5nIHRoZSBpbmRpdmlkdWFsIGZpZWxkcyB3aGV0aGVyIG9yIG5vdFxuICAvLyB0aGUgZGF0YSBoYXMgY2hhbmdlZC4gSXQgd291bGQgcHJvYmFibHkgYmUgbW9yZSBlZmZpY2llbnQgdG8gaGFzaFxuICAvLyB0aGUgaW5pdGlhbCBkYXRhLCBzdG9yZSBpdCBpbiBhIGhpZGRlbiBmaWVsZCwgYW5kIGNvbXBhcmUgYSBoYXNoXG4gIC8vIG9mIHRoZSBzdWJtaXR0ZWQgZGF0YSwgYnV0IHdlJ2QgbmVlZCBhIHdheSB0byBlYXNpbHkgZ2V0IHRoZVxuICAvLyBzdHJpbmcgdmFsdWUgZm9yIGEgZ2l2ZW4gZmllbGQuIFJpZ2h0IG5vdywgdGhhdCBsb2dpYyBpcyBlbWJlZGRlZFxuICAvLyBpbiB0aGUgcmVuZGVyIG1ldGhvZCBvZiBlYWNoIGZpZWxkJ3Mgd2lkZ2V0LlxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuZmllbGRzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbCA7IGkrKykge1xuICAgIHZhciBuYW1lID0gZmllbGROYW1lc1tpXVxuICAgIHZhciBmaWVsZCA9IHRoaXMuZmllbGRzW25hbWVdXG4gICAgdmFyIHByZWZpeGVkTmFtZSA9IHRoaXMuYWRkUHJlZml4KG5hbWUpXG4gICAgdmFyIGRhdGFWYWx1ZSA9IGZpZWxkLndpZGdldC52YWx1ZUZyb21EYXRhKHRoaXMuZGF0YSwgdGhpcy5maWxlcywgcHJlZml4ZWROYW1lKVxuICAgIGlmICghZmllbGQuc2hvd0hpZGRlbkluaXRpYWwpIHtcbiAgICAgIGluaXRpYWxWYWx1ZSA9IG9iamVjdC5nZXQodGhpcy5pbml0aWFsLCBuYW1lLCBmaWVsZC5pbml0aWFsKVxuICAgICAgaWYgKGlzLkZ1bmN0aW9uKGluaXRpYWxWYWx1ZSkpIHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlKClcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgaW5pdGlhbFByZWZpeGVkTmFtZSA9IHRoaXMuYWRkSW5pdGlhbFByZWZpeChuYW1lKVxuICAgICAgdmFyIGhpZGRlbldpZGdldCA9IG5ldyBmaWVsZC5oaWRkZW5XaWRnZXQoKVxuICAgICAgdHJ5IHtcbiAgICAgICAgaW5pdGlhbFZhbHVlID0gaGlkZGVuV2lkZ2V0LnZhbHVlRnJvbURhdGEoXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLCB0aGlzLmZpbGVzLCBpbml0aWFsUHJlZml4ZWROYW1lKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHsgdGhyb3cgZSB9XG4gICAgICAgIC8vIEFsd2F5cyBhc3N1bWUgZGF0YSBoYXMgY2hhbmdlZCBpZiB2YWxpZGF0aW9uIGZhaWxzXG4gICAgICAgIGlmIChfaGFzQ2hhbmdlZENoZWNrKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBjaGFuZ2VkRGF0YS5wdXNoKG5hbWUpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChmaWVsZC5faGFzQ2hhbmdlZChpbml0aWFsVmFsdWUsIGRhdGFWYWx1ZSkpIHtcbiAgICAgIGlmIChfaGFzQ2hhbmdlZENoZWNrKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICBjaGFuZ2VkRGF0YS5wdXNoKG5hbWUpXG4gICAgfVxuICB9XG4gIGlmIChfaGFzQ2hhbmdlZENoZWNrKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoYW5nZWREYXRhXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBpbnB1dCBkYXRhIGRpZmZlcnMgZnJvbSBpbml0aWFsIGRhdGEuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5oYXNDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2xhc3RIYXNDaGFuZ2VkID0gdGhpcy5jaGFuZ2VkRGF0YSh0cnVlKVxuICByZXR1cm4gdGhpcy5fbGFzdEhhc0NoYW5nZWRcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFN0YXR1cyA9PT1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3JtIG5lZWRzIGEgY2FsbGJhY2sgYXJndW1lbnQgZm9yIGZpbmFsXG4gKiAgIHZhbGlkYXRpb24uXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5pc0FzeW5jID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNsZWFuLmxlbmd0aCA9PSAxKSB7IHJldHVybiB0cnVlIH1cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB2YXIgY3VzdG9tQ2xlYW4gPSB0aGlzLl9nZXRDdXN0b21DbGVhbihmaWVsZE5hbWVzW2ldKVxuICAgIGlmIChpcy5GdW5jdGlvbihjdXN0b21DbGVhbikgJiYgY3VzdG9tQ2xlYW4ubGVuZ3RoID09IDEpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYWxsIHJlcXVpcmVkIGZpZWxkcyBoYXZlIGJlZW4gY29tcGxldGVkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuaXNWYWxpZCgpIHx8IHRoaXMuaXNQZW5kaW5nKCkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuZmllbGRzKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGZpZWxkTmFtZSA9IGZpZWxkTmFtZXNbaV1cbiAgICBpZiAodGhpcy5maWVsZHNbZmllbGROYW1lXS5yZXF1aXJlZCAmJlxuICAgICAgICB0eXBlb2YgdGhpcy5jbGVhbmVkRGF0YVtmaWVsZE5hbWVdID09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3JtIG5lZWRzIHRvIGJlIG11bHRpcGFydC1lbmNvZGVkLCBpbiBvdGhlclxuICogICB3b3JkcywgaWYgaXQgaGFzIGEgRmlsZUZpZWxkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNNdWx0aXBhcnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpZWxkcylcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWVsZE5hbWVzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICBpZiAodGhpcy5maWVsZHNbZmllbGROYW1lc1tpXV0ud2lkZ2V0Lm5lZWRzTXVsdGlwYXJ0Rm9ybSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZm9ybSBpcyB3YWl0aW5nIGZvciBhc3luYyB2YWxpZGF0aW9uIHRvXG4gKiAgIGNvbXBsZXRlLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhaXMuRW1wdHkodGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbilcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3JtIGRvZXNuJ3QgaGF2ZSBhbnkgZXJyb3JzLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gIXRoaXMuZXJyb3JzKCkuaXNQb3B1bGF0ZWQoKVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZvcm0gaXMgd2FpdGluZyBmb3IgYXN5bmMgdmFsaWRhdGlvbiBvZiBpdHNcbiAqICAgY2xlYW4oKSBtZXRob2QgdG8gY29tcGxldGUuXG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5ub25GaWVsZFBlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHR5cGVvZiB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW05PTl9GSUVMRF9FUlJPUlNdICE9ICd1bmRlZmluZWQnXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGlzIGZvcm0gaXMgYWxsb3dlZCB0byBiZSBlbXB0eSBhbmQgaWYgaW5wdXQgZGF0YVxuICogICBkaWZmZXJzIGZyb20gaW5pdGlhbCBkYXRhLiBUaGlzIGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSB3aGVuIHJlcXVpcmVkXG4gKiAgIGZpZWxkcyBpbiBhbiBleHRyYSBGb3JtU2V0IGZvcm0gYmVjb21lIHRydWx5IHJlcXVpcmVkLlxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUubm90RW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLmVtcHR5UGVybWl0dGVkICYmIHRoaXMuX2xhc3RIYXNDaGFuZ2VkID09PSB0cnVlKVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFByZWZpeGVzID09PVxuXG4vKipcbiAqIEFkZHMgYW4gaW5pdGlhbCBwcmVmaXggZm9yIGNoZWNraW5nIGR5bmFtaWMgaW5pdGlhbCB2YWx1ZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gZmllbGROYW1lIGEgZmllbGQgbmFtZS5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmFkZEluaXRpYWxQcmVmaXggPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgcmV0dXJuICdpbml0aWFsLScgKyB0aGlzLmFkZFByZWZpeChmaWVsZE5hbWUpXG59XG5cbi8qKlxuICogUHJlcGVuZHMgYSBwcmVmaXggdG8gYSBmaWVsZCBuYW1lIGlmIHRoaXMgZm9ybSBoYXMgb25lIHNldC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWVsZE5hbWUgYSBmb3JtIGZpZWxkIG5hbWUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBmaWVsZCBuYW1lIHdpdGggYSBwcmVmaXggcHJlcGVuZGVkIGlmIHRoaXMgZm9ybSBoYXMgYVxuICogICBwcmVmaXggc2V0LCBvdGhlcndpc2UgdGhlIGZpZWxkIG5hbWUgYXMtaXMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5hZGRQcmVmaXggPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgaWYgKHRoaXMucHJlZml4ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcmVmaXggKyAnLScgKyBmaWVsZE5hbWVcbiAgfVxuICByZXR1cm4gZmllbGROYW1lXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmllbGQgd2l0aCBhIHByZWZpeC1zaXplIGNodW5rIGNob3BwZWQgb2ZmIHRoZSBzdGFydCBpZiB0aGlzXG4gKiBmb3JtIGhhcyBhIHByZWZpeCBzZXQgYW5kIHRoZSBmaWVsZCBuYW1lIHN0YXJ0cyB3aXRoIGl0LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkTmFtZSBhIGZpZWxkIG5hbWUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5yZW1vdmVQcmVmaXggPSBmdW5jdGlvbihmaWVsZE5hbWUpIHtcbiAgaWYgKHRoaXMucHJlZml4ICE9PSBudWxsICYmIGZpZWxkTmFtZS5pbmRleE9mKHRoaXMucHJlZml4ICsgJy0nKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZpZWxkTmFtZS5zdWJzdHJpbmcodGhpcy5wcmVmaXgubGVuZ3RoICsgMSlcbiAgfVxuICByZXR1cm4gZmllbGROYW1lXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHZlcnNpb24gb2YgdGhlIGdpdmVuIGRhdGEgb2JqZWN0IHdpdGggcHJlZml4ZXMgcmVtb3ZlZCBmcm9tIHRoZVxuICogcHJvcGVydHkgbmFtZXMgaWYgdGhpcyBmb3JtIGhhcyBhIHByZWZpeCwgb3RoZXJ3aXNlIHJldHVybnMgdGhlIG9iamVjdFxuICogaXRzZWxmLlxuICogQHBhcmFtIHtvYmplY3QuPHN0cmluZywqPn0gZGF0YVxuICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsKj59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5fZGVwcmVmaXhEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICBpZiAodGhpcy5wcmVmaXggPT09IG51bGwpIHsgcmV0dXJuIGRhdGEgfVxuICB2YXIgcHJlZml4ZWREYXRhID0ge31cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyhkYXRhKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcHJlZml4ZWREYXRhW3RoaXMucmVtb3ZlUHJlZml4KGZpZWxkTmFtZXNbaV0pXSA9IGRhdGFbZmllbGROYW1lc1tpXV1cbiAgfVxuICByZXR1cm4gcHJlZml4ZWREYXRhXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHZlcnNpb24gb2YgdGhlIGdpdmVuIGRhdGEgb2JqZWN0IHdpdGggcHJlZml4ZXMgYWRkZWQgdG8gdGhlXG4gKiBwcm9wZXJ0eSBuYW1lcyBpZiB0aGlzIGZvcm0gaGFzIGEgcHJlZml4LCBvdGhlcndpc2UgcmV0dXJucyB0aGUgb2JqZWN0XG4gKiBpdHNlbGYuXG4gKiBAcGFyYW0ge29iamVjdC48c3RyaW5nLCo+fSBkYXRhXG4gKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZywqPn1cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLl9wcmVmaXhEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICBpZiAodGhpcy5wcmVmaXggPT09IG51bGwpIHsgcmV0dXJuIGRhdGEgfVxuICB2YXIgcHJlZml4ZWREYXRhID0ge31cbiAgdmFyIGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyhkYXRhKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZpZWxkTmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcHJlZml4ZWREYXRhW3RoaXMuYWRkUHJlZml4KGZpZWxkTmFtZXNbaV0pXSA9IGRhdGFbZmllbGROYW1lc1tpXV1cbiAgfVxuICByZXR1cm4gcHJlZml4ZWREYXRhXG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gRGVmYXVsdCBSZW5kZXJpbmcgPT09XG5cbi8qKlxuICogRGVmYXVsdCByZW5kZXIgbWV0aG9kLCB3aGljaCBqdXN0IGNhbGxzIGFzVGFibGUoKS5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmFzVGFibGUoKVxufVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZvcm0ncyBmaWVsZHMsIHZhbGlkYXRpb24gbWVzc2FnZXMsIGFzeW5jIGJ1c3kgaW5kaWNhdG9ycyBhbmRcbiAqIGhpZGRlbiBmaWVsZHMgYXMgYSBsaXN0IG9mIDx0cj5zLlxuICogQHJldHVybiB7QXJyYXkuPFJlYWN0RWxlbWVudD59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5hc1RhYmxlID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBub3JtYWxSb3coa2V5LCBjc3NDbGFzc2VzLCBsYWJlbCwgZmllbGQsIHBlbmRpbmcsIGhlbHBUZXh0LCBlcnJvcnMsIGV4dHJhQ29udGVudCkge1xuICAgIHZhciBjb250ZW50cyA9IFtdXG4gICAgaWYgKGVycm9ycykgeyBjb250ZW50cy5wdXNoKGVycm9ycykgfVxuICAgIGNvbnRlbnRzLnB1c2goZmllbGQpXG4gICAgaWYgKHBlbmRpbmcpIHtcbiAgICAgIGNvbnRlbnRzLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudCgnYnInLCBudWxsKSlcbiAgICAgIGNvbnRlbnRzLnB1c2gocGVuZGluZylcbiAgICB9XG4gICAgaWYgKGhlbHBUZXh0KSB7XG4gICAgICBjb250ZW50cy5wdXNoKFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2JyJywgbnVsbCkpXG4gICAgICBjb250ZW50cy5wdXNoKGhlbHBUZXh0KVxuICAgIH1cbiAgICBpZiAoZXh0cmFDb250ZW50KSB7IGNvbnRlbnRzLnB1c2guYXBwbHkoY29udGVudHMsIGV4dHJhQ29udGVudCkgfVxuICAgIHZhciByb3dBdHRycyA9IHtrZXk6IGtleX1cbiAgICBpZiAoY3NzQ2xhc3NlcykgeyByb3dBdHRycy5jbGFzc05hbWUgPSBjc3NDbGFzc2VzIH1cbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgndHInLCByb3dBdHRyc1xuICAgICwgUmVhY3QuY3JlYXRlRWxlbWVudCgndGgnLCBudWxsLCBsYWJlbClcbiAgICAsIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3RkJywgbnVsbCwgY29udGVudHMpXG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gZXJyb3JSb3coa2V5LCBlcnJvcnMsIGV4dHJhQ29udGVudCwgY3NzQ2xhc3Nlcykge1xuICAgIHZhciBjb250ZW50cyA9IFtdXG4gICAgaWYgKGVycm9ycykgeyBjb250ZW50cy5wdXNoKGVycm9ycykgfVxuICAgIGlmIChleHRyYUNvbnRlbnQpIHsgY29udGVudHMucHVzaC5hcHBseShjb250ZW50cywgZXh0cmFDb250ZW50KSB9XG4gICAgdmFyIHJvd0F0dHJzID0ge2tleToga2V5fVxuICAgIGlmIChjc3NDbGFzc2VzKSB7IHJvd0F0dHJzLmNsYXNzTmFtZSA9IGNzc0NsYXNzZXMgfVxuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCd0cicsIHJvd0F0dHJzXG4gICAgLCBSZWFjdC5jcmVhdGVFbGVtZW50KCd0ZCcsIHtjb2xTcGFuOiAyfSwgY29udGVudHMpXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5faHRtbE91dHB1dChub3JtYWxSb3csIGVycm9yUm93KSB9XG59KSgpXG5cbi8qKlxuICogUmVuZGVycyB0aGUgZm9ybSdzIGZpZWxkcywgdmFsaWRhdGlvbiBtZXNzYWdlcywgYXN5bmMgYnVzeSBpbmRpY2F0b3JzIGFuZFxuICogaGlkZGVuIGZpZWxkcyBhcyBhIGxpc3Qgb2YgPGxpPnMuXG4gKiBAcmV0dXJuIHtBcnJheS48UmVhY3RFbGVtZW50Pn1cbiAqL1xuQmFzZUZvcm0ucHJvdG90eXBlLmFzVWwgPSBfc2luZ2xlRWxlbWVudFJvdyhSZWFjdC5jcmVhdGVGYWN0b3J5KCdsaScpKVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGZvcm0ncyBmaWVsZHMsIHZhbGlkYXRpb24gbWVzc2FnZXMsIGFzeW5jIGJ1c3kgaW5kaWNhdG9ycyBhbmRcbiAqIGhpZGRlbiBmaWVsZHMgYXMgYSBsaXN0IG9mIDxkaXY+cy5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybS5wcm90b3R5cGUuYXNEaXYgPSBfc2luZ2xlRWxlbWVudFJvdyhSZWFjdC5jcmVhdGVGYWN0b3J5KCdkaXYnKSlcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIG91dHB1dHRpbmcgSFRNTC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG5vcm1hbFJvdyBhIGZ1bmN0aW9uIHdoaWNoIHByb2R1Y2VzIGEgbm9ybWFsIHJvdy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGVycm9yUm93IGEgZnVuY3Rpb24gd2hpY2ggcHJvZHVjZXMgYW4gZXJyb3Igcm93LlxuICogQHJldHVybiB7QXJyYXkuPFJlYWN0RWxlbWVudD59XG4gKi9cbkJhc2VGb3JtLnByb3RvdHlwZS5faHRtbE91dHB1dCA9IGZ1bmN0aW9uKG5vcm1hbFJvdywgZXJyb3JSb3cpIHtcbiAgdmFyIGJmXG4gIHZhciBiZkVycm9yc1xuICB2YXIgdG9wRXJyb3JzID0gdGhpcy5ub25GaWVsZEVycm9ycygpIC8vIEVycm9ycyB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgYWJvdmUgYWxsIGZpZWxkc1xuXG4gIHZhciBoaWRkZW5GaWVsZHMgPSBbXVxuICB2YXIgaGlkZGVuQm91bmRGaWVsZHMgPSB0aGlzLmhpZGRlbkZpZWxkcygpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaGlkZGVuQm91bmRGaWVsZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgYmYgPSBoaWRkZW5Cb3VuZEZpZWxkc1tpXVxuICAgIGJmRXJyb3JzID0gYmYuZXJyb3JzKClcbiAgICBpZiAoYmZFcnJvcnMuaXNQb3B1bGF0ZWQpIHtcbiAgICAgIHRvcEVycm9ycy5leHRlbmQoYmZFcnJvcnMubWVzc2FnZXMoKS5tYXAoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuICcoSGlkZGVuIGZpZWxkICcgKyBiZi5uYW1lICsgJykgJyArIGVycm9yXG4gICAgICB9KSlcbiAgICB9XG4gICAgaGlkZGVuRmllbGRzLnB1c2goYmYucmVuZGVyKCkpXG4gIH1cblxuICB2YXIgcm93cyA9IFtdXG4gIHZhciBlcnJvcnNcbiAgdmFyIGxhYmVsXG4gIHZhciBwZW5kaW5nXG4gIHZhciBoZWxwVGV4dFxuICB2YXIgZXh0cmFDb250ZW50XG4gIHZhciB2aXNpYmxlQm91bmRGaWVsZHMgPSB0aGlzLnZpc2libGVGaWVsZHMoKVxuICBmb3IgKGkgPSAwLCBsID0gdmlzaWJsZUJvdW5kRmllbGRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGJmID0gdmlzaWJsZUJvdW5kRmllbGRzW2ldXG4gICAgYmZFcnJvcnMgPSBiZi5lcnJvcnMoKVxuXG4gICAgLy8gVmFyaWFibGVzIHdoaWNoIGNhbiBiZSBvcHRpb25hbCBpbiBlYWNoIHJvd1xuICAgIGVycm9ycyA9IChiZkVycm9ycy5pc1BvcHVsYXRlZCgpID8gYmZFcnJvcnMucmVuZGVyKCkgOiBudWxsKVxuICAgIGxhYmVsID0gKGJmLmxhYmVsID8gYmYubGFiZWxUYWcoKSA6IG51bGwpXG4gICAgcGVuZGluZyA9IChiZi5pc1BlbmRpbmcoKSA/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3Byb2dyZXNzJywgbnVsbCwgJy4uLicpIDogbnVsbClcbiAgICBoZWxwVGV4dCA9IGJmLmhlbHBUZXh0VGFnKClcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHJvdywgaXQgc2hvdWxkIGluY2x1ZGUgYW55IGhpZGRlbiBmaWVsZHNcbiAgICBleHRyYUNvbnRlbnQgPSAoaSA9PSBsIC0gMSAmJiBoaWRkZW5GaWVsZHMubGVuZ3RoID4gMCA/IGhpZGRlbkZpZWxkcyA6IG51bGwpXG5cbiAgICByb3dzLnB1c2gobm9ybWFsUm93KGJmLmh0bWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmYuY3NzQ2xhc3NlcygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBiZi5yZW5kZXIoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlbmRpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWxwVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhQ29udGVudCkpXG4gIH1cblxuICBpZiAodG9wRXJyb3JzLmlzUG9wdWxhdGVkKCkpIHtcbiAgICAvLyBBZGQgaGlkZGVuIGZpZWxkcyB0byB0aGUgdG9wIGVycm9yIHJvdyBpZiBpdCdzIGJlaW5nIGRpc3BsYXllZCBhbmRcbiAgICAvLyB0aGVyZSBhcmUgbm8gb3RoZXIgcm93cy5cbiAgICBleHRyYUNvbnRlbnQgPSAoaGlkZGVuRmllbGRzLmxlbmd0aCA+IDAgJiYgcm93cy5sZW5ndGggPT09IDAgPyBoaWRkZW5GaWVsZHMgOiBudWxsKVxuICAgIHJvd3MudW5zaGlmdChlcnJvclJvdyh0aGlzLmFkZFByZWZpeChOT05fRklFTERfRVJST1JTKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wRXJyb3JzLnJlbmRlcigpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JSb3dDc3NDbGFzcykpXG4gIH1cblxuICAvLyBQdXQgYSBjcm9zcy1maWVsZCBwZW5kaW5nIGluZGljYXRvciBpbiBpdHMgb3duIHJvd1xuICBpZiAodGhpcy5ub25GaWVsZFBlbmRpbmcoKSkge1xuICAgIGV4dHJhQ29udGVudCA9IChoaWRkZW5GaWVsZHMubGVuZ3RoID4gMCAmJiByb3dzLmxlbmd0aCA9PT0gMCA/IGhpZGRlbkZpZWxkcyA6IG51bGwpXG4gICAgcm93cy5wdXNoKGVycm9yUm93KHRoaXMuYWRkUHJlZml4KCdfX3BlbmRpbmdfXycpLFxuICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwcm9ncmVzcycsIG51bGwsICcuLi4nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFDb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBlbmRpbmdSb3dDc3NDbGFzcykpXG4gIH1cblxuICAvLyBQdXQgaGlkZGVuIGZpZWxkcyBpbiB0aGVpciBvd24gcm93IGlmIHRoZXJlIHdlcmUgbm8gcm93cyB0byBkaXNwbGF5LlxuICBpZiAoaGlkZGVuRmllbGRzLmxlbmd0aCA+IDAgJiYgcm93cy5sZW5ndGggPT09IDApIHtcbiAgICByb3dzLnB1c2goZXJyb3JSb3codGhpcy5hZGRQcmVmaXgoJ19faGlkZGVuRmllbGRzX18nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgaGlkZGVuRmllbGRzLFxuICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGRlbkZpZWxkUm93Q3NzQ2xhc3MpKVxuICB9XG5cbiAgcmV0dXJuIHJvd3Ncbn1cblxuZnVuY3Rpb24gX25vcm1hbFJvdyhyZWFjdEVsLCBrZXksIGNzc0NsYXNzZXMsIGxhYmVsLCBmaWVsZCwgcGVuZGluZywgaGVscFRleHQsIGVycm9ycywgZXh0cmFDb250ZW50KSB7XG4gIHZhciByb3dBdHRycyA9IHtrZXk6IGtleX1cbiAgaWYgKGNzc0NsYXNzZXMpIHsgcm93QXR0cnMuY2xhc3NOYW1lID0gY3NzQ2xhc3NlcyB9XG4gIHZhciBjb250ZW50cyA9IFtyb3dBdHRyc11cbiAgaWYgKGVycm9ycykgeyBjb250ZW50cy5wdXNoKGVycm9ycykgfVxuICBpZiAobGFiZWwpIHsgY29udGVudHMucHVzaChsYWJlbCkgfVxuICBjb250ZW50cy5wdXNoKCcgJylcbiAgY29udGVudHMucHVzaChmaWVsZClcbiAgaWYgKHBlbmRpbmcpIHtcbiAgICBjb250ZW50cy5wdXNoKCcgJylcbiAgICBjb250ZW50cy5wdXNoKHBlbmRpbmcpXG4gIH1cbiAgaWYgKGhlbHBUZXh0KSB7XG4gICAgY29udGVudHMucHVzaCgnICcpXG4gICAgY29udGVudHMucHVzaChoZWxwVGV4dClcbiAgfVxuICBpZiAoZXh0cmFDb250ZW50KSB7IGNvbnRlbnRzLnB1c2guYXBwbHkoY29udGVudHMsIGV4dHJhQ29udGVudCkgfVxuICByZXR1cm4gcmVhY3RFbC5hcHBseShudWxsLCBjb250ZW50cylcbn1cblxuZnVuY3Rpb24gX2Vycm9yUm93KHJlYWN0RWwsIGtleSwgZXJyb3JzLCBleHRyYUNvbnRlbnQsIGNzc0NsYXNzZXMpIHtcbiAgdmFyIHJvd0F0dHJzID0ge2tleToga2V5fVxuICBpZiAoY3NzQ2xhc3NlcykgeyByb3dBdHRycy5jbGFzc05hbWUgPSBjc3NDbGFzc2VzIH1cbiAgdmFyIGNvbnRlbnRzID0gW3Jvd0F0dHJzXVxuICBpZiAoZXJyb3JzKSB7IGNvbnRlbnRzLnB1c2goZXJyb3JzKSB9XG4gIGlmIChleHRyYUNvbnRlbnQpIHsgY29udGVudHMucHVzaC5hcHBseShjb250ZW50cywgZXh0cmFDb250ZW50KSB9XG4gIHJldHVybiByZWFjdEVsLmFwcGx5KG51bGwsIGNvbnRlbnRzKVxufVxuXG5mdW5jdGlvbiBfc2luZ2xlRWxlbWVudFJvdyhyZWFjdEVsKSB7XG4gIHZhciBub3JtYWxSb3cgPSBfbm9ybWFsUm93LmJpbmQobnVsbCwgcmVhY3RFbClcbiAgdmFyIGVycm9yUm93ID0gX2Vycm9yUm93LmJpbmQobnVsbCwgcmVhY3RFbClcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9odG1sT3V0cHV0KG5vcm1hbFJvdywgZXJyb3JSb3cpXG4gIH1cbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgXCJyb3dcIiBpbiBhIGZvcm0uIFRoaXMgY2FuIGNvbnRhaW4gbWFudWFsbHkgcHJvdmlkZWQgY29udGVudHMsIG9yXG4gKiBpZiBhIEJvdW5kRmllbGQgaXMgZ2l2ZW4sIGl0IHdpbGwgYmUgdXNlZCB0byBkaXNwbGF5IGEgZmllbGQncyBsYWJlbCwgd2lkZ2V0LFxuICogZXJyb3IgbWVzc2FnZShzKSwgaGVscCB0ZXh0IGFuZCBhc3luYyBwZW5kaW5nIGluZGljYXRvci5cbiAqL1xudmFyIEZvcm1Sb3cgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIGJmOiBSZWFjdC5Qcm9wVHlwZXMuaW5zdGFuY2VPZihCb3VuZEZpZWxkKVxuICAsIGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICAsIGNvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLmFueVxuICAsIGNvbnRlbnQ6IFJlYWN0LlByb3BUeXBlcy5hbnlcbiAgLCBoaWRkZW46IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gICwgX19hbGxfXzogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgIGlmICghcHJvcHMuYmYgJiYgIXByb3BzLmNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgICAgICAnSW52YWxpZCBwcm9wcyBzdXBwbGllZCB0byBgRm9ybVJvd2AsIGVpdGhlciBgYmZgIG9yIGBjb250ZW50YCAnICtcbiAgICAgICAgICAnbXVzdCBiZSBzcGVjaWZpZWQuJ1xuICAgICAgICApXG4gICAgICB9XG4gICAgICBpZiAocHJvcHMuYmYgJiYgcHJvcHMuY29udGVudCkge1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgICAgICdCb3RoIGBiZmAgYW5kIGBjb250ZW50YCBwcm9wcyB3ZXJlIHBhc3NlZCB0byBgRm9ybVJvd2AgLSBgYmZgICcgK1xuICAgICAgICAgICd3aWxsIGJlIGlnbm9yZWQuJ1xuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudDogJ2RpdidcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXR0cnMgPSB7fVxuICAgIGlmICh0aGlzLnByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgYXR0cnMuY2xhc3NOYW1lID0gdGhpcy5wcm9wcy5jbGFzc05hbWVcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuaGlkZGVuKSB7XG4gICAgICBhdHRycy5zdHlsZSA9IHtkaXNwbGF5OiAnbm9uZSd9XG4gICAgfVxuICAgIC8vIElmIGNvbnRlbnQgd2FzIGdpdmVuLCB1c2UgaXRcbiAgICBpZiAodGhpcy5wcm9wcy5jb250ZW50KSB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCh0aGlzLnByb3BzLmNvbXBvbmVudCwgYXR0cnMsIHRoaXMucHJvcHMuY29udGVudClcbiAgICB9XG4gICAgLy8gT3RoZXJ3aXNlIHJlbmRlciBhIEJvdW5kRmllbGRcbiAgICB2YXIgYmYgPSB0aGlzLnByb3BzLmJmXG4gICAgdmFyIGlzUGVuZGluZyA9IGJmLmlzUGVuZGluZygpXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQodGhpcy5wcm9wcy5jb21wb25lbnQsIGF0dHJzLFxuICAgICAgYmYubGFiZWxUYWcoKSwgJyAnLCBiZi5yZW5kZXIoKSxcbiAgICAgIGlzUGVuZGluZyAmJiAnICcsXG4gICAgICBpc1BlbmRpbmcgJiYgUmVhY3QuY3JlYXRlRWxlbWVudCgncHJvZ3Jlc3MnLCBudWxsLCAnVmFsaWRhdGluZy4uLicpLFxuICAgICAgYmYuZXJyb3JzKCkucmVuZGVyKCksXG4gICAgICBiZi5oZWxwVGV4dFRhZygpXG4gICAgKVxuICB9XG59KVxuXG52YXIgZm9ybVByb3BzID0ge1xuICBhdXRvSWQ6IHV0aWwuYXV0b0lkQ2hlY2tlclxuLCBjb250cm9sbGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuLCBkYXRhOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG4sIGVtcHR5UGVybWl0dGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuLCBlcnJvckNvbnN0cnVjdG9yOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuLCBmaWxlczogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuLCBpbml0aWFsOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG4sIGxhYmVsU3VmZml4OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4sIG9uQ2hhbmdlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuLCBwcmVmaXg6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiwgdmFsaWRhdGlvbjogUmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICAsIFJlYWN0LlByb3BUeXBlcy5vYmplY3RcbiAgXSlcbn1cblxuaWYgKFwicHJvZHVjdGlvblwiICE9PSBcImRldmVsb3BtZW50XCIpIHtcbiAgdmFyIHdhcm5lZEFib3V0UmVhY3RBZGRvbnMgPSBmYWxzZVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBGb3JtLiBBIGZvcm0gaW5zdGFuY2Ugb3IgY29uc3RydWN0b3IgY2FuIGJlIGdpdmVuLiBJZiBhIGNvbnN0cnVjdG9yXG4gKiBpcyBnaXZlbiwgYW4gaW5zdGFuY2Ugd2lsbCBiZSBjcmVhdGVkIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBtb3VudGVkLCBhbmQgYW55XG4gKiBhZGRpdGlvbmFsIHByb3BzIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvciBhcyBvcHRpb25zLlxuICovXG52YXIgUmVuZGVyRm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZGlzcGxheU5hbWU6ICdSZW5kZXJGb3JtJyxcbiAgcHJvcFR5cGVzOiBvYmplY3QuZXh0ZW5kKHt9LCBmb3JtUHJvcHMsIHtcbiAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcgICAgICAvLyBDbGFzcyBmb3IgdGhlIGNvbXBvbmVudCB3cmFwcGluZyBhbGwgcm93c1xuICAsIGNvbXBvbmVudDogUmVhY3QuUHJvcFR5cGVzLmFueSAgICAgICAgIC8vIENvbXBvbmVudCB0byB3cmFwIGFsbCByb3dzXG4gICwgZm9ybTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbICAgICAgLy8gRm9ybSBpbnN0YW5jZSBvciBjb25zdHJ1Y3RvclxuICAgICAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgICBSZWFjdC5Qcm9wVHlwZXMuaW5zdGFuY2VPZihCYXNlRm9ybSlcbiAgICBdKS5pc1JlcXVpcmVkXG4gICwgcm93OiBSZWFjdC5Qcm9wVHlwZXMuYW55ICAgICAgICAgICAgICAgLy8gQ29tcG9uZW50IHRvIHJlbmRlciBmb3JtIHJvd3NcbiAgLCByb3dDb21wb25lbnQ6IFJlYWN0LlByb3BUeXBlcy5hbnkgICAgICAvLyBDb21wb25lbnQgdG8gd3JhcCBlYWNoIHJvd1xuICB9KSxcblxuICBjaGlsZENvbnRleHRUeXBlczoge1xuICAgIGZvcm06IFJlYWN0LlByb3BUeXBlcy5pbnN0YW5jZU9mKEJhc2VGb3JtKVxuICB9LFxuXG4gIGdldENoaWxkQ29udGV4dDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtmb3JtOiB0aGlzLmZvcm19XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcG9uZW50OiAnZGl2J1xuICAgICwgcm93OiBGb3JtUm93XG4gICAgLCByb3dDb21wb25lbnQ6ICdkaXYnXG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuZm9ybSBpbnN0YW5jZW9mIEJhc2VGb3JtKSB7XG4gICAgICB0aGlzLmZvcm0gPSB0aGlzLnByb3BzLmZvcm1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmZvcm0gPSBuZXcgdGhpcy5wcm9wcy5mb3JtKG9iamVjdC5leHRlbmQoe1xuICAgICAgICBvbkNoYW5nZTogdGhpcy5mb3JjZVVwZGF0ZS5iaW5kKHRoaXMpXG4gICAgICB9LCB1dGlsLmdldFByb3BzKHRoaXMucHJvcHMsIE9iamVjdC5rZXlzKGZvcm1Qcm9wcykpKSlcbiAgICB9XG4gIH0sXG5cbiAgZ2V0Rm9ybTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9ybVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgLy8gQWxsb3cgYSBzaW5nbGUgY2hpbGQgdG8gYmUgcGFzc2VkIGZvciBjdXN0b20gcmVuZGVyaW5nIC0gcGFzc2luZyBhbnkgbW9yZVxuICAgIC8vIHdpbGwgdGhyb3cgYW4gZXJyb3IuXG4gICAgaWYgKFJlYWN0LkNoaWxkcmVuLmNvdW50KHRoaXMucHJvcHMuY2hpbGRyZW4pICE9PSAwKSB7XG4gICAgICAvLyBUT0RPIENsb25pbmcgc2hvdWxkIG5vIGxvbmdlciBiZSBuZWNlc3Nhcnkgd2hlbiBmYWNlYm9vay9yZWFjdCMyMTEyIGxhbmRzXG4gICAgICBpZiAoUmVhY3QuYWRkb25zKSB7XG4gICAgICAgIHJldHVybiBSZWFjdC5hZGRvbnMuY2xvbmVXaXRoUHJvcHMoUmVhY3QuQ2hpbGRyZW4ub25seSh0aGlzLnByb3BzLmNoaWxkcmVuKSwge2Zvcm06IHRoaXMuZm9ybX0pXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKFwicHJvZHVjdGlvblwiICE9PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICAgICAgICBpZiAoIXdhcm5lZEFib3V0UmVhY3RBZGRvbnMpIHtcbiAgICAgICAgICAgIHV0aWwud2FybmluZyhcbiAgICAgICAgICAgICAgJ0NoaWxkcmVuIGhhdmUgYmVlbiBwYXNzZWQgdG8gUmVuZGVyRm9ybSBidXQgUmVhY3QuYWRkb25zLicgK1xuICAgICAgICAgICAgICAnY2xvbmVXaXRoUHJvcHMgaXMgbm90IGF2YWlsYWJsZSB0byBjbG9uZSB0aGVtLiAnICtcbiAgICAgICAgICAgICAgJ1RvIHVzZSBjdXN0b20gcmVuZGVyaW5nLCB5b3UgbXVzdCB1c2UgdGhlIHJlYWN0LXdpdGgtYWRkb25zICcgK1xuICAgICAgICAgICAgICAnYnVpbGQgb2YgUmVhY3QuJ1xuICAgICAgICAgICAgKVxuICAgICAgICAgICAgd2FybmVkQWJvdXRSZWFjdEFkZG9ucyA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IHJlbmRlcmluZ1xuICAgIHZhciBmb3JtID0gdGhpcy5mb3JtXG4gICAgdmFyIHByb3BzID0gdGhpcy5wcm9wc1xuICAgIHZhciBhdHRycyA9IHt9XG4gICAgaWYgKHRoaXMucHJvcHMuY2xhc3NOYW1lKSB7XG4gICAgICBhdHRycy5jbGFzc05hbWUgPSBwcm9wcy5jbGFzc05hbWVcbiAgICB9XG4gICAgdmFyIHRvcEVycm9ycyA9IGZvcm0ubm9uRmllbGRFcnJvcnMoKVxuICAgIHZhciBoaWRkZW5GaWVsZHMgPSBmb3JtLmhpZGRlbkZpZWxkcygpLm1hcChmdW5jdGlvbihiZikge1xuICAgICAgdmFyIGVycm9ycyA9IGJmLmVycm9ycygpXG4gICAgICBpZiAoZXJyb3JzLmlzUG9wdWxhdGVkKSB7XG4gICAgICAgIHRvcEVycm9ycy5leHRlbmQoZXJyb3JzLm1lc3NhZ2VzKCkubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuICcoSGlkZGVuIGZpZWxkICcgKyBiZi5uYW1lICsgJykgJyArIGVycm9yXG4gICAgICAgIH0pKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJmLnJlbmRlcigpXG4gICAgfSlcblxuICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KHByb3BzLmNvbXBvbmVudCwgYXR0cnMsXG4gICAgICB0b3BFcnJvcnMuaXNQb3B1bGF0ZWQoKSAmJiBSZWFjdC5jcmVhdGVFbGVtZW50KHByb3BzLnJvdywge1xuICAgICAgICBjbGFzc05hbWU6IGZvcm0uZXJyb3JDc3NDbGFzc1xuICAgICAgLCBjb250ZW50OiB0b3BFcnJvcnMucmVuZGVyKClcbiAgICAgICwga2V5OiBmb3JtLmFkZFByZWZpeCgnX19hbGxfXycpXG4gICAgICAsIGNvbXBvbmVudDogcHJvcHMucm93Q29tcG9uZW50XG4gICAgICB9KSxcbiAgICAgIGZvcm0udmlzaWJsZUZpZWxkcygpLm1hcChmdW5jdGlvbihiZikge1xuICAgICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChwcm9wcy5yb3csIHtcbiAgICAgICAgICBiZjogYmZcbiAgICAgICAgLCBjbGFzc05hbWU6IGJmLmNzc0NsYXNzZXMoKVxuICAgICAgICAsIGtleTogYmYuaHRtbE5hbWVcbiAgICAgICAgLCBjb21wb25lbnQ6IHByb3BzLnJvd0NvbXBvbmVudFxuICAgICAgICB9KVxuICAgICAgfS5iaW5kKHRoaXMpKSxcbiAgICAgIGZvcm0ubm9uRmllbGRQZW5kaW5nKCkgJiYgUmVhY3QuY3JlYXRlRWxlbWVudChwcm9wcy5yb3csIHtcbiAgICAgICAgY2xhc3NOYW1lOiBmb3JtLnBlbmRpbmdSb3dDc3NDbGFzc1xuICAgICAgLCBjb250ZW50OiBSZWFjdC5jcmVhdGVFbGVtZW50KCdwcm9ncmVzcycsIG51bGwsICdWYWxpZGF0aW5nLi4uJylcbiAgICAgICwga2V5OiBmb3JtLmFkZFByZWZpeCgnX19wZW5kaW5nX18nKVxuICAgICAgLCBjb21wb25lbnQ6IHByb3BzLnJvd0NvbXBvbmVudFxuICAgICAgfSksXG4gICAgICBoaWRkZW5GaWVsZHMubGVuZ3RoID4gMCAmJiBSZWFjdC5jcmVhdGVFbGVtZW50KHByb3BzLnJvdywge1xuICAgICAgICBjbGFzc05hbWU6IGZvcm0uaGlkZGVuRmllbGRSb3dDc3NDbGFzc1xuICAgICAgLCBjb250ZW50OiBoaWRkZW5GaWVsZHNcbiAgICAgICwgaGlkZGVuOiB0cnVlXG4gICAgICAsIGtleTogZm9ybS5hZGRQcmVmaXgoJ19faGlkZGVuX18nKVxuICAgICAgLCBjb21wb25lbnQ6IHByb3BzLnJvd0NvbXBvbmVudFxuICAgICAgfSlcbiAgICApXG4gIH1cbn0pXG5cbi8vIFRPRE8gU3VwcG9ydCBkZWNsYXJpbmcgcHJvcFR5cGVzIHdoZW4gZXh0ZW5kaW5nIGZvcm1zIC0gbWVyZ2UgdGhlbSBpbiBoZXJlXG4vKipcbiAqIE1ldGEgZnVuY3Rpb24gZm9yIGhhbmRsaW5nIGRlY2xhcmF0aXZlIGZpZWxkcyBhbmQgaW5oZXJpdGluZyBmaWVsZHMgZnJvbVxuICogZm9ybXMgZnVydGhlciB1cCB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gb3IgYmVpbmcgZXhwbGljaXRseSBtaXhlZC1pbiwgd2hpY2hcbiAqIHNldHMgdXAgYmFzZUZpZWxkcyBhbmQgZGVjbGFyZWRGaWVsZHMgb24gYSBuZXcgRm9ybSBjb25zdHJ1Y3RvcidzIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IHByb3RvdHlwZVByb3BzXG4gKi9cbmZ1bmN0aW9uIERlY2xhcmF0aXZlRmllbGRzTWV0YShwcm90b3R5cGVQcm9wcykge1xuICAvLyBQb3AgRmllbGRzIGluc3RhbmNlcyBmcm9tIHByb3RvdHlwZVByb3BzIHRvIGJ1aWxkIHVwIHRoZSBuZXcgZm9ybSdzIG93blxuICAvLyBkZWNsYXJlZEZpZWxkcy5cbiAgdmFyIGZpZWxkcyA9IFtdXG4gIE9iamVjdC5rZXlzKHByb3RvdHlwZVByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAocHJvdG90eXBlUHJvcHNbbmFtZV0gaW5zdGFuY2VvZiBGaWVsZCkge1xuICAgICAgZmllbGRzLnB1c2goW25hbWUsIHByb3RvdHlwZVByb3BzW25hbWVdXSlcbiAgICAgIGRlbGV0ZSBwcm90b3R5cGVQcm9wc1tuYW1lXVxuICAgIH1cbiAgfSlcbiAgZmllbGRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhWzFdLmNyZWF0aW9uQ291bnRlciAtIGJbMV0uY3JlYXRpb25Db3VudGVyXG4gIH0pXG4gIHByb3RvdHlwZVByb3BzLmRlY2xhcmVkRmllbGRzID0gb2JqZWN0LmZyb21JdGVtcyhmaWVsZHMpXG5cbiAgLy8gQnVpbGQgdXAgZmluYWwgZGVjbGFyZWRGaWVsZHMgZnJvbSB0aGUgZm9ybSBiZWluZyBleHRlbmRlZCwgZm9ybXMgYmVpbmdcbiAgLy8gbWl4ZWQgaW4gYW5kIHRoZSBuZXcgZm9ybSdzIG93biBkZWNsYXJlZEZpZWxkcywgaW4gdGhhdCBvcmRlciBvZlxuICAvLyBwcmVjZWRlbmNlLlxuICB2YXIgZGVjbGFyZWRGaWVsZHMgPSB7fVxuXG4gIC8vIElmIHdlJ3JlIGV4dGVuZGluZyBhbm90aGVyIGZvcm0sIHdlIGRvbid0IG5lZWQgdG8gY2hlY2sgZm9yIHNoYWRvd2VkXG4gIC8vIGZpZWxkcywgYXMgaXQncyBhdCB0aGUgYm90dG9tIG9mIHRoZSBwaWxlIGZvciBpbmhlcml0aW5nIGRlY2xhcmVkRmllbGRzLlxuICBpZiAob2JqZWN0Lmhhc093bih0aGlzLCAnZGVjbGFyZWRGaWVsZHMnKSkge1xuICAgIG9iamVjdC5leHRlbmQoZGVjbGFyZWRGaWVsZHMsIHRoaXMuZGVjbGFyZWRGaWVsZHMpXG4gIH1cblxuICAvLyBJZiBhbnkgbWl4aW5zIHdoaWNoIGxvb2sgbGlrZSBGb3JtIGNvbnN0cnVjdG9ycyB3ZXJlIGdpdmVuLCBpbmhlcml0IHRoZWlyXG4gIC8vIGRlY2xhcmVkRmllbGRzIGFuZCBjaGVjayBmb3Igc2hhZG93ZWQgZmllbGRzLlxuICBpZiAob2JqZWN0Lmhhc093bihwcm90b3R5cGVQcm9wcywgJ19fbWl4aW5zX18nKSkge1xuICAgIHZhciBtaXhpbnMgPSBwcm90b3R5cGVQcm9wcy5fX21peGluc19fXG4gICAgaWYgKCFpcy5BcnJheShtaXhpbnMpKSB7IG1peGlucyA9IFttaXhpbnNdIH1cbiAgICAvLyBQcm9jZXNzIG1peGlucyBmcm9tIGxlZnQtdG8tcmlnaHQsIHRoZSBzYW1lIHByZWNlZGVuY2UgdGhleSdsbCBnZXQgZm9yXG4gICAgLy8gaGF2aW5nIHRoZWlyIHByb3RvdHlwZSBwcm9wZXJ0aWVzIG1peGVkIGluLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIG1peGluID0gbWl4aW5zW2ldXG4gICAgICBpZiAoaXMuRnVuY3Rpb24obWl4aW4pICYmIG9iamVjdC5oYXNPd24obWl4aW4ucHJvdG90eXBlLCAnZGVjbGFyZWRGaWVsZHMnKSkge1xuICAgICAgICAvLyBFeHRlbmQgbWl4ZWQtaW4gZGVjbGFyZWRGaWVsZHMgb3ZlciB0aGUgdG9wIG9mIHdoYXQncyBhbHJlYWR5IHRoZXJlLFxuICAgICAgICAvLyB0aGVuIGRlbGV0ZSBhbnkgZmllbGRzIHdoaWNoIGhhdmUgYmVlbiBzaGFkb3dlZCBieSBhIG5vbi1GaWVsZFxuICAgICAgICAvLyBwcm9wZXJ0eSBpbiBpdHMgcHJvdG90eXBlLlxuICAgICAgICBvYmplY3QuZXh0ZW5kKGRlY2xhcmVkRmllbGRzLCBtaXhpbi5wcm90b3R5cGUuZGVjbGFyZWRGaWVsZHMpXG4gICAgICAgIE9iamVjdC5rZXlzKG1peGluLnByb3RvdHlwZSkuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgaWYgKG9iamVjdC5oYXNPd24oZGVjbGFyZWRGaWVsZHMsIG5hbWUpKSB7XG4gICAgICAgICAgICBkZWxldGUgZGVjbGFyZWRGaWVsZHNbbmFtZV1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC8vIFRvIGF2b2lkIG92ZXJ3cml0aW5nIHRoZSBuZXcgZm9ybSdzIGJhc2VGaWVsZHMsIGRlY2xhcmVkRmllbGRzIG9yXG4gICAgICAgIC8vIGNvbnN0cnVjdG9yIHdoZW4gdGhlIHJlc3Qgb2YgdGhlIG1peGluJ3MgcHJvdG90eXBlIGlzIG1peGVkLWluIGJ5XG4gICAgICAgIC8vIENvbmN1ciwgcmVwbGFjZSB0aGUgbWl4aW4gd2l0aCBhbiBvYmplY3QgY29udGFpbmluZyBvbmx5IGl0cyBvdGhlclxuICAgICAgICAvLyBwcm90b3R5cGUgcHJvcGVydGllcy5cbiAgICAgICAgdmFyIG1peGluUHJvdG90eXBlID0gb2JqZWN0LmV4dGVuZCh7fSwgbWl4aW4ucHJvdG90eXBlKVxuICAgICAgICBkZWxldGUgbWl4aW5Qcm90b3R5cGUuYmFzZUZpZWxkc1xuICAgICAgICBkZWxldGUgbWl4aW5Qcm90b3R5cGUuZGVjbGFyZWRGaWVsZHNcbiAgICAgICAgZGVsZXRlIG1peGluUHJvdG90eXBlLmNvbnN0cnVjdG9yXG4gICAgICAgIG1peGluc1tpXSA9IG1peGluUHJvdG90eXBlXG4gICAgICB9XG4gICAgfVxuICAgIC8vIFdlIG1heSBoYXZlIHdyYXBwZWQgYSBzaW5nbGUgbWl4aW4gaW4gYW4gQXJyYXkgLSBhc3NpZ24gaXQgYmFjayB0byB0aGVcbiAgICAvLyBuZXcgZm9ybSdzIHByb3RvdHlwZSBmb3IgcHJvY2Vzc2luZyBieSBDb25jdXIuXG4gICAgcHJvdG90eXBlUHJvcHMuX19taXhpbnNfXyA9IG1peGluc1xuICB9XG5cbiAgLy8gRmluYWxseSAtIGV4dGVuZCB0aGUgbmV3IGZvcm0ncyBvd24gZGVjbGFyZWRGaWVsZHMgb3ZlciB0aGUgdG9wIG9mXG4gIC8vIGRlY2xhcmVkRmllbGRzIGJlaW5nIGluaGVyaXRlZCwgdGhlbiBkZWxldGUgYW55IGZpZWxkcyB3aGljaCBoYXZlIGJlZW5cbiAgLy8gc2hhZG93ZWQgYnkgYSBub24tRmllbGQgcHJvcGVydHkgaW4gaXRzIHByb3RvdHlwZS5cbiAgb2JqZWN0LmV4dGVuZChkZWNsYXJlZEZpZWxkcywgcHJvdG90eXBlUHJvcHMuZGVjbGFyZWRGaWVsZHMpXG4gIE9iamVjdC5rZXlzKHByb3RvdHlwZVByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAob2JqZWN0Lmhhc093bihkZWNsYXJlZEZpZWxkcywgbmFtZSkpIHtcbiAgICAgIGRlbGV0ZSBkZWNsYXJlZEZpZWxkc1tuYW1lXVxuICAgIH1cbiAgfSlcblxuICBwcm90b3R5cGVQcm9wcy5iYXNlRmllbGRzID0gZGVjbGFyZWRGaWVsZHNcbiAgcHJvdG90eXBlUHJvcHMuZGVjbGFyZWRGaWVsZHMgPSBkZWNsYXJlZEZpZWxkc1xuXG4gIC8vIElmIGEgY2xlYW4gbWV0aG9kIGlzIHNwZWNpZmllZCBhcyBbZmllbGQxLCBmaWVsZDIsIC4uLiwgY2xlYW5GdW5jdGlvbl0sXG4gIC8vIHJlcGxhY2UgaXQgd2l0aCB0aGUgY2xlYW4gZnVuY3Rpb24gYW5kIGF0dGFjaCB0aGUgZmllbGQgbmFtZXMgdG8gdGhlXG4gIC8vIGZ1bmN0aW9uLlxuICBpZiAob2JqZWN0Lmhhc093bihwcm90b3R5cGVQcm9wcywgJ2NsZWFuJykgJiYgaXMuQXJyYXkocHJvdG90eXBlUHJvcHMuY2xlYW4pKSB7XG4gICAgdmFyIGNsZWFuID0gcHJvdG90eXBlUHJvcHMuY2xlYW4ucG9wKClcbiAgICBjbGVhbi5maWVsZHMgPSBvYmplY3QubG9va3VwKHByb3RvdHlwZVByb3BzLmNsZWFuKVxuICAgIHByb3RvdHlwZVByb3BzLmNsZWFuID0gY2xlYW5cbiAgfVxufVxuXG4vKipcbiAqIEJhc2UgY29uc3RydWN0b3Igd2hpY2ggYWN0cyBhcyB0aGUgdXNlciBBUEkgZm9yIGNyZWF0aW5nIG5ldyBmb3JtXG4gKiBjb25zdHJ1Y3RvcnMsIGV4dGVuZGluZyBCYXNlRm9ybSBhbmQgcmVnaXN0ZXJpbmcgRGVjbGFyYXRpdmVGaWVsZHNNZXRhIGFzXG4gKiBpdHMgX19tZXRhX18gZnVuY3Rpb24gdG8gaGFuZGxlIHNldHRpbmcgdXAgbmV3IGZvcm0gY29uc3RydWN0b3IgcHJvdG90eXBlcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0Jhc2VGb3JtfVxuICovXG52YXIgRm9ybSA9IEJhc2VGb3JtLmV4dGVuZCh7XG4gIF9fbWV0YV9fOiBEZWNsYXJhdGl2ZUZpZWxkc01ldGFcbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEZvcm0oKSB7XG4gICAgQmFzZUZvcm0uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG59KVxuXG52YXIgX2V4dGVuZCA9IEZvcm0uZXh0ZW5kXG5cbkZvcm0uZXh0ZW5kID0gZnVuY3Rpb24ocHJvdG90eXBlUHJvcHMsIGNvbnN0cnVjdG9yUHJvcHMpIHtcbiAgcmV0dXJuIF9leHRlbmQuY2FsbCh0aGlzLCBvYmplY3QuZXh0ZW5kKHt9LCBwcm90b3R5cGVQcm9wcyksIGNvbnN0cnVjdG9yUHJvcHMpXG59XG5cbmZ1bmN0aW9uIGlzRm9ybUFzeW5jKGNvbnN0cnVjdG9yKSB7XG4gIHZhciBwcm90byA9IGNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICBpZiAocHJvdG8uY2xlYW4ubGVuZ3RoID09IDEpIHsgcmV0dXJuIHRydWUgfVxuICB2YXIgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHByb3RvLmJhc2VGaWVsZHMpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZmllbGROYW1lcy5sZW5ndGg7IGkgPCBsIDsgaSsrKSB7XG4gICAgdmFyIGN1c3RvbUNsZWFuID0gcHJvdG8uX2dldEN1c3RvbUNsZWFuKGZpZWxkTmFtZXNbaV0pXG4gICAgaWYgKGlzLkZ1bmN0aW9uKGN1c3RvbUNsZWFuKSAmJiBjdXN0b21DbGVhbi5sZW5ndGggPT0gMSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBOT05fRklFTERfRVJST1JTOiBOT05fRklFTERfRVJST1JTXG4sIEJhc2VGb3JtOiBCYXNlRm9ybVxuLCBEZWNsYXJhdGl2ZUZpZWxkc01ldGE6IERlY2xhcmF0aXZlRmllbGRzTWV0YVxuLCBGb3JtUm93OiBGb3JtUm93XG4sIEZvcm06IEZvcm1cbiwgaXNGb3JtQXN5bmM6IGlzRm9ybUFzeW5jXG4sIFJlbmRlckZvcm06IFJlbmRlckZvcm1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgaXMgPSByZXF1aXJlKCdpc29tb3JwaC9pcycpXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpXG52YXIgdmFsaWRhdG9ycyA9IHJlcXVpcmUoJ3ZhbGlkYXRvcnMnKVxuXG52YXIgZW52ID0gcmVxdWlyZSgnLi9lbnYnKVxudmFyIGZpZWxkcyA9IHJlcXVpcmUoJy4vZmllbGRzJylcbnZhciBmb3JtcyA9IHJlcXVpcmUoJy4vZm9ybXMnKVxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKVxudmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKVxudmFyIEVycm9yTGlzdCA9IHJlcXVpcmUoJy4vRXJyb3JMaXN0JylcblxudmFyIEJvb2xlYW5GaWVsZCA9IGZpZWxkcy5Cb29sZWFuRmllbGRcbnZhciBIaWRkZW5JbnB1dCA9IHdpZGdldHMuSGlkZGVuSW5wdXRcbnZhciBJbnRlZ2VyRmllbGQgPSBmaWVsZHMuSW50ZWdlckZpZWxkXG52YXIgVmFsaWRhdGlvbkVycm9yID0gdmFsaWRhdG9ycy5WYWxpZGF0aW9uRXJyb3JcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbi8vIE5hbWUgYXNzb2NpYXRlZCB3aXRoIGNsZWFuKCkgdmFsaWRhdGlvblxudmFyIENMRUFOX1ZBTElEQVRJT04gPSAnY2xlYW4nXG5cbi8vIFNwZWNpYWwgZmllbGQgbmFtZXNcbnZhciBERUxFVElPTl9GSUVMRF9OQU1FID0gJ0RFTEVURSdcbnZhciBJTklUSUFMX0ZPUk1fQ09VTlQgPSAnSU5JVElBTF9GT1JNUydcbnZhciBNQVhfTlVNX0ZPUk1fQ09VTlQgPSAnTUFYX05VTV9GT1JNUydcbnZhciBNSU5fTlVNX0ZPUk1fQ09VTlQgPSAnTUlOX05VTV9GT1JNUydcbnZhciBPUkRFUklOR19GSUVMRF9OQU1FID0gJ09SREVSJ1xudmFyIFRPVEFMX0ZPUk1fQ09VTlQgPSAnVE9UQUxfRk9STVMnXG5cbi8vIERlZmF1bHQgbWluaW11bSBudW1iZXIgb2YgZm9ybXMgaW4gYSBmb3Jtc2V0XG52YXIgREVGQVVMVF9NSU5fTlVNID0gMFxuXG4vLyBEZWZhdWx0IG1heGltdW0gbnVtYmVyIG9mIGZvcm1zIGluIGEgZm9ybXNldCwgdG8gcHJldmVudCBtZW1vcnkgZXhoYXVzdGlvblxudmFyIERFRkFVTFRfTUFYX05VTSA9IDEwMDBcblxuLyoqXG4gKiBNYW5hZ2VtZW50Rm9ybSBpcyB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgaG93IG1hbnkgZm9ybSBpbnN0YW5jZXMgYXJlIGRpc3BsYXllZFxuICogb24gdGhlIHBhZ2UuIElmIGFkZGluZyBuZXcgZm9ybXMgdmlhIEphdmFTY3JpcHQsIHlvdSBzaG91bGQgaW5jcmVtZW50IHRoZVxuICogY291bnQgZmllbGQgb2YgdGhpcyBmb3JtIGFzIHdlbGwuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIE1hbmFnZW1lbnRGb3JtID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgZmllbGRzID0ge31cbiAgZmllbGRzW1RPVEFMX0ZPUk1fQ09VTlRdID0gSW50ZWdlckZpZWxkKHt3aWRnZXQ6IEhpZGRlbklucHV0fSlcbiAgZmllbGRzW0lOSVRJQUxfRk9STV9DT1VOVF0gPSBJbnRlZ2VyRmllbGQoe3dpZGdldDogSGlkZGVuSW5wdXR9KVxuICAvLyBNSU5fTlVNX0ZPUk1fQ09VTlQgYW5kIE1BWF9OVU1fRk9STV9DT1VOVCBhcmUgb3V0cHV0IHdpdGggdGhlIHJlc3Qgb2ZcbiAgLy8gdGhlIG1hbmFnZW1lbnQgZm9ybSwgYnV0IG9ubHkgZm9yIHRoZSBjb252ZW5pZW5jZSBvZiBjbGllbnQtc2lkZVxuICAvLyBjb2RlLiBUaGUgUE9TVCB2YWx1ZSBvZiB0aGVtIHJldHVybmVkIGZyb20gdGhlIGNsaWVudCBpcyBub3QgY2hlY2tlZC5cbiAgZmllbGRzW01JTl9OVU1fRk9STV9DT1VOVF0gPSBJbnRlZ2VyRmllbGQoe3JlcXVpcmVkOiBmYWxzZSwgd2lkZ2V0OiBIaWRkZW5JbnB1dH0pXG4gIGZpZWxkc1tNQVhfTlVNX0ZPUk1fQ09VTlRdID0gSW50ZWdlckZpZWxkKHtyZXF1aXJlZDogZmFsc2UsIHdpZGdldDogSGlkZGVuSW5wdXR9KVxuICByZXR1cm4gZm9ybXMuRm9ybS5leHRlbmQoZmllbGRzKVxufSkoKVxuXG4vKipcbiAqIEEgY29sbGVjdGlvbiBvZiBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgRm9ybS5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIEJhc2VGb3JtU2V0ID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBCYXNlRm9ybVNldChrd2FyZ3MpIHtcbiAgICAvLyBUT0RPIFBlcmZvcm0gUHJvcFR5cGUgY2hlY2tzIG9uIGt3YXJncyBpbiBkZXZlbG9wbWVudCBtb2RlXG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7XG4gICAgICBkYXRhOiBudWxsLCBmaWxlczogbnVsbCwgYXV0b0lkOiAnaWRfe25hbWV9JywgcHJlZml4OiBudWxsLFxuICAgICAgaW5pdGlhbDogbnVsbCwgZXJyb3JDb25zdHJ1Y3RvcjogRXJyb3JMaXN0LCBtYW5hZ2VtZW50Rm9ybUNzc0NsYXNzOiBudWxsLFxuICAgICAgdmFsaWRhdGlvbjogbnVsbCwgY29udHJvbGxlZDogZmFsc2UsIG9uQ2hhbmdlOiBudWxsXG4gICAgfSwga3dhcmdzKVxuICAgIHRoaXMuaXNJbml0aWFsUmVuZGVyID0gKGt3YXJncy5kYXRhID09PSBudWxsICYmIGt3YXJncy5maWxlcyA9PT0gbnVsbClcbiAgICB0aGlzLnByZWZpeCA9IGt3YXJncy5wcmVmaXggfHwgdGhpcy5nZXREZWZhdWx0UHJlZml4KClcbiAgICB0aGlzLmF1dG9JZCA9IGt3YXJncy5hdXRvSWRcbiAgICB0aGlzLmRhdGEgPSBrd2FyZ3MuZGF0YSB8fCB7fVxuICAgIHRoaXMuZmlsZXMgPSBrd2FyZ3MuZmlsZXMgfHwge31cbiAgICB0aGlzLmluaXRpYWwgPSBrd2FyZ3MuaW5pdGlhbFxuICAgIHRoaXMuZXJyb3JDb25zdHJ1Y3RvciA9IGt3YXJncy5lcnJvckNvbnN0cnVjdG9yXG4gICAgdGhpcy5tYW5hZ2VtZW50Rm9ybUNzc0NsYXNzID0ga3dhcmdzLm1hbmFnZW1lbnRGb3JtQ3NzQ2xhc3NcbiAgICB0aGlzLnZhbGlkYXRpb24gPSBrd2FyZ3MudmFsaWRhdGlvblxuICAgIHRoaXMuY29udHJvbGxlZCA9IGt3YXJncy5jb250cm9sbGVkXG4gICAgdGhpcy5vbkNoYW5nZSA9IGt3YXJncy5vbkNoYW5nZVxuXG4gICAgdGhpcy5fZm9ybXMgPSBudWxsXG4gICAgdGhpcy5fZXJyb3JzID0gbnVsbFxuICAgIHRoaXMuX25vbkZvcm1FcnJvcnMgPSBudWxsXG5cbiAgICAvLyBMb29rdXAgZm9yIHBlbmRpbmcgdmFsaWRhdGlvblxuICAgIHRoaXMuX3BlbmRpbmdWYWxpZGF0aW9uID0ge31cbiAgICAvLyBDYW5jZWxsYWJsZSBjYWxsYmFja3MgZm9yIHBlbmRpbmcgYXN5bmMgdmFsaWRhdGlvblxuICAgIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24gPSB7fVxuICAgIC8vIExvb2t1cCBmb3IgcGVuZGluZyB2YWxpZGF0aW9uIHdoaWNoIGZvcm1zZXQgY2xlYW5pbmcgZGVwZW5kcyBvblxuICAgIHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyID0ge31cbiAgICAvLyBDYWxsYmFjayB0byBiZSBydW4gdGhlIG5leHQgdGltZSB2YWxpZGF0aW9uIGZpbmlzaGVzXG4gICAgdGhpcy5fb25WYWxpZGF0ZSA9IG51bGxcbiAgfVxufSlcblxuLyoqXG4gKiBDYWxscyB0aGUgb25DaGFuZ2UgZnVuY3Rpb24gaWYgaXQncyBiZWVuIHByb3ZpZGVkLiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZFxuICogZXZlcnkgdGltZSB0aGUgZm9ybXNldCBtYWtlcyBhIGNoYW5nZSB0byBpdHMgc3RhdGUgd2hpY2ggcmVxdWlyZXMgcmVkaXNwbGF5LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX3N0YXRlQ2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodHlwZW9mIHRoaXMub25DaGFuZ2UgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMub25DaGFuZ2UoKVxuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFZhbGlkYXRpb24gPT09XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoZSBmb3Jtc2V0IHVzaW5nIGl0cyBmb3JtcycgY3VycmVudCBpbnB1dCBkYXRhLlxuICogQHBhcmFtIHtmdW5jdGlvbihlcnIsIGlzVmFsaWQsIGNsZWFuZWREYXRhKT19IGNiIGNhbGxiYWNrIGZvciBhc3luY2hyb25vdXNcbiAqICAgdmFsaWRhdGlvbi5cbiAqIEByZXR1cm4ge2Jvb2xlYW58dW5kZWZpbmVkfSB0cnVlIGlmIHRoZSBmb3JtIG9ubHkgaGFzIHN5bmNocm9ub3VzIHZhbGlkYXRpb25cbiAqICAgYW5kIGlzIHZhbGlkLlxuICogQHRocm93cyBpZiB0aGUgZm9ybXNldCBvciBpdHMgZm9ybSBoYXMgYXN5bmNocm9ub3VzIHZhbGlkYXRpb24gYW5kIGEgY2FsbGJhY2tcbiAqICAgaXMgbm90IHByb3ZpZGVkLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUudmFsaWRhdGUgPSBmdW5jdGlvbihjYikge1xuICB0aGlzLl9jYW5jZWxQZW5kaW5nT3BlcmF0aW9ucygpXG4gIHJldHVybiAodGhpcy5pc0FzeW5jKCkgPyB0aGlzLl92YWxpZGF0ZUFzeW5jKGNiKSA6IHRoaXMuX3ZhbGlkYXRlU3luYygpKVxufVxuXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX3ZhbGlkYXRlQXN5bmMgPSBmdW5jdGlvbihjYikge1xuICBpZiAoIWlzLkZ1bmN0aW9uKGNiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdZb3UgbXVzdCBwcm92aWRlIGEgY2FsbGJhY2sgdG8gdmFsaWRhdGUoKSB3aGVuIGEgZm9ybXNldCBvciBpdHMgZm9ybSAnICtcbiAgICAgICdoYXMgYXN5bmNocm9ub3VzIHZhbGlkYXRpb24uJ1xuICAgIClcbiAgfVxuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgdGhpcy5fb25WYWxpZGF0ZSA9IGNiXG4gIHRoaXMuZnVsbENsZWFuKClcbiAgLy8gVXBkYXRlIHN0YXRlIHRvIGRpc3BsYXkgYXN5bmMgcHJvZ3Jlc3MgaW5kaWNhdG9yc1xuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX3ZhbGlkYXRlU3luYyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICB0aGlzLmlzSW5pdGlhbFJlbmRlciA9IGZhbHNlXG4gIH1cbiAgdGhpcy5mdWxsQ2xlYW4oKVxuICAvLyBEaXNwbGF5IGNoYW5nZXMgdG8gdmFsaWQvaW52YWxpZCBzdGF0ZVxuICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICByZXR1cm4gdGhpcy5pc1ZhbGlkKClcbn1cblxuLyoqXG4gKiBDbGVhbnMgYWxsIG9mIHRoaXMuZGF0YSBhbmQgcG9wdWxhdGVzIHRoaXMuX2Vycm9ycyBhbmQgdGhpcy5fbm9uRm9ybUVycm9ycy5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmZ1bGxDbGVhbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9lcnJvcnMgPSBbXVxuICB0aGlzLl9ub25Gb3JtRXJyb3JzID0gbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcigpXG5cbiAgaWYgKHRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgcmV0dXJuIC8vIFN0b3AgZnVydGhlciBwcm9jZXNzaW5nXG4gIH1cblxuICB0aGlzLl9jbGVhbkZvcm1zKClcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYW5kIGNsZWFucyBldmVyeSBmb3JtIGluIHRoZSBmb3Jtc2V0LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NsZWFuRm9ybXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZvcm1zID0gdGhpcy5mb3JtcygpXG4gIHZhciBmb3JtSW5kZXhMb29rdXAgPSBvYmplY3QubG9va3VwKE9iamVjdC5rZXlzKGZvcm1zKSlcbiAgb2JqZWN0LmV4dGVuZCh0aGlzLl9wZW5kaW5nVmFsaWRhdGlvbiwgZm9ybUluZGV4TG9va3VwKVxuICBvYmplY3QuZXh0ZW5kKHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyLCBmb3JtSW5kZXhMb29rdXApXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZm9ybXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdGhpcy5fY2xlYW5Gb3JtKGksIGZvcm1zW2ldKVxuICB9XG4gIC8vIE1ha2Ugc3VyZSBjbGVhbiBnZXRzIGNhbGxlZCBldmVuIGlmIHRoZSBmb3Jtc2V0IGlzIGVtcHR5XG4gIGlmIChmb3Jtcy5sZW5ndGggPT09IDApIHtcbiAgICB0aGlzLl9jbGVhbkZvcm1zZXRBZnRlci5lbXB0eSA9IHRydWVcbiAgICB0aGlzLl9mb3JtQ2xlYW5lZCgnZW1wdHknLCBudWxsKVxuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGFuZCBjbGVhbnMgdGhlIGZvcm0gYXQgdGhlIGdpdmVuIGluZGV4LlxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IHRoZSBpbmRleCBvZiB0aGUgZm9ybSBpbiB0aGUgZm9ybXNldC5cbiAqIEBwYXJhbSB7Rm9ybX0gZm9ybVxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NsZWFuRm9ybSA9IGZ1bmN0aW9uKGluZGV4LCBmb3JtKSB7XG4gIGlmICghZm9ybS5pc0FzeW5jKCkpIHtcbiAgICBmb3JtLnZhbGlkYXRlKClcbiAgICB0aGlzLl9lcnJvcnNbaW5kZXhdID0gZm9ybS5lcnJvcnMoKVxuICAgIHRoaXMuX2Zvcm1DbGVhbmVkKGluZGV4LCBudWxsKVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gSWYgdGhlIGZvcm0gaXMgYXN5bmMgYW5kIHRoZXJlJ3Mgb25lIHBlbmRpbmcsIHByZXZlbnQgaXRzIGNhbGxiYWNrIGZyb21cbiAgLy8gZG9pbmcgYW55dGhpbmcuXG4gIGlmICh0eXBlb2YgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltpbmRleF0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIGluZGV4KS5jYW5jZWwoKVxuICB9XG4gIC8vIFNldCB1cCBjYWxsYmFjayBmb3IgYXN5bmMgcHJvY2Vzc2luZ1xuICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihlcnIpIHtcbiAgICBpZiAoIWVycikge1xuICAgICAgdGhpcy5fZXJyb3JzW2luZGV4XSA9IGZvcm0uZXJyb3JzKClcbiAgICB9XG4gICAgdGhpcy5fZm9ybUNsZWFuZWQoaW5kZXgsIGVycilcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICB9LmJpbmQodGhpcylcbiAgY2FsbGJhY2sub25DYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICBmb3JtLl9jYW5jZWxQZW5kaW5nT3BlcmF0aW9ucygpXG4gIH1cbiAgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltpbmRleF0gPSB1dGlsLmNhbmNlbGxhYmxlKGNhbGxiYWNrKVxuICBmb3JtLnZhbGlkYXRlKGNhbGxiYWNrKVxufVxuXG4vKipcbiAqIENhbGxiYWNrIGZvciBjb21wbGV0aW9uIG9mIGZvcm0gY2xlYW5pbmcuIFRyaWdnZXJzIGZvcm1zZXQgY2xlYW5pbmcgb3JcbiAqIHNpZ25hbHMgdGhlIGVuZCBvZiB2YWxpZGF0aW9uLCBhcyBuZWNlc3NhcnkuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IG5hbWUgdGhlIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjbGVhbmluZyB0aGF0J3MgY29tcGxldGVkLlxuICogQHBhcmFtIHtFcnJvcj19IGVyciBhbiBlcnJvciBjYXVnaHQgd2hpbGUgY2xlYW5pbmcuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fZm9ybUNsZWFuZWQgPSBmdW5jdGlvbihuYW1lLCBlcnIpIHtcbiAgZGVsZXRlIHRoaXMuX3BlbmRpbmdWYWxpZGF0aW9uW25hbWVdXG4gIGlmICh0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW25hbWVdKSB7XG4gICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bbmFtZV1cbiAgfVxuXG4gIGlmIChlcnIpIHtcbiAgICBpZiAoXCJwcm9kdWN0aW9uXCIgIT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY2xlYW5pbmcgZm9ybXNldFsnICsgbmFtZSArICddOicgKyBlcnIubWVzc2FnZSlcbiAgICB9XG4gICAgLy8gU3RvcCB0cmFja2luZyB2YWxpZGF0aW9uIHByb2dyZXNzIG9uIGVycm9yLCBhbmQgZG9uJ3QgY2FsbCBjbGVhbigpXG4gICAgdGhpcy5fcGVuZGluZ1ZhbGlkYXRpb24gPSB7fVxuICAgIHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyID0ge31cbiAgICB0aGlzLl9maW5pc2hlZFZhbGlkYXRpb24oZXJyKVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gUnVuIGNsZWFuKCkgaWYgdGhpcyB0aGlzIHdhcyB0aGUgbGFzdCBmaWVsZCBpdCB3YXMgd2FpdGluZyBmb3JcbiAgaWYgKHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyW25hbWVdKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyW25hbWVdXG4gICAgaWYgKGlzLkVtcHR5KHRoaXMuX2NsZWFuRm9ybXNldEFmdGVyKSkge1xuICAgICAgdGhpcy5fY2xlYW5Gb3Jtc2V0KClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIC8vIFNpZ25hbCB0aGUgZW5kIG9mIHZhbGlkYXRpb24gaWYgdGhpcyB3YXMgdGhlIGxhc3QgZmllbGQgd2Ugd2VyZSB3YWl0aW5nIGZvclxuICBpZiAobmFtZSA9PSBDTEVBTl9WQUxJREFUSU9OKSB7XG4gICAgdGhpcy5fZmluaXNoZWRWYWxpZGF0aW9uKG51bGwpXG4gIH1cbn1cblxuLyoqXG4gKiBIb29rIGZvciBkb2luZyBhbnkgZXh0cmEgZm9ybXNldC13aWRlIGNsZWFuaW5nIGFmdGVyIEZvcm0uY2xlYW4oKSBoYXMgYmVlblxuICogY2FsbGVkIG9uIGV2ZXJ5IGZvcm0uIEFueSBWYWxpZGF0aW9uRXJyb3IgcmFpc2VkIGJ5IHRoaXMgbWV0aG9kIHdpbGwgbm90IGJlXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGZvcm07IGl0IHdpbGwgYmUgYWNjZXNzaWJsZSB2aWFcbiAqIGZvcm1zZXQubm9uRm9ybUVycm9ycygpXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5jbGVhbiA9IG5vb3BcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhlIG51bWJlciBvZiBmb3JtcyBhbmQgY2FsbHMgdGhlIGNsZWFuKCkgaG9vay5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLl9jbGVhbkZvcm1zZXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFzeW5jID0gZmFsc2VcbiAgdmFyIGVycm9yID0gbnVsbFxuICB0cnkge1xuICAgIHZhciB0b3RhbEZvcm1Db3VudCA9IHRoaXMudG90YWxGb3JtQ291bnQoKVxuICAgIHZhciBkZWxldGVkRm9ybUNvdW50ID0gdGhpcy5kZWxldGVkRm9ybXMoKS5sZW5ndGhcbiAgICBpZiAoKHRoaXMudmFsaWRhdGVNYXggJiYgdG90YWxGb3JtQ291bnQgLSBkZWxldGVkRm9ybUNvdW50ID4gdGhpcy5tYXhOdW0pIHx8XG4gICAgICAgICghZW52LmJyb3dzZXIgJiYgdGhpcy5tYW5hZ2VtZW50Rm9ybSgpLmNsZWFuZWREYXRhW1RPVEFMX0ZPUk1fQ09VTlRdID4gdGhpcy5hYnNvbHV0ZU1heCkpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcignUGxlYXNlIHN1Ym1pdCAnICsgdGhpcy5tYXhOdW0gKyAnIG9yIGZld2VyIGZvcm1zLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvZGU6ICd0b29NYW55Rm9ybXMnfSlcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsaWRhdGVNaW4gJiYgdG90YWxGb3JtQ291bnQgLSBkZWxldGVkRm9ybUNvdW50IDwgdGhpcy5taW5OdW0pIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcignUGxlYXNlIHN1Ym1pdCAnICsgdGhpcy5taW5OdW0gKyAnIG9yIG1vcmUgZm9ybXMuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29kZTogJ3Rvb0Zld0Zvcm1zJ30pXG4gICAgfVxuICAgIC8vIEdpdmUgdGhpcy5jbGVhbigpIGEgY2hhbmNlIHRvIGRvIGNyb3NzLWZvcm0gdmFsaWRhdGlvbi5cbiAgICBpZiAodGhpcy5jbGVhbiAhPT0gbm9vcCkge1xuICAgICAgYXN5bmMgPSB0aGlzLl9ydW5DdXN0b21DbGVhbihDTEVBTl9WQUxJREFUSU9OLCB0aGlzLmNsZWFuKVxuICAgIH1cbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICB0aGlzLl9ub25Gb3JtRXJyb3JzID0gbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcihlLm1lc3NhZ2VzKCkpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXJyb3IgPSBlXG4gICAgfVxuICB9XG5cbiAgaWYgKCFhc3luYykge1xuICAgIHRoaXMuX2Zvcm1DbGVhbmVkKENMRUFOX1ZBTElEQVRJT04sIGVycm9yKVxuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgYSBjdXN0b20gY2xlYW5pbmcgbWV0aG9kLCBleHBlY3Rpbmcgc3luY2hyb25vdXMgb3IgYXN5bmNocm9ub3VzXG4gKiBiZWhhdmlvdXIsIGRlcGVuZGluZyBvbiBpdHMgYXJpdHkuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBhIG5hbWUgdG8gYXNzb2NpYXRlIHdpdGggdGhlIGNsZWFuaW5nIG1ldGhvZC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN1c3RvbUNsZWFuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNsZWFuaW5nIGlzIHJ1bm5pbmcgYXN5bmNocm9ub3VzbHksIGZhbHNlIGlmIGl0IGp1c3RcbiAqICAgcmFuIHN5bmNocm9ub3VzbHkuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fcnVuQ3VzdG9tQ2xlYW4gPSBmdW5jdGlvbihuYW1lLCBjdXN0b21DbGVhbikge1xuICAvLyBDaGVjayBhcml0eSB0byBzZWUgaWYgd2UgaGF2ZSBhIGNhbGxiYWNrIGluIHRoZSBmdW5jdGlvbiBzaWduYXR1cmVcbiAgaWYgKGN1c3RvbUNsZWFuLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIFN5bmNocm9ub3VzIHByb2Nlc3Npbmcgb25seSBleHBlY3RlZFxuICAgIGN1c3RvbUNsZWFuLmNhbGwodGhpcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGFzeW5jIGFuZCB0aGVyZSdzIG9uZSBwZW5kaW5nLCBwcmV2ZW50IGl0c1xuICAvLyBjYWxsYmFjayBmcm9tIGRvaW5nIGFueXRoaW5nLlxuICBpZiAodHlwZW9mIHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb25bbmFtZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIG5hbWUpLmNhbmNlbCgpXG4gIH1cbiAgLy8gU2V0IHVwIGNhbGxiYWNrIGZvciBhc3luYyBwcm9jZXNzaW5nIC0gYXJndW1lbnRzIGZvciBhZGRFcnJvcigpXG4gIC8vIHNob3VsZCBiZSBwYXNzZWQgdmlhIHRoZSBjYWxsYmFjayBhcyBjYWxsaW5nIGl0IGRpcmVjdGx5IHByZXZlbnRzIHVzXG4gIC8vIGZyb20gY29tcGxldGVseSBpZ25vcmluZyB0aGUgY2FsbGJhY2sgaWYgdmFsaWRhdGlvbiBmaXJlcyBhZ2Fpbi5cbiAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZXJyLCB2YWxpZGF0aW9uRXJyb3IpIHtcbiAgICBpZiAodHlwZW9mIHZhbGlkYXRpb25FcnJvciAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5hZGRFcnJvcih2YWxpZGF0aW9uRXJyb3IpXG4gICAgfVxuICAgIHRoaXMuX2Zvcm1DbGVhbmVkKG5hbWUsIGVycilcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICB9LmJpbmQodGhpcylcblxuICAvLyBBbiBleHBsaWNpdCByZXR1cm4gdmFsdWUgb2YgZmFsc2UgaW5kaWNhdGVzIHRoYXQgYXN5bmMgcHJvY2Vzc2luZyBpc1xuICAvLyBiZWluZyBza2lwcGVkIChlLmcuIGJlY2F1c2Ugc3luYyBjaGVja3MgaW4gdGhlIG1ldGhvZCBmYWlsZWQgZmlyc3QpXG4gIHZhciByZXR1cm5WYWx1ZSA9IGN1c3RvbUNsZWFuLmNhbGwodGhpcywgY2FsbGJhY2spXG4gIGlmIChyZXR1cm5WYWx1ZSAhPT0gZmFsc2UpIHtcbiAgICAvLyBBc3luYyBwcm9jZXNzaW5nIGlzIGhhcHBlbmluZyEgTWFrZSB0aGUgY2FsbGJhY2sgY2FuY2VsbGFibGUgYW5kXG4gICAgLy8gaG9vayB1cCBhbnkgY3VzdG9tIG9uQ2FuY2VsIGhhbmRsaW5nIHByb3ZpZGVkLlxuICAgIGlmIChyZXR1cm5WYWx1ZSAmJiB0eXBlb2YgcmV0dXJuVmFsdWUub25DYW5jZWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sub25DYW5jZWwgPSByZXR1cm5WYWx1ZS5vbkNhbmNlbFxuICAgIH1cbiAgICB0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uW25hbWVdID0gdXRpbC5jYW5jZWxsYWJsZShjYWxsYmFjaylcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fZmluaXNoZWRWYWxpZGF0aW9uID0gZnVuY3Rpb24oZXJyKSB7XG4gIGlmICghdGhpcy5pc0FzeW5jKCkpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICB0aHJvdyBlcnJcbiAgICB9XG4gICAgLy8gU3luY2hyb25vdXMgZm9ybXNldCB2YWxpZGF0aW9uIHJlc3VsdHMgd2lsbCBiZSByZXR1cm5lZCB2aWEgdGhlIG9yaWdpbmFsXG4gICAgLy8gY2FsbCB3aGljaCB0cmlnZ2VyZWQgdmFsaWRhdGlvbi5cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXMuRnVuY3Rpb24odGhpcy5fb25WYWxpZGF0ZSkpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSB0aGlzLl9vblZhbGlkYXRlXG4gICAgdGhpcy5fb25WYWxpZGF0ZSA9IG51bGxcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyKVxuICAgIH1cbiAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZCgpXG4gICAgY2FsbGJhY2sobnVsbCwgaXNWYWxpZCwgaXNWYWxpZCA/IHRoaXMuY2xlYW5lZERhdGEoKSA6IG51bGwpXG4gIH1cbn1cblxuLyoqXG4gKiBDYW5jZWxzIGFueSBwZW5kaW5nIGFzeW5jIHZhbGlkYXRpb25zLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuX2NhbmNlbFBlbmRpbmdPcGVyYXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIE9iamVjdC5rZXlzKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24pLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICBvYmplY3QucG9wKHRoaXMuX3BlbmRpbmdBc3luY1ZhbGlkYXRpb24sIGZpZWxkKS5jYW5jZWwoKVxuICB9LmJpbmQodGhpcykpXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgZm9ybS5jbGVhbmVkRGF0YSBvYmplY3RzIGZvciBldmVyeSBmb3JtIGluIHRoaXMuZm9ybXMoKS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmNsZWFuZWREYXRhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmb3JtcyA9IHRoaXMuaW5pdGlhbEZvcm1zKClcbiAgLy8gRG9uJ3QgaW5jbHVkZSBlbXB0eSBvciBpbmNvbXBsZXRlIGV4dHJhIGZvcm1zXG4gIGZvcm1zLnB1c2guYXBwbHkoZm9ybXMsIHRoaXMuZXh0cmFGb3JtcygpLmZpbHRlcihmdW5jdGlvbihmb3JtKSB7XG4gICAgcmV0dXJuIGZvcm0uaGFzQ2hhbmdlZCgpICYmIGZvcm0uaXNDb21wbGV0ZSgpXG4gIH0pKVxuICByZXR1cm4gZm9ybXMubWFwKGZ1bmN0aW9uKGZvcm0pIHsgcmV0dXJuIGZvcm0uY2xlYW5lZERhdGEgfSlcbn1cblxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBNdXRhYmlsaXR5ID09PVxuXG4vKipcbiAqIFNldHMgdGhlIGZvcm1zZXQncyBlbnRpcmUgaW5wdXQgZGF0YSwgYWxzbyB0cmlnZ2VyaW5nIHZhbGlkYXRpb24gYnkgZGVmYXVsdC5cbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsKj59IGRhdGEgbmV3IGlucHV0IGRhdGEgZm9yIGZvcm0sIHdoaWNoIG11c3QgYmVcbiAqICAgcHJlZml4ZWQgZm9yIHVuaXF1ZW5lc3MuXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLGJvb2xlYW4+fSBrd2FyZ3MgZGF0YSBzZXR0aW5nIG9wdGlvbnMuXG4gKiBAcmV0dXJuIHtib29sZWFufSBpZiBkYXRlIHNldHRpbmcgb3B0aW9ucyBpbmRpY2F0ZSB0aGUgbmV3IGRhdGEgc2hvdWxkIGJlXG4gKiAgIHZhbGlkYXRlZCwgdHJ1ZSBpZiB0aGUgbmV3IGRhdGEgaXMgdmFsaWQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24oZGF0YSwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe3ZhbGlkYXRlOiB0cnVlLCBfdHJpZ2dlclN0YXRlQ2hhbmdlOiB0cnVlfSwga3dhcmdzKVxuXG4gIHRoaXMuZGF0YSA9IGRhdGFcbiAgdmFyIGZvcm1EYXRhU2V0dGluZ09wdGlvbnMgPSB7XG4gICAgcHJlZml4ZWQ6IHRydWUsIHZhbGlkYXRlOiBrd2FyZ3MudmFsaWRhdGUsIF90cmlnZ2VyU3RhdGVDaGFuZ2U6IGZhbHNlXG4gIH1cbiAgdGhpcy5mb3JtcygpLmZvckVhY2goZnVuY3Rpb24oZm9ybSkge1xuICAgIGZvcm0uc2V0RGF0YShkYXRhLCBmb3JtRGF0YVNldHRpbmdPcHRpb25zKVxuICB9KVxuXG4gIGlmICh0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIHRoaXMuaXNJbml0aWFsUmVuZGVyID0gZmFsc2VcbiAgfVxuICBpZiAoa3dhcmdzLnZhbGlkYXRlKSB7XG4gICAgdGhpcy5fZXJyb3JzID0gbnVsbFxuICAgIC8vIFRoaXMgY2FsbCB1bHRpbWF0ZWx5IHRyaWdnZXJzIGEgZnVsbENsZWFuKCkgYmVjYXVzZSBfZXJyb3JzIGlzIG51bGxcbiAgICB2YXIgaXNWYWxpZCA9IHRoaXMuaXNWYWxpZCgpXG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gUHJldmVudCB2YWxpZGF0aW9uIGJlaW5nIHRyaWdnZXJlZCBpZiBlcnJvcnMoKSBpcyBhY2Nlc3NlZCBkdXJpbmcgcmVuZGVyXG4gICAgdGhpcy5fZXJyb3JzID0gW11cbiAgICB0aGlzLl9ub25Gb3JtRXJyb3JzID0gbmV3IHRoaXMuZXJyb3JDb25zdHJ1Y3RvcigpXG4gIH1cblxuICBpZiAoa3dhcmdzLl90cmlnZ2VyU3RhdGVDaGFuZ2UpIHtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxuICB9XG5cbiAgaWYgKGt3YXJncy52YWxpZGF0ZSkge1xuICAgIHJldHVybiBpc1ZhbGlkXG4gIH1cbn1cblxuLyoqXG4gKiBBbGlhcyB0byBrZWVwIHRoZSBGb3JtU2V0IGRhdGEgc2V0dGluZyBBUEkgdGhlIHNhbWUgYXMgRm9ybSdzLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuc2V0Rm9ybURhdGEgPSBCYXNlRm9ybVNldC5wcm90b3R5cGUuc2V0RGF0YVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEZvcm1zID09PVxuXG4vKipcbiAqIFJldHVybnMgdGhlIE1hbmFnZW1lbnRGb3JtIGluc3RhbmNlIGZvciB0aGlzIEZvcm1TZXQuXG4gKiBAYnJvd3NlciB0aGUgZm9ybSBpcyB1bmJvdW5kIGFuZCB1c2VzIGluaXRpYWwgZGF0YSBmcm9tIHRoaXMgRm9ybVNldC5cbiAqIEBzZXJ2ZXIgdGhlIGZvcm0gaXMgYm91bmQgdG8gc3VibWl0dGVkIGRhdGEuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5tYW5hZ2VtZW50Rm9ybSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZm9ybVxuICBpZiAoIWVudi5icm93c2VyICYmICF0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIGZvcm0gPSBuZXcgTWFuYWdlbWVudEZvcm0oe2RhdGE6IHRoaXMuZGF0YSwgYXV0b0lkOiB0aGlzLmF1dG9JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHRoaXMucHJlZml4fSlcbiAgICBpZiAoIWZvcm0uaXNWYWxpZCgpKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IoJ01hbmFnZW1lbnRGb3JtIGRhdGEgaXMgbWlzc2luZyBvciBoYXMgYmVlbiB0YW1wZXJlZCB3aXRoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29kZTogJ21pc3NpbmdfbWFuYWdlbWVudF9mb3JtJ30pXG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIHZhciBpbml0aWFsID0ge31cbiAgICBpbml0aWFsW1RPVEFMX0ZPUk1fQ09VTlRdID0gdGhpcy50b3RhbEZvcm1Db3VudCgpXG4gICAgaW5pdGlhbFtJTklUSUFMX0ZPUk1fQ09VTlRdID0gdGhpcy5pbml0aWFsRm9ybUNvdW50KClcbiAgICBpbml0aWFsW01JTl9OVU1fRk9STV9DT1VOVF0gPSB0aGlzLm1pbk51bVxuICAgIGluaXRpYWxbTUFYX05VTV9GT1JNX0NPVU5UXSA9IHRoaXMubWF4TnVtXG4gICAgZm9ybSA9IG5ldyBNYW5hZ2VtZW50Rm9ybSh7YXV0b0lkOiB0aGlzLmF1dG9JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHRoaXMucHJlZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWw6IGluaXRpYWx9KVxuICB9XG4gIGlmICh0aGlzLm1hbmFnZW1lbnRGb3JtQ3NzQ2xhc3MgIT09IG51bGwpIHtcbiAgICBmb3JtLmhpZGRlbkZpZWxkUm93Q3NzQ2xhc3MgPSB0aGlzLm1hbmFnZW1lbnRGb3JtQ3NzQ2xhc3NcbiAgfVxuICByZXR1cm4gZm9ybVxufVxuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG51bWJlciBvZiBmb3JtIGluc3RhbmNlcyB0aGlzIGZvcm1zZXQgY29udGFpbnMsIGJhc2VkIG9uXG4gKiBlaXRoZXIgc3VibWl0dGVkIG1hbmFnZW1lbnQgZGF0YSBvciBpbml0aWFsIGNvbmZpZ3VyYXRpb24sIGFzIGFwcHJvcHJpYXRlLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUudG90YWxGb3JtQ291bnQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCFlbnYuYnJvd3NlciAmJiAhdGhpcy5pc0luaXRpYWxSZW5kZXIpIHtcbiAgICAvLyBSZXR1cm4gYWJzb2x1dGVNYXggaWYgaXQgaXMgbG93ZXIgdGhhbiB0aGUgYWN0dWFsIHRvdGFsIGZvcm0gY291bnQgaW5cbiAgICAvLyB0aGUgZGF0YTsgdGhpcyBpcyBEb1MgcHJvdGVjdGlvbiB0byBwcmV2ZW50IGNsaWVudHMgIGZyb20gZm9yY2luZyB0aGVcbiAgICAvLyBzZXJ2ZXIgdG8gaW5zdGFudGlhdGUgYXJiaXRyYXJ5IG51bWJlcnMgb2YgZm9ybXMuXG4gICAgcmV0dXJuIE1hdGgubWluKHRoaXMubWFuYWdlbWVudEZvcm0oKS5jbGVhbmVkRGF0YVtUT1RBTF9GT1JNX0NPVU5UXSwgdGhpcy5hYnNvbHV0ZU1heClcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgaW5pdGlhbEZvcm1zID0gdGhpcy5pbml0aWFsRm9ybUNvdW50KClcbiAgICB2YXIgdG90YWxGb3JtcyA9IHRoaXMuaW5pdGlhbEZvcm1Db3VudCgpICsgdGhpcy5leHRyYVxuICAgIC8vIEFsbG93IGFsbCBleGlzdGluZyByZWxhdGVkIG9iamVjdHMvaW5saW5lcyB0byBiZSBkaXNwbGF5ZWQsIGJ1dCBkb24ndFxuICAgIC8vIGFsbG93IGV4dHJhIGJleW9uZCBtYXhfbnVtLlxuICAgIGlmICh0aGlzLm1heE51bSAhPT0gbnVsbCAmJlxuICAgICAgICBpbml0aWFsRm9ybXMgPiB0aGlzLm1heE51bSAmJlxuICAgICAgICB0aGlzLm1heE51bSA+PSAwKSB7XG4gICAgICB0b3RhbEZvcm1zID0gaW5pdGlhbEZvcm1zXG4gICAgfVxuICAgIGlmICh0aGlzLm1heE51bSAhPT0gbnVsbCAmJlxuICAgICAgICB0b3RhbEZvcm1zID4gdGhpcy5tYXhOdW0gJiZcbiAgICAgICAgdGhpcy5tYXhOdW0gPj0gMCkge1xuICAgICAgdG90YWxGb3JtcyA9IHRoaXMubWF4TnVtXG4gICAgfVxuICAgIHJldHVybiB0b3RhbEZvcm1zXG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBudW1iZXIgb2YgaW5pdGlhbCBmb3JtIGluc3RhbmNlcyB0aGlzIGZvcm1zZXQgY29udGFpbnMsIGJhc2VkXG4gKiBvbiBlaXRoZXIgc3VibWl0dGVkIG1hbmFnZW1lbnQgZGF0YSBvciBpbml0aWFsIGNvbmZpZ3VyYXRpb24sIGFzIGFwcHJvcHJpYXRlLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuaW5pdGlhbEZvcm1Db3VudCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIWVudi5icm93c2VyICYmICF0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIHJldHVybiB0aGlzLm1hbmFnZW1lbnRGb3JtKCkuY2xlYW5lZERhdGFbSU5JVElBTF9GT1JNX0NPVU5UXVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIFVzZSB0aGUgbGVuZ3RoIG9mIHRoZSBpbml0aWFsIGRhdGEgaWYgaXQncyB0aGVyZSwgMCBvdGhlcndpc2UuXG4gICAgcmV0dXJuICh0aGlzLmluaXRpYWwgIT09IG51bGwgJiYgdGhpcy5pbml0aWFsLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5pbml0aWFsLmxlbmd0aFxuICAgICAgICAgICAgOiAwKVxuICB9XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGZvcm1zIHdoZW4gZmlyc3QgYWNjZXNzZWQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5mb3JtcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fZm9ybXMgIT09IG51bGwpIHsgcmV0dXJuIHRoaXMuX2Zvcm1zIH1cbiAgdmFyIGZvcm1zID0gW11cbiAgdmFyIHRvdGFsRm9ybUNvdW50ID0gdGhpcy50b3RhbEZvcm1Db3VudCgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG90YWxGb3JtQ291bnQ7IGkrKykge1xuICAgIGZvcm1zLnB1c2godGhpcy5fY29uc3RydWN0Rm9ybShpKSlcbiAgfVxuICB0aGlzLl9mb3JtcyA9IGZvcm1zXG4gIHJldHVybiBmb3Jtc1xufVxuXG4vKipcbiAqIEFkZHMgYW5vdGhlciBmb3JtIGFuZCBpbmNyZW1lbnRzIGV4dHJhLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuYWRkQW5vdGhlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY3VycmVudEZvcm1Db3VudCA9IHRoaXMudG90YWxGb3JtQ291bnQoKVxuICB0aGlzLmV4dHJhKytcbiAgaWYgKHRoaXMuX2Zvcm1zICE9PSBudWxsKSB7XG4gICAgdGhpcy5fZm9ybXNbY3VycmVudEZvcm1Db3VudF0gPSB0aGlzLl9jb25zdHJ1Y3RGb3JtKGN1cnJlbnRGb3JtQ291bnQpXG4gIH1cbiB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG4vLyBBc3N1bXB0aW9uIC0gdGhlIFVJIHdpbGwgb25seSBsZXQgdGhlIHVzZXIgcmVtb3ZlIGV4dHJhIGZvcm1zXG5CYXNlRm9ybVNldC5wcm90b3R5cGUucmVtb3ZlRm9ybSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gIGlmICh0aGlzLmV4dHJhID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcmVtb3ZlIGEgZm9ybSB3aGVuIHRoZXJlIGFyZSBubyBleHRyYSBmb3Jtc1wiKVxuICB9XG4gIHRoaXMuZXh0cmEtLVxuICBpZiAodGhpcy5fZm9ybXMgIT09IG51bGwpIHtcbiAgICB0aGlzLl9mb3Jtcy5zcGxpY2UoaW5kZXgsIDEpXG4gIH1cbiAgaWYgKHRoaXMuX2Vycm9ycyAhPT0gbnVsbCkge1xuICAgIHRoaXMuX2Vycm9ycy5zcGxpY2UoaW5kZXgsIDEpXG4gIH1cbiB0aGlzLl9zdGF0ZUNoYW5nZWQoKVxufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgcmV0dXJucyB0aGUgaXRoIGZvcm0gaW5zdGFuY2UgaW4gdGhlIGZvcm1zZXQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5fY29uc3RydWN0Rm9ybSA9IGZ1bmN0aW9uKGkpIHtcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIGF1dG9JZDogdGhpcy5hdXRvSWRcbiAgLCBwcmVmaXg6IHRoaXMuYWRkUHJlZml4KGkpXG4gICwgZXJyb3JDb25zdHJ1Y3RvcjogdGhpcy5lcnJvckNvbnN0cnVjdG9yXG4gICwgdmFsaWRhdGlvbjogdGhpcy52YWxpZGF0aW9uXG4gICwgY29udHJvbGxlZDogdGhpcy5jb250cm9sbGVkXG4gICwgb25DaGFuZ2U6IHRoaXMub25DaGFuZ2VcbiAgfVxuICBpZiAoIXRoaXMuaXNJbml0aWFsUmVuZGVyKSB7XG4gICAgZGVmYXVsdHMuZGF0YSA9IHRoaXMuZGF0YVxuICAgIGRlZmF1bHRzLmZpbGVzID0gdGhpcy5maWxlc1xuICB9XG4gIGlmICh0aGlzLmluaXRpYWwgIT09IG51bGwgJiYgdGhpcy5pbml0aWFsLmxlbmd0aCA+IDApIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuaW5pdGlhbFtpXSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgZGVmYXVsdHMuaW5pdGlhbCA9IHRoaXMuaW5pdGlhbFtpXVxuICAgIH1cbiAgfVxuICAvLyBBbGxvdyBleHRyYSBmb3JtcyB0byBiZSBlbXB0eVxuICBpZiAoaSA+PSB0aGlzLmluaXRpYWxGb3JtQ291bnQoKSkge1xuICAgIGRlZmF1bHRzLmVtcHR5UGVybWl0dGVkID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGZvcm0gPSBuZXcgdGhpcy5mb3JtKGRlZmF1bHRzKVxuICB0aGlzLmFkZEZpZWxkcyhmb3JtLCBpKVxuICByZXR1cm4gZm9ybVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgaW5pdGlhbCBmb3JtcyBpbiB0aGlzIGZvcm1zZXQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5pbml0aWFsRm9ybXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZm9ybXMoKS5zbGljZSgwLCB0aGlzLmluaXRpYWxGb3JtQ291bnQoKSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGV4dHJhIGZvcm1zIGluIHRoaXMgZm9ybXNldC5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmV4dHJhRm9ybXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZm9ybXMoKS5zbGljZSh0aGlzLmluaXRpYWxGb3JtQ291bnQoKSlcbn1cblxuQmFzZUZvcm1TZXQucHJvdG90eXBlLmVtcHR5Rm9ybSA9IGZ1bmN0aW9uKCkge1xuICB2YXIga3dhcmdzID0ge1xuICAgIGF1dG9JZDogdGhpcy5hdXRvSWQsXG4gICAgcHJlZml4OiB0aGlzLmFkZFByZWZpeCgnX19wcmVmaXhfXycpLFxuICAgIGVtcHR5UGVybWl0dGVkOiB0cnVlXG4gIH1cbiAgdmFyIGZvcm0gPSBuZXcgdGhpcy5mb3JtKGt3YXJncylcbiAgdGhpcy5hZGRGaWVsZHMoZm9ybSwgbnVsbClcbiAgcmV0dXJuIGZvcm1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBmb3JtcyB0aGF0IGhhdmUgYmVlbiBtYXJrZWQgZm9yIGRlbGV0aW9uLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuZGVsZXRlZEZvcm1zID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5pc1ZhbGlkKCkgfHwgIXRoaXMuY2FuRGVsZXRlKSB7IHJldHVybiBbXSB9XG5cbiAgdmFyIGZvcm1zID0gdGhpcy5mb3JtcygpXG5cbiAgLy8gQ29uc3RydWN0IF9kZWxldGVkRm9ybUluZGV4ZXMsIHdoaWNoIGlzIGp1c3QgYSBsaXN0IG9mIGZvcm0gaW5kZXhlc1xuICAvLyB0aGF0IGhhdmUgaGFkIHRoZWlyIGRlbGV0aW9uIHdpZGdldCBzZXQgdG8gdHJ1ZS5cbiAgaWYgKHR5cGVvZiB0aGlzLl9kZWxldGVkRm9ybUluZGV4ZXMgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLl9kZWxldGVkRm9ybUluZGV4ZXMgPSBbXVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gZm9ybXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgZm9ybSA9IGZvcm1zW2ldXG4gICAgICAvLyBJZiB0aGlzIGlzIGFuIGV4dHJhIGZvcm0gYW5kIGhhc24ndCBjaGFuZ2VkLCBpZ25vcmUgaXRcbiAgICAgIGlmIChpID49IHRoaXMuaW5pdGlhbEZvcm1Db3VudCgpICYmICFmb3JtLmhhc0NoYW5nZWQoKSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3Nob3VsZERlbGV0ZUZvcm0oZm9ybSkpIHtcbiAgICAgICAgdGhpcy5fZGVsZXRlZEZvcm1JbmRleGVzLnB1c2goaSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5fZGVsZXRlZEZvcm1JbmRleGVzLm1hcChmdW5jdGlvbihpKSB7IHJldHVybiBmb3Jtc1tpXSB9KVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGZvcm1zIGluIHRoZSBvcmRlciBzcGVjaWZpZWQgYnkgdGhlIGluY29taW5nIGRhdGEuXG4gKiBUaHJvd3MgYW4gRXJyb3IgaWYgb3JkZXJpbmcgaXMgbm90IGFsbG93ZWQuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5vcmRlcmVkRm9ybXMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmlzVmFsaWQoKSB8fCAhdGhpcy5jYW5PcmRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcih0aGlzLmNvbnN0cnVjdG9yLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICBcIiBvYmplY3QgaGFzIG5vIGF0dHJpYnV0ZSAnb3JkZXJlZEZvcm1zJ1wiKVxuICB9XG5cbiAgdmFyIGZvcm1zID0gdGhpcy5mb3JtcygpXG5cbiAgLy8gQ29uc3RydWN0IF9vcmRlcmluZywgd2hpY2ggaXMgYSBsaXN0IG9mIFtmb3JtIGluZGV4LCBvcmRlckZpZWxkVmFsdWVdXG4gIC8vIHBhaXJzLiBBZnRlciBjb25zdHJ1Y3RpbmcgdGhpcyBsaXN0LCB3ZSdsbCBzb3J0IGl0IGJ5IG9yZGVyRmllbGRWYWx1ZVxuICAvLyBzbyB3ZSBoYXZlIGEgd2F5IHRvIGdldCB0byB0aGUgZm9ybSBpbmRleGVzIGluIHRoZSBvcmRlciBzcGVjaWZpZWQgYnlcbiAgLy8gdGhlIGZvcm0gZGF0YS5cbiAgaWYgKHR5cGVvZiB0aGlzLl9vcmRlcmluZyA9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMuX29yZGVyaW5nID0gW11cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGZvcm1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGZvcm0gPSBmb3Jtc1tpXVxuICAgICAgLy8gSWYgdGhpcyBpcyBhbiBleHRyYSBmb3JtIGFuZCBoYXNuJ3QgY2hhbmdlZCwgaWdub3JlIGl0XG4gICAgICBpZiAoaSA+PSB0aGlzLmluaXRpYWxGb3JtQ291bnQoKSAmJiAhZm9ybS5oYXNDaGFuZ2VkKCkpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIC8vIERvbid0IGFkZCBkYXRhIG1hcmtlZCBmb3IgZGVsZXRpb25cbiAgICAgIGlmICh0aGlzLmNhbkRlbGV0ZSAmJiB0aGlzLl9zaG91bGREZWxldGVGb3JtKGZvcm0pKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICB0aGlzLl9vcmRlcmluZy5wdXNoKFtpLCBmb3JtLmNsZWFuZWREYXRhW09SREVSSU5HX0ZJRUxEX05BTUVdXSlcbiAgICB9XG5cbiAgICAvLyBOdWxsIHNob3VsZCBiZSBzb3J0ZWQgYmVsb3cgYW55dGhpbmcgZWxzZS4gQWxsb3dpbmcgbnVsbCBhcyBhXG4gICAgLy8gY29tcGFyaXNvbiB2YWx1ZSBtYWtlcyBpdCBzbyB3ZSBjYW4gbGVhdmUgb3JkZXJpbmcgZmllbGRzIGJsYW5rLlxuICAgIHRoaXMuX29yZGVyaW5nLnNvcnQoZnVuY3Rpb24oeCwgeSkge1xuICAgICAgaWYgKHhbMV0gPT09IG51bGwgJiYgeVsxXSA9PT0gbnVsbCkge1xuICAgICAgICAvLyBTb3J0IGJ5IGZvcm0gaW5kZXggaWYgYm90aCBvcmRlciBmaWVsZCB2YWx1ZXMgYXJlIG51bGxcbiAgICAgICAgcmV0dXJuIHhbMF0gLSB5WzBdXG4gICAgICB9XG4gICAgICBpZiAoeFsxXSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gMVxuICAgICAgfVxuICAgICAgaWYgKHlbMV0gPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICByZXR1cm4geFsxXSAtIHlbMV1cbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuX29yZGVyaW5nLm1hcChmdW5jdGlvbihvcmRlcmluZykgeyByZXR1cm4gZm9ybXNbb3JkZXJpbmdbMF1dfSlcbn1cblxuLyoqXG4gKiBBIGhvb2sgZm9yIGFkZGluZyBleHRyYSBmaWVsZHMgb24gdG8gZWFjaCBmb3JtIGluc3RhbmNlLlxuICogQHBhcmFtIHtGb3JtfSBmb3JtIHRoZSBmb3JtIGZpZWxkcyBhcmUgdG8gYmUgYWRkZWQgdG8uXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXggdGhlIGluZGV4IG9mIHRoZSBnaXZlbiBmb3JtIGluIHRoZSBmb3Jtc2V0LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuYWRkRmllbGRzID0gZnVuY3Rpb24oZm9ybSwgaW5kZXgpIHtcbiAgaWYgKHRoaXMuY2FuT3JkZXIpIHtcbiAgICAvLyBPbmx5IHByZS1maWxsIHRoZSBvcmRlcmluZyBmaWVsZCBmb3IgaW5pdGlhbCBmb3Jtc1xuICAgIGlmIChpbmRleCAhPSBudWxsICYmIGluZGV4IDwgdGhpcy5pbml0aWFsRm9ybUNvdW50KCkpIHtcbiAgICAgIGZvcm0uZmllbGRzW09SREVSSU5HX0ZJRUxEX05BTUVdID1cbiAgICAgICAgICBJbnRlZ2VyRmllbGQoe2xhYmVsOiAnT3JkZXInLCBpbml0aWFsOiBpbmRleCArIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogZmFsc2V9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGZvcm0uZmllbGRzW09SREVSSU5HX0ZJRUxEX05BTUVdID1cbiAgICAgICAgICBJbnRlZ2VyRmllbGQoe2xhYmVsOiAnT3JkZXInLCByZXF1aXJlZDogZmFsc2V9KVxuICAgIH1cbiAgfVxuICBpZiAodGhpcy5jYW5EZWxldGUpIHtcbiAgICBmb3JtLmZpZWxkc1tERUxFVElPTl9GSUVMRF9OQU1FXSA9XG4gICAgICAgIEJvb2xlYW5GaWVsZCh7bGFiZWw6ICdEZWxldGUnLCByZXF1aXJlZDogZmFsc2V9KVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgZm9ybSB3YXMgbWFya2VkIGZvciBkZWxldGlvbi5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLl9zaG91bGREZWxldGVGb3JtID0gZnVuY3Rpb24oZm9ybSkge1xuICByZXR1cm4gb2JqZWN0LmdldChmb3JtLmNsZWFuZWREYXRhLCBERUxFVElPTl9GSUVMRF9OQU1FLCBmYWxzZSlcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IEVycm9ycyA9PT1cblxuQmFzZUZvcm1TZXQucHJvdG90eXBlLmFkZEVycm9yID0gZnVuY3Rpb24oZXJyb3IpIHtcbiAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7XG4gICAgLy8gTm9ybWFsaXNlIHRvIFZhbGlkYXRpb25FcnJvciBhbmQgbGV0IGl0cyBjb25zdHJ1Y3RvciBkbyB0aGUgaGFyZCB3b3JrIG9mXG4gICAgLy8gbWFraW5nIHNlbnNlIG9mIHRoZSBpbnB1dC5cbiAgICBlcnJvciA9IFZhbGlkYXRpb25FcnJvcihlcnJvcilcbiAgfVxuXG4gIHRoaXMuX25vbkZvcm1FcnJvcnMuZXh0ZW5kKGVycm9yLmVycm9yTGlzdClcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBmb3JtLmVycm9ycyBmb3IgZXZlcnkgZm9ybSBpbiB0aGlzLmZvcm1zLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuZXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl9lcnJvcnMgPT09IG51bGwpIHtcbiAgICB0aGlzLmZ1bGxDbGVhbigpXG4gIH1cbiAgcmV0dXJuIHRoaXMuX2Vycm9yc1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gRXJyb3JMaXN0IG9mIGVycm9ycyB0aGF0IGFyZW4ndCBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyXG4gKiBmb3JtIC0tIGkuZS4sIGZyb20gZm9ybXNldC5jbGVhbigpLiBSZXR1cm5zIGFuIGVtcHR5IEVycm9yTGlzdCBpZiB0aGVyZSBhcmVcbiAqIG5vbmUuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5ub25Gb3JtRXJyb3JzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl9ub25Gb3JtRXJyb3JzID09PSBudWxsKSB7XG4gICAgdGhpcy5mdWxsQ2xlYW4oKVxuICB9XG4gIHJldHVybiB0aGlzLl9ub25Gb3JtRXJyb3JzXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGVycm9ycyBhY3Jvc3MgYWxsIGZvcm1zIGluIHRoZSBmb3Jtc2V0LlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUudG90YWxFcnJvckNvdW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAodGhpcy5ub25Gb3JtRXJyb3JzKCkubGVuZ3RoKCkgK1xuICAgICAgICAgIHRoaXMuZXJyb3JzKCkucmVkdWNlKGZ1bmN0aW9uKHN1bSwgZm9ybUVycm9ycykge1xuICAgICAgICAgICAgcmV0dXJuIHN1bSArIGZvcm1FcnJvcnMubGVuZ3RoKClcbiAgICAgICAgICB9LCAwKSlcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFN0YXR1cyA9PT1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYW55IGZvcm0gZGlmZmVycyBmcm9tIGluaXRpYWwuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5oYXNDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmb3JtcyA9IHRoaXMuZm9ybXMoKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZvcm1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChmb3Jtc1tpXS5oYXNDaGFuZ2VkKCkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGZvcm1zZXQgbmVlZHMgYSBjYWxsYmFjayBhcmd1bWVudCBmb3IgZmluYWxcbiAqICAgdmFsaWRhdGlvbi5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmlzQXN5bmMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLmNsZWFuLmxlbmd0aCA9PSAxIHx8IGZvcm1zLmlzRm9ybUFzeW5jKHRoaXMuZm9ybSkpXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZm9ybXNldCBuZWVkcyB0byBiZSBtdWx0aXBhcnQtZW5jb2RlZCwgaS5lLiBpdFxuICogaGFzIGEgRmlsZUlucHV0LiBPdGhlcndpc2UsIGZhbHNlLlxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuaXNNdWx0aXBhcnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0aGlzLmZvcm1zKCkubGVuZ3RoID4gMCAmJiB0aGlzLmZvcm1zKClbMF0uaXNNdWx0aXBhcnQoKSlcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBmb3Jtc2V0IGlzIHdhaXRpbmcgZm9yIGFzeW5jIHZhbGlkYXRpb24gdG9cbiAqICAgY29tcGxldGUuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5pc1BlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICFpcy5FbXB0eSh0aGlzLl9wZW5kaW5nQXN5bmNWYWxpZGF0aW9uKVxufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBldmVyeSBmb3JtIGluIHRoaXMuZm9ybXMoKSBpcyB2YWxpZCBhbmQgdGhlcmUgYXJlIG5vIG5vbi1mb3JtXG4gKiBlcnJvcnMuXG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzSW5pdGlhbFJlbmRlcikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIC8vIFRyaWdnZXJzIGEgZnVsbCBjbGVhblxuICB2YXIgZXJyb3JzID0gdGhpcy5lcnJvcnMoKVxuICB2YXIgZm9ybXMgPSB0aGlzLmZvcm1zKClcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBlcnJvcnMubGVuZ3RoOyBpIDwgbCA7IGkrKykge1xuICAgIGlmIChlcnJvcnNbaV0uaXNQb3B1bGF0ZWQoKSkge1xuICAgICAgaWYgKHRoaXMuY2FuRGVsZXRlICYmIHRoaXMuX3Nob3VsZERlbGV0ZUZvcm0oZm9ybXNbaV0pKSB7XG4gICAgICAgIC8vIFRoaXMgZm9ybSBpcyBnb2luZyB0byBiZSBkZWxldGVkIHNvIGFueSBvZiBpdHMgZXJyb3JzIHNob3VsZFxuICAgICAgICAvLyBub3QgY2F1c2UgdGhlIGVudGlyZSBmb3Jtc2V0IHRvIGJlIGludmFsaWQuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuICF0aGlzLm5vbkZvcm1FcnJvcnMoKS5pc1BvcHVsYXRlZCgpXG59XG5cbi8qKlxuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZm9ybXNldCBpcyB3YWl0aW5nIGZvciBhc3luYyB2YWxpZGF0aW9uIG9mIGl0c1xuICogICBjbGVhbigpIG1ldGhvZCB0byBjb21wbGV0ZS5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLm5vbkZvcm1QZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0eXBlb2YgdGhpcy5fcGVuZGluZ0FzeW5jVmFsaWRhdGlvbltDTEVBTl9WQUxJREFUSU9OXSAhPSAndW5kZWZpbmVkJ1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IFByZWZpeGVzID09PVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZvcm1zZXQgcHJlZml4IHdpdGggdGhlIGZvcm0gaW5kZXggYXBwZW5kZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXggdGhlIGluZGV4IG9mIGEgZm9ybSBpbiB0aGUgZm9ybXNldC5cbiAqL1xuQmFzZUZvcm1TZXQucHJvdG90eXBlLmFkZFByZWZpeCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gIHJldHVybiB0aGlzLnByZWZpeCArICctJyArIGluZGV4XG59XG5cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5nZXREZWZhdWx0UHJlZml4ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnZm9ybSdcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBEZWZhdWx0IFJlbmRlcmluZyA9PT1cblxuLyoqXG4gKiBEZWZhdWx0IHJlbmRlciBtZXRob2QsIHdoaWNoIGp1c3QgY2FsbHMgYXNUYWJsZSgpLlxuICogQHJldHVybiB7QXJyYXkuPFJlYWN0RWxlbWVudD59XG4gKi9cbkJhc2VGb3JtU2V0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuYXNUYWJsZSgpXG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgZm9ybXNldCBhcyA8dHI+cyAtIGV4Y2x1ZGluZyB0aGUgPHRhYmxlPi5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuYXNUYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBYWFg6IHRoZXJlIGlzIG5vIHNlbWFudGljIGRpdmlzaW9uIGJldHdlZW4gZm9ybXMgaGVyZSwgdGhlcmUgcHJvYmFibHlcbiAgLy8gc2hvdWxkIGJlLiBJdCBtaWdodCBtYWtlIHNlbnNlIHRvIHJlbmRlciBlYWNoIGZvcm0gYXMgYSB0YWJsZSByb3cgd2l0aFxuICAvLyBlYWNoIGZpZWxkIGFzIGEgdGQuXG4gIHZhciByb3dzID0gdGhpcy5tYW5hZ2VtZW50Rm9ybSgpLmFzVGFibGUoKVxuICB0aGlzLmZvcm1zKCkuZm9yRWFjaChmdW5jdGlvbihmb3JtKSB7IHJvd3MgPSByb3dzLmNvbmNhdChmb3JtLmFzVGFibGUoKSkgfSlcbiAgaWYgKHRoaXMubm9uRm9ybVBlbmRpbmcoKSkge1xuICAgIHJvd3MucHVzaChSZWFjdC5jcmVhdGVFbGVtZW50KCd0cicsIHtrZXk6ICdfX3BlbmRpbmdfXyd9XG4gICAgLCBSZWFjdC5jcmVhdGVFbGVtZW50KCd0ZCcsIHtjb2xTcGFuOiAyfVxuICAgICAgLCBSZWFjdC5jcmVhdGVFbGVtZW50KCdwcm9ncmVzcycsIG51bGwsICcuLi4nKVxuICAgICAgKVxuICAgICkpXG4gIH1cbiAgcmV0dXJuIHJvd3Ncbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmb3Jtc2V0IGFzIDxkaXY+cy5cbiAqIEByZXR1cm4ge0FycmF5LjxSZWFjdEVsZW1lbnQ+fVxuICovXG5CYXNlRm9ybVNldC5wcm90b3R5cGUuYXNEaXYgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJvd3MgPSB0aGlzLm1hbmFnZW1lbnRGb3JtKCkuYXNEaXYoKVxuICB0aGlzLmZvcm1zKCkuZm9yRWFjaChmdW5jdGlvbihmb3JtKSB7IHJvd3MgPSByb3dzLmNvbmNhdChmb3JtLmFzRGl2KCkpIH0pXG4gIGlmICh0aGlzLm5vbkZvcm1QZW5kaW5nKCkpIHtcbiAgICByb3dzLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge2tleTogJ19fcGVuZGluZ19fJ31cbiAgICAsIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3Byb2dyZXNzJywgbnVsbCwgJy4uLicpXG4gICAgKSlcbiAgfVxuICByZXR1cm4gcm93c1xufVxuXG52YXIgZm9ybXNldFByb3BzID0ge1xuICBhdXRvSWQ6IHV0aWwuYXV0b0lkQ2hlY2tlclxuLCBjb250cm9sbGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuLCBkYXRhOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG4sIGVycm9yQ29uc3RydWN0b3I6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4sIGZpbGVzOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG4sIGluaXRpYWw6IFJlYWN0LlByb3BUeXBlcy5vYmplY3Rcbiwgb25DaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4sIHByZWZpeDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuLCB2YWxpZGF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub25lT2ZUeXBlKFtcbiAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gICwgUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuICBdKVxufVxuXG52YXIgZm9ybXNldEZhY3RvcnlQcm9wcyA9IHtcbiAgY2FuRGVsZXRlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuLCBjYW5PcmRlcjogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiwgZXh0cmE6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiwgZm9ybXNldDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiwgbWF4TnVtOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4sIG1pbk51bTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuLCB2YWxpZGF0ZU1heDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiwgdmFsaWRhdGVNaW46IFJlYWN0LlByb3BUeXBlcy5ib29sXG59XG5cbi8qKlxuICogUmVuZGVycyBhIEZvcm1zZXQuIEEgZm9ybXNldCBpbnN0YW5jZSBvciBjb25zdHJ1Y3RvciBjYW4gYmUgZ2l2ZW4uIElmIGFcbiAqIGNvbnN0cnVjdG9yIGlzIGdpdmVuLCBhbiBpbnN0YW5jZSB3aWxsIGJlIGNyZWF0ZWQgd2hlbiB0aGUgY29tcG9uZW50IGlzXG4gKiBtb3VudGVkLCBhbmQgYW55IGFkZGl0aW9uYWwgcHJvcHMgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yIGFzXG4gKiBvcHRpb25zLlxuICovXG52YXIgUmVuZGVyRm9ybVNldCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZGlzcGxheU5hbWU6ICdSZW5kZXJGb3JtU2V0JyxcbiAgcHJvcFR5cGVzOiBvYmplY3QuZXh0ZW5kKHt9LCBmb3Jtc2V0RmFjdG9yeVByb3BzLCBmb3Jtc2V0UHJvcHMsIHtcbiAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcgICAgICAgICAvLyBDbGFzcyBmb3IgdGhlIGNvbXBvbmVudCB3cmFwcGluZyBhbGwgZm9ybXNcbiAgLCBjb21wb25lbnQ6IFJlYWN0LlByb3BUeXBlcy5hbnkgICAgICAgICAgICAvLyBDb21wb25lbnQgdG8gd3JhcCBhbGwgZm9ybXNcbiAgLCBmb3JtQ29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55ICAgICAgICAvLyBDb21wb25lbnQgdG8gd3JhcCBlYWNoIGZvcm1cbiAgLCBmb3JtOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyAgICAgICAgICAgICAgICAvLyBGb3JtIGNvbnN0cnVjdG9yXG4gICwgZm9ybXNldDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbICAgICAgLy8gRm9ybXNldCBpbnN0YW5jZSBvciBjb25zdHJ1Y3RvclxuICAgICAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgICBSZWFjdC5Qcm9wVHlwZXMuaW5zdGFuY2VPZihCYXNlRm9ybVNldClcbiAgICBdKVxuICAsIHJvdzogUmVhY3QuUHJvcFR5cGVzLmFueSAgICAgICAgICAgICAgICAgIC8vIENvbXBvbmVudCB0byByZW5kZXIgZm9ybSByb3dzXG4gICwgcm93Q29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuYW55ICAgICAgICAgLy8gQ29tcG9uZW50IHRvIHdyYXAgZWFjaCBmb3JtIHJvd1xuICAsIHVzZU1hbmFnZW1lbnRGb3JtOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCAgIC8vIFNob3VsZCBNYW5hZ2VtZW50Rm9ybSBoaWRkZW4gZmllbGRzIGJlIHJlbmRlcmVkP1xuICAsIF9fYWxsX186IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICBpZiAoIXByb3BzLmZvcm0gJiYgIXByb3BzLmZvcm1zZXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgICAgICAnSW52YWxpZCBwcm9wcyBzdXBwbGllZCB0byBgUmVuZGVyRm9ybVNldGAsIGVpdGhlciBgZm9ybWAgb3IgJyArXG4gICAgICAgICAgJ2Bmb3Jtc2V0YCBtdXN0IGJlIHNwZWNpZmllZC4nXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gIH0pLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudDogJ2RpdidcbiAgICAsIGZvcm1Db21wb25lbnQ6ICdkaXYnXG4gICAgLCByb3c6IGZvcm1zLkZvcm1Sb3dcbiAgICAsIHJvd0NvbXBvbmVudDogJ2RpdidcbiAgICAsIHVzZU1hbmFnZW1lbnRGb3JtOiBmYWxzZVxuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3Jtc2V0ID0gdGhpcy5wcm9wcy5mb3Jtc2V0XG4gICAgLy8gQ3JlYXRlIGEgbmV3IEZvcm1TZXQgY29uc3RydWN0b3IgaWYgYSBGb3JtIGNvbnN0cnVjdG9yIHdhcyBnaXZlblxuICAgIGlmICh0aGlzLnByb3BzLmZvcm0pIHtcbiAgICAgIGZvcm1zZXQgPSBmb3Jtc2V0RmFjdG9yeSh0aGlzLnByb3BzLmZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXRpbC5nZXRQcm9wcyh0aGlzLnByb3BzLCBPYmplY3Qua2V5cyhmb3Jtc2V0RmFjdG9yeVByb3BzKSkpXG4gICAgfVxuICAgIGlmIChmb3Jtc2V0IGluc3RhbmNlb2YgQmFzZUZvcm1TZXQpIHtcbiAgICAgIHRoaXMuZm9ybXNldCA9IGZvcm1zZXRcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmZvcm1zZXQgPSBuZXcgZm9ybXNldChvYmplY3QuZXh0ZW5kKHtcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMuZm9yY2VVcGRhdGUuYmluZCh0aGlzKVxuICAgICAgfSwgdXRpbC5nZXRQcm9wcyh0aGlzLnByb3BzLCBPYmplY3Qua2V5cyhmb3Jtc2V0UHJvcHMpKSkpXG4gICAgfVxuICB9LFxuXG4gIGdldEZvcm1zZXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmZvcm1zZXRcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3Jtc2V0ID0gdGhpcy5mb3Jtc2V0XG4gICAgdmFyIHByb3BzID0gdGhpcy5wcm9wc1xuICAgIHZhciBhdHRycyA9IHt9XG4gICAgaWYgKHRoaXMucHJvcHMuY2xhc3NOYW1lKSB7XG4gICAgICBhdHRycy5jbGFzc05hbWUgPSBwcm9wcy5jbGFzc05hbWVcbiAgICB9XG4gICAgdmFyIHRvcEVycm9ycyA9IGZvcm1zZXQubm9uRm9ybUVycm9ycygpXG5cbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChwcm9wcy5jb21wb25lbnQsIGF0dHJzLFxuICAgICAgdG9wRXJyb3JzLmlzUG9wdWxhdGVkKCkgJiYgUmVhY3QuY3JlYXRlRWxlbWVudChwcm9wcy5yb3csIHtcbiAgICAgICAgY2xhc3NOYW1lOiBmb3Jtc2V0LmVycm9yQ3NzQ2xhc3NcbiAgICAgICwgY29udGVudDogdG9wRXJyb3JzLnJlbmRlcigpXG4gICAgICAsIGtleTogZm9ybXNldC5hZGRQcmVmaXgoJ19fYWxsX18nKVxuICAgICAgLCByb3dDb21wb25lbnQ6IHByb3BzLnJvd0NvbXBvbmVudFxuICAgICAgfSksXG4gICAgICBmb3Jtc2V0LmZvcm1zKCkubWFwKGZ1bmN0aW9uKGZvcm0pIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoZm9ybXMuUmVuZGVyRm9ybSwge1xuICAgICAgICAgIGZvcm06IGZvcm1cbiAgICAgICAgLCBmb3JtQ29tcG9uZW50OiBwcm9wcy5mb3JtQ29tcG9uZW50XG4gICAgICAgICwgcm93OiBwcm9wcy5yb3dcbiAgICAgICAgLCByb3dDb21wb25lbnQ6IHByb3BzLnJvd0NvbXBvbmVudFxuICAgICAgICB9KVxuICAgICAgfSksXG4gICAgICBmb3Jtc2V0Lm5vbkZvcm1QZW5kaW5nKCkgJiYgUmVhY3QuY3JlYXRlRWxlbWVudChwcm9wcy5yb3csIHtcbiAgICAgICAgY2xhc3NOYW1lOiBmb3Jtc2V0LnBlbmRpbmdSb3dDc3NDbGFzc1xuICAgICAgLCBjb250ZW50OiBSZWFjdC5jcmVhdGVFbGVtZW50KCdwcm9ncmVzcycsIG51bGwsICdWYWxpZGF0aW5nLi4uJylcbiAgICAgICwga2V5OiBmb3Jtc2V0LmFkZFByZWZpeCgnX19wZW5kaW5nX18nKVxuICAgICAgLCByb3dDb21wb25lbnQ6IHByb3BzLnJvd0NvbXBvbmVudFxuICAgICAgfSksXG4gICAgICBwcm9wcy51c2VNYW5hZ2VtZW50Rm9ybSAmJiBSZWFjdC5jcmVhdGVFbGVtZW50KGZvcm1zLlJlbmRlckZvcm0sIHtcbiAgICAgICAgZm9ybTogZm9ybXNldC5tYW5hZ2VtZW50Rm9ybSgpXG4gICAgICAsIGZvcm1Db21wb25lbnQ6IHByb3BzLmZvcm1Db21wb25lbnRcbiAgICAgICwgcm93OiBwcm9wcy5yb3dcbiAgICAgICwgcm93Q29tcG9uZW50OiBwcm9wcy5yb3dDb21wb25lbnRcbiAgICAgIH0pXG4gICAgKVxuICB9XG59KVxuXG4vKipcbiAqIENyZWF0ZXMgYSBGb3JtU2V0IGNvbnN0cnVjdG9yIGZvciB0aGUgZ2l2ZW4gRm9ybSBjb25zdHJ1Y3Rvci5cbiAqIEBwYXJhbSB7Rm9ybX0gZm9ybVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xuZnVuY3Rpb24gZm9ybXNldEZhY3RvcnkoZm9ybSwga3dhcmdzKSB7XG4gIC8vIFRPRE8gUGVyZm9ybSBQcm9wVHlwZSBjaGVja3Mgb24ga3dhcmdzIGluIGRldmVsb3BtZW50IG1vZGVcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7XG4gICAgZm9ybXNldDogQmFzZUZvcm1TZXQsIGV4dHJhOiAxLCBjYW5PcmRlcjogZmFsc2UsIGNhbkRlbGV0ZTogZmFsc2UsXG4gICAgbWF4TnVtOiBERUZBVUxUX01BWF9OVU0sIHZhbGlkYXRlTWF4OiBmYWxzZSxcbiAgICBtaW5OdW06IERFRkFVTFRfTUlOX05VTSwgdmFsaWRhdGVNaW46IGZhbHNlXG4gIH0sIGt3YXJncylcblxuICAvLyBSZW1vdmUgc3BlY2lhbCBwcm9wZXJ0aWVzIGZyb20ga3dhcmdzLCBhcyBpdCB3aWxsIHN1YnNlcXVlbnRseSBiZSB1c2VkIHRvXG4gIC8vIGFkZCBwcm9wZXJ0aWVzIHRvIHRoZSBuZXcgZm9ybXNldCdzIHByb3RvdHlwZS5cbiAgdmFyIGZvcm1zZXQgPSBvYmplY3QucG9wKGt3YXJncywgJ2Zvcm1zZXQnKVxuICB2YXIgZXh0cmEgPSBvYmplY3QucG9wKGt3YXJncywgJ2V4dHJhJylcbiAgdmFyIGNhbk9yZGVyID0gb2JqZWN0LnBvcChrd2FyZ3MsICdjYW5PcmRlcicpXG4gIHZhciBjYW5EZWxldGUgPSBvYmplY3QucG9wKGt3YXJncywgJ2NhbkRlbGV0ZScpXG4gIHZhciBtYXhOdW0gPSBvYmplY3QucG9wKGt3YXJncywgJ21heE51bScpXG4gIHZhciB2YWxpZGF0ZU1heCA9IG9iamVjdC5wb3Aoa3dhcmdzLCAndmFsaWRhdGVNYXgnKVxuICB2YXIgbWluTnVtID0gb2JqZWN0LnBvcChrd2FyZ3MsICdtaW5OdW0nKVxuICB2YXIgdmFsaWRhdGVNaW4gPSBvYmplY3QucG9wKGt3YXJncywgJ3ZhbGlkYXRlTWluJylcblxuICAvLyBIYXJkIGxpbWl0IG9uIGZvcm1zIGluc3RhbnRpYXRlZCwgdG8gcHJldmVudCBtZW1vcnktZXhoYXVzdGlvbiBhdHRhY2tzXG4gIC8vIGxpbWl0IGlzIHNpbXBseSBtYXhOdW0gKyBERUZBVUxUX01BWF9OVU0gKHdoaWNoIGlzIDIgKiBERUZBVUxUX01BWF9OVU1cbiAgLy8gaWYgbWF4TnVtIGlzIG5vdCBwcm92aWRlZCBpbiB0aGUgZmlyc3QgcGxhY2UpXG4gIHZhciBhYnNvbHV0ZU1heCA9IG1heE51bSArIERFRkFVTFRfTUFYX05VTVxuICBleHRyYSArPSBtaW5OdW1cblxuICBrd2FyZ3MuY29uc3RydWN0b3IgPSBmdW5jdGlvbihrd2FyZ3MpIHtcbiAgICB0aGlzLmZvcm0gPSBmb3JtXG4gICAgdGhpcy5leHRyYSA9IGV4dHJhXG4gICAgdGhpcy5jYW5PcmRlciA9IGNhbk9yZGVyXG4gICAgdGhpcy5jYW5EZWxldGUgPSBjYW5EZWxldGVcbiAgICB0aGlzLm1heE51bSA9IG1heE51bVxuICAgIHRoaXMudmFsaWRhdGVNYXggPSB2YWxpZGF0ZU1heFxuICAgIHRoaXMubWluTnVtID0gbWluTnVtXG4gICAgdGhpcy52YWxpZGF0ZU1pbiA9IHZhbGlkYXRlTWluXG4gICAgdGhpcy5hYnNvbHV0ZU1heCA9IGFic29sdXRlTWF4XG4gICAgZm9ybXNldC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuXG4gIHJldHVybiBmb3Jtc2V0LmV4dGVuZChrd2FyZ3MpXG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGV2ZXJ5IGZvcm1zZXQgaW4gZm9ybXNldHMgaXMgdmFsaWQuXG4gKi9cbmZ1bmN0aW9uIGFsbFZhbGlkKGZvcm1zZXRzKSB7XG4gIHZhciB2YWxpZCA9IHRydWVcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmb3Jtc2V0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoIWZvcm1zZXRzW2ldLmlzVmFsaWQoKSkge1xuICAgICAgdmFsaWQgPSBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsaWRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFsbFZhbGlkOiBhbGxWYWxpZFxuLCBCYXNlRm9ybVNldDogQmFzZUZvcm1TZXRcbiwgREVGQVVMVF9NQVhfTlVNOiBERUZBVUxUX01BWF9OVU1cbiwgZm9ybXNldEZhY3Rvcnk6IGZvcm1zZXRGYWN0b3J5XG4sIFJlbmRlckZvcm1TZXQ6IFJlbmRlckZvcm1TZXRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG52YXIgdGltZSA9IHJlcXVpcmUoJ2lzb21vcnBoL3RpbWUnKVxuXG52YXIgZGVmYXVsdExvY2FsZSA9IHtsYW5nOiAnZW4nfVxuXG52YXIgbG9jYWxlQ2FjaGUgPSB7XG4gIGVuOiB7XG4gICAgREFURV9JTlBVVF9GT1JNQVRTOiBbXG4gICAgICAnJVktJW0tJWQnICAgICAgICAgICAgICAgICAgICAgICAgLy8gJzIwMDYtMTAtMjUnXG4gICAgLCAnJW0vJWQvJVknLCAnJW0vJWQvJXknICAgICAgICAgICAgLy8gJzEwLzI1LzIwMDYnLCAnMTAvMjUvMDYnXG4gICAgLCAnJWIgJWQgJVknLCAnJWIgJWQsICVZJyAgICAgICAgICAgLy8gJ09jdCAyNSAyMDA2JywgJ09jdCAyNSwgMjAwNidcbiAgICAsICclZCAlYiAlWScsICclZCAlYiwgJVknICAgICAgICAgICAvLyAnMjUgT2N0IDIwMDYnLCAnMjUgT2N0LCAyMDA2J1xuICAgICwgJyVCICVkICVZJywgJyVCICVkLCAlWScgICAgICAgICAgIC8vICdPY3RvYmVyIDI1IDIwMDYnLCAnT2N0b2JlciAyNSwgMjAwNidcbiAgICAsICclZCAlQiAlWScsICclZCAlQiwgJVknICAgICAgICAgICAvLyAnMjUgT2N0b2JlciAyMDA2JywgJzI1IE9jdG9iZXIsIDIwMDYnXG4gICAgXVxuICAsIERBVEVUSU1FX0lOUFVUX0ZPUk1BVFM6IFtcbiAgICAgICclWS0lbS0lZCAlSDolTTolUycgICAgICAgICAgICAgICAvLyAnMjAwNi0xMC0yNSAxNDozMDo1OSdcbiAgICAsICclWS0lbS0lZCAlSDolTScgICAgICAgICAgICAgICAgICAvLyAnMjAwNi0xMC0yNSAxNDozMCdcbiAgICAsICclWS0lbS0lZCcgICAgICAgICAgICAgICAgICAgICAgICAvLyAnMjAwNi0xMC0yNSdcbiAgICAsICclbS8lZC8lWSAlSDolTTolUycgICAgICAgICAgICAgICAvLyAnMTAvMjUvMjAwNiAxNDozMDo1OSdcbiAgICAsICclbS8lZC8lWSAlSDolTScgICAgICAgICAgICAgICAgICAvLyAnMTAvMjUvMjAwNiAxNDozMCdcbiAgICAsICclbS8lZC8lWScgICAgICAgICAgICAgICAgICAgICAgICAvLyAnMTAvMjUvMjAwNidcbiAgICAsICclbS8lZC8leSAlSDolTTolUycgICAgICAgICAgICAgICAvLyAnMTAvMjUvMDYgMTQ6MzA6NTknXG4gICAgLCAnJW0vJWQvJXkgJUg6JU0nICAgICAgICAgICAgICAgICAgLy8gJzEwLzI1LzA2IDE0OjMwJ1xuICAgICwgJyVtLyVkLyV5JyAgICAgICAgICAgICAgICAgICAgICAgIC8vICcxMC8yNS8wNidcbiAgICBdXG4gIH1cbiwgZW5fR0I6IHtcbiAgICBEQVRFX0lOUFVUX0ZPUk1BVFM6IFtcbiAgICAgICclZC8lbS8lWScsICclZC8lbS8leScgICAgICAgICAgICAvLyAnMjUvMTAvMjAwNicsICcyNS8xMC8wNidcbiAgICAsICclYiAlZCAlWScsICclYiAlZCwgJVknICAgICAgICAgICAvLyAnT2N0IDI1IDIwMDYnLCAnT2N0IDI1LCAyMDA2J1xuICAgICwgJyVkICViICVZJywgJyVkICViLCAlWScgICAgICAgICAgIC8vICcyNSBPY3QgMjAwNicsICcyNSBPY3QsIDIwMDYnXG4gICAgLCAnJUIgJWQgJVknLCAnJUIgJWQsICVZJyAgICAgICAgICAgLy8gJ09jdG9iZXIgMjUgMjAwNicsICdPY3RvYmVyIDI1LCAyMDA2J1xuICAgICwgJyVkICVCICVZJywgJyVkICVCLCAlWScgICAgICAgICAgIC8vICcyNSBPY3RvYmVyIDIwMDYnLCAnMjUgT2N0b2JlciwgMjAwNidcbiAgICBdXG4gICwgREFURVRJTUVfSU5QVVRfRk9STUFUUzogW1xuICAgICAgJyVZLSVtLSVkICVIOiVNOiVTJyAgICAgICAgICAgICAgIC8vICcyMDA2LTEwLTI1IDE0OjMwOjU5J1xuICAgICwgJyVZLSVtLSVkICVIOiVNJyAgICAgICAgICAgICAgICAgIC8vICcyMDA2LTEwLTI1IDE0OjMwJ1xuICAgICwgJyVZLSVtLSVkJyAgICAgICAgICAgICAgICAgICAgICAgIC8vICcyMDA2LTEwLTI1J1xuICAgICwgJyVkLyVtLyVZICVIOiVNOiVTJyAgICAgICAgICAgICAgIC8vICcyNS8xMC8yMDA2IDE0OjMwOjU5J1xuICAgICwgJyVkLyVtLyVZICVIOiVNJyAgICAgICAgICAgICAgICAgIC8vICcyNS8xMC8yMDA2IDE0OjMwJ1xuICAgICwgJyVkLyVtLyVZJyAgICAgICAgICAgICAgICAgICAgICAgIC8vICcyNS8xMC8yMDA2J1xuICAgICwgJyVkLyVtLyV5ICVIOiVNOiVTJyAgICAgICAgICAgICAgIC8vICcyNS8xMC8wNiAxNDozMDo1OSdcbiAgICAsICclZC8lbS8leSAlSDolTScgICAgICAgICAgICAgICAgICAvLyAnMjUvMTAvMDYgMTQ6MzAnXG4gICAgLCAnJWQvJW0vJXknICAgICAgICAgICAgICAgICAgICAgICAgLy8gJzI1LzEwLzA2J1xuICAgIF1cbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgYSBsb2NhbGUgb2JqZWN0IHRvIG91ciBvd24gY2FjaGUgKGZvciBmb3JtYXRzKSBhbmQgaXNvbW9ycGgudGltZSdzIGNhY2hlXG4gKiAoZm9yIHRpbWUgcGFyc2luZy9mb3JtYXR0aW5nKS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5nXG4gKiBAcGFyYW0ge3N0cmluZz19IGxvY2FsZVxuICovXG5mdW5jdGlvbiBhZGRMb2NhbGUobGFuZywgbG9jYWxlKSB7XG4gIGxvY2FsZUNhY2hlW2xhbmddID0gbG9jYWxlXG4gIHRpbWUubG9jYWxlc1tsYW5nXSA9IGxvY2FsZVxufVxuXG4vKipcbiAqIEdldHMgdGhlIG1vc3QgYXBwbGljYWJsZSBsb2NhbGUsIGZhbGxpbmcgYmFjayB0byB0aGUgbGFuZ3VhZ2UgY29kZSBpZlxuICogbmVjZXNzYXJ5IGFuZCB0byB0aGUgZGVmYXVsdCBsb2NhbGUgaWYgbm8gbWF0Y2hpbmcgbG9jYWxlIHdhcyBmb3VuZC5cbiAqIEBwYXJhbSB7c3RyaW5nPX0gbGFuZ1xuICovXG5mdW5jdGlvbiBnZXRMb2NhbGUobGFuZykge1xuICBpZiAobGFuZykge1xuICAgIGlmIChvYmplY3QuaGFzT3duKGxvY2FsZUNhY2hlLCBsYW5nKSkge1xuICAgICAgcmV0dXJuIGxvY2FsZUNhY2hlW2xhbmddXG4gICAgfVxuICAgIGlmIChsYW5nLmluZGV4T2YoJ18nKSAhPSAtMSkge1xuICAgICAgbGFuZyA9IGxhbmcuc3BsaXQoJ18nKVswXVxuICAgICAgaWYgKG9iamVjdC5oYXNPd24obG9jYWxlQ2FjaGUsIGxhbmcpKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGVDYWNoZVtsYW5nXVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbG9jYWxlQ2FjaGVbZGVmYXVsdExvY2FsZS5sYW5nXVxufVxuXG4vKipcbiAqIEdldHMgYWxsIGFwcGxpY2FibGUgbG9jYWxlcywgd2l0aCB0aGUgbW9zdCBzcGVjaWZpYyBmaXJzdCwgZmFsbGluZyBiYWNrIHRvXG4gKiB0aGUgZGVmYXVsdCBsb2NhbGUgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtzdHJpbmc9fSBsYW5nXG4gKiBAcmV0dXJuIHtBcnJheS48T2JqZWN0Pn1cbiAqL1xuZnVuY3Rpb24gZ2V0TG9jYWxlcyhsYW5nKSB7XG4gIGlmIChsYW5nKSB7XG4gICAgdmFyIGxvY2FsZXMgPSBbXVxuICAgIGlmIChvYmplY3QuaGFzT3duKGxvY2FsZUNhY2hlLCBsYW5nKSkge1xuICAgICAgIGxvY2FsZXMucHVzaChsb2NhbGVDYWNoZVtsYW5nXSlcbiAgICB9XG4gICAgaWYgKGxhbmcuaW5kZXhPZignXycpICE9IC0xKSB7XG4gICAgICBsYW5nID0gbGFuZy5zcGxpdCgnXycpWzBdXG4gICAgICBpZiAob2JqZWN0Lmhhc093bihsb2NhbGVDYWNoZSwgbGFuZykpIHtcbiAgICAgICAgbG9jYWxlcy5wdXNoKGxvY2FsZUNhY2hlW2xhbmddKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobG9jYWxlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBsb2NhbGVzXG4gICAgfVxuICB9XG4gIHJldHVybiBbbG9jYWxlQ2FjaGVbZGVmYXVsdExvY2FsZS5sYW5nXV1cbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBsYW5ndWFnZSBjb2RlIGZvciB0aGUgZGVmYXVsdCBsb2NhbGUuXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ1xuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0TG9jYWxlKGxhbmcpIHtcbiAgaWYgKCFvYmplY3QuaGFzT3duKGxvY2FsZUNhY2hlLCBsYW5nKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsb2NhbGU6ICcgKyBsYW5nKVxuICB9XG4gIGRlZmF1bHRMb2NhbGUubGFuZyA9IGxhbmdcbn1cblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBsYW5ndWFnZSBjb2RlIGZvciB0aGUgZGVmYXVsdCBsb2NhbGUuXG4gKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRMb2NhbGUoKSB7XG4gIHJldHVybiBkZWZhdWx0TG9jYWxlLmxhbmdcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZExvY2FsZTogYWRkTG9jYWxlXG4sIGdldERlZmF1bHRMb2NhbGU6IGdldERlZmF1bHRMb2NhbGVcbiwgZ2V0TG9jYWxlOiBnZXRMb2NhbGVcbiwgZ2V0TG9jYWxlczogZ2V0TG9jYWxlc1xuLCBzZXREZWZhdWx0TG9jYWxlOiBzZXREZWZhdWx0TG9jYWxlXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpcyA9IHJlcXVpcmUoJ2lzb21vcnBoL2lzJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxuXG4vKipcbiAqIFJlcGxhY2VzIFN0cmluZyB7cGxhY2Vob2xkZXJzfSB3aXRoIHByb3BlcnRpZXMgb2YgYSBnaXZlbiBvYmplY3QsIGJ1dFxuICogaW50ZXJwb2xhdGVzIGludG8gYW5kIHJldHVybnMgYW4gQXJyYXkgaW5zdGVhZCBvZiBhIFN0cmluZy5cbiAqIEJ5IGRlZmF1bHQsIGFueSByZXN1bHRpbmcgZW1wdHkgc3RyaW5ncyBhcmUgc3RyaXBwZWQgb3V0IG9mIHRoZSBBcnJheS4gVG9cbiAqIGRpc2FibGUgdGhpcywgcGFzcyBhbiBvcHRpb25zIG9iamVjdCB3aXRoIGEgJ3N0cmlwJyBwcm9wZXJ0eSB3aGljaCBpcyBmYWxzZS5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VG9BcnJheShzdHIsIG9iaiwgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoL1xceyhcXHcrKVxcfS9nKVxuICBmb3IgKHZhciBpID0gMSwgbCA9IHBhcnRzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMikge1xuICAgIHBhcnRzW2ldID0gKG9iamVjdC5oYXNPd24ob2JqLCBwYXJ0c1tpXSlcbiAgICAgICAgICAgICAgICA/IG9ialtwYXJ0c1tpXV1cbiAgICAgICAgICAgICAgICA6ICd7JyArIHBhcnRzW2ldICsgJ30nKVxuICB9XG4gIGlmICghb3B0aW9ucyB8fCAob3B0aW9ucyAmJiBvcHRpb25zLnN0cmlwICE9PSBmYWxzZSkpIHtcbiAgICBwYXJ0cyA9IHBhcnRzLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiBwICE9PSAnJ30pXG4gIH1cbiAgcmV0dXJuIHBhcnRzXG59XG5cbi8qKlxuICogR2V0IG5hbWVkIHByb3BlcnRpZXMgZnJvbSBhbiBvYmplY3QuXG4gKiBAcGFyYW0gc3JjIHtPYmplY3R9XG4gKiBAcGFyYW0gcHJvcHMge0FycmF5LjxzdHJpbmc+fVxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBnZXRQcm9wcyhzcmMsIHByb3BzKSB7XG4gIHZhciByZXN1bHQgPSB7fVxuICBmb3IgKHZhciBpID0gMCwgbCA9IHByb3BzLmxlbmd0aDsgaSA8IGwgOyBpKyspIHtcbiAgICB2YXIgcHJvcCA9IHByb3BzW2ldXG4gICAgaWYgKG9iamVjdC5oYXNPd24oc3JjLCBwcm9wKSkge1xuICAgICAgcmVzdWx0W3Byb3BdID0gc3JjW3Byb3BdXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuLyoqXG4gKiBHZXQgYSBuYW1lZCBwcm9wZXJ0eSBmcm9tIGFuIG9iamVjdCwgY2FsbGluZyBpdCBhbmQgcmV0dXJuaW5nIGl0cyByZXN1bHQgaWZcbiAqIGl0J3MgYSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbWF5YmVDYWxsKG9iaiwgcHJvcCkge1xuICB2YXIgdmFsdWUgPSBvYmpbcHJvcF1cbiAgaWYgKGlzLkZ1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhbHVlID0gdmFsdWUuY2FsbChvYmopXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxpc3Qgb2YgY2hvaWNlIHBhaXJzIGZyb20gYSBsaXN0IG9mIG9iamVjdHMgdXNpbmcgdGhlIGdpdmVuIG5hbWVkXG4gKiBwcm9wZXJ0aWVzIGZvciB0aGUgdmFsdWUgYW5kIGxhYmVsLlxuICovXG5mdW5jdGlvbiBtYWtlQ2hvaWNlcyhsaXN0LCB2YWx1ZVByb3AsIGxhYmVsUHJvcCkge1xuICByZXR1cm4gbGlzdC5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgIHJldHVybiBbbWF5YmVDYWxsKGl0ZW0sIHZhbHVlUHJvcCksIG1heWJlQ2FsbChpdGVtLCBsYWJlbFByb3ApXVxuICB9KVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBjaG9pY2UgaW5wdXQgYW5kIG5vcm1hbGlzZXMgbGF6eSwgbm9uLUFycmF5IGNob2ljZXMgdG8gYmVcbiAqIFt2YWx1ZSwgbGFiZWxdIHBhaXJzXG4gKiBAcmV0dXJuIHtBcnJheX0gYSBub3JtYWxpc2VkIHZlcnNpb24gb2YgdGhlIGdpdmVuIGNob2ljZXMuXG4gKiBAdGhyb3dzIGlmIGFuIEFycmF5IHdpdGggbGVuZ3RoICE9IDIgd2FzIGZvdW5kIHdoZXJlIGEgY2hvaWNlIHBhaXIgd2FzIGV4cGVjdGVkLlxuICovXG5mdW5jdGlvbiBub3JtYWxpc2VDaG9pY2VzKGNob2ljZXMpIHtcbiAgaWYgKCFjaG9pY2VzLmxlbmd0aCkgeyByZXR1cm4gY2hvaWNlcyB9XG5cbiAgdmFyIG5vcm1hbGlzZWRDaG9pY2VzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaG9pY2VzLmxlbmd0aCwgY2hvaWNlOyBpIDwgbDsgaSsrKSB7XG4gICAgY2hvaWNlID0gY2hvaWNlc1tpXVxuICAgIGlmICghaXMuQXJyYXkoY2hvaWNlKSkge1xuICAgICAgLy8gVE9ETyBJbiB0aGUgZGV2ZWxvcG1lbnQgYnVpbGQsIGVtaXQgYSB3YXJuaW5nIGFib3V0IGEgY2hvaWNlIGJlaW5nXG4gICAgICAvLyAgICAgIGF1dG9tYXRpY2FsbHkgY29udmVydGVkIGZyb20gJ2JsYWgnIHRvIFsnYmxhaCcsICdibGFoJ10gaW4gY2FzZSBpdFxuICAgICAgLy8gICAgICB3YXNuJ3QgaW50ZW50aW9uYWxcbiAgICAgIGNob2ljZSA9IFtjaG9pY2UsIGNob2ljZV1cbiAgICB9XG4gICAgaWYgKGNob2ljZS5sZW5ndGggIT0gMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDaG9pY2VzIGluIGEgY2hvaWNlIGxpc3QgbXVzdCBjb250YWluIGV4YWN0bHkgMiB2YWx1ZXMsICcgK1xuICAgICAgICAgICAgICAgICAgICAgICdidXQgZ290ICcgKyBKU09OLnN0cmluZ2lmeShjaG9pY2UpKVxuICAgIH1cbiAgICBpZiAoaXMuQXJyYXkoY2hvaWNlWzFdKSkge1xuICAgICAgdmFyIG5vcm1hbGlzZWRPcHRncm91cENob2ljZXMgPSBbXVxuICAgICAgLy8gVGhpcyBpcyBhbiBvcHRncm91cCwgc28gbG9vayBpbnNpZGUgdGhlIGdyb3VwIGZvciBvcHRpb25zXG4gICAgICB2YXIgb3B0Z3JvdXBDaG9pY2VzID0gY2hvaWNlWzFdXG4gICAgICBmb3IgKHZhciBqID0gMCwgbSA9IG9wdGdyb3VwQ2hvaWNlcy5sZW5ndGgsIG9wdGdyb3VwQ2hvaWNlOyBqIDwgbTsgaisrKSB7XG4gICAgICAgIG9wdGdyb3VwQ2hvaWNlID0gb3B0Z3JvdXBDaG9pY2VzW2pdXG4gICAgICAgIGlmICghaXMuQXJyYXkob3B0Z3JvdXBDaG9pY2UpKSB7XG4gICAgICAgICAgb3B0Z3JvdXBDaG9pY2UgPSBbb3B0Z3JvdXBDaG9pY2UsIG9wdGdyb3VwQ2hvaWNlXVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRncm91cENob2ljZS5sZW5ndGggIT0gMikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2hvaWNlcyBpbiBhbiBvcHRncm91cCBjaG9pY2UgbGlzdCBtdXN0IGNvbnRhaW4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdleGFjdGx5IDIgdmFsdWVzLCBidXQgZ290ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShvcHRncm91cENob2ljZSkpXG4gICAgICAgIH1cbiAgICAgICAgbm9ybWFsaXNlZE9wdGdyb3VwQ2hvaWNlcy5wdXNoKG9wdGdyb3VwQ2hvaWNlKVxuICAgICAgfVxuICAgICAgbm9ybWFsaXNlZENob2ljZXMucHVzaChbY2hvaWNlWzBdLCBub3JtYWxpc2VkT3B0Z3JvdXBDaG9pY2VzXSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBub3JtYWxpc2VkQ2hvaWNlcy5wdXNoKGNob2ljZSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGlzZWRDaG9pY2VzXG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gZXZlbnRzXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGlzZVZhbGlkYXRpb25FdmVudHMoZXZlbnRzKSB7XG4gIGV2ZW50cyA9IGV2ZW50cy5tYXAoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQuaW5kZXhPZignb24nKSA9PT0gMCkgeyByZXR1cm4gZXZlbnQgfVxuICAgIHJldHVybiAnb24nICsgZXZlbnQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBldmVudC5zdWJzdHIoMSlcbiAgfSlcbiAgdmFyIG9uQ2hhbmdlSW5kZXggPSBldmVudHMuaW5kZXhPZignb25DaGFuZ2UnKVxuICBpZiAob25DaGFuZ2VJbmRleCAhPSAtMSkge1xuICAgIGV2ZW50cy5zcGxpY2Uob25DaGFuZ2VJbmRleCwgMSlcbiAgfVxuICByZXR1cm4ge2V2ZW50czogZXZlbnRzLCBvbkNoYW5nZTogKG9uQ2hhbmdlSW5kZXggIT0gLTEpfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudHNcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXNlVmFsaWRhdGlvblN0cmluZyhldmVudHMpIHtcbiAgcmV0dXJuIG5vcm1hbGlzZVZhbGlkYXRpb25FdmVudHMoc3RyaXAoZXZlbnRzKS5zcGxpdCgvICsvZykpXG59XG5cbi8qKlxuICogQHBhcmFtIHsoc3RyaW5nfE9iamVjdCl9IHZhbGlkYXRpb25cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXNlVmFsaWRhdGlvbih2YWxpZGF0aW9uKSB7XG4gIGlmICghdmFsaWRhdGlvbiB8fCB2YWxpZGF0aW9uID09PSAnbWFudWFsJykge1xuICAgIHJldHVybiB2YWxpZGF0aW9uXG4gIH1cbiAgZWxzZSBpZiAodmFsaWRhdGlvbiA9PT0gJ2F1dG8nKSB7XG4gICAgcmV0dXJuIHtldmVudHM6IFsnb25CbHVyJ10sIG9uQ2hhbmdlOiB0cnVlLCBvbkNoYW5nZURlbGF5OiAzNjl9XG4gIH1cbiAgZWxzZSBpZiAoaXMuU3RyaW5nKHZhbGlkYXRpb24pKSB7XG4gICAgcmV0dXJuIG5vcm1hbGlzZVZhbGlkYXRpb25TdHJpbmcodmFsaWRhdGlvbilcbiAgfVxuICBlbHNlIGlmIChpcy5PYmplY3QodmFsaWRhdGlvbikpIHtcbiAgICB2YXIgbm9ybWFsaXNlZFxuICAgIGlmIChpcy5TdHJpbmcodmFsaWRhdGlvbi5vbikpIHtcbiAgICAgIG5vcm1hbGlzZWQgPSBub3JtYWxpc2VWYWxpZGF0aW9uU3RyaW5nKHZhbGlkYXRpb24ub24pXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLkFycmF5KHZhbGlkYXRpb24ub24pKSB7XG4gICAgICBub3JtYWxpc2VkID0gbm9ybWFsaXNlVmFsaWRhdGlvbkV2ZW50cyh2YWxpZGF0aW9uLm9uKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlZhbGlkYXRpb24gY29uZmlnIE9iamVjdHMgbXVzdCBoYXZlIGFuICdvbicgU3RyaW5nIG9yIEFycmF5XCIpXG4gICAgfVxuICAgIG5vcm1hbGlzZWQub25DaGFuZ2VEZWxheSA9IG9iamVjdC5nZXQodmFsaWRhdGlvbiwgJ29uQ2hhbmdlRGVsYXknLCB2YWxpZGF0aW9uLmRlbGF5KVxuICAgIHJldHVybiBub3JtYWxpc2VkXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHZhbGlkYXRpb24gY29uZmlnOiAnICsgdmFsaWRhdGlvbilcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyAnZmlyc3ROYW1lJyBhbmQgJ2ZpcnN0X25hbWUnIHRvICdGaXJzdCBuYW1lJywgYW5kXG4gKiAnU0hPVVRJTkdfTElLRV9USElTJyB0byAnU0hPVVRJTkcgTElLRSBUSElTJy5cbiAqL1xudmFyIHByZXR0eU5hbWUgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBjYXBzUkUgPSAvKFtBLVpdKykvZ1xuICB2YXIgc3BsaXRSRSA9IC9bIF9dKy9cbiAgdmFyIGFsbENhcHNSRSA9IC9eW0EtWl1bQS1aMC05XSskL1xuXG4gIHJldHVybiBmdW5jdGlvbihuYW1lKSB7XG4gICAgLy8gUHJlZml4IHNlcXVlbmNlcyBvZiBjYXBzIHdpdGggc3BhY2VzIGFuZCBzcGxpdCBvbiBhbGwgc3BhY2VcbiAgICAvLyBjaGFyYWN0ZXJzLlxuICAgIHZhciBwYXJ0cyA9IG5hbWUucmVwbGFjZShjYXBzUkUsICcgJDEnKS5zcGxpdChzcGxpdFJFKVxuXG4gICAgLy8gSWYgd2UgaGFkIGFuIGluaXRpYWwgY2FwLi4uXG4gICAgaWYgKHBhcnRzWzBdID09PSAnJykge1xuICAgICAgcGFydHMuc3BsaWNlKDAsIDEpXG4gICAgfVxuXG4gICAgLy8gR2l2ZSB0aGUgZmlyc3Qgd29yZCBhbiBpbml0aWFsIGNhcCBhbmQgYWxsIHN1YnNlcXVlbnQgd29yZHMgYW5cbiAgICAvLyBpbml0aWFsIGxvd2VyY2FzZSBpZiBub3QgYWxsIGNhcHMuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgIHBhcnRzWzBdID0gcGFydHNbMF0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICAgICAgICAgIHBhcnRzWzBdLnN1YnN0cigxKVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIWFsbENhcHNSRS50ZXN0KHBhcnRzW2ldKSkge1xuICAgICAgICBwYXJ0c1tpXSA9IHBhcnRzW2ldLmNoYXJBdCgwKS50b0xvd2VyQ2FzZSgpICtcbiAgICAgICAgICAgICAgICAgICBwYXJ0c1tpXS5zdWJzdHIoMSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFydHMuam9pbignICcpXG4gIH1cbn0pKClcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxGb3JtRWxlbWVudHxSZWFjdEVsZW1lbnR9IGZvcm0gYSBmb3JtIGVsZW1lbnQuXG4gKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZywoc3RyaW5nfEFycmF5LjxzdHJpbmc+KT59IGFuIG9iamVjdCBjb250YWluaW5nIHRoZVxuICogICBzdWJtaXR0YWJsZSB2YWx1ZShzKSBoZWxkIGluIGVhY2ggb2YgdGhlIGZvcm0ncyBlbGVtZW50cy5cbiAqL1xuZnVuY3Rpb24gZm9ybURhdGEoZm9ybSkge1xuICBpZiAoIWZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Zvcm1EYXRhIHdhcyBnaXZlbiBmb3JtPScgKyBmb3JtKVxuICB9XG4gIGlmICh0eXBlb2YgZm9ybS5nZXRET01Ob2RlID09ICdmdW5jdGlvbicpIHtcbiAgICBmb3JtID0gZm9ybS5nZXRET01Ob2RlKClcbiAgfVxuICB2YXIgZGF0YSA9IHt9XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBmb3JtLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhciBlbGVtZW50ID0gZm9ybS5lbGVtZW50c1tpXVxuICAgIHZhciB2YWx1ZSA9IGdldEZvcm1FbGVtZW50VmFsdWUoZWxlbWVudClcbiAgICAvLyBBZGQgYW55IHZhbHVlIG9idGFpbmVkIHRvIHRoZSBkYXRhIG9iamVjdFxuICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgaWYgKG9iamVjdC5oYXNPd24oZGF0YSwgZWxlbWVudC5uYW1lKSkge1xuICAgICAgICBpZiAoaXMuQXJyYXkoZGF0YVtlbGVtZW50Lm5hbWVdKSkge1xuICAgICAgICAgIGRhdGFbZWxlbWVudC5uYW1lXSA9IGRhdGFbZWxlbWVudC5uYW1lXS5jb25jYXQodmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZGF0YVtlbGVtZW50Lm5hbWVdID0gW2RhdGFbZWxlbWVudC5uYW1lXSwgdmFsdWVdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBkYXRhW2VsZW1lbnQubmFtZV0gPSB2YWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkYXRhXG59XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MRm9ybUVsZW1lbnR8UmVhY3RFbGVtZW50fSBmb3JtIGEgZm9ybSBlbGVtZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkIGEgZmllbGQgbmFtZS5cbiAqIEByZXR1cm4geyhzdHJpbmd8QXJyYXkuPHN0cmluZz4pfSB0aGUgbmFtZWQgZmllbGQncyBzdWJtaXR0YWJsZSB2YWx1ZShzKSxcbiAqL1xuZnVuY3Rpb24gZmllbGREYXRhKGZvcm0sIGZpZWxkKSB7XG4gIC8qIGdsb2JhbCBOb2RlTGlzdCAqL1xuICBpZiAoIWZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpZWxkRGF0YSB3YXMgZ2l2ZW4gZm9ybT0nICsgZm9ybSlcbiAgfVxuICBpZiAoZm9ybSAmJiB0eXBlb2YgZm9ybS5nZXRET01Ob2RlID09ICdmdW5jdGlvbicpIHtcbiAgICBmb3JtID0gZm9ybS5nZXRET01Ob2RlKClcbiAgfVxuICB2YXIgZGF0YSA9IG51bGxcbiAgdmFyIGVsZW1lbnQgPSBmb3JtLmVsZW1lbnRzW2ZpZWxkXVxuICAvLyBDaGVjayBpZiB3ZSd2ZSBnb3QgYSBOb2RlTGlzdFxuICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGVMaXN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbGVtZW50Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gZ2V0Rm9ybUVsZW1lbnRWYWx1ZShlbGVtZW50W2ldKVxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKGlzLkFycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICBkYXRhPSBkYXRhLmNvbmNhdCh2YWx1ZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0gW2RhdGEsIHZhbHVlXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkYXRhID0gdmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBkYXRhID0gZ2V0Rm9ybUVsZW1lbnRWYWx1ZShlbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGRhdGFcbn1cblxuLyoqXG4gKiBMb29rdXAgZm9yIDxpbnB1dD5zIHdob3NlIHZhbHVlIGNhbiBiZSBhY2Nlc3NlZCB3aXRoIC52YWx1ZS5cbiAqL1xudmFyIHRleHRJbnB1dFR5cGVzID0gb2JqZWN0Lmxvb2t1cChbXG4gICdoaWRkZW4nLCAncGFzc3dvcmQnLCAndGV4dCcsICdlbWFpbCcsICd1cmwnLCAnbnVtYmVyJywgJ2ZpbGUnLCAndGV4dGFyZWEnXG5dKVxuXG4vKipcbiAqIExvb2t1cCBmb3IgPGlucHV0cz4gd2hpY2ggaGF2ZSBhIC5jaGVja2VkIHByb3BlcnR5LlxuICovXG52YXIgY2hlY2tlZElucHV0VHlwZXMgPSBvYmplY3QubG9va3VwKFsnY2hlY2tib3gnLCAncmFkaW8nXSlcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fEhUTUxTZWxlY3RFbGVtZW50fSBlbGVtZW50IGEgZm9ybSBlbGVtZW50LlxuICogQHJldHVybiB7KHN0cmluZ3xBcnJheS48c3RyaW5nPil9IHRoZSBlbGVtZW50J3Mgc3VibWl0dGFibGUgdmFsdWUocyksXG4gKi9cbmZ1bmN0aW9uIGdldEZvcm1FbGVtZW50VmFsdWUoZWxlbWVudCkge1xuICB2YXIgdmFsdWUgPSBudWxsXG4gIHZhciB0eXBlID0gZWxlbWVudC50eXBlXG5cbiAgaWYgKHRleHRJbnB1dFR5cGVzW3R5cGVdIHx8IGNoZWNrZWRJbnB1dFR5cGVzW3R5cGVdICYmIGVsZW1lbnQuY2hlY2tlZCkge1xuICAgIHZhbHVlID0gZWxlbWVudC52YWx1ZVxuICB9XG4gIGVsc2UgaWYgKHR5cGUgPT0gJ3NlbGVjdC1vbmUnKSB7XG4gICAgaWYgKGVsZW1lbnQub3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHZhbHVlID0gZWxlbWVudC5vcHRpb25zW2VsZW1lbnQuc2VsZWN0ZWRJbmRleF0udmFsdWVcbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodHlwZSA9PSAnc2VsZWN0LW11bHRpcGxlJykge1xuICAgIHZhbHVlID0gW11cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVsZW1lbnQub3B0aW9ucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChlbGVtZW50Lm9wdGlvbnNbaV0uc2VsZWN0ZWQpIHtcbiAgICAgICAgdmFsdWUucHVzaChlbGVtZW50Lm9wdGlvbnNbaV0udmFsdWUpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQ29lcmNlcyB0byBzdHJpbmcgYW5kIHN0cmlwcyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzcGFjZXMuXG4gKi9cbnZhciBzdHJpcCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RyaXBSRSA9LyheXFxzK3xcXHMrJCkvZ1xuICByZXR1cm4gZnVuY3Rpb24gc3RyaXAocykge1xuICAgIHJldHVybiAoJycrcykucmVwbGFjZShzdHJpcFJFLCAnJylcbiAgfVxufSgpXG5cbi8qKlxuICogRnJvbSBVbmRlcnNjb3JlLmpzIDEuNS4yXG4gKiBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuICogKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICogYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICogTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gKiBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICpcbiAqIE1vZGlmaWVkIHRvIGdpdmUgdGhlIHJldHVybmVkIGZ1bmN0aW9uOlxuICogLSBhIC5jYW5jZWwoKSBtZXRob2Qgd2hpY2ggcHJldmVudHMgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBiZWluZyBjYWxsZWQuXG4gKiAtIGEgLnRyaWdnZXIoKSBtZXRob2Qgd2hpY2ggY2FsbHMgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpbW1lZGlhdGVseS5cbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdFxuICB2YXIgZGVib3VuY2VkID0gZnVuY3Rpb24oKSB7XG4gICAgY29udGV4dCA9IHRoaXNcbiAgICBhcmdzID0gYXJndW1lbnRzXG4gICAgdGltZXN0YW1wID0gbmV3IERhdGUoKVxuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxhc3QgPSAobmV3IERhdGUoKSkgLSB0aW1lc3RhbXBcbiAgICAgIGlmIChsYXN0IDwgd2FpdCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lb3V0ID0gbnVsbFxuICAgICAgICBpZiAoIWltbWVkaWF0ZSkgeyByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0XG4gICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdClcbiAgICB9XG4gICAgaWYgKGNhbGxOb3cpIHsgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKSB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLy8gQ2xlYXIgYW55IHBlbmRpbmcgdGltZW91dFxuICBkZWJvdW5jZWQuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgIH1cbiAgfVxuXG4gIC8vIENsZWFyIGFueSBwZW5kaW5nIHRpbWVvdXQgYW5kIGV4ZWN1dGUgdGhlIGZ1bmN0aW9uIGltbWVkaWF0ZWx5XG4gIGRlYm91bmNlZC50cmlnZ2VyID0gZnVuY3Rpb24oKSB7XG4gICAgZGVib3VuY2VkLmNhbmNlbCgpXG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncylcbiAgfVxuXG4gIHJldHVybiBkZWJvdW5jZWRcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gd2l0aCBhIC5jYW5jZWwoKSBmdW5jdGlvbiB3aGljaCBjYW4gYmUgdXNlZCB0byBwcmV2ZW50IHRoZVxuICogZ2l2ZW4gZnVuY3Rpb24gZnJvbSBiZWluZyBjYWxsZWQuIElmIHRoZSBnaXZlbiBmdW5jdGlvbiBoYXMgYW4gb25DYW5jZWwoKSxcbiAqIGl0IHdpbGwgYmUgY2FsbGVkIHdoZW4gaXQncyBiZWluZyBjYW5jZWxsZWQuXG4gKlxuICogVXNlIGNhc2U6IHRyaWdnZXJpbmcgYW4gYXN5bmNocm9ub3VzIGZ1bmN0aW9uIHdpdGggbmV3IGRhdGEgd2hpbGUgYW4gZXhpc3RpbmdcbiAqIGZ1bmN0aW9uIGZvciB0aGUgc2FtZSB0YXNrIGJ1dCB3aXRoIG9sZCBkYXRhIGlzIHN0aWxsIHBlbmRpbmcgYSBjYWxsYmFjaywgc29cbiAqIHRoZSBjYWxsYmFjayBvbmx5IGdldHMgY2FsbGVkIGZvciB0aGUgbGFzdCBvbmUgdG8gcnVuLlxuICovXG5mdW5jdGlvbiBjYW5jZWxsYWJsZShmdW5jKSB7XG4gIHZhciBjYW5jZWxsZWQgPSBmYWxzZVxuXG4gIHZhciBjYW5jZWxsYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWNhbmNlbGxlZCkge1xuICAgICAgZnVuYy5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgfVxuICB9XG5cbiAgY2FuY2VsbGFibGVkLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGNhbmNlbGxlZCA9IHRydWVcbiAgICBpZiAoaXMuRnVuY3Rpb24oZnVuYy5vbkNhbmNlbCkpIHtcbiAgICAgIGZ1bmMub25DYW5jZWwoKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjYW5jZWxsYWJsZWRcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBkYXRhIGZyb20gYSA8Zm9ybT4gYW5kIHZhbGlkYXRlcyBpdCB3aXRoIGEgbGlzdCBvZiBmb3JtcyBhbmQvb3JcbiAqIGZvcm1zZXRzLlxuICogQHBhcmFtIGZvcm0gdGhlIDxmb3JtPiBpbnRvIHdoaWNoIGFueSBnaXZlbiBmb3JtcyBhbmQgZm9ybXNldHMgaGF2ZSBiZWVuXG4gKiAgIHJlbmRlcmVkIC0gdGhpcyBjYW4gYmUgYSBSZWFjdCA8Zm9ybT4gY29tcG9uZW50IG9yIGEgcmVhbCA8Zm9ybT4gRE9NIG5vZGUuXG4gKiBAcGFyYW0ge0FycmF5LjwoRm9ybXxCYXNlRm9ybVNldCk+fSBmb3Jtc0FuZEZvcm1zZXRzIGEgbGlzdCBvZiBmb3JtcyBhbmQvb3JcbiAqICAgZm9ybXNldHMgdG8gYmUgdXNlZCB0byB2YWxpZGF0ZSB0aGUgPGZvcm0+J3MgaW5wdXQgZGF0YS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIDxmb3JtPidzIGlucHV0IGRhdGEgYXJlIHZhbGlkIGFjY29yZGluZyB0byBhbGxcbiAqICAgZ2l2ZW4gZm9ybXMgYW5kIGZvcm1zZXRzLlxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUFsbChmb3JtLCBmb3Jtc0FuZEZvcm1zZXRzKSB7XG4gIGlmIChmb3JtICYmIHR5cGVvZiBmb3JtLmdldERPTU5vZGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIGZvcm0gPSBmb3JtLmdldERPTU5vZGUoKVxuICB9XG4gIHZhciBkYXRhID0gZm9ybURhdGEoZm9ybSlcbiAgdmFyIGlzVmFsaWQgPSB0cnVlXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZm9ybXNBbmRGb3Jtc2V0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoIWZvcm1zQW5kRm9ybXNldHNbaV0uc2V0Rm9ybURhdGEoZGF0YSkpIHtcbiAgICAgIGlzVmFsaWQgPSBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gaXNWYWxpZFxufVxuXG52YXIgaW5mbyA9IGZ1bmN0aW9uKCkge31cbnZhciB3YXJuaW5nID0gZnVuY3Rpb24oKSB7fVxuXG5pZiAoJ3Byb2R1Y3Rpb24nICE9PSBcImRldmVsb3BtZW50XCIpIHtcbiAgaW5mbyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tuZXdmb3Jtc10gJyArIG1lc3NhZ2UpXG4gIH1cbiAgd2FybmluZyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLndhcm4oJ1tuZXdmb3Jtc10gV2FybmluZzogJyArIG1lc3NhZ2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gYXV0b0lkQ2hlY2tlcihwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uKSB7XG4gIHZhciBhdXRvSWQgPSBwcm9wcy5hdXRvSWRcbiAgaWYgKHByb3BzLmF1dG9JZCAmJiAhKGlzLlN0cmluZyhhdXRvSWQpICYmIGF1dG9JZC5pbmRleE9mKCd7bmFtZX0nKSAhPSAtMSkpIHtcbiAgICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgJ0ludmFsaWQgYGF1dG9JZGAgJyArIGxvY2F0aW9uICsgJyBzdXBwbGllZCB0byAnICtcbiAgICAgICdgJyArIGNvbXBvbmVudE5hbWUgKyAnYC4gTXVzdCBiZSBmYWxzeSBvciBhIFN0cmluZyBjb250YWluaW5nIGEgJyArXG4gICAgICAnYHtuYW1lfWAgcGxhY2Vob2xkZXInXG4gICAgKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhdXRvSWRDaGVja2VyOiBhdXRvSWRDaGVja2VyXG4sIGNhbmNlbGxhYmxlOiBjYW5jZWxsYWJsZVxuLCBkZWJvdW5jZTogZGVib3VuY2VcbiwgaW5mbzogaW5mb1xuLCBmaWVsZERhdGE6IGZpZWxkRGF0YVxuLCBmb3JtYXRUb0FycmF5OiBmb3JtYXRUb0FycmF5XG4sIGZvcm1EYXRhOiBmb3JtRGF0YVxuLCBnZXRQcm9wczogZ2V0UHJvcHNcbiwgbWFrZUNob2ljZXM6IG1ha2VDaG9pY2VzXG4sIG5vcm1hbGlzZUNob2ljZXM6IG5vcm1hbGlzZUNob2ljZXNcbiwgbm9ybWFsaXNlVmFsaWRhdGlvbjogbm9ybWFsaXNlVmFsaWRhdGlvblxuLCBwcmV0dHlOYW1lOiBwcmV0dHlOYW1lXG4sIHN0cmlwOiBzdHJpcFxuLCB2YWxpZGF0ZUFsbDogdmFsaWRhdGVBbGxcbiwgd2FybmluZzogd2FybmluZ1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uY3VyID0gcmVxdWlyZSgnQ29uY3VyJylcbnZhciBpcyA9IHJlcXVpcmUoJ2lzb21vcnBoL2lzJylcbnZhciBvYmplY3QgPSByZXF1aXJlKCdpc29tb3JwaC9vYmplY3QnKVxudmFyIHRpbWUgPSByZXF1aXJlKCdpc29tb3JwaC90aW1lJylcbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LlJlYWN0IDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5SZWFjdCA6IG51bGwpXG5cbnZhciBlbnYgPSByZXF1aXJlKCcuL2VudicpXG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpXG52YXIgbG9jYWxlcyA9IHJlcXVpcmUoJy4vbG9jYWxlcycpXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpXG5cbi8qKlxuICogU29tZSB3aWRnZXRzIGFyZSBtYWRlIG9mIG11bHRpcGxlIEhUTUwgZWxlbWVudHMgLS0gbmFtZWx5LCBSYWRpb1NlbGVjdC5cbiAqIFRoaXMgcmVwcmVzZW50cyB0aGUgXCJpbm5lclwiIEhUTUwgZWxlbWVudCBvZiBhIHdpZGdldC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgU3ViV2lkZ2V0ID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBTdWJXaWRnZXQocGFyZW50V2lkZ2V0LCBuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFN1YldpZGdldCkpIHtcbiAgICAgIHJldHVybiBuZXcgU3ViV2lkZ2V0KHBhcmVudFdpZGdldCwgbmFtZSwgdmFsdWUsIGt3YXJncylcbiAgICB9XG4gICAgdGhpcy5wYXJlbnRXaWRnZXQgPSBwYXJlbnRXaWRnZXRcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7YXR0cnM6IG51bGwsIGNob2ljZXM6IFtdfSwga3dhcmdzKVxuICAgIHRoaXMuYXR0cnMgPSBrd2FyZ3MuYXR0cnNcbiAgICB0aGlzLmNob2ljZXMgPSBrd2FyZ3MuY2hvaWNlc1xuICB9XG59KVxuXG5TdWJXaWRnZXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIga3dhcmdzID0ge2F0dHJzOiB0aGlzLmF0dHJzfVxuICBpZiAodGhpcy5jaG9pY2VzLmxlbmd0aCkge1xuICAgIGt3YXJncy5jaG9pY2VzID0gdGhpcy5jaG9pY2VzXG4gIH1cbiAgcmV0dXJuIHRoaXMucGFyZW50V2lkZ2V0LnJlbmRlcih0aGlzLm5hbWUsIHRoaXMudmFsdWUsIGt3YXJncylcbn1cblxuLyoqXG4gKiBBbiBIVE1MIGZvcm0gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgV2lkZ2V0ID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBXaWRnZXQoa3dhcmdzKSB7XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7YXR0cnM6IG51bGx9LCBrd2FyZ3MpXG4gICAgdGhpcy5hdHRycyA9IG9iamVjdC5leHRlbmQoe30sIGt3YXJncy5hdHRycylcbiAgfVxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoaXMgY29ycmVzcG9uZHMgdG8gYW4gPGlucHV0IHR5cGU9XCJoaWRkZW5cIj4uICovXG4sIGlzSGlkZGVuOiBmYWxzZVxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoaXMgd2lkZ2V0IG5lZWRzIGEgbXVsdGlwYXJ0LWVuY29kZWQgZm9ybS4gKi9cbiwgbmVlZHNNdWx0aXBhcnRGb3JtOiBmYWxzZVxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoaXMgd2lkZ2V0IGlzIGZvciBhIHJlcXVpcmVkIGZpZWxkLiAqL1xuLCBpc1JlcXVpcmVkOiBmYWxzZVxuICAvKiogT3ZlcnJpZGUgZm9yIGFjdGl2ZSB2YWxpZGF0aW9uIGNvbmZpZyBhIHBhcnRpY3VsYXIgd2lkZ2V0IG5lZWRzIHRvIHVzZS4gKi9cbiwgdmFsaWRhdGlvbjogbnVsbFxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoaXMgd2lkZ2V0J3MgcmVuZGVyIGxvZ2ljIGFsd2F5cyBuZWVkcyB0byB1c2UgdGhlIGluaXRpYWwgdmFsdWUuICovXG4sIG5lZWRzSW5pdGlhbFZhbHVlOiBmYWxzZVxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoaXMgd2lkZ2V0J3MgdmFsdWUgY2FuIGJlIHNldC4gKi9cbiwgaXNWYWx1ZVNldHRhYmxlOiB0cnVlXG59KVxuXG4vKipcbiAqIFlpZWxkcyBhbGwgXCJzdWJ3aWRnZXRzXCIgb2YgdGhpcyB3aWRnZXQuIFVzZWQgb25seSBieSBSYWRpb1NlbGVjdCB0b1xuICogYWxsb3cgYWNjZXNzIHRvIGluZGl2aWR1YWwgPGlucHV0IHR5cGU9XCJyYWRpb1wiPiBidXR0b25zLlxuICogQXJndW1lbnRzIGFyZSB0aGUgc2FtZSBhcyBmb3IgcmVuZGVyKCkuXG4gKiBAcmV0dXJuIHtBcnJheS48U3ViV2lkZ2V0Pn1cbiAqL1xuV2lkZ2V0LnByb3RvdHlwZS5zdWJXaWRnZXRzID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICByZXR1cm4gW1N1YldpZGdldCh0aGlzLCBuYW1lLCB2YWx1ZSwga3dhcmdzKV1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoaXMgV2lkZ2V0IHJlbmRlcmVkIGFzIEhUTUwuXG4gKiBUaGUgdmFsdWUgZ2l2ZW4gaXMgbm90IGd1YXJhbnRlZWQgdG8gYmUgdmFsaWQgaW5wdXQsIHNvIHN1YmNsYXNzXG4gKiBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIHByb2dyYW0gZGVmZW5zaXZlbHkuXG4gKiBAYWJzdHJhY3RcbiAqL1xuV2lkZ2V0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIHRocm93IG5ldyBFcnJvcignQ29uc3RydWN0b3JzIGV4dGVuZGluZyBXaWRnZXQgbXVzdCBpbXBsZW1lbnQgYSByZW5kZXIoKSBtZXRob2QuJylcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIGJ1aWxkaW5nIGFuIEhUTUwgYXR0cmlidXRlcyBvYmplY3QuXG4gKi9cbldpZGdldC5wcm90b3R5cGUuYnVpbGRBdHRycyA9IGZ1bmN0aW9uKGt3YXJnQXR0cnMsIHJlbmRlckF0dHJzKSB7XG4gIHJldHVybiBvYmplY3QuZXh0ZW5kKHt9LCB0aGlzLmF0dHJzLCByZW5kZXJBdHRycywga3dhcmdBdHRycylcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmb3IgdGhpcyB3aWRnZXQgZnJvbSB0aGUgZ2l2ZW4gZGF0YS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIGZvcm0gZGF0YS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlcyBmaWxlIGRhdGEuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZmllbGQgbmFtZSB0byBiZSB1c2VkIHRvIHJldHJpZXZlIGRhdGEuXG4gKiBAcmV0dXJuIGEgdmFsdWUgZm9yIHRoaXMgd2lkZ2V0LCBvciBudWxsIGlmIG5vIHZhbHVlIHdhcyBwcm92aWRlZC5cbiAqL1xuV2lkZ2V0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhID0gZnVuY3Rpb24oZGF0YSwgZmlsZXMsIG5hbWUpIHtcbiAgcmV0dXJuIG9iamVjdC5nZXQoZGF0YSwgbmFtZSwgbnVsbClcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBIVE1MIGlkIGF0dHJpYnV0ZSBvZiB0aGlzIFdpZGdldCBmb3IgdXNlIGJ5IGFcbiAqIDxsYWJlbD4sIGdpdmVuIHRoZSBpZCBvZiB0aGUgZmllbGQuXG4gKiBUaGlzIGhvb2sgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc29tZSB3aWRnZXRzIGhhdmUgbXVsdGlwbGUgSFRNTCBlbGVtZW50cyBhbmQsXG4gKiB0aHVzLCBtdWx0aXBsZSBpZHMuIEluIHRoYXQgY2FzZSwgdGhpcyBtZXRob2Qgc2hvdWxkIHJldHVybiBhbiBJRCB2YWx1ZSB0aGF0XG4gKiBjb3JyZXNwb25kcyB0byB0aGUgZmlyc3QgaWQgaW4gdGhlIHdpZGdldCdzIHRhZ3MuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgYSBmaWVsZCBpZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIGlkIHdoaWNoIHNob3VsZCBiZSB1c2VkIGJ5IGEgPGxhYmVsPiBmb3IgdGhpcyBXaWRnZXQuXG4gKi9cbldpZGdldC5wcm90b3R5cGUuaWRGb3JMYWJlbCA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiBpZFxufVxuXG4vKipcbiAqIEFuIEhUTUwgPGlucHV0PiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtXaWRnZXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgSW5wdXQgPSBXaWRnZXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIElucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgSW5wdXQoa3dhcmdzKSB9XG4gICAgV2lkZ2V0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4gIC8qKiBUaGUgdHlwZSBhdHRyaWJ1dGUgb2YgdGhpcyBpbnB1dCAtIHN1YmNsYXNzZXMgbXVzdCBkZWZpbmUgaXQuICovXG4sIGlucHV0VHlwZTogbnVsbFxufSlcblxuSW5wdXQucHJvdG90eXBlLl9mb3JtYXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZVxufVxuXG5JbnB1dC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHthdHRyczogbnVsbH0sIGt3YXJncylcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgdmFsdWUgPSAnJ1xuICB9XG4gIHZhciBmaW5hbEF0dHJzID0gdGhpcy5idWlsZEF0dHJzKGt3YXJncy5hdHRycywge3R5cGU6IHRoaXMuaW5wdXRUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lfSlcbiAgLy8gSGlkZGVuIGlucHV0cyBjYW4gYmUgbWFkZSBjb250cm9sbGVkIGlucHV0cyBieSBkZWZhdWx0LCBhcyB0aGUgdXNlclxuICAvLyBjYW4ndCBkaXJlY3RseSBpbnRlcmFjdCB3aXRoIHRoZW0uXG4gIHZhciB2YWx1ZUF0dHIgPSAoa3dhcmdzLmNvbnRyb2xsZWQgfHwgdGhpcy5pc0hpZGRlbiA/ICd2YWx1ZScgOiAnZGVmYXVsdFZhbHVlJylcbiAgaWYgKCEodmFsdWVBdHRyID09ICdkZWZhdWx0VmFsdWUnICYmIHZhbHVlID09PSAnJykpIHtcbiAgICBmaW5hbEF0dHJzW3ZhbHVlQXR0cl0gPSAodmFsdWUgIT09ICcnID8gJycrdGhpcy5fZm9ybWF0VmFsdWUodmFsdWUpIDogdmFsdWUpXG4gIH1cbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JywgZmluYWxBdHRycylcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dCB0eXBlPVwidGV4dFwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBUZXh0SW5wdXQgPSBJbnB1dC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gVGV4dElucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgVGV4dElucHV0KGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2F0dHJzOiBudWxsfSwga3dhcmdzKVxuICAgIGlmIChrd2FyZ3MuYXR0cnMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5pbnB1dFR5cGUgPSBvYmplY3QucG9wKGt3YXJncy5hdHRycywgJ3R5cGUnLCB0aGlzLmlucHV0VHlwZSlcbiAgICB9XG4gICAgSW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbiwgaW5wdXRUeXBlOiAndGV4dCdcbn0pXG5cbi8qKlxuICogQW4gSFRNTCA8aW5wdXQgdHlwZT1cIm51bWJlclwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtUZXh0SW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTnVtYmVySW5wdXQgPSBUZXh0SW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE51bWJlcklucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgTnVtYmVySW5wdXQoa3dhcmdzKSB9XG4gICAgVGV4dElucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGlucHV0VHlwZTogJ251bWJlcidcbn0pXG5cbi8qKlxuICogQW4gSFRNTCA8aW5wdXQgdHlwZT1cImVtYWlsXCI+IHdpZGdldC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1RleHRJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBFbWFpbElucHV0ID0gVGV4dElucHV0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBFbWFpbElucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgRW1haWxJbnB1dChrd2FyZ3MpIH1cbiAgICBUZXh0SW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbiwgaW5wdXRUeXBlOiAnZW1haWwnXG59KVxuXG4vKipcbiAqIEFuIEhUTUwgPGlucHV0IHR5cGU9XCJ1cmxcIj4gd2lkZ2V0LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7VGV4dElucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFVSTElucHV0ID0gVGV4dElucHV0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBVUkxJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFVSTElucHV0KGt3YXJncykgfVxuICAgIFRleHRJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCBpbnB1dFR5cGU6ICd1cmwnXG59KVxuXG4vKipcbiAqIEFuIEhUTUwgPGlucHV0IHR5cGU9XCJwYXNzd29yZFwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtUZXh0SW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgUGFzc3dvcmRJbnB1dCA9IFRleHRJbnB1dC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gUGFzc3dvcmRJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFBhc3N3b3JkSW5wdXQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7cmVuZGVyVmFsdWU6IGZhbHNlfSwga3dhcmdzKVxuICAgIFRleHRJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLnJlbmRlclZhbHVlID0ga3dhcmdzLnJlbmRlclZhbHVlXG4gIH1cbiwgaW5wdXRUeXBlOiAncGFzc3dvcmQnXG59KVxuXG5QYXNzd29yZElucHV0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIGlmICghZW52LmJyb3dzZXIgJiYgIXRoaXMucmVuZGVyVmFsdWUpIHtcbiAgICB2YWx1ZSA9ICcnXG4gIH1cbiAgcmV0dXJuIFRleHRJbnB1dC5wcm90b3R5cGUucmVuZGVyLmNhbGwodGhpcywgbmFtZSwgdmFsdWUsIGt3YXJncylcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCI+IHdpZGdldC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge0lucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIEhpZGRlbklucHV0ID0gSW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIEhpZGRlbklucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgSGlkZGVuSW5wdXQoa3dhcmdzKSB9XG4gICAgSW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbiwgaW5wdXRUeXBlOiAnaGlkZGVuJ1xuLCBpc0hpZGRlbjogdHJ1ZVxufSlcblxuLyoqXG4gKiBBIHdpZGdldCB0aGF0IGhhbmRsZXMgPGlucHV0IHR5cGU9XCJoaWRkZW5cIj4gZm9yIGZpZWxkcyB0aGF0IGhhdmUgYSBsaXN0IG9mXG4gKiB2YWx1ZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtIaWRkZW5JbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBNdWx0aXBsZUhpZGRlbklucHV0ID0gSGlkZGVuSW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE11bHRpcGxlSGlkZGVuSW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBNdWx0aXBsZUhpZGRlbklucHV0KGt3YXJncykgfVxuICAgIEhpZGRlbklucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG5NdWx0aXBsZUhpZGRlbklucHV0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2F0dHJzOiBudWxsfSwga3dhcmdzKVxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICB2YWx1ZSA9IFtdXG4gIH1cbiAgdmFyIGZpbmFsQXR0cnMgPSB0aGlzLmJ1aWxkQXR0cnMoa3dhcmdzLmF0dHJzLCB7dHlwZTogdGhpcy5pbnB1dFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWV9KVxuICB2YXIgaWQgPSBvYmplY3QuZ2V0KGZpbmFsQXR0cnMsICdpZCcsIG51bGwpXG4gIHZhciBrZXkgPSBvYmplY3QuZ2V0KGZpbmFsQXR0cnMsICdrZXknLCBudWxsKVxuICB2YXIgaW5wdXRzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgaW5wdXRBdHRycyA9IG9iamVjdC5leHRlbmQoe30sIGZpbmFsQXR0cnMsIHt2YWx1ZTogdmFsdWVbaV19KVxuICAgIC8vIEFkZCBudW1lcmljIGluZGV4IHN1ZmZpeGVzIHRvIGF0dHJpYnV0ZXMgd2hpY2ggc2hvdWxkIGJlIHVuaXF1ZVxuICAgIGlmIChpZCkge1xuICAgICAgaW5wdXRBdHRycy5pZCA9IGlkICsgJ18nICsgaVxuICAgIH1cbiAgICBpZiAoa2V5KSB7XG4gICAgICBpbnB1dEF0dHJzLmtleSA9IGlkICsgJ18nICsgaVxuICAgIH1cbiAgICBpbnB1dHMucHVzaChSZWFjdC5jcmVhdGVFbGVtZW50KCdpbnB1dCcsIGlucHV0QXR0cnMpKVxuICB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCBudWxsLCBpbnB1dHMpXG59XG5cbk11bHRpcGxlSGlkZGVuSW5wdXQucHJvdG90eXBlLnZhbHVlRnJvbURhdGEgPSBmdW5jdGlvbihkYXRhLCBmaWxlcywgbmFtZSkge1xuICBpZiAodHlwZW9mIGRhdGFbbmFtZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gW10uY29uY2F0KGRhdGFbbmFtZV0pXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDxpbnB1dCB0eXBlPVwiZmlsZVwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBGaWxlSW5wdXQgPSBJbnB1dC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRmlsZUlucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgRmlsZUlucHV0KGt3YXJncykgfVxuICAgIElucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGlucHV0VHlwZTogJ2ZpbGUnXG4sIG5lZWRzTXVsdGlwYXJ0Rm9ybTogdHJ1ZVxuLCB2YWxpZGF0aW9uOiB7b25DaGFuZ2U6IHRydWV9XG4sIGlzVmFsdWVTZXR0YWJsZTogZmFsc2Vcbn0pXG5cbkZpbGVJbnB1dC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICByZXR1cm4gSW5wdXQucHJvdG90eXBlLnJlbmRlci5jYWxsKHRoaXMsIG5hbWUsIG51bGwsIGt3YXJncylcbn1cblxuLyoqXG4gKiBGaWxlIHdpZGdldHMgdGFrZSBkYXRhIGZyb20gZmlsZSB3cmFwcGVycyBvbiB0aGUgc2VydmVyLiBPbiB0aGUgY2xpZW50LCB0aGV5XG4gKiB0YWtlIGl0IGZyb20gZGF0YSBzbyB0aGUgcHJlc2VuY2Ugb2YgYSAudmFsdWUgY2FuIGJlIHZhbGlkYXRlZCB3aGVuIHJlcXVpcmVkLlxuICovXG5GaWxlSW5wdXQucHJvdG90eXBlLnZhbHVlRnJvbURhdGEgPSBmdW5jdGlvbihkYXRhLCBmaWxlcywgbmFtZSkge1xuICByZXR1cm4gb2JqZWN0LmdldChlbnYuYnJvd3NlciA/IGRhdGEgOiBmaWxlcywgbmFtZSwgbnVsbClcbn1cblxudmFyIEZJTEVfSU5QVVRfQ09OVFJBRElDVElPTiA9IHt9XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RmlsZUlucHV0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENsZWFyYWJsZUZpbGVJbnB1dCA9IEZpbGVJbnB1dC5leHRlbmQoe1xuICBuZWVkc0luaXRpYWxWYWx1ZTogdHJ1ZVxuLCBpc1ZhbHVlU2V0dGFibGU6IGZhbHNlXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBDbGVhcmFibGVGaWxlSW5wdXQoa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdpZGdldCkpIHsgcmV0dXJuIG5ldyBDbGVhcmFibGVGaWxlSW5wdXQoa3dhcmdzKSB9XG4gICAgRmlsZUlucHV0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGluaXRpYWxUZXh0OiAnQ3VycmVudGx5J1xuLCBpbnB1dFRleHQ6ICdDaGFuZ2UnXG4sIGNsZWFyQ2hlY2tib3hMYWJlbDogJ0NsZWFyJ1xuLCB0ZW1wbGF0ZVdpdGhJbml0aWFsOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICByZXR1cm4gdXRpbC5mb3JtYXRUb0FycmF5KFxuICAgICAgJ3tpbml0aWFsVGV4dH06IHtpbml0aWFsfSB7Y2xlYXJUZW1wbGF0ZX17YnJ9e2lucHV0VGV4dH06IHtpbnB1dH0nXG4gICAgLCBvYmplY3QuZXh0ZW5kKHBhcmFtcywge2JyOiBSZWFjdC5jcmVhdGVFbGVtZW50KCdicicsIG51bGwpfSlcbiAgICApXG4gIH1cbiwgdGVtcGxhdGVXaXRoQ2xlYXI6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgIHJldHVybiB1dGlsLmZvcm1hdFRvQXJyYXkoXG4gICAgICAne2NoZWNrYm94fSB7bGFiZWx9J1xuICAgICwgb2JqZWN0LmV4dGVuZChwYXJhbXMsIHtcbiAgICAgICAgbGFiZWw6IFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJywge2h0bWxGb3I6IHBhcmFtcy5jaGVja2JveElkfSwgcGFyYW1zLmxhYmVsKVxuICAgICAgfSlcbiAgICApXG4gIH1cbiwgdXJsTWFya3VwVGVtcGxhdGU6IGZ1bmN0aW9uKGhyZWYsIG5hbWUpIHtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnYScsIHtocmVmOiBocmVmfSwgbmFtZSlcbiAgfVxufSlcblxuLyoqXG4gKiBHaXZlbiB0aGUgbmFtZSBvZiB0aGUgZmlsZSBpbnB1dCwgcmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBjbGVhciBjaGVja2JveFxuICogaW5wdXQuXG4gKi9cbkNsZWFyYWJsZUZpbGVJbnB1dC5wcm90b3R5cGUuY2xlYXJDaGVja2JveE5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBuYW1lICsgJy1jbGVhcidcbn1cblxuLyoqXG4gKiBHaXZlbiB0aGUgbmFtZSBvZiB0aGUgY2xlYXIgY2hlY2tib3ggaW5wdXQsIHJldHVybiB0aGUgSFRNTCBpZCBmb3IgaXQuXG4gKi9cbkNsZWFyYWJsZUZpbGVJbnB1dC5wcm90b3R5cGUuY2xlYXJDaGVja2JveElkID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gbmFtZSArICdfaWQnXG59XG5cbkNsZWFyYWJsZUZpbGVJbnB1dC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHthdHRyczoge319LCBrd2FyZ3MpXG4gIGt3YXJncy5hdHRycy5rZXkgPSAnaW5wdXQnXG4gIHZhciBpbnB1dCA9IEZpbGVJbnB1dC5wcm90b3R5cGUucmVuZGVyLmNhbGwodGhpcywgbmFtZSwgdmFsdWUsIGt3YXJncylcbiAgdmFyIGluaXRpYWxWYWx1ZSA9IGt3YXJncy5pbml0aWFsVmFsdWVcbiAgaWYgKCFpbml0aWFsVmFsdWUgJiYgdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnVybCAhPSAndW5kZWZpbmVkJykge1xuICAgIGluaXRpYWxWYWx1ZSA9IHZhbHVlXG4gIH1cbiAgaWYgKGluaXRpYWxWYWx1ZSAmJiB0eXBlb2YgaW5pdGlhbFZhbHVlLnVybCAhPSAndW5kZWZpbmVkJykge1xuICAgIHZhciBjbGVhclRlbXBsYXRlXG4gICAgaWYgKCF0aGlzLmlzUmVxdWlyZWQpIHtcbiAgICAgIHZhciBjbGVhckNoZWNrYm94TmFtZSA9IHRoaXMuY2xlYXJDaGVja2JveE5hbWUobmFtZSlcbiAgICAgIHZhciBjbGVhckNoZWNrYm94SWQgPSB0aGlzLmNsZWFyQ2hlY2tib3hJZChjbGVhckNoZWNrYm94TmFtZSlcbiAgICAgIGNsZWFyVGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlV2l0aENsZWFyKHtcbiAgICAgICAgY2hlY2tib3g6IENoZWNrYm94SW5wdXQoKS5yZW5kZXIoY2xlYXJDaGVja2JveE5hbWUsIGZhbHNlLCB7YXR0cnM6IHsnaWQnOiBjbGVhckNoZWNrYm94SWR9fSlcbiAgICAgICwgY2hlY2tib3hJZDogY2xlYXJDaGVja2JveElkXG4gICAgICAsIGxhYmVsOiB0aGlzLmNsZWFyQ2hlY2tib3hMYWJlbFxuICAgICAgfSlcbiAgICB9XG4gICAgdmFyIGNvbnRlbnRzID0gdGhpcy50ZW1wbGF0ZVdpdGhJbml0aWFsKHtcbiAgICAgIGluaXRpYWxUZXh0OiB0aGlzLmluaXRpYWxUZXh0XG4gICAgLCBpbml0aWFsOiB0aGlzLnVybE1hcmt1cFRlbXBsYXRlKGluaXRpYWxWYWx1ZS51cmwsICcnK2luaXRpYWxWYWx1ZSlcbiAgICAsIGNsZWFyVGVtcGxhdGU6IGNsZWFyVGVtcGxhdGVcbiAgICAsIGlucHV0VGV4dDogdGhpcy5pbnB1dFRleHRcbiAgICAsIGlucHV0OiBpbnB1dFxuICAgIH0pXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nLCBudWxsLCBjb250ZW50cylcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnc3BhbicsIG51bGwsIGlucHV0KVxuICB9XG59XG5cbkNsZWFyYWJsZUZpbGVJbnB1dC5wcm90b3R5cGUudmFsdWVGcm9tRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGZpbGVzLCBuYW1lKSB7XG4gIHZhciB1cGxvYWQgPSBGaWxlSW5wdXQucHJvdG90eXBlLnZhbHVlRnJvbURhdGEoZGF0YSwgZmlsZXMsIG5hbWUpXG4gIGlmICghdGhpcy5pc1JlcXVpcmVkICYmXG4gICAgICBDaGVja2JveElucHV0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhLmNhbGwodGhpcywgZGF0YSwgZmlsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhckNoZWNrYm94TmFtZShuYW1lKSkpIHtcbiAgICBpZiAodXBsb2FkKSB7XG4gICAgICAvLyBJZiB0aGUgdXNlciBjb250cmFkaWN0cyB0aGVtc2VsdmVzICh1cGxvYWRzIGEgbmV3IGZpbGUgQU5EXG4gICAgICAvLyBjaGVja3MgdGhlIFwiY2xlYXJcIiBjaGVja2JveCksIHdlIHJldHVybiBhIHVuaXF1ZSBtYXJrZXJcbiAgICAgIC8vIG9iamVjdCB0aGF0IEZpbGVGaWVsZCB3aWxsIHR1cm4gaW50byBhIFZhbGlkYXRpb25FcnJvci5cbiAgICAgIHJldHVybiBGSUxFX0lOUFVUX0NPTlRSQURJQ1RJT05cbiAgICB9XG4gICAgLy8gZmFsc2Ugc2lnbmFscyB0byBjbGVhciBhbnkgZXhpc3RpbmcgdmFsdWUsIGFzIG9wcG9zZWQgdG8ganVzdCBudWxsXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHVwbG9hZFxufVxuXG4vKipcbiAqIEFuIEhUTUwgPHRleHRhcmVhPiB3aWRnZXQuXG4gKiBAcGFyYW0ge09iamVjdH0gW2t3YXJnc10gY29uZmlndXJhdGlvbiBvcHRpb25zXG4gKiBAY29uZmlnIHtvYmplY3R9IFthdHRyc10gSFRNTCBhdHRyaWJ1dGVzIGZvciB0aGUgcmVuZGVyZWQgd2lkZ2V0LiBEZWZhdWx0XG4gKiAgIHJvd3MgYW5kIGNvbHMgYXR0cmlidXRlcyB3aWxsIGJlIHVzZWQgaWYgbm90IHByb3ZpZGVkLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7V2lkZ2V0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFRleHRhcmVhID0gV2lkZ2V0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBUZXh0YXJlYShrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFRleHRhcmVhKGt3YXJncykgfVxuICAgIC8vIEVuc3VyZSB3ZSBoYXZlIHNvbWV0aGluZyBpbiBhdHRyc1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2F0dHJzOiBudWxsfSwga3dhcmdzKVxuICAgIC8vIFByb3ZpZGUgZGVmYXVsdCAnY29scycgYW5kICdyb3dzJyBhdHRyaWJ1dGVzXG4gICAga3dhcmdzLmF0dHJzID0gb2JqZWN0LmV4dGVuZCh7cm93czogJzMnLCBjb2xzOiAnNDAnfSwga3dhcmdzLmF0dHJzKVxuICAgIFdpZGdldC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuVGV4dGFyZWEucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7fSwga3dhcmdzKVxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICB2YWx1ZSA9ICcnXG4gIH1cbiAgdmFyIGZpbmFsQXR0cnMgPSB0aGlzLmJ1aWxkQXR0cnMoa3dhcmdzLmF0dHJzLCB7bmFtZTogbmFtZX0pXG4gIHZhciB2YWx1ZUF0dHIgPSAoa3dhcmdzLmNvbnRyb2xsZWQgPyAndmFsdWUnIDogJ2RlZmF1bHRWYWx1ZScpXG4gIGZpbmFsQXR0cnNbdmFsdWVBdHRyXSA9IHZhbHVlXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScsIGZpbmFsQXR0cnMpXG59XG5cbi8qKlxuICogQSA8aW5wdXQgdHlwZT1cInRleHRcIj4gd2hpY2gsIGlmIGdpdmVuIGEgRGF0ZSBvYmplY3QgdG8gZGlzcGxheSwgZm9ybWF0cyBpdCBhc1xuICogYW4gYXBwcm9wcmlhdGUgZGF0ZS90aW1lIFN0cmluZy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1RleHRJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBEYXRlVGltZUJhc2VJbnB1dCA9IFRleHRJbnB1dC5leHRlbmQoe1xuICBmb3JtYXRUeXBlOiAnJ1xuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gRGF0ZVRpbWVCYXNlSW5wdXQoa3dhcmdzKSB7XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7Zm9ybWF0OiBudWxsfSwga3dhcmdzKVxuICAgIFRleHRJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLmZvcm1hdCA9IGt3YXJncy5mb3JtYXRcbiAgfVxufSlcblxuRGF0ZVRpbWVCYXNlSW5wdXQucHJvdG90eXBlLl9mb3JtYXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmIChpcy5EYXRlKHZhbHVlKSkge1xuICAgIGlmICh0aGlzLmZvcm1hdCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5mb3JtYXQgPSBmb3JtYXRzLmdldEZvcm1hdCh0aGlzLmZvcm1hdFR5cGUpWzBdXG4gICAgfVxuICAgIHJldHVybiB0aW1lLnN0cmZ0aW1lKHZhbHVlLCB0aGlzLmZvcm1hdCwgbG9jYWxlcy5nZXREZWZhdWx0TG9jYWxlKCkpXG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RGF0ZVRpbWVCYXNlSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgRGF0ZUlucHV0ID0gRGF0ZVRpbWVCYXNlSW5wdXQuZXh0ZW5kKHtcbiAgZm9ybWF0VHlwZTogJ0RBVEVfSU5QVVRfRk9STUFUUydcbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIERhdGVJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRGF0ZUlucHV0KSkgeyByZXR1cm4gbmV3IERhdGVJbnB1dChrd2FyZ3MpIH1cbiAgICBEYXRlVGltZUJhc2VJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtEYXRlVGltZUJhc2VJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBEYXRlVGltZUlucHV0ID0gRGF0ZVRpbWVCYXNlSW5wdXQuZXh0ZW5kKHtcbiAgZm9ybWF0VHlwZTogJ0RBVEVUSU1FX0lOUFVUX0ZPUk1BVFMnXG4sIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBEYXRlVGltZUlucHV0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBEYXRlVGltZUlucHV0KSkgeyByZXR1cm4gbmV3IERhdGVUaW1lSW5wdXQoa3dhcmdzKSB9XG4gICAgRGF0ZVRpbWVCYXNlSW5wdXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gIH1cbn0pXG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7RGF0ZVRpbWVCYXNlSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgVGltZUlucHV0ID0gRGF0ZVRpbWVCYXNlSW5wdXQuZXh0ZW5kKHtcbiAgZm9ybWF0VHlwZTogJ1RJTUVfSU5QVVRfRk9STUFUUydcbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFRpbWVJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVGltZUlucHV0KSkgeyByZXR1cm4gbmV3IFRpbWVJbnB1dChrd2FyZ3MpIH1cbiAgICBEYXRlVGltZUJhc2VJbnB1dC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxudmFyIGRlZmF1bHRDaGVja1Rlc3QgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlICE9PSBmYWxzZSAmJlxuICAgICAgICAgIHZhbHVlICE9PSBudWxsICYmXG4gICAgICAgICAgdmFsdWUgIT09ICcnKVxufVxuXG4vKipcbiAqIEFuIEhUTUwgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiPiB3aWRnZXQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtXaWRnZXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgQ2hlY2tib3hJbnB1dCA9IFdpZGdldC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2hlY2tib3hJbnB1dChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IENoZWNrYm94SW5wdXQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7Y2hlY2tUZXN0OiBkZWZhdWx0Q2hlY2tUZXN0fSwga3dhcmdzKVxuICAgIFdpZGdldC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICB0aGlzLmNoZWNrVGVzdCA9IGt3YXJncy5jaGVja1Rlc3RcbiAgfVxuLCB2YWxpZGF0aW9uOiB7b25DaGFuZ2U6IHRydWV9XG59KVxuXG5DaGVja2JveElucHV0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe30sIGt3YXJncylcbiAgdmFyIGZpbmFsQXR0cnMgPSB0aGlzLmJ1aWxkQXR0cnMoa3dhcmdzLmF0dHJzLCB7dHlwZTogJ2NoZWNrYm94JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZX0pXG4gIGlmICh2YWx1ZSAhPT0gJycgJiYgdmFsdWUgIT09IHRydWUgJiYgdmFsdWUgIT09IGZhbHNlICYmIHZhbHVlICE9PSBudWxsICYmXG4gICAgICB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBhZGQgdGhlIHZhbHVlIGF0dHJpYnV0ZSBpZiB2YWx1ZSBpcyBub24tZW1wdHlcbiAgICBmaW5hbEF0dHJzLnZhbHVlID0gdmFsdWVcbiAgfVxuICB2YXIgY2hlY2tlZEF0dHIgPSAoa3dhcmdzLmNvbnRyb2xsZWQgPyAnY2hlY2tlZCcgOiAnZGVmYXVsdENoZWNrZWQnKVxuICBmaW5hbEF0dHJzW2NoZWNrZWRBdHRyXSA9IHRoaXMuY2hlY2tUZXN0KHZhbHVlKVxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudCgnaW5wdXQnLCBmaW5hbEF0dHJzKVxufVxuXG5DaGVja2JveElucHV0LnByb3RvdHlwZS52YWx1ZUZyb21EYXRhID0gZnVuY3Rpb24oZGF0YSwgZmlsZXMsIG5hbWUpIHtcbiAgaWYgKHR5cGVvZiBkYXRhW25hbWVdID09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gIEEgbWlzc2luZyB2YWx1ZSBtZWFucyBGYWxzZSBiZWNhdXNlIEhUTUwgZm9ybSBzdWJtaXNzaW9uIGRvZXMgbm90XG4gICAgLy8gc2VuZCByZXN1bHRzIGZvciB1bnNlbGVjdGVkIGNoZWNrYm94ZXMuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgdmFyIHZhbHVlID0gZGF0YVtuYW1lXVxuICB2YXIgdmFsdWVzID0geyd0cnVlJzogdHJ1ZSwgJ2ZhbHNlJzogZmFsc2V9XG4gIC8vIFRyYW5zbGF0ZSB0cnVlIGFuZCBmYWxzZSBzdHJpbmdzIHRvIGJvb2xlYW4gdmFsdWVzXG4gIGlmIChpcy5TdHJpbmcodmFsdWUpKSB7XG4gICAgdmFsdWUgPSBvYmplY3QuZ2V0KHZhbHVlcywgdmFsdWUudG9Mb3dlckNhc2UoKSwgdmFsdWUpXG4gIH1cbiAgcmV0dXJuICEhdmFsdWVcbn1cblxuLyoqXG4gKiBBbiBIVE1MIDxzZWxlY3Q+IHdpZGdldC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1dpZGdldH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBTZWxlY3QgPSBXaWRnZXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFNlbGVjdChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFNlbGVjdChrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtjaG9pY2VzOiBbXX0sIGt3YXJncylcbiAgICBXaWRnZXQuY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgdGhpcy5jaG9pY2VzID0gdXRpbC5ub3JtYWxpc2VDaG9pY2VzKGt3YXJncy5jaG9pY2VzKVxuICB9XG4sIGFsbG93TXVsdGlwbGVTZWxlY3RlZDogZmFsc2VcbiwgdmFsaWRhdGlvbjoge29uQ2hhbmdlOiB0cnVlfVxufSlcblxuLyoqXG4gKiBSZW5kZXJzIHRoZSB3aWRnZXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZmllbGQgbmFtZS5cbiAqIEBwYXJhbSB7Kn0gc2VsZWN0ZWRWYWx1ZSB0aGUgdmFsdWUgb2YgYW4gb3B0aW9uIHdoaWNoIHNob3VsZCBiZSBtYXJrZWQgYXNcbiAqICAgc2VsZWN0ZWQsIG9yIG51bGwgaWYgbm8gdmFsdWUgaXMgc2VsZWN0ZWQgLS0gd2lsbCBiZSBub3JtYWxpc2VkIHRvIGEgU3RyaW5nXG4gKiAgIGZvciBjb21wYXJpc29uIHdpdGggY2hvaWNlIHZhbHVlcy5cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzIHJlbmRlcmluZyBvcHRpb25zXG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJncy5hdHRycyBhZGRpdGlvbmFsIEhUTUwgYXR0cmlidXRlcyBmb3IgdGhlIHJlbmRlcmVkIHdpZGdldC5cbiAqIEBwYXJhbSB7QXJyYXk9fSBrd2FyZ3MuY2hvaWNlcyBjaG9pY2VzIHRvIGJlIHVzZWQgd2hlbiByZW5kZXJpbmcgdGhlIHdpZGdldCwgaW5cbiAqICAgYWRkaXRpb24gdG8gdGhvc2UgYWxyZWFkeSBoZWxkIGJ5IHRoZSB3aWRnZXQgaXRzZWxmLlxuICogQHJldHVybiBhIDxzZWxlY3Q+IGVsZW1lbnQuXG4gKi9cblNlbGVjdC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgc2VsZWN0ZWRWYWx1ZSwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2Nob2ljZXM6IFtdfSwga3dhcmdzKVxuICBpZiAoc2VsZWN0ZWRWYWx1ZSA9PT0gbnVsbCkge1xuICAgIHNlbGVjdGVkVmFsdWUgPSAnJ1xuICB9XG4gIHZhciBmaW5hbEF0dHJzID0gdGhpcy5idWlsZEF0dHJzKGt3YXJncy5hdHRycywge25hbWU6IG5hbWV9KVxuICB2YXIgb3B0aW9ucyA9IHRoaXMucmVuZGVyT3B0aW9ucyhrd2FyZ3MuY2hvaWNlcywgW3NlbGVjdGVkVmFsdWVdKVxuICB2YXIgdmFsdWVBdHRyID0gKGt3YXJncy5jb250cm9sbGVkID8gJ3ZhbHVlJyA6ICdkZWZhdWx0VmFsdWUnKVxuICBmaW5hbEF0dHJzW3ZhbHVlQXR0cl0gPSBzZWxlY3RlZFZhbHVlXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnLCBmaW5hbEF0dHJzLCBvcHRpb25zKVxufVxuXG5TZWxlY3QucHJvdG90eXBlLnJlbmRlck9wdGlvbnMgPSBmdW5jdGlvbihhZGRpdGlvbmFsQ2hvaWNlcywgc2VsZWN0ZWRWYWx1ZXMpIHtcbiAgdmFyIHNlbGVjdGVkVmFsdWVzTG9va3VwID0gb2JqZWN0Lmxvb2t1cChzZWxlY3RlZFZhbHVlcylcbiAgdmFyIG9wdGlvbnMgPSBbXVxuICB2YXIgY2hvaWNlcyA9IHRoaXMuY2hvaWNlcy5jb25jYXQodXRpbC5ub3JtYWxpc2VDaG9pY2VzKGFkZGl0aW9uYWxDaG9pY2VzKSlcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaG9pY2VzLmxlbmd0aCwgY2hvaWNlOyBpIDwgbDsgaSsrKSB7XG4gICAgY2hvaWNlID0gY2hvaWNlc1tpXVxuICAgIGlmIChpcy5BcnJheShjaG9pY2VbMV0pKSB7XG4gICAgICB2YXIgb3B0Z3JvdXBPcHRpb25zID0gW11cbiAgICAgIHZhciBvcHRncm91cENob2ljZXMgPSBjaG9pY2VbMV1cbiAgICAgIGZvciAodmFyIGogPSAwLCBtID0gb3B0Z3JvdXBDaG9pY2VzLmxlbmd0aDsgaiA8IG07IGorKykge1xuICAgICAgICBvcHRncm91cE9wdGlvbnMucHVzaCh0aGlzLnJlbmRlck9wdGlvbihzZWxlY3RlZFZhbHVlc0xvb2t1cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0Z3JvdXBDaG9pY2VzW2pdWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRncm91cENob2ljZXNbal1bMV0pKVxuICAgICAgfVxuICAgICAgb3B0aW9ucy5wdXNoKFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ29wdGdyb3VwJywge2xhYmVsOiBjaG9pY2VbMF19LCBvcHRncm91cE9wdGlvbnMpKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIG9wdGlvbnMucHVzaCh0aGlzLnJlbmRlck9wdGlvbihzZWxlY3RlZFZhbHVlc0xvb2t1cCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaG9pY2VbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlWzFdKSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9wdGlvbnNcbn1cblxuU2VsZWN0LnByb3RvdHlwZS5yZW5kZXJPcHRpb24gPSBmdW5jdGlvbihzZWxlY3RlZFZhbHVlc0xvb2t1cCwgb3B0VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdExhYmVsKSB7XG4gIG9wdFZhbHVlID0gJycrb3B0VmFsdWVcbiAgdmFyIGF0dHJzID0ge3ZhbHVlOiBvcHRWYWx1ZX1cbiAgaWYgKHR5cGVvZiBzZWxlY3RlZFZhbHVlc0xvb2t1cFtvcHRWYWx1ZV0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBhdHRyc1snc2VsZWN0ZWQnXSA9ICdzZWxlY3RlZCdcbiAgICBpZiAoIXRoaXMuYWxsb3dNdWx0aXBsZVNlbGVjdGVkKSB7XG4gICAgICAvLyBPbmx5IGFsbG93IGZvciBhIHNpbmdsZSBzZWxlY3Rpb24gd2l0aCB0aGlzIHZhbHVlXG4gICAgICBkZWxldGUgc2VsZWN0ZWRWYWx1ZXNMb29rdXBbb3B0VmFsdWVdXG4gICAgfVxuICB9XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdvcHRpb24nLCBhdHRycywgb3B0TGFiZWwpXG59XG5cbi8qKlxuICogQSA8c2VsZWN0PiB3aWRnZXQgaW50ZW5kZWQgdG8gYmUgdXNlZCB3aXRoIE51bGxCb29sZWFuRmllbGQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtTZWxlY3R9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTnVsbEJvb2xlYW5TZWxlY3QgPSBTZWxlY3QuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE51bGxCb29sZWFuU2VsZWN0KGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgTnVsbEJvb2xlYW5TZWxlY3Qoa3dhcmdzKSB9XG4gICAga3dhcmdzID0ga3dhcmdzIHx8IHt9XG4gICAgLy8gU2V0IG9yIG92ZXJyaWRlIGNob2ljZXNcbiAgICBrd2FyZ3MuY2hvaWNlcyA9IFtbJzEnLCAnVW5rbm93biddLCBbJzInLCAnWWVzJ10sIFsnMycsICdObyddXVxuICAgIFNlbGVjdC5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxufSlcblxuTnVsbEJvb2xlYW5TZWxlY3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAgaWYgKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09ICcyJykge1xuICAgIHZhbHVlID0gJzInXG4gIH1cbiAgZWxzZSBpZiAodmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09ICczJykge1xuICAgIHZhbHVlID0gJzMnXG4gIH1cbiAgZWxzZSB7XG4gICAgdmFsdWUgPSAnMSdcbiAgfVxuICByZXR1cm4gU2VsZWN0LnByb3RvdHlwZS5yZW5kZXIuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSwga3dhcmdzKVxufVxuXG5OdWxsQm9vbGVhblNlbGVjdC5wcm90b3R5cGUudmFsdWVGcm9tRGF0YSA9IGZ1bmN0aW9uKGRhdGEsIGZpbGVzLCBuYW1lKSB7XG4gIHZhciB2YWx1ZSA9IG51bGxcbiAgaWYgKHR5cGVvZiBkYXRhW25hbWVdICE9ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIGRhdGFWYWx1ZSA9IGRhdGFbbmFtZV1cbiAgICBpZiAoZGF0YVZhbHVlID09PSB0cnVlIHx8IGRhdGFWYWx1ZSA9PSAnVHJ1ZScgfHwgZGF0YVZhbHVlID09ICd0cnVlJyB8fFxuICAgICAgICBkYXRhVmFsdWUgPT0gJzInKSB7XG4gICAgICB2YWx1ZSA9IHRydWVcbiAgICB9XG4gICAgZWxzZSBpZiAoZGF0YVZhbHVlID09PSBmYWxzZSB8fCBkYXRhVmFsdWUgPT0gJ0ZhbHNlJyB8fFxuICAgICAgICAgICAgIGRhdGFWYWx1ZSA9PSAnZmFsc2UnIHx8IGRhdGFWYWx1ZSA9PSAnMycpIHtcbiAgICAgIHZhbHVlID0gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQW4gSFRNTCA8c2VsZWN0PiB3aWRnZXQgd2hpY2ggYWxsb3dzIG11bHRpcGxlIHNlbGVjdGlvbnMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtTZWxlY3R9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgU2VsZWN0TXVsdGlwbGUgPSBTZWxlY3QuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFNlbGVjdE11bHRpcGxlKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgU2VsZWN0TXVsdGlwbGUoa3dhcmdzKSB9XG4gICAgU2VsZWN0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIGFsbG93TXVsdGlwbGVTZWxlY3RlZDogdHJ1ZVxuLCB2YWxpZGF0aW9uOiB7b25DaGFuZ2U6IHRydWV9XG59KVxuXG4vKipcbiAqIFJlbmRlcnMgdGhlIHdpZGdldC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBmaWVsZCBuYW1lLlxuICogQHBhcmFtIHtBcnJheX0gc2VsZWN0ZWRWYWx1ZXMgdGhlIHZhbHVlcyBvZiBvcHRpb25zIHdoaWNoIHNob3VsZCBiZSBtYXJrZWQgYXNcbiAqICAgc2VsZWN0ZWQsIG9yIG51bGwgaWYgbm8gdmFsdWVzIGFyZSBzZWxlY3RlZCAtIHRoZXNlIHdpbGwgYmUgbm9ybWFsaXNlZCB0b1xuICogICBTdHJpbmdzIGZvciBjb21wYXJpc29uIHdpdGggY2hvaWNlIHZhbHVlcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBba3dhcmdzXSBhZGRpdGlvbmFsIHJlbmRlcmluZyBvcHRpb25zLlxuICogQHJldHVybiBhIDxzZWxlY3Q+IGVsZW1lbnQgd2hpY2ggYWxsb3dzIG11bHRpcGxlIHNlbGVjdGlvbnMuXG4gKi9cblNlbGVjdE11bHRpcGxlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCBzZWxlY3RlZFZhbHVlcywga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2Nob2ljZXM6IFtdfSwga3dhcmdzKVxuICBpZiAoc2VsZWN0ZWRWYWx1ZXMgPT09IG51bGwpIHtcbiAgICBzZWxlY3RlZFZhbHVlcyA9IFtdXG4gIH1cbiAgaWYgKCFpcy5BcnJheShzZWxlY3RlZFZhbHVlcykpIHtcbiAgICBzZWxlY3RlZFZhbHVlcyA9IFtzZWxlY3RlZFZhbHVlc11cbiAgfVxuICB2YXIgZmluYWxBdHRycyA9IHRoaXMuYnVpbGRBdHRycyhrd2FyZ3MuYXR0cnMsIHtuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZTogJ211bHRpcGxlJ30pXG4gIHZhciBvcHRpb25zID0gdGhpcy5yZW5kZXJPcHRpb25zKGt3YXJncy5jaG9pY2VzLCBzZWxlY3RlZFZhbHVlcylcbiAgdmFyIHZhbHVlQXR0ciA9IChrd2FyZ3MuY29udHJvbGxlZCA/ICd2YWx1ZScgOiAnZGVmYXVsdFZhbHVlJylcbiAgZmluYWxBdHRyc1t2YWx1ZUF0dHJdID0gc2VsZWN0ZWRWYWx1ZXNcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcsIGZpbmFsQXR0cnMsIG9wdGlvbnMpXG59XG5cbi8qKlxuICogUmV0cmlldmVzIHZhbHVlcyBmb3IgdGhpcyB3aWRnZXQgZnJvbSB0aGUgZ2l2ZW4gZGF0YS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIGZvcm0gZGF0YS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlcyBmaWxlIGRhdGEuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZmllbGQgbmFtZSB0byBiZSB1c2VkIHRvIHJldHJpZXZlIGRhdGEuXG4gKiBAcmV0dXJuIHtBcnJheX0gdmFsdWVzIGZvciB0aGlzIHdpZGdldCwgb3IgbnVsbCBpZiBubyB2YWx1ZXMgd2VyZSBwcm92aWRlZC5cbiAqL1xuU2VsZWN0TXVsdGlwbGUucHJvdG90eXBlLnZhbHVlRnJvbURhdGEgPSBmdW5jdGlvbihkYXRhLCBmaWxlcywgbmFtZSkge1xuICBpZiAob2JqZWN0Lmhhc093bihkYXRhLCBuYW1lKSAmJiBkYXRhW25hbWVdICE9IG51bGwpIHtcbiAgICByZXR1cm4gW10uY29uY2F0KGRhdGFbbmFtZV0pXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgdXNlZCBieSBDaG9pY2VGaWVsZFJlbmRlcmVyIHRoYXQgcmVwcmVzZW50cyBhIHNpbmdsZVxuICogPGlucHV0Pi5cbiAqL1xudmFyIENob2ljZUlucHV0ID0gU3ViV2lkZ2V0LmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBDaG9pY2VJbnB1dChuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZSwgaW5kZXgpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5hdHRycyA9IGF0dHJzXG4gICAgdGhpcy5jb250cm9sbGVkID0gY29udHJvbGxlZFxuICAgIHRoaXMuY2hvaWNlVmFsdWUgPSAnJytjaG9pY2VbMF1cbiAgICB0aGlzLmNob2ljZUxhYmVsID0gJycrY2hvaWNlWzFdXG4gICAgdGhpcy5pbmRleCA9IGluZGV4XG4gICAgaWYgKHR5cGVvZiB0aGlzLmF0dHJzLmlkICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmF0dHJzLmlkICs9ICdfJyArIHRoaXMuaW5kZXhcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzLmF0dHJzLmtleSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5hdHRycy5rZXkgKz0gJ18nICsgdGhpcy5pbmRleFxuICAgIH1cbiAgfVxuLCBpbnB1dFR5cGU6IG51bGwgLy8gU3ViY2xhc3NlcyBtdXN0IGRlZmluZSB0aGlzXG59KVxuXG4vKipcbiAqIFJlbmRlcnMgYSA8bGFiZWw+IGVuY2xvc2luZyB0aGUgd2lkZ2V0IGFuZCBpdHMgbGFiZWwgdGV4dC5cbiAqL1xuQ2hvaWNlSW5wdXQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbGFiZWxBdHRycyA9IHt9XG4gIGlmICh0aGlzLmlkRm9yTGFiZWwoKSkge1xuICAgIGxhYmVsQXR0cnMuaHRtbEZvciA9IHRoaXMuaWRGb3JMYWJlbCgpXG4gIH1cbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJywgbGFiZWxBdHRycywgdGhpcy50YWcoKSwgJyAnLCB0aGlzLmNob2ljZUxhYmVsKVxufVxuXG5DaG9pY2VJbnB1dC5wcm90b3R5cGUuaXNDaGVja2VkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnZhbHVlID09PSB0aGlzLmNob2ljZVZhbHVlXG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgPGlucHV0PiBwb3J0aW9uIG9mIHRoZSB3aWRnZXQuXG4gKi9cbkNob2ljZUlucHV0LnByb3RvdHlwZS50YWcgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZpbmFsQXR0cnMgPSBXaWRnZXQucHJvdG90eXBlLmJ1aWxkQXR0cnMuY2FsbCh0aGlzLCB7fSwge1xuICAgIHR5cGU6IHRoaXMuaW5wdXRUeXBlLCBuYW1lOiB0aGlzLm5hbWUsIHZhbHVlOiB0aGlzLmNob2ljZVZhbHVlXG4gIH0pXG4gIHZhciBjaGVja2VkQXR0ciA9ICh0aGlzLmNvbnRyb2xsZWQgPyAnY2hlY2tlZCcgOiAnZGVmYXVsdENoZWNrZWQnKVxuICBmaW5hbEF0dHJzW2NoZWNrZWRBdHRyXSA9IHRoaXMuaXNDaGVja2VkKClcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2lucHV0JywgZmluYWxBdHRycylcbn1cblxuQ2hvaWNlSW5wdXQucHJvdG90eXBlLmlkRm9yTGFiZWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG9iamVjdC5nZXQodGhpcy5hdHRycywgJ2lkJywgJycpXG59XG5cbnZhciBSYWRpb0Nob2ljZUlucHV0ID0gQ2hvaWNlSW5wdXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFJhZGlvQ2hvaWNlSW5wdXQobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2UsIGluZGV4KSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJhZGlvQ2hvaWNlSW5wdXQpKSB7XG4gICAgICByZXR1cm4gbmV3IFJhZGlvQ2hvaWNlSW5wdXQobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2UsIGluZGV4KVxuICAgIH1cbiAgICBDaG9pY2VJbnB1dC5jYWxsKHRoaXMsIG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlLCBpbmRleClcbiAgICB0aGlzLnZhbHVlID0gJycrdGhpcy52YWx1ZVxuICB9XG4sIGlucHV0VHlwZTogJ3JhZGlvJ1xufSlcblxudmFyIENoZWNrYm94Q2hvaWNlSW5wdXQgPSBDaG9pY2VJbnB1dC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2hlY2tib3hDaG9pY2VJbnB1dChuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZSwgaW5kZXgpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2hlY2tib3hDaG9pY2VJbnB1dCkpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hlY2tib3hDaG9pY2VJbnB1dChuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZSwgaW5kZXgpXG4gICAgfVxuICAgIGlmICghaXMuQXJyYXkodmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IFt2YWx1ZV1cbiAgICB9XG4gICAgQ2hvaWNlSW5wdXQuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZSwgaW5kZXgpXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnZhbHVlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdGhpcy52YWx1ZVtpXSA9ICcnK3RoaXMudmFsdWVbaV1cbiAgICB9XG4gIH1cbiwgaW5wdXRUeXBlOiAnY2hlY2tib3gnXG59KVxuXG5DaGVja2JveENob2ljZUlucHV0LnByb3RvdHlwZS5pc0NoZWNrZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMudmFsdWUuaW5kZXhPZih0aGlzLmNob2ljZVZhbHVlKSAhPT0gLTFcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgdXNlZCBieSBjaG9pY2UgU2VsZWN0cyB0byBlbmFibGUgY3VzdG9taXNhdGlvbiBvZiBjaG9pY2Ugd2lkZ2V0cy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGNvbnRyb2xsZWRcbiAqIEBwYXJhbSB7QXJyYXl9IGNob2ljZXNcbiAqL1xudmFyIENob2ljZUZpZWxkUmVuZGVyZXIgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIENob2ljZUZpZWxkUmVuZGVyZXIobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2VzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENob2ljZUZpZWxkUmVuZGVyZXIpKSB7XG4gICAgICByZXR1cm4gbmV3IENob2ljZUZpZWxkUmVuZGVyZXIobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2VzKVxuICAgIH1cbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5hdHRycyA9IGF0dHJzXG4gICAgdGhpcy5jb250cm9sbGVkID0gY29udHJvbGxlZFxuICAgIHRoaXMuY2hvaWNlcyA9IGNob2ljZXNcbiAgfVxuLCBjaG9pY2VJbnB1dENvbnN0cnVjdG9yOiBudWxsXG59KVxuXG5DaG9pY2VGaWVsZFJlbmRlcmVyLnByb3RvdHlwZS5jaG9pY2VJbnB1dHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlucHV0cyA9IFtdXG4gIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5jaG9pY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlucHV0cy5wdXNoKHRoaXMuY2hvaWNlSW5wdXRDb25zdHJ1Y3Rvcih0aGlzLm5hbWUsIHRoaXMudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5leHRlbmQoe30sIHRoaXMuYXR0cnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvaWNlc1tpXSwgaSkpXG4gIH1cbiAgcmV0dXJuIGlucHV0c1xufVxuXG5DaG9pY2VGaWVsZFJlbmRlcmVyLnByb3RvdHlwZS5jaG9pY2VJbnB1dCA9IGZ1bmN0aW9uKGkpIHtcbiAgaWYgKGkgPj0gdGhpcy5jaG9pY2VzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW5kZXggb3V0IG9mIGJvdW5kczogJyArIGkpXG4gIH1cbiAgcmV0dXJuIHRoaXMuY2hvaWNlSW5wdXRDb25zdHJ1Y3Rvcih0aGlzLm5hbWUsIHRoaXMudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmV4dGVuZCh7fSwgdGhpcy5hdHRycyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250cm9sbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvaWNlc1tpXSwgaSlcbiAgfVxuXG4vKipcbiAqIE91dHB1dHMgYSA8dWw+IGZvciB0aGlzIHNldCBvZiBjaG9pY2UgZmllbGRzLlxuICogSWYgYW4gaWQgd2FzIGdpdmVuIHRvIHRoZSBmaWVsZCwgaXQgaXMgYXBwbGllZCB0byB0aGUgPHVsPiAoZWFjaCBpdGVtIGluIHRoZVxuICogbGlzdCB3aWxsIGdldCBhbiBpZCBvZiBgJGlkXyRpYCkuXG4gKi9cbkNob2ljZUZpZWxkUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaWQgPSBvYmplY3QuZ2V0KHRoaXMuYXR0cnMsICdpZCcsIG51bGwpXG4gIHZhciBrZXkgPSBvYmplY3QucG9wKHRoaXMuYXR0cnMsICdrZXknLCBudWxsKVxuICB2YXIgaXRlbXMgPSBbXVxuICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuY2hvaWNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgY2hvaWNlID0gdGhpcy5jaG9pY2VzW2ldXG4gICAgdmFyIGNob2ljZVZhbHVlID0gY2hvaWNlWzBdXG4gICAgdmFyIGNob2ljZUxhYmVsID0gY2hvaWNlWzFdXG4gICAgaWYgKGlzLkFycmF5KGNob2ljZUxhYmVsKSkge1xuICAgICAgdmFyIGF0dHJzUGx1cyA9IG9iamVjdC5leHRlbmQoe30sIHRoaXMuYXR0cnMpXG4gICAgICBpZiAoaWQpIHtcbiAgICAgICAgYXR0cnNQbHVzLmlkICs9J18nICsgaVxuICAgICAgfVxuICAgICAgaWYgKGtleSkge1xuICAgICAgICBhdHRyc1BsdXMua2V5ICs9ICdfJyArIGlcbiAgICAgIH1cbiAgICAgIHZhciBzdWJSZW5kZXJlciA9IENob2ljZUZpZWxkUmVuZGVyZXIodGhpcy5uYW1lLCB0aGlzLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyc1BsdXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlTGFiZWwpXG4gICAgICBzdWJSZW5kZXJlci5jaG9pY2VJbnB1dENvbnN0cnVjdG9yID0gdGhpcy5jaG9pY2VJbnB1dENvbnN0cnVjdG9yXG4gICAgICBpdGVtcy5wdXNoKFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2xpJywgbnVsbCwgY2hvaWNlVmFsdWUsIHN1YlJlbmRlcmVyLnJlbmRlcigpKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgdyA9IHRoaXMuY2hvaWNlSW5wdXRDb25zdHJ1Y3Rvcih0aGlzLm5hbWUsIHRoaXMudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZXh0ZW5kKHt9LCB0aGlzLmF0dHJzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbGxlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNob2ljZSwgaSlcbiAgICAgIGl0ZW1zLnB1c2goUmVhY3QuY3JlYXRlRWxlbWVudCgnbGknLCBudWxsLCB3LnJlbmRlcigpKSlcbiAgICB9XG4gIH1cbiAgdmFyIGxpc3RBdHRycyA9IHt9XG4gIGlmIChpZCkge1xuICAgIGxpc3RBdHRycy5pZCA9IGlkXG4gIH1cbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3VsJywgbGlzdEF0dHJzLCBpdGVtcylcbn1cblxudmFyIFJhZGlvRmllbGRSZW5kZXJlciA9IENob2ljZUZpZWxkUmVuZGVyZXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFJhZGlvRmllbGRSZW5kZXJlcihuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZXMpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmFkaW9GaWVsZFJlbmRlcmVyKSkge1xuICAgICAgcmV0dXJuIG5ldyBSYWRpb0ZpZWxkUmVuZGVyZXIobmFtZSwgdmFsdWUsIGF0dHJzLCBjb250cm9sbGVkLCBjaG9pY2VzKVxuICAgIH1cbiAgICBDaG9pY2VGaWVsZFJlbmRlcmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxuLCBjaG9pY2VJbnB1dENvbnN0cnVjdG9yOiBSYWRpb0Nob2ljZUlucHV0XG59KVxuXG52YXIgQ2hlY2tib3hGaWVsZFJlbmRlcmVyID0gQ2hvaWNlRmllbGRSZW5kZXJlci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gQ2hlY2tib3hGaWVsZFJlbmRlcmVyKG5hbWUsIHZhbHVlLCBhdHRycywgY29udHJvbGxlZCwgY2hvaWNlcykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDaGVja2JveEZpZWxkUmVuZGVyZXIpKSB7XG4gICAgICByZXR1cm4gbmV3IENoZWNrYm94RmllbGRSZW5kZXJlcihuYW1lLCB2YWx1ZSwgYXR0cnMsIGNvbnRyb2xsZWQsIGNob2ljZXMpXG4gICAgfVxuICAgIENob2ljZUZpZWxkUmVuZGVyZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG4sIGNob2ljZUlucHV0Q29uc3RydWN0b3I6IENoZWNrYm94Q2hvaWNlSW5wdXRcbn0pXG5cbnZhciBSZW5kZXJlck1peGluID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBSZW5kZXJlck1peGluKGt3YXJncykge1xuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe3JlbmRlcmVyOiBudWxsfSwga3dhcmdzKVxuICAgIC8vIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHJlbmRlcmVyIGlmIHdlIHdlcmUgcGFzc2VkIG9uZVxuICAgIGlmIChrd2FyZ3MucmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIgPSBrd2FyZ3MucmVuZGVyZXJcbiAgICB9XG4gIH1cbiwgX2VtcHR5VmFsdWU6IG51bGxcbiwgdmFsaWRhdGlvbjoge29uQ2hhbmdlOiB0cnVlfVxufSlcblxuUmVuZGVyZXJNaXhpbi5wcm90b3R5cGUuc3ViV2lkZ2V0cyA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAgcmV0dXJuIHRoaXMuZ2V0UmVuZGVyZXIobmFtZSwgdmFsdWUsIGt3YXJncykuY2hvaWNlSW5wdXRzKClcbn1cblxuLyoqXG4gKiBAcmV0dXJuIGFuIGluc3RhbmNlIG9mIHRoZSByZW5kZXJlciB0byBiZSB1c2VkIHRvIHJlbmRlciB0aGlzIHdpZGdldC5cbiAqL1xuUmVuZGVyZXJNaXhpbi5wcm90b3R5cGUuZ2V0UmVuZGVyZXIgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe2Nob2ljZXM6IFtdLCBjb250cm9sbGVkOiBmYWxzZX0sIGt3YXJncylcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgdmFsdWUgPSB0aGlzLl9lbXB0eVZhbHVlXG4gIH1cbiAgdmFyIGZpbmFsQXR0cnMgPSB0aGlzLmJ1aWxkQXR0cnMoa3dhcmdzLmF0dHJzKVxuICB2YXIgY2hvaWNlcyA9IHRoaXMuY2hvaWNlcy5jb25jYXQoa3dhcmdzLmNob2ljZXMpXG4gIHJldHVybiBuZXcgdGhpcy5yZW5kZXJlcihuYW1lLCB2YWx1ZSwgZmluYWxBdHRycywga3dhcmdzLmNvbnRyb2xsZWQsIGNob2ljZXMpXG59XG5cblJlbmRlcmVyTWl4aW4ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBrd2FyZ3MpIHtcbiAgcmV0dXJuIHRoaXMuZ2V0UmVuZGVyZXIobmFtZSwgdmFsdWUsIGt3YXJncykucmVuZGVyKClcbn1cblxuLyoqXG4gKiBXaWRnZXRzIHVzaW5nIHRoaXMgUmVuZGVyZXJNaXhpbiBhcmUgbWFkZSBvZiBhIGNvbGxlY3Rpb24gb2Ygc3Vid2lkZ2V0cywgZWFjaFxuICogd2l0aCB0aGVpciBvd24gPGxhYmVsPiwgYW5kIGRpc3RpbmN0IElELlxuICogVGhlIElEcyBhcmUgbWFkZSBkaXN0aW5jdCBieSB5IFwiX1hcIiBzdWZmaXgsIHdoZXJlIFggaXMgdGhlIHplcm8tYmFzZWQgaW5kZXhcbiAqIG9mIHRoZSBjaG9pY2UgZmllbGQuIFRodXMsIHRoZSBsYWJlbCBmb3IgdGhlIG1haW4gd2lkZ2V0IHNob3VsZCByZWZlcmVuY2UgdGhlXG4gKiBmaXJzdCBzdWJ3aWRnZXQsIGhlbmNlIHRoZSBcIl8wXCIgc3VmZml4LlxuICovXG5SZW5kZXJlck1peGluLnByb3RvdHlwZS5pZEZvckxhYmVsID0gZnVuY3Rpb24oaWQpIHtcbiAgaWYgKGlkKSB7XG4gICAgaWQgKz0gJ18wJ1xuICB9XG4gIHJldHVybiBpZFxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBzaW5nbGUgc2VsZWN0IGFzIGEgbGlzdCBvZiA8aW5wdXQgdHlwZT1cInJhZGlvXCI+IGVsZW1lbnRzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7U2VsZWN0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFJhZGlvU2VsZWN0ID0gU2VsZWN0LmV4dGVuZCh7XG4gIF9fbWl4aW5zX186IFtSZW5kZXJlck1peGluXVxuLCBjb25zdHJ1Y3RvcjogZnVuY3Rpb24oa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJhZGlvU2VsZWN0KSkgeyByZXR1cm4gbmV3IFJhZGlvU2VsZWN0KGt3YXJncykgfVxuICAgIFJlbmRlcmVyTWl4aW4uY2FsbCh0aGlzLCBrd2FyZ3MpXG4gICAgU2VsZWN0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG4sIHJlbmRlcmVyOiBSYWRpb0ZpZWxkUmVuZGVyZXJcbiwgX2VtcHR5VmFsdWU6ICcnXG59KVxuXG4vKipcbiAqIE11bHRpcGxlIHNlbGVjdGlvbnMgcmVwcmVzZW50ZWQgYXMgYSBsaXN0IG9mIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4gd2lkZ2V0cy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge1NlbGVjdE11bHRpcGxlfVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIENoZWNrYm94U2VsZWN0TXVsdGlwbGUgPSBTZWxlY3RNdWx0aXBsZS5leHRlbmQoe1xuICBfX21peGluc19fOiBbUmVuZGVyZXJNaXhpbl1cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDaGVja2JveFNlbGVjdE11bHRpcGxlKSkgeyByZXR1cm4gbmV3IENoZWNrYm94U2VsZWN0TXVsdGlwbGUoa3dhcmdzKSB9XG4gICAgUmVuZGVyZXJNaXhpbi5jYWxsKHRoaXMsIGt3YXJncylcbiAgICBTZWxlY3RNdWx0aXBsZS5jYWxsKHRoaXMsIGt3YXJncylcbiAgfVxuLCByZW5kZXJlcjogQ2hlY2tib3hGaWVsZFJlbmRlcmVyXG4sIF9lbXB0eVZhbHVlOiBbXVxufSlcblxuLyoqXG4gKiBBIHdpZGdldCB0aGF0IGlzIGNvbXBvc2VkIG9mIG11bHRpcGxlIHdpZGdldHMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIHtXaWRnZXR9XG4gKiBAcGFyYW0ge09iamVjdD19IGt3YXJnc1xuICovXG52YXIgTXVsdGlXaWRnZXQgPSBXaWRnZXQuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIE11bHRpV2lkZ2V0KHdpZGdldHMsIGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXaWRnZXQpKSB7IHJldHVybiBuZXcgTXVsdGlXaWRnZXQod2lkZ2V0cywga3dhcmdzKSB9XG4gICAgdGhpcy53aWRnZXRzID0gW11cbiAgICB2YXIgbmVlZHNNdWx0aXBhcnRGb3JtID0gZmFsc2VcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHdpZGdldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgd2lkZ2V0ID0gd2lkZ2V0c1tpXSBpbnN0YW5jZW9mIFdpZGdldCA/IHdpZGdldHNbaV0gOiBuZXcgd2lkZ2V0c1tpXSgpXG4gICAgICBpZiAod2lkZ2V0Lm5lZWRzTXVsdGlwYXJ0Rm9ybSkge1xuICAgICAgICBuZWVkc011bHRpcGFydEZvcm0gPSB0cnVlXG4gICAgICB9XG4gICAgICB0aGlzLndpZGdldHMucHVzaCh3aWRnZXQpXG4gICAgfVxuICAgIHRoaXMubmVlZHNNdWx0aXBhcnRGb3JtID0gbmVlZHNNdWx0aXBhcnRGb3JtXG4gICAgV2lkZ2V0LmNhbGwodGhpcywga3dhcmdzKVxuICB9XG59KVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGlzIGRpZmZlcmVudCB0aGFuIG90aGVyIHdpZGdldHMnLCBiZWNhdXNlIGl0IGhhcyB0byBmaWd1cmUgb3V0XG4gKiBob3cgdG8gc3BsaXQgYSBzaW5nbGUgdmFsdWUgZm9yIGRpc3BsYXkgaW4gbXVsdGlwbGUgd2lkZ2V0cy5cbiAqXG4gKiBJZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgTk9UIGEgbGlzdCwgaXQgd2lsbCBmaXJzdCBiZSBcImRlY29tcHJlc3NlZFwiIGludG8gYSBsaXN0XG4gKiBiZWZvcmUgaXQgaXMgcmVuZGVyZWQgYnkgY2FsbGluZyB0aGUgIE11bHRpV2lkZ2V0I2RlY29tcHJlc3MgZnVuY3Rpb24uXG4gKlxuICogRWFjaCB2YWx1ZSBpbiB0aGUgbGlzdCBpcyByZW5kZXJlZCAgd2l0aCB0aGUgY29ycmVzcG9uZGluZyB3aWRnZXQgLS0gdGhlXG4gKiBmaXJzdCB2YWx1ZSBpcyByZW5kZXJlZCBpbiB0aGUgZmlyc3Qgd2lkZ2V0LCB0aGUgc2Vjb25kIHZhbHVlIGlzIHJlbmRlcmVkIGluXG4gKiB0aGUgc2Vjb25kIHdpZGdldCwgYW5kIHNvIG9uLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBmaWVsZCBuYW1lLlxuICogQHBhcmFtIHsoYXJyYXkuPCo+fCopfSB2YWx1ZSBhIGxpc3Qgb2YgdmFsdWVzLCBvciBhIG5vcm1hbCB2YWx1ZSAoZS5nLiwgYSBTdHJpbmcgdGhhdCBoYXNcbiAqICAgYmVlbiBcImNvbXByZXNzZWRcIiBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMpLlxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3MgcmVuZGVyaW5nIG9wdGlvbnMuXG4gKiBAcmV0dXJuIGEgcmVuZGVyZWQgY29sbGVjdGlvbiBvZiB3aWRnZXRzLlxuICovXG5NdWx0aVdpZGdldC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGt3YXJncykge1xuICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHt9LCBrd2FyZ3MpXG4gIGlmICghKGlzLkFycmF5KHZhbHVlKSkpIHtcbiAgICB2YWx1ZSA9IHRoaXMuZGVjb21wcmVzcyh2YWx1ZSlcbiAgfVxuICB2YXIgZmluYWxBdHRycyA9IHRoaXMuYnVpbGRBdHRycyhrd2FyZ3MuYXR0cnMsIHsnZGF0YS1uZXdmb3Jtcy1maWVsZCc6IG5hbWV9KVxuICB2YXIgaWQgPSBvYmplY3QuZ2V0KGZpbmFsQXR0cnMsICdpZCcsIG51bGwpXG4gIHZhciBrZXkgPSBvYmplY3QuZ2V0KGZpbmFsQXR0cnMsICdrZXknLCBudWxsKVxuICB2YXIgcmVuZGVyZWRXaWRnZXRzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLndpZGdldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIHdpZGdldCA9IHRoaXMud2lkZ2V0c1tpXVxuICAgIHZhciB3aWRnZXRWYWx1ZSA9IG51bGxcbiAgICBpZiAodHlwZW9mIHZhbHVlW2ldICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aWRnZXRWYWx1ZSA9IHZhbHVlW2ldXG4gICAgfVxuICAgIGlmIChpZCkge1xuICAgICAgZmluYWxBdHRycy5pZCA9IGlkICsgJ18nICsgaVxuICAgIH1cbiAgICBpZiAoa2V5KSB7XG4gICAgICBmaW5hbEF0dHJzLmtleSA9IGtleSArICdfJyArIGlcbiAgICB9XG4gICAgcmVuZGVyZWRXaWRnZXRzLnB1c2goXG4gICAgICAgIHdpZGdldC5yZW5kZXIobmFtZSArICdfJyArIGksIHdpZGdldFZhbHVlLCB7YXR0cnM6IGZpbmFsQXR0cnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlZDoga3dhcmdzLmNvbnRyb2xsZWR9KSlcbiAgfVxuICByZXR1cm4gdGhpcy5mb3JtYXRPdXRwdXQocmVuZGVyZWRXaWRnZXRzKVxufVxuXG5NdWx0aVdpZGdldC5wcm90b3R5cGUuaWRGb3JMYWJlbCA9IGZ1bmN0aW9uKGlkKSB7XG4gIGlmIChpZCkge1xuICAgIGlkICs9ICdfMCdcbiAgfVxuICByZXR1cm4gaWRcbn1cblxuTXVsdGlXaWRnZXQucHJvdG90eXBlLnZhbHVlRnJvbURhdGEgPSBmdW5jdGlvbihkYXRhLCBmaWxlcywgbmFtZSkge1xuICB2YXIgdmFsdWVzID0gW11cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLndpZGdldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFsdWVzW2ldID0gdGhpcy53aWRnZXRzW2ldLnZhbHVlRnJvbURhdGEoZGF0YSwgZmlsZXMsIG5hbWUgKyAnXycgKyBpKVxuICB9XG4gIHJldHVybiB2YWx1ZXNcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVsZW1lbnQgY29udGFpbmluZyBhIGdpdmVuIGxpc3Qgb2YgcmVuZGVyZWQgd2lkZ2V0cy5cbiAqXG4gKiBUaGlzIGhvb2sgYWxsb3dzIHlvdSB0byBmb3JtYXQgdGhlIEhUTUwgZGVzaWduIG9mIHRoZSB3aWRnZXRzLCBpZiBuZWVkZWQuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcmVuZGVyZWRXaWRnZXRzIGEgbGlzdCBvZiByZW5kZXJlZCB3aWRnZXRzLlxuICogQHJldHVybiBhIDxkaXY+IGNvbnRhaW5pbmcgdGhlIHJlbmRlcmVkIHdpZGdldHMuXG4gKi9cbk11bHRpV2lkZ2V0LnByb3RvdHlwZS5mb3JtYXRPdXRwdXQgPSBmdW5jdGlvbihyZW5kZXJlZFdpZGdldHMpIHtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIG51bGwsIHJlbmRlcmVkV2lkZ2V0cylcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbGlzdCBvZiBkZWNvbXByZXNzZWQgdmFsdWVzIGZvciB0aGUgZ2l2ZW4gY29tcHJlc3NlZCB2YWx1ZS5cbiAqIEBhYnN0cmFjdFxuICogQHBhcmFtIHZhbHVlIGEgY29tcHJlc3NlZCB2YWx1ZSwgd2hpY2ggY2FuIGJlIGFzc3VtZWQgdG8gYmUgdmFsaWQsIGJ1dCBub3RcbiAqICAgbmVjZXNzYXJpbHkgbm9uLWVtcHR5LlxuICogQHJldHVybiBhIGxpc3Qgb2YgZGVjb21wcmVzc2VkIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGNvbXByZXNzZWQgdmFsdWUuXG4gKi9cbk11bHRpV2lkZ2V0LnByb3RvdHlwZS5kZWNvbXByZXNzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdNdWx0aVdpZGdldCBzdWJjbGFzc2VzIG11c3QgaW1wbGVtZW50IGEgZGVjb21wcmVzcygpIG1ldGhvZC4nKVxufVxuXG4vKipcbiAqIFNwbGl0cyBEYXRlIGlucHV0IGludG8gdHdvIDxpbnB1dCB0eXBlPVwidGV4dFwiPiBlbGVtZW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMge011bHRpV2lkZ2V0fVxuICogQHBhcmFtIHtPYmplY3Q9fSBrd2FyZ3NcbiAqL1xudmFyIFNwbGl0RGF0ZVRpbWVXaWRnZXQgPSBNdWx0aVdpZGdldC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3BsaXREYXRlVGltZVdpZGdldChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFNwbGl0RGF0ZVRpbWVXaWRnZXQoa3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7ZGF0ZUZvcm1hdDogbnVsbCwgdGltZUZvcm1hdDogbnVsbH0sIGt3YXJncylcbiAgICB2YXIgd2lkZ2V0cyA9IFtcbiAgICAgIERhdGVJbnB1dCh7YXR0cnM6IGt3YXJncy5hdHRycywgZm9ybWF0OiBrd2FyZ3MuZGF0ZUZvcm1hdH0pXG4gICAgLCBUaW1lSW5wdXQoe2F0dHJzOiBrd2FyZ3MuYXR0cnMsIGZvcm1hdDoga3dhcmdzLnRpbWVGb3JtYXR9KVxuICAgIF1cbiAgICBNdWx0aVdpZGdldC5jYWxsKHRoaXMsIHdpZGdldHMsIGt3YXJncy5hdHRycylcbiAgfVxufSlcblxuU3BsaXREYXRlVGltZVdpZGdldC5wcm90b3R5cGUuZGVjb21wcmVzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSkge1xuICAgIHJldHVybiBbXG4gICAgICBuZXcgRGF0ZSh2YWx1ZS5nZXRGdWxsWWVhcigpLCB2YWx1ZS5nZXRNb250aCgpLCB2YWx1ZS5nZXREYXRlKCkpXG4gICAgLCBuZXcgRGF0ZSgxOTAwLCAwLCAxLCB2YWx1ZS5nZXRIb3VycygpLCB2YWx1ZS5nZXRNaW51dGVzKCksIHZhbHVlLmdldFNlY29uZHMoKSlcbiAgICBdXG4gIH1cbiAgcmV0dXJuIFtudWxsLCBudWxsXVxufVxuXG4vKipcbiAqIFNwbGl0cyBEYXRlIGlucHV0IGludG8gdHdvIDxpbnB1dCB0eXBlPVwiaGlkZGVuXCI+IGVsZW1lbnRzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyB7U3BsaXREYXRlVGltZVdpZGdldH1cbiAqIEBwYXJhbSB7T2JqZWN0PX0ga3dhcmdzXG4gKi9cbnZhciBTcGxpdEhpZGRlbkRhdGVUaW1lV2lkZ2V0ID0gU3BsaXREYXRlVGltZVdpZGdldC5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3BsaXRIaWRkZW5EYXRlVGltZVdpZGdldChrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV2lkZ2V0KSkgeyByZXR1cm4gbmV3IFNwbGl0SGlkZGVuRGF0ZVRpbWVXaWRnZXQoa3dhcmdzKSB9XG4gICAgU3BsaXREYXRlVGltZVdpZGdldC5jYWxsKHRoaXMsIGt3YXJncylcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMud2lkZ2V0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHRoaXMud2lkZ2V0c1tpXS5pbnB1dFR5cGUgPSAnaGlkZGVuJ1xuICAgICAgdGhpcy53aWRnZXRzW2ldLmlzSGlkZGVuID0gdHJ1ZVxuICAgIH1cbiAgfVxuLCBpc0hpZGRlbjogdHJ1ZVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN1YldpZGdldDogU3ViV2lkZ2V0XG4sIFdpZGdldDogV2lkZ2V0XG4sIElucHV0OiBJbnB1dFxuLCBUZXh0SW5wdXQ6IFRleHRJbnB1dFxuLCBOdW1iZXJJbnB1dDogTnVtYmVySW5wdXRcbiwgRW1haWxJbnB1dDogRW1haWxJbnB1dFxuLCBVUkxJbnB1dDogVVJMSW5wdXRcbiwgUGFzc3dvcmRJbnB1dDogUGFzc3dvcmRJbnB1dFxuLCBIaWRkZW5JbnB1dDogSGlkZGVuSW5wdXRcbiwgTXVsdGlwbGVIaWRkZW5JbnB1dDogTXVsdGlwbGVIaWRkZW5JbnB1dFxuLCBGaWxlSW5wdXQ6IEZpbGVJbnB1dFxuLCBGSUxFX0lOUFVUX0NPTlRSQURJQ1RJT046IEZJTEVfSU5QVVRfQ09OVFJBRElDVElPTlxuLCBDbGVhcmFibGVGaWxlSW5wdXQ6IENsZWFyYWJsZUZpbGVJbnB1dFxuLCBUZXh0YXJlYTogVGV4dGFyZWFcbiwgRGF0ZUlucHV0OiBEYXRlSW5wdXRcbiwgRGF0ZVRpbWVJbnB1dDogRGF0ZVRpbWVJbnB1dFxuLCBUaW1lSW5wdXQ6IFRpbWVJbnB1dFxuLCBDaGVja2JveElucHV0OiBDaGVja2JveElucHV0XG4sIFNlbGVjdDogU2VsZWN0XG4sIE51bGxCb29sZWFuU2VsZWN0OiBOdWxsQm9vbGVhblNlbGVjdFxuLCBTZWxlY3RNdWx0aXBsZTogU2VsZWN0TXVsdGlwbGVcbiwgQ2hvaWNlSW5wdXQ6IENob2ljZUlucHV0XG4sIFJhZGlvQ2hvaWNlSW5wdXQ6IFJhZGlvQ2hvaWNlSW5wdXRcbiwgQ2hlY2tib3hDaG9pY2VJbnB1dDogQ2hlY2tib3hDaG9pY2VJbnB1dFxuLCBDaG9pY2VGaWVsZFJlbmRlcmVyOiBDaG9pY2VGaWVsZFJlbmRlcmVyXG4sIFJlbmRlcmVyTWl4aW46IFJlbmRlcmVyTWl4aW5cbiwgUmFkaW9GaWVsZFJlbmRlcmVyOiBSYWRpb0ZpZWxkUmVuZGVyZXJcbiwgQ2hlY2tib3hGaWVsZFJlbmRlcmVyOiBDaGVja2JveEZpZWxkUmVuZGVyZXJcbiwgUmFkaW9TZWxlY3Q6IFJhZGlvU2VsZWN0XG4sIENoZWNrYm94U2VsZWN0TXVsdGlwbGU6IENoZWNrYm94U2VsZWN0TXVsdGlwbGVcbiwgTXVsdGlXaWRnZXQ6IE11bHRpV2lkZ2V0XG4sIFNwbGl0RGF0ZVRpbWVXaWRnZXQ6IFNwbGl0RGF0ZVRpbWVXaWRnZXRcbiwgU3BsaXRIaWRkZW5EYXRlVGltZVdpZGdldDogU3BsaXRIaWRkZW5EYXRlVGltZVdpZGdldFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuXG5mdW5jdGlvbiB0eXBlKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpXG59XG5cbmZ1bmN0aW9uIGluaGVyaXRzKGNoaWxkQ29uc3RydWN0b3IsIHBhcmVudENvbnN0cnVjdG9yKSB7XG4gIHZhciBGID0gZnVuY3Rpb24oKSB7fVxuICBGLnByb3RvdHlwZSA9IHBhcmVudENvbnN0cnVjdG9yLnByb3RvdHlwZVxuICBjaGlsZENvbnN0cnVjdG9yLnByb3RvdHlwZSA9IG5ldyBGKClcbiAgY2hpbGRDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjaGlsZENvbnN0cnVjdG9yXG4gIHJldHVybiBjaGlsZENvbnN0cnVjdG9yXG59XG5cbmZ1bmN0aW9uIGV4dGVuZChkZXN0LCBzcmMpIHtcbiAgZm9yICh2YXIgcHJvcCBpbiBzcmMpIHtcbiAgICBpZiAoaGFzT3duLmNhbGwoc3JjLCBwcm9wKSkge1xuICAgICAgZGVzdFtwcm9wXSA9IHNyY1twcm9wXVxuICAgIH1cbiAgfVxuICByZXR1cm4gZGVzdFxufVxuXG4vKipcbiAqIE1peGVzIGluIHByb3BlcnRpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXIuIElmIHRoZSBzb3VyY2Ugb2JqZWN0IGlzIGFcbiAqIEZ1bmN0aW9uLCBpdHMgcHJvdG90eXBlIGlzIG1peGVkIGluIGluc3RlYWQuXG4gKi9cbmZ1bmN0aW9uIG1peGluKGRlc3QsIHNyYykge1xuICBpZiAodHlwZShzcmMpID09ICdmdW5jdGlvbicpIHtcbiAgICBleHRlbmQoZGVzdCwgc3JjLnByb3RvdHlwZSlcbiAgfVxuICBlbHNlIHtcbiAgICBleHRlbmQoZGVzdCwgc3JjKVxuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBtaXhpbnMgc3BlY2lmaWVkIGFzIGEgX19taXhpbnNfXyBwcm9wZXJ0eSBvbiB0aGUgZ2l2ZW4gcHJvcGVydGllc1xuICogb2JqZWN0LCByZXR1cm5pbmcgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG1peGVkIGluIHByb3BlcnRpZXMuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5TWl4aW5zKHByb3BlcnRpZXMpIHtcbiAgdmFyIG1peGlucyA9IHByb3BlcnRpZXMuX19taXhpbnNfX1xuICBpZiAodHlwZShtaXhpbnMpICE9ICdhcnJheScpIHtcbiAgICBtaXhpbnMgPSBbbWl4aW5zXVxuICB9XG4gIHZhciBtaXhlZFByb3BlcnRpZXMgPSB7fVxuICBmb3IgKHZhciBpID0gMCwgbCA9IG1peGlucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBtaXhpbihtaXhlZFByb3BlcnRpZXMsIG1peGluc1tpXSlcbiAgfVxuICBkZWxldGUgcHJvcGVydGllcy5fX21peGluc19fXG4gIHJldHVybiBleHRlbmQobWl4ZWRQcm9wZXJ0aWVzLCBwcm9wZXJ0aWVzKVxufVxuXG4vKipcbiAqIEluaGVyaXRzIGFub3RoZXIgY29uc3RydWN0b3IncyBwcm90b3R5cGUgYW5kIHNldHMgaXRzIHByb3RvdHlwZSBhbmRcbiAqIGNvbnN0cnVjdG9yIHByb3BlcnRpZXMgaW4gb25lIGZlbGwgc3dvb3AuXG4gKlxuICogSWYgYSBjaGlsZCBjb25zdHJ1Y3RvciBpcyBub3QgcHJvdmlkZWQgdmlhIHByb3RvdHlwZVByb3BzLmNvbnN0cnVjdG9yLFxuICogYSBuZXcgY29uc3RydWN0b3Igd2lsbCBiZSBjcmVhdGVkLlxuICovXG5mdW5jdGlvbiBpbmhlcml0RnJvbShwYXJlbnRDb25zdHJ1Y3RvciwgY2hpbGRDb25zdHJ1Y3RvciwgcHJvdG90eXBlUHJvcHMsIGNvbnN0cnVjdG9yUHJvcHMpIHtcbiAgLy8gQ3JlYXRlIGEgY2hpbGQgY29uc3RydWN0b3IgaWYgb25lIHdhc24ndCBnaXZlblxuICBpZiAoY2hpbGRDb25zdHJ1Y3RvciA9PSBudWxsKSB7XG4gICAgY2hpbGRDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcGFyZW50Q29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxuXG4gIC8vIE1ha2Ugc3VyZSB0aGUgbmV3IHByb3RvdHlwZSBoYXMgdGhlIGNvcnJlY3QgY29uc3RydWN0b3Igc2V0IHVwXG4gIHByb3RvdHlwZVByb3BzLmNvbnN0cnVjdG9yID0gY2hpbGRDb25zdHJ1Y3RvclxuXG4gIC8vIEJhc2UgY29uc3RydWN0b3JzIHNob3VsZCBvbmx5IGhhdmUgdGhlIHByb3BlcnRpZXMgdGhleSdyZSBkZWZpbmVkIHdpdGhcbiAgaWYgKHBhcmVudENvbnN0cnVjdG9yICE9PSBDb25jdXIpIHtcbiAgICAvLyBJbmhlcml0IHRoZSBwYXJlbnQncyBwcm90b3R5cGVcbiAgICBpbmhlcml0cyhjaGlsZENvbnN0cnVjdG9yLCBwYXJlbnRDb25zdHJ1Y3RvcilcbiAgICBjaGlsZENvbnN0cnVjdG9yLl9fc3VwZXJfXyA9IHBhcmVudENvbnN0cnVjdG9yLnByb3RvdHlwZVxuICB9XG5cbiAgLy8gQWRkIHByb3RvdHlwZSBwcm9wZXJ0aWVzIC0gdGhpcyBpcyB3aHkgd2UgdG9vayBhIGNvcHkgb2YgdGhlIGNoaWxkXG4gIC8vIGNvbnN0cnVjdG9yIHJlZmVyZW5jZSBpbiBleHRlbmQoKSAtIGlmIGEgLmNvbnN0cnVjdG9yIGhhZCBiZWVuIHBhc3NlZCBhcyBhXG4gIC8vIF9fbWl4aW5zX18gYW5kIG92ZXJpdHRlbiBwcm90b3R5cGVQcm9wcy5jb25zdHJ1Y3RvciwgdGhlc2UgcHJvcGVydGllcyB3b3VsZFxuICAvLyBiZSBnZXR0aW5nIHNldCBvbiB0aGUgbWl4ZWQtaW4gY29uc3RydWN0b3IncyBwcm90b3R5cGUuXG4gIGV4dGVuZChjaGlsZENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG90eXBlUHJvcHMpXG5cbiAgLy8gQWRkIGNvbnN0cnVjdG9yIHByb3BlcnRpZXNcbiAgZXh0ZW5kKGNoaWxkQ29uc3RydWN0b3IsIGNvbnN0cnVjdG9yUHJvcHMpXG5cbiAgcmV0dXJuIGNoaWxkQ29uc3RydWN0b3Jcbn1cblxuLyoqXG4gKiBOYW1lc3BhY2UgYW5kIGR1bW15IGNvbnN0cnVjdG9yIGZvciBpbml0aWFsIGV4dGVuc2lvbi5cbiAqL1xudmFyIENvbmN1ciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7fVxuXG4vKipcbiAqIERldGFpbHMgb2YgYSBjb25zdHJ1Y3RvcidzIGluaGVyaXRhbmNlIGNoYWluIC0gQ29uY3VyIGp1c3QgZmFjaWxpdGF0ZXMgc3VnYXJcbiAqIHNvIHdlIGRvbid0IGluY2x1ZGUgaXQgaW4gdGhlIGluaXRpYWwgY2hhaW4uIEFyZ3VhYmx5LCBPYmplY3QucHJvdG90eXBlIGNvdWxkXG4gKiBnbyBoZXJlLCBidXQgaXQncyBqdXN0IG5vdCB0aGF0IGludGVyZXN0aW5nLlxuICovXG5Db25jdXIuX19tcm9fXyA9IFtdXG5cbi8qKlxuICogQ3JlYXRlcyBvciB1c2VzIGEgY2hpbGQgY29uc3RydWN0b3IgdG8gaW5oZXJpdCBmcm9tIHRoZSB0aGUgY2FsbFxuICogY29udGV4dCwgd2hpY2ggaXMgZXhwZWN0ZWQgdG8gYmUgYSBjb25zdHJ1Y3Rvci5cbiAqL1xuQ29uY3VyLmV4dGVuZCA9IGZ1bmN0aW9uKHByb3RvdHlwZVByb3BzLCBjb25zdHJ1Y3RvclByb3BzKSB7XG4gIC8vIEVuc3VyZSB3ZSBoYXZlIHByb3Agb2JqZWN0cyB0byB3b3JrIHdpdGhcbiAgcHJvdG90eXBlUHJvcHMgPSBwcm90b3R5cGVQcm9wcyB8fCB7fVxuICBjb25zdHJ1Y3RvclByb3BzID0gY29uc3RydWN0b3JQcm9wcyB8fCB7fVxuXG4gIC8vIElmIHRoZSBjb25zdHJ1Y3RvciBiZWluZyBpbmhlcml0ZWQgZnJvbSBoYXMgYSBfX21ldGFfXyBmdW5jdGlvbiBzb21ld2hlcmVcbiAgLy8gaW4gaXRzIHByb3RvdHlwZSBjaGFpbiwgY2FsbCBpdCB0byBjdXN0b21pc2UgcHJvdG90eXBlIGFuZCBjb25zdHJ1Y3RvclxuICAvLyBwcm9wZXJ0aWVzIGJlZm9yZSB0aGV5J3JlIHVzZWQgdG8gc2V0IHVwIHRoZSBuZXcgY29uc3RydWN0b3IncyBwcm90b3R5cGUuXG4gIGlmICh0eXBlb2YgdGhpcy5wcm90b3R5cGUuX19tZXRhX18gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLnByb3RvdHlwZS5fX21ldGFfXyhwcm90b3R5cGVQcm9wcywgY29uc3RydWN0b3JQcm9wcylcbiAgfVxuXG4gIC8vIEFueSBjaGlsZCBjb25zdHJ1Y3RvciBwYXNzZWQgaW4gc2hvdWxkIHRha2UgcHJlY2VkZW5jZSAtIGdyYWIgYSByZWZlcmVuY2VcbiAgLy8gdG8gaXQgYmVmb2VyIHdlIGFwcGx5IGFueSBtaXhpbnMuXG4gIHZhciBjaGlsZENvbnN0cnVjdG9yID0gKGhhc093bi5jYWxsKHByb3RvdHlwZVByb3BzLCAnY29uc3RydWN0b3InKVxuICAgICAgICAgICAgICAgICAgICAgICAgICA/IHByb3RvdHlwZVByb3BzLmNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbClcblxuICAvLyBJZiBhbnkgbWl4aW5zIGFyZSBzcGVjaWZpZWQsIG1peCB0aGVtIGludG8gdGhlIHByb3BlcnR5IG9iamVjdHNcbiAgaWYgKGhhc093bi5jYWxsKHByb3RvdHlwZVByb3BzLCAnX19taXhpbnNfXycpKSB7XG4gICAgcHJvdG90eXBlUHJvcHMgPSBhcHBseU1peGlucyhwcm90b3R5cGVQcm9wcylcbiAgfVxuICBpZiAoaGFzT3duLmNhbGwoY29uc3RydWN0b3JQcm9wcywgJ19fbWl4aW5zX18nKSkge1xuICAgIGNvbnN0cnVjdG9yUHJvcHMgPSBhcHBseU1peGlucyhjb25zdHJ1Y3RvclByb3BzKVxuICB9XG5cbiAgLy8gU2V0IHVwIHRoZSBuZXcgY2hpbGQgY29uc3RydWN0b3IgYW5kIGl0cyBwcm90b3R5cGVcbiAgY2hpbGRDb25zdHJ1Y3RvciA9IGluaGVyaXRGcm9tKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvbnN0cnVjdG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG90eXBlUHJvcHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvclByb3BzKVxuXG4gIC8vIFBhc3Mgb24gdGhlIGV4dGVuZCBmdW5jdGlvbiBmb3IgZXh0ZW5zaW9uIGluIHR1cm5cbiAgY2hpbGRDb25zdHJ1Y3Rvci5leHRlbmQgPSB0aGlzLmV4dGVuZFxuXG4gIC8vIEV4cG9zZSB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gZm9yIHByb2dyYW1tYXRpYyBhY2Nlc3NcbiAgY2hpbGRDb25zdHJ1Y3Rvci5fX21yb19fID0gW2NoaWxkQ29uc3RydWN0b3JdLmNvbmNhdCh0aGlzLl9fbXJvX18pXG5cbiAgcmV0dXJuIGNoaWxkQ29uc3RydWN0b3Jcbn1cbiIsIi8qISBodHRwOi8vbXRocy5iZS9wdW55Y29kZSB2MS4yLjQgYnkgQG1hdGhpYXMgKi9cbjsoZnVuY3Rpb24ocm9vdCkge1xuXG5cdC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZXMgKi9cblx0dmFyIGZyZWVFeHBvcnRzID0gdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgJiYgZXhwb3J0cztcblx0dmFyIGZyZWVNb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJlxuXHRcdG1vZHVsZS5leHBvcnRzID09IGZyZWVFeHBvcnRzICYmIG1vZHVsZTtcblx0dmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbDtcblx0aWYgKGZyZWVHbG9iYWwuZ2xvYmFsID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWwud2luZG93ID09PSBmcmVlR2xvYmFsKSB7XG5cdFx0cm9vdCA9IGZyZWVHbG9iYWw7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGBwdW55Y29kZWAgb2JqZWN0LlxuXHQgKiBAbmFtZSBwdW55Y29kZVxuXHQgKiBAdHlwZSBPYmplY3Rcblx0ICovXG5cdHZhciBwdW55Y29kZSxcblxuXHQvKiogSGlnaGVzdCBwb3NpdGl2ZSBzaWduZWQgMzItYml0IGZsb2F0IHZhbHVlICovXG5cdG1heEludCA9IDIxNDc0ODM2NDcsIC8vIGFrYS4gMHg3RkZGRkZGRiBvciAyXjMxLTFcblxuXHQvKiogQm9vdHN0cmluZyBwYXJhbWV0ZXJzICovXG5cdGJhc2UgPSAzNixcblx0dE1pbiA9IDEsXG5cdHRNYXggPSAyNixcblx0c2tldyA9IDM4LFxuXHRkYW1wID0gNzAwLFxuXHRpbml0aWFsQmlhcyA9IDcyLFxuXHRpbml0aWFsTiA9IDEyOCwgLy8gMHg4MFxuXHRkZWxpbWl0ZXIgPSAnLScsIC8vICdcXHgyRCdcblxuXHQvKiogUmVndWxhciBleHByZXNzaW9ucyAqL1xuXHRyZWdleFB1bnljb2RlID0gL154bi0tLyxcblx0cmVnZXhOb25BU0NJSSA9IC9bXiAtfl0vLCAvLyB1bnByaW50YWJsZSBBU0NJSSBjaGFycyArIG5vbi1BU0NJSSBjaGFyc1xuXHRyZWdleFNlcGFyYXRvcnMgPSAvXFx4MkV8XFx1MzAwMnxcXHVGRjBFfFxcdUZGNjEvZywgLy8gUkZDIDM0OTAgc2VwYXJhdG9yc1xuXG5cdC8qKiBFcnJvciBtZXNzYWdlcyAqL1xuXHRlcnJvcnMgPSB7XG5cdFx0J292ZXJmbG93JzogJ092ZXJmbG93OiBpbnB1dCBuZWVkcyB3aWRlciBpbnRlZ2VycyB0byBwcm9jZXNzJyxcblx0XHQnbm90LWJhc2ljJzogJ0lsbGVnYWwgaW5wdXQgPj0gMHg4MCAobm90IGEgYmFzaWMgY29kZSBwb2ludCknLFxuXHRcdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG5cdH0sXG5cblx0LyoqIENvbnZlbmllbmNlIHNob3J0Y3V0cyAqL1xuXHRiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW4sXG5cdGZsb29yID0gTWF0aC5mbG9vcixcblx0c3RyaW5nRnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcblxuXHQvKiogVGVtcG9yYXJ5IHZhcmlhYmxlICovXG5cdGtleTtcblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGVycm9yIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBlcnJvciB0eXBlLlxuXHQgKiBAcmV0dXJucyB7RXJyb3J9IFRocm93cyBhIGBSYW5nZUVycm9yYCB3aXRoIHRoZSBhcHBsaWNhYmxlIGVycm9yIG1lc3NhZ2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvcih0eXBlKSB7XG5cdFx0dGhyb3cgUmFuZ2VFcnJvcihlcnJvcnNbdHlwZV0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJpYyBgQXJyYXkjbWFwYCB1dGlsaXR5IGZ1bmN0aW9uLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnkgYXJyYXlcblx0ICogaXRlbS5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBhcnJheSBvZiB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwKGFycmF5LCBmbikge1xuXHRcdHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cdFx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0XHRhcnJheVtsZW5ndGhdID0gZm4oYXJyYXlbbGVuZ3RoXSk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJheTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIHNpbXBsZSBgQXJyYXkjbWFwYC1saWtlIHdyYXBwZXIgdG8gd29yayB3aXRoIGRvbWFpbiBuYW1lIHN0cmluZ3MuXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnlcblx0ICogY2hhcmFjdGVyLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IHN0cmluZyBvZiBjaGFyYWN0ZXJzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFja1xuXHQgKiBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcERvbWFpbihzdHJpbmcsIGZuKSB7XG5cdFx0cmV0dXJuIG1hcChzdHJpbmcuc3BsaXQocmVnZXhTZXBhcmF0b3JzKSwgZm4pLmpvaW4oJy4nKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIG51bWVyaWMgY29kZSBwb2ludHMgb2YgZWFjaCBVbmljb2RlXG5cdCAqIGNoYXJhY3RlciBpbiB0aGUgc3RyaW5nLiBXaGlsZSBKYXZhU2NyaXB0IHVzZXMgVUNTLTIgaW50ZXJuYWxseSxcblx0ICogdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnZlcnQgYSBwYWlyIG9mIHN1cnJvZ2F0ZSBoYWx2ZXMgKGVhY2ggb2Ygd2hpY2hcblx0ICogVUNTLTIgZXhwb3NlcyBhcyBzZXBhcmF0ZSBjaGFyYWN0ZXJzKSBpbnRvIGEgc2luZ2xlIGNvZGUgcG9pbnQsXG5cdCAqIG1hdGNoaW5nIFVURi0xNi5cblx0ICogQHNlZSBgcHVueWNvZGUudWNzMi5lbmNvZGVgXG5cdCAqIEBzZWUgPGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGRlY29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgY291bnRlciA9IDAsXG5cdFx0ICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG5cdFx0ICAgIHZhbHVlLFxuXHRcdCAgICBleHRyYTtcblx0XHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0dmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKHZhbHVlID49IDB4RDgwMCAmJiB2YWx1ZSA8PSAweERCRkYgJiYgY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0XHQvLyBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXJcblx0XHRcdFx0ZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0XHRpZiAoKGV4dHJhICYgMHhGQzAwKSA9PSAweERDMDApIHsgLy8gbG93IHN1cnJvZ2F0ZVxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlIG5leHRcblx0XHRcdFx0XHQvLyBjb2RlIHVuaXQgaXMgdGhlIGhpZ2ggc3Vycm9nYXRlIG9mIGEgc3Vycm9nYXRlIHBhaXJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0Y291bnRlci0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIHN0cmluZyBiYXNlZCBvbiBhbiBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZW5jb2RlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuZXcgVW5pY29kZSBzdHJpbmcgKFVDUy0yKS5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJlbmNvZGUoYXJyYXkpIHtcblx0XHRyZXR1cm4gbWFwKGFycmF5LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0dmFyIG91dHB1dCA9ICcnO1xuXHRcdFx0aWYgKHZhbHVlID4gMHhGRkZGKSB7XG5cdFx0XHRcdHZhbHVlIC09IDB4MTAwMDA7XG5cdFx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApO1xuXHRcdFx0XHR2YWx1ZSA9IDB4REMwMCB8IHZhbHVlICYgMHgzRkY7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlKTtcblx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0fSkuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBiYXNpYyBjb2RlIHBvaW50IGludG8gYSBkaWdpdC9pbnRlZ2VyLlxuXHQgKiBAc2VlIGBkaWdpdFRvQmFzaWMoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVQb2ludCBUaGUgYmFzaWMgbnVtZXJpYyBjb2RlIHBvaW50IHZhbHVlLlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQgKGZvciB1c2UgaW5cblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuXHQgKiB0aGUgY29kZSBwb2ludCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGJhc2ljVG9EaWdpdChjb2RlUG9pbnQpIHtcblx0XHRpZiAoY29kZVBvaW50IC0gNDggPCAxMCkge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDIyO1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gNjUgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDY1O1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gOTcgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDk3O1xuXHRcdH1cblx0XHRyZXR1cm4gYmFzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGRpZ2l0L2ludGVnZXIgaW50byBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gZGlnaXQgVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGlzIGBkaWdpdGAsIHdoaWNoIG5lZWRzIHRvIGJlIGluIHRoZSByYW5nZVxuXHQgKiBgMGAgdG8gYGJhc2UgLSAxYC4gSWYgYGZsYWdgIGlzIG5vbi16ZXJvLCB0aGUgdXBwZXJjYXNlIGZvcm0gaXNcblx0ICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcblx0ICogaWYgYGZsYWdgIGlzIG5vbi16ZXJvIGFuZCBgZGlnaXRgIGhhcyBubyB1cHBlcmNhc2UgZm9ybS5cblx0ICovXG5cdGZ1bmN0aW9uIGRpZ2l0VG9CYXNpYyhkaWdpdCwgZmxhZykge1xuXHRcdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdFx0Ly8gMjYuLjM1IG1hcCB0byBBU0NJSSAwLi45XG5cdFx0cmV0dXJuIGRpZ2l0ICsgMjIgKyA3NSAqIChkaWdpdCA8IDI2KSAtICgoZmxhZyAhPSAwKSA8PCA1KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuXHQgKiBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDkyI3NlY3Rpb24tMy40XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGFwdChkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0XHR2YXIgayA9IDA7XG5cdFx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0XHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdFx0Zm9yICgvKiBubyBpbml0aWFsaXphdGlvbiAqLzsgZGVsdGEgPiBiYXNlTWludXNUTWluICogdE1heCA+PiAxOyBrICs9IGJhc2UpIHtcblx0XHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZsb29yKGsgKyAoYmFzZU1pbnVzVE1pbiArIDEpICogZGVsdGEgLyAoZGVsdGEgKyBza2V3KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVjb2RlKGlucHV0KSB7XG5cdFx0Ly8gRG9uJ3QgdXNlIFVDUy0yXG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aCxcblx0XHQgICAgb3V0LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgbiA9IGluaXRpYWxOLFxuXHRcdCAgICBiaWFzID0gaW5pdGlhbEJpYXMsXG5cdFx0ICAgIGJhc2ljLFxuXHRcdCAgICBqLFxuXHRcdCAgICBpbmRleCxcblx0XHQgICAgb2xkaSxcblx0XHQgICAgdyxcblx0XHQgICAgayxcblx0XHQgICAgZGlnaXQsXG5cdFx0ICAgIHQsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBiYXNlTWludXNUO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50czogbGV0IGBiYXNpY2AgYmUgdGhlIG51bWJlciBvZiBpbnB1dCBjb2RlXG5cdFx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0XHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRcdGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0XHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0XHRiYXNpYyA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGJhc2ljOyArK2opIHtcblx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0XHRlcnJvcignbm90LWJhc2ljJyk7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdFx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRcdGZvciAoaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHRcdC8vIERlY29kZSBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyIGludG8gYGRlbHRhYCxcblx0XHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdFx0Ly8gdmFsdWUgYXQgdGhlIGVuZCB0byBvYnRhaW4gYGRlbHRhYC5cblx0XHRcdGZvciAob2xkaSA9IGksIHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0ID49IGJhc2UgfHwgZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0XHR9XG5cblx0XHRcdG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHRcdC8vIGBpYCB3YXMgc3VwcG9zZWQgdG8gd3JhcCBhcm91bmQgZnJvbSBgb3V0YCB0byBgMGAsXG5cdFx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRcdGkgJT0gb3V0O1xuXG5cdFx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0XG5cdFx0XHRvdXRwdXQuc3BsaWNlKGkrKywgMCwgbik7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdWNzMmVuY29kZShvdXRwdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyB0byBhIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5XG5cdCAqIHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuY29kZShpbnB1dCkge1xuXHRcdHZhciBuLFxuXHRcdCAgICBkZWx0YSxcblx0XHQgICAgaGFuZGxlZENQQ291bnQsXG5cdFx0ICAgIGJhc2ljTGVuZ3RoLFxuXHRcdCAgICBiaWFzLFxuXHRcdCAgICBqLFxuXHRcdCAgICBtLFxuXHRcdCAgICBxLFxuXHRcdCAgICBrLFxuXHRcdCAgICB0LFxuXHRcdCAgICBjdXJyZW50VmFsdWUsXG5cdFx0ICAgIG91dHB1dCA9IFtdLFxuXHRcdCAgICAvKiogYGlucHV0TGVuZ3RoYCB3aWxsIGhvbGQgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyBpbiBgaW5wdXRgLiAqL1xuXHRcdCAgICBpbnB1dExlbmd0aCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50UGx1c09uZSxcblx0XHQgICAgYmFzZU1pbnVzVCxcblx0XHQgICAgcU1pbnVzVDtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIFVuaWNvZGVcblx0XHRpbnB1dCA9IHVjczJkZWNvZGUoaW5wdXQpO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIGxlbmd0aFxuXHRcdGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGVcblx0XHRuID0gaW5pdGlhbE47XG5cdFx0ZGVsdGEgPSAwO1xuXHRcdGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHNcblx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aCA9IG91dHB1dC5sZW5ndGg7XG5cblx0XHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0XHQvLyBgYmFzaWNMZW5ndGhgIGlzIHRoZSBudW1iZXIgb2YgYmFzaWMgY29kZSBwb2ludHMuXG5cblx0XHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyAtIGlmIGl0IGlzIG5vdCBlbXB0eSAtIHdpdGggYSBkZWxpbWl0ZXJcblx0XHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHRcdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHRcdC8vIEFsbCBub24tYmFzaWMgY29kZSBwb2ludHMgPCBuIGhhdmUgYmVlbiBoYW5kbGVkIGFscmVhZHkuIEZpbmQgdGhlIG5leHRcblx0XHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0XHRmb3IgKG0gPSBtYXhJbnQsIGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0XHRtID0gY3VycmVudFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluY3JlYXNlIGBkZWx0YWAgZW5vdWdoIHRvIGFkdmFuY2UgdGhlIGRlY29kZXIncyA8bixpPiBzdGF0ZSB0byA8bSwwPixcblx0XHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93XG5cdFx0XHRoYW5kbGVkQ1BDb3VudFBsdXNPbmUgPSBoYW5kbGVkQ1BDb3VudCArIDE7XG5cdFx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRcdG4gPSBtO1xuXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID09IG4pIHtcblx0XHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlclxuXHRcdFx0XHRcdGZvciAocSA9IGRlbHRhLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXHRcdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goXG5cdFx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRxID0gZmxvb3IocU1pbnVzVCAvIGJhc2VNaW51c1QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0XHRiaWFzID0gYWRhcHQoZGVsdGEsIGhhbmRsZWRDUENvdW50UGx1c09uZSwgaGFuZGxlZENQQ291bnQgPT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0XHQrK2hhbmRsZWRDUENvdW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCsrZGVsdGE7XG5cdFx0XHQrK247XG5cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dC5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSB0byBVbmljb2RlLiBPbmx5IHRoZVxuXHQgKiBQdW55Y29kZWQgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLCBpLmUuIGl0IGRvZXNuJ3Rcblx0ICogbWF0dGVyIGlmIHlvdSBjYWxsIGl0IG9uIGEgc3RyaW5nIHRoYXQgaGFzIGFscmVhZHkgYmVlbiBjb252ZXJ0ZWQgdG9cblx0ICogVW5pY29kZS5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIFB1bnljb2RlIGRvbWFpbiBuYW1lIHRvIGNvbnZlcnQgdG8gVW5pY29kZS5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFVuaWNvZGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIFB1bnljb2RlXG5cdCAqIHN0cmluZy5cblx0ICovXG5cdGZ1bmN0aW9uIHRvVW5pY29kZShkb21haW4pIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGRvbWFpbiwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhQdW55Y29kZS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyBkZWNvZGUoc3RyaW5nLnNsaWNlKDQpLnRvTG93ZXJDYXNlKCkpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgVW5pY29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgdG8gUHVueWNvZGUuIE9ubHkgdGhlXG5cdCAqIG5vbi1BU0NJSSBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS4gaXQgZG9lc24ndFxuXHQgKiBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0J3MgYWxyZWFkeSBpbiBBU0NJSS5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lIHRvIGNvbnZlcnQsIGFzIGEgVW5pY29kZSBzdHJpbmcuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBQdW55Y29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZG9tYWluIG5hbWUuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b0FTQ0lJKGRvbWFpbikge1xuXHRcdHJldHVybiBtYXBEb21haW4oZG9tYWluLCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleE5vbkFTQ0lJLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/ICd4bi0tJyArIGVuY29kZShzdHJpbmcpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqIERlZmluZSB0aGUgcHVibGljIEFQSSAqL1xuXHRwdW55Y29kZSA9IHtcblx0XHQvKipcblx0XHQgKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgUHVueWNvZGUuanMgdmVyc2lvbiBudW1iZXIuXG5cdFx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdFx0ICogQHR5cGUgU3RyaW5nXG5cdFx0ICovXG5cdFx0J3ZlcnNpb24nOiAnMS4yLjQnLFxuXHRcdC8qKlxuXHRcdCAqIEFuIG9iamVjdCBvZiBtZXRob2RzIHRvIGNvbnZlcnQgZnJvbSBKYXZhU2NyaXB0J3MgaW50ZXJuYWwgY2hhcmFjdGVyXG5cdFx0ICogcmVwcmVzZW50YXRpb24gKFVDUy0yKSB0byBVbmljb2RlIGNvZGUgcG9pbnRzLCBhbmQgYmFjay5cblx0XHQgKiBAc2VlIDxodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIE9iamVjdFxuXHRcdCAqL1xuXHRcdCd1Y3MyJzoge1xuXHRcdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0XHQnZW5jb2RlJzogdWNzMmVuY29kZVxuXHRcdH0sXG5cdFx0J2RlY29kZSc6IGRlY29kZSxcblx0XHQnZW5jb2RlJzogZW5jb2RlLFxuXHRcdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0XHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG5cdH07XG5cblx0LyoqIEV4cG9zZSBgcHVueWNvZGVgICovXG5cdC8vIFNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJuc1xuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XG5cdGlmIChcblx0XHR0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiZcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxuXHRcdGRlZmluZS5hbWRcblx0KSB7XG5cdFx0ZGVmaW5lKCdwdW55Y29kZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHB1bnljb2RlO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmICFmcmVlRXhwb3J0cy5ub2RlVHlwZSkge1xuXHRcdGlmIChmcmVlTW9kdWxlKSB7IC8vIGluIE5vZGUuanMgb3IgUmluZ29KUyB2MC44LjArXG5cdFx0XHRmcmVlTW9kdWxlLmV4cG9ydHMgPSBwdW55Y29kZTtcblx0XHR9IGVsc2UgeyAvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuXHRcdFx0Zm9yIChrZXkgaW4gcHVueWNvZGUpIHtcblx0XHRcdFx0cHVueWNvZGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAoZnJlZUV4cG9ydHNba2V5XSA9IHB1bnljb2RlW2tleV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHsgLy8gaW4gUmhpbm8gb3IgYSB3ZWIgYnJvd3NlclxuXHRcdHJvb3QucHVueWNvZGUgPSBwdW55Y29kZTtcblx0fVxuXG59KHRoaXMpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbnZhciB0eXBlID0gZnVuY3Rpb24ob2JqKSB7IHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCkgfVxuXG52YXIgcHJpbWl0aXZlV3JhcHBlclR5cGVzID0ge1xuICBib29sZWFuOiB0cnVlXG4sIG51bWJlcjogdHJ1ZVxuLCBzdHJpbmc6IHRydWVcbn1cblxudmFyIHN0cmluZ1Byb3BzUkUgPSAvXig/OlxcZCt8bGVuZ3RoKSQvXG5cbi8qIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIE9XTCBKYXZhU2NyaXB0IFV0aWxpdGllcy5cblxuT1dMIEphdmFTY3JpcHQgVXRpbGl0aWVzIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vclxubW9kaWZ5IGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hcyBwdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZlxudGhlIExpY2Vuc2UsIG9yIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cbk9XTCBKYXZhU2NyaXB0IFV0aWxpdGllcyBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljXG5MaWNlbnNlIGFsb25nIHdpdGggT1dMIEphdmFTY3JpcHQgVXRpbGl0aWVzLiAgSWYgbm90LCBzZWVcbjxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbi8vIFJlLXVzYWJsZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiB1c2VkIGJ5IGNsb25lKClcbmZ1bmN0aW9uIENsb25lKCkge31cblxuLy8gQ2xvbmUgb2JqZWN0cywgc2tpcCBvdGhlciB0eXBlc1xuZnVuY3Rpb24gY2xvbmUodGFyZ2V0KSB7XG4gIGlmICh0eXBlb2YgdGFyZ2V0ID09ICdvYmplY3QnKSB7XG4gICAgQ2xvbmUucHJvdG90eXBlID0gdGFyZ2V0XG4gICAgcmV0dXJuIG5ldyBDbG9uZSgpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHRhcmdldFxuICB9XG59XG5cbi8vIFNoYWxsb3cgQ29weVxuZnVuY3Rpb24gY29weSh0YXJnZXQpIHtcbiAgdmFyIGMsIHByb3BlcnR5XG4gIGlmICh0eXBlb2YgdGFyZ2V0ICE9ICdvYmplY3QnKSB7XG4gICAgLy8gTm9uLW9iamVjdHMgaGF2ZSB2YWx1ZSBzZW1hbnRpY3MsIHNvIHRhcmdldCBpcyBhbHJlYWR5IGEgY29weVxuICAgIHJldHVybiB0YXJnZXRcbiAgfVxuICBlbHNlIHtcbiAgICB2YXIgdmFsdWUgPSB0YXJnZXQudmFsdWVPZigpXG4gICAgaWYgKHRhcmdldCA9PSB2YWx1ZSkge1xuICAgICAgLy8gVGhlIG9iamVjdCBpcyBhIHN0YW5kYXJkIG9iamVjdCB3cmFwcGVyIGZvciBhIG5hdGl2ZSB0eXBlLCBzYXkgU3RyaW5nLlxuICAgICAgLy8gd2UgY2FuIG1ha2UgYSBjb3B5IGJ5IGluc3RhbnRpYXRpbmcgYSBuZXcgb2JqZWN0IGFyb3VuZCB0aGUgdmFsdWUuXG4gICAgICBjID0gbmV3IHRhcmdldC5jb25zdHJ1Y3Rvcih2YWx1ZSlcbiAgICAgIHZhciBub3RTdHJpbmcgPSB0eXBlKHRhcmdldCkgIT0gJ3N0cmluZydcblxuICAgICAgLy8gV3JhcHBlcnMgY2FuIGhhdmUgcHJvcGVydGllcyBhZGRlZCB0byB0aGVtXG4gICAgICBmb3IgKHByb3BlcnR5IGluIHRhcmdldCkge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwodGFyZ2V0LCBwcm9wZXJ0eSkgJiYgKG5vdFN0cmluZyB8fCAhc3RyaW5nUHJvcHNSRS50ZXN0KHByb3BlcnR5KSkpIHtcbiAgICAgICAgICBjW3Byb3BlcnR5XSA9IHRhcmdldFtwcm9wZXJ0eV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdlIGhhdmUgYSBub3JtYWwgb2JqZWN0LiBJZiBwb3NzaWJsZSwgd2UnbGwgY2xvbmUgdGhlIG9yaWdpbmFsJ3NcbiAgICAgIC8vIHByb3RvdHlwZSAobm90IHRoZSBvcmlnaW5hbCkgdG8gZ2V0IGFuIGVtcHR5IG9iamVjdCB3aXRoIHRoZSBzYW1lXG4gICAgICAvLyBwcm90b3R5cGUgY2hhaW4gYXMgdGhlIG9yaWdpbmFsLiBJZiBqdXN0IGNvcHkgdGhlIGluc3RhbmNlIHByb3BlcnRpZXMuXG4gICAgICAvLyBPdGhlcndpc2UsIHdlIGhhdmUgdG8gY29weSB0aGUgd2hvbGUgdGhpbmcsIHByb3BlcnR5LWJ5LXByb3BlcnR5LlxuICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIHRhcmdldC5jb25zdHJ1Y3RvciAmJiB0YXJnZXQuY29uc3RydWN0b3IgIT09IE9iamVjdCkge1xuICAgICAgICBjID0gY2xvbmUodGFyZ2V0LmNvbnN0cnVjdG9yLnByb3RvdHlwZSlcblxuICAgICAgICAvLyBHaXZlIHRoZSBjb3B5IGFsbCB0aGUgaW5zdGFuY2UgcHJvcGVydGllcyBvZiB0YXJnZXQuIEl0IGhhcyB0aGUgc2FtZVxuICAgICAgICAvLyBwcm90b3R5cGUgYXMgdGFyZ2V0LCBzbyBpbmhlcml0ZWQgcHJvcGVydGllcyBhcmUgYWxyZWFkeSB0aGVyZS5cbiAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiB0YXJnZXQpIHtcbiAgICAgICAgICBpZiAoaGFzT3duLmNhbGwodGFyZ2V0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgIGNbcHJvcGVydHldID0gdGFyZ2V0W3Byb3BlcnR5XVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGMgPSB7fVxuICAgICAgICBmb3IgKHByb3BlcnR5IGluIHRhcmdldCkge1xuICAgICAgICAgIGNbcHJvcGVydHldID0gdGFyZ2V0W3Byb3BlcnR5XVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjXG4gICAgfVxuICB9XG59XG5cbi8vIERlZXAgQ29weVxudmFyIGRlZXBDb3BpZXJzID0gW11cblxuZnVuY3Rpb24gRGVlcENvcGllcihjb25maWcpIHtcbiAgZm9yICh2YXIga2V5IGluIGNvbmZpZykge1xuICAgIHRoaXNba2V5XSA9IGNvbmZpZ1trZXldXG4gIH1cbn1cblxuRGVlcENvcGllci5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBEZWVwQ29waWVyXG5cbiAgLy8gRGV0ZXJtaW5lcyBpZiB0aGlzIERlZXBDb3BpZXIgY2FuIGhhbmRsZSB0aGUgZ2l2ZW4gb2JqZWN0LlxuLCBjYW5Db3B5OiBmdW5jdGlvbihzb3VyY2UpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyBTdGFydHMgdGhlIGRlZXAgY29weWluZyBwcm9jZXNzIGJ5IGNyZWF0aW5nIHRoZSBjb3B5IG9iamVjdC4gWW91IGNhblxuICAvLyBpbml0aWFsaXplIGFueSBwcm9wZXJ0aWVzIHlvdSB3YW50LCBidXQgeW91IGNhbid0IGNhbGwgcmVjdXJzaXZlbHkgaW50byB0aGVcbiAgLy8gRGVlcENvcHlBbGdvcml0aG0uXG4sIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlKSB7fVxuXG4gIC8vIENvbXBsZXRlcyB0aGUgZGVlcCBjb3B5IG9mIHRoZSBzb3VyY2Ugb2JqZWN0IGJ5IHBvcHVsYXRpbmcgYW55IHByb3BlcnRpZXNcbiAgLy8gdGhhdCBuZWVkIHRvIGJlIHJlY3Vyc2l2ZWx5IGRlZXAgY29waWVkLiBZb3UgY2FuIGRvIHRoaXMgYnkgdXNpbmcgdGhlXG4gIC8vIHByb3ZpZGVkIGRlZXBDb3B5QWxnb3JpdGhtIGluc3RhbmNlJ3MgZGVlcENvcHkoKSBtZXRob2QuIFRoaXMgd2lsbCBoYW5kbGVcbiAgLy8gY3ljbGljIHJlZmVyZW5jZXMgZm9yIG9iamVjdHMgYWxyZWFkeSBkZWVwQ29waWVkLCBpbmNsdWRpbmcgdGhlIHNvdXJjZVxuICAvLyBvYmplY3QgaXRzZWxmLiBUaGUgXCJyZXN1bHRcIiBwYXNzZWQgaW4gaXMgdGhlIG9iamVjdCByZXR1cm5lZCBmcm9tIGNyZWF0ZSgpLlxuLCBwb3B1bGF0ZTogZnVuY3Rpb24oZGVlcENvcHlBbGdvcml0aG0sIHNvdXJjZSwgcmVzdWx0KSB7fVxufVxuXG5mdW5jdGlvbiBEZWVwQ29weUFsZ29yaXRobSgpIHtcbiAgLy8gY29waWVkT2JqZWN0cyBrZWVwcyB0cmFjayBvZiBvYmplY3RzIGFscmVhZHkgY29waWVkIGJ5IHRoaXMgZGVlcENvcHlcbiAgLy8gb3BlcmF0aW9uLCBzbyB3ZSBjYW4gY29ycmVjdGx5IGhhbmRsZSBjeWNsaWMgcmVmZXJlbmNlcy5cbiAgdGhpcy5jb3BpZWRPYmplY3RzID0gW11cbiAgdmFyIHRoaXNQYXNzID0gdGhpc1xuICB0aGlzLnJlY3Vyc2l2ZURlZXBDb3B5ID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgcmV0dXJuIHRoaXNQYXNzLmRlZXBDb3B5KHNvdXJjZSlcbiAgfVxuICB0aGlzLmRlcHRoID0gMFxufVxuRGVlcENvcHlBbGdvcml0aG0ucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogRGVlcENvcHlBbGdvcml0aG1cblxuLCBtYXhEZXB0aDogMjU2XG5cbiAgLy8gQWRkIGFuIG9iamVjdCB0byB0aGUgY2FjaGUuICBObyBhdHRlbXB0IGlzIG1hZGUgdG8gZmlsdGVyIGR1cGxpY2F0ZXM7IHdlXG4gIC8vIGFsd2F5cyBjaGVjayBnZXRDYWNoZWRSZXN1bHQoKSBiZWZvcmUgY2FsbGluZyBpdC5cbiwgY2FjaGVSZXN1bHQ6IGZ1bmN0aW9uKHNvdXJjZSwgcmVzdWx0KSB7XG4gICAgdGhpcy5jb3BpZWRPYmplY3RzLnB1c2goW3NvdXJjZSwgcmVzdWx0XSlcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGNhY2hlZCBjb3B5IG9mIGEgZ2l2ZW4gb2JqZWN0LCBvciB1bmRlZmluZWQgaWYgaXQncyBhbiBvYmplY3RcbiAgLy8gd2UgaGF2ZW4ndCBzZWVuIGJlZm9yZS5cbiwgZ2V0Q2FjaGVkUmVzdWx0OiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICB2YXIgY29waWVkT2JqZWN0cyA9IHRoaXMuY29waWVkT2JqZWN0c1xuICAgIHZhciBsZW5ndGggPSBjb3BpZWRPYmplY3RzLmxlbmd0aFxuICAgIGZvciAoIHZhciBpPTA7IGk8bGVuZ3RoOyBpKysgKSB7XG4gICAgICBpZiAoIGNvcGllZE9iamVjdHNbaV1bMF0gPT09IHNvdXJjZSApIHtcbiAgICAgICAgcmV0dXJuIGNvcGllZE9iamVjdHNbaV1bMV1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgLy8gZGVlcENvcHkgaGFuZGxlcyB0aGUgc2ltcGxlIGNhc2VzIGl0c2VsZjogbm9uLW9iamVjdHMgYW5kIG9iamVjdCdzIHdlJ3ZlXG4gIC8vIHNlZW4gYmVmb3JlLiBGb3IgY29tcGxleCBjYXNlcywgaXQgZmlyc3QgaWRlbnRpZmllcyBhbiBhcHByb3ByaWF0ZVxuICAvLyBEZWVwQ29waWVyLCB0aGVuIGNhbGxzIGFwcGx5RGVlcENvcGllcigpIHRvIGRlbGVnYXRlIHRoZSBkZXRhaWxzIG9mIGNvcHlpbmdcbiAgLy8gdGhlIG9iamVjdCB0byB0aGF0IERlZXBDb3BpZXIuXG4sIGRlZXBDb3B5OiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAvLyBudWxsIGlzIGEgc3BlY2lhbCBjYXNlOiBpdCdzIHRoZSBvbmx5IHZhbHVlIG9mIHR5cGUgJ29iamVjdCcgd2l0aG91dFxuICAgIC8vIHByb3BlcnRpZXMuXG4gICAgaWYgKHNvdXJjZSA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgICAvLyBBbGwgbm9uLW9iamVjdHMgdXNlIHZhbHVlIHNlbWFudGljcyBhbmQgZG9uJ3QgbmVlZCBleHBsaWN0IGNvcHlpbmdcbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPSAnb2JqZWN0JykgeyByZXR1cm4gc291cmNlIH1cblxuICAgIHZhciBjYWNoZWRSZXN1bHQgPSB0aGlzLmdldENhY2hlZFJlc3VsdChzb3VyY2UpXG5cbiAgICAvLyBXZSd2ZSBhbHJlYWR5IHNlZW4gdGhpcyBvYmplY3QgZHVyaW5nIHRoaXMgZGVlcCBjb3B5IG9wZXJhdGlvbiBzbyBjYW5cbiAgICAvLyBpbW1lZGlhdGVseSByZXR1cm4gdGhlIHJlc3VsdC4gVGhpcyBwcmVzZXJ2ZXMgdGhlIGN5Y2xpYyByZWZlcmVuY2VcbiAgICAvLyBzdHJ1Y3R1cmUgYW5kIHByb3RlY3RzIHVzIGZyb20gaW5maW5pdGUgcmVjdXJzaW9uLlxuICAgIGlmIChjYWNoZWRSZXN1bHQpIHsgcmV0dXJuIGNhY2hlZFJlc3VsdCB9XG5cbiAgICAvLyBPYmplY3RzIG1heSBuZWVkIHNwZWNpYWwgaGFuZGxpbmcgZGVwZW5kaW5nIG9uIHRoZWlyIGNsYXNzLiBUaGVyZSBpcyBhXG4gICAgLy8gY2xhc3Mgb2YgaGFuZGxlcnMgY2FsbCBcIkRlZXBDb3BpZXJzXCIgdGhhdCBrbm93IGhvdyB0byBjb3B5IGNlcnRhaW5cbiAgICAvLyBvYmplY3RzLiBUaGVyZSBpcyBhbHNvIGEgZmluYWwsIGdlbmVyaWMgZGVlcCBjb3BpZXIgdGhhdCBjYW4gaGFuZGxlIGFueVxuICAgIC8vIG9iamVjdC5cbiAgICBmb3IgKHZhciBpPTA7IGk8ZGVlcENvcGllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkZWVwQ29waWVyID0gZGVlcENvcGllcnNbaV1cbiAgICAgIGlmIChkZWVwQ29waWVyLmNhbkNvcHkoc291cmNlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcHBseURlZXBDb3BpZXIoZGVlcENvcGllciwgc291cmNlKVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBUaGUgZ2VuZXJpYyBjb3BpZXIgY2FuIGhhbmRsZSBhbnl0aGluZywgc28gd2Ugc2hvdWxkIG5ldmVyIHJlYWNoIHRoaXNcbiAgICAvLyBsaW5lLlxuICAgIHRocm93IG5ldyBFcnJvcignbm8gRGVlcENvcGllciBpcyBhYmxlIHRvIGNvcHkgJyArIHNvdXJjZSlcbiAgfVxuXG4gIC8vIE9uY2Ugd2UndmUgaWRlbnRpZmllZCB3aGljaCBEZWVwQ29waWVyIHRvIHVzZSwgd2UgbmVlZCB0byBjYWxsIGl0IGluIGFcbiAgLy8gdmVyeSBwYXJ0aWN1bGFyIG9yZGVyOiBjcmVhdGUsIGNhY2hlLCBwb3B1bGF0ZS5UaGlzIGlzIHRoZSBrZXkgdG8gZGV0ZWN0aW5nXG4gIC8vIGN5Y2xlcy4gV2UgYWxzbyBrZWVwIHRyYWNrIG9mIHJlY3Vyc2lvbiBkZXB0aCB3aGVuIGNhbGxpbmcgdGhlIHBvdGVudGlhbGx5XG4gIC8vIHJlY3Vyc2l2ZSBwb3B1bGF0ZSgpOiB0aGlzIGlzIGEgZmFpbC1mYXN0IHRvIHByZXZlbnQgYW4gaW5maW5pdGUgbG9vcCBmcm9tXG4gIC8vIGNvbnN1bWluZyBhbGwgYXZhaWxhYmxlIG1lbW9yeSBhbmQgY3Jhc2hpbmcgb3Igc2xvd2luZyBkb3duIHRoZSBicm93c2VyLlxuLCBhcHBseURlZXBDb3BpZXI6IGZ1bmN0aW9uKGRlZXBDb3BpZXIsIHNvdXJjZSkge1xuICAgIC8vIFN0YXJ0IGJ5IGNyZWF0aW5nIGEgc3R1YiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBjb3B5LlxuICAgIHZhciByZXN1bHQgPSBkZWVwQ29waWVyLmNyZWF0ZShzb3VyY2UpXG5cbiAgICAvLyBXZSBub3cga25vdyB0aGUgZGVlcCBjb3B5IG9mIHNvdXJjZSBzaG91bGQgYWx3YXlzIGJlIHJlc3VsdCwgc28gaWYgd2VcbiAgICAvLyBlbmNvdW50ZXIgc291cmNlIGFnYWluIGR1cmluZyB0aGlzIGRlZXAgY29weSB3ZSBjYW4gaW1tZWRpYXRlbHkgdXNlXG4gICAgLy8gcmVzdWx0IGluc3RlYWQgb2YgZGVzY2VuZGluZyBpbnRvIGl0IHJlY3Vyc2l2ZWx5LlxuICAgIHRoaXMuY2FjaGVSZXN1bHQoc291cmNlLCByZXN1bHQpXG5cbiAgICAvLyBPbmx5IERlZXBDb3BpZXIucG9wdWxhdGUoKSBjYW4gcmVjdXJzaXZlbHkgZGVlcCBjb3B5LiBTbywgdG8ga2VlcCB0cmFja1xuICAgIC8vIG9mIHJlY3Vyc2lvbiBkZXB0aCwgd2UgaW5jcmVtZW50IHRoaXMgc2hhcmVkIGNvdW50ZXIgYmVmb3JlIGNhbGxpbmcgaXQsXG4gICAgLy8gYW5kIGRlY3JlbWVudCBpdCBhZnRlcndhcmRzLlxuICAgIHRoaXMuZGVwdGgrK1xuICAgIGlmICh0aGlzLmRlcHRoID4gdGhpcy5tYXhEZXB0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhjZWVkZWQgbWF4IHJlY3Vyc2lvbiBkZXB0aCBpbiBkZWVwIGNvcHkuXCIpXG4gICAgfVxuXG4gICAgLy8gSXQncyBub3cgc2FmZSB0byBsZXQgdGhlIGRlZXBDb3BpZXIgcmVjdXJzaXZlbHkgZGVlcCBjb3B5IGl0cyBwcm9wZXJ0aWVzXG4gICAgZGVlcENvcGllci5wb3B1bGF0ZSh0aGlzLnJlY3Vyc2l2ZURlZXBDb3B5LCBzb3VyY2UsIHJlc3VsdClcblxuICAgIHRoaXMuZGVwdGgtLVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbi8vIEVudHJ5IHBvaW50IGZvciBkZWVwIGNvcHkuXG4vLyAgIHNvdXJjZSBpcyB0aGUgb2JqZWN0IHRvIGJlIGRlZXAgY29waWVkLlxuLy8gICBtYXhEZXB0aCBpcyBhbiBvcHRpb25hbCByZWN1cnNpb24gbGltaXQuIERlZmF1bHRzIHRvIDI1Ni5cbmZ1bmN0aW9uIGRlZXBDb3B5KHNvdXJjZSwgbWF4RGVwdGgpIHtcbiAgdmFyIGRlZXBDb3B5QWxnb3JpdGhtID0gbmV3IERlZXBDb3B5QWxnb3JpdGhtKClcbiAgaWYgKG1heERlcHRoKSB7XG4gICAgZGVlcENvcHlBbGdvcml0aG0ubWF4RGVwdGggPSBtYXhEZXB0aFxuICB9XG4gIHJldHVybiBkZWVwQ29weUFsZ29yaXRobS5kZWVwQ29weShzb3VyY2UpXG59XG5cbi8vIFB1YmxpY2x5IGV4cG9zZSB0aGUgRGVlcENvcGllciBjbGFzc1xuZGVlcENvcHkuRGVlcENvcGllciA9IERlZXBDb3BpZXJcblxuLy8gUHVibGljbHkgZXhwb3NlIHRoZSBsaXN0IG9mIGRlZXBDb3BpZXJzXG5kZWVwQ29weS5kZWVwQ29waWVycyA9IGRlZXBDb3BpZXJzXG5cbi8vIE1ha2UgZGVlcENvcHkoKSBleHRlbnNpYmxlIGJ5IGFsbG93aW5nIG90aGVycyB0byByZWdpc3RlciB0aGVpciBvd24gY3VzdG9tXG4vLyBEZWVwQ29waWVycy5cbmRlZXBDb3B5LnJlZ2lzdGVyID0gZnVuY3Rpb24oZGVlcENvcGllcikge1xuICBpZiAoIShkZWVwQ29waWVyIGluc3RhbmNlb2YgRGVlcENvcGllcikpIHtcbiAgICBkZWVwQ29waWVyID0gbmV3IERlZXBDb3BpZXIoZGVlcENvcGllcilcbiAgfVxuICBkZWVwQ29waWVycy51bnNoaWZ0KGRlZXBDb3BpZXIpXG59XG5cbi8vIEdlbmVyaWMgT2JqZWN0IGNvcGllclxuLy8gVGhlIHVsdGltYXRlIGZhbGxiYWNrIERlZXBDb3BpZXIsIHdoaWNoIHRyaWVzIHRvIGhhbmRsZSB0aGUgZ2VuZXJpYyBjYXNlLlxuLy8gVGhpcyBzaG91bGQgd29yayBmb3IgYmFzZSBPYmplY3RzIGFuZCBtYW55IHVzZXItZGVmaW5lZCBjbGFzc2VzLlxuZGVlcENvcHkucmVnaXN0ZXIoe1xuICBjYW5Db3B5OiBmdW5jdGlvbihzb3VyY2UpIHsgcmV0dXJuIHRydWUgfVxuXG4sIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIHNvdXJjZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgcmV0dXJuIGNsb25lKHNvdXJjZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHt9XG4gICAgfVxuICB9XG5cbiwgcG9wdWxhdGU6IGZ1bmN0aW9uKGRlZXBDb3B5LCBzb3VyY2UsIHJlc3VsdCkge1xuICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgIGlmIChoYXNPd24uY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBkZWVwQ29weShzb3VyY2Vba2V5XSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59KVxuXG4vLyBTdGFuZGFyZCBwcmltaXRpdmUgd3JhcHBlciBjb3BpZXJcbmRlZXBDb3B5LnJlZ2lzdGVyKHtcbiAgY2FuQ29weTogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZVdyYXBwZXJUeXBlc1t0eXBlKHNvdXJjZSldXG4gIH1cblxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiBuZXcgc291cmNlLmNvbnN0cnVjdG9yKHNvdXJjZS52YWx1ZU9mKCkpXG4gIH1cblxuLCBwb3B1bGF0ZTogZnVuY3Rpb24oZGVlcENvcHksIHNvdXJjZSwgcmVzdWx0KSB7XG4gICAgdmFyIG5vdFN0cmluZyA9IHR5cGUoc291cmNlKSAhPSAnc3RyaW5nJ1xuICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgIGlmIChoYXNPd24uY2FsbChzb3VyY2UsIGtleSkgJiYgKG5vdFN0cmluZyB8fCAhc3RyaW5nUHJvcHNSRS50ZXN0KGtleSkpKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gZGVlcENvcHkoc291cmNlW2tleV0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufSlcblxuLy8gUmVnRXhwIGNvcGllclxuZGVlcENvcHkucmVnaXN0ZXIoe1xuICBjYW5Db3B5OiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICByZXR1cm4gdHlwZShzb3VyY2UpID09ICdyZWdleHAnXG4gIH1cblxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiBzb3VyY2VcbiAgfVxuXG5cbn0pXG5cbi8vIERhdGUgY29waWVyXG5kZWVwQ29weS5yZWdpc3Rlcih7XG4gIGNhbkNvcHk6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiB0eXBlKHNvdXJjZSkgPT0gJ2RhdGUnXG4gIH1cblxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHJldHVybiBuZXcgRGF0ZShzb3VyY2UpXG4gIH1cbn0pXG5cbi8vIEFycmF5IGNvcGllclxuZGVlcENvcHkucmVnaXN0ZXIoe1xuICBjYW5Db3B5OiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICByZXR1cm4gdHlwZShzb3VyY2UpID09ICdhcnJheSdcbiAgfVxuXG4sIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgcmV0dXJuIG5ldyBzb3VyY2UuY29uc3RydWN0b3IoKVxuICB9XG5cbiwgcG9wdWxhdGU6IGZ1bmN0aW9uKGRlZXBDb3B5LCBzb3VyY2UsIHJlc3VsdCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaChkZWVwQ29weShzb3VyY2VbaV0pKVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEZWVwQ29weUFsZ29yaXRobTogRGVlcENvcHlBbGdvcml0aG1cbiwgY29weTogY29weVxuLCBjbG9uZTogY2xvbmVcbiwgZGVlcENvcHk6IGRlZXBDb3B5XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxuICAsIGZvcm1hdFJlZ0V4cCA9IC8lWyVzXS9nXG4gICwgZm9ybWF0T2JqUmVnRXhwID0gLyh7ez8pKFxcdyspfS9nXG5cbi8qKlxuICogUmVwbGFjZXMgJXMgcGxhY2Vob2xkZXJzIGluIGEgc3RyaW5nIHdpdGggcG9zaXRpb25hbCBhcmd1bWVudHMuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdChzKSB7XG4gIHJldHVybiBmb3JtYXRBcnIocywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxufVxuXG4vKipcbiAqIFJlcGxhY2VzICVzIHBsYWNlaG9sZGVycyBpbiBhIHN0cmluZyB3aXRoIGFycmF5IGNvbnRlbnRzLlxuICovXG5mdW5jdGlvbiBmb3JtYXRBcnIocywgYSkge1xuICB2YXIgaSA9IDBcbiAgcmV0dXJuIHMucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKG0pIHsgcmV0dXJuIG0gPT0gJyUlJyA/ICclJyA6IGFbaSsrXSB9KVxufVxuXG4vKipcbiAqIFJlcGxhY2VzIHtwcm9wZXJ0eU5hbWV9IHBsYWNlaG9sZGVycyBpbiBhIHN0cmluZyB3aXRoIG9iamVjdCBwcm9wZXJ0aWVzLlxuICovXG5mdW5jdGlvbiBmb3JtYXRPYmoocywgbykge1xuICByZXR1cm4gcy5yZXBsYWNlKGZvcm1hdE9ialJlZ0V4cCwgZnVuY3Rpb24obSwgYiwgcCkgeyByZXR1cm4gYi5sZW5ndGggPT0gMiA/IG0uc2xpY2UoMSkgOiBvW3BdIH0pXG59XG5cbnZhciB1bml0cyA9ICdrTUdUUEVaWSdcbiAgLCBzdHJpcERlY2ltYWxzID0gL1xcLjAwJHwwJC9cblxuLyoqXG4gKiBGb3JtYXRzIGJ5dGVzIGFzIGEgZmlsZSBzaXplIHdpdGggdGhlIGFwcHJvcHJpYXRlbHkgc2NhbGVkIHVuaXRzLlxuICovXG5mdW5jdGlvbiBmaWxlU2l6ZShieXRlcywgdGhyZXNob2xkKSB7XG4gIHRocmVzaG9sZCA9IE1hdGgubWluKHRocmVzaG9sZCB8fCA3NjgsIDEwMjQpXG4gIHZhciBpID0gLTFcbiAgICAsIHVuaXQgPSAnYnl0ZXMnXG4gICAgLCBzaXplID0gYnl0ZXNcbiAgd2hpbGUgKHNpemUgPiB0aHJlc2hvbGQgJiYgaSA8IHVuaXRzLmxlbmd0aCkge1xuICAgIHNpemUgPSBzaXplIC8gMTAyNFxuICAgIGkrK1xuICB9XG4gIGlmIChpID4gLTEpIHtcbiAgICB1bml0ID0gdW5pdHMuY2hhckF0KGkpICsgJ0InXG4gIH1cbiAgcmV0dXJuIHNpemUudG9GaXhlZCgyKS5yZXBsYWNlKHN0cmlwRGVjaW1hbHMsICcnKSArICcgJyArIHVuaXRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGZvcm1hdDogZm9ybWF0XG4sIGZvcm1hdEFycjogZm9ybWF0QXJyXG4sIGZvcm1hdE9iajogZm9ybWF0T2JqXG4sIGZpbGVTaXplOiBmaWxlU2l6ZVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbi8vIFR5cGUgY2hlY2tzXG5cbmZ1bmN0aW9uIGlzQXJyYXkobykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBBcnJheV0nXG59XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihvKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG8pID09ICdbb2JqZWN0IEJvb2xlYW5dJ1xufVxuXG5mdW5jdGlvbiBpc0RhdGUobykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBEYXRlXSdcbn1cblxuZnVuY3Rpb24gaXNFcnJvcihvKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG8pID09ICdbb2JqZWN0IEVycm9yXSdcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihvKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG8pID09ICdbb2JqZWN0IEZ1bmN0aW9uXSdcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIobykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBOdW1iZXJdJ1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG8pID09ICdbb2JqZWN0IE9iamVjdF0nXG59XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKG8pIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwobykgPT0gJ1tvYmplY3QgUmVnRXhwXSdcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcobykge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvKSA9PSAnW29iamVjdCBTdHJpbmddJ1xufVxuXG4vLyBDb250ZW50IGNoZWNrc1xuXG5mdW5jdGlvbiBpc0VtcHR5KG8pIHtcbiAgLyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuICBmb3IgKHZhciBwcm9wIGluIG8pIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICAvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuICByZXR1cm4gdHJ1ZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQXJyYXk6IGlzQXJyYXlcbiwgQm9vbGVhbjogaXNCb29sZWFuXG4sIERhdGU6IGlzRGF0ZVxuLCBFbXB0eTogaXNFbXB0eVxuLCBFcnJvcjogaXNFcnJvclxuLCBGdW5jdGlvbjogaXNGdW5jdGlvblxuLCBOYU46IGlzTmFOXG4sIE51bWJlcjogaXNOdW1iZXJcbiwgT2JqZWN0OiBpc09iamVjdFxuLCBSZWdFeHA6IGlzUmVnRXhwXG4sIFN0cmluZzogaXNTdHJpbmdcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBXcmFwcyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KCkgc28gaXQgY2FuIGJlIGNhbGxlZCB3aXRoIGFuIG9iamVjdFxuICogYW5kIHByb3BlcnR5IG5hbWUuXG4gKi9cbnZhciBoYXNPd24gPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgcHJvcCkgeyByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApIH1cbn0pKClcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB0eXBlIG9mIGFuIG9iamVjdCBhcyBhIGxvd2VyY2FzZSBzdHJpbmcuXG4gKi9cbnZhciB0eXBlID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG4gIHJldHVybiBmdW5jdGlvbihvYmopIHsgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKSB9XG59KSgpXG5cbi8qKlxuICogQ29waWVzIG93biBwcm9wZXJ0aWVzIGZyb20gYW55IGdpdmVuIG9iamVjdHMgdG8gYSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIGV4dGVuZChkZXN0KSB7XG4gIGZvciAodmFyIGkgPSAxLCBsID0gYXJndW1lbnRzLmxlbmd0aCwgc3JjOyBpIDwgbDsgaSsrKSB7XG4gICAgc3JjID0gYXJndW1lbnRzW2ldXG4gICAgaWYgKHNyYykge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzcmMpIHtcbiAgICAgICAgaWYgKGhhc093bihzcmMsIHByb3ApKSB7XG4gICAgICAgICAgZGVzdFtwcm9wXSA9IHNyY1twcm9wXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBkZXN0XG59XG5cbi8qKlxuICogTWFrZXMgYSBjb25zdHJ1Y3RvciBpbmhlcml0IGFub3RoZXIgY29uc3RydWN0b3IncyBwcm90b3R5cGUgd2l0aG91dFxuICogaGF2aW5nIHRvIGFjdHVhbGx5IHVzZSB0aGUgY29uc3RydWN0b3IuXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXRzKGNoaWxkQ29uc3RydWN0b3IsIHBhcmVudENvbnN0cnVjdG9yKSB7XG4gIHZhciBGID0gZnVuY3Rpb24oKSB7fVxuICBGLnByb3RvdHlwZSA9IHBhcmVudENvbnN0cnVjdG9yLnByb3RvdHlwZVxuICBjaGlsZENvbnN0cnVjdG9yLnByb3RvdHlwZSA9IG5ldyBGKClcbiAgY2hpbGRDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjaGlsZENvbnN0cnVjdG9yXG4gIHJldHVybiBjaGlsZENvbnN0cnVjdG9yXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBBcnJheSBvZiBbcHJvcGVydHksIHZhbHVlXSBwYWlycyBmcm9tIGFuIE9iamVjdC5cbiAqL1xuZnVuY3Rpb24gaXRlbXMob2JqKSB7XG4gIHZhciBpdGVtc18gPSBbXVxuICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgIGlmIChoYXNPd24ob2JqLCBwcm9wKSkge1xuICAgICAgaXRlbXNfLnB1c2goW3Byb3AsIG9ialtwcm9wXV0pXG4gICAgfVxuICB9XG4gIHJldHVybiBpdGVtc19cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIE9iamVjdCBmcm9tIGFuIEFycmF5IG9mIFtwcm9wZXJ0eSwgdmFsdWVdIHBhaXJzLlxuICovXG5mdW5jdGlvbiBmcm9tSXRlbXMoaXRlbXMpIHtcbiAgdmFyIG9iaiA9IHt9XG4gIGZvciAodmFyIGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoLCBpdGVtOyBpIDwgbDsgaSsrKSB7XG4gICAgaXRlbSA9IGl0ZW1zW2ldXG4gICAgb2JqW2l0ZW1bMF1dID0gaXRlbVsxXVxuICB9XG4gIHJldHVybiBvYmpcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbG9va3VwIE9iamVjdCBmcm9tIGFuIEFycmF5LCBjb2VyY2luZyBlYWNoIGl0ZW0gdG8gYSBTdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGxvb2t1cChhcnIpIHtcbiAgdmFyIG9iaiA9IHt9XG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXJyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIG9ialsnJythcnJbaV1dID0gdHJ1ZVxuICB9XG4gIHJldHVybiBvYmpcbn1cblxuLyoqXG4gKiBJZiB0aGUgZ2l2ZW4gb2JqZWN0IGhhcyB0aGUgZ2l2ZW4gcHJvcGVydHksIHJldHVybnMgaXRzIHZhbHVlLCBvdGhlcndpc2VcbiAqIHJldHVybnMgdGhlIGdpdmVuIGRlZmF1bHQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGdldChvYmosIHByb3AsIGRlZmF1bHRWYWx1ZSkge1xuICByZXR1cm4gKGhhc093bihvYmosIHByb3ApID8gb2JqW3Byb3BdIDogZGVmYXVsdFZhbHVlKVxufVxuXG4vKipcbiAqIERlbGV0ZXMgYW5kIHJldHVybnMgYW4gb3duIHByb3BlcnR5IGZyb20gYW4gb2JqZWN0LCBvcHRpb25hbGx5IHJldHVybmluZyBhXG4gKiBkZWZhdWx0IHZhbHVlIGlmIHRoZSBvYmplY3QgZGlkbid0IGhhdmUgdGhlcHJvcGVydHkuXG4gKiBAdGhyb3dzIGlmIGdpdmVuIGFuIG9iamVjdCB3aGljaCBpcyBudWxsIChvciB1bmRlZmluZWQpLCBvciBpZiB0aGUgcHJvcGVydHlcbiAqICAgZG9lc24ndCBleGlzdCBhbmQgdGhlcmUgd2FzIG5vIGRlZmF1bHRWYWx1ZSBnaXZlbi5cbiAqL1xuZnVuY3Rpb24gcG9wKG9iaiwgcHJvcCwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmIChvYmogPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcigncG9wIHdhcyBnaXZlbiAnICsgb2JqKVxuICB9XG4gIGlmIChoYXNPd24ob2JqLCBwcm9wKSkge1xuICAgIHZhciB2YWx1ZSA9IG9ialtwcm9wXVxuICAgIGRlbGV0ZSBvYmpbcHJvcF1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwb3Agd2FzIGdpdmVuIGFuIG9iamVjdCB3aGljaCBkaWRuJ3QgaGF2ZSBhbiBvd24gJ1wiICtcbiAgICAgICAgICAgICAgICAgICAgcHJvcCArIFwiJyBwcm9wZXJ0eSwgd2l0aG91dCBhIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuXCIpXG4gIH1cbiAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuXG4vKipcbiAqIElmIHRoZSBwcm9wIGlzIGluIHRoZSBvYmplY3QsIHJldHVybiBpdHMgdmFsdWUuIElmIG5vdCwgc2V0IHRoZSBwcm9wIHRvXG4gKiBkZWZhdWx0VmFsdWUgYW5kIHJldHVybiBkZWZhdWx0VmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHNldERlZmF1bHQob2JqLCBwcm9wLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKG9iaiA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXREZWZhdWx0IHdhcyBnaXZlbiAnICsgb2JqKVxuICB9XG4gIGRlZmF1bHRWYWx1ZSA9IGRlZmF1bHRWYWx1ZSB8fCBudWxsXG4gIGlmIChoYXNPd24ob2JqLCBwcm9wKSkge1xuICAgIHJldHVybiBvYmpbcHJvcF1cbiAgfVxuICBlbHNlIHtcbiAgICBvYmpbcHJvcF0gPSBkZWZhdWx0VmFsdWVcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGhhc093bjogaGFzT3duXG4sIHR5cGU6IHR5cGVcbiwgZXh0ZW5kOiBleHRlbmRcbiwgaW5oZXJpdHM6IGluaGVyaXRzXG4sIGl0ZW1zOiBpdGVtc1xuLCBmcm9tSXRlbXM6IGZyb21JdGVtc1xuLCBsb29rdXA6IGxvb2t1cFxuLCBnZXQ6IGdldFxuLCBwb3A6IHBvcFxuLCBzZXREZWZhdWx0OiBzZXREZWZhdWx0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpcyA9IHJlcXVpcmUoJy4vaXMnKVxuXG4vKipcbiAqIFBhZHMgYSBudW1iZXIgd2l0aCBhIGxlYWRpbmcgemVybyBpZiBuZWNlc3NhcnkuXG4gKi9cbmZ1bmN0aW9uIHBhZChudW1iZXIpIHtcbiAgcmV0dXJuIChudW1iZXIgPCAxMCA/ICcwJyArIG51bWJlciA6IG51bWJlcilcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBpdGVtIGluIGxpc3QsIG9yIC0xIGlmIGl0J3Mgbm90IGluIGxpc3QuXG4gKi9cbmZ1bmN0aW9uIGluZGV4T2YoaXRlbSwgbGlzdCkge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKGl0ZW0gPT09IGxpc3RbaV0pIHtcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICB9XG4gIHJldHVybiAtMVxufVxuXG4vKipcbiAqIE1hcHMgZGlyZWN0aXZlIGNvZGVzIHRvIHJlZ3VsYXIgZXhwcmVzc2lvbiBwYXR0ZXJucyB3aGljaCB3aWxsIGNhcHR1cmUgdGhlXG4gKiBkYXRhIHRoZSBkaXJlY3RpdmUgY29ycmVzcG9uZHMgdG8sIG9yIGluIHRoZSBjYXNlIG9mIGxvY2FsZS1kZXBlbmRlbnRcbiAqIGRpcmVjdGl2ZXMsIGEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgYSBsb2NhbGUgYW5kIGdlbmVyYXRlcyBhIHJlZ3VsYXJcbiAqIGV4cHJlc3Npb24gcGF0dGVybi5cbiAqL1xudmFyIHBhcnNlckRpcmVjdGl2ZXMgPSB7XG4gIC8vIExvY2FsZSdzIGFiYnJldmlhdGVkIG1vbnRoIG5hbWVcbiAgJ2InOiBmdW5jdGlvbihsKSB7IHJldHVybiAnKCcgKyBsLmIuam9pbignfCcpICsgJyknIH1cbiAgLy8gTG9jYWxlJ3MgZnVsbCBtb250aCBuYW1lXG4sICdCJzogZnVuY3Rpb24obCkgeyByZXR1cm4gJygnICsgbC5CLmpvaW4oJ3wnKSArICcpJyB9XG4gIC8vIExvY2FsZSdzIGVxdWl2YWxlbnQgb2YgZWl0aGVyIEFNIG9yIFBNLlxuLCAncCc6IGZ1bmN0aW9uKGwpIHsgcmV0dXJuICcoJyArIGwuQU0gKyAnfCcgKyBsLlBNICsgJyknIH1cbiwgJ2QnOiAnKFxcXFxkXFxcXGQ/KScgLy8gRGF5IG9mIHRoZSBtb250aCBhcyBhIGRlY2ltYWwgbnVtYmVyIFswMSwzMV1cbiwgJ0gnOiAnKFxcXFxkXFxcXGQ/KScgLy8gSG91ciAoMjQtaG91ciBjbG9jaykgYXMgYSBkZWNpbWFsIG51bWJlciBbMDAsMjNdXG4sICdJJzogJyhcXFxcZFxcXFxkPyknIC8vIEhvdXIgKDEyLWhvdXIgY2xvY2spIGFzIGEgZGVjaW1hbCBudW1iZXIgWzAxLDEyXVxuLCAnbSc6ICcoXFxcXGRcXFxcZD8pJyAvLyBNb250aCBhcyBhIGRlY2ltYWwgbnVtYmVyIFswMSwxMl1cbiwgJ00nOiAnKFxcXFxkXFxcXGQ/KScgLy8gTWludXRlIGFzIGEgZGVjaW1hbCBudW1iZXIgWzAwLDU5XVxuLCAnUyc6ICcoXFxcXGRcXFxcZD8pJyAvLyBTZWNvbmQgYXMgYSBkZWNpbWFsIG51bWJlciBbMDAsNTldXG4sICd5JzogJyhcXFxcZFxcXFxkPyknIC8vIFllYXIgd2l0aG91dCBjZW50dXJ5IGFzIGEgZGVjaW1hbCBudW1iZXIgWzAwLDk5XVxuLCAnWSc6ICcoXFxcXGR7NH0pJyAgLy8gWWVhciB3aXRoIGNlbnR1cnkgYXMgYSBkZWNpbWFsIG51bWJlclxuLCAnJSc6ICclJyAgICAgICAgIC8vIEEgbGl0ZXJhbCAnJScgY2hhcmFjdGVyXG59XG5cbi8qKlxuICogTWFwcyBkaXJlY3RpdmUgY29kZXMgdG8gZnVuY3Rpb25zIHdoaWNoIHRha2UgdGhlIGRhdGUgdG8gYmUgZm9ybWF0dGVkIGFuZFxuICogbG9jYWxlIGRldGFpbHMgKGlmIHJlcXVpcmVkKSwgcmV0dXJuaW5nIGFuIGFwcHJvcHJpYXRlIGZvcm1hdHRlZCB2YWx1ZS5cbiAqL1xudmFyIGZvcm1hdHRlckRpcmVjdGl2ZXMgPSB7XG4gICdhJzogZnVuY3Rpb24oZCwgbCkgeyByZXR1cm4gbC5hW2QuZ2V0RGF5KCldIH1cbiwgJ0EnOiBmdW5jdGlvbihkLCBsKSB7IHJldHVybiBsLkFbZC5nZXREYXkoKV0gfVxuLCAnYic6IGZ1bmN0aW9uKGQsIGwpIHsgcmV0dXJuIGwuYltkLmdldE1vbnRoKCldIH1cbiwgJ0InOiBmdW5jdGlvbihkLCBsKSB7IHJldHVybiBsLkJbZC5nZXRNb250aCgpXSB9XG4sICdkJzogZnVuY3Rpb24oZCkgeyByZXR1cm4gcGFkKGQuZ2V0RGF0ZSgpLCAyKSB9XG4sICdIJzogZnVuY3Rpb24oZCkgeyByZXR1cm4gcGFkKGQuZ2V0SG91cnMoKSwgMikgfVxuLCAnTSc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBhZChkLmdldE1pbnV0ZXMoKSwgMikgfVxuLCAnbSc6IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBhZChkLmdldE1vbnRoKCkgKyAxLCAyKSB9XG4sICdTJzogZnVuY3Rpb24oZCkgeyByZXR1cm4gcGFkKGQuZ2V0U2Vjb25kcygpLCAyKSB9XG4sICd3JzogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXREYXkoKSB9XG4sICdZJzogZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5nZXRGdWxsWWVhcigpIH1cbiwgJyUnOiBmdW5jdGlvbihkKSB7IHJldHVybiAnJScgfVxufVxuXG4vKiogVGVzdCBmb3IgaGFuZ2luZyBwZXJjZW50YWdlIHN5bWJvbHMuICovXG52YXIgc3RyZnRpbWVGb3JtYXRDaGVjayA9IC9bXiVdJSQvXG5cbi8qKlxuICogQSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG9mIHN0cnB0aW1lIHdoaWNoIHBhcnNlcyB0aW1lIGRldGFpbHMgZnJvbSBhIHN0cmluZyxcbiAqIGJhc2VkIG9uIGEgZm9ybWF0IHN0cmluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBmb3JtYXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2NhbGVcbiAqL1xuZnVuY3Rpb24gVGltZVBhcnNlcihmb3JtYXQsIGxvY2FsZSkge1xuICB0aGlzLmZvcm1hdCA9IGZvcm1hdFxuICB0aGlzLmxvY2FsZSA9IGxvY2FsZVxuICB2YXIgY2FjaGVkUGF0dGVybiA9IFRpbWVQYXJzZXIuX2NhY2hlW2xvY2FsZS5uYW1lICsgJ3wnICsgZm9ybWF0XVxuICBpZiAoY2FjaGVkUGF0dGVybiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5yZSA9IGNhY2hlZFBhdHRlcm5bMF1cbiAgICB0aGlzLm1hdGNoT3JkZXIgPSBjYWNoZWRQYXR0ZXJuWzFdXG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5jb21waWxlUGF0dGVybigpXG4gIH1cbn1cblxuLyoqXG4gKiBDYWNoZXMgUmVnRXhwcyBhbmQgbWF0Y2ggb3JkZXJzIGdlbmVyYXRlZCBwZXIgbG9jYWxlL2Zvcm1hdCBzdHJpbmcgY29tYm8uXG4gKi9cblRpbWVQYXJzZXIuX2NhY2hlID0ge31cblxuVGltZVBhcnNlci5wcm90b3R5cGUuY29tcGlsZVBhdHRlcm4gPSBmdW5jdGlvbigpIHtcbiAgLy8gTm9ybWFsaXNlIHdoaXRlc3BhY2UgYmVmb3JlIGZ1cnRoZXIgcHJvY2Vzc2luZ1xuICB2YXIgZm9ybWF0ID0gdGhpcy5mb3JtYXQuc3BsaXQoLyg/Olxcc3xcXHR8XFxuKSsvKS5qb2luKCcgJylcbiAgICAsIHBhdHRlcm4gPSBbXVxuICAgICwgbWF0Y2hPcmRlciA9IFtdXG4gICAgLCBjXG4gICAgLCBkaXJlY3RpdmVcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGZvcm1hdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjID0gZm9ybWF0LmNoYXJBdChpKVxuICAgIGlmIChjICE9ICclJykge1xuICAgICAgaWYgKGMgPT09ICcgJykge1xuICAgICAgICBwYXR0ZXJuLnB1c2goJyArJylcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBwYXR0ZXJuLnB1c2goYylcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYgKGkgPT0gbCAtIDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignc3RycHRpbWUgZm9ybWF0IGVuZHMgd2l0aCByYXcgJScpXG4gICAgfVxuXG4gICAgYyA9IGZvcm1hdC5jaGFyQXQoKytpKVxuICAgIGRpcmVjdGl2ZSA9IHBhcnNlckRpcmVjdGl2ZXNbY11cbiAgICBpZiAoZGlyZWN0aXZlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignc3RycHRpbWUgZm9ybWF0IGNvbnRhaW5zIGFuIHVua25vd24gZGlyZWN0aXZlOiAlJyArIGMpXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLkZ1bmN0aW9uKGRpcmVjdGl2ZSkpIHtcbiAgICAgIHBhdHRlcm4ucHVzaChkaXJlY3RpdmUodGhpcy5sb2NhbGUpKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBhdHRlcm4ucHVzaChkaXJlY3RpdmUpXG4gICAgfVxuXG4gICAgaWYgKGMgIT0gJyUnKSB7XG4gICAgICAgbWF0Y2hPcmRlci5wdXNoKGMpXG4gICAgfVxuICB9XG5cbiAgdGhpcy5yZSA9IG5ldyBSZWdFeHAoJ14nICsgcGF0dGVybi5qb2luKCcnKSArICckJylcbiAgdGhpcy5tYXRjaE9yZGVyID0gbWF0Y2hPcmRlclxuICBUaW1lUGFyc2VyLl9jYWNoZVt0aGlzLmxvY2FsZS5uYW1lICsgJ3wnICsgdGhpcy5mb3JtYXRdID0gW3RoaXMucmUsIG1hdGNoT3JkZXJdXG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gZXh0cmFjdCBkYXRlIGFuZCB0aW1lIGRldGFpbHMgZnJvbSB0aGUgZ2l2ZW4gaW5wdXQuXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRcbiAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fVxuICovXG5UaW1lUGFyc2VyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBtYXRjaGVzID0gdGhpcy5yZS5leGVjKGlucHV0KVxuICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGltZSBkYXRhIGRpZCBub3QgbWF0Y2ggZm9ybWF0OiBkYXRhPScgKyBpbnB1dCArXG4gICAgICAgICAgICAgICAgICAgICcsIGZvcm1hdD0nICsgdGhpcy5mb3JtYXQpXG4gIH1cblxuICAgIC8vIERlZmF1bHQgdmFsdWVzIGZvciB3aGVuIG1vcmUgYWNjdXJhdGUgdmFsdWVzIGNhbm5vdCBiZSBpbmZlcnJlZFxuICB2YXIgdGltZSA9IFsxOTAwLCAxLCAxLCAwLCAwLCAwXVxuICAgIC8vIE1hdGNoZWQgdGltZSBkYXRhLCBrZXllZCBieSBkaXJlY3RpdmUgY29kZVxuICAgICwgZGF0YSA9IHt9XG5cbiAgZm9yICh2YXIgaSA9IDEsIGwgPSBtYXRjaGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGRhdGFbdGhpcy5tYXRjaE9yZGVyW2kgLSAxXV0gPSBtYXRjaGVzW2ldXG4gIH1cblxuICAvLyBFeHRyYWN0IHllYXJcbiAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ1knKSkge1xuICAgIHRpbWVbMF0gPSBwYXJzZUludChkYXRhLlksIDEwKVxuICB9XG4gIGVsc2UgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ3knKSkge1xuICAgIHZhciB5ZWFyID0gcGFyc2VJbnQoZGF0YS55LCAxMClcbiAgICBpZiAoeWVhciA8IDY4KSB7XG4gICAgICAgIHllYXIgPSAyMDAwICsgeWVhclxuICAgIH1cbiAgICBlbHNlIGlmICh5ZWFyIDwgMTAwKSB7XG4gICAgICAgIHllYXIgPSAxOTAwICsgeWVhclxuICAgIH1cbiAgICB0aW1lWzBdID0geWVhclxuICB9XG5cbiAgLy8gRXh0cmFjdCBtb250aFxuICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnbScpKSB7XG4gICAgdmFyIG1vbnRoID0gcGFyc2VJbnQoZGF0YS5tLCAxMClcbiAgICBpZiAobW9udGggPCAxIHx8IG1vbnRoID4gMTIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTW9udGggaXMgb3V0IG9mIHJhbmdlOiAnICsgbW9udGgpXG4gICAgfVxuICAgIHRpbWVbMV0gPSBtb250aFxuICB9XG4gIGVsc2UgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ0InKSkge1xuICAgIHRpbWVbMV0gPSBpbmRleE9mKGRhdGEuQiwgdGhpcy5sb2NhbGUuQikgKyAxXG4gIH1cbiAgZWxzZSBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnYicpKSB7XG4gICAgdGltZVsxXSA9IGluZGV4T2YoZGF0YS5iLCB0aGlzLmxvY2FsZS5iKSArIDFcbiAgfVxuXG4gIC8vIEV4dHJhY3QgZGF5IG9mIG1vbnRoXG4gIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdkJykpIHtcbiAgICB2YXIgZGF5ID0gcGFyc2VJbnQoZGF0YS5kLCAxMClcbiAgICBpZiAoZGF5IDwgMSB8fCBkYXkgPiAzMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEYXkgaXMgb3V0IG9mIHJhbmdlOiAnICsgZGF5KVxuICAgIH1cbiAgICB0aW1lWzJdID0gZGF5XG4gIH1cblxuICAvLyBFeHRyYWN0IGhvdXJcbiAgdmFyIGhvdXJcbiAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ0gnKSkge1xuICAgIGhvdXIgPSBwYXJzZUludChkYXRhLkgsIDEwKVxuICAgIGlmIChob3VyID4gMjMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSG91ciBpcyBvdXQgb2YgcmFuZ2U6ICcgKyBob3VyKVxuICAgIH1cbiAgICB0aW1lWzNdID0gaG91clxuICB9XG4gIGVsc2UgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ0knKSkge1xuICAgIGhvdXIgPSBwYXJzZUludChkYXRhLkksIDEwKVxuICAgIGlmIChob3VyIDwgMSB8fCBob3VyID4gMTIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSG91ciBpcyBvdXQgb2YgcmFuZ2U6ICcgKyBob3VyKVxuICAgIH1cblxuICAgIC8vIElmIHdlIGRvbid0IGdldCBhbnkgbW9yZSBpbmZvcm1hdGlvbiwgd2UnbGwgYXNzdW1lIHRoaXMgdGltZSBpc1xuICAgIC8vIGEubS4gLSAxMiBhLm0uIGlzIG1pZG5pZ2h0LlxuICAgIGlmIChob3VyID09IDEyKSB7XG4gICAgICAgIGhvdXIgPSAwXG4gICAgfVxuXG4gICAgdGltZVszXSA9IGhvdXJcblxuICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdwJykpIHtcbiAgICAgIGlmIChkYXRhLnAgPT0gdGhpcy5sb2NhbGUuUE0pIHtcbiAgICAgICAgLy8gV2UndmUgYWxyZWFkeSBoYW5kbGVkIHRoZSBtaWRuaWdodCBzcGVjaWFsIGNhc2UsIHNvIGl0J3NcbiAgICAgICAgLy8gc2FmZSB0byBidW1wIHRoZSB0aW1lIGJ5IDEyIGhvdXJzIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgICAgIHRpbWVbM10gPSB0aW1lWzNdICsgMTJcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBFeHRyYWN0IG1pbnV0ZVxuICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSgnTScpKSB7XG4gICAgdmFyIG1pbnV0ZSA9IHBhcnNlSW50KGRhdGEuTSwgMTApXG4gICAgaWYgKG1pbnV0ZSA+IDU5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWludXRlIGlzIG91dCBvZiByYW5nZTogJyArIG1pbnV0ZSlcbiAgICB9XG4gICAgdGltZVs0XSA9IG1pbnV0ZVxuICB9XG5cbiAgLy8gRXh0cmFjdCBzZWNvbmRzXG4gIGlmIChkYXRhLmhhc093blByb3BlcnR5KCdTJykpIHtcbiAgICB2YXIgc2Vjb25kID0gcGFyc2VJbnQoZGF0YS5TLCAxMClcbiAgICBpZiAoc2Vjb25kID4gNTkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2Vjb25kIGlzIG91dCBvZiByYW5nZTogJyArIHNlY29uZClcbiAgICB9XG4gICAgdGltZVs1XSA9IHNlY29uZFxuICB9XG5cbiAgLy8gVmFsaWRhdGUgZGF5IG9mIG1vbnRoXG4gIGRheSA9IHRpbWVbMl0sIG1vbnRoID0gdGltZVsxXSwgeWVhciA9IHRpbWVbMF1cbiAgaWYgKCgobW9udGggPT0gNCB8fCBtb250aCA9PSA2IHx8IG1vbnRoID09IDkgfHwgbW9udGggPT0gMTEpICYmXG4gICAgICBkYXkgPiAzMCkgfHxcbiAgICAgIChtb250aCA9PSAyICYmIGRheSA+ICgoeWVhciAlIDQgPT09IDAgJiYgeWVhciAlIDEwMCAhPT0gMCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ZWFyICUgNDAwID09PSAwKSA/IDI5IDogMjgpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignRGF5IGlzIG91dCBvZiByYW5nZTogJyArIGRheSlcbiAgfVxuXG4gIHJldHVybiB0aW1lXG59XG5cbnZhciB0aW1lICA9IHtcbiAgLyoqIERlZmF1bHQgbG9jYWxlIG5hbWUuICovXG4gIGRlZmF1bHRMb2NhbGU6ICdlbidcblxuICAvKiogTG9jYWxlIGRldGFpbHMuICovXG4sIGxvY2FsZXM6IHtcbiAgICBlbjoge1xuICAgICAgbmFtZTogJ2VuJ1xuICAgICwgYTogWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVxuICAgICwgQTogWydTdW5kYXknLCAnTW9uZGF5JywgJ1R1ZXNkYXknLCAnV2VkbmVzZGF5JywgJ1RodXJzZGF5JyxcbiAgICAgICAgICAnRnJpZGF5JywgJ1NhdHVyZGF5J11cbiAgICAsIEFNOiAnQU0nXG4gICAgLCBiOiBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXVxuICAgICwgQjogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLFxuICAgICAgICAgICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxuICAgICwgUE06ICdQTSdcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGxvY2FsZSB3aXRoIHRoZSBnaXZlbiBjb2RlLlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xudmFyIGdldExvY2FsZSA9IHRpbWUuZ2V0TG9jYWxlID0gZnVuY3Rpb24oY29kZSkge1xuICBpZiAoY29kZSkge1xuICAgIGlmICh0aW1lLmxvY2FsZXMuaGFzT3duUHJvcGVydHkoY29kZSkpIHtcbiAgICAgIHJldHVybiB0aW1lLmxvY2FsZXNbY29kZV1cbiAgICB9XG4gICAgZWxzZSBpZiAoY29kZS5sZW5ndGggPiAyKSB7XG4gICAgICAvLyBJZiB3ZSBhcHBlYXIgdG8gaGF2ZSBtb3JlIHRoYW4gYSBsYW5ndWFnZSBjb2RlLCB0cnkgdGhlXG4gICAgICAvLyBsYW5ndWFnZSBjb2RlIG9uIGl0cyBvd24uXG4gICAgICB2YXIgbGFuZ3VhZ2VDb2RlID0gY29kZS5zdWJzdHJpbmcoMCwgMilcbiAgICAgIGlmICh0aW1lLmxvY2FsZXMuaGFzT3duUHJvcGVydHkobGFuZ3VhZ2VDb2RlKSkge1xuICAgICAgICByZXR1cm4gdGltZS5sb2NhbGVzW2xhbmd1YWdlQ29kZV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRpbWUubG9jYWxlc1t0aW1lLmRlZmF1bHRMb2NhbGVdXG59XG5cbi8qKlxuICogUGFyc2VzIHRpbWUgZGV0YWlscyBmcm9tIGEgc3RyaW5nLCBiYXNlZCBvbiBhIGZvcm1hdCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXRcbiAqIEBwYXJhbSB7c3RyaW5nPX0gbG9jYWxlXG4gKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn1cbiAqL1xudmFyIHN0cnB0aW1lID0gdGltZS5zdHJwdGltZSA9IGZ1bmN0aW9uKGlucHV0LCBmb3JtYXQsIGxvY2FsZSkge1xuICByZXR1cm4gbmV3IFRpbWVQYXJzZXIoZm9ybWF0LCBnZXRMb2NhbGUobG9jYWxlKSkucGFyc2UoaW5wdXQpXG59XG5cbi8qKlxuICogQ29udmVuaWVuY2Ugd3JhcHBlciBhcm91bmQgdGltZS5zdHJwdGltZSB3aGljaCByZXR1cm5zIGEgSmF2YVNjcmlwdCBEYXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0XG4gKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0XG4gKiBAcGFyYW0ge3N0cmluZz19IGxvY2FsZVxuICogQHJldHVybiB7ZGF0ZX1cbiAqL1xudGltZS5zdHJwZGF0ZSA9IGZ1bmN0aW9uKGlucHV0LCBmb3JtYXQsIGxvY2FsZSkge1xuICB2YXIgdCA9IHN0cnB0aW1lKGlucHV0LCBmb3JtYXQsIGxvY2FsZSlcbiAgcmV0dXJuIG5ldyBEYXRlKHRbMF0sIHRbMV0gLSAxLCB0WzJdLCB0WzNdLCB0WzRdLCB0WzVdKVxufVxuXG4vKipcbiAqIEEgcGFydGlhbCBpbXBsZW1lbnRhdGlvbiBvZiA8Y29kZT5zdHJmdGltZTwvY29kZT4sIHdoaWNoIGZvcm1hdHMgYSBkYXRlXG4gKiBhY2NvcmRpbmcgdG8gYSBmb3JtYXQgc3RyaW5nLiBBbiBFcnJvciB3aWxsIGJlIHRocm93biBpZiBhbiBpbnZhbGlkXG4gKiBmb3JtYXQgc3RyaW5nIGlzIGdpdmVuLlxuICogQHBhcmFtIHtkYXRlfSBkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0XG4gKiBAcGFyYW0ge3N0cmluZz19IGxvY2FsZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG50aW1lLnN0cmZ0aW1lID0gZnVuY3Rpb24oZGF0ZSwgZm9ybWF0LCBsb2NhbGUpIHtcbiAgaWYgKHN0cmZ0aW1lRm9ybWF0Q2hlY2sudGVzdChmb3JtYXQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzdHJmdGltZSBmb3JtYXQgZW5kcyB3aXRoIHJhdyAlJylcbiAgfVxuICBsb2NhbGUgPSBnZXRMb2NhbGUobG9jYWxlKVxuICByZXR1cm4gZm9ybWF0LnJlcGxhY2UoLyglLikvZywgZnVuY3Rpb24ocywgZikge1xuICAgIHZhciBjb2RlID0gZi5jaGFyQXQoMSlcbiAgICBpZiAodHlwZW9mIGZvcm1hdHRlckRpcmVjdGl2ZXNbY29kZV0gPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignc3RyZnRpbWUgZm9ybWF0IGNvbnRhaW5zIGFuIHVua25vd24gZGlyZWN0aXZlOiAnICsgZilcbiAgICB9XG4gICAgcmV0dXJuIGZvcm1hdHRlckRpcmVjdGl2ZXNbY29kZV0oZGF0ZSwgbG9jYWxlKVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRpbWVcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gcGFyc2VVcmkgMS4yLjJcbi8vIChjKSBTdGV2ZW4gTGV2aXRoYW4gPHN0ZXZlbmxldml0aGFuLmNvbT5cbi8vIE1JVCBMaWNlbnNlXG5mdW5jdGlvbiBwYXJzZVVyaSAoc3RyKSB7XG4gIHZhciBvID0gcGFyc2VVcmkub3B0aW9uc1xuICAgICwgbSA9IG8ucGFyc2VyW28uc3RyaWN0TW9kZSA/IFwic3RyaWN0XCIgOiBcImxvb3NlXCJdLmV4ZWMoc3RyKVxuICAgICwgdXJpID0ge31cbiAgICAsIGkgPSAxNFxuXG4gIHdoaWxlIChpLS0pIHsgdXJpW28ua2V5W2ldXSA9IG1baV0gfHwgXCJcIiB9XG5cbiAgdXJpW28ucS5uYW1lXSA9IHt9O1xuICB1cmlbby5rZXlbMTJdXS5yZXBsYWNlKG8ucS5wYXJzZXIsIGZ1bmN0aW9uICgkMCwgJDEsICQyKSB7XG4gICAgaWYgKCQxKSB7IHVyaVtvLnEubmFtZV1bJDFdID0gJDIgfVxuICB9KVxuXG4gIHJldHVybiB1cmlcbn1cblxucGFyc2VVcmkub3B0aW9ucyA9IHtcbiAgc3RyaWN0TW9kZTogZmFsc2Vcbiwga2V5OiBbJ3NvdXJjZScsJ3Byb3RvY29sJywnYXV0aG9yaXR5JywndXNlckluZm8nLCd1c2VyJywncGFzc3dvcmQnLCdob3N0JywncG9ydCcsJ3JlbGF0aXZlJywncGF0aCcsJ2RpcmVjdG9yeScsJ2ZpbGUnLCdxdWVyeScsJ2FuY2hvciddXG4sIHE6IHtcbiAgICBuYW1lOiAncXVlcnlLZXknXG4gICwgcGFyc2VyOiAvKD86XnwmKShbXiY9XSopPT8oW14mXSopL2dcbiAgfVxuLCBwYXJzZXI6IHtcbiAgICBzdHJpY3Q6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKT8oKCgoPzpbXj8jXFwvXSpcXC8pKikoW14/I10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS9cbiAgLCBsb29zZTogL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoW146XFwvPyMuXSspOik/KD86XFwvXFwvKT8oKD86KChbXjpAXSopKD86OihbXjpAXSopKT8pP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvXG4gIH1cbn1cblxuLy8gbWFrZVVSSSAxLjIuMiAtIGNyZWF0ZSBhIFVSSSBmcm9tIGFuIG9iamVjdCBzcGVjaWZpY2F0aW9uOyBjb21wYXRpYmxlIHdpdGhcbi8vIHBhcnNlVVJJIChodHRwOi8vYmxvZy5zdGV2ZW5sZXZpdGhhbi5jb20vYXJjaGl2ZXMvcGFyc2V1cmkpXG4vLyAoYykgTmlhbGwgU21hcnQgPG5pYWxsc21hcnQuY29tPlxuLy8gTUlUIExpY2Vuc2VcbmZ1bmN0aW9uIG1ha2VVcmkodSkge1xuICB2YXIgdXJpID0gJydcbiAgaWYgKHUucHJvdG9jb2wpIHtcbiAgICB1cmkgKz0gdS5wcm90b2NvbCArICc6Ly8nXG4gIH1cbiAgaWYgKHUudXNlcikge1xuICAgIHVyaSArPSB1LnVzZXJcbiAgfVxuICBpZiAodS5wYXNzd29yZCkge1xuICAgIHVyaSArPSAnOicgKyB1LnBhc3N3b3JkXG4gIH1cbiAgaWYgKHUudXNlciB8fCB1LnBhc3N3b3JkKSB7XG4gICAgdXJpICs9ICdAJ1xuICB9XG4gIGlmICh1Lmhvc3QpIHtcbiAgICB1cmkgKz0gdS5ob3N0XG4gIH1cbiAgaWYgKHUucG9ydCkge1xuICAgIHVyaSArPSAnOicgKyB1LnBvcnRcbiAgfVxuICBpZiAodS5wYXRoKSB7XG4gICAgdXJpICs9IHUucGF0aFxuICB9XG4gIHZhciBxayA9IHUucXVlcnlLZXlcbiAgdmFyIHFzID0gW11cbiAgZm9yICh2YXIgayBpbiBxaykge1xuICAgIGlmICghcWsuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIHZhciB2ID0gZW5jb2RlVVJJQ29tcG9uZW50KHFrW2tdKVxuICAgIGsgPSBlbmNvZGVVUklDb21wb25lbnQoaylcbiAgICBpZiAodikge1xuICAgICAgcXMucHVzaChrICsgJz0nICsgdilcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBxcy5wdXNoKGspXG4gICAgfVxuICB9XG4gIGlmIChxcy5sZW5ndGggPiAwKSB7XG4gICAgdXJpICs9ICc/JyArIHFzLmpvaW4oJyYnKVxuICB9XG4gIGlmICh1LmFuY2hvcikge1xuICAgIHVyaSArPSAnIycgKyB1LmFuY2hvclxuICB9XG4gIHJldHVybiB1cmlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHBhcnNlVXJpOiBwYXJzZVVyaVxuLCBtYWtlVXJpOiBtYWtlVXJpXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25jdXIgPSByZXF1aXJlKCdDb25jdXInKVxudmFyIGZvcm1hdCA9IHJlcXVpcmUoJ2lzb21vcnBoL2Zvcm1hdCcpLmZvcm1hdE9ialxudmFyIGlzID0gcmVxdWlyZSgnaXNvbW9ycGgvaXMnKVxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG5cbnZhciBOT05fRklFTERfRVJST1JTID0gJ19fYWxsX18nXG5cbi8qKlxuICogQSB2YWxpZGF0aW9uIGVycm9yLCBjb250YWluaW5nIGEgbGlzdCBvZiBtZXNzYWdlcy4gU2luZ2xlIG1lc3NhZ2VzIChlLmcuXG4gKiB0aG9zZSBwcm9kdWNlZCBieSB2YWxpZGF0b3JzKSBtYXkgaGF2ZSBhbiBhc3NvY2lhdGVkIGVycm9yIGNvZGUgYW5kXG4gKiBwYXJhbWV0ZXJzIHRvIGFsbG93IGN1c3RvbWlzYXRpb24gYnkgZmllbGRzLlxuICpcbiAqIFRoZSBtZXNzYWdlIGFyZ3VtZW50IGNhbiBiZSBhIHNpbmdsZSBlcnJvciwgYSBsaXN0IG9mIGVycm9ycywgb3IgYW4gb2JqZWN0XG4gKiB0aGF0IG1hcHMgZmllbGQgbmFtZXMgdG8gbGlzdHMgb2YgZXJyb3JzLiBXaGF0IHdlIGRlZmluZSBhcyBhbiBcImVycm9yXCIgY2FuXG4gKiBiZSBlaXRoZXIgYSBzaW1wbGUgc3RyaW5nIG9yIGFuIGluc3RhbmNlIG9mIFZhbGlkYXRpb25FcnJvciB3aXRoIGl0cyBtZXNzYWdlXG4gKiBhdHRyaWJ1dGUgc2V0LCBhbmQgd2hhdCB3ZSBkZWZpbmUgYXMgbGlzdCBvciBvYmplY3QgY2FuIGJlIGFuIGFjdHVhbCBsaXN0IG9yXG4gKiBvYmplY3Qgb3IgYW4gaW5zdGFuY2Ugb2YgVmFsaWRhdGlvbkVycm9yIHdpdGggaXRzIGVycm9yTGlzdCBvciBlcnJvck9ialxuICogcHJvcGVydHkgc2V0LlxuICovXG52YXIgVmFsaWRhdGlvbkVycm9yID0gQ29uY3VyLmV4dGVuZCh7XG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiBWYWxpZGF0aW9uRXJyb3IobWVzc2FnZSwga3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHsgcmV0dXJuIG5ldyBWYWxpZGF0aW9uRXJyb3IobWVzc2FnZSwga3dhcmdzKSB9XG4gICAga3dhcmdzID0gb2JqZWN0LmV4dGVuZCh7Y29kZTogbnVsbCwgcGFyYW1zOiBudWxsfSwga3dhcmdzKVxuXG4gICAgdmFyIGNvZGUgPSBrd2FyZ3MuY29kZVxuICAgIHZhciBwYXJhbXMgPSBrd2FyZ3MucGFyYW1zXG5cbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikge1xuICAgICAgaWYgKG9iamVjdC5oYXNPd24obWVzc2FnZSwgJ2Vycm9yT2JqJykpIHtcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UuZXJyb3JPYmpcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9iamVjdC5oYXNPd24obWVzc2FnZSwgJ21lc3NhZ2UnKSkge1xuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5lcnJvckxpc3RcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb2RlID0gbWVzc2FnZS5jb2RlXG4gICAgICAgIHBhcmFtcyA9IG1lc3NhZ2UucGFyYW1zXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLm1lc3NhZ2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXMuT2JqZWN0KG1lc3NhZ2UpKSB7XG4gICAgICB0aGlzLmVycm9yT2JqID0ge31cbiAgICAgIE9iamVjdC5rZXlzKG1lc3NhZ2UpLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2VzID0gbWVzc2FnZVtmaWVsZF1cbiAgICAgICAgaWYgKCEobWVzc2FnZXMgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7XG4gICAgICAgICAgbWVzc2FnZXMgPSBWYWxpZGF0aW9uRXJyb3IobWVzc2FnZXMpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lcnJvck9ialtmaWVsZF0gPSBtZXNzYWdlcy5lcnJvckxpc3RcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9XG4gICAgZWxzZSBpZiAoaXMuQXJyYXkobWVzc2FnZSkpIHtcbiAgICAgIHRoaXMuZXJyb3JMaXN0ID0gW11cbiAgICAgIG1lc3NhZ2UuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSBzdHJpbmdzIHRvIGluc3RhbmNlcyBvZiBWYWxpZGF0aW9uRXJyb3JcbiAgICAgICAgaWYgKCEobWVzc2FnZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHtcbiAgICAgICAgICBtZXNzYWdlID0gVmFsaWRhdGlvbkVycm9yKG1lc3NhZ2UpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lcnJvckxpc3QucHVzaC5hcHBseSh0aGlzLmVycm9yTGlzdCwgbWVzc2FnZS5lcnJvckxpc3QpXG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZVxuICAgICAgdGhpcy5jb2RlID0gY29kZVxuICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXNcbiAgICAgIHRoaXMuZXJyb3JMaXN0ID0gW3RoaXNdXG4gICAgfVxuICB9XG59KVxuXG4vKipcbiAqIFJldHVybnMgdmFsaWRhdGlvbiBtZXNzYWdlcyBhcyBhbiBvYmplY3Qgd2l0aCBmaWVsZCBuYW1lcyBhcyBwcm9wZXJ0aWVzLlxuICogVGhyb3dzIGFuIGVycm9yIGlmIHRoaXMgdmFsaWRhdGlvbiBlcnJvciB3YXMgbm90IGNyZWF0ZWQgd2l0aCBhIGZpZWxkIGVycm9yXG4gKiBvYmplY3QuXG4gKi9cblZhbGlkYXRpb25FcnJvci5wcm90b3R5cGUubWVzc2FnZU9iaiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIW9iamVjdC5oYXNPd24odGhpcywgJ2Vycm9yT2JqJykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZhbGlkYXRpb25FcnJvciBoYXMgbm8gZXJyb3JPYmonKVxuICB9XG4gIHJldHVybiB0aGlzLl9faXRlcl9fKClcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHZhbGlkYXRpb24gbWVzc2FnZXMgYXMgYSBsaXN0LlxuICovXG5WYWxpZGF0aW9uRXJyb3IucHJvdG90eXBlLm1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gIGlmIChvYmplY3QuaGFzT3duKHRoaXMsICdlcnJvck9iaicpKSB7XG4gICAgdmFyIG1lc3NhZ2VzID0gW11cbiAgICBPYmplY3Qua2V5cyh0aGlzLmVycm9yT2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICB2YXIgZXJyb3JzID0gdGhpcy5lcnJvck9ialtmaWVsZF1cbiAgICAgIG1lc3NhZ2VzLnB1c2guYXBwbHkobWVzc2FnZXMsIFZhbGlkYXRpb25FcnJvcihlcnJvcnMpLl9faXRlcl9fKCkpXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHJldHVybiBtZXNzYWdlc1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiB0aGlzLl9faXRlcl9fKClcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhbiBvYmplY3Qgb2YgZmllbGQgZXJyb3IgbWVzc2FncyBvciBhIGxpc3Qgb2YgZXJyb3IgbWVzc2FnZXNcbiAqIGRlcGVuZGluZyBvbiBob3cgdGhpcyBWYWxpZGF0aW9uRXJyb3IgaGFzIGJlZW4gY29uc3RydWN0ZWQuXG4gKi9cblZhbGlkYXRpb25FcnJvci5wcm90b3R5cGUuX19pdGVyX18gPSBmdW5jdGlvbigpIHtcbiAgaWYgKG9iamVjdC5oYXNPd24odGhpcywgJ2Vycm9yT2JqJykpIHtcbiAgICB2YXIgbWVzc2FnZU9iaiA9IHt9XG4gICAgT2JqZWN0LmtleXModGhpcy5lcnJvck9iaikuZm9yRWFjaChmdW5jdGlvbihmaWVsZCkge1xuICAgICAgdmFyIGVycm9ycyA9IHRoaXMuZXJyb3JPYmpbZmllbGRdXG4gICAgICBtZXNzYWdlT2JqW2ZpZWxkXSA9IFZhbGlkYXRpb25FcnJvcihlcnJvcnMpLl9faXRlcl9fKClcbiAgICB9LmJpbmQodGhpcykpXG4gICAgcmV0dXJuIG1lc3NhZ2VPYmpcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvckxpc3QubWFwKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2VcbiAgICAgIGlmIChlcnJvci5wYXJhbXMpIHtcbiAgICAgICAgbWVzc2FnZSA9IGZvcm1hdChtZXNzYWdlLCBlcnJvci5wYXJhbXMpXG4gICAgICB9XG4gICAgICByZXR1cm4gbWVzc2FnZVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBQYXNzZXMgdGhpcyBlcnJvcidzIG1lc3NhZ2VzIG9uIHRvIHRoZSBnaXZlbiBlcnJvciBvYmplY3QsIGFkZGluZyB0byBhXG4gKiBwYXJ0aWN1bGFyIGZpZWxkJ3MgZXJyb3IgbWVzc2FnZXMgaWYgYWxyZWFkeSBwcmVzZW50LlxuICovXG5WYWxpZGF0aW9uRXJyb3IucHJvdG90eXBlLnVwZGF0ZUVycm9yT2JqID0gZnVuY3Rpb24oZXJyb3JPYmopIHtcbiAgaWYgKG9iamVjdC5oYXNPd24odGhpcywgJ2Vycm9yT2JqJykpIHtcbiAgICBpZiAoZXJyb3JPYmopIHtcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMuZXJyb3JPYmopLmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgaWYgKCFvYmplY3QuaGFzT3duKGVycm9yT2JqLCBmaWVsZCkpIHtcbiAgICAgICAgICBlcnJvck9ialtmaWVsZF0gPSBbXVxuICAgICAgICB9XG4gICAgICAgIHZhciBlcnJvcnMgPSBlcnJvck9ialtmaWVsZF1cbiAgICAgICAgZXJyb3JzLnB1c2guYXBwbHkoZXJyb3JzLCB0aGlzLmVycm9yT2JqW2ZpZWxkXSlcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBlcnJvck9iaiA9IHRoaXMuZXJyb3JPYmpcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKCFvYmplY3QuaGFzT3duKGVycm9yT2JqLCBOT05fRklFTERfRVJST1JTKSkge1xuICAgICAgZXJyb3JPYmpbTk9OX0ZJRUxEX0VSUk9SU10gPSBbXVxuICAgIH1cbiAgICB2YXIgbm9uRmllbGRFcnJvcnMgPSBlcnJvck9ialtOT05fRklFTERfRVJST1JTXVxuICAgIG5vbkZpZWxkRXJyb3JzLnB1c2guYXBwbHkobm9uRmllbGRFcnJvcnMsIHRoaXMuZXJyb3JMaXN0KVxuICB9XG4gIHJldHVybiBlcnJvck9ialxufVxuXG5WYWxpZGF0aW9uRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoJ1ZhbGlkYXRpb25FcnJvcignICsgSlNPTi5zdHJpbmdpZnkodGhpcy5fX2l0ZXJfXygpKSArICcpJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFZhbGlkYXRpb25FcnJvcjogVmFsaWRhdGlvbkVycm9yXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEhBQ0s6IHJlcXVpcmluZyAnLi92YWxpZGF0b3JzJyBoZXJlIG1ha2VzIHRoZSBjaXJjdWxhciBpbXBvcnQgaW4gaXB2Ni5qcyB3b3JrXG4vLyAgICAgICBhZnRlciBicm93c2VyaWZpY2F0aW9uLlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZhbGlkYXRvcnMnKSIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9iamVjdCA9IHJlcXVpcmUoJ2lzb21vcnBoL29iamVjdCcpXG5cbnZhciBlcnJvcnMgPSByZXF1aXJlKCcuL2Vycm9ycycpXG5cbnZhciBWYWxpZGF0aW9uRXJyb3IgPSBlcnJvcnMuVmFsaWRhdGlvbkVycm9yXG5cbnZhciBoZXhSRSA9IC9eWzAtOWEtZl0rJC9cblxuLyoqXG4gKiBDbGVhbnMgYSBJUHY2IGFkZHJlc3Mgc3RyaW5nLlxuICpcbiAqIFZhbGlkaXR5IGlzIGNoZWNrZWQgYnkgY2FsbGluZyBpc1ZhbGlkSVB2NkFkZHJlc3MoKSAtIGlmIGFuIGludmFsaWQgYWRkcmVzc1xuICogaXMgcGFzc2VkLCBhIFZhbGlkYXRpb25FcnJvciBpcyB0aHJvd24uXG4gKlxuICogUmVwbGFjZXMgdGhlIGxvbmdlc3QgY29udGluaW91cyB6ZXJvLXNlcXVlbmNlIHdpdGggJzo6JyBhbmQgcmVtb3ZlcyBsZWFkaW5nXG4gKiB6ZXJvZXMgYW5kIG1ha2VzIHN1cmUgYWxsIGhleHRldHMgYXJlIGxvd2VyY2FzZS5cbiAqL1xuZnVuY3Rpb24gY2xlYW5JUHY2QWRkcmVzcyhpcFN0ciwga3dhcmdzKSB7XG4gIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgIHVucGFja0lQdjQ6IGZhbHNlLCBlcnJvck1lc3NhZ2U6ICdUaGlzIGlzIG5vdCBhIHZhbGlkIElQdjYgYWRkcmVzcy4nXG4gIH0sIGt3YXJncylcblxuICB2YXIgYmVzdERvdWJsZWNvbG9uU3RhcnQgPSAtMVxuICB2YXIgYmVzdERvdWJsZWNvbG9uTGVuID0gMFxuICB2YXIgZG91YmxlY29sb25TdGFydCA9IC0xXG4gIHZhciBkb3VibGVjb2xvbkxlbiA9IDBcblxuICBpZiAoIWlzVmFsaWRJUHY2QWRkcmVzcyhpcFN0cikpIHtcbiAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3Ioa3dhcmdzLmVycm9yTWVzc2FnZSwge2NvZGU6ICdpbnZhbGlkJ30pXG4gIH1cblxuICAvLyBUaGlzIGFsZ29yaXRobSBjYW4gb25seSBoYW5kbGUgZnVsbHkgZXhwbG9kZWQgSVAgc3RyaW5nc1xuICBpcFN0ciA9IF9leHBsb2RlU2hvcnRoYW5kSVBzdHJpbmcoaXBTdHIpXG4gIGlwU3RyID0gX3Nhbml0aXNlSVB2NE1hcHBpbmcoaXBTdHIpXG5cbiAgLy8gSWYgbmVlZGVkLCB1bnBhY2sgdGhlIElQdjQgYW5kIHJldHVybiBzdHJhaWdodCBhd2F5XG4gIGlmIChrd2FyZ3MudW5wYWNrSVB2NCkge1xuICAgIHZhciBpcHY0VW5wYWNrZWQgPSBfdW5wYWNrSVB2NChpcFN0cilcbiAgICBpZiAoaXB2NFVucGFja2VkKSB7XG4gICAgICByZXR1cm4gaXB2NFVucGFja2VkXG4gICAgfVxuICB9XG5cbiAgdmFyIGhleHRldHMgPSBpcFN0ci5zcGxpdCgnOicpXG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBoZXh0ZXRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9lc1xuICAgIGhleHRldHNbaV0gPSBoZXh0ZXRzW2ldLnJlcGxhY2UoL14wKy8sICcnKVxuICAgIGlmIChoZXh0ZXRzW2ldID09PSAnJykge1xuICAgICAgaGV4dGV0c1tpXSA9ICcwJ1xuICAgIH1cblxuICAgIC8vIERldGVybWluZSBiZXN0IGhleHRldCB0byBjb21wcmVzc1xuICAgIGlmIChoZXh0ZXRzW2ldID09ICcwJykge1xuICAgICAgZG91YmxlY29sb25MZW4gKz0gMVxuICAgICAgaWYgKGRvdWJsZWNvbG9uU3RhcnQgPT0gLTEpIHtcbiAgICAgICAgLy8gU3RhcnQgYSBzZXF1ZW5jZSBvZiB6ZXJvc1xuICAgICAgICBkb3VibGVjb2xvblN0YXJ0ID0gaVxuICAgICAgfVxuICAgICAgaWYgKGRvdWJsZWNvbG9uTGVuID4gYmVzdERvdWJsZWNvbG9uTGVuKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIGxvbmdlc3Qgc2VxdWVuY2Ugc28gZmFyXG4gICAgICAgIGJlc3REb3VibGVjb2xvbkxlbiA9IGRvdWJsZWNvbG9uTGVuXG4gICAgICAgIGJlc3REb3VibGVjb2xvblN0YXJ0ID0gZG91YmxlY29sb25TdGFydFxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGRvdWJsZWNvbG9uTGVuID0gMFxuICAgICAgZG91YmxlY29sb25TdGFydCA9IC0xXG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHJlc3MgdGhlIG1vc3Qgc3VpdGFibGUgaGV4dGV0XG4gIGlmIChiZXN0RG91YmxlY29sb25MZW4gPiAxKSB7XG4gICAgdmFyIGJlc3REb3VibGVjb2xvbkVuZCA9IGJlc3REb3VibGVjb2xvblN0YXJ0ICsgYmVzdERvdWJsZWNvbG9uTGVuXG4gICAgLy8gRm9yIHplcm9zIGF0IHRoZSBlbmQgb2YgdGhlIGFkZHJlc3NcbiAgICBpZiAoYmVzdERvdWJsZWNvbG9uRW5kID09IGhleHRldHMubGVuZ3RoKSB7XG4gICAgICBoZXh0ZXRzLnB1c2goJycpXG4gICAgfVxuICAgIGhleHRldHMuc3BsaWNlKGJlc3REb3VibGVjb2xvblN0YXJ0LCBiZXN0RG91YmxlY29sb25MZW4sICcnKVxuICAgIC8vIEZvciB6ZXJvcyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhZGRyZXNzXG4gICAgaWYgKGJlc3REb3VibGVjb2xvblN0YXJ0ID09PSAwKSB7XG4gICAgICBoZXh0ZXRzLnVuc2hpZnQoJycpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGhleHRldHMuam9pbignOicpLnRvTG93ZXJDYXNlKClcbn1cblxuLyoqXG4gKiBTYW5pdGlzZXMgSVB2NCBtYXBwaW5nIGluIGEgZXhwYW5kZWQgSVB2NiBhZGRyZXNzLlxuICpcbiAqIFRoaXMgY29udmVydHMgOjpmZmZmOjBhMGE6MGEwYSB0byA6OmZmZmY6MTAuMTAuMTAuMTAuXG4gKiBJZiB0aGVyZSBpcyBub3RoaW5nIHRvIHNhbml0aXNlLCByZXR1cm5zIGFuIHVuY2hhbmdlZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIF9zYW5pdGlzZUlQdjRNYXBwaW5nKGlwU3RyKSB7XG4gIGlmIChpcFN0ci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJzAwMDA6MDAwMDowMDAwOjAwMDA6MDAwMDpmZmZmOicpICE9PSAwKSB7XG4gICAgLy8gTm90IGFuIGlwdjQgbWFwcGluZ1xuICAgIHJldHVybiBpcFN0clxuICB9XG5cbiAgdmFyIGhleHRldHMgPSBpcFN0ci5zcGxpdCgnOicpXG5cbiAgaWYgKGhleHRldHNbaGV4dGV0cy5sZW5ndGggLSAxXS5pbmRleE9mKCcuJykgIT0gLTEpIHtcbiAgICAvLyBBbHJlYWR5IHNhbml0aXplZFxuICAgIHJldHVybiBpcFN0clxuICB9XG5cbiAgdmFyIGlwdjRBZGRyZXNzID0gW1xuICAgIHBhcnNlSW50KGhleHRldHNbNl0uc3Vic3RyaW5nKDAsIDIpLCAxNilcbiAgLCBwYXJzZUludChoZXh0ZXRzWzZdLnN1YnN0cmluZygyLCA0KSwgMTYpXG4gICwgcGFyc2VJbnQoaGV4dGV0c1s3XS5zdWJzdHJpbmcoMCwgMiksIDE2KVxuICAsIHBhcnNlSW50KGhleHRldHNbN10uc3Vic3RyaW5nKDIsIDQpLCAxNilcbiAgXS5qb2luKCcuJylcblxuICByZXR1cm4gaGV4dGV0cy5zbGljZSgwLCA2KS5qb2luKCc6JykgKyAgJzonICsgaXB2NEFkZHJlc3Ncbn1cblxuLyoqXG4gKiBVbnBhY2tzIGFuIElQdjQgYWRkcmVzcyB0aGF0IHdhcyBtYXBwZWQgaW4gYSBjb21wcmVzc2VkIElQdjYgYWRkcmVzcy5cbiAqXG4gKiBUaGlzIGNvbnZlcnRzIDAwMDA6MDAwMDowMDAwOjAwMDA6MDAwMDpmZmZmOjEwLjEwLjEwLjEwIHRvIDEwLjEwLjEwLjEwLlxuICogSWYgdGhlcmUgaXMgbm90aGluZyB0byBzYW5pdGl6ZSwgcmV0dXJucyBudWxsLlxuICovXG5mdW5jdGlvbiBfdW5wYWNrSVB2NChpcFN0cikge1xuICBpZiAoaXBTdHIudG9Mb3dlckNhc2UoKS5pbmRleE9mKCcwMDAwOjAwMDA6MDAwMDowMDAwOjAwMDA6ZmZmZjonKSAhPT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICB2YXIgaGV4dGV0cyA9IGlwU3RyLnNwbGl0KCc6JylcbiAgcmV0dXJuIGhleHRldHMucG9wKClcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIHdlIGhhdmUgYSB2YWxpZCBJUHY2IGFkZHJlc3MuXG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRJUHY2QWRkcmVzcyhpcFN0cikge1xuICB2YXIgdmFsaWRhdGVJUHY0QWRkcmVzcyA9IHJlcXVpcmUoJy4vdmFsaWRhdG9ycycpLnZhbGlkYXRlSVB2NEFkZHJlc3NcblxuICAvLyBXZSBuZWVkIHRvIGhhdmUgYXQgbGVhc3Qgb25lICc6J1xuICBpZiAoaXBTdHIuaW5kZXhPZignOicpID09IC0xKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBXZSBjYW4gb25seSBoYXZlIG9uZSAnOjonIHNob3J0ZW5lclxuICBpZiAoU3RyaW5nX2NvdW50KGlwU3RyLCAnOjonKSA+IDEpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vICc6Oicgc2hvdWxkIGJlIGVuY29tcGFzc2VkIGJ5IHN0YXJ0LCBkaWdpdHMgb3IgZW5kXG4gIGlmIChpcFN0ci5pbmRleE9mKCc6OjonKSAhPSAtMSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gQSBzaW5nbGUgY29sb24gY2FuIG5laXRoZXIgc3RhcnQgbm9yIGVuZCBhbiBhZGRyZXNzXG4gIGlmICgoaXBTdHIuY2hhckF0KDApID09ICc6JyAmJiBpcFN0ci5jaGFyQXQoMSkgIT0gJzonKSB8fFxuICAgICAgKGlwU3RyLmNoYXJBdChpcFN0ci5sZW5ndGggLSAxKSA9PSAnOicgJiZcbiAgICAgICBpcFN0ci5jaGFyQXQoaXBTdHIubGVuZ3RoIC0gMikgIT0gJzonKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gV2UgY2FuIG5ldmVyIGhhdmUgbW9yZSB0aGFuIDcgJzonICgxOjoyOjM6NDo1OjY6Nzo4IGlzIGludmFsaWQpXG4gIGlmIChTdHJpbmdfY291bnQoaXBTdHIsICc6JykgPiA3KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBJZiB3ZSBoYXZlIG5vIGNvbmNhdGVuYXRpb24sIHdlIG5lZWQgdG8gaGF2ZSA4IGZpZWxkcyB3aXRoIDcgJzonXG4gIGlmIChpcFN0ci5pbmRleE9mKCc6OicpID09IC0xICYmIFN0cmluZ19jb3VudChpcFN0ciwgJzonKSAhPSA3KSB7XG4gICAgLy8gV2UgbWlnaHQgaGF2ZSBhbiBJUHY0IG1hcHBlZCBhZGRyZXNzXG4gICAgaWYgKFN0cmluZ19jb3VudChpcFN0ciwgJy4nKSAhPSAzKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBpcFN0ciA9IF9leHBsb2RlU2hvcnRoYW5kSVBzdHJpbmcoaXBTdHIpXG5cbiAgLy8gTm93IHRoYXQgd2UgaGF2ZSB0aGF0IGFsbCBzcXVhcmVkIGF3YXksIGxldCdzIGNoZWNrIHRoYXQgZWFjaCBvZiB0aGVcbiAgLy8gaGV4dGV0cyBhcmUgYmV0d2VlbiAweDAgYW5kIDB4RkZGRi5cbiAgdmFyIGhleHRldHMgPSBpcFN0ci5zcGxpdCgnOicpXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaGV4dGV0cy5sZW5ndGgsIGhleHRldDsgaSA8IGw7IGkrKykge1xuICAgIGhleHRldCA9IGhleHRldHNbaV1cbiAgICBpZiAoU3RyaW5nX2NvdW50KGhleHRldCwgJy4nKSA9PSAzKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIElQdjQgbWFwcGVkIGFkZHJlc3MsIHRoZSBJUHY0IHBvcnRpb24gaGFzIHRvXG4gICAgICAvLyBiZSBhdCB0aGUgZW5kIG9mIHRoZSBJUHY2IHBvcnRpb24uXG4gICAgICBpZiAoaXBTdHIuc3BsaXQoJzonKS5wb3AoKSAhPSBoZXh0ZXQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB2YWxpZGF0ZUlQdjRBZGRyZXNzKGhleHRldClcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7XG4gICAgICAgICAgdGhyb3cgZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmICghaGV4UkUudGVzdChoZXh0ZXQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgdmFyIGludFZhbHVlID0gcGFyc2VJbnQoaGV4dGV0LCAxNilcbiAgICAgIGlmIChpc05hTihpbnRWYWx1ZSkgfHwgaW50VmFsdWUgPCAweDAgfHwgaW50VmFsdWUgPiAweEZGRkYpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBFeHBhbmRzIGEgc2hvcnRlbmVkIElQdjYgYWRkcmVzcy5cbiAqL1xuZnVuY3Rpb24gX2V4cGxvZGVTaG9ydGhhbmRJUHN0cmluZyhpcFN0cikge1xuICBpZiAoIV9pc1Nob3J0SGFuZChpcFN0cikpIHtcbiAgICAvLyBXZSd2ZSBhbHJlYWR5IGdvdCBhIGxvbmdoYW5kIGlwU3RyXG4gICAgcmV0dXJuIGlwU3RyXG4gIH1cblxuICB2YXIgbmV3SXAgPSBbXVxuICB2YXIgaGV4dGV0cyA9IGlwU3RyLnNwbGl0KCc6OicpXG5cbiAgLy8gSWYgdGhlcmUgaXMgYSA6Oiwgd2UgbmVlZCB0byBleHBhbmQgaXQgd2l0aCB6ZXJvZXMgdG8gZ2V0IHRvIDggaGV4dGV0cyAtXG4gIC8vIHVubGVzcyB0aGVyZSBpcyBhIGRvdCBpbiB0aGUgbGFzdCBoZXh0ZXQsIG1lYW5pbmcgd2UncmUgZG9pbmcgdjQtbWFwcGluZ1xuICB2YXIgZmlsbFRvID0gKGlwU3RyLnNwbGl0KCc6JykucG9wKCkuaW5kZXhPZignLicpICE9IC0xKSA/IDcgOiA4XG5cbiAgaWYgKGhleHRldHMubGVuZ3RoID4gMSkge1xuICAgIHZhciBzZXAgPSBoZXh0ZXRzWzBdLnNwbGl0KCc6JykubGVuZ3RoICsgaGV4dGV0c1sxXS5zcGxpdCgnOicpLmxlbmd0aFxuICAgIG5ld0lwID0gaGV4dGV0c1swXS5zcGxpdCgnOicpXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxsVG8gLSBzZXA7IGkgPCBsOyBpKyspIHtcbiAgICAgIG5ld0lwLnB1c2goJzAwMDAnKVxuICAgIH1cbiAgICBuZXdJcCA9IG5ld0lwLmNvbmNhdChoZXh0ZXRzWzFdLnNwbGl0KCc6JykpXG4gIH1cbiAgZWxzZSB7XG4gICAgbmV3SXAgPSBpcFN0ci5zcGxpdCgnOicpXG4gIH1cblxuICAvLyBOb3cgbmVlZCB0byBtYWtlIHN1cmUgZXZlcnkgaGV4dGV0IGlzIDQgbG93ZXIgY2FzZSBjaGFyYWN0ZXJzLlxuICAvLyBJZiBhIGhleHRldCBpcyA8IDQgY2hhcmFjdGVycywgd2UndmUgZ290IG1pc3NpbmcgbGVhZGluZyAwJ3MuXG4gIHZhciByZXRJcCA9IFtdXG4gIGZvciAoaSA9IDAsIGwgPSBuZXdJcC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICByZXRJcC5wdXNoKHplcm9QYWRkaW5nKG5ld0lwW2ldLCA0KSArIG5ld0lwW2ldLnRvTG93ZXJDYXNlKCkpXG4gIH1cbiAgcmV0dXJuIHJldElwLmpvaW4oJzonKVxufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdGhlIGFkZHJlc3MgaXMgc2hvcnRlbmVkLlxuICovXG5mdW5jdGlvbiBfaXNTaG9ydEhhbmQoaXBTdHIpIHtcbiAgaWYgKFN0cmluZ19jb3VudChpcFN0ciwgJzo6JykgPT0gMSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgdmFyIHBhcnRzID0gaXBTdHIuc3BsaXQoJzonKVxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChwYXJ0c1tpXS5sZW5ndGggPCA0KSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLy8gVXRpbGl0aWVzXG5cbmZ1bmN0aW9uIHplcm9QYWRkaW5nKHN0ciwgbGVuZ3RoKSB7XG4gIGlmIChzdHIubGVuZ3RoID49IGxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG4gIHJldHVybiBuZXcgQXJyYXkobGVuZ3RoIC0gc3RyLmxlbmd0aCArIDEpLmpvaW4oJzAnKVxufVxuXG5mdW5jdGlvbiBTdHJpbmdfY291bnQoc3RyLCBzdWJTdHIpIHtcbiAgcmV0dXJuIHN0ci5zcGxpdChzdWJTdHIpLmxlbmd0aCAtIDFcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNsZWFuSVB2NkFkZHJlc3M6IGNsZWFuSVB2NkFkZHJlc3NcbiwgaXNWYWxpZElQdjZBZGRyZXNzOiBpc1ZhbGlkSVB2NkFkZHJlc3Ncbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIENvbmN1ciA9IHJlcXVpcmUoJ0NvbmN1cicpXG52YXIgaXMgPSByZXF1aXJlKCdpc29tb3JwaC9pcycpXG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnaXNvbW9ycGgvb2JqZWN0JylcbnZhciBwdW55Y29kZSA9IHJlcXVpcmUoJ3B1bnljb2RlJylcbnZhciB1cmwgPSByZXF1aXJlKCdpc29tb3JwaC91cmwnKVxuXG52YXIgZXJyb3JzID0gcmVxdWlyZSgnLi9lcnJvcnMnKVxudmFyIGlwdjYgPSByZXF1aXJlKCcuL2lwdjYnKVxuXG52YXIgVmFsaWRhdGlvbkVycm9yID0gZXJyb3JzLlZhbGlkYXRpb25FcnJvclxudmFyIGlzVmFsaWRJUHY2QWRkcmVzcyA9IGlwdjYuaXNWYWxpZElQdjZBZGRyZXNzXG5cbnZhciBFTVBUWV9WQUxVRVMgPSBbbnVsbCwgdW5kZWZpbmVkLCAnJ11cblxuZnVuY3Rpb24gU3RyaW5nX3JzcGxpdChzdHIsIHNlcCwgbWF4c3BsaXQpIHtcbiAgdmFyIHNwbGl0ID0gc3RyLnNwbGl0KHNlcClcbiAgcmV0dXJuIG1heHNwbGl0ID8gW3NwbGl0LnNsaWNlKDAsIC1tYXhzcGxpdCkuam9pbihzZXApXS5jb25jYXQoc3BsaXQuc2xpY2UoLW1heHNwbGl0KSkgOiBzcGxpdFxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGlucHV0IG1hdGNoZXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKi9cbnZhciBSZWdleFZhbGlkYXRvciA9IENvbmN1ci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24oa3dhcmdzKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJlZ2V4VmFsaWRhdG9yKSkgeyByZXR1cm4gbmV3IFJlZ2V4VmFsaWRhdG9yKGt3YXJncykgfVxuICAgIGt3YXJncyA9IG9iamVjdC5leHRlbmQoe1xuICAgICAgcmVnZXg6IG51bGwsIG1lc3NhZ2U6IG51bGwsIGNvZGU6IG51bGwsIGludmVyc2VNYXRjaDogbnVsbFxuICAgIH0sIGt3YXJncylcbiAgICBpZiAoa3dhcmdzLnJlZ2V4KSB7XG4gICAgICB0aGlzLnJlZ2V4ID0ga3dhcmdzLnJlZ2V4XG4gICAgfVxuICAgIGlmIChrd2FyZ3MubWVzc2FnZSkge1xuICAgICAgdGhpcy5tZXNzYWdlID0ga3dhcmdzLm1lc3NhZ2VcbiAgICB9XG4gICAgaWYgKGt3YXJncy5jb2RlKSB7XG4gICAgICB0aGlzLmNvZGUgPSBrd2FyZ3MuY29kZVxuICAgIH1cbiAgICBpZiAoa3dhcmdzLmludmVyc2VNYXRjaCkge1xuICAgICAgdGhpcy5pbnZlcnNlTWF0Y2ggPSBrd2FyZ3MuaW52ZXJzZU1hdGNoXG4gICAgfVxuICAgIC8vIENvbXBpbGUgdGhlIHJlZ2V4IGlmIGl0IHdhcyBub3QgcGFzc2VkIHByZS1jb21waWxlZFxuICAgIGlmIChpcy5TdHJpbmcodGhpcy5yZWdleCkpIHtcbiAgICAgIHRoaXMucmVnZXggPSBuZXcgUmVnRXhwKHRoaXMucmVnZXgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fY2FsbF9fLmJpbmQodGhpcylcbiAgfVxuLCByZWdleDogJydcbiwgbWVzc2FnZTogJ0VudGVyIGEgdmFsaWQgdmFsdWUuJ1xuLCBjb2RlOiAnaW52YWxpZCdcbiwgaW52ZXJzZU1hdGNoOiBmYWxzZVxuLCBfX2NhbGxfXzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodGhpcy5pbnZlcnNlTWF0Y2ggPT09IHRoaXMucmVnZXgudGVzdCgnJyt2YWx1ZSkpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLm1lc3NhZ2UsIHtjb2RlOiB0aGlzLmNvZGV9KVxuICAgIH1cbiAgfVxufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBsb29rcyBsaWtlIGEgdmFsaWQgVVJMLlxuICovXG52YXIgVVJMVmFsaWRhdG9yID0gUmVnZXhWYWxpZGF0b3IuZXh0ZW5kKHtcbiAgcmVnZXg6IG5ldyBSZWdFeHAoXG4gICAgJ14oPzpbYS16MC05XFxcXC5cXFxcLV0qKTovLycgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2NoZW1hIGlzIHZhbGlkYXRlZCBzZXBhcmF0ZWx5XG4gICsgJyg/Oig/OltBLVowLTldKD86W0EtWjAtOS1dezAsNjF9W0EtWjAtOV0pP1xcXFwuKSsoPzpbQS1aXXsyLDZ9XFxcXC4/fFtBLVowLTktXXsyLH1cXFxcLj8pfCcgLy8gRG9tYWluLi4uXG4gICsgJ2xvY2FsaG9zdHwnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2NhbGhvc3QuLi5cbiAgKyAnXFxcXGR7MSwzfVxcXFwuXFxcXGR7MSwzfVxcXFwuXFxcXGR7MSwzfVxcXFwuXFxcXGR7MSwzfXwnICAgICAgLy8gLi4ub3IgSVB2NFxuICArICdcXFxcWz9bQS1GMC05XSo6W0EtRjAtOTpdK1xcXFxdPyknICAgICAgICAgICAgICAgICAgIC8vIC4uLm9yIElQdjZcbiAgKyAnKD86OlxcXFxkKyk/JyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW9uYWwgcG9ydFxuICArICcoPzovP3xbLz9dXFxcXFMrKSQnXG4gICwgJ2knXG4gIClcbiwgbWVzc2FnZTogJ0VudGVyIGEgdmFsaWQgVVJMLidcbiwgc2NoZW1lczogWydodHRwJywgJ2h0dHBzJywgJ2Z0cCcsICdmdHBzJ11cblxuLCBjb25zdHJ1Y3RvcjpmdW5jdGlvbihrd2FyZ3MpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVVJMVmFsaWRhdG9yKSkgeyByZXR1cm4gbmV3IFVSTFZhbGlkYXRvcihrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHtzY2hlbWVzOiBudWxsfSwga3dhcmdzKVxuICAgIFJlZ2V4VmFsaWRhdG9yLmNhbGwodGhpcywga3dhcmdzKVxuICAgIGlmIChrd2FyZ3Muc2NoZW1lcyAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5zY2hlbWVzID0ga3dhcmdzLnNjaGVtZXNcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19jYWxsX18uYmluZCh0aGlzKVxuICB9XG5cbiwgX19jYWxsX186IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFsdWUgPSAnJyt2YWx1ZVxuICAgIC8vIENoZWNrIGlmIHRoZSBzY2hlbWUgaXMgdmFsaWQgZmlyc3RcbiAgICB2YXIgc2NoZW1lID0gdmFsdWUuc3BsaXQoJzovLycpWzBdLnRvTG93ZXJDYXNlKClcbiAgICBpZiAodGhpcy5zY2hlbWVzLmluZGV4T2Yoc2NoZW1lKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLm1lc3NhZ2UsIHtjb2RlOiB0aGlzLmNvZGV9KVxuICAgIH1cblxuICAgIC8vIENoZWNrIHRoZSBmdWxsIFVSTFxuICAgIHRyeSB7XG4gICAgICBSZWdleFZhbGlkYXRvci5wcm90b3R5cGUuX19jYWxsX18uY2FsbCh0aGlzLCB2YWx1ZSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7IHRocm93IGUgfVxuXG4gICAgICAvLyBUcml2aWFsIGNhc2UgZmFpbGVkIC0gdHJ5IGZvciBwb3NzaWJsZSBJRE4gZG9tYWluXG4gICAgICB2YXIgdXJsRmllbGRzID0gdXJsLnBhcnNlVXJpKHZhbHVlKVxuICAgICAgdHJ5IHtcbiAgICAgICAgdXJsRmllbGRzLmhvc3QgPSBwdW55Y29kZS50b0FTQ0lJKHVybEZpZWxkcy5ob3N0KVxuICAgICAgfVxuICAgICAgY2F0Y2ggKHVuaWNvZGVFcnJvcikge1xuICAgICAgICB0aHJvdyBlXG4gICAgICB9XG4gICAgICB2YWx1ZSA9IHVybC5tYWtlVXJpKHVybEZpZWxkcylcbiAgICAgIFJlZ2V4VmFsaWRhdG9yLnByb3RvdHlwZS5fX2NhbGxfXy5jYWxsKHRoaXMsIHZhbHVlKVxuICAgIH1cbiAgfVxufSlcblxuLyoqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGxvb2tzIGxpa2UgYSB2YWxpZCBlLW1haWwgYWRkcmVzcy4gKi9cbnZhciBFbWFpbFZhbGlkYXRvciA9IENvbmN1ci5leHRlbmQoe1xuICBtZXNzYWdlOiAnRW50ZXIgYSB2YWxpZCBlbWFpbCBhZGRyZXNzLidcbiwgY29kZTogJ2ludmFsaWQnXG4sIHVzZXJSZWdleDogbmV3IFJlZ0V4cChcbiAgICBcIiheWy0hIyQlJicqKy89P15fYHt9fH4wLTlBLVpdKyhcXFxcLlstISMkJSYnKisvPT9eX2B7fXx+MC05QS1aXSspKiRcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvdC1hdG9tXG4gICsgJ3xeXCIoW1xcXFwwMDEtXFxcXDAxMFxcXFwwMTNcXFxcMDE0XFxcXDAxNi1cXFxcMDM3ISMtXFxcXFtcXFxcXS1cXFxcMTc3XXxcXFxcXFxcXFtcXFxcMDAxLVxcXFwwMTFcXFxcMDEzXFxcXDAxNFxcXFwwMTYtXFxcXDE3N10pKlwiJCknIC8vIFF1b3RlZC1zdHJpbmdcbiAgLCAnaScpXG4sIGRvbWFpblJlZ2V4OiBuZXcgUmVnRXhwKFxuICAgICdeKD86W0EtWjAtOV0oPzpbQS1aMC05LV17MCw2MX1bQS1aMC05XSk/XFxcXC4pKyg/OltBLVpdezIsNn18W0EtWjAtOS1dezIsfSkkJyAgICAgICAgICAvLyBEb21haW5cbiAgKyAnfF5cXFxcWygyNVswLTVdfDJbMC00XVxcXFxkfFswLTFdP1xcXFxkP1xcXFxkKShcXFxcLigyNVswLTVdfDJbMC00XVxcXFxkfFswLTFdP1xcXFxkP1xcXFxkKSl7M31cXFxcXSQnIC8vIExpdGVyYWwgZm9ybSwgaXB2NCBhZGRyZXNzIChTTVRQIDQuMS4zKVxuICAsICdpJylcbiwgZG9tYWluV2hpdGVsaXN0OiBbJ2xvY2FsaG9zdCddXG5cbiwgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGt3YXJncykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBFbWFpbFZhbGlkYXRvcikpIHsgcmV0dXJuIG5ldyBFbWFpbFZhbGlkYXRvcihrd2FyZ3MpIH1cbiAgICBrd2FyZ3MgPSBvYmplY3QuZXh0ZW5kKHttZXNzYWdlOiBudWxsLCBjb2RlOiBudWxsLCB3aGl0ZWxpc3Q6IG51bGx9LCBrd2FyZ3MpXG4gICAgaWYgKGt3YXJncy5tZXNzYWdlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLm1lc3NhZ2UgPSBrd2FyZ3MubWVzc2FnZVxuICAgIH1cbiAgICBpZiAoa3dhcmdzLmNvZGUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY29kZSA9IGt3YXJncy5jb2RlXG4gICAgfVxuICAgIGlmIChrd2FyZ3Mud2hpdGVsaXN0ICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmRvbWFpbldoaXRlbGlzdCA9IGt3YXJncy53aGl0ZWxpc3RcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19jYWxsX18uYmluZCh0aGlzKVxuICB9XG5cbiwgX19jYWxsX18gOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhbHVlID0gJycrdmFsdWVcblxuICAgIGlmICghdmFsdWUgfHwgdmFsdWUuaW5kZXhPZignQCcpID09IC0xKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5tZXNzYWdlLCB7Y29kZTogdGhpcy5jb2RlfSlcbiAgICB9XG5cbiAgICB2YXIgcGFydHMgPSBTdHJpbmdfcnNwbGl0KHZhbHVlLCAnQCcsIDEpXG4gICAgdmFyIHVzZXJQYXJ0ID0gcGFydHNbMF1cbiAgICB2YXIgZG9tYWluUGFydCA9IHBhcnRzWzFdXG5cbiAgICBpZiAoIXRoaXMudXNlclJlZ2V4LnRlc3QodXNlclBhcnQpKSB7XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5tZXNzYWdlLCB7Y29kZTogdGhpcy5jb2RlfSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kb21haW5XaGl0ZWxpc3QuaW5kZXhPZihkb21haW5QYXJ0KSA9PSAtMSAmJlxuICAgICAgICAhdGhpcy5kb21haW5SZWdleC50ZXN0KGRvbWFpblBhcnQpKSB7XG4gICAgICAvLyBUcnkgZm9yIHBvc3NpYmxlIElETiBkb21haW4tcGFydFxuICAgICAgdHJ5IHtcbiAgICAgICAgZG9tYWluUGFydCA9IHB1bnljb2RlLnRvQVNDSUkoZG9tYWluUGFydClcbiAgICAgICAgaWYgKHRoaXMuZG9tYWluUmVnZXgudGVzdChkb21haW5QYXJ0KSkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjYXRjaCAodW5pY29kZUVycm9yKSB7XG4gICAgICAgIC8vIFBhc3MgdGhyb3VnaCB0byB0aHJvdyB0aGUgVmFsaWRhdGlvbkVycm9yXG4gICAgICB9XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IodGhpcy5tZXNzYWdlLCB7Y29kZTogdGhpcy5jb2RlfSlcbiAgICB9XG4gIH1cbn0pXG5cbnZhciB2YWxpZGF0ZUVtYWlsID0gRW1haWxWYWxpZGF0b3IoKVxuXG52YXIgU0xVR19SRSA9IC9eWy1hLXpBLVowLTlfXSskL1xuLyoqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGlzIGEgdmFsaWQgc2x1Zy4gKi9cbnZhciB2YWxpZGF0ZVNsdWcgPSBSZWdleFZhbGlkYXRvcih7XG4gIHJlZ2V4OiBTTFVHX1JFXG4sIG1lc3NhZ2U6ICdFbnRlciBhIHZhbGlkIFwic2x1Z1wiIGNvbnNpc3Rpbmcgb2YgbGV0dGVycywgbnVtYmVycywgdW5kZXJzY29yZXMgb3IgaHlwaGVucy4nXG4sIGNvZGU6ICdpbnZhbGlkJ1xufSlcblxudmFyIElQVjRfUkUgPSAvXigyNVswLTVdfDJbMC00XVxcZHxbMC0xXT9cXGQ/XFxkKShcXC4oMjVbMC01XXwyWzAtNF1cXGR8WzAtMV0/XFxkP1xcZCkpezN9JC9cbi8qKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBpcyBhIHZhbGlkIElQdjQgYWRkcmVzcy4gKi9cbnZhciB2YWxpZGF0ZUlQdjRBZGRyZXNzID0gUmVnZXhWYWxpZGF0b3Ioe1xuICByZWdleDogSVBWNF9SRVxuLCBtZXNzYWdlOiAnRW50ZXIgYSB2YWxpZCBJUHY0IGFkZHJlc3MuJ1xuLCBjb2RlOiAnaW52YWxpZCdcbn0pXG5cbi8qKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBpcyBhIHZhbGlkIElQdjYgYWRkcmVzcy4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlSVB2NkFkZHJlc3ModmFsdWUpIHtcbiAgaWYgKCFpc1ZhbGlkSVB2NkFkZHJlc3ModmFsdWUpKSB7XG4gICAgdGhyb3cgVmFsaWRhdGlvbkVycm9yKCdFbnRlciBhIHZhbGlkIElQdjYgYWRkcmVzcy4nLCB7Y29kZTogJ2ludmFsaWQnfSlcbiAgfVxufVxuXG4vKiogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgYSB2YWxpZCBJUHY0IG9yIElQdjYgYWRkcmVzcy4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlSVB2NDZBZGRyZXNzKHZhbHVlKSB7XG4gIHRyeSB7XG4gICAgdmFsaWRhdGVJUHY0QWRkcmVzcyh2YWx1ZSlcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIGlmICghKGUgaW5zdGFuY2VvZiBWYWxpZGF0aW9uRXJyb3IpKSB7IHRocm93IGUgfVxuICAgIHRyeSB7XG4gICAgICB2YWxpZGF0ZUlQdjZBZGRyZXNzKHZhbHVlKVxuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIFZhbGlkYXRpb25FcnJvcikpIHsgdGhyb3cgZSB9XG4gICAgICB0aHJvdyBWYWxpZGF0aW9uRXJyb3IoJ0VudGVyIGEgdmFsaWQgSVB2NCBvciBJUHY2IGFkZHJlc3MuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29kZTogJ2ludmFsaWQnfSlcbiAgICB9XG4gIH1cbn1cblxudmFyIGlwQWRkcmVzc1ZhbGlkYXRvckxvb2t1cCA9IHtcbiAgYm90aDoge3ZhbGlkYXRvcnM6IFt2YWxpZGF0ZUlQdjQ2QWRkcmVzc10sIG1lc3NhZ2U6ICdFbnRlciBhIHZhbGlkIElQdjQgb3IgSVB2NiBhZGRyZXNzLid9XG4sIGlwdjQ6IHt2YWxpZGF0b3JzOiBbdmFsaWRhdGVJUHY0QWRkcmVzc10sIG1lc3NhZ2U6ICdFbnRlciBhIHZhbGlkIElQdjQgYWRkcmVzcy4nfVxuLCBpcHY2OiB7dmFsaWRhdG9yczogW3ZhbGlkYXRlSVB2NkFkZHJlc3NdLCBtZXNzYWdlOiAnRW50ZXIgYSB2YWxpZCBJUHY2IGFkZHJlc3MuJ31cbn1cblxuLyoqXG4gKiBEZXBlbmRpbmcgb24gdGhlIGdpdmVuIHBhcmFtZXRlcnMgcmV0dXJucyB0aGUgYXBwcm9wcmlhdGUgdmFsaWRhdG9ycyBmb3JcbiAqIGEgR2VuZXJpY0lQQWRkcmVzc0ZpZWxkLlxuICovXG5mdW5jdGlvbiBpcEFkZHJlc3NWYWxpZGF0b3JzKHByb3RvY29sLCB1bnBhY2tJUHY0KSB7XG4gIGlmIChwcm90b2NvbCAhPSAnYm90aCcgJiYgdW5wYWNrSVB2NCkge1xuICAgIHRocm93IG5ldyBFcnJvcignWW91IGNhbiBvbmx5IHVzZSB1bnBhY2tJUHY0IGlmIHByb3RvY29sIGlzIHNldCB0byBcImJvdGhcIicpXG4gIH1cbiAgcHJvdG9jb2wgPSBwcm90b2NvbC50b0xvd2VyQ2FzZSgpXG4gIGlmICh0eXBlb2YgaXBBZGRyZXNzVmFsaWRhdG9yTG9va3VwW3Byb3RvY29sXSA9PSAndW5kZWZpbmVkJykge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3RvY29sIFwiJyArIHByb3RvY29sICsnXCIgaXMgdW5rbm93bicpXG4gIH1cbiAgcmV0dXJuIGlwQWRkcmVzc1ZhbGlkYXRvckxvb2t1cFtwcm90b2NvbF1cbn1cblxudmFyIENPTU1BX1NFUEFSQVRFRF9JTlRfTElTVF9SRSA9IC9eW1xcZCxdKyQvXG4vKiogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBpbnRlZ2Vycy4gKi9cbnZhciB2YWxpZGF0ZUNvbW1hU2VwYXJhdGVkSW50ZWdlckxpc3QgPSBSZWdleFZhbGlkYXRvcih7XG4gIHJlZ2V4OiBDT01NQV9TRVBBUkFURURfSU5UX0xJU1RfUkVcbiwgbWVzc2FnZTogJ0VudGVyIG9ubHkgZGlnaXRzIHNlcGFyYXRlZCBieSBjb21tYXMuJ1xuLCBjb2RlOiAnaW52YWxpZCdcbn0pXG5cbi8qKlxuICogQmFzZSBmb3IgdmFsaWRhdG9ycyB3aGljaCBjb21wYXJlIGlucHV0IGFnYWluc3QgYSBnaXZlbiB2YWx1ZS5cbiAqL1xudmFyIEJhc2VWYWxpZGF0b3IgPSBDb25jdXIuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGxpbWl0VmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQmFzZVZhbGlkYXRvcikpIHsgcmV0dXJuIG5ldyBCYXNlVmFsaWRhdG9yKGxpbWl0VmFsdWUpIH1cbiAgICB0aGlzLmxpbWl0VmFsdWUgPSBsaW1pdFZhbHVlXG4gICAgcmV0dXJuIHRoaXMuX19jYWxsX18uYmluZCh0aGlzKVxuICB9XG4sIGNvbXBhcmU6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgIT09IGIgfVxuLCBjbGVhbjogZnVuY3Rpb24oeCkgeyByZXR1cm4geCB9XG4sIG1lc3NhZ2U6ICdFbnN1cmUgdGhpcyB2YWx1ZSBpcyB7bGltaXRWYWx1ZX0gKGl0IGlzIHtzaG93VmFsdWV9KS4nXG4sIGNvZGU6ICdsaW1pdFZhbHVlJ1xuLCBfX2NhbGxfXzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgY2xlYW5lZCA9IHRoaXMuY2xlYW4odmFsdWUpXG4gICAgdmFyIHBhcmFtcyA9IHtsaW1pdFZhbHVlOiB0aGlzLmxpbWl0VmFsdWUsIHNob3dWYWx1ZTogY2xlYW5lZH1cbiAgICBpZiAodGhpcy5jb21wYXJlKGNsZWFuZWQsIHRoaXMubGltaXRWYWx1ZSkpIHtcbiAgICAgIHRocm93IFZhbGlkYXRpb25FcnJvcih0aGlzLm1lc3NhZ2UsIHtjb2RlOiB0aGlzLmNvZGUsIHBhcmFtczogcGFyYW1zfSlcbiAgICB9XG4gIH1cbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGEgZ2l2ZW4gdmFsdWUuXG4gKi9cbnZhciBNYXhWYWx1ZVZhbGlkYXRvciA9IEJhc2VWYWxpZGF0b3IuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGxpbWl0VmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWF4VmFsdWVWYWxpZGF0b3IpKSB7IHJldHVybiBuZXcgTWF4VmFsdWVWYWxpZGF0b3IobGltaXRWYWx1ZSkgfVxuICAgIHJldHVybiBCYXNlVmFsaWRhdG9yLmNhbGwodGhpcywgbGltaXRWYWx1ZSlcbiAgfVxuLCBjb21wYXJlOiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhID4gYiB9XG4sIG1lc3NhZ2U6ICdFbnN1cmUgdGhpcyB2YWx1ZSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8ge2xpbWl0VmFsdWV9LidcbiwgY29kZTogJ21heFZhbHVlJ1xufSlcblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBpbnB1dCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gYSBnaXZlbiB2YWx1ZS5cbiAqL1xudmFyIE1pblZhbHVlVmFsaWRhdG9yID0gQmFzZVZhbGlkYXRvci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24obGltaXRWYWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNaW5WYWx1ZVZhbGlkYXRvcikpIHsgcmV0dXJuIG5ldyBNaW5WYWx1ZVZhbGlkYXRvcihsaW1pdFZhbHVlKSB9XG4gICAgcmV0dXJuIEJhc2VWYWxpZGF0b3IuY2FsbCh0aGlzLCBsaW1pdFZhbHVlKVxuICB9XG4sIGNvbXBhcmU6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgPCBiIH1cbiwgbWVzc2FnZTogJ0Vuc3VyZSB0aGlzIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB7bGltaXRWYWx1ZX0uJ1xuLCBjb2RlOiAnbWluVmFsdWUnXG59KVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGlucHV0IGlzIGF0IGxlYXN0IGEgZ2l2ZW4gbGVuZ3RoLlxuICovXG52YXIgTWluTGVuZ3RoVmFsaWRhdG9yID0gQmFzZVZhbGlkYXRvci5leHRlbmQoe1xuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24obGltaXRWYWx1ZSkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNaW5MZW5ndGhWYWxpZGF0b3IpKSB7IHJldHVybiBuZXcgTWluTGVuZ3RoVmFsaWRhdG9yKGxpbWl0VmFsdWUpIH1cbiAgICByZXR1cm4gQmFzZVZhbGlkYXRvci5jYWxsKHRoaXMsIGxpbWl0VmFsdWUpXG4gIH1cbiwgY29tcGFyZTogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSA8IGIgfVxuLCBjbGVhbjogZnVuY3Rpb24oeCkgeyByZXR1cm4geC5sZW5ndGggfVxuLCBtZXNzYWdlOiAnRW5zdXJlIHRoaXMgdmFsdWUgaGFzIGF0IGxlYXN0IHtsaW1pdFZhbHVlfSBjaGFyYWN0ZXJzIChpdCBoYXMge3Nob3dWYWx1ZX0pLidcbiwgY29kZTogJ21pbkxlbmd0aCdcbn0pXG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgaW5wdXQgaXMgYXQgbW9zdCBhIGdpdmVuIGxlbmd0aC5cbiAqL1xudmFyIE1heExlbmd0aFZhbGlkYXRvciA9IEJhc2VWYWxpZGF0b3IuZXh0ZW5kKHtcbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGxpbWl0VmFsdWUpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWF4TGVuZ3RoVmFsaWRhdG9yKSkgeyByZXR1cm4gbmV3IE1heExlbmd0aFZhbGlkYXRvcihsaW1pdFZhbHVlKSB9XG4gICAgcmV0dXJuIEJhc2VWYWxpZGF0b3IuY2FsbCh0aGlzLCBsaW1pdFZhbHVlKVxuICB9XG4sIGNvbXBhcmU6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgPiBiIH1cbiwgY2xlYW46IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgubGVuZ3RoIH1cbiwgbWVzc2FnZTogJ0Vuc3VyZSB0aGlzIHZhbHVlIGhhcyBhdCBtb3N0IHtsaW1pdFZhbHVlfSBjaGFyYWN0ZXJzIChpdCBoYXMge3Nob3dWYWx1ZX0pLidcbiwgY29kZTogJ21heExlbmd0aCdcbn0pXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBFTVBUWV9WQUxVRVM6IEVNUFRZX1ZBTFVFU1xuLCBSZWdleFZhbGlkYXRvcjogUmVnZXhWYWxpZGF0b3JcbiwgVVJMVmFsaWRhdG9yOiBVUkxWYWxpZGF0b3JcbiwgRW1haWxWYWxpZGF0b3I6IEVtYWlsVmFsaWRhdG9yXG4sIHZhbGlkYXRlRW1haWw6IHZhbGlkYXRlRW1haWxcbiwgdmFsaWRhdGVTbHVnOiB2YWxpZGF0ZVNsdWdcbiwgdmFsaWRhdGVJUHY0QWRkcmVzczogdmFsaWRhdGVJUHY0QWRkcmVzc1xuLCB2YWxpZGF0ZUlQdjZBZGRyZXNzOiB2YWxpZGF0ZUlQdjZBZGRyZXNzXG4sIHZhbGlkYXRlSVB2NDZBZGRyZXNzOiB2YWxpZGF0ZUlQdjQ2QWRkcmVzc1xuLCBpcEFkZHJlc3NWYWxpZGF0b3JzOiBpcEFkZHJlc3NWYWxpZGF0b3JzXG4sIHZhbGlkYXRlQ29tbWFTZXBhcmF0ZWRJbnRlZ2VyTGlzdDogdmFsaWRhdGVDb21tYVNlcGFyYXRlZEludGVnZXJMaXN0XG4sIEJhc2VWYWxpZGF0b3I6IEJhc2VWYWxpZGF0b3JcbiwgTWF4VmFsdWVWYWxpZGF0b3I6IE1heFZhbHVlVmFsaWRhdG9yXG4sIE1pblZhbHVlVmFsaWRhdG9yOiBNaW5WYWx1ZVZhbGlkYXRvclxuLCBNYXhMZW5ndGhWYWxpZGF0b3I6IE1heExlbmd0aFZhbGlkYXRvclxuLCBNaW5MZW5ndGhWYWxpZGF0b3I6IE1pbkxlbmd0aFZhbGlkYXRvclxuLCBWYWxpZGF0aW9uRXJyb3I6IFZhbGlkYXRpb25FcnJvclxuLCBpcHY2OiBpcHY2XG59XG4iXX0=
