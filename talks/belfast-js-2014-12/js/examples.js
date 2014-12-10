void function() { 'use strict';

var StatefulSwitch = React.createClass({
  getInitialState: function() {
    return {on: false}
  },
  _onToggle: function() {
    var on = !this.state.on
    this.setState({on: on})
  },
  render: function() {
    var status = this.state.on ? 'on' : 'off'
    return React.createElement('button', {type: 'button', onClick: this._onToggle},
      status
    )
  }
})

var Switch = React.createClass({
  propTypes: {
    on: React.PropTypes.bool.isRequired
  },
  _onToggle: function() {
    this.props.onChange(!this.props.on)
  },
  render: function() {
    var status = this.props.on ? 'on' : 'off'
    return React.createElement('div', null,
      React.createElement('button', {
        onClick: this._onToggle,
        style: {borderStyle: this.props.on ? 'inset' : 'outset', outline: 'none'},
        type: 'button'
      }, status)
    )
  }
})

var Bulb = React.createClass({
  render: function() {
    var status = this.props.on ? 'on' : 'off'
    return React.createElement('img', {src: 'img/bulb-' + status + '.png'})
  }
})

var Room = React.createClass({
  getInitialState: function() {
    return {switchOn: false}
  },
  onSwitchChanged: function(switchOn) {
    this.setState({switchOn: switchOn})
    document.body.classList.toggle('lit')
  },
  render: function() {
    return React.createElement('div', null,
      React.createElement(Bulb, {on: this.state.switchOn}),
      React.createElement(Switch, {on: this.state.switchOn, onChange: this.onSwitchChanged})
    )
  }
})

var EditInput = React.createClass({
  propTypes: {
    onCancel: React.PropTypes.func.isRequired
  , onSubmit: React.PropTypes.func.isRequired
  },

  getDefaultProps: function() {
    return {
      autoFocus: true
    , cancelButton: 'Cancel'
    , defaultValue: ''
    , required: true
    , size: 15
    , submitButton: 'Submit'
    , trim: true
    , wrapper: 'span'
    }
  },

  componentDidMount: function() {
    if (this.props.autoFocus) {
      this.refs.input.getDOMNode().focus()
    }
  },

  _onSubmit: function() {
    var value = this.refs.input.getDOMNode().value
    if (this.props.trim) {
      value = value.replace(/^\s+|\s+$/g, '')
    }
    if (this.props.required && !value) {
      return
    }
    this.props.onSubmit(value)
  },

  _onCancel: function() {
    this.props.onCancel()
  },

  _onKeyDown: function(e) {
    if (e.key == 'Enter') {
      this.submit()
    }
    else if (e.key == 'Escape') {
      this.cancel()
    }
  },

  render: function() {
    var attrs = {}
    if (this.props.className) {
      attrs.className = this.props.className
    }
    return React.createElement(this.props.wrapper, attrs,
      React.createElement('input', {
        defaultValue: this.props.defaultValue
      , onKeyDown: this.handleKeyDown
      , ref: 'input'
      , size: this.props.size
      , type: 'text'
      }), ' ',
      React.createElement('button', {
        onClick: this._onSubmit
      , type: 'button'
      }, this.props.submitButton), ' ',
      React.createElement('button', {
        onClick: this._onCancel
      , type: 'button'
      }, this.props.cancelButton)
    )
  }
})

var EditExample = React.createClass({
  getInitialState: function() {
    return {
      editing: {}
    , values: {
        location: 'Farset Labs'
      , meetup: 'Belfast JS'
      }
    }
  },

  _toggleEditing: function(key) {
    this.state.editing[key] = !this.state.editing[key]
    this.forceUpdate()
  },

  _onEdit: function(key, value) {
    this.state.values[key] = value
    this._toggleEditing(key)
  },

  render: function() {
    return React.createElement('ul', null,
      Object.keys(this.state.values).map(function(key) {
        var toggleEditing = this._toggleEditing.bind(this, key)
        if (this.state.editing[key]) {
          return React.createElement('li', null,
            React.createElement(EditInput, {
              defaultValue: this.state.values[key]
            , onCancel: toggleEditing
            , onSubmit: this._onEdit.bind(this, key)
            , submitButton: 'Save'
            })
          )
        }
        else {
          return React.createElement('li', null,
            this.state.values[key], ' ',
            React.createElement('button', {
              onClick: toggleEditing
            , type: 'button'
            }, 'Edit')
          )
        }
      }.bind(this))
    )
  }
})

React.render(React.createElement(Bulb, {on: false}), document.getElementById('bulb-off-example'))
React.render(React.createElement(Bulb, {on: true}), document.getElementById('bulb-on-example'))
React.render(React.createElement(StatefulSwitch), document.getElementById('stateful-switch-example'))
React.render(React.createElement(Room), document.getElementById('composition-example'))
React.render(React.createElement(EditExample), document.getElementById('reusable-example'))

}()