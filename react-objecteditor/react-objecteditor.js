/*!
 * react-objecteditor 1.0.0 (dev build at Thu, 11 Dec 2014 20:28:41 GMT) - https://github.com/insin/react-objecteditor
 * MIT Licensed
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ObjectEditor=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null)

var cx = React.addons.classSet

/**
 * Gets just type info from an object's toString, in lower case.
 */
function getType(o) {
  return Object.prototype.toString.call(o).slice(8, -1).toLowerCase()
}

/**
 * Gets an appropriate editor constructor based on the given object's type.
 */
function getEditorCtor(o) {
  var type = getType(o)
  var Editor = TYPE_TO_EDITOR[type]
  if (!Editor) {
    throw new Error('No editor available for type: ' + type)
  }
  return Editor
}

/**
 * Creates an object containing the given prop and value.
 */
function makeObj(prop, value) {
  var update = {}
  update[prop] = value
  return update
}

// Container editors

/**
 * Mixin for editors which can be top-level containers (Objects or Arrays).
 */
var ContainerEditorMixin = {
  propTypes: {
    editing: React.PropTypes.bool,
    onChange: React.PropTypes.func
  },
  /**
   * Top-level editors won't have had a "prop" property passed to them by a
   * containing editor.
   */
  isTopLevel:function() {
    return (typeof this.props.prop == 'undefined')
  },
  /**
   * The presence of an "editing" property on a top-level editor controls
   * whether or not it can be used for editing, in which case it will take an
   * initial reference to its value object as state.
   */
  isEditable:function() {
    return (this.isTopLevel() && typeof this.props.editing != 'undefined')
  },
  getInitialState:function() {
    var initialState = {adding: false}
    if (this.isEditable()) {
      initialState.value = this.props.value
    }
    return initialState
  },
  /**
   * If an editor is being used to edit an object, we need to keep its state
   * up to date with any prop changes.
   */
  componentWillReceiveProps:function(newProps) {
    if (this.isEditable() && newProps.value !== this.props.value) {
      this.setState({value: newProps.value})
    }
  },
  shouldComponentUpdate:function(nextProps, nextState) {
    return (nextProps.editing !== this.props.editing ||                  // switching modes
            this.isEditable() && nextState.value !== this.state.value || // editable value updated
            nextProps.value !== this.props.value ||                      // display value updated
            nextState.adding != this.state.adding)                       // adding flag toggled
  },
  /**
   * Child editors will bubble up objects representing state changes in the
   * format React.addons.update expects. Top-level components are responsible
   * for applying the state changes.
   */
  onChange:function(update) {
    if (this.isTopLevel()) {
      var newState = React.addons.update(this.state, {value: update})
      this.setState(newState)
      if (this.props.onChange) {
        this.props.onChange(newState.value)
      }
    }
    else {
      this.props.onChange(makeObj(this.props.prop, update))
    }
  },
  /**
   * Getter for the object being displayed/edited, as top-level containers hold
   * the object as state.
   */
  getValue:function() {
    return (this.state.value || this.props.value)
  },
  toggleAdding:function() {
     this.setState({adding: !this.state.adding})
  }
}

var ObjectEditor = React.createClass({displayName: 'ObjectEditor',
  mixins: [ContainerEditorMixin],
  propTypes: {
    value: React.PropTypes.object
  },
  handleAdd:function(newProp, obj) {
    this.setState({adding: false}, function()  {
      this.onChange(makeObj(newProp, {$set: obj}))
    }.bind(this))
  },
  validateProp:function(prop) {
    return (prop && !Object.prototype.hasOwnProperty.call(this.getValue(), prop))
  },
  render:function() {
    return React.createElement("table", {className: "object"}, React.createElement("tbody", null, 
      React.createElement("tr", {className: "brace"}, 
        React.createElement("td", {colSpan: "2"}, 
          '{ ', 
          this.props.editing && (this.state.adding
           ? React.createElement(AddProperty, {
               onAdd: this.handleAdd, 
               onCancel: this.toggleAdding, 
               placeholder: "prop name", 
               onValidateProp: this.validateProp}
             )
           : React.createElement("button", {type: "button", onClick: this.toggleAdding}, "+")
           )
        )
      ), 
      this.renderProps(), 
      React.createElement("tr", {className: "brace"}, React.createElement("td", {colSpan: "2"}, "}"))
    ))
  },
  renderProps:function() {
    var obj = this.getValue()
    var rendered = []
    Object.keys(obj).forEach(function(prop)  {
      var value = obj[prop]
      var Editor = getEditorCtor(value)
      rendered.push(React.createElement("tr", {className: "line", key: prop}, 
        React.createElement("td", {className: "prop"}, prop), 
        React.createElement("td", {className: "value"}, 
          React.createElement(Editor, {prop: prop, 
                  value: value, 
                  editing: this.props.editing, 
                  onChange: this.onChange})
        )
      ))
    }.bind(this))
    return rendered
  }
})

var ArrayEditor = React.createClass({displayName: 'ArrayEditor',
  mixins: [ContainerEditorMixin],
  propTypes: {
    value: React.PropTypes.array
  },
  handleAdd:function(index, obj) {
    this.setState({adding: false}, function()  {
      index = (index === '' ? this.getValue().length : Number(index))
      this.onChange({$splice: [[index, 0, obj]]})
    }.bind(this))
  },
  validateIndex:function(index) {
    if (/^\d+$/.test(index)) {
      return (Number(index) <= this.getValue().length)
    }
    return (index === '')
  },
  render:function() {
    return React.createElement("table", {className: "array"}, React.createElement("tbody", null, 
      React.createElement("tr", {className: "brace"}, 
        React.createElement("td", {colSpan: "2"}, 
          "[", 
          this.props.editing && (this.state.adding
           ? React.createElement(AddProperty, {
               onAdd: this.handleAdd, 
               onCancel: this.toggleAdding, 
               placeholder: "index", 
               defaultProp: String(this.getValue().length), 
               onValidateProp: this.validateIndex}
             )
           : React.createElement("button", {type: "button", onClick: this.toggleAdding}, "+")
           )
        )
      ), 
      this.renderProps(), 
      React.createElement("tr", {className: "brace"}, React.createElement("td", {colSpan: "2"}, "]"))
    ))
  },
  renderProps:function() {
    var arr = this.getValue()
    var rendered = []
    for (var i = 0, l = arr.length; i < l; i++) {
      var value = arr[i]
      var Editor = getEditorCtor(value)
      rendered.push(React.createElement("tr", {className: "line"}, 
        React.createElement("td", {className: "prop"}, i), 
        React.createElement("td", {className: "value"}, 
          React.createElement(Editor, {prop: i, 
                  value: value, 
                  editing: this.props.editing, 
                  onChange: this.onChange})
        )
      ))
    }
    return rendered
  }
})

// Value editors

/**
 * Mixin for editors which can't be top-level containers (value objects).
 */
var ValueEditorMixin = {
  propTypes: {
    editing: React.PropTypes.bool,
    onChange: React.PropTypes.func
  }
}

var BooleanEditor = React.createClass({displayName: 'BooleanEditor',
  mixins: [ValueEditorMixin],
  propTypes: {
    value: React.PropTypes.bool
  },
  onChange:function(e) {
    this.props.onChange(makeObj(this.props.prop, {$set: e.target.checked}))
  },
  render:function() {
    if (!this.props.editing) {
      return React.createElement("div", {className: "boolean"}, Boolean(this.props.value).toString())
    }
    return React.createElement("div", {className: "boolean"}, 
      React.createElement("input", {type: "checkbox", checked: this.props.value, onChange: this.onChange})
    )
  }
})

var DateEditor = React.createClass({displayName: 'DateEditor',
  mixins: [ValueEditorMixin],
  propTypes: {
    value: React.PropTypes.instanceOf(Date)
  },
  getInitialState:function(date) {
    date = date || this.props.value
    return {
      errorMessage: null,
      input: date.toISOString().substring(0, 10)
    }
  },
  componentWillReceiveProps:function(newProps) {
    if (newProps.value !== this.props.value) {
      this.setState(this.getInitialState(newProps.value))
    }
  },
  onChange:function(e) {
    this.setState({input: e.target.value}, function()  {
      var errorMessage = null
      try {
        var newDate = new Date(this.state.input)
      }
      catch (e) {
        errorMessage = e.message
      }
      if (errorMessage === null &&
          (isNaN(newDate) || newDate.toString() == 'Invalid Date')) {
        errorMessage = 'Invalid Date'
      }
      if (errorMessage === null) {
        this.props.onChange(makeObj(this.props.prop, {$set: newDate}))
      }
      else {
        this.setState({errorMessage: errorMessage})
      }
    }.bind(this))
  },
  render:function() {
    if (!this.props.editing) {
      return React.createElement("div", {className: "date"}, this.state.input)
    }
    return React.createElement("div", {className: "date"}, 
      React.createElement("input", {type: "date", value: this.state.input, onChange: this.onChange}), 
      this.state.errorMessage && React.createElement("p", {className: "error"}, this.state.errorMessage)
    )
  }
})

var NumberEditor = React.createClass({displayName: 'NumberEditor',
  mixins: [ValueEditorMixin],
  propTypes: {
    value: React.PropTypes.number
  },
  getInitialState:function(num) {
    num = num || this.props.value
    return {
      errorMessage: null,
      input: num
    }
  },
  componentWillReceiveProps:function(newProps) {
    if (newProps.value !== this.props.value) {
      this.setState(this.getInitialState(newProps.value))
    }
  },
  onChange:function(e) {
    this.setState({input: e.target.value}, function()  {
      var newNumber = Number(this.state.input)
      if (!isNaN(newNumber)) {
        this.props.onChange(makeObj(this.props.prop, {$set: newNumber}))
      }
      else {
        this.setState({errorMessage: 'Not a number'})
      }
    }.bind(this))
  },
  render:function() {
    if (!this.props.editing) {
      return React.createElement("div", {className: "number"}, this.state.input)
    }
    return React.createElement("div", {className: "number"}, 
      React.createElement("input", {type: "number", step: "any", value: this.state.input, onChange: this.onChange}), 
      this.state.errorMessage && React.createElement("p", {className: "error"}, this.state.errorMessage)
    )
  }
})

var RegExpEditor = React.createClass({displayName: 'RegExpEditor',
  mixins: [ValueEditorMixin],
  propTypes: {
    value: React.PropTypes.instanceOf(RegExp)
  },
  getInitialState:function(re) {
    re = re || this.props.value
    return {
      g: re.global,
      i: re.ignoreCase,
      m: re.multiline,
      source: re.source,
      errorMessage: null
    }
  },
  getFlags:function() {
    var flags = []
    if (this.state.g) { flags.push('g') }
    if (this.state.i) { flags.push('i') }
    if (this.state.m) { flags.push('m') }
    return flags.join('')
  },
  componentWillReceiveProps:function(newProps) {
    if (newProps.value !== this.props.value) {
      this.setState(this.getInitialState(newProps.value))
    }
  },
  onChange:function(e) {
    var stateChange = {errorMessage: null}
    if (e.target.name == 'source') {
      stateChange.source = e.target.value
    }
    else {
      stateChange[e.target.name] = e.target.checked
    }
    this.setState(stateChange, function()  {
      try {
        var newRegExp = new RegExp(this.state.source, this.getFlags())
        this.props.onChange(makeObj(this.props.prop, {$set: newRegExp}))
      }
      catch (e) {
        this.setState({errorMessage: e.message})
      }
    }.bind(this))
  },
  render:function() {
    if (!this.props.editing) {
      return React.createElement("div", {className: "regexp"}, "/", this.state.source, "/", this.getFlags())
    }
    return React.createElement("div", {className: "regexp", onChange: this.onChange}, 
      "/", React.createElement("input", {type: "text", name: "source", value: this.state.source}), "/", ' ', 
      React.createElement("label", null, React.createElement("input", {type: "checkbox", name: "g", checked: this.state.g}), "g"), ' ', 
      React.createElement("label", null, React.createElement("input", {type: "checkbox", name: "i", checked: this.state.i}), "i"), ' ', 
      React.createElement("label", null, React.createElement("input", {type: "checkbox", name: "m", checked: this.state.m}), "m"), 
      this.state.errorMessage && React.createElement("p", {className: "error"}, this.state.errorMessage)
    )
  }
})

var StringEditor = React.createClass({displayName: 'StringEditor',
  mixins: [ValueEditorMixin],
  propTypes: {
    value: React.PropTypes.string
  },
  onChange:function(e) {
    this.props.onChange(makeObj(this.props.prop, {$set: e.target.value}))
  },
  render:function() {
    if (!this.props.editing) {
      return React.createElement("div", {className: "string"}, this.props.value)
    }
    return React.createElement("div", {className: "string"}, 
      React.createElement("input", {type: "text", value: this.props.value, onChange: this.onChange})
    )
  }
})

// Other components

var AddProperty = React.createClass({displayName: 'AddProperty',
  propTypes: {
    defaultProp: React.PropTypes.string
  , onAdd: React.PropTypes.func.isRequired
  , onCancel: React.PropTypes.func.isRequired
  , onValidateProp: React.PropTypes.func
  , placeholder: React.PropTypes.string
  },
  getDefaultProps:function() {
    return {
      placeholder: ''
    , onValidateProp:function(prop) { return true }
    }
  },
  getInitialState:function() {
    return {
      prop: this.props.defaultProp || ''
    , type: Object.keys(TYPE_TO_FACTORY)[0]
    , hasChanged: false
    }
  },
  componentDidMount:function() {
    this.refs.prop.getDOMNode().focus()
  },
  shouldComponentUpdate:function(nextProps, nextState) {
    return (this.state !== nextState)
  },
  handleChange:function(e) {
    var el = e.target
    var change = makeObj(el.name, {$set: el.value})
    if (!this.state.hasChanged) {
      change.hasChanged = {$set: true}
    }
    var newState = React.addons.update(this.state, change)
    this.setState(newState)
  },
  handleKeyDown:function(e) {
    if (e.key == 'Enter') {
      this.handleAdd()
    }
    else if (e.key == 'Escape') {
      this.handleCancel()
    }
  },
  handleAdd:function() {
    if (this.props.onValidateProp(this.state.prop)) {
      this.props.onAdd(this.state.prop, TYPE_TO_FACTORY[this.state.type]())
    }
  },
  handleCancel:function() {
    this.props.onCancel()
  },
  render:function() {
    return React.createElement("span", {onKeyDown: this.handleKeyDown}, 
      React.createElement("input", {type: "text", name: "prop", ref: "prop", value: this.state.prop, 
        className: cx({invalid: this.state.hasChanged && !this.props.onValidateProp(this.state.prop)}), 
        placeholder: this.props.placeholder, 
        onChange: this.handleChange}
      ), ' ', 
      React.createElement("select", {name: "type", selectedValue: this.state.type, onChange: this.handleChange}, 
        Object.keys(TYPE_TO_FACTORY).map(function(type)  {return React.createElement("option", {value: type}, type);})
      ), ' ', 
      React.createElement("button", {type: "button", onClick: this.handleAdd}, "+"), ' ', 
      React.createElement("button", {type: "button", onClick: this.handleCancel}, "×")
    )
  }
})

var TYPE_TO_EDITOR = {
  array: ArrayEditor
, boolean: BooleanEditor
, date: DateEditor
, number: NumberEditor
, object: ObjectEditor
, regexp: RegExpEditor
, string: StringEditor
}

var TYPE_TO_FACTORY = {
  array:function() { return [] }
, boolean:function() { return false }
, date:function() { return new Date() }
, number:function() { return  0 }
, object:function() { return {} }
, regexp:function() { return new RegExp('') }
, string:function() { return '' }
}

module.exports = ObjectEditor
},{}]},{},[1])(1)
});