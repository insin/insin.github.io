require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"BootstrapDevice":[function(require,module,exports){
module.exports=require('nZt+f9');
},{}],"nZt+f9":[function(require,module,exports){
/**
 * Bootstrap 3 device classes.
 * @enum {number}
 */
var BootstrapDevice = {
  XS: 0
, SM: 1
, MD: 2
, LG: 3
}

module.exports = BootstrapDevice
},{}],"KqB9A1":[function(require,module,exports){
/** @jsx React.DOM */
var handlerProps =
  ['handleShow', 'handleShown', 'handleHide', 'handleHidden']

var bsModalEvents = {
  handleShow: 'show.bs.modal'
, handleShown: 'shown.bs.modal'
, handleHide: 'hide.bs.modal'
, handleHidden: 'hidden.bs.modal'
}

var BootstrapModalMixin = {
  propTypes: {
    handleShow: React.PropTypes.func
  , handleShown: React.PropTypes.func
  , handleHide: React.PropTypes.func
  , handleHidden: React.PropTypes.func
  , backdrop: React.PropTypes.bool
  , keyboard: React.PropTypes.bool
  , show: React.PropTypes.bool
  , remote: React.PropTypes.string
  }

, getDefaultProps: function() {
    return {
      backdrop: true
    , keyboard: true
    , show: true
    , remote: ''
    }
  }

, componentDidMount: function() {
    var $modal = $(this.getDOMNode()).modal({
      backdrop: this.props.backdrop
    , keyboard: this.props.keyboard
    , show: this.props.show
    , remote: this.props.remote
    })
    handlerProps.forEach(function(prop) {
      if (this[prop]) {
        $modal.on(bsModalEvents[prop], this[prop])
      }
      if (this.props[prop]) {
        $modal.on(bsModalEvents[prop], this.props[prop])
      }
    }.bind(this))
  }

, componentWillUnmount: function() {
    var $modal = $(this.getDOMNode())
    handlerProps.forEach(function(prop) {
      if (this[prop]) {
        $modal.off(bsModalEvents[prop], this[prop])
      }
      if (this.props[prop]) {
        $modal.off(bsModalEvents[prop], this.props[prop])
      }
    }.bind(this))
  }

, hide: function() {
    $(this.getDOMNode()).modal('hide')
  }

, show: function() {
    $(this.getDOMNode()).modal('show')
  }

, toggle: function() {
    $(this.getDOMNode()).modal('toggle')
  }

, renderCloseButton: function() {
    return React.DOM.button(
      {type:"button",
      className:"close",
      onClick:this.hide,
      dangerouslySetInnerHTML:{__html: '&times'}}
    )
  }
}

module.exports = BootstrapModalMixin
},{}],"BootstrapModalMixin":[function(require,module,exports){
module.exports=require('KqB9A1');
},{}],"3to5+1":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapModalMixin = require('BootstrapModalMixin')
var ContactForm = require('ContactForm')
var GlobalModal = require('GlobalModal')
var IncrementingKeyMixin = require('IncrementingKeyMixin')

var CallYouModal = React.createClass({displayName: 'CallYouModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      sent: false
    }
  }

, render: function() {
    var content, footer
    if (!this.state.sent) {
      content = React.DOM.div(null, 
        React.DOM.p(null, React.DOM.strong(null, "Thank you for your interest in life insurance.")),
        React.DOM.p(null, "One of our experienced agents will be happy to talk to you about your life insurance needs. Simply tell us when you’d like to be contacted, and we’ll call you."),
        React.DOM.p(null, React.DOM.strong(null, "Please fill out the following fields")),
        ContactForm( {ref:"contactForm", email:false, errorDisplay:"tooltip",
          initialData:this.props.contactInfo}
        )
      )
      footer = React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleSubmit}, "Submit")
    }
    else {
      content = React.DOM.div(null, 
        React.DOM.p(null, "Thank you for contacting us. One of our agents will be in touch with you shortly.")
      )
      footer = React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.hide}, "Close")
    }
    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "We’ll call you")
          ),
          React.DOM.div( {className:"modal-body"}, 
            content
         ),
          React.DOM.div( {className:"modal-footer", style:{marginTop: 0}}, 
            footer
          )
        )
      )
    )
  }

, handleSubmit: function() {
    var data = this.refs.contactForm.getFormData()
    if (data !== null) {
      this.props.handleSend(data, function(err) {
        if (err) {
          this.props.handleSetNextGlobalModal(GlobalModal.SERVICE_UNAVAILABLE)
          return this.hide()
        }
        this.setState({sent: true})
      }.bind(this))
    }
  }
})

module.exports = CallYouModal
},{"BootstrapModalMixin":"KqB9A1","ContactForm":"PVz8xM","GlobalModal":"xHjSsx","IncrementingKeyMixin":"VXZCxs"}],"CallYouModal":[function(require,module,exports){
module.exports=require('3to5+1');
},{}],"PVz8xM":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapDevice = require('BootstrapDevice')
var FormMixin = require('FormMixin')
var LifeQuoteConstants = require('LifeQuoteConstants')

var bsDevice = require('bsDevice')
var $c = require('classNames')
var extend = require('extend')
var stateOptions = require('stateOptions')
var trim = require('trim')
var isZip = require('isZip')

var ContactForm = React.createClass({displayName: 'ContactForm',
  mixins: [FormMixin]

, propTypes: {
    email: React.PropTypes.bool
  , question: React.PropTypes.bool
  , errorDisplay: React.PropTypes.oneOf(['text', 'tooltip']).required
  , initialData: React.PropTypes.object
  }

, getDefaultProps: function() {
    return {
      email: true
    , question: false
    , initialData: {}
    }
  }

, getInitialState: function() {
    return {errors: {}}
  }

, componentWillUpdate: function(nextProps, nextState) {
    if (this.props.errorDisplay == 'tooltip') {
      this.updateErrorTooltips(this.state.errors, nextState.errors, {
        placement: bsDevice() >= BootstrapDevice.MD ? 'auto right' : 'bottom'
      , trigger: 'hover click'
      , animation: false
      , container: 'body'
      })
    }
  }

  /**
   * Given a field reference name, returns the reference name for display of
   * error message for that field.
   * @param {string} fieldRef
   */
, getErrorRef: function(fieldRef) {
    return fieldRef + '-error'
  }

, getFieldRefs: function() {
    var fieldRefs = ['firstName', 'lastName', 'phoneNmbr', 'address', 'city', 'stateCode', 'zipCode']
    if (this.props.email) fieldRefs.push('emailAddr')
    if (this.props.question) fieldRefs.push('question')
    return fieldRefs
  }

, getFormData: function() {
    var data = {}
      , errors = {}
    this.getFieldRefs().forEach(function(fieldRef) {
      data[fieldRef] = trim(this.refs[fieldRef].getDOMNode().value)
      if (!data[fieldRef]) {
        errors[fieldRef] = 'This field is required'
      }
    }.bind(this))
    if (!('phoneNmbr' in errors)) {
      if (/[^-\d]/.test(data.phoneNmbr)) {
        errors.phoneNmbr = 'Invalid characters in phone number'
      }
      else if (data.phoneNmbr.replace(/-/g, '').length < 10) {
        errors.phoneNmbr = 'Must contain at least 10 digits'
      }
    }
    if (!('zipCode' in errors) && !isZip(data.zipCode)) {
      errors.zipCode = 'Must be 5 digts or 5+4 digits'
    }
    if (this.props.email && !('emailAddr' in errors)  && !validator.isEmail(data.emailAddr)) {
      errors.emailAddr = 'Must be a valid email address'
    }
    this.setState({errors: errors})

    for (var error in errors) {
      return null
    }
    data.stateCode = Number(data.stateCode)
    data.currentCustomer = this.refs.currentCustomerYes.getDOMNode().checked ? 'Yes' : 'No'
    return data
  }

, getDefaultValue: function(fieldRef, initialDefaultData) {
    return (fieldRef in this.props.initialData
            ? this.props.initialData[fieldRef]
            : initialDefaultData)
  }

, render: function() {
    return React.DOM.div( {className:"form-horizontal"}, 
      this.textInput('firstName', 'First Name'),
      this.textInput('lastName', 'Last Name'),
      this.textInput('phoneNmbr', 'Phone number'),
      this.props.email && this.textInput('emailAddr', 'Email'),
      this.props.question && this.textarea('question', 'Question'),
      this.textInput('address', 'Address'),
      this.textInput('city', 'City'),
      this.select('stateCode', 'State', stateOptions),
      this.textInput('zipCode', 'Zip Code'),
      this.radioInlines('currentCustomer'
       , 'Are you currently a ' + LifeQuoteConstants.COMPANY + ' Customer?'
       , ['Yes', 'No']
       , {defaultValue: 'No'}
       )
    )
  }

, textInput: function(id, label, kwargs) {
    kwargs = extend({defaultValue: ''}, kwargs)
    var input =
      React.DOM.input( {type:"text", className:"form-control", id:id, ref:id,
        defaultValue:this.getDefaultValue(id, kwargs.defaultValue)}
      )
    return this.formField(id, label, input, kwargs)
  }

, textarea: function(id, label, kwargs) {
    kwargs = extend({defaultValue: ''}, kwargs)
    var textarea =
      React.DOM.textarea( {className:"form-control", id:id, ref:id,
        defaultValue:this.getDefaultValue(id, kwargs.defaultValue)}
      )
    return this.formField(id, label, textarea)
  }

, select: function(id, label, values, kwargs) {
    kwargs = extend({defaultValue: values[0]}, kwargs)
    var options
    if (typeof values == 'function') {
      options = values()
    }
    else {
      options = values.map(function(value) {
        return React.DOM.option( {value:value}, value)
      })
    }
    var select =
      React.DOM.select( {className:"form-control", id:id, ref:id,
        defaultValue:this.getDefaultValue(id, kwargs.defaultValue)}
      , 
        options
      )
    return this.formField(id, label, select, kwargs)
  }

, radioInlines: function(id, label, values, kwargs) {
    kwargs = extend({defaultValue: values[0]}, kwargs)
    var defaultValue = this.getDefaultValue(id, kwargs.defaultValue)
    var radios = values.map(function(value) {
      return React.DOM.label( {className:"radio-inline"}, 
        React.DOM.input( {type:"radio", ref:id + value, name:id, value:value,
          defaultChecked:value === defaultValue}
        ),
        value
      )
    })
    return this.formField(id, label, radios, kwargs)
  }

, formField: function(id, label, field, kwargs) {
    var fieldColClass = 'col-sm-6'
      , hasError = (id in this.state.errors)
      , errorDisplay
    if (this.props.errorDisplay == 'text') {
      fieldColClass = 'col-sm-4'
      errorDisplay = React.DOM.div( {className:"col-sm-4 help-text"}, 
        React.DOM.p( {className:"form-control-static"}, 
          hasError && this.state.errors[id]
        )
      )
    }
    return React.DOM.div( {className:$c('form-group', {'has-error': hasError})}, 
      React.DOM.label( {htmlFor:id, className:"col-sm-4 control-label"}, label),
      React.DOM.div( {className:fieldColClass}, 
        field
      ),
      errorDisplay
    )
  }
})

module.exports = ContactForm
},{"BootstrapDevice":"nZt+f9","FormMixin":"ekW7PL","LifeQuoteConstants":"HMSvHb","bsDevice":"5K0Uhs","classNames":"+4OEgx","extend":"cebLAk","isZip":"8RrSmi","stateOptions":"YYC6db","trim":"/dmAgr"}],"ContactForm":[function(require,module,exports){
module.exports=require('PVz8xM');
},{}],"EmailUsModal":[function(require,module,exports){
module.exports=require('h6y0YB');
},{}],"h6y0YB":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapModalMixin = require('BootstrapModalMixin')
var ContactForm = require('ContactForm')
var GlobalModal = require('GlobalModal')
var IncrementingKeyMixin = require('IncrementingKeyMixin')

var EmailUsModal = React.createClass({displayName: 'EmailUsModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      sent: false
    }
  }

, render: function() {
    var content, footer
    if (!this.state.sent) {
      content = React.DOM.div(null, 
        React.DOM.p(null, React.DOM.strong(null, "Thank you for your interest in life insurance.")),
        React.DOM.p(null, "One of our experienced agents will be happy to answer all your questions. Enter your name, email, and the question you’d like to ask, and an agent will respond within 24 hours."),
        React.DOM.p(null, React.DOM.strong(null, "Please fill out the following fields")),
        ContactForm( {ref:"contactForm", question:true, errorDisplay:"tooltip",
          initialData:this.props.contactInfo}
        )
      )
      footer = React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleSubmit}, "Submit")
    }
    else {
      content = React.DOM.div(null, 
        React.DOM.p(null, "Thank you for contacting us. One of our agents will be in touch with you shortly.")
      )
      footer = React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.hide}, "Close")
    }
    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "Email us")
          ),
          React.DOM.div( {className:"modal-body"}, 
            content
         ),
          React.DOM.div( {className:"modal-footer", style:{marginTop: 0}}, 
            footer
          )
        )
      )
    )
  }

, handleSubmit: function() {
    var data = this.refs.contactForm.getFormData()
    if (data !== null) {
      this.props.handleSend(data, function(err) {
        if (err) {
          this.props.handleSetNextGlobalModal(GlobalModal.SERVICE_UNAVAILABLE)
          return this.hide()
        }
        this.setState({sent: true})
      }.bind(this))
    }
  }
})

module.exports = EmailUsModal
},{"BootstrapModalMixin":"KqB9A1","ContactForm":"PVz8xM","GlobalModal":"xHjSsx","IncrementingKeyMixin":"VXZCxs"}],"ekW7PL":[function(require,module,exports){
var extend = require('extend')

var FormMixin = {
  /**
   * Updates error tooltips on fields which have validation errors.
   */
  updateErrorTooltips: function(prevErrors, newErrors, tooltipOptions) {
    for (var fieldRef in prevErrors) {
      if (typeof newErrors[fieldRef] == 'undefined') {
        $(this.refs[fieldRef].getDOMNode()).tooltip('destroy')
      }
      else if (newErrors[fieldRef] != prevErrors[fieldRef]) {
        $(this.refs[fieldRef].getDOMNode())
          .tooltip('destroy')
          .tooltip(extend({}, tooltipOptions, {title: newErrors[fieldRef]}))
      }
    }
    for (var fieldRef in newErrors) {
      if (typeof prevErrors[fieldRef] == 'undefined') {
        $(this.refs[fieldRef].getDOMNode())
          .tooltip(extend({}, tooltipOptions, {title: newErrors[fieldRef]}))
      }
    }
  }
}

module.exports = FormMixin
},{"extend":"cebLAk"}],"FormMixin":[function(require,module,exports){
module.exports=require('ekW7PL');
},{}],"Gender":[function(require,module,exports){
module.exports=require('yoUnmf');
},{}],"yoUnmf":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeEnum = require('makeEnum')

var Gender = makeEnum(LifeQuoteRefData.GENDER_CODES, 'title')

module.exports = Gender
},{"LifeQuoteRefData":"czoESL","makeEnum":"8VXpes"}],"Genders":[function(require,module,exports){
module.exports=require('QRg+E2');
},{}],"QRg+E2":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeLookup = require('makeLookup')

var Genders = makeLookup(LifeQuoteRefData.GENDER_CODES)

module.exports = Genders
},{"LifeQuoteRefData":"czoESL","makeLookup":"HRTzZ4"}],"m7M5xA":[function(require,module,exports){
/** @jsx React.DOM */
var Gender = require('Gender')
var GeneralInfoModal = require('GeneralInfoModal')
var HealthCode = require('HealthCode')
var HealthCodeModal = require('HealthCodeModal')
var LifeQuoteConstants = require('LifeQuoteConstants')
var NeedsCalculatorModal = require('NeedsCalculatorModal')
var PermanentInsuranceModal = require('PermanentInsuranceModal')
var PolicyAdvisorModal = require('PolicyAdvisorModal')
var ProductCode = require('ProductCode')
var State = require('State')

var $c = require('classNames')
var debounce = require('debounce')
var dollarOptions = require('dollarOptions')
var genderOptions = require('genderOptions')
var healthOptions = require('healthOptions')
var integerOptions = require('integerOptions')
var isZip = require('isZip')
var productOptions = require('productOptions')
var stateOptions = require('stateOptions')

var GeneralInfo = React.createClass({displayName: 'GeneralInfo',
  getInitialState: function() {
    return {
      errors: {}
    , modal: null
    }
  }

, defaults: {
    gender: Gender.MALE
  , age: 35
  , stateCode: State.AL
  , coverage: 250000
  , productCode: ProductCode.TERM
  , healthCode: HealthCode.EXCELLENT
  }

, setActiveModal: function(modal, e) {
    if (e) e.preventDefault()
    this.setState({modal: modal})
  }

, render: function() {
    var modal
    if (this.state.modal === GeneralInfoModal.NEEDS_CALCULATOR)
        modal = NeedsCalculatorModal(
                  {handleAccept:this.handleAcceptCoverage,
                  handleHidden:this.handleModalHidden}
                )
    else if (this.state.modal === GeneralInfoModal.POLICY_ADVISOR)
        modal = PolicyAdvisorModal(
                  {handleSelectProductCode:this.handleSelectProductCode,
                  handleHidden:this.handleModalHidden}
                )
    else if (this.state.modal === GeneralInfoModal.HEALTH_CODE)
        modal = HealthCodeModal(
                  {handleAccept:this.handleAcceptHealthCode,
                  handleHidden:this.handleModalHidden}
                )
    else if (this.state.modal === GeneralInfoModal.PERMANENT_INSURANCE)
        modal = PermanentInsuranceModal(
                  {handleShowGlobalModal:this.handleShowGlobalModal,
                  handleHidden:this.handleModalHidden}
                )

    return React.DOM.div(null, React.DOM.form( {className:"form-horizontal", role:"form"}, 
      React.DOM.div( {className:"panel-body"}, 
        React.DOM.p(null, React.DOM.strong(null, "Simply enter your information for a no-obligation quote.")),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {htmlFor:"gender", className:"col-sm-4 control-label"}, "Gender"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.select( {className:"form-control", ref:"gender", id:"gender", defaultValue:this.props.initialData.gender || this.defaults.gender}, 
              genderOptions()
            )
          )
        ),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {htmlFor:"age", className:"col-sm-4 control-label"}, "Age"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.select( {className:"form-control", ref:"age", id:"age", defaultValue:this.props.initialData.age || this.defaults.age}, 
              integerOptions(25, 70)
            )
          )
        ),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {htmlFor:"stateCode", className:"col-sm-4 control-label"}, "State"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.select( {className:"form-control", ref:"stateCode", id:"stateCode", defaultValue:this.props.initialData.stateCode || this.defaults.stateCode}, 
              stateOptions()
            )
          )
        ),
        React.DOM.div( {className:$c('form-group', {'has-error': 'zipCode' in this.state.errors})}, 
          React.DOM.label( {htmlFor:"zipCode", className:"col-sm-4 control-label"}, "Zip Code"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.input( {className:"form-control", ref:"zipCode", type:"text", id:"zipCode",
              defaultValue:this.props.initialData.zipCode,
              onChange:debounce(this.handleZipChange, 250)}
            )
          ),
          React.DOM.div( {className:"col-sm-4 help-text"}, 
            React.DOM.p( {className:"form-control-static"}, 
              'zipCode' in this.state.errors && this.state.errors.zipCode
            )
          )
        ),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {className:"col-sm-4 control-label"}, "Do you use tobacco products?"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.label( {className:"radio-inline"}, React.DOM.input( {ref:"tobaccoYes", type:"radio", name:"tobacco", defaultChecked:'tobacco' in this.props.initialData && this.props.initialData.tobacco}), " Yes"),
            React.DOM.label( {className:"radio-inline"}, React.DOM.input( {ref:"tobaccoNo", type:"radio", name:"tobacco", defaultChecked:'tobacco' in this.props.initialData ? !this.props.initialData.tobacco : true}), " No")
          )
        ),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {htmlFor:"coverage", className:"col-sm-4 control-label"}, "Amount of coverage"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.select( {className:"form-control", ref:"coverage", id:"coverage", defaultValue:this.props.initialData.coverage || this.defaults.coverage}, 
              dollarOptions(100000, 950000, 50000).concat(dollarOptions(1000000, 3000000, 500000))
            )
          ),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.p( {className:"form-control-static"}, 
              React.DOM.a( {href:"#needscalculator", onClick:this.setActiveModal.bind(null, GeneralInfoModal.NEEDS_CALCULATOR)}, "How much do you need?")
            )
          )
        ),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {htmlFor:"productCode", className:"col-sm-4 control-label"}, "Type of coverage"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.select( {className:"form-control", ref:"productCode", id:"productCode", defaultValue:this.props.initialData.productCode || this.defaults.productCode}, 
              productOptions()
            )
          ),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.p( {className:"form-control-static"}, 
              React.DOM.a( {href:"#policyadvisor", onClick:this.setActiveModal.bind(null, GeneralInfoModal.POLICY_ADVISOR)}, "What kind should you buy?")
            )
          )
        ),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.label( {htmlFor:"healthCode", className:"col-sm-4 control-label"}, "Health category"),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.select( {className:"form-control", ref:"healthCode", id:"healthCode", defaultValue:this.props.initialData.healthCode || this.defaults.healthCode}, 
              healthOptions()
            )
          ),
          React.DOM.div( {className:"col-sm-4"}, 
            React.DOM.p( {className:"form-control-static"}, 
              React.DOM.a( {href:"#healthCode", onClick:this.setActiveModal.bind(null, GeneralInfoModal.HEALTH_CODE)}, "What’s your category?")
            )
          )
        ),
        React.DOM.p(null, React.DOM.strong(null, "Privacy Policy")),
        React.DOM.p(null, "Please read our ", React.DOM.a( {href:LifeQuoteConstants.PRIVACY_POLICY_URL, target:"_blank"}, "privacy policy ", React.DOM.span( {className:"glyphicon glyphicon-share"})), " which explains how we use and protect your personal information."),
        React.DOM.div( {className:"form-group"}, 
          React.DOM.div( {className:"col-sm-8 col-sm-offset-4"}, 
            React.DOM.div( {className:"checkbox"}, 
              React.DOM.label(null, React.DOM.input( {ref:"reviewed", type:"checkbox", defaultChecked:'reviewed' in this.props.initialData && this.props.initialData.reviewed}), " I have reviewed the privacy policy and want to continue")
            )
          )
        ),
        React.DOM.p(null, React.DOM.strong(null, "Thanks for helping us provide you with a more accurate quote."))
      ),
      React.DOM.div( {className:"panel-footer"}, 
        React.DOM.div( {className:"row"}, 
          React.DOM.div( {className:"col-sm-12"}, 
            React.DOM.button( {type:"button", className:"btn btn-default pull-left", disabled:this.props.loading, onClick:this.handleReset}, "Reset"),
            React.DOM.button( {type:"button", className:"btn btn-primary pull-right", disabled:this.props.loading, onClick:this.handleGetQuote}, "Get Quote")
          )
        )
      )
    ),
    modal
    )
  }

, handleZipChange: function() {
    var zipCode = this.refs.zipCode.getDOMNode().value
    if (!zipCode) {
      this.setState({errors: {zipCode: 'A Zip code is required'}})
      return false
    }
    else if (!isZip(zipCode)) {
      this.setState({errors: {zipCode: 'Zip code must be 5 digts or 5+4 digits'}})
      return false
    }
    else {
      this.setState({errors: {}})
      return true
    }
  }

, handleAcceptCoverage: function(coverage) {
    this.refs.coverage.getDOMNode().value =
        Math.min(Math.max(coverage, 100000), 3000000)
  }


, handleSelectProductCode: function(productCode) {
    if (productCode) {
      this.refs.productCode.getDOMNode().value = productCode
    }
  }

, handleAcceptHealthCode: function(healthCode) {
    this.refs.healthCode.getDOMNode().value = healthCode
  }

, handleShowGlobalModal: function(globalModal) {
    this.props.handleShowGlobalModal(globalModal)
  }

, handleModalHidden: function() {
    this.setState({modal: null})
  }

, handleReset: function() {
    ;['gender', 'age', 'stateCode', 'coverage','productCode', 'healthCode']
    .forEach(function(ref) {
      this.refs[ref].getDOMNode().value = this.defaults[ref]
    }.bind(this))
    this.refs.zipCode.getDOMNode().value = this.props.queryParamZipCode
    this.refs.tobaccoNo.getDOMNode().checked = true
    this.refs.reviewed.getDOMNode().checked = false
    this.setState({
      errors: {}
    })
  }

, handleGetQuote: function() {
    if (this.refs.productCode.getDOMNode().value == ProductCode.PERMANENT) {
      return this.setActiveModal(GeneralInfoModal.PERMANENT_INSURANCE)
    }
    if (!this.handleZipChange()) return
    if (!this.refs.reviewed.getDOMNode().checked) {
      return alert('You must indicate that you have read our privacy policy before proceeding.')
    }
    this.props.handleGetQuote({
      gender: this.refs.gender.getDOMNode().value
    , age: Number(this.refs.age.getDOMNode().value)
    , stateCode: Number(this.refs.stateCode.getDOMNode().value)
    , zipCode: this.refs.zipCode.getDOMNode().value
    , tobacco: this.refs.tobaccoYes.getDOMNode().checked
    , coverage: Number(this.refs.coverage.getDOMNode().value)
    , productCode: Number(this.refs.productCode.getDOMNode().value)
    , healthCode: Number(this.refs.healthCode.getDOMNode().value)
    , reviewed: this.refs.reviewed.getDOMNode().checked
    })
  }
})

module.exports = GeneralInfo
},{"Gender":"yoUnmf","GeneralInfoModal":"15CGMz","HealthCode":"NXamBm","HealthCodeModal":"sU8Wq7","LifeQuoteConstants":"HMSvHb","NeedsCalculatorModal":"yaNwZ6","PermanentInsuranceModal":"zH7cD1","PolicyAdvisorModal":"FWVWlm","ProductCode":"ZAGXT/","State":"GzQkK8","classNames":"+4OEgx","debounce":"GCACIz","dollarOptions":"CVUf3I","genderOptions":"31dd5X","healthOptions":"FACMIu","integerOptions":"kec+O2","isZip":"8RrSmi","productOptions":"bftFkp","stateOptions":"YYC6db"}],"GeneralInfo":[function(require,module,exports){
module.exports=require('m7M5xA');
},{}],"15CGMz":[function(require,module,exports){
var GeneralInfoModal = {
  NEEDS_CALCULATOR: 1
, POLICY_ADVISOR: 2
, HEALTH_CODE: 3
, PERMANENT_INSURANCE: 4
}

module.exports = GeneralInfoModal
},{}],"GeneralInfoModal":[function(require,module,exports){
module.exports=require('15CGMz');
},{}],"xHjSsx":[function(require,module,exports){
var GlobalModal = {
  WE_CALL_YOU: 1
, EMAIL_US: 2
, Q_AND_A: 3
, SERVICE_UNAVAILABLE: 4
}

module.exports = GlobalModal
},{}],"GlobalModal":[function(require,module,exports){
module.exports=require('xHjSsx');
},{}],"NXamBm":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeEnum = require('makeEnum')

var HealthCode = makeEnum(LifeQuoteRefData.HEALTH_CODES, 'title')

module.exports = HealthCode
},{"LifeQuoteRefData":"czoESL","makeEnum":"8VXpes"}],"HealthCode":[function(require,module,exports){
module.exports=require('NXamBm');
},{}],"HealthCodeModal":[function(require,module,exports){
module.exports=require('sU8Wq7');
},{}],"sU8Wq7":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapModalMixin = require('BootstrapModalMixin')
var HealthCodes = require('HealthCodes')
var HealthCode = require('HealthCode')
var IncrementingKeyMixin = require('IncrementingKeyMixin')
var LifeQuoteConstants = require('LifeQuoteConstants')
var RadioSelect = require('RadioSelect')

var integerOptions = require('integerOptions')

var HealthCodeModal = React.createClass({displayName: 'HealthCodeModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      suggestedHealthCode: null
    , data: {}
    , errors: {}
    }
  }

, handleReset: function() {
    ;[1, 2, 3, 4, 5, 6, 7, 8, 9, 11].forEach(function(num) {
      this.refs['question' + num].reset()
    }.bind(this))
    this.refs.heightFeet.getDOMNode().selectedIndex = 0
    this.refs.heightInches.getDOMNode().selectedIndex = 0
    this.refs.weight.getDOMNode().value = ''
  }

, handleGetCategory: function() {
    var data = {}
    for (var i = 1; i <= 9; i++) {
      var radios = this.refs['question' + i]
      if (radios.state.selectedIndex === null) {
        radios.getDOMNode().parentNode.scrollIntoView()
        return alert('Please answer Question #' + i)
      }
      data['question' + i] = radios.state.selectedIndex
    }
    if (this.refs.weight.getDOMNode().value == '') {
      this.refs.weight.getDOMNode().parentNode.scrollIntoView()
      return alert('Please fill in your height and weight')
    }
    data.heightFeet = this.refs.heightFeet.getDOMNode().value
    data.heightInches = this.refs.heightInches.getDOMNode().value
    data.weight = this.refs.weight.getDOMNode().value
    if (this.refs.question11.state.selectedIndex === null) {
      this.refs.question11.getDOMNode().parentNode.scrollIntoView()
      return alert('Please answer Question #11')
    }
    data.question11 = this.refs.question11.state.selectedIndex

    // TODO Calculate category
    console.info(data)

    this.setState({
      data: data
    , suggestedHealthCode: HealthCode.GOOD
    })
  }

, handleBack: function() {
    this.setState({suggestedHealthCode: null})
  }

, handleAccept: function() {
    this.props.handleAccept(this.state.suggestedHealthCode)
    this.hide()
  }

, render: function() {
    var body, footer
    if (this.state.suggestedHealthCode == null) {
      body = React.DOM.div(null, 
        React.DOM.p(null, "Pricing for life insurance is based on an overall picture of your health, among other factors. By answering the brief medical questions to help estimate your health category, we can provide you with a more accurate quote. " ),
        React.DOM.p(null, "Your information will not be recorded or saved in any way. All questions are required."),
        React.DOM.form( {ref:"form", role:"form"}, 
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "1. When was the last time you used tobacco?"),
          RadioSelect( {ref:"question1", selectedIndex:this.state.data.question1,
            labels:['Never' , 'None in the last 36 months', 'None in the last 12 months', 'Within the last 12 months']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "2. When was the last time you were treated for alcohol or drug abuse?"),
          RadioSelect( {ref:"question2", selectedIndex:this.state.data.question2,
            labels:['Never', 'Within the last 10 years', '10 or more years ago']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "3. Do you have any DUI convictions?"),
          RadioSelect( {ref:"question3", selectedIndex:this.state.data.question3,
            labels:['No', 'Yes, less than 5 years ago', 'Yes, more than 5 years ago']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "4. How many moving violations have you been convicted of in the last 3 years?"),
          RadioSelect( {ref:"question4", selectedIndex:this.state.data.question4,
            labels:['None or 1', '2', '3 or more', '6 or more']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "5. Do you have parents or siblings that died from cancer, cardiac disease or diabetes?"),
          RadioSelect( {ref:"question5", selectedIndex:this.state.data.question5,
            labels:['None', 'Yes, only 1 parent or sibling prior to age 60', 'Yes, only 1 parent or sibling between ages 61-65', 'More than 1 parent or sibling']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "6. Do you have a history of diabetes, cardiac disease, cancer or stroke?"),
          RadioSelect( {ref:"question6", selectedIndex:this.state.data.question6, labels:['No', 'Yes']})
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "7. Are you taking any medication for high blood pressure?"),
          RadioSelect( {ref:"question7", selectedIndex:this.state.data.question7,
            labels:['No', 'Yes and I am under the age of 50', 'Yes and I am age 50 or over']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "8. What was your last blood pressure reading?"),
          RadioSelect( {ref:"question8", selectedIndex:this.state.data.question8,
            labels:["I don’t know", 'Less than or equal to 140/78', 'Between 140/78 and 140/90 and I am less than age 50', 'Between 140/78 and 150/92 and I am older than 50', '151/93 and higher']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "9. What was your last cholesterol reading?"),
          RadioSelect( {ref:"question9", selectedIndex:this.state.data.question9,
            labels:['I don’t know', 'Less than 210', 'Between 211 and 250', '251-400', '401 or higher']}
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "10. What is your current height and weight?"),
          React.DOM.div( {className:"form-horizontal"}, 
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label( {className:"col-sm-2 control-label", htmlFor:"heightFeet"}, "Feet"),
              React.DOM.div( {className:"col-sm-3"}, 
                React.DOM.select( {id:"heightFeet", ref:"heightFeet", className:"form-control", defaultValue:this.state.data.heightFeet}, integerOptions(4, 6))
              ),
              React.DOM.label( {className:"col-sm-2 control-label", htmlFor:"heightInches"}, "Inches"),
              React.DOM.div( {className:"col-sm-3"}, 
                React.DOM.select( {id:"heightInches", ref:"heightInches", className:"form-control", defaultValue:this.state.data.heightInches}, integerOptions(0, 11))
              )
            ),
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label( {className:"col-sm-2 control-label", htmlFor:"weight"}, "Weight"),
              React.DOM.div( {className:"col-sm-3"}, 
                React.DOM.div( {className:"input-group"}, 
                  React.DOM.input( {type:"text", id:"weight", ref:"weight", className:"form-control", defaultValue:this.state.data.weight}),
                  React.DOM.span( {className:"input-group-addon"}, "lbs")
                )
              )
            )
          )
        ),
        React.DOM.div( {className:"modal-form-group"}, 
          React.DOM.label(null, "11. Do you pilot an airplane or helicpoter?"),
          RadioSelect( {ref:"question11", selectedIndex:this.state.data.question11, labels:['No', 'Yes']})
        )
        ),
        React.DOM.div( {className:"footnotes"}, 
          React.DOM.p(null, "It’s important to know this tool is a guide to the most common underwriting questions, and does not represent every scenario. When you apply for coverage, you will be asked to fill out a full application."),
          React.DOM.p(null, "This estimated health category is not guaranteed.  Your final underwriting class will be determined by the results of any examinations, laboratory results, medical history, and non-medical information developed during the underwriting process. " )
        )
      )
      footer = React.DOM.div(null, 
        React.DOM.button( {type:"button", className:"btn btn-default", onClick:this.handleReset}, "Reset"),
        React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleGetCategory}, "Get your category")
      )
    }
    else {
      body = React.DOM.p(null, 
        " Based on the information provided, your estimated health category is: ", React.DOM.strong(null, HealthCodes[this.state.suggestedHealthCode].title)
      )
      footer = React.DOM.div(null, 
        React.DOM.button( {type:"button", className:"btn btn-default", onClick:this.handleBack}, "Back"),
        React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleAccept}, "Accept")
      )
    }

    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "Determine your health category")
          ),
          React.DOM.div( {className:"modal-body", style:{height: 500, overflowY: 'scroll'}}, 
            body
          ),
          React.DOM.div( {className:"modal-footer", style:{marginTop: 0}}, 
            footer
          )
        )
      )
    )
  }
})

module.exports = HealthCodeModal
},{"BootstrapModalMixin":"KqB9A1","HealthCode":"NXamBm","HealthCodes":"D3LBpa","IncrementingKeyMixin":"VXZCxs","LifeQuoteConstants":"HMSvHb","RadioSelect":"azVkF/","integerOptions":"kec+O2"}],"HealthCodes":[function(require,module,exports){
module.exports=require('D3LBpa');
},{}],"D3LBpa":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeLookup = require('makeLookup')

var HealthCodes = makeLookup(LifeQuoteRefData.HEALTH_CODES)

module.exports = HealthCodes
},{"LifeQuoteRefData":"czoESL","makeLookup":"HRTzZ4"}],"sndzBM":[function(require,module,exports){
/**
 * Displays a help icon which displays help as a popover on hover. This
 * component should only have text as its child content.
 * @jsx React.DOM
 */
var HelpIcon = React.createClass({displayName: 'HelpIcon',
  getDefaultProps: function() {
    return {
      glyphicon: 'question-sign'
    , container: 'body'
    , animation: false
    , trigger: 'hover click'
    , placement: 'auto right'
    }
  }

, render: function() {
    return React.DOM.span( {style:{cursor: 'help'}, className:'glyphicon glyphicon-' + this.props.glyphicon})
  }

, componentDidMount: function() {
    $(this.getDOMNode()).popover({
      content: this.props.children
    , container: this.props.container
    , animation: this.props.animation
    , trigger: this.props.trigger
    , placement: this.props.placement
    })
  }
})

module.exports = HelpIcon
},{}],"HelpIcon":[function(require,module,exports){
module.exports=require('sndzBM');
},{}],"VXZCxs":[function(require,module,exports){
/**
 * Gives a component a key which is never the same in 2 subsequent instances.
 * A hack to force Bootstrap modals to re-initialise state when the same one is
 * displayed repeatedly.
 */
var IncrementingKeyMixin = function() {
  var keySeed = 1
  return {
    getDefaultProps: function() {
      return {
        key: keySeed++
      }
    }
  }
}()

module.exports = IncrementingKeyMixin
},{}],"IncrementingKeyMixin":[function(require,module,exports){
module.exports=require('VXZCxs');
},{}],"LeadService":[function(require,module,exports){
module.exports=require('oubwVl');
},{}],"oubwVl":[function(require,module,exports){
// Mock service calls
function delay() { return 500 + (Math.random() * 1000) }

var LeadService = {
  createLead: function(cb) {
    setTimeout(cb.bind(null, null, {id: new Date().valueOf().toString()}), delay())
  }

, updateLead: function(data, cb) {
    setTimeout(cb.bind(null, null), delay())
  }

, calculateQuote: function(data, cb) {
    setTimeout(cb.bind(null, null, {
      payments:[
        {term: 10, annualPayment: 450.0, monthlyPayment: 45.0}
      , {term: 20, annualPayment: 450.0, monthlyPayment: 45.0}
      , {term: 30, annualPayment: 450.0, monthlyPayment: 45.0}
      ]
    }), delay())
  }
}

module.exports = LeadService
},{}],"LifeQuote":[function(require,module,exports){
module.exports=require('P9ZEFR');
},{}],"P9ZEFR":[function(require,module,exports){
/** @jsx React.DOM */
var CallYouModal = require('CallYouModal')
var EmailUsModal = require('EmailUsModal')
var GeneralInfo = require('GeneralInfo')
var GlobalModal = require('GlobalModal')
var LeadService = require('LeadService')
var LifeQuoteConstants = require('LifeQuoteConstants')
var QAndAModal = require('QAndAModal')
var QuoteInfo = require('QuoteInfo')
var SendQuote = require('SendQuote')
var ServiceUnavailableModal = require('ServiceUnavailableModal')
var States = require('States')
var Step = require('Step')
var TTFN = require('TTFN')
var WTFN = require('WTFN')

var $c = require('classNames')
var extend = require('extend')

var LifeQuote = React.createClass({displayName: 'LifeQuote',
  getInitialState: function() {
    return {
      step: Step.GENERAL_INFO
    , loading: false
    , modal: null
    , nextModal: null
    , generalInfo: {
        zipCode: this.props.queryParamZipCode
      }
    , payments: {}
    , contactInfo: {
        zipCode: this.props.queryParamZipCode
      }
    , lead: null
    }
  }

, setActiveStep: function(step) {
    this.setState({step: step})
  }

, setActiveModal: function(modal, e) {
    if (e) e.preventDefault()
    this.setState({modal: modal})
  }

, setNextModal: function(modal) {
    this.setState({nextModal: modal})
  }

, render: function() {
    var content
    if (this.state.step === Step.GENERAL_INFO)
      content = GeneralInfo(
                  {queryParamZipCode:this.props.queryParamZipCode,
                  initialData:this.state.generalInfo,
                  handleReset:this.handleReset,
                  handleGetQuote:this.handleGetQuote,
                  handleShowGlobalModal:this.setActiveModal,
                  loading:this.state.loading}
                )
    else if (this.state.step === Step.QUOTE_INFO)
      content = QuoteInfo(
                  {generalInfo:this.state.generalInfo,
                  payments:this.state.payments,
                  setActiveStep:this.setActiveStep}
                )
    else if (this.state.step === Step.SEND_QUOTE)
      content = SendQuote(
                  {contactInfo:this.state.contactInfo,
                  setActiveStep:this.setActiveStep,
                  handleSend:this.handleSend,
                  handleShowGlobalModal:this.setActiveModal,
                  loading:this.state.loading}
                )
    else if (this.state.step === Step.TTFN)
      content = (JSON.stringify(this.state).toLowerCase().indexOf('react') == -1
                 ? TTFN(null)
                 : WTFN(null))

    var modal
    if (this.state.modal === GlobalModal.WE_CALL_YOU)
      modal = CallYouModal(
                {contactInfo:this.state.contactInfo,
                handleHidden:this.handleModalHidden,
                handleSend:this.handleSend,
                handleSetNextGlobalModal:this.setNextModal}
              )
    else if (this.state.modal === GlobalModal.EMAIL_US)
      modal = EmailUsModal(
                {contactInfo:this.state.contactInfo,
                handleHidden:this.handleModalHidden,
                handleSend:this.handleSend,
                handleSetNextGlobalModal:this.setNextModal}
              )
    else if (this.state.modal === GlobalModal.Q_AND_A)
      modal = QAndAModal( {handleHidden:this.handleModalHidden})
    else if (this.state.modal === GlobalModal.SERVICE_UNAVAILABLE)
      modal = ServiceUnavailableModal( {handleHidden:this.handleModalHidden})

    return React.DOM.div( {className:this.state.loading ? 'loading' : ''}, 
      React.DOM.div( {className:"row"}, 
        React.DOM.div( {className:"col-sm-9"}, 
          React.DOM.div( {className:"quote-progress clearfix"}, 
            React.DOM.div( {className:$c('col-sm-4', {active: this.state.step === Step.GENERAL_INFO})}, 
              React.DOM.span( {className:"step-number"}, "1"),' ',
              React.DOM.span( {className:"step-name"}, "General Information")
            ),
            React.DOM.div( {className:$c('col-sm-4', {active: this.state.step === Step.QUOTE_INFO})}, 
              React.DOM.span( {className:"step-number"}, "2"),' ',
              React.DOM.span( {className:"step-name"}, "Get your quote")
            ),
            React.DOM.div( {className:$c('col-sm-4', {active: this.state.step === Step.SEND_QUOTE})}, 
              React.DOM.span( {className:"step-number"}, "3"),' ',
              React.DOM.span( {className:"step-name"}, "Send your quote to an agent")
            )
          ),
          React.DOM.div( {className:"panel panel-default"}, 
            content
          )
        ),
        React.DOM.div( {className:"col-sm-3"}, 
          React.DOM.h3( {className:"text-center"}, "Need Assistance?"),
          React.DOM.div( {className:"list-group"}, 
            React.DOM.a( {className:"list-group-item", href:"#callcontact", onClick:this.setActiveModal.bind(null, GlobalModal.WE_CALL_YOU)}, 
              React.DOM.h4( {className:"list-group-item-heading"}, React.DOM.span( {className:"glyphicon glyphicon-phone-alt"}), " We’ll call you"),
              React.DOM.p( {className:"list-group-item-text"}, "Need assistance? A licensed representative will contact you.")
            ),
            React.DOM.a( {className:"list-group-item", href:"#questioncontact", onClick:this.setActiveModal.bind(null, GlobalModal.EMAIL_US)}, 
              React.DOM.h4( {className:"list-group-item-heading"}, React.DOM.span( {className:"glyphicon glyphicon-envelope"}), " Email us"),
              React.DOM.p( {className:"list-group-item-text"}, "Have a specific question? We will get right back to you via email.")
            ),
            React.DOM.a( {className:"list-group-item", href:"#qanda", onClick:this.setActiveModal.bind(null, GlobalModal.Q_AND_A)}, 
              React.DOM.h4( {className:"list-group-item-heading"}, React.DOM.span( {className:"glyphicon glyphicon-info-sign"}), " Questions ", '&', " Answers"),
              React.DOM.p( {className:"list-group-item-text"}, "Look here for answers to commonly-asked questions.")
            )
          ),
          React.DOM.p( {className:"text-center"}, 
            React.DOM.a( {href:LifeQuoteConstants.LOCAL_SALES_AGENT_URL, target:"_blank"}, "Find a Local Sales Agent ", React.DOM.span( {className:"glyphicon glyphicon-share"}))
          )
        )
      ),
      modal
    )
  }

, handleModalHidden: function() {
    if (this.state.nextModal !== null) {
      this.setState({
        modal: this.state.nextModal
      , nextModal: null
      })
    }
    else {
      this.setState({modal: null})
    }
  }

, handleCreateLead: function(next, handleError) {
    LeadService.createLead(function(err, lead) {
      if (err) return handleError(err)
      this.setState({lead: lead})
      next(lead)
    }.bind(this))
  }

, handleGetQuote: function(generalInfo) {
    this.setState({
      generalInfo: generalInfo
    , contactInfo: extend({}, this.state.contactInfo, {
        stateCode: generalInfo.stateCode
      , zipCode: generalInfo.zipCode
      })
    , loading: true
    })

    var handleError = function(err) {
      this.setState({
        loading: false
      , modal: GlobalModal.SERVICE_UNAVAILABLE
      })
    }.bind(this)

    var getQuote = function(lead) {
      if (lead === null) return this.handleCreateLead(getQuote, handleError)

      var data = extend({}, {leadId: lead.id}, generalInfo)

      LeadService.calculateQuote(data, function(err, quote) {
        if (err) return handleError(err)
        this.setState({
          loading: false
        , payments: quote.payments
        , step: Step.QUOTE_INFO
        })
      }.bind(this))
    }.bind(this)

    getQuote(this.state.lead)
  }

, handleSend: function(contactInfo, cb) {
    var updatedContactInfo = extend({}, this.state.contactInfo, contactInfo)
    this.setState({
      contactInfo: updatedContactInfo
    , loading: true
    })

    var handleError = function(err) {
      this.setState({loading: false})
      cb(err)
    }.bind(this)

    var updateLead = function(lead) {
      if (lead === null) return this.handleCreateLead(updateLead, handleError)

      var data = {
        id: lead.id
      , firstName: contactInfo.firstName
      , lastName: contactInfo.lastName
      , phoneNmbr: contactInfo.phoneNmbr
      , address: contactInfo.address + ' ' +
                 contactInfo.city + ', ' +
                 States[contactInfo.stateCode].abbreviation
      , stateCode: contactInfo.stateCode
      , zipCode: contactInfo.zipCode
      , currentCustomer: contactInfo.currentCustomer == 'Yes'
      }
      if (contactInfo.emailAddr) data.emailAddr = contactInfo.emailAddr
      if (contactInfo.question) data.question = contactInfo.question

      LeadService.updateLead(data, function(err) {
        if (err) return handleError(err)
        this.setState({loading: false})
        cb(null)
      }.bind(this))
    }.bind(this)

    updateLead(this.state.lead)
  }
})

module.exports = LifeQuote
},{"CallYouModal":"3to5+1","EmailUsModal":"h6y0YB","GeneralInfo":"m7M5xA","GlobalModal":"xHjSsx","LeadService":"oubwVl","LifeQuoteConstants":"HMSvHb","QAndAModal":"fmYMZv","QuoteInfo":"xdpJhW","SendQuote":"HxXZNQ","ServiceUnavailableModal":"toExiE","States":"pzHWF3","Step":"udG3cr","TTFN":"FmO1zQ","WTFN":"noWzwx","classNames":"+4OEgx","extend":"cebLAk"}],"LifeQuoteConstants":[function(require,module,exports){
module.exports=require('HMSvHb');
},{}],"HMSvHb":[function(require,module,exports){
var COMPANY = 'Merry Widow Insurance Co.'
  , PRIVACY_POLICY_URL = 'http://example.com/privacy_policy'
  , LOCAL_SALES_AGENT_URL = 'http://example.com/find_sales_office'
  , LIFE_INSURANCE_PRODUCTS_URL = 'http://example.com/life_insurance_products'

var LifeQuoteConstants = {
  COMPANY: COMPANY
, PRIVACY_POLICY_URL: PRIVACY_POLICY_URL
, LOCAL_SALES_AGENT_URL: LOCAL_SALES_AGENT_URL
, LIFE_INSURANCE_PRODUCTS_URL: LIFE_INSURANCE_PRODUCTS_URL
}

module.exports = LifeQuoteConstants
},{}],"LifeQuoteRefData":[function(require,module,exports){
module.exports=require('czoESL');
},{}],"czoESL":[function(require,module,exports){
var STATE_CODES = [
  {code: 1,  abbreviation: 'AL', name: 'Alabama'}
, {code: 2,  abbreviation: 'AK', name: 'Alaska'}
, {code: 4,  abbreviation: 'AZ', name: 'Arizona'}
, {code: 5,  abbreviation: 'AR', name: 'Arkansas'}
, {code: 6,  abbreviation: 'CA', name: 'California'}
, {code: 8,  abbreviation: 'CO', name: 'Connecticut'}
, {code: 10, abbreviation: 'DE', name: 'Delaware'}
, {code: 11, abbreviation: 'DC', name: 'District of Columbia'}
, {code: 12, abbreviation: 'FL', name: 'Florida'}
, {code: 13, abbreviation: 'GA', name: 'Georgia'}
, {code: 15, abbreviation: 'HI', name: 'Hawaii'}
, {code: 16, abbreviation: 'ID', name: 'Idaho'}
, {code: 17, abbreviation: 'IL', name: 'Illinois'}
, {code: 18, abbreviation: 'IN', name: 'Indiana'}
, {code: 19, abbreviation: 'IA', name: 'Iowa'}
, {code: 20, abbreviation: 'KS', name: 'Kansas'}
, {code: 21, abbreviation: 'KY', name: 'Kentucky'}
, {code: 22, abbreviation: 'LA', name: 'Louisiana'}
, {code: 23, abbreviation: 'ME', name: 'Maine'}
, {code: 24, abbreviation: 'MD', name: 'Maryland'}
, {code: 25, abbreviation: 'MA', name: 'Massachusetts'}
, {code: 26, abbreviation: 'MI', name: 'Michigan'}
, {code: 27, abbreviation: 'MN', name: 'Minnesota'}
, {code: 28, abbreviation: 'MS', name: 'Mississippi'}
, {code: 29, abbreviation: 'MO', name: 'Missouri'}
, {code: 30, abbreviation: 'MT', name: 'Montana'}
, {code: 31, abbreviation: 'NE', name: 'Nebraska'}
, {code: 32, abbreviation: 'NV', name: 'Nevada'}
, {code: 33, abbreviation: 'NH', name: 'New Hampshire'}
, {code: 34, abbreviation: 'NJ', name: 'New Jersey'}
, {code: 35, abbreviation: 'NM', name: 'New Mexico'}
, {code: 36, abbreviation: 'NY', name: 'New York'}
, {code: 37, abbreviation: 'NC', name: 'North Carolina'}
, {code: 38, abbreviation: 'ND', name: 'North Dakota'}
, {code: 39, abbreviation: 'OH', name: 'Ohio'}
, {code: 40, abbreviation: 'OK', name: 'Oklahoma'}
, {code: 41, abbreviation: 'OR', name: 'Oregon'}
, {code: 42, abbreviation: 'PA', name: 'Pennsylvania'}
, {code: 44, abbreviation: 'RI', name: 'Rhode Island'}
, {code: 45, abbreviation: 'SC', name: 'South Carolina'}
, {code: 46, abbreviation: 'SD', name: 'South Dakota'}
, {code: 47, abbreviation: 'TN', name: 'Tennessee'}
, {code: 48, abbreviation: 'TX', name: 'Texas'}
, {code: 49, abbreviation: 'UT', name: 'Utah'}
, {code: 50, abbreviation: 'VT', name: 'Vermont'}
, {code: 51, abbreviation: 'VA', name: 'Virginia'}
, {code: 53, abbreviation: 'WA', name: 'Washington'}
, {code: 54, abbreviation: 'WV', name: 'West Virginia'}
, {code: 55, abbreviation: 'WI', name: 'Wisconsin'}
, {code: 56, abbreviation: 'WY', name: 'Wyoming'}
]

var PRODUCT_CODES = [
  {code: 1, name: 'Term'}
, {code: 2, name: 'Permanent'}
]

var HEALTH_CODES =  [
  {code: 1, title: 'Fair'}
, {code: 2, title: 'Good'}
, {code: 3, title: 'Very Good'}
, {code: 4, title: 'Excellent'}
]

var GENDER_CODES = [
  {code: 'F', title: 'Female'}
, {code: 'M', title: 'Male'}
]

var LifeQuoteRefData = {
  STATE_CODES: STATE_CODES
, PRODUCT_CODES: PRODUCT_CODES
, HEALTH_CODES: HEALTH_CODES
, GENDER_CODES: GENDER_CODES
}

module.exports = LifeQuoteRefData
},{}],"NeedsCalculatorModal":[function(require,module,exports){
module.exports=require('yaNwZ6');
},{}],"yaNwZ6":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapDevice = require('BootstrapDevice')
var BootstrapModalMixin = require('BootstrapModalMixin')
var FormMixin = require('FormMixin')
var HelpIcon = require('HelpIcon')
var IncrementingKeyMixin = require('IncrementingKeyMixin')

var $c = require('classNames')
var bsDevice = require('bsDevice')
var formatDollars = require('formatDollars')
var trim = require('trim')

var NeedsCalculatorModal = React.createClass({displayName: 'NeedsCalculatorModal',
  mixins: [BootstrapModalMixin, FormMixin, IncrementingKeyMixin]

, fields: {
    'monthlyNetIncome': 'isFloat'
  , 'outstandingMortgageOrRent': 'isFloat'
  , 'currentOutstandingDebts': 'isFloat'
  , 'estCollegeExpensePerChild': 'isFloat'
  , 'estFinalExpenses': 'isFloat'
  , 'currentLiquidAssets': 'isFloat'
  , 'personallyOwnedInsurance': 'isFloat'
  , 'yearsIncomeProvided': 'isInt'
  , 'numCollegeChildren': 'isInt'
  }

, errorMessages: {
    'isFloat': 'Please enter a dollar amount'
  , 'isInt': 'Please enter a number'
  }

, getInitialState: function() {
    return {
      suggestedCoverage: null
    , data: {}
    , errors: {}
    }
  }

, componentWillUpdate: function(nextProps, nextState) {
    this.updateErrorTooltips(this.state.errors, nextState.errors, {
      placement: bsDevice() >= BootstrapDevice.MD ? 'auto right' : 'bottom'
    , trigger: 'hover click'
    , animation: false
    , container: 'body'
    })
  }

, handleReset: function() {
    for (var fieldRef in this.fieldRefs) {
      this.refs[fieldRef].getDOMNode().value = ''
    }
    this.setState({
      data: {}
    , errors: {}
    })
  }

, handleCalculate: function() {
    var data = {}
      , errors = {}
    for (var fieldRef in this.fields) {
      data[fieldRef] = trim(this.refs[fieldRef].getDOMNode().value)
      if (!data[fieldRef]) {
        errors[fieldRef] = 'This field is required'
        continue
      }
      var validation = this.fields[fieldRef]
      if (!validator[validation](data[fieldRef])) {
        errors[fieldRef] = this.errorMessages[validation]
      }
    }
    this.setState({errors: errors})

    var isValid = true
    for (var fieldRef in errors) {
      isValid = false
      break
    }

    if (isValid) {
      // TODO Calculate suggested amount
      console.info(data)

      this.setState({
        data: data
      , suggestedCoverage: 100000
      })
    }
  }

, handleBack: function() {
    this.setState({suggestedCoverage: null})
  }

, handleAccept: function() {
    this.props.handleAccept(this.state.suggestedCoverage)
    this.hide()
  }

, render: function() {
    var body, footer
    if (this.state.suggestedCoverage === null) {
      body = React.DOM.div(null, 
        React.DOM.p(null, "Our needs calculator lets you estimate how much life insurance you may need in addition to the amount you may already own."),
        React.DOM.form( {ref:"form", className:"form-horizontal", role:"form"}, 
          this.renderDollarField('monthlyNetIncome', 'Monthly net income',
            HelpIcon(null, 
              " After-tax earnings per month "
            )
          ),
          this.renderIntegerField('yearsIncomeProvided', 'Number of years you wish to provide income',
            HelpIcon(null, 
              " This number is how many years you would like to generate income for your family members or beneficiaries in order to cover expenses identified. "+
              "Most experts recommend a minimum of 3-5 years. "
            )
          ),
          this.renderDollarField('outstandingMortgageOrRent', 'Outstanding mortgage or rent payments',
            HelpIcon(null, 
              " Include mortgage balance and home equity loan balances. "+
              "Or, determine the sufficient amount for 10 years, or 120 months, of rent. "
            )
          ),
          this.renderDollarField('currentOutstandingDebts', 'Current outstanding debts',
            HelpIcon(null, 
              " Include credit cards, installment credit or other loan debts, such as school and auto. "
            )
          ),
          this.renderIntegerField('numCollegeChildren', 'Number of children to attend college',
            HelpIcon(null, 
              " Number of children who have yet to enter college. This would not include children who have completed college. "+
              "Children who do not require college funding do not need to be included here. "
            )
          ),
          this.renderDollarField('estCollegeExpensePerChild', 'Estimated college expenses per child',
            HelpIcon(null, 
              " Four years at a private institution averages $129,228. "+
              "Four years at a public institution averages $54,356. "+
              "Costs include tuition fees, room and board as reported by the College Board, New York 2007. "
            )
          ),
          this.renderDollarField('estFinalExpenses', 'Estimated final expenses',
            HelpIcon(null, 
              " Final expense costs are the costs associated with a funeral or final estate settlement costs. "+
              "A typical burial costs between $8,000 and $12,000. "
            ),
            {placeholder: '10,000'}
          ),
          this.renderDollarField('currentLiquidAssets', 'Current liquid assets',
            HelpIcon(null, 
              " Liquid assets would include savings and investments, but would not include a 401K or real estate such as a house. "
            )
          ),
          this.renderDollarField('personallyOwnedInsurance', 'Personally owned life insurance',
            HelpIcon(null, 
              " This number should equal the total amount of coverage on your life, including coverage from any individual policies. "
            )
          )
        )
      )
      footer = React.DOM.div(null, 
        React.DOM.button( {type:"button", className:"btn btn-default", onClick:this.handleReset}, "Reset"),
        React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleCalculate}, "Calculate")
      )
    }
    else {
      body = React.DOM.div(null, 
        React.DOM.p(null, "Based on the information entered, you need a total of ", React.DOM.strong(null, formatDollars(this.state.suggestedCoverage)), " in order to cover your life insurance needs."),
        React.DOM.p(null, React.DOM.strong(null, "Note:"), " This calculation does not incorporate any assumptions about investment results, estate taxes or inflation.")
      )
      footer = React.DOM.div(null, 
        React.DOM.button( {type:"button", className:"btn btn-default", onClick:this.handleBack}, "Back"),
        React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleAccept}, "Accept")
      )
    }

    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "Needs Calculator")
          ),
          React.DOM.div( {className:"modal-body"}, 
            body
          ),
          React.DOM.div( {className:"modal-footer", style:{marginTop: 0}}, 
            footer
          )
        )
      )
    )
  }

, renderDollarField: function(id, label, help, kwargs) {
    return this.renderField(id, label, help,
      React.DOM.div( {className:"input-group"}, 
        React.DOM.span( {className:"input-group-addon"}, "$"),
        React.DOM.input( {type:"text", className:"form-control", ref:id, id:id,
          defaultValue:this.state.data[id] || '',
          placeholder:kwargs && kwargs.placeholder || ''}
        )
      )
    )
  }

, renderIntegerField: function(id, label, help) {
    return this.renderField(id, label, help,
      React.DOM.input( {type:"text", className:"form-control", ref:id, id:id,
        defaultValue:this.state.data[id] || ''}
      )
    )
  }

, renderField: function(id, label, help, field) {
    return React.DOM.div( {className:$c('form-group', {'has-error': id in this.state.errors})}, 
      React.DOM.label( {htmlFor:id, className:"col-sm-8 control-label"}, label),
      React.DOM.div( {className:"col-sm-3"}, 
        field
      ),
      React.DOM.div( {className:"col-sm-1"}, 
        React.DOM.p( {className:"form-control-static"}, 
          help
        )
      )
    )
  }
})

module.exports = NeedsCalculatorModal
},{"BootstrapDevice":"nZt+f9","BootstrapModalMixin":"KqB9A1","FormMixin":"ekW7PL","HelpIcon":"sndzBM","IncrementingKeyMixin":"VXZCxs","bsDevice":"5K0Uhs","classNames":"+4OEgx","formatDollars":"STOOgI","trim":"/dmAgr"}],"PermanentInsuranceModal":[function(require,module,exports){
module.exports=require('zH7cD1');
},{}],"zH7cD1":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapModalMixin = require('BootstrapModalMixin')
var GlobalModal = require('GlobalModal')
var IncrementingKeyMixin = require('IncrementingKeyMixin')
var LifeQuoteConstants = require('LifeQuoteConstants')

var PermanentInsuranceModal = React.createClass({displayName: 'PermanentInsuranceModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      globalModal: null
    }
  }

, render: function() {
    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "Permanent Insurance")
          ),
          React.DOM.div( {className:"modal-body"}, 
            React.DOM.p(null, React.DOM.strong(null, "Thanks for your interest in permanent life insurance.")),
            React.DOM.p(null, "The best way to get a quote for permanent life insurance is to speak directly with one of our experienced agents. There are several ways to get in touch with your local agent:"),
            React.DOM.p( {className:"text-center"}, 
              React.DOM.a( {href:LifeQuoteConstants.LOCAL_SALES_AGENT_URL, className:"btn btn-default"}, "Find your local agent ", React.DOM.span( {className:"glyphicon glyphicon-share"})),
              ' ',
              React.DOM.button( {type:"button", className:"btn btn-default", onClick:this.handleShowGlobalModal.bind(null, GlobalModal.WE_CALL_YOU)}, "We’ll call you"),
              ' ',
              React.DOM.button( {type:"button", className:"btn btn-default", onClick:this.handleShowGlobalModal.bind(null, GlobalModal.EMAIL_US)}, "Email us")
            )
          )
        )
      )
    )
  }

, handleShowGlobalModal: function(globalModal) {
    this.setState({globalModal: globalModal})
    this.hide()
  }

, handleHidden: function() {
    if (this.state.globalModal !== null) {
      this.props.handleShowGlobalModal(this.state.globalModal)
    }
  }
})

module.exports = PermanentInsuranceModal
},{"BootstrapModalMixin":"KqB9A1","GlobalModal":"xHjSsx","IncrementingKeyMixin":"VXZCxs","LifeQuoteConstants":"HMSvHb"}],"FWVWlm":[function(require,module,exports){
/** @jsx React.DOM */
var LifeQuoteRefData = require('LifeQuoteRefData')

var BootstrapModalMixin = require('BootstrapModalMixin')
var IncrementingKeyMixin = require('IncrementingKeyMixin')

var PolicyAdvisorModal = React.createClass({displayName: 'PolicyAdvisorModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      policyCode: null
    }
  }

, handleChange: function(e) {
    this.setState({policyCode: e.target.value})
  }

, handleReturnToQuote: function() {
    this.props.handleSelectProductCode(Number(this.state.policyCode))
    this.hide()
  }

, render: function() {
    var radios = LifeQuoteRefData.PRODUCT_CODES.map(function(product) {
      return React.DOM.label( {className:"radio-inline"}, 
        React.DOM.input( {type:"radio", name:"policyCode", value:product.code, onChange:this.handleChange}), product.name
      )
    }.bind(this))
    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "Policy Advisor")
          ),
          React.DOM.div( {className:"modal-body", style:{height: 500, overflowY: 'scroll'}}, 
            React.DOM.p(null, React.DOM.strong(null, "What kind of life insurance policy should you buy?")),
            React.DOM.p(null, "That depends on your needs and budget. A good first step is to determine if your needs are temporary or permanent. For example, a mortgage is a temporary need, because your mortgage will eventually be paid off. Funds for final expenses are permanent, because the need will never go away."),
            React.DOM.table( {className:"table table-bordered"}, 
              React.DOM.thead(null, 
                React.DOM.tr(null, 
                  React.DOM.th(null, "Temporary Needs"),
                  React.DOM.th(null, "Permanent Needs")
                )
              ),
              React.DOM.tbody(null, 
                React.DOM.tr(null, 
                  React.DOM.td(null, "Mortgage"),
                  React.DOM.td(null, "Income replacement")
                ),
                React.DOM.tr(null, 
                  React.DOM.td(null, "College education"),
                  React.DOM.td(null, "Final expenses")
                ),
                React.DOM.tr(null, 
                  React.DOM.td(null, "Child care"),
                  React.DOM.td(null, "Emergency fund")
                )
              )
            ),
            React.DOM.p(null, "Generally speaking, term life insurance is a good fit for people with temporary needs, such as protecting a mortgage or covering costs associated with raising children, such as daily child care. Initially, it’s usually the least expensive coverage you can buy."),
            React.DOM.p(null, "Many people have permanent needs, such as paying for final expenses and replacing income should a breadwinner die prematurely. Permanent insurance lasts for the lifetime of the insured."),

            React.DOM.p(null, React.DOM.strong(null, "What’s the difference between term and permanent life insurance?")),
            React.DOM.table( {className:"table table-bordered"}, 
              React.DOM.thead(null, 
                React.DOM.tr(null, 
                  React.DOM.th(null, "Term"),
                  React.DOM.th(null, "Permanent")
                )
              ),
              React.DOM.tbody(null, 
                React.DOM.tr(null, 
                  React.DOM.td(null, "Lowest initial cost"),
                  React.DOM.td(null, "Fixed premiums")
                ),
                React.DOM.tr(null, 
                  React.DOM.td(null, "More coverage per dollar"),
                  React.DOM.td(null, "Cash value accumulation")
                ),
                React.DOM.tr(null, 
                  React.DOM.td(null, "Premiums will increase after initial term period"),
                  React.DOM.td(null, "Guaranteed cash value")
                ),
                React.DOM.tr(null, 
                  React.DOM.td(null, "Coverage is not permanent(2)"),
                  React.DOM.td(null, "Coverage for life(1), as long as premiums are paid")
                )
              )
            ),

            React.DOM.p(null, React.DOM.strong(null, "Term life insurance")),
            React.DOM.p(null, "Term insurance provides coverage for a specific period of time, such as 10, 20 or 30 years. If you die during that period, the beneficiary you name on your policy receives the death benefit amount. When the term ends, so does your protection, unless you select a term policy that gives you the option of renewing your coverage."),
            React.DOM.p(null, "Term policies don’t build cash value as most permanent life insurance products do. Because of this fact, when you buy a term policy you’re paying for pure protection. So most of the time, term insurance is the least expensive kind of coverage you can buy."),

            React.DOM.p(null, React.DOM.strong(null, "Permanent life insurance")),
            React.DOM.p(null, "Permanent policies provide protection for your entire life by paying a sum to your beneficiary upon your death(1). Most permanent policies build cash value over time, and you can access this cash value for emergencies, opportunities or planned life events such as a college education or retirement."),
            React.DOM.p(null, "There are different types of permanent policies. Whole life policies usually offer level premiums and strong, traditional guarantees, such as a schedule of guaranteed values. Universal life policies normally offer flexible features, such as the ability to change your coverage amount or your payment schedule after you purchase the policy. A variation on universal life, variable universal life allows you to invest your policy’s cash values in fixed accounts and sub-accounts that have the potential to earn market returns. " ),
            React.DOM.p(null, "Finally, single payment whole life is a type of life insurance you buy with one payment. Because the death benefit is higher than the single payment, this kind of life insurance is often a good fit for people looking to transfer wealth."),

            React.DOM.div( {className:"footnotes"}, 
              React.DOM.p(null, "(1) Many permanent policies endow at age 121."),
              React.DOM.p(null, "(2) Some term policies offer the option to continue coverage at the end of the level term period. In most cases, premiums will increase annually as you age.")
            )
          ),
          React.DOM.div( {className:"modal-footer", style:{marginTop: 0}}, 
            radios,
            React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.handleReturnToQuote}, "Return to quote")
          )
        )
      )
    )
  }
})

module.exports = PolicyAdvisorModal
},{"BootstrapModalMixin":"KqB9A1","IncrementingKeyMixin":"VXZCxs","LifeQuoteRefData":"czoESL"}],"PolicyAdvisorModal":[function(require,module,exports){
module.exports=require('FWVWlm');
},{}],"ZAGXT/":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeEnum = require('makeEnum')

var ProductCode = makeEnum(LifeQuoteRefData.PRODUCT_CODES, 'name')

module.exports = ProductCode
},{"LifeQuoteRefData":"czoESL","makeEnum":"8VXpes"}],"ProductCode":[function(require,module,exports){
module.exports=require('ZAGXT/');
},{}],"ProductCodes":[function(require,module,exports){
module.exports=require('vxdtqO');
},{}],"vxdtqO":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeLookup = require('makeLookup')

var ProductCodes = makeLookup(LifeQuoteRefData.PRODUCT_CODES)

module.exports = ProductCodes
},{"LifeQuoteRefData":"czoESL","makeLookup":"HRTzZ4"}],"fmYMZv":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapModalMixin = require('BootstrapModalMixin')
var IncrementingKeyMixin = require('IncrementingKeyMixin')

var QAndAModal = React.createClass({displayName: 'QAndAModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, render: function() {
    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 
            this.renderCloseButton(),
            React.DOM.strong(null, "Questions ", '&', " Answers")
          ),
          React.DOM.div( {className:"modal-body"}, 
            React.DOM.p( {className:"question"}, "Why do you ask for my gender and age?"),
            React.DOM.p(null, "Pricing for life insurance is based on mortality, or in other words, the prediction of how long you will live. That prediction is based on many factors, including your age and gender. Obviously, if you are older, you will likely pass away before someone who is substantially younger. And gender plays a role because statistically speaking, women are likely to live longer than men."),
            React.DOM.p( {className:"question"}, "Why do you ask if I use tobacco products?"),
            React.DOM.p(null, "Pricing for life insurance is based on a prediction of how long you will live. Statistics show people who use tobacco products have a higher mortality rate – or a higher likelihood of passing away sooner – than non-smokers."),
            React.DOM.p( {className:"question"}, "What’s an underwriting class?"),
            React.DOM.p(null, "An underwriting class is a general classification that describes your overall health. These classifications have names like ‘Elite Preferred’ for the healthiest individuals and ‘Standard’ for individuals with generally good health. Your underwriting class directly impacts the price you will pay for coverage, because healthy people tend to live longer."),
            React.DOM.p(null, "The medical questions we ask here help you arrive at an estimated underwriting class, which is then used to calculate your quote. Your answers to the medical questions are not saved in any way.")
          ),
          React.DOM.div( {className:"modal-footer", style:{marginTop: 0}}, 
            React.DOM.button( {type:"button", className:"btn btn-primary", onClick:this.hide}, "Return to quote")
          )
        )
      )
    )
  }
})

module.exports = QAndAModal
},{"BootstrapModalMixin":"KqB9A1","IncrementingKeyMixin":"VXZCxs"}],"QAndAModal":[function(require,module,exports){
module.exports=require('fmYMZv');
},{}],"xdpJhW":[function(require,module,exports){
/** @jsx React.DOM */
var Genders = require('Genders')
var HealthCodes = require('HealthCodes')
var ProductCodes = require('ProductCodes')
var States = require('States')
var Step = require('Step')

var formatDollars = require('formatDollars')

var QuoteInfo = React.createClass({displayName: 'QuoteInfo',
  render: function() {
    var headerRow = [React.DOM.th(null)]
      , annualRow = [React.DOM.th(null, "Annual")]
      , monthlyRow = [React.DOM.th(null, "Monthly")]
    this.props.payments.forEach(function(payment) {
      headerRow.push(React.DOM.th(null, payment.term, " year"))
      annualRow.push(React.DOM.td(null, payment.annualPayment.toFixed(2)))
      monthlyRow.push(React.DOM.td(null, payment.monthlyPayment.toFixed(2)))
    })
    return React.DOM.div(null, 
      React.DOM.div( {className:"panel-body"}, 
        React.DOM.p(null, "Congratulations! You’ve just taken the first step toward securing your loved ones’ financial future. Your life insurance quote is below. What’s next? Forward your quote to one of our experienced agents who will walk you through the application process."),
        React.DOM.div( {className:"row"}, 
          React.DOM.div( {className:"col-sm-6"}, 
            React.DOM.h3(null, "Your Information"),
            React.DOM.table( {className:"table table-bordered"}, 
              React.DOM.tbody(null, 
                React.DOM.tr(null, 
                  React.DOM.th(null, "Gender"),
                  React.DOM.td(null, Genders[this.props.generalInfo.gender].title)
                ),
                React.DOM.tr(null, 
                  React.DOM.th(null, "Age"),
                  React.DOM.td(null, this.props.generalInfo.age)
                ),
                React.DOM.tr(null, 
                  React.DOM.th(null, "State"),
                  React.DOM.td(null, States[this.props.generalInfo.stateCode].abbreviation)
                ),
                React.DOM.tr(null, 
                  React.DOM.th(null, "Tobacco Use"),
                  React.DOM.td(null, this.props.generalInfo.tobacco ? 'Smoker' : 'Non Smoker')
                ),
                React.DOM.tr(null, 
                  React.DOM.th(null, "Amount of coverage"),
                  React.DOM.td(null, formatDollars(this.props.generalInfo.coverage))
                ),
                React.DOM.tr(null, 
                  React.DOM.th(null, "Type of coverage"),
                  React.DOM.td(null, ProductCodes[this.props.generalInfo.productCode].name)
                ),
                React.DOM.tr(null, 
                  React.DOM.th(null, "Underwriting class"),
                  React.DOM.td(null, HealthCodes[this.props.generalInfo.healthCode].title)
                )
              )
            )
          ),
          React.DOM.div( {className:"col-sm-6"}, 
            React.DOM.h3(null, "Term"),
            React.DOM.table( {className:"table table-bordered"}, 
              React.DOM.thead(null, 
                React.DOM.tr(null, 
                  headerRow
                )
              ),
              React.DOM.tbody(null, 
                React.DOM.tr(null, 
                  annualRow
                ),
                React.DOM.tr(null, 
                  monthlyRow
                )
              )
            )
          )
        )
      ),
      React.DOM.div( {className:"panel-footer"}, 
        React.DOM.div( {className:"row"}, 
          React.DOM.div( {className:"col-sm-12"}, 
            React.DOM.button( {type:"button", className:"btn btn-default pull-left", onClick:this.props.setActiveStep.bind(null, Step.GENERAL_INFO)}, "Edit"),
            React.DOM.button( {type:"button", className:"btn btn-primary pull-right", onClick:this.props.setActiveStep.bind(null, Step.SEND_QUOTE)}, "Forward to Agent")
          )
        )
      )
    )
  }
})

module.exports = QuoteInfo
},{"Genders":"QRg+E2","HealthCodes":"D3LBpa","ProductCodes":"vxdtqO","States":"pzHWF3","Step":"udG3cr","formatDollars":"STOOgI"}],"QuoteInfo":[function(require,module,exports){
module.exports=require('xdpJhW');
},{}],"azVkF/":[function(require,module,exports){
/**
 * Displays a list of radio buttons with the given labels and manages tracking
 * of the selected index and label.
 * @jsx React.DOM
 */
var RadioSelect = React.createClass({displayName: 'RadioSelect',
  getInitialState: function() {
    var hasSelectedIndex = (typeof this.props.selectedIndex != 'undefined')
    return {
      selectedIndex: (hasSelectedIndex ? this.props.selectedIndex: null)
    , selectedLabel: (hasSelectedIndex ? this.props.labels[this.props.selectedIndex] : null)
    }
  }

, render: function() {
    var radios = this.props.labels.map(function(label, i) {
      return React.DOM.div( {className:"radio"}, 
        React.DOM.label(null, 
          React.DOM.input( {type:"radio",
            ref:this.props.ref + '_' + i,
            name:this.props.ref,
            value:i,
            checked:this.state.selectedIndex === i,
            onChange:this.handleChange.bind(this, i, label)}),
          label
        )
      )
    }.bind(this))
    return React.DOM.div(null, radios)
  }

, handleChange: function(i, label) {
    this.setState({
      selectedIndex: i
    , selectedLabel: label
    })
  }

, reset: function() {
    this.setState({
      selectedIndex: null
    , selectedLabel: null
    })
  }
})

module.exports = RadioSelect
},{}],"RadioSelect":[function(require,module,exports){
module.exports=require('azVkF/');
},{}],"HxXZNQ":[function(require,module,exports){
/** @jsx React.DOM */
var ContactForm = require('ContactForm')
var GlobalModal = require('GlobalModal')
var Step = require('Step')

var SendQuote = React.createClass({displayName: 'SendQuote',
  render: function() {
    return React.DOM.form( {className:"form-horizontal", role:"form"}, 
      React.DOM.div( {className:"panel-body"}, 
        React.DOM.p(null, "One of our experienced agents will be happy to talk to you about your life insurance needs, and will be with you every step of the way when you purchase your policy. Simply tell us when you’d like to be contacted, and we’ll call you."),
        ContactForm( {ref:"contactForm", errorDisplay:"text",
          initialData:this.props.contactInfo}
        )
      ),
      React.DOM.div( {className:"panel-footer"}, 
        React.DOM.div( {className:"row"}, 
          React.DOM.div( {className:"col-sm-12"}, 
            React.DOM.button( {type:"button", className:"btn btn-default pull-left", onClick:this.props.setActiveStep.bind(null, Step.QUOTE_INFO), disabled:this.props.loading}, "Back to Results"),
            React.DOM.button( {type:"button", className:"btn btn-primary pull-right", onClick:this.handleSend, disabled:this.props.loading}, "Send")
          )
        )
      )
    )
  }

, handleSend: function() {
    var data = this.refs.contactForm.getFormData()
    if (data !== null) {
      this.props.handleSend(data, function(err) {
        if (err) {
          return this.props.handleShowGlobalModal(GlobalModal.SERVICE_UNAVAILABLE)
        }
        this.props.setActiveStep(Step.TTFN)
      }.bind(this))
    }
  }
})

module.exports = SendQuote
},{"ContactForm":"PVz8xM","GlobalModal":"xHjSsx","Step":"udG3cr"}],"SendQuote":[function(require,module,exports){
module.exports=require('HxXZNQ');
},{}],"toExiE":[function(require,module,exports){
/** @jsx React.DOM */
var BootstrapModalMixin = require('BootstrapModalMixin')
var IncrementingKeyMixin = require('IncrementingKeyMixin')
var LifeQuoteConstants = require('LifeQuoteConstants')

var ServiceUnavailableModal = React.createClass({displayName: 'ServiceUnavailableModal',
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, render: function() {
    return React.DOM.div( {className:"modal fade"}, 
      React.DOM.div( {className:"modal-dialog"}, 
        React.DOM.div( {className:"modal-content"}, 
          React.DOM.div( {className:"modal-header"}, 

            this.renderCloseButton(),
            React.DOM.strong(null, "Service Unavailable")
          ),
          React.DOM.div( {className:"modal-body"}, 
            " Thank you for your interest in a life insurance quote. Unfortunately, our service is temporarily unavailable as we work to enhance your experience. To obtain a quote, please ", React.DOM.a( {href:LifeQuoteConstants.LOCAL_SALES_AGENT_URL}, "contact one of our experienced representatives ", React.DOM.span( {className:"glyphicon glyphicon-share"})), " directly. "
          )
        )
      )
    )
  }
})

module.exports = ServiceUnavailableModal
},{"BootstrapModalMixin":"KqB9A1","IncrementingKeyMixin":"VXZCxs","LifeQuoteConstants":"HMSvHb"}],"ServiceUnavailableModal":[function(require,module,exports){
module.exports=require('toExiE');
},{}],"State":[function(require,module,exports){
module.exports=require('GzQkK8');
},{}],"GzQkK8":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeEnum = require('makeEnum')

var State = makeEnum(LifeQuoteRefData.STATE_CODES, 'abbreviation')

module.exports = State
},{"LifeQuoteRefData":"czoESL","makeEnum":"8VXpes"}],"pzHWF3":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var makeLookup = require('makeLookup')

var States = makeLookup(LifeQuoteRefData.STATE_CODES)

module.exports = States
},{"LifeQuoteRefData":"czoESL","makeLookup":"HRTzZ4"}],"States":[function(require,module,exports){
module.exports=require('pzHWF3');
},{}],"Step":[function(require,module,exports){
module.exports=require('udG3cr');
},{}],"udG3cr":[function(require,module,exports){
var Step = {
  GENERAL_INFO: 1
, QUOTE_INFO: 2
, SEND_QUOTE: 3
, TTFN: 4
}

module.exports = Step
},{}],"TTFN":[function(require,module,exports){
module.exports=require('FmO1zQ');
},{}],"FmO1zQ":[function(require,module,exports){
/** @jsx React.DOM */
var LifeQuoteConstants = require('LifeQuoteConstants')

var TTFN = React.createClass({displayName: 'TTFN',
  render: function() {
    return React.DOM.div(null, 
      React.DOM.div( {className:"panel-body"}, 
        React.DOM.p(null, React.DOM.strong(null, "Thanks for sending us your quote")),
        React.DOM.p(null, "One of our agents will be in touch with you shortly to talk about next steps."),
        React.DOM.a( {href:LifeQuoteConstants.LIFE_INSURANCE_PRODUCTS_URL, className:"btn btn-default"}, "Learn More ", React.DOM.span( {className:"glyphicon glyphicon-share"}))
      )
    )
  }
})

module.exports = TTFN
},{"LifeQuoteConstants":"HMSvHb"}],"WTFN":[function(require,module,exports){
module.exports=require('noWzwx');
},{}],"noWzwx":[function(require,module,exports){
/** @jsx React.DOM */
var WTFN = React.createClass({displayName: 'WTFN',
  render: function() {
    return React.DOM.div(null, React.DOM.a( {href:"http://facebook.github.io/react", target:"_blank"}, 
      React.DOM.div( {className:"panel-body react"}, 
        React.DOM.img( {src:"img/react_logo.png"})
      )
    ))
  }
})

module.exports = WTFN
},{}],"5K0Uhs":[function(require,module,exports){
var BootstrapDevice = require('BootstrapDevice')

/**
 * Determines the active Bootstrap 3 device class based on device width or
 * current window width.
 * @return {BootstrapDevice}
 */
function bsDevice() {
  var width = (window.innerWidth > 0 ? window.innerWidth : screen.width)
  if (width < 768) return BootstrapDevice.XS
  if (width < 992) return BootstrapDevice.SM
  if (width < 1200) return BootstrapDevice.MD
  return BootstrapDevice.LG
}

module.exports = bsDevice
},{"BootstrapDevice":"nZt+f9"}],"bsDevice":[function(require,module,exports){
module.exports=require('5K0Uhs');
},{}],"classNames":[function(require,module,exports){
module.exports=require('+4OEgx');
},{}],"+4OEgx":[function(require,module,exports){
/**
 * Creates a className string including some class names conditionally.
 * @param {string=} staticClassName class name(s) which should always be
 *   included.
 * @param {Object.<string, *>} conditionalClassNames an object mapping class
 *   names to a value which indicates if the class name should be included -
 *   class names will be included if their corresponding value is truthy.
 * @return {string}
 */
function classNames(staticClassName, conditionalClassNames) {
  var names = []
  if (typeof conditionalClassNames == 'undefined') {
    conditionalClassNames = staticClassName
  }
  else {
    names.push(staticClassName)
  }
  for (var className in conditionalClassNames) {
    if (!!conditionalClassNames[className]) {
      names.push(className)
    }
  }
  return names.join(' ')
}

module.exports = classNames
},{}],"GCACIz":[function(require,module,exports){
/**
 * From Underscore.js 1.5.2
 * http://underscorejs.org
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 */
function debounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result
  return function() {
    context = this
    args = arguments
    timestamp = new Date()
    var later = function() {
      var last = (new Date()) - timestamp
      if (last < wait) {
        timeout = setTimeout(later, wait - last)
      } else {
        timeout = null
        if (!immediate) result = func.apply(context, args)
      }
    };
    var callNow = immediate && !timeout
    if (!timeout) {
      timeout = setTimeout(later, wait)
    }
    if (callNow) result = func.apply(context, args)
    return result
  }
}

module.exports = debounce
},{}],"debounce":[function(require,module,exports){
module.exports=require('GCACIz');
},{}],"dollarOptions":[function(require,module,exports){
module.exports=require('CVUf3I');
},{}],"CVUf3I":[function(require,module,exports){
/** @jsx React.DOM */
var formatDollars = require('formatDollars')

function dollarOptions(start, endInclusive, step) {
  var options = []
  for (var amount = start; amount <= endInclusive; amount += step) {
    options.push(React.DOM.option( {value:amount}, formatDollars(amount)))
  }
  return options
}

module.exports = dollarOptions
},{"formatDollars":"STOOgI"}],"extend":[function(require,module,exports){
module.exports=require('cebLAk');
},{}],"cebLAk":[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty

function extend(dest) {
  for (var i = 1, l = arguments.length; i < l; i++) {
    var src = arguments[i]
    if (!src || typeof src != 'object') continue
    for (var prop in src) {
      if (!hasOwn.call(src, prop)) continue
      dest[prop] = src[prop]
    }
  }
  return dest
}

module.exports = extend
},{}],81:[function(require,module,exports){
/** @jsx React.DOM */
var LifeQuote = require('LifeQuote')

var zipCodeMatch = /zipCode=(\d{5})/.exec(window.location.href)
var queryParamZipCode = (zipCodeMatch != null ? zipCodeMatch[1] : '')

React.renderComponent(LifeQuote( {queryParamZipCode:queryParamZipCode}),
                      document.getElementById('lifequote'))

},{"LifeQuote":"P9ZEFR"}],"STOOgI":[function(require,module,exports){
function formatDollars(dollars) {
  return '$' + dollars.toLocaleString()
}

module.exports = formatDollars
},{}],"formatDollars":[function(require,module,exports){
module.exports=require('STOOgI');
},{}],"genderOptions":[function(require,module,exports){
module.exports=require('31dd5X');
},{}],"31dd5X":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var refDataOptions = require('refDataOptions')

var genderOptions = refDataOptions.bind(null, LifeQuoteRefData.GENDER_CODES, 'title')

module.exports = genderOptions
},{"LifeQuoteRefData":"czoESL","refDataOptions":"Pq2n4I"}],"healthOptions":[function(require,module,exports){
module.exports=require('FACMIu');
},{}],"FACMIu":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var refDataOptions = require('refDataOptions')

var healthOptions = refDataOptions.bind(null, LifeQuoteRefData.HEALTH_CODES, 'title')

module.exports = healthOptions
},{"LifeQuoteRefData":"czoESL","refDataOptions":"Pq2n4I"}],"integerOptions":[function(require,module,exports){
module.exports=require('kec+O2');
},{}],"kec+O2":[function(require,module,exports){
/** @jsx React.DOM */
function integerOptions(start, endInclusive) {
  var options = []
  for (var i = start; i <= endInclusive; i++) {
    options.push(React.DOM.option( {value:i}, i))
  }
  return options
}

module.exports = integerOptions
},{}],"isZip":[function(require,module,exports){
module.exports=require('8RrSmi');
},{}],"8RrSmi":[function(require,module,exports){
var isZip = function() {
  var ZIP_RE = /^\d{5}(?:-?\d{4})?$/
  return function isZip(value) {
    return ZIP_RE.test(value)
  }
}()

module.exports = isZip
},{}],"8VXpes":[function(require,module,exports){
// Enums for direct access to codes by name (in CONSTANT_CAPS_STYLE)
function makeEnum(refData, nameProp) {
  var enum_ = {}
  refData.forEach(function(data) {
    enum_[data[nameProp].replace(/\s/g, '_').toUpperCase()] = data.code
  })
  return enum_
}

module.exports = makeEnum
},{}],"makeEnum":[function(require,module,exports){
module.exports=require('8VXpes');
},{}],"makeLookup":[function(require,module,exports){
module.exports=require('HRTzZ4');
},{}],"HRTzZ4":[function(require,module,exports){
// Code -> Ref Data Lookups
function makeLookup(refData) {
  var lookup = {}
  refData.forEach(function(data) {
    lookup[data.code] = data
  })
  return lookup
}

module.exports = makeLookup
},{}],"bftFkp":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var refDataOptions = require('refDataOptions')

var productOptions = refDataOptions.bind(null, LifeQuoteRefData.PRODUCT_CODES, 'name')

module.exports = productOptions
},{"LifeQuoteRefData":"czoESL","refDataOptions":"Pq2n4I"}],"productOptions":[function(require,module,exports){
module.exports=require('bftFkp');
},{}],"Pq2n4I":[function(require,module,exports){
/** @jsx React.DOM */
function refDataOptions(refData, optionProp) {
  return refData.map(function(datum) {
    return React.DOM.option( {value:datum.code}, datum[optionProp])
  })
}

module.exports = refDataOptions
},{}],"refDataOptions":[function(require,module,exports){
module.exports=require('Pq2n4I');
},{}],"YYC6db":[function(require,module,exports){
var LifeQuoteRefData = require('LifeQuoteRefData')

var refDataOptions = require('refDataOptions')

var stateOptions = refDataOptions.bind(null, LifeQuoteRefData.STATE_CODES, 'abbreviation')

module.exports = stateOptions
},{"LifeQuoteRefData":"czoESL","refDataOptions":"Pq2n4I"}],"stateOptions":[function(require,module,exports){
module.exports=require('YYC6db');
},{}],"/dmAgr":[function(require,module,exports){
var TRIM_RE = /^\s+|\s+$/g

function trim(string) {
  return string.replace(TRIM_RE, '')
}

module.exports = trim
},{}],"trim":[function(require,module,exports){
module.exports=require('/dmAgr');
},{}]},{},[81])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVGVtcFxcbGlmZXF1b3RlLW1hc3Rlclxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9Cb290c3RyYXBEZXZpY2UuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9Cb290c3RyYXBNb2RhbE1peGluLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvQ2FsbFlvdU1vZGFsLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvQ29udGFjdEZvcm0uanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9FbWFpbFVzTW9kYWwuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9Gb3JtTWl4aW4uanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9HZW5kZXIuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9HZW5kZXJzLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvR2VuZXJhbEluZm8uanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9HZW5lcmFsSW5mb01vZGFsLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvR2xvYmFsTW9kYWwuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9IZWFsdGhDb2RlLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvSGVhbHRoQ29kZU1vZGFsLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvSGVhbHRoQ29kZXMuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9IZWxwSWNvbi5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL0luY3JlbWVudGluZ0tleU1peGluLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvTGVhZFNlcnZpY2UuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9MaWZlUXVvdGUuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9MaWZlUXVvdGVDb25zdGFudHMuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9MaWZlUXVvdGVSZWZEYXRhLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvTmVlZHNDYWxjdWxhdG9yTW9kYWwuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9QZXJtYW5lbnRJbnN1cmFuY2VNb2RhbC5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL1BvbGljeUFkdmlzb3JNb2RhbC5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL1Byb2R1Y3RDb2RlLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvUHJvZHVjdENvZGVzLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvUUFuZEFNb2RhbC5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL1F1b3RlSW5mby5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL1JhZGlvU2VsZWN0LmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvU2VuZFF1b3RlLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvU2VydmljZVVuYXZhaWxhYmxlTW9kYWwuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9TdGF0ZS5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL1N0YXRlcy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL1N0ZXAuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9UVEZOLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvV1RGTi5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL2JzRGV2aWNlLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvY2xhc3NOYW1lcy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL2RlYm91bmNlLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvZG9sbGFyT3B0aW9ucy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL2V4dGVuZC5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL2Zha2VfMTQzM2Q3MzQuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9mb3JtYXREb2xsYXJzLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvZ2VuZGVyT3B0aW9ucy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL2hlYWx0aE9wdGlvbnMuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9pbnRlZ2VyT3B0aW9ucy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL2lzWmlwLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvbWFrZUVudW0uanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9tYWtlTG9va3VwLmpzIiwiQzovVGVtcC9saWZlcXVvdGUtbWFzdGVyL2J1aWxkL21vZHVsZXMvcHJvZHVjdE9wdGlvbnMuanMiLCJDOi9UZW1wL2xpZmVxdW90ZS1tYXN0ZXIvYnVpbGQvbW9kdWxlcy9yZWZEYXRhT3B0aW9ucy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL3N0YXRlT3B0aW9ucy5qcyIsIkM6L1RlbXAvbGlmZXF1b3RlLW1hc3Rlci9idWlsZC9tb2R1bGVzL3RyaW0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBCb290c3RyYXAgMyBkZXZpY2UgY2xhc3Nlcy5cbiAqIEBlbnVtIHtudW1iZXJ9XG4gKi9cbnZhciBCb290c3RyYXBEZXZpY2UgPSB7XG4gIFhTOiAwXG4sIFNNOiAxXG4sIE1EOiAyXG4sIExHOiAzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm9vdHN0cmFwRGV2aWNlIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgaGFuZGxlclByb3BzID1cbiAgWydoYW5kbGVTaG93JywgJ2hhbmRsZVNob3duJywgJ2hhbmRsZUhpZGUnLCAnaGFuZGxlSGlkZGVuJ11cblxudmFyIGJzTW9kYWxFdmVudHMgPSB7XG4gIGhhbmRsZVNob3c6ICdzaG93LmJzLm1vZGFsJ1xuLCBoYW5kbGVTaG93bjogJ3Nob3duLmJzLm1vZGFsJ1xuLCBoYW5kbGVIaWRlOiAnaGlkZS5icy5tb2RhbCdcbiwgaGFuZGxlSGlkZGVuOiAnaGlkZGVuLmJzLm1vZGFsJ1xufVxuXG52YXIgQm9vdHN0cmFwTW9kYWxNaXhpbiA9IHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgaGFuZGxlU2hvdzogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgLCBoYW5kbGVTaG93bjogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgLCBoYW5kbGVIaWRlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICAsIGhhbmRsZUhpZGRlbjogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgLCBiYWNrZHJvcDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgLCBrZXlib2FyZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgLCBzaG93OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICAsIHJlbW90ZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9XG5cbiwgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFja2Ryb3A6IHRydWVcbiAgICAsIGtleWJvYXJkOiB0cnVlXG4gICAgLCBzaG93OiB0cnVlXG4gICAgLCByZW1vdGU6ICcnXG4gICAgfVxuICB9XG5cbiwgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciAkbW9kYWwgPSAkKHRoaXMuZ2V0RE9NTm9kZSgpKS5tb2RhbCh7XG4gICAgICBiYWNrZHJvcDogdGhpcy5wcm9wcy5iYWNrZHJvcFxuICAgICwga2V5Ym9hcmQ6IHRoaXMucHJvcHMua2V5Ym9hcmRcbiAgICAsIHNob3c6IHRoaXMucHJvcHMuc2hvd1xuICAgICwgcmVtb3RlOiB0aGlzLnByb3BzLnJlbW90ZVxuICAgIH0pXG4gICAgaGFuZGxlclByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKHRoaXNbcHJvcF0pIHtcbiAgICAgICAgJG1vZGFsLm9uKGJzTW9kYWxFdmVudHNbcHJvcF0sIHRoaXNbcHJvcF0pXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICAkbW9kYWwub24oYnNNb2RhbEV2ZW50c1twcm9wXSwgdGhpcy5wcm9wc1twcm9wXSlcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpXG4gIH1cblxuLCBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgdmFyICRtb2RhbCA9ICQodGhpcy5nZXRET01Ob2RlKCkpXG4gICAgaGFuZGxlclByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgaWYgKHRoaXNbcHJvcF0pIHtcbiAgICAgICAgJG1vZGFsLm9mZihic01vZGFsRXZlbnRzW3Byb3BdLCB0aGlzW3Byb3BdKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMucHJvcHNbcHJvcF0pIHtcbiAgICAgICAgJG1vZGFsLm9mZihic01vZGFsRXZlbnRzW3Byb3BdLCB0aGlzLnByb3BzW3Byb3BdKVxuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSlcbiAgfVxuXG4sIGhpZGU6IGZ1bmN0aW9uKCkge1xuICAgICQodGhpcy5nZXRET01Ob2RlKCkpLm1vZGFsKCdoaWRlJylcbiAgfVxuXG4sIHNob3c6IGZ1bmN0aW9uKCkge1xuICAgICQodGhpcy5nZXRET01Ob2RlKCkpLm1vZGFsKCdzaG93JylcbiAgfVxuXG4sIHRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgJCh0aGlzLmdldERPTU5vZGUoKSkubW9kYWwoJ3RvZ2dsZScpXG4gIH1cblxuLCByZW5kZXJDbG9zZUJ1dHRvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS5idXR0b24oXG4gICAgICB7dHlwZTpcImJ1dHRvblwiLFxuICAgICAgY2xhc3NOYW1lOlwiY2xvc2VcIixcbiAgICAgIG9uQ2xpY2s6dGhpcy5oaWRlLFxuICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6e19faHRtbDogJyZ0aW1lcyd9fVxuICAgIClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb3RzdHJhcE1vZGFsTWl4aW4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBCb290c3RyYXBNb2RhbE1peGluID0gcmVxdWlyZSgnQm9vdHN0cmFwTW9kYWxNaXhpbicpXG52YXIgQ29udGFjdEZvcm0gPSByZXF1aXJlKCdDb250YWN0Rm9ybScpXG52YXIgR2xvYmFsTW9kYWwgPSByZXF1aXJlKCdHbG9iYWxNb2RhbCcpXG52YXIgSW5jcmVtZW50aW5nS2V5TWl4aW4gPSByZXF1aXJlKCdJbmNyZW1lbnRpbmdLZXlNaXhpbicpXG5cbnZhciBDYWxsWW91TW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDYWxsWW91TW9kYWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNb2RhbE1peGluLCBJbmNyZW1lbnRpbmdLZXlNaXhpbl1cblxuLCBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzZW50OiBmYWxzZVxuICAgIH1cbiAgfVxuXG4sIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbnRlbnQsIGZvb3RlclxuICAgIGlmICghdGhpcy5zdGF0ZS5zZW50KSB7XG4gICAgICBjb250ZW50ID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlRoYW5rIHlvdSBmb3IgeW91ciBpbnRlcmVzdCBpbiBsaWZlIGluc3VyYW5jZS5cIikpLFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIk9uZSBvZiBvdXIgZXhwZXJpZW5jZWQgYWdlbnRzIHdpbGwgYmUgaGFwcHkgdG8gdGFsayB0byB5b3UgYWJvdXQgeW91ciBsaWZlIGluc3VyYW5jZSBuZWVkcy4gU2ltcGx5IHRlbGwgdXMgd2hlbiB5b3XigJlkIGxpa2UgdG8gYmUgY29udGFjdGVkLCBhbmQgd2XigJlsbCBjYWxsIHlvdS5cIiksXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJQbGVhc2UgZmlsbCBvdXQgdGhlIGZvbGxvd2luZyBmaWVsZHNcIikpLFxuICAgICAgICBDb250YWN0Rm9ybSgge3JlZjpcImNvbnRhY3RGb3JtXCIsIGVtYWlsOmZhbHNlLCBlcnJvckRpc3BsYXk6XCJ0b29sdGlwXCIsXG4gICAgICAgICAgaW5pdGlhbERhdGE6dGhpcy5wcm9wcy5jb250YWN0SW5mb31cbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1wcmltYXJ5XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVTdWJtaXR9LCBcIlN1Ym1pdFwiKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnRlbnQgPSBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIlRoYW5rIHlvdSBmb3IgY29udGFjdGluZyB1cy4gT25lIG9mIG91ciBhZ2VudHMgd2lsbCBiZSBpbiB0b3VjaCB3aXRoIHlvdSBzaG9ydGx5LlwiKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1wcmltYXJ5XCIsIG9uQ2xpY2s6dGhpcy5oaWRlfSwgXCJDbG9zZVwiKVxuICAgIH1cbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsIGZhZGVcIn0sIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWRpYWxvZ1wifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1jb250ZW50XCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtaGVhZGVyXCJ9LCBcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQ2xvc2VCdXR0b24oKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJXZeKAmWxsIGNhbGwgeW91XCIpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtYm9keVwifSwgXG4gICAgICAgICAgICBjb250ZW50XG4gICAgICAgICApLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1mb290ZXJcIiwgc3R5bGU6e21hcmdpblRvcDogMH19LCBcbiAgICAgICAgICAgIGZvb3RlclxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcbiAgfVxuXG4sIGhhbmRsZVN1Ym1pdDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLnJlZnMuY29udGFjdEZvcm0uZ2V0Rm9ybURhdGEoKVxuICAgIGlmIChkYXRhICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnByb3BzLmhhbmRsZVNlbmQoZGF0YSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICB0aGlzLnByb3BzLmhhbmRsZVNldE5leHRHbG9iYWxNb2RhbChHbG9iYWxNb2RhbC5TRVJWSUNFX1VOQVZBSUxBQkxFKVxuICAgICAgICAgIHJldHVybiB0aGlzLmhpZGUoKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbnQ6IHRydWV9KVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH1cbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBDYWxsWW91TW9kYWwiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBCb290c3RyYXBEZXZpY2UgPSByZXF1aXJlKCdCb290c3RyYXBEZXZpY2UnKVxudmFyIEZvcm1NaXhpbiA9IHJlcXVpcmUoJ0Zvcm1NaXhpbicpXG52YXIgTGlmZVF1b3RlQ29uc3RhbnRzID0gcmVxdWlyZSgnTGlmZVF1b3RlQ29uc3RhbnRzJylcblxudmFyIGJzRGV2aWNlID0gcmVxdWlyZSgnYnNEZXZpY2UnKVxudmFyICRjID0gcmVxdWlyZSgnY2xhc3NOYW1lcycpXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJylcbnZhciBzdGF0ZU9wdGlvbnMgPSByZXF1aXJlKCdzdGF0ZU9wdGlvbnMnKVxudmFyIHRyaW0gPSByZXF1aXJlKCd0cmltJylcbnZhciBpc1ppcCA9IHJlcXVpcmUoJ2lzWmlwJylcblxudmFyIENvbnRhY3RGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29udGFjdEZvcm0nLFxuICBtaXhpbnM6IFtGb3JtTWl4aW5dXG5cbiwgcHJvcFR5cGVzOiB7XG4gICAgZW1haWw6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gICwgcXVlc3Rpb246IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gICwgZXJyb3JEaXNwbGF5OiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0ZXh0JywgJ3Rvb2x0aXAnXSkucmVxdWlyZWRcbiAgLCBpbml0aWFsRGF0YTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdFxuICB9XG5cbiwgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZW1haWw6IHRydWVcbiAgICAsIHF1ZXN0aW9uOiBmYWxzZVxuICAgICwgaW5pdGlhbERhdGE6IHt9XG4gICAgfVxuICB9XG5cbiwgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge2Vycm9yczoge319XG4gIH1cblxuLCBjb21wb25lbnRXaWxsVXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgIGlmICh0aGlzLnByb3BzLmVycm9yRGlzcGxheSA9PSAndG9vbHRpcCcpIHtcbiAgICAgIHRoaXMudXBkYXRlRXJyb3JUb29sdGlwcyh0aGlzLnN0YXRlLmVycm9ycywgbmV4dFN0YXRlLmVycm9ycywge1xuICAgICAgICBwbGFjZW1lbnQ6IGJzRGV2aWNlKCkgPj0gQm9vdHN0cmFwRGV2aWNlLk1EID8gJ2F1dG8gcmlnaHQnIDogJ2JvdHRvbSdcbiAgICAgICwgdHJpZ2dlcjogJ2hvdmVyIGNsaWNrJ1xuICAgICAgLCBhbmltYXRpb246IGZhbHNlXG4gICAgICAsIGNvbnRhaW5lcjogJ2JvZHknXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGZpZWxkIHJlZmVyZW5jZSBuYW1lLCByZXR1cm5zIHRoZSByZWZlcmVuY2UgbmFtZSBmb3IgZGlzcGxheSBvZlxuICAgKiBlcnJvciBtZXNzYWdlIGZvciB0aGF0IGZpZWxkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGRSZWZcbiAgICovXG4sIGdldEVycm9yUmVmOiBmdW5jdGlvbihmaWVsZFJlZikge1xuICAgIHJldHVybiBmaWVsZFJlZiArICctZXJyb3InXG4gIH1cblxuLCBnZXRGaWVsZFJlZnM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmaWVsZFJlZnMgPSBbJ2ZpcnN0TmFtZScsICdsYXN0TmFtZScsICdwaG9uZU5tYnInLCAnYWRkcmVzcycsICdjaXR5JywgJ3N0YXRlQ29kZScsICd6aXBDb2RlJ11cbiAgICBpZiAodGhpcy5wcm9wcy5lbWFpbCkgZmllbGRSZWZzLnB1c2goJ2VtYWlsQWRkcicpXG4gICAgaWYgKHRoaXMucHJvcHMucXVlc3Rpb24pIGZpZWxkUmVmcy5wdXNoKCdxdWVzdGlvbicpXG4gICAgcmV0dXJuIGZpZWxkUmVmc1xuICB9XG5cbiwgZ2V0Rm9ybURhdGE6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXRhID0ge31cbiAgICAgICwgZXJyb3JzID0ge31cbiAgICB0aGlzLmdldEZpZWxkUmVmcygpLmZvckVhY2goZnVuY3Rpb24oZmllbGRSZWYpIHtcbiAgICAgIGRhdGFbZmllbGRSZWZdID0gdHJpbSh0aGlzLnJlZnNbZmllbGRSZWZdLmdldERPTU5vZGUoKS52YWx1ZSlcbiAgICAgIGlmICghZGF0YVtmaWVsZFJlZl0pIHtcbiAgICAgICAgZXJyb3JzW2ZpZWxkUmVmXSA9ICdUaGlzIGZpZWxkIGlzIHJlcXVpcmVkJ1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSlcbiAgICBpZiAoISgncGhvbmVObWJyJyBpbiBlcnJvcnMpKSB7XG4gICAgICBpZiAoL1teLVxcZF0vLnRlc3QoZGF0YS5waG9uZU5tYnIpKSB7XG4gICAgICAgIGVycm9ycy5waG9uZU5tYnIgPSAnSW52YWxpZCBjaGFyYWN0ZXJzIGluIHBob25lIG51bWJlcidcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRhdGEucGhvbmVObWJyLnJlcGxhY2UoLy0vZywgJycpLmxlbmd0aCA8IDEwKSB7XG4gICAgICAgIGVycm9ycy5waG9uZU5tYnIgPSAnTXVzdCBjb250YWluIGF0IGxlYXN0IDEwIGRpZ2l0cydcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCEoJ3ppcENvZGUnIGluIGVycm9ycykgJiYgIWlzWmlwKGRhdGEuemlwQ29kZSkpIHtcbiAgICAgIGVycm9ycy56aXBDb2RlID0gJ011c3QgYmUgNSBkaWd0cyBvciA1KzQgZGlnaXRzJ1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5lbWFpbCAmJiAhKCdlbWFpbEFkZHInIGluIGVycm9ycykgICYmICF2YWxpZGF0b3IuaXNFbWFpbChkYXRhLmVtYWlsQWRkcikpIHtcbiAgICAgIGVycm9ycy5lbWFpbEFkZHIgPSAnTXVzdCBiZSBhIHZhbGlkIGVtYWlsIGFkZHJlc3MnXG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe2Vycm9yczogZXJyb3JzfSlcblxuICAgIGZvciAodmFyIGVycm9yIGluIGVycm9ycykge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgZGF0YS5zdGF0ZUNvZGUgPSBOdW1iZXIoZGF0YS5zdGF0ZUNvZGUpXG4gICAgZGF0YS5jdXJyZW50Q3VzdG9tZXIgPSB0aGlzLnJlZnMuY3VycmVudEN1c3RvbWVyWWVzLmdldERPTU5vZGUoKS5jaGVja2VkID8gJ1llcycgOiAnTm8nXG4gICAgcmV0dXJuIGRhdGFcbiAgfVxuXG4sIGdldERlZmF1bHRWYWx1ZTogZnVuY3Rpb24oZmllbGRSZWYsIGluaXRpYWxEZWZhdWx0RGF0YSkge1xuICAgIHJldHVybiAoZmllbGRSZWYgaW4gdGhpcy5wcm9wcy5pbml0aWFsRGF0YVxuICAgICAgICAgICAgPyB0aGlzLnByb3BzLmluaXRpYWxEYXRhW2ZpZWxkUmVmXVxuICAgICAgICAgICAgOiBpbml0aWFsRGVmYXVsdERhdGEpXG4gIH1cblxuLCByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCJ9LCBcbiAgICAgIHRoaXMudGV4dElucHV0KCdmaXJzdE5hbWUnLCAnRmlyc3QgTmFtZScpLFxuICAgICAgdGhpcy50ZXh0SW5wdXQoJ2xhc3ROYW1lJywgJ0xhc3QgTmFtZScpLFxuICAgICAgdGhpcy50ZXh0SW5wdXQoJ3Bob25lTm1icicsICdQaG9uZSBudW1iZXInKSxcbiAgICAgIHRoaXMucHJvcHMuZW1haWwgJiYgdGhpcy50ZXh0SW5wdXQoJ2VtYWlsQWRkcicsICdFbWFpbCcpLFxuICAgICAgdGhpcy5wcm9wcy5xdWVzdGlvbiAmJiB0aGlzLnRleHRhcmVhKCdxdWVzdGlvbicsICdRdWVzdGlvbicpLFxuICAgICAgdGhpcy50ZXh0SW5wdXQoJ2FkZHJlc3MnLCAnQWRkcmVzcycpLFxuICAgICAgdGhpcy50ZXh0SW5wdXQoJ2NpdHknLCAnQ2l0eScpLFxuICAgICAgdGhpcy5zZWxlY3QoJ3N0YXRlQ29kZScsICdTdGF0ZScsIHN0YXRlT3B0aW9ucyksXG4gICAgICB0aGlzLnRleHRJbnB1dCgnemlwQ29kZScsICdaaXAgQ29kZScpLFxuICAgICAgdGhpcy5yYWRpb0lubGluZXMoJ2N1cnJlbnRDdXN0b21lcidcbiAgICAgICAsICdBcmUgeW91IGN1cnJlbnRseSBhICcgKyBMaWZlUXVvdGVDb25zdGFudHMuQ09NUEFOWSArICcgQ3VzdG9tZXI/J1xuICAgICAgICwgWydZZXMnLCAnTm8nXVxuICAgICAgICwge2RlZmF1bHRWYWx1ZTogJ05vJ31cbiAgICAgICApXG4gICAgKVxuICB9XG5cbiwgdGV4dElucHV0OiBmdW5jdGlvbihpZCwgbGFiZWwsIGt3YXJncykge1xuICAgIGt3YXJncyA9IGV4dGVuZCh7ZGVmYXVsdFZhbHVlOiAnJ30sIGt3YXJncylcbiAgICB2YXIgaW5wdXQgPVxuICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcInRleHRcIiwgY2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIGlkOmlkLCByZWY6aWQsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTp0aGlzLmdldERlZmF1bHRWYWx1ZShpZCwga3dhcmdzLmRlZmF1bHRWYWx1ZSl9XG4gICAgICApXG4gICAgcmV0dXJuIHRoaXMuZm9ybUZpZWxkKGlkLCBsYWJlbCwgaW5wdXQsIGt3YXJncylcbiAgfVxuXG4sIHRleHRhcmVhOiBmdW5jdGlvbihpZCwgbGFiZWwsIGt3YXJncykge1xuICAgIGt3YXJncyA9IGV4dGVuZCh7ZGVmYXVsdFZhbHVlOiAnJ30sIGt3YXJncylcbiAgICB2YXIgdGV4dGFyZWEgPVxuICAgICAgUmVhY3QuRE9NLnRleHRhcmVhKCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIGlkOmlkLCByZWY6aWQsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTp0aGlzLmdldERlZmF1bHRWYWx1ZShpZCwga3dhcmdzLmRlZmF1bHRWYWx1ZSl9XG4gICAgICApXG4gICAgcmV0dXJuIHRoaXMuZm9ybUZpZWxkKGlkLCBsYWJlbCwgdGV4dGFyZWEpXG4gIH1cblxuLCBzZWxlY3Q6IGZ1bmN0aW9uKGlkLCBsYWJlbCwgdmFsdWVzLCBrd2FyZ3MpIHtcbiAgICBrd2FyZ3MgPSBleHRlbmQoe2RlZmF1bHRWYWx1ZTogdmFsdWVzWzBdfSwga3dhcmdzKVxuICAgIHZhciBvcHRpb25zXG4gICAgaWYgKHR5cGVvZiB2YWx1ZXMgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3B0aW9ucyA9IHZhbHVlcygpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IHZhbHVlcy5tYXAoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0LkRPTS5vcHRpb24oIHt2YWx1ZTp2YWx1ZX0sIHZhbHVlKVxuICAgICAgfSlcbiAgICB9XG4gICAgdmFyIHNlbGVjdCA9XG4gICAgICBSZWFjdC5ET00uc2VsZWN0KCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIGlkOmlkLCByZWY6aWQsXG4gICAgICAgIGRlZmF1bHRWYWx1ZTp0aGlzLmdldERlZmF1bHRWYWx1ZShpZCwga3dhcmdzLmRlZmF1bHRWYWx1ZSl9XG4gICAgICAsIFxuICAgICAgICBvcHRpb25zXG4gICAgICApXG4gICAgcmV0dXJuIHRoaXMuZm9ybUZpZWxkKGlkLCBsYWJlbCwgc2VsZWN0LCBrd2FyZ3MpXG4gIH1cblxuLCByYWRpb0lubGluZXM6IGZ1bmN0aW9uKGlkLCBsYWJlbCwgdmFsdWVzLCBrd2FyZ3MpIHtcbiAgICBrd2FyZ3MgPSBleHRlbmQoe2RlZmF1bHRWYWx1ZTogdmFsdWVzWzBdfSwga3dhcmdzKVxuICAgIHZhciBkZWZhdWx0VmFsdWUgPSB0aGlzLmdldERlZmF1bHRWYWx1ZShpZCwga3dhcmdzLmRlZmF1bHRWYWx1ZSlcbiAgICB2YXIgcmFkaW9zID0gdmFsdWVzLm1hcChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcInJhZGlvLWlubGluZVwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJyYWRpb1wiLCByZWY6aWQgKyB2YWx1ZSwgbmFtZTppZCwgdmFsdWU6dmFsdWUsXG4gICAgICAgICAgZGVmYXVsdENoZWNrZWQ6dmFsdWUgPT09IGRlZmF1bHRWYWx1ZX1cbiAgICAgICAgKSxcbiAgICAgICAgdmFsdWVcbiAgICAgIClcbiAgICB9KVxuICAgIHJldHVybiB0aGlzLmZvcm1GaWVsZChpZCwgbGFiZWwsIHJhZGlvcywga3dhcmdzKVxuICB9XG5cbiwgZm9ybUZpZWxkOiBmdW5jdGlvbihpZCwgbGFiZWwsIGZpZWxkLCBrd2FyZ3MpIHtcbiAgICB2YXIgZmllbGRDb2xDbGFzcyA9ICdjb2wtc20tNidcbiAgICAgICwgaGFzRXJyb3IgPSAoaWQgaW4gdGhpcy5zdGF0ZS5lcnJvcnMpXG4gICAgICAsIGVycm9yRGlzcGxheVxuICAgIGlmICh0aGlzLnByb3BzLmVycm9yRGlzcGxheSA9PSAndGV4dCcpIHtcbiAgICAgIGZpZWxkQ29sQ2xhc3MgPSAnY29sLXNtLTQnXG4gICAgICBlcnJvckRpc3BsYXkgPSBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTQgaGVscC10ZXh0XCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wtc3RhdGljXCJ9LCBcbiAgICAgICAgICBoYXNFcnJvciAmJiB0aGlzLnN0YXRlLmVycm9yc1tpZF1cbiAgICAgICAgKVxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTokYygnZm9ybS1ncm91cCcsIHsnaGFzLWVycm9yJzogaGFzRXJyb3J9KX0sIFxuICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7aHRtbEZvcjppZCwgY2xhc3NOYW1lOlwiY29sLXNtLTQgY29udHJvbC1sYWJlbFwifSwgbGFiZWwpLFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpmaWVsZENvbENsYXNzfSwgXG4gICAgICAgIGZpZWxkXG4gICAgICApLFxuICAgICAgZXJyb3JEaXNwbGF5XG4gICAgKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhY3RGb3JtIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgQm9vdHN0cmFwTW9kYWxNaXhpbiA9IHJlcXVpcmUoJ0Jvb3RzdHJhcE1vZGFsTWl4aW4nKVxudmFyIENvbnRhY3RGb3JtID0gcmVxdWlyZSgnQ29udGFjdEZvcm0nKVxudmFyIEdsb2JhbE1vZGFsID0gcmVxdWlyZSgnR2xvYmFsTW9kYWwnKVxudmFyIEluY3JlbWVudGluZ0tleU1peGluID0gcmVxdWlyZSgnSW5jcmVtZW50aW5nS2V5TWl4aW4nKVxuXG52YXIgRW1haWxVc01vZGFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRW1haWxVc01vZGFsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTW9kYWxNaXhpbiwgSW5jcmVtZW50aW5nS2V5TWl4aW5dXG5cbiwgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2VudDogZmFsc2VcbiAgICB9XG4gIH1cblxuLCByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb250ZW50LCBmb290ZXJcbiAgICBpZiAoIXRoaXMuc3RhdGUuc2VudCkge1xuICAgICAgY29udGVudCA9IFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJUaGFuayB5b3UgZm9yIHlvdXIgaW50ZXJlc3QgaW4gbGlmZSBpbnN1cmFuY2UuXCIpKSxcbiAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJPbmUgb2Ygb3VyIGV4cGVyaWVuY2VkIGFnZW50cyB3aWxsIGJlIGhhcHB5IHRvIGFuc3dlciBhbGwgeW91ciBxdWVzdGlvbnMuIEVudGVyIHlvdXIgbmFtZSwgZW1haWwsIGFuZCB0aGUgcXVlc3Rpb24geW914oCZZCBsaWtlIHRvIGFzaywgYW5kIGFuIGFnZW50IHdpbGwgcmVzcG9uZCB3aXRoaW4gMjQgaG91cnMuXCIpLFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiUGxlYXNlIGZpbGwgb3V0IHRoZSBmb2xsb3dpbmcgZmllbGRzXCIpKSxcbiAgICAgICAgQ29udGFjdEZvcm0oIHtyZWY6XCJjb250YWN0Rm9ybVwiLCBxdWVzdGlvbjp0cnVlLCBlcnJvckRpc3BsYXk6XCJ0b29sdGlwXCIsXG4gICAgICAgICAgaW5pdGlhbERhdGE6dGhpcy5wcm9wcy5jb250YWN0SW5mb31cbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1wcmltYXJ5XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVTdWJtaXR9LCBcIlN1Ym1pdFwiKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnRlbnQgPSBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIlRoYW5rIHlvdSBmb3IgY29udGFjdGluZyB1cy4gT25lIG9mIG91ciBhZ2VudHMgd2lsbCBiZSBpbiB0b3VjaCB3aXRoIHlvdSBzaG9ydGx5LlwiKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1wcmltYXJ5XCIsIG9uQ2xpY2s6dGhpcy5oaWRlfSwgXCJDbG9zZVwiKVxuICAgIH1cbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsIGZhZGVcIn0sIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWRpYWxvZ1wifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1jb250ZW50XCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtaGVhZGVyXCJ9LCBcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQ2xvc2VCdXR0b24oKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJFbWFpbCB1c1wiKVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWJvZHlcIn0sIFxuICAgICAgICAgICAgY29udGVudFxuICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9vdGVyXCIsIHN0eWxlOnttYXJnaW5Ub3A6IDB9fSwgXG4gICAgICAgICAgICBmb290ZXJcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH1cblxuLCBoYW5kbGVTdWJtaXQ6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXRhID0gdGhpcy5yZWZzLmNvbnRhY3RGb3JtLmdldEZvcm1EYXRhKClcbiAgICBpZiAoZGF0YSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5wcm9wcy5oYW5kbGVTZW5kKGRhdGEsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgdGhpcy5wcm9wcy5oYW5kbGVTZXROZXh0R2xvYmFsTW9kYWwoR2xvYmFsTW9kYWwuU0VSVklDRV9VTkFWQUlMQUJMRSlcbiAgICAgICAgICByZXR1cm4gdGhpcy5oaWRlKClcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtzZW50OiB0cnVlfSlcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9XG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gRW1haWxVc01vZGFsIiwidmFyIGV4dGVuZCA9IHJlcXVpcmUoJ2V4dGVuZCcpXG5cbnZhciBGb3JtTWl4aW4gPSB7XG4gIC8qKlxuICAgKiBVcGRhdGVzIGVycm9yIHRvb2x0aXBzIG9uIGZpZWxkcyB3aGljaCBoYXZlIHZhbGlkYXRpb24gZXJyb3JzLlxuICAgKi9cbiAgdXBkYXRlRXJyb3JUb29sdGlwczogZnVuY3Rpb24ocHJldkVycm9ycywgbmV3RXJyb3JzLCB0b29sdGlwT3B0aW9ucykge1xuICAgIGZvciAodmFyIGZpZWxkUmVmIGluIHByZXZFcnJvcnMpIHtcbiAgICAgIGlmICh0eXBlb2YgbmV3RXJyb3JzW2ZpZWxkUmVmXSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAkKHRoaXMucmVmc1tmaWVsZFJlZl0uZ2V0RE9NTm9kZSgpKS50b29sdGlwKCdkZXN0cm95JylcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG5ld0Vycm9yc1tmaWVsZFJlZl0gIT0gcHJldkVycm9yc1tmaWVsZFJlZl0pIHtcbiAgICAgICAgJCh0aGlzLnJlZnNbZmllbGRSZWZdLmdldERPTU5vZGUoKSlcbiAgICAgICAgICAudG9vbHRpcCgnZGVzdHJveScpXG4gICAgICAgICAgLnRvb2x0aXAoZXh0ZW5kKHt9LCB0b29sdGlwT3B0aW9ucywge3RpdGxlOiBuZXdFcnJvcnNbZmllbGRSZWZdfSkpXG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGZpZWxkUmVmIGluIG5ld0Vycm9ycykge1xuICAgICAgaWYgKHR5cGVvZiBwcmV2RXJyb3JzW2ZpZWxkUmVmXSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAkKHRoaXMucmVmc1tmaWVsZFJlZl0uZ2V0RE9NTm9kZSgpKVxuICAgICAgICAgIC50b29sdGlwKGV4dGVuZCh7fSwgdG9vbHRpcE9wdGlvbnMsIHt0aXRsZTogbmV3RXJyb3JzW2ZpZWxkUmVmXX0pKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1NaXhpbiIsInZhciBMaWZlUXVvdGVSZWZEYXRhID0gcmVxdWlyZSgnTGlmZVF1b3RlUmVmRGF0YScpXG5cbnZhciBtYWtlRW51bSA9IHJlcXVpcmUoJ21ha2VFbnVtJylcblxudmFyIEdlbmRlciA9IG1ha2VFbnVtKExpZmVRdW90ZVJlZkRhdGEuR0VOREVSX0NPREVTLCAndGl0bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdlbmRlciIsInZhciBMaWZlUXVvdGVSZWZEYXRhID0gcmVxdWlyZSgnTGlmZVF1b3RlUmVmRGF0YScpXG5cbnZhciBtYWtlTG9va3VwID0gcmVxdWlyZSgnbWFrZUxvb2t1cCcpXG5cbnZhciBHZW5kZXJzID0gbWFrZUxvb2t1cChMaWZlUXVvdGVSZWZEYXRhLkdFTkRFUl9DT0RFUylcblxubW9kdWxlLmV4cG9ydHMgPSBHZW5kZXJzIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgR2VuZGVyID0gcmVxdWlyZSgnR2VuZGVyJylcbnZhciBHZW5lcmFsSW5mb01vZGFsID0gcmVxdWlyZSgnR2VuZXJhbEluZm9Nb2RhbCcpXG52YXIgSGVhbHRoQ29kZSA9IHJlcXVpcmUoJ0hlYWx0aENvZGUnKVxudmFyIEhlYWx0aENvZGVNb2RhbCA9IHJlcXVpcmUoJ0hlYWx0aENvZGVNb2RhbCcpXG52YXIgTGlmZVF1b3RlQ29uc3RhbnRzID0gcmVxdWlyZSgnTGlmZVF1b3RlQ29uc3RhbnRzJylcbnZhciBOZWVkc0NhbGN1bGF0b3JNb2RhbCA9IHJlcXVpcmUoJ05lZWRzQ2FsY3VsYXRvck1vZGFsJylcbnZhciBQZXJtYW5lbnRJbnN1cmFuY2VNb2RhbCA9IHJlcXVpcmUoJ1Blcm1hbmVudEluc3VyYW5jZU1vZGFsJylcbnZhciBQb2xpY3lBZHZpc29yTW9kYWwgPSByZXF1aXJlKCdQb2xpY3lBZHZpc29yTW9kYWwnKVxudmFyIFByb2R1Y3RDb2RlID0gcmVxdWlyZSgnUHJvZHVjdENvZGUnKVxudmFyIFN0YXRlID0gcmVxdWlyZSgnU3RhdGUnKVxuXG52YXIgJGMgPSByZXF1aXJlKCdjbGFzc05hbWVzJylcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJ2RlYm91bmNlJylcbnZhciBkb2xsYXJPcHRpb25zID0gcmVxdWlyZSgnZG9sbGFyT3B0aW9ucycpXG52YXIgZ2VuZGVyT3B0aW9ucyA9IHJlcXVpcmUoJ2dlbmRlck9wdGlvbnMnKVxudmFyIGhlYWx0aE9wdGlvbnMgPSByZXF1aXJlKCdoZWFsdGhPcHRpb25zJylcbnZhciBpbnRlZ2VyT3B0aW9ucyA9IHJlcXVpcmUoJ2ludGVnZXJPcHRpb25zJylcbnZhciBpc1ppcCA9IHJlcXVpcmUoJ2lzWmlwJylcbnZhciBwcm9kdWN0T3B0aW9ucyA9IHJlcXVpcmUoJ3Byb2R1Y3RPcHRpb25zJylcbnZhciBzdGF0ZU9wdGlvbnMgPSByZXF1aXJlKCdzdGF0ZU9wdGlvbnMnKVxuXG52YXIgR2VuZXJhbEluZm8gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHZW5lcmFsSW5mbycsXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yczoge31cbiAgICAsIG1vZGFsOiBudWxsXG4gICAgfVxuICB9XG5cbiwgZGVmYXVsdHM6IHtcbiAgICBnZW5kZXI6IEdlbmRlci5NQUxFXG4gICwgYWdlOiAzNVxuICAsIHN0YXRlQ29kZTogU3RhdGUuQUxcbiAgLCBjb3ZlcmFnZTogMjUwMDAwXG4gICwgcHJvZHVjdENvZGU6IFByb2R1Y3RDb2RlLlRFUk1cbiAgLCBoZWFsdGhDb2RlOiBIZWFsdGhDb2RlLkVYQ0VMTEVOVFxuICB9XG5cbiwgc2V0QWN0aXZlTW9kYWw6IGZ1bmN0aW9uKG1vZGFsLCBlKSB7XG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuICAgIHRoaXMuc2V0U3RhdGUoe21vZGFsOiBtb2RhbH0pXG4gIH1cblxuLCByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2RhbFxuICAgIGlmICh0aGlzLnN0YXRlLm1vZGFsID09PSBHZW5lcmFsSW5mb01vZGFsLk5FRURTX0NBTENVTEFUT1IpXG4gICAgICAgIG1vZGFsID0gTmVlZHNDYWxjdWxhdG9yTW9kYWwoXG4gICAgICAgICAgICAgICAgICB7aGFuZGxlQWNjZXB0OnRoaXMuaGFuZGxlQWNjZXB0Q292ZXJhZ2UsXG4gICAgICAgICAgICAgICAgICBoYW5kbGVIaWRkZW46dGhpcy5oYW5kbGVNb2RhbEhpZGRlbn1cbiAgICAgICAgICAgICAgICApXG4gICAgZWxzZSBpZiAodGhpcy5zdGF0ZS5tb2RhbCA9PT0gR2VuZXJhbEluZm9Nb2RhbC5QT0xJQ1lfQURWSVNPUilcbiAgICAgICAgbW9kYWwgPSBQb2xpY3lBZHZpc29yTW9kYWwoXG4gICAgICAgICAgICAgICAgICB7aGFuZGxlU2VsZWN0UHJvZHVjdENvZGU6dGhpcy5oYW5kbGVTZWxlY3RQcm9kdWN0Q29kZSxcbiAgICAgICAgICAgICAgICAgIGhhbmRsZUhpZGRlbjp0aGlzLmhhbmRsZU1vZGFsSGlkZGVufVxuICAgICAgICAgICAgICAgIClcbiAgICBlbHNlIGlmICh0aGlzLnN0YXRlLm1vZGFsID09PSBHZW5lcmFsSW5mb01vZGFsLkhFQUxUSF9DT0RFKVxuICAgICAgICBtb2RhbCA9IEhlYWx0aENvZGVNb2RhbChcbiAgICAgICAgICAgICAgICAgIHtoYW5kbGVBY2NlcHQ6dGhpcy5oYW5kbGVBY2NlcHRIZWFsdGhDb2RlLFxuICAgICAgICAgICAgICAgICAgaGFuZGxlSGlkZGVuOnRoaXMuaGFuZGxlTW9kYWxIaWRkZW59XG4gICAgICAgICAgICAgICAgKVxuICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUubW9kYWwgPT09IEdlbmVyYWxJbmZvTW9kYWwuUEVSTUFORU5UX0lOU1VSQU5DRSlcbiAgICAgICAgbW9kYWwgPSBQZXJtYW5lbnRJbnN1cmFuY2VNb2RhbChcbiAgICAgICAgICAgICAgICAgIHtoYW5kbGVTaG93R2xvYmFsTW9kYWw6dGhpcy5oYW5kbGVTaG93R2xvYmFsTW9kYWwsXG4gICAgICAgICAgICAgICAgICBoYW5kbGVIaWRkZW46dGhpcy5oYW5kbGVNb2RhbEhpZGRlbn1cbiAgICAgICAgICAgICAgICApXG5cbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdihudWxsLCBSZWFjdC5ET00uZm9ybSgge2NsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCByb2xlOlwiZm9ybVwifSwgXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJTaW1wbHkgZW50ZXIgeW91ciBpbmZvcm1hdGlvbiBmb3IgYSBuby1vYmxpZ2F0aW9uIHF1b3RlLlwiKSksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOlwiZ2VuZGVyXCIsIGNsYXNzTmFtZTpcImNvbC1zbS00IGNvbnRyb2wtbGFiZWxcIn0sIFwiR2VuZGVyXCIpLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uc2VsZWN0KCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIHJlZjpcImdlbmRlclwiLCBpZDpcImdlbmRlclwiLCBkZWZhdWx0VmFsdWU6dGhpcy5wcm9wcy5pbml0aWFsRGF0YS5nZW5kZXIgfHwgdGhpcy5kZWZhdWx0cy5nZW5kZXJ9LCBcbiAgICAgICAgICAgICAgZ2VuZGVyT3B0aW9ucygpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7aHRtbEZvcjpcImFnZVwiLCBjbGFzc05hbWU6XCJjb2wtc20tNCBjb250cm9sLWxhYmVsXCJ9LCBcIkFnZVwiKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnNlbGVjdCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbFwiLCByZWY6XCJhZ2VcIiwgaWQ6XCJhZ2VcIiwgZGVmYXVsdFZhbHVlOnRoaXMucHJvcHMuaW5pdGlhbERhdGEuYWdlIHx8IHRoaXMuZGVmYXVsdHMuYWdlfSwgXG4gICAgICAgICAgICAgIGludGVnZXJPcHRpb25zKDI1LCA3MClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOlwic3RhdGVDb2RlXCIsIGNsYXNzTmFtZTpcImNvbC1zbS00IGNvbnRyb2wtbGFiZWxcIn0sIFwiU3RhdGVcIiksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS00XCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zZWxlY3QoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOlwic3RhdGVDb2RlXCIsIGlkOlwic3RhdGVDb2RlXCIsIGRlZmF1bHRWYWx1ZTp0aGlzLnByb3BzLmluaXRpYWxEYXRhLnN0YXRlQ29kZSB8fCB0aGlzLmRlZmF1bHRzLnN0YXRlQ29kZX0sIFxuICAgICAgICAgICAgICBzdGF0ZU9wdGlvbnMoKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKSxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTokYygnZm9ybS1ncm91cCcsIHsnaGFzLWVycm9yJzogJ3ppcENvZGUnIGluIHRoaXMuc3RhdGUuZXJyb3JzfSl9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOlwiemlwQ29kZVwiLCBjbGFzc05hbWU6XCJjb2wtc20tNCBjb250cm9sLWxhYmVsXCJ9LCBcIlppcCBDb2RlXCIpLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOlwiemlwQ29kZVwiLCB0eXBlOlwidGV4dFwiLCBpZDpcInppcENvZGVcIixcbiAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOnRoaXMucHJvcHMuaW5pdGlhbERhdGEuemlwQ29kZSxcbiAgICAgICAgICAgICAgb25DaGFuZ2U6ZGVib3VuY2UodGhpcy5oYW5kbGVaaXBDaGFuZ2UsIDI1MCl9XG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTQgaGVscC10ZXh0XCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5wKCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sLXN0YXRpY1wifSwgXG4gICAgICAgICAgICAgICd6aXBDb2RlJyBpbiB0aGlzLnN0YXRlLmVycm9ycyAmJiB0aGlzLnN0YXRlLmVycm9ycy56aXBDb2RlXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwiY29sLXNtLTQgY29udHJvbC1sYWJlbFwifSwgXCJEbyB5b3UgdXNlIHRvYmFjY28gcHJvZHVjdHM/XCIpLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJyYWRpby1pbmxpbmVcIn0sIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcInRvYmFjY29ZZXNcIiwgdHlwZTpcInJhZGlvXCIsIG5hbWU6XCJ0b2JhY2NvXCIsIGRlZmF1bHRDaGVja2VkOid0b2JhY2NvJyBpbiB0aGlzLnByb3BzLmluaXRpYWxEYXRhICYmIHRoaXMucHJvcHMuaW5pdGlhbERhdGEudG9iYWNjb30pLCBcIiBZZXNcIiksXG4gICAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtjbGFzc05hbWU6XCJyYWRpby1pbmxpbmVcIn0sIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcInRvYmFjY29Ob1wiLCB0eXBlOlwicmFkaW9cIiwgbmFtZTpcInRvYmFjY29cIiwgZGVmYXVsdENoZWNrZWQ6J3RvYmFjY28nIGluIHRoaXMucHJvcHMuaW5pdGlhbERhdGEgPyAhdGhpcy5wcm9wcy5pbml0aWFsRGF0YS50b2JhY2NvIDogdHJ1ZX0pLCBcIiBOb1wiKVxuICAgICAgICAgIClcbiAgICAgICAgKSxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2h0bWxGb3I6XCJjb3ZlcmFnZVwiLCBjbGFzc05hbWU6XCJjb2wtc20tNCBjb250cm9sLWxhYmVsXCJ9LCBcIkFtb3VudCBvZiBjb3ZlcmFnZVwiKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnNlbGVjdCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbFwiLCByZWY6XCJjb3ZlcmFnZVwiLCBpZDpcImNvdmVyYWdlXCIsIGRlZmF1bHRWYWx1ZTp0aGlzLnByb3BzLmluaXRpYWxEYXRhLmNvdmVyYWdlIHx8IHRoaXMuZGVmYXVsdHMuY292ZXJhZ2V9LCBcbiAgICAgICAgICAgICAgZG9sbGFyT3B0aW9ucygxMDAwMDAsIDk1MDAwMCwgNTAwMDApLmNvbmNhdChkb2xsYXJPcHRpb25zKDEwMDAwMDAsIDMwMDAwMDAsIDUwMDAwMCkpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wtc3RhdGljXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmEoIHtocmVmOlwiI25lZWRzY2FsY3VsYXRvclwiLCBvbkNsaWNrOnRoaXMuc2V0QWN0aXZlTW9kYWwuYmluZChudWxsLCBHZW5lcmFsSW5mb01vZGFsLk5FRURTX0NBTENVTEFUT1IpfSwgXCJIb3cgbXVjaCBkbyB5b3UgbmVlZD9cIilcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOlwicHJvZHVjdENvZGVcIiwgY2xhc3NOYW1lOlwiY29sLXNtLTQgY29udHJvbC1sYWJlbFwifSwgXCJUeXBlIG9mIGNvdmVyYWdlXCIpLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uc2VsZWN0KCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIHJlZjpcInByb2R1Y3RDb2RlXCIsIGlkOlwicHJvZHVjdENvZGVcIiwgZGVmYXVsdFZhbHVlOnRoaXMucHJvcHMuaW5pdGlhbERhdGEucHJvZHVjdENvZGUgfHwgdGhpcy5kZWZhdWx0cy5wcm9kdWN0Q29kZX0sIFxuICAgICAgICAgICAgICBwcm9kdWN0T3B0aW9ucygpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wtc3RhdGljXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmEoIHtocmVmOlwiI3BvbGljeWFkdmlzb3JcIiwgb25DbGljazp0aGlzLnNldEFjdGl2ZU1vZGFsLmJpbmQobnVsbCwgR2VuZXJhbEluZm9Nb2RhbC5QT0xJQ1lfQURWSVNPUil9LCBcIldoYXQga2luZCBzaG91bGQgeW91IGJ1eT9cIilcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOlwiaGVhbHRoQ29kZVwiLCBjbGFzc05hbWU6XCJjb2wtc20tNCBjb250cm9sLWxhYmVsXCJ9LCBcIkhlYWx0aCBjYXRlZ29yeVwiKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnNlbGVjdCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbFwiLCByZWY6XCJoZWFsdGhDb2RlXCIsIGlkOlwiaGVhbHRoQ29kZVwiLCBkZWZhdWx0VmFsdWU6dGhpcy5wcm9wcy5pbml0aWFsRGF0YS5oZWFsdGhDb2RlIHx8IHRoaXMuZGVmYXVsdHMuaGVhbHRoQ29kZX0sIFxuICAgICAgICAgICAgICBoZWFsdGhPcHRpb25zKClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tNFwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbC1zdGF0aWNcIn0sIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uYSgge2hyZWY6XCIjaGVhbHRoQ29kZVwiLCBvbkNsaWNrOnRoaXMuc2V0QWN0aXZlTW9kYWwuYmluZChudWxsLCBHZW5lcmFsSW5mb01vZGFsLkhFQUxUSF9DT0RFKX0sIFwiV2hhdOKAmXMgeW91ciBjYXRlZ29yeT9cIilcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJQcml2YWN5IFBvbGljeVwiKSksXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiUGxlYXNlIHJlYWQgb3VyIFwiLCBSZWFjdC5ET00uYSgge2hyZWY6TGlmZVF1b3RlQ29uc3RhbnRzLlBSSVZBQ1lfUE9MSUNZX1VSTCwgdGFyZ2V0OlwiX2JsYW5rXCJ9LCBcInByaXZhY3kgcG9saWN5IFwiLCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tc2hhcmVcIn0pKSwgXCIgd2hpY2ggZXhwbGFpbnMgaG93IHdlIHVzZSBhbmQgcHJvdGVjdCB5b3VyIHBlcnNvbmFsIGluZm9ybWF0aW9uLlwiKSxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tOCBjb2wtc20tb2Zmc2V0LTRcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNoZWNrYm94XCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFJlYWN0LkRPTS5pbnB1dCgge3JlZjpcInJldmlld2VkXCIsIHR5cGU6XCJjaGVja2JveFwiLCBkZWZhdWx0Q2hlY2tlZDoncmV2aWV3ZWQnIGluIHRoaXMucHJvcHMuaW5pdGlhbERhdGEgJiYgdGhpcy5wcm9wcy5pbml0aWFsRGF0YS5yZXZpZXdlZH0pLCBcIiBJIGhhdmUgcmV2aWV3ZWQgdGhlIHByaXZhY3kgcG9saWN5IGFuZCB3YW50IHRvIGNvbnRpbnVlXCIpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiVGhhbmtzIGZvciBoZWxwaW5nIHVzIHByb3ZpZGUgeW91IHdpdGggYSBtb3JlIGFjY3VyYXRlIHF1b3RlLlwiKSlcbiAgICAgICksXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtZm9vdGVyXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0xMlwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHQgcHVsbC1sZWZ0XCIsIGRpc2FibGVkOnRoaXMucHJvcHMubG9hZGluZywgb25DbGljazp0aGlzLmhhbmRsZVJlc2V0fSwgXCJSZXNldFwiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tcHJpbWFyeSBwdWxsLXJpZ2h0XCIsIGRpc2FibGVkOnRoaXMucHJvcHMubG9hZGluZywgb25DbGljazp0aGlzLmhhbmRsZUdldFF1b3RlfSwgXCJHZXQgUXVvdGVcIilcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApLFxuICAgIG1vZGFsXG4gICAgKVxuICB9XG5cbiwgaGFuZGxlWmlwQ2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgemlwQ29kZSA9IHRoaXMucmVmcy56aXBDb2RlLmdldERPTU5vZGUoKS52YWx1ZVxuICAgIGlmICghemlwQ29kZSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7ZXJyb3JzOiB7emlwQ29kZTogJ0EgWmlwIGNvZGUgaXMgcmVxdWlyZWQnfX0pXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgZWxzZSBpZiAoIWlzWmlwKHppcENvZGUpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtlcnJvcnM6IHt6aXBDb2RlOiAnWmlwIGNvZGUgbXVzdCBiZSA1IGRpZ3RzIG9yIDUrNCBkaWdpdHMnfX0pXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtlcnJvcnM6IHt9fSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG5cbiwgaGFuZGxlQWNjZXB0Q292ZXJhZ2U6IGZ1bmN0aW9uKGNvdmVyYWdlKSB7XG4gICAgdGhpcy5yZWZzLmNvdmVyYWdlLmdldERPTU5vZGUoKS52YWx1ZSA9XG4gICAgICAgIE1hdGgubWluKE1hdGgubWF4KGNvdmVyYWdlLCAxMDAwMDApLCAzMDAwMDAwKVxuICB9XG5cblxuLCBoYW5kbGVTZWxlY3RQcm9kdWN0Q29kZTogZnVuY3Rpb24ocHJvZHVjdENvZGUpIHtcbiAgICBpZiAocHJvZHVjdENvZGUpIHtcbiAgICAgIHRoaXMucmVmcy5wcm9kdWN0Q29kZS5nZXRET01Ob2RlKCkudmFsdWUgPSBwcm9kdWN0Q29kZVxuICAgIH1cbiAgfVxuXG4sIGhhbmRsZUFjY2VwdEhlYWx0aENvZGU6IGZ1bmN0aW9uKGhlYWx0aENvZGUpIHtcbiAgICB0aGlzLnJlZnMuaGVhbHRoQ29kZS5nZXRET01Ob2RlKCkudmFsdWUgPSBoZWFsdGhDb2RlXG4gIH1cblxuLCBoYW5kbGVTaG93R2xvYmFsTW9kYWw6IGZ1bmN0aW9uKGdsb2JhbE1vZGFsKSB7XG4gICAgdGhpcy5wcm9wcy5oYW5kbGVTaG93R2xvYmFsTW9kYWwoZ2xvYmFsTW9kYWwpXG4gIH1cblxuLCBoYW5kbGVNb2RhbEhpZGRlbjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bW9kYWw6IG51bGx9KVxuICB9XG5cbiwgaGFuZGxlUmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgIDtbJ2dlbmRlcicsICdhZ2UnLCAnc3RhdGVDb2RlJywgJ2NvdmVyYWdlJywncHJvZHVjdENvZGUnLCAnaGVhbHRoQ29kZSddXG4gICAgLmZvckVhY2goZnVuY3Rpb24ocmVmKSB7XG4gICAgICB0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCkudmFsdWUgPSB0aGlzLmRlZmF1bHRzW3JlZl1cbiAgICB9LmJpbmQodGhpcykpXG4gICAgdGhpcy5yZWZzLnppcENvZGUuZ2V0RE9NTm9kZSgpLnZhbHVlID0gdGhpcy5wcm9wcy5xdWVyeVBhcmFtWmlwQ29kZVxuICAgIHRoaXMucmVmcy50b2JhY2NvTm8uZ2V0RE9NTm9kZSgpLmNoZWNrZWQgPSB0cnVlXG4gICAgdGhpcy5yZWZzLnJldmlld2VkLmdldERPTU5vZGUoKS5jaGVja2VkID0gZmFsc2VcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGVycm9yczoge31cbiAgICB9KVxuICB9XG5cbiwgaGFuZGxlR2V0UXVvdGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnJlZnMucHJvZHVjdENvZGUuZ2V0RE9NTm9kZSgpLnZhbHVlID09IFByb2R1Y3RDb2RlLlBFUk1BTkVOVCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlTW9kYWwoR2VuZXJhbEluZm9Nb2RhbC5QRVJNQU5FTlRfSU5TVVJBTkNFKVxuICAgIH1cbiAgICBpZiAoIXRoaXMuaGFuZGxlWmlwQ2hhbmdlKCkpIHJldHVyblxuICAgIGlmICghdGhpcy5yZWZzLnJldmlld2VkLmdldERPTU5vZGUoKS5jaGVja2VkKSB7XG4gICAgICByZXR1cm4gYWxlcnQoJ1lvdSBtdXN0IGluZGljYXRlIHRoYXQgeW91IGhhdmUgcmVhZCBvdXIgcHJpdmFjeSBwb2xpY3kgYmVmb3JlIHByb2NlZWRpbmcuJylcbiAgICB9XG4gICAgdGhpcy5wcm9wcy5oYW5kbGVHZXRRdW90ZSh7XG4gICAgICBnZW5kZXI6IHRoaXMucmVmcy5nZW5kZXIuZ2V0RE9NTm9kZSgpLnZhbHVlXG4gICAgLCBhZ2U6IE51bWJlcih0aGlzLnJlZnMuYWdlLmdldERPTU5vZGUoKS52YWx1ZSlcbiAgICAsIHN0YXRlQ29kZTogTnVtYmVyKHRoaXMucmVmcy5zdGF0ZUNvZGUuZ2V0RE9NTm9kZSgpLnZhbHVlKVxuICAgICwgemlwQ29kZTogdGhpcy5yZWZzLnppcENvZGUuZ2V0RE9NTm9kZSgpLnZhbHVlXG4gICAgLCB0b2JhY2NvOiB0aGlzLnJlZnMudG9iYWNjb1llcy5nZXRET01Ob2RlKCkuY2hlY2tlZFxuICAgICwgY292ZXJhZ2U6IE51bWJlcih0aGlzLnJlZnMuY292ZXJhZ2UuZ2V0RE9NTm9kZSgpLnZhbHVlKVxuICAgICwgcHJvZHVjdENvZGU6IE51bWJlcih0aGlzLnJlZnMucHJvZHVjdENvZGUuZ2V0RE9NTm9kZSgpLnZhbHVlKVxuICAgICwgaGVhbHRoQ29kZTogTnVtYmVyKHRoaXMucmVmcy5oZWFsdGhDb2RlLmdldERPTU5vZGUoKS52YWx1ZSlcbiAgICAsIHJldmlld2VkOiB0aGlzLnJlZnMucmV2aWV3ZWQuZ2V0RE9NTm9kZSgpLmNoZWNrZWRcbiAgICB9KVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdlbmVyYWxJbmZvIiwidmFyIEdlbmVyYWxJbmZvTW9kYWwgPSB7XG4gIE5FRURTX0NBTENVTEFUT1I6IDFcbiwgUE9MSUNZX0FEVklTT1I6IDJcbiwgSEVBTFRIX0NPREU6IDNcbiwgUEVSTUFORU5UX0lOU1VSQU5DRTogNFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdlbmVyYWxJbmZvTW9kYWwiLCJ2YXIgR2xvYmFsTW9kYWwgPSB7XG4gIFdFX0NBTExfWU9VOiAxXG4sIEVNQUlMX1VTOiAyXG4sIFFfQU5EX0E6IDNcbiwgU0VSVklDRV9VTkFWQUlMQUJMRTogNFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdsb2JhbE1vZGFsIiwidmFyIExpZmVRdW90ZVJlZkRhdGEgPSByZXF1aXJlKCdMaWZlUXVvdGVSZWZEYXRhJylcblxudmFyIG1ha2VFbnVtID0gcmVxdWlyZSgnbWFrZUVudW0nKVxuXG52YXIgSGVhbHRoQ29kZSA9IG1ha2VFbnVtKExpZmVRdW90ZVJlZkRhdGEuSEVBTFRIX0NPREVTLCAndGl0bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWx0aENvZGUiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBCb290c3RyYXBNb2RhbE1peGluID0gcmVxdWlyZSgnQm9vdHN0cmFwTW9kYWxNaXhpbicpXG52YXIgSGVhbHRoQ29kZXMgPSByZXF1aXJlKCdIZWFsdGhDb2RlcycpXG52YXIgSGVhbHRoQ29kZSA9IHJlcXVpcmUoJ0hlYWx0aENvZGUnKVxudmFyIEluY3JlbWVudGluZ0tleU1peGluID0gcmVxdWlyZSgnSW5jcmVtZW50aW5nS2V5TWl4aW4nKVxudmFyIExpZmVRdW90ZUNvbnN0YW50cyA9IHJlcXVpcmUoJ0xpZmVRdW90ZUNvbnN0YW50cycpXG52YXIgUmFkaW9TZWxlY3QgPSByZXF1aXJlKCdSYWRpb1NlbGVjdCcpXG5cbnZhciBpbnRlZ2VyT3B0aW9ucyA9IHJlcXVpcmUoJ2ludGVnZXJPcHRpb25zJylcblxudmFyIEhlYWx0aENvZGVNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0hlYWx0aENvZGVNb2RhbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1vZGFsTWl4aW4sIEluY3JlbWVudGluZ0tleU1peGluXVxuXG4sIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Z2dlc3RlZEhlYWx0aENvZGU6IG51bGxcbiAgICAsIGRhdGE6IHt9XG4gICAgLCBlcnJvcnM6IHt9XG4gICAgfVxuICB9XG5cbiwgaGFuZGxlUmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgIDtbMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTFdLmZvckVhY2goZnVuY3Rpb24obnVtKSB7XG4gICAgICB0aGlzLnJlZnNbJ3F1ZXN0aW9uJyArIG51bV0ucmVzZXQoKVxuICAgIH0uYmluZCh0aGlzKSlcbiAgICB0aGlzLnJlZnMuaGVpZ2h0RmVldC5nZXRET01Ob2RlKCkuc2VsZWN0ZWRJbmRleCA9IDBcbiAgICB0aGlzLnJlZnMuaGVpZ2h0SW5jaGVzLmdldERPTU5vZGUoKS5zZWxlY3RlZEluZGV4ID0gMFxuICAgIHRoaXMucmVmcy53ZWlnaHQuZ2V0RE9NTm9kZSgpLnZhbHVlID0gJydcbiAgfVxuXG4sIGhhbmRsZUdldENhdGVnb3J5OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0YSA9IHt9XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gOTsgaSsrKSB7XG4gICAgICB2YXIgcmFkaW9zID0gdGhpcy5yZWZzWydxdWVzdGlvbicgKyBpXVxuICAgICAgaWYgKHJhZGlvcy5zdGF0ZS5zZWxlY3RlZEluZGV4ID09PSBudWxsKSB7XG4gICAgICAgIHJhZGlvcy5nZXRET01Ob2RlKCkucGFyZW50Tm9kZS5zY3JvbGxJbnRvVmlldygpXG4gICAgICAgIHJldHVybiBhbGVydCgnUGxlYXNlIGFuc3dlciBRdWVzdGlvbiAjJyArIGkpXG4gICAgICB9XG4gICAgICBkYXRhWydxdWVzdGlvbicgKyBpXSA9IHJhZGlvcy5zdGF0ZS5zZWxlY3RlZEluZGV4XG4gICAgfVxuICAgIGlmICh0aGlzLnJlZnMud2VpZ2h0LmdldERPTU5vZGUoKS52YWx1ZSA9PSAnJykge1xuICAgICAgdGhpcy5yZWZzLndlaWdodC5nZXRET01Ob2RlKCkucGFyZW50Tm9kZS5zY3JvbGxJbnRvVmlldygpXG4gICAgICByZXR1cm4gYWxlcnQoJ1BsZWFzZSBmaWxsIGluIHlvdXIgaGVpZ2h0IGFuZCB3ZWlnaHQnKVxuICAgIH1cbiAgICBkYXRhLmhlaWdodEZlZXQgPSB0aGlzLnJlZnMuaGVpZ2h0RmVldC5nZXRET01Ob2RlKCkudmFsdWVcbiAgICBkYXRhLmhlaWdodEluY2hlcyA9IHRoaXMucmVmcy5oZWlnaHRJbmNoZXMuZ2V0RE9NTm9kZSgpLnZhbHVlXG4gICAgZGF0YS53ZWlnaHQgPSB0aGlzLnJlZnMud2VpZ2h0LmdldERPTU5vZGUoKS52YWx1ZVxuICAgIGlmICh0aGlzLnJlZnMucXVlc3Rpb24xMS5zdGF0ZS5zZWxlY3RlZEluZGV4ID09PSBudWxsKSB7XG4gICAgICB0aGlzLnJlZnMucXVlc3Rpb24xMS5nZXRET01Ob2RlKCkucGFyZW50Tm9kZS5zY3JvbGxJbnRvVmlldygpXG4gICAgICByZXR1cm4gYWxlcnQoJ1BsZWFzZSBhbnN3ZXIgUXVlc3Rpb24gIzExJylcbiAgICB9XG4gICAgZGF0YS5xdWVzdGlvbjExID0gdGhpcy5yZWZzLnF1ZXN0aW9uMTEuc3RhdGUuc2VsZWN0ZWRJbmRleFxuXG4gICAgLy8gVE9ETyBDYWxjdWxhdGUgY2F0ZWdvcnlcbiAgICBjb25zb2xlLmluZm8oZGF0YSlcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZGF0YTogZGF0YVxuICAgICwgc3VnZ2VzdGVkSGVhbHRoQ29kZTogSGVhbHRoQ29kZS5HT09EXG4gICAgfSlcbiAgfVxuXG4sIGhhbmRsZUJhY2s6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3N1Z2dlc3RlZEhlYWx0aENvZGU6IG51bGx9KVxuICB9XG5cbiwgaGFuZGxlQWNjZXB0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnByb3BzLmhhbmRsZUFjY2VwdCh0aGlzLnN0YXRlLnN1Z2dlc3RlZEhlYWx0aENvZGUpXG4gICAgdGhpcy5oaWRlKClcbiAgfVxuXG4sIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJvZHksIGZvb3RlclxuICAgIGlmICh0aGlzLnN0YXRlLnN1Z2dlc3RlZEhlYWx0aENvZGUgPT0gbnVsbCkge1xuICAgICAgYm9keSA9IFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiUHJpY2luZyBmb3IgbGlmZSBpbnN1cmFuY2UgaXMgYmFzZWQgb24gYW4gb3ZlcmFsbCBwaWN0dXJlIG9mIHlvdXIgaGVhbHRoLCBhbW9uZyBvdGhlciBmYWN0b3JzLiBCeSBhbnN3ZXJpbmcgdGhlIGJyaWVmIG1lZGljYWwgcXVlc3Rpb25zIHRvIGhlbHAgZXN0aW1hdGUgeW91ciBoZWFsdGggY2F0ZWdvcnksIHdlIGNhbiBwcm92aWRlIHlvdSB3aXRoIGEgbW9yZSBhY2N1cmF0ZSBxdW90ZS4gXCIgKSxcbiAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJZb3VyIGluZm9ybWF0aW9uIHdpbGwgbm90IGJlIHJlY29yZGVkIG9yIHNhdmVkIGluIGFueSB3YXkuIEFsbCBxdWVzdGlvbnMgYXJlIHJlcXVpcmVkLlwiKSxcbiAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyZWY6XCJmb3JtXCIsIHJvbGU6XCJmb3JtXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbChudWxsLCBcIjEuIFdoZW4gd2FzIHRoZSBsYXN0IHRpbWUgeW91IHVzZWQgdG9iYWNjbz9cIiksXG4gICAgICAgICAgUmFkaW9TZWxlY3QoIHtyZWY6XCJxdWVzdGlvbjFcIiwgc2VsZWN0ZWRJbmRleDp0aGlzLnN0YXRlLmRhdGEucXVlc3Rpb24xLFxuICAgICAgICAgICAgbGFiZWxzOlsnTmV2ZXInICwgJ05vbmUgaW4gdGhlIGxhc3QgMzYgbW9udGhzJywgJ05vbmUgaW4gdGhlIGxhc3QgMTIgbW9udGhzJywgJ1dpdGhpbiB0aGUgbGFzdCAxMiBtb250aHMnXX1cbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1mb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwobnVsbCwgXCIyLiBXaGVuIHdhcyB0aGUgbGFzdCB0aW1lIHlvdSB3ZXJlIHRyZWF0ZWQgZm9yIGFsY29ob2wgb3IgZHJ1ZyBhYnVzZT9cIiksXG4gICAgICAgICAgUmFkaW9TZWxlY3QoIHtyZWY6XCJxdWVzdGlvbjJcIiwgc2VsZWN0ZWRJbmRleDp0aGlzLnN0YXRlLmRhdGEucXVlc3Rpb24yLFxuICAgICAgICAgICAgbGFiZWxzOlsnTmV2ZXInLCAnV2l0aGluIHRoZSBsYXN0IDEwIHllYXJzJywgJzEwIG9yIG1vcmUgeWVhcnMgYWdvJ119XG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFwiMy4gRG8geW91IGhhdmUgYW55IERVSSBjb252aWN0aW9ucz9cIiksXG4gICAgICAgICAgUmFkaW9TZWxlY3QoIHtyZWY6XCJxdWVzdGlvbjNcIiwgc2VsZWN0ZWRJbmRleDp0aGlzLnN0YXRlLmRhdGEucXVlc3Rpb24zLFxuICAgICAgICAgICAgbGFiZWxzOlsnTm8nLCAnWWVzLCBsZXNzIHRoYW4gNSB5ZWFycyBhZ28nLCAnWWVzLCBtb3JlIHRoYW4gNSB5ZWFycyBhZ28nXX1cbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1mb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00ubGFiZWwobnVsbCwgXCI0LiBIb3cgbWFueSBtb3ZpbmcgdmlvbGF0aW9ucyBoYXZlIHlvdSBiZWVuIGNvbnZpY3RlZCBvZiBpbiB0aGUgbGFzdCAzIHllYXJzP1wiKSxcbiAgICAgICAgICBSYWRpb1NlbGVjdCgge3JlZjpcInF1ZXN0aW9uNFwiLCBzZWxlY3RlZEluZGV4OnRoaXMuc3RhdGUuZGF0YS5xdWVzdGlvbjQsXG4gICAgICAgICAgICBsYWJlbHM6WydOb25lIG9yIDEnLCAnMicsICczIG9yIG1vcmUnLCAnNiBvciBtb3JlJ119XG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFwiNS4gRG8geW91IGhhdmUgcGFyZW50cyBvciBzaWJsaW5ncyB0aGF0IGRpZWQgZnJvbSBjYW5jZXIsIGNhcmRpYWMgZGlzZWFzZSBvciBkaWFiZXRlcz9cIiksXG4gICAgICAgICAgUmFkaW9TZWxlY3QoIHtyZWY6XCJxdWVzdGlvbjVcIiwgc2VsZWN0ZWRJbmRleDp0aGlzLnN0YXRlLmRhdGEucXVlc3Rpb241LFxuICAgICAgICAgICAgbGFiZWxzOlsnTm9uZScsICdZZXMsIG9ubHkgMSBwYXJlbnQgb3Igc2libGluZyBwcmlvciB0byBhZ2UgNjAnLCAnWWVzLCBvbmx5IDEgcGFyZW50IG9yIHNpYmxpbmcgYmV0d2VlbiBhZ2VzIDYxLTY1JywgJ01vcmUgdGhhbiAxIHBhcmVudCBvciBzaWJsaW5nJ119XG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFwiNi4gRG8geW91IGhhdmUgYSBoaXN0b3J5IG9mIGRpYWJldGVzLCBjYXJkaWFjIGRpc2Vhc2UsIGNhbmNlciBvciBzdHJva2U/XCIpLFxuICAgICAgICAgIFJhZGlvU2VsZWN0KCB7cmVmOlwicXVlc3Rpb242XCIsIHNlbGVjdGVkSW5kZXg6dGhpcy5zdGF0ZS5kYXRhLnF1ZXN0aW9uNiwgbGFiZWxzOlsnTm8nLCAnWWVzJ119KVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFwiNy4gQXJlIHlvdSB0YWtpbmcgYW55IG1lZGljYXRpb24gZm9yIGhpZ2ggYmxvb2QgcHJlc3N1cmU/XCIpLFxuICAgICAgICAgIFJhZGlvU2VsZWN0KCB7cmVmOlwicXVlc3Rpb243XCIsIHNlbGVjdGVkSW5kZXg6dGhpcy5zdGF0ZS5kYXRhLnF1ZXN0aW9uNyxcbiAgICAgICAgICAgIGxhYmVsczpbJ05vJywgJ1llcyBhbmQgSSBhbSB1bmRlciB0aGUgYWdlIG9mIDUwJywgJ1llcyBhbmQgSSBhbSBhZ2UgNTAgb3Igb3ZlciddfVxuICAgICAgICAgIClcbiAgICAgICAgKSxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbChudWxsLCBcIjguIFdoYXQgd2FzIHlvdXIgbGFzdCBibG9vZCBwcmVzc3VyZSByZWFkaW5nP1wiKSxcbiAgICAgICAgICBSYWRpb1NlbGVjdCgge3JlZjpcInF1ZXN0aW9uOFwiLCBzZWxlY3RlZEluZGV4OnRoaXMuc3RhdGUuZGF0YS5xdWVzdGlvbjgsXG4gICAgICAgICAgICBsYWJlbHM6W1wiSSBkb27igJl0IGtub3dcIiwgJ0xlc3MgdGhhbiBvciBlcXVhbCB0byAxNDAvNzgnLCAnQmV0d2VlbiAxNDAvNzggYW5kIDE0MC85MCBhbmQgSSBhbSBsZXNzIHRoYW4gYWdlIDUwJywgJ0JldHdlZW4gMTQwLzc4IGFuZCAxNTAvOTIgYW5kIEkgYW0gb2xkZXIgdGhhbiA1MCcsICcxNTEvOTMgYW5kIGhpZ2hlciddfVxuICAgICAgICAgIClcbiAgICAgICAgKSxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWZvcm0tZ3JvdXBcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbChudWxsLCBcIjkuIFdoYXQgd2FzIHlvdXIgbGFzdCBjaG9sZXN0ZXJvbCByZWFkaW5nP1wiKSxcbiAgICAgICAgICBSYWRpb1NlbGVjdCgge3JlZjpcInF1ZXN0aW9uOVwiLCBzZWxlY3RlZEluZGV4OnRoaXMuc3RhdGUuZGF0YS5xdWVzdGlvbjksXG4gICAgICAgICAgICBsYWJlbHM6WydJIGRvbuKAmXQga25vdycsICdMZXNzIHRoYW4gMjEwJywgJ0JldHdlZW4gMjExIGFuZCAyNTAnLCAnMjUxLTQwMCcsICc0MDEgb3IgaGlnaGVyJ119XG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFwiMTAuIFdoYXQgaXMgeW91ciBjdXJyZW50IGhlaWdodCBhbmQgd2VpZ2h0P1wiKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ob3Jpem9udGFsXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb3JtLWdyb3VwXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwiY29sLXNtLTIgY29udHJvbC1sYWJlbFwiLCBodG1sRm9yOlwiaGVpZ2h0RmVldFwifSwgXCJGZWV0XCIpLFxuICAgICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTNcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zZWxlY3QoIHtpZDpcImhlaWdodEZlZXRcIiwgcmVmOlwiaGVpZ2h0RmVldFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgZGVmYXVsdFZhbHVlOnRoaXMuc3RhdGUuZGF0YS5oZWlnaHRGZWV0fSwgaW50ZWdlck9wdGlvbnMoNCwgNikpXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbC1zbS0yIGNvbnRyb2wtbGFiZWxcIiwgaHRtbEZvcjpcImhlaWdodEluY2hlc1wifSwgXCJJbmNoZXNcIiksXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tM1wifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnNlbGVjdCgge2lkOlwiaGVpZ2h0SW5jaGVzXCIsIHJlZjpcImhlaWdodEluY2hlc1wiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgZGVmYXVsdFZhbHVlOnRoaXMuc3RhdGUuZGF0YS5oZWlnaHRJbmNoZXN9LCBpbnRlZ2VyT3B0aW9ucygwLCAxMSkpXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2NsYXNzTmFtZTpcImNvbC1zbS0yIGNvbnRyb2wtbGFiZWxcIiwgaHRtbEZvcjpcIndlaWdodFwifSwgXCJXZWlnaHRcIiksXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tM1wifSwgXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5pbnB1dCgge3R5cGU6XCJ0ZXh0XCIsIGlkOlwid2VpZ2h0XCIsIHJlZjpcIndlaWdodFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgZGVmYXVsdFZhbHVlOnRoaXMuc3RhdGUuZGF0YS53ZWlnaHR9KSxcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIn0sIFwibGJzXCIpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9ybS1ncm91cFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmxhYmVsKG51bGwsIFwiMTEuIERvIHlvdSBwaWxvdCBhbiBhaXJwbGFuZSBvciBoZWxpY3BvdGVyP1wiKSxcbiAgICAgICAgICBSYWRpb1NlbGVjdCgge3JlZjpcInF1ZXN0aW9uMTFcIiwgc2VsZWN0ZWRJbmRleDp0aGlzLnN0YXRlLmRhdGEucXVlc3Rpb24xMSwgbGFiZWxzOlsnTm8nLCAnWWVzJ119KVxuICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmb290bm90ZXNcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiSXTigJlzIGltcG9ydGFudCB0byBrbm93IHRoaXMgdG9vbCBpcyBhIGd1aWRlIHRvIHRoZSBtb3N0IGNvbW1vbiB1bmRlcndyaXRpbmcgcXVlc3Rpb25zLCBhbmQgZG9lcyBub3QgcmVwcmVzZW50IGV2ZXJ5IHNjZW5hcmlvLiBXaGVuIHlvdSBhcHBseSBmb3IgY292ZXJhZ2UsIHlvdSB3aWxsIGJlIGFza2VkIHRvIGZpbGwgb3V0IGEgZnVsbCBhcHBsaWNhdGlvbi5cIiksXG4gICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJUaGlzIGVzdGltYXRlZCBoZWFsdGggY2F0ZWdvcnkgaXMgbm90IGd1YXJhbnRlZWQuwqAgWW91ciBmaW5hbCB1bmRlcndyaXRpbmcgY2xhc3Mgd2lsbCBiZSBkZXRlcm1pbmVkIGJ5IHRoZSByZXN1bHRzIG9mIGFueSBleGFtaW5hdGlvbnMsIGxhYm9yYXRvcnkgcmVzdWx0cywgbWVkaWNhbCBoaXN0b3J5LCBhbmQgbm9uLW1lZGljYWwgaW5mb3JtYXRpb24gZGV2ZWxvcGVkIGR1cmluZyB0aGUgdW5kZXJ3cml0aW5nIHByb2Nlc3MuIFwiIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVSZXNldH0sIFwiUmVzZXRcIiksXG4gICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tcHJpbWFyeVwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlR2V0Q2F0ZWdvcnl9LCBcIkdldCB5b3VyIGNhdGVnb3J5XCIpXG4gICAgICApXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYm9keSA9IFJlYWN0LkRPTS5wKG51bGwsIFxuICAgICAgICBcIiBCYXNlZCBvbiB0aGUgaW5mb3JtYXRpb24gcHJvdmlkZWQsIHlvdXIgZXN0aW1hdGVkIGhlYWx0aCBjYXRlZ29yeSBpczogXCIsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgSGVhbHRoQ29kZXNbdGhpcy5zdGF0ZS5zdWdnZXN0ZWRIZWFsdGhDb2RlXS50aXRsZSlcbiAgICAgIClcbiAgICAgIGZvb3RlciA9IFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdFwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlQmFja30sIFwiQmFja1wiKSxcbiAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1wcmltYXJ5XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVBY2NlcHR9LCBcIkFjY2VwdFwiKVxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwgZmFkZVwifSwgXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZGlhbG9nXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWNvbnRlbnRcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1oZWFkZXJcIn0sIFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJDbG9zZUJ1dHRvbigpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIkRldGVybWluZSB5b3VyIGhlYWx0aCBjYXRlZ29yeVwiKVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWJvZHlcIiwgc3R5bGU6e2hlaWdodDogNTAwLCBvdmVyZmxvd1k6ICdzY3JvbGwnfX0sIFxuICAgICAgICAgICAgYm9keVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWZvb3RlclwiLCBzdHlsZTp7bWFyZ2luVG9wOiAwfX0sIFxuICAgICAgICAgICAgZm9vdGVyXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWx0aENvZGVNb2RhbCIsInZhciBMaWZlUXVvdGVSZWZEYXRhID0gcmVxdWlyZSgnTGlmZVF1b3RlUmVmRGF0YScpXG5cbnZhciBtYWtlTG9va3VwID0gcmVxdWlyZSgnbWFrZUxvb2t1cCcpXG5cbnZhciBIZWFsdGhDb2RlcyA9IG1ha2VMb29rdXAoTGlmZVF1b3RlUmVmRGF0YS5IRUFMVEhfQ09ERVMpXG5cbm1vZHVsZS5leHBvcnRzID0gSGVhbHRoQ29kZXMiLCIvKipcbiAqIERpc3BsYXlzIGEgaGVscCBpY29uIHdoaWNoIGRpc3BsYXlzIGhlbHAgYXMgYSBwb3BvdmVyIG9uIGhvdmVyLiBUaGlzXG4gKiBjb21wb25lbnQgc2hvdWxkIG9ubHkgaGF2ZSB0ZXh0IGFzIGl0cyBjaGlsZCBjb250ZW50LlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xudmFyIEhlbHBJY29uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSGVscEljb24nLFxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBnbHlwaGljb246ICdxdWVzdGlvbi1zaWduJ1xuICAgICwgY29udGFpbmVyOiAnYm9keSdcbiAgICAsIGFuaW1hdGlvbjogZmFsc2VcbiAgICAsIHRyaWdnZXI6ICdob3ZlciBjbGljaydcbiAgICAsIHBsYWNlbWVudDogJ2F1dG8gcmlnaHQnXG4gICAgfVxuICB9XG5cbiwgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4oIHtzdHlsZTp7Y3Vyc29yOiAnaGVscCd9LCBjbGFzc05hbWU6J2dseXBoaWNvbiBnbHlwaGljb24tJyArIHRoaXMucHJvcHMuZ2x5cGhpY29ufSlcbiAgfVxuXG4sIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAkKHRoaXMuZ2V0RE9NTm9kZSgpKS5wb3BvdmVyKHtcbiAgICAgIGNvbnRlbnQ6IHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAsIGNvbnRhaW5lcjogdGhpcy5wcm9wcy5jb250YWluZXJcbiAgICAsIGFuaW1hdGlvbjogdGhpcy5wcm9wcy5hbmltYXRpb25cbiAgICAsIHRyaWdnZXI6IHRoaXMucHJvcHMudHJpZ2dlclxuICAgICwgcGxhY2VtZW50OiB0aGlzLnByb3BzLnBsYWNlbWVudFxuICAgIH0pXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gSGVscEljb24iLCIvKipcbiAqIEdpdmVzIGEgY29tcG9uZW50IGEga2V5IHdoaWNoIGlzIG5ldmVyIHRoZSBzYW1lIGluIDIgc3Vic2VxdWVudCBpbnN0YW5jZXMuXG4gKiBBIGhhY2sgdG8gZm9yY2UgQm9vdHN0cmFwIG1vZGFscyB0byByZS1pbml0aWFsaXNlIHN0YXRlIHdoZW4gdGhlIHNhbWUgb25lIGlzXG4gKiBkaXNwbGF5ZWQgcmVwZWF0ZWRseS5cbiAqL1xudmFyIEluY3JlbWVudGluZ0tleU1peGluID0gZnVuY3Rpb24oKSB7XG4gIHZhciBrZXlTZWVkID0gMVxuICByZXR1cm4ge1xuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleVNlZWQrK1xuICAgICAgfVxuICAgIH1cbiAgfVxufSgpXG5cbm1vZHVsZS5leHBvcnRzID0gSW5jcmVtZW50aW5nS2V5TWl4aW4iLCIvLyBNb2NrIHNlcnZpY2UgY2FsbHNcbmZ1bmN0aW9uIGRlbGF5KCkgeyByZXR1cm4gNTAwICsgKE1hdGgucmFuZG9tKCkgKiAxMDAwKSB9XG5cbnZhciBMZWFkU2VydmljZSA9IHtcbiAgY3JlYXRlTGVhZDogZnVuY3Rpb24oY2IpIHtcbiAgICBzZXRUaW1lb3V0KGNiLmJpbmQobnVsbCwgbnVsbCwge2lkOiBuZXcgRGF0ZSgpLnZhbHVlT2YoKS50b1N0cmluZygpfSksIGRlbGF5KCkpXG4gIH1cblxuLCB1cGRhdGVMZWFkOiBmdW5jdGlvbihkYXRhLCBjYikge1xuICAgIHNldFRpbWVvdXQoY2IuYmluZChudWxsLCBudWxsKSwgZGVsYXkoKSlcbiAgfVxuXG4sIGNhbGN1bGF0ZVF1b3RlOiBmdW5jdGlvbihkYXRhLCBjYikge1xuICAgIHNldFRpbWVvdXQoY2IuYmluZChudWxsLCBudWxsLCB7XG4gICAgICBwYXltZW50czpbXG4gICAgICAgIHt0ZXJtOiAxMCwgYW5udWFsUGF5bWVudDogNDUwLjAsIG1vbnRobHlQYXltZW50OiA0NS4wfVxuICAgICAgLCB7dGVybTogMjAsIGFubnVhbFBheW1lbnQ6IDQ1MC4wLCBtb250aGx5UGF5bWVudDogNDUuMH1cbiAgICAgICwge3Rlcm06IDMwLCBhbm51YWxQYXltZW50OiA0NTAuMCwgbW9udGhseVBheW1lbnQ6IDQ1LjB9XG4gICAgICBdXG4gICAgfSksIGRlbGF5KCkpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMZWFkU2VydmljZSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIENhbGxZb3VNb2RhbCA9IHJlcXVpcmUoJ0NhbGxZb3VNb2RhbCcpXG52YXIgRW1haWxVc01vZGFsID0gcmVxdWlyZSgnRW1haWxVc01vZGFsJylcbnZhciBHZW5lcmFsSW5mbyA9IHJlcXVpcmUoJ0dlbmVyYWxJbmZvJylcbnZhciBHbG9iYWxNb2RhbCA9IHJlcXVpcmUoJ0dsb2JhbE1vZGFsJylcbnZhciBMZWFkU2VydmljZSA9IHJlcXVpcmUoJ0xlYWRTZXJ2aWNlJylcbnZhciBMaWZlUXVvdGVDb25zdGFudHMgPSByZXF1aXJlKCdMaWZlUXVvdGVDb25zdGFudHMnKVxudmFyIFFBbmRBTW9kYWwgPSByZXF1aXJlKCdRQW5kQU1vZGFsJylcbnZhciBRdW90ZUluZm8gPSByZXF1aXJlKCdRdW90ZUluZm8nKVxudmFyIFNlbmRRdW90ZSA9IHJlcXVpcmUoJ1NlbmRRdW90ZScpXG52YXIgU2VydmljZVVuYXZhaWxhYmxlTW9kYWwgPSByZXF1aXJlKCdTZXJ2aWNlVW5hdmFpbGFibGVNb2RhbCcpXG52YXIgU3RhdGVzID0gcmVxdWlyZSgnU3RhdGVzJylcbnZhciBTdGVwID0gcmVxdWlyZSgnU3RlcCcpXG52YXIgVFRGTiA9IHJlcXVpcmUoJ1RURk4nKVxudmFyIFdURk4gPSByZXF1aXJlKCdXVEZOJylcblxudmFyICRjID0gcmVxdWlyZSgnY2xhc3NOYW1lcycpXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJylcblxudmFyIExpZmVRdW90ZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xpZmVRdW90ZScsXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0ZXA6IFN0ZXAuR0VORVJBTF9JTkZPXG4gICAgLCBsb2FkaW5nOiBmYWxzZVxuICAgICwgbW9kYWw6IG51bGxcbiAgICAsIG5leHRNb2RhbDogbnVsbFxuICAgICwgZ2VuZXJhbEluZm86IHtcbiAgICAgICAgemlwQ29kZTogdGhpcy5wcm9wcy5xdWVyeVBhcmFtWmlwQ29kZVxuICAgICAgfVxuICAgICwgcGF5bWVudHM6IHt9XG4gICAgLCBjb250YWN0SW5mbzoge1xuICAgICAgICB6aXBDb2RlOiB0aGlzLnByb3BzLnF1ZXJ5UGFyYW1aaXBDb2RlXG4gICAgICB9XG4gICAgLCBsZWFkOiBudWxsXG4gICAgfVxuICB9XG5cbiwgc2V0QWN0aXZlU3RlcDogZnVuY3Rpb24oc3RlcCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3N0ZXA6IHN0ZXB9KVxuICB9XG5cbiwgc2V0QWN0aXZlTW9kYWw6IGZ1bmN0aW9uKG1vZGFsLCBlKSB7XG4gICAgaWYgKGUpIGUucHJldmVudERlZmF1bHQoKVxuICAgIHRoaXMuc2V0U3RhdGUoe21vZGFsOiBtb2RhbH0pXG4gIH1cblxuLCBzZXROZXh0TW9kYWw6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7bmV4dE1vZGFsOiBtb2RhbH0pXG4gIH1cblxuLCByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb250ZW50XG4gICAgaWYgKHRoaXMuc3RhdGUuc3RlcCA9PT0gU3RlcC5HRU5FUkFMX0lORk8pXG4gICAgICBjb250ZW50ID0gR2VuZXJhbEluZm8oXG4gICAgICAgICAgICAgICAgICB7cXVlcnlQYXJhbVppcENvZGU6dGhpcy5wcm9wcy5xdWVyeVBhcmFtWmlwQ29kZSxcbiAgICAgICAgICAgICAgICAgIGluaXRpYWxEYXRhOnRoaXMuc3RhdGUuZ2VuZXJhbEluZm8sXG4gICAgICAgICAgICAgICAgICBoYW5kbGVSZXNldDp0aGlzLmhhbmRsZVJlc2V0LFxuICAgICAgICAgICAgICAgICAgaGFuZGxlR2V0UXVvdGU6dGhpcy5oYW5kbGVHZXRRdW90ZSxcbiAgICAgICAgICAgICAgICAgIGhhbmRsZVNob3dHbG9iYWxNb2RhbDp0aGlzLnNldEFjdGl2ZU1vZGFsLFxuICAgICAgICAgICAgICAgICAgbG9hZGluZzp0aGlzLnN0YXRlLmxvYWRpbmd9XG4gICAgICAgICAgICAgICAgKVxuICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUuc3RlcCA9PT0gU3RlcC5RVU9URV9JTkZPKVxuICAgICAgY29udGVudCA9IFF1b3RlSW5mbyhcbiAgICAgICAgICAgICAgICAgIHtnZW5lcmFsSW5mbzp0aGlzLnN0YXRlLmdlbmVyYWxJbmZvLFxuICAgICAgICAgICAgICAgICAgcGF5bWVudHM6dGhpcy5zdGF0ZS5wYXltZW50cyxcbiAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZVN0ZXA6dGhpcy5zZXRBY3RpdmVTdGVwfVxuICAgICAgICAgICAgICAgIClcbiAgICBlbHNlIGlmICh0aGlzLnN0YXRlLnN0ZXAgPT09IFN0ZXAuU0VORF9RVU9URSlcbiAgICAgIGNvbnRlbnQgPSBTZW5kUXVvdGUoXG4gICAgICAgICAgICAgICAgICB7Y29udGFjdEluZm86dGhpcy5zdGF0ZS5jb250YWN0SW5mbyxcbiAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZVN0ZXA6dGhpcy5zZXRBY3RpdmVTdGVwLFxuICAgICAgICAgICAgICAgICAgaGFuZGxlU2VuZDp0aGlzLmhhbmRsZVNlbmQsXG4gICAgICAgICAgICAgICAgICBoYW5kbGVTaG93R2xvYmFsTW9kYWw6dGhpcy5zZXRBY3RpdmVNb2RhbCxcbiAgICAgICAgICAgICAgICAgIGxvYWRpbmc6dGhpcy5zdGF0ZS5sb2FkaW5nfVxuICAgICAgICAgICAgICAgIClcbiAgICBlbHNlIGlmICh0aGlzLnN0YXRlLnN0ZXAgPT09IFN0ZXAuVFRGTilcbiAgICAgIGNvbnRlbnQgPSAoSlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZSkudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdyZWFjdCcpID09IC0xXG4gICAgICAgICAgICAgICAgID8gVFRGTihudWxsKVxuICAgICAgICAgICAgICAgICA6IFdURk4obnVsbCkpXG5cbiAgICB2YXIgbW9kYWxcbiAgICBpZiAodGhpcy5zdGF0ZS5tb2RhbCA9PT0gR2xvYmFsTW9kYWwuV0VfQ0FMTF9ZT1UpXG4gICAgICBtb2RhbCA9IENhbGxZb3VNb2RhbChcbiAgICAgICAgICAgICAgICB7Y29udGFjdEluZm86dGhpcy5zdGF0ZS5jb250YWN0SW5mbyxcbiAgICAgICAgICAgICAgICBoYW5kbGVIaWRkZW46dGhpcy5oYW5kbGVNb2RhbEhpZGRlbixcbiAgICAgICAgICAgICAgICBoYW5kbGVTZW5kOnRoaXMuaGFuZGxlU2VuZCxcbiAgICAgICAgICAgICAgICBoYW5kbGVTZXROZXh0R2xvYmFsTW9kYWw6dGhpcy5zZXROZXh0TW9kYWx9XG4gICAgICAgICAgICAgIClcbiAgICBlbHNlIGlmICh0aGlzLnN0YXRlLm1vZGFsID09PSBHbG9iYWxNb2RhbC5FTUFJTF9VUylcbiAgICAgIG1vZGFsID0gRW1haWxVc01vZGFsKFxuICAgICAgICAgICAgICAgIHtjb250YWN0SW5mbzp0aGlzLnN0YXRlLmNvbnRhY3RJbmZvLFxuICAgICAgICAgICAgICAgIGhhbmRsZUhpZGRlbjp0aGlzLmhhbmRsZU1vZGFsSGlkZGVuLFxuICAgICAgICAgICAgICAgIGhhbmRsZVNlbmQ6dGhpcy5oYW5kbGVTZW5kLFxuICAgICAgICAgICAgICAgIGhhbmRsZVNldE5leHRHbG9iYWxNb2RhbDp0aGlzLnNldE5leHRNb2RhbH1cbiAgICAgICAgICAgICAgKVxuICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUubW9kYWwgPT09IEdsb2JhbE1vZGFsLlFfQU5EX0EpXG4gICAgICBtb2RhbCA9IFFBbmRBTW9kYWwoIHtoYW5kbGVIaWRkZW46dGhpcy5oYW5kbGVNb2RhbEhpZGRlbn0pXG4gICAgZWxzZSBpZiAodGhpcy5zdGF0ZS5tb2RhbCA9PT0gR2xvYmFsTW9kYWwuU0VSVklDRV9VTkFWQUlMQUJMRSlcbiAgICAgIG1vZGFsID0gU2VydmljZVVuYXZhaWxhYmxlTW9kYWwoIHtoYW5kbGVIaWRkZW46dGhpcy5oYW5kbGVNb2RhbEhpZGRlbn0pXG5cbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnN0YXRlLmxvYWRpbmcgPyAnbG9hZGluZycgOiAnJ30sIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjb2wtc20tOVwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInF1b3RlLXByb2dyZXNzIGNsZWFyZml4XCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6JGMoJ2NvbC1zbS00Jywge2FjdGl2ZTogdGhpcy5zdGF0ZS5zdGVwID09PSBTdGVwLkdFTkVSQUxfSU5GT30pfSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3RlcC1udW1iZXJcIn0sIFwiMVwiKSwnICcsXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3RlcC1uYW1lXCJ9LCBcIkdlbmVyYWwgSW5mb3JtYXRpb25cIilcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOiRjKCdjb2wtc20tNCcsIHthY3RpdmU6IHRoaXMuc3RhdGUuc3RlcCA9PT0gU3RlcC5RVU9URV9JTkZPfSl9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzdGVwLW51bWJlclwifSwgXCIyXCIpLCcgJyxcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzdGVwLW5hbWVcIn0sIFwiR2V0IHlvdXIgcXVvdGVcIilcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOiRjKCdjb2wtc20tNCcsIHthY3RpdmU6IHRoaXMuc3RhdGUuc3RlcCA9PT0gU3RlcC5TRU5EX1FVT1RFfSl9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzdGVwLW51bWJlclwifSwgXCIzXCIpLCcgJyxcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzdGVwLW5hbWVcIn0sIFwiU2VuZCB5b3VyIHF1b3RlIHRvIGFuIGFnZW50XCIpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwgcGFuZWwtZGVmYXVsdFwifSwgXG4gICAgICAgICAgICBjb250ZW50XG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTNcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInRleHQtY2VudGVyXCJ9LCBcIk5lZWQgQXNzaXN0YW5jZT9cIiksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImxpc3QtZ3JvdXBcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJsaXN0LWdyb3VwLWl0ZW1cIiwgaHJlZjpcIiNjYWxsY29udGFjdFwiLCBvbkNsaWNrOnRoaXMuc2V0QWN0aXZlTW9kYWwuYmluZChudWxsLCBHbG9iYWxNb2RhbC5XRV9DQUxMX1lPVSl9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLmg0KCB7Y2xhc3NOYW1lOlwibGlzdC1ncm91cC1pdGVtLWhlYWRpbmdcIn0sIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1waG9uZS1hbHRcIn0pLCBcIiBXZeKAmWxsIGNhbGwgeW91XCIpLFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcImxpc3QtZ3JvdXAtaXRlbS10ZXh0XCJ9LCBcIk5lZWQgYXNzaXN0YW5jZT8gQSBsaWNlbnNlZCByZXByZXNlbnRhdGl2ZSB3aWxsIGNvbnRhY3QgeW91LlwiKVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwibGlzdC1ncm91cC1pdGVtXCIsIGhyZWY6XCIjcXVlc3Rpb25jb250YWN0XCIsIG9uQ2xpY2s6dGhpcy5zZXRBY3RpdmVNb2RhbC5iaW5kKG51bGwsIEdsb2JhbE1vZGFsLkVNQUlMX1VTKX0sIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uaDQoIHtjbGFzc05hbWU6XCJsaXN0LWdyb3VwLWl0ZW0taGVhZGluZ1wifSwgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWVudmVsb3BlXCJ9KSwgXCIgRW1haWwgdXNcIiksXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKCB7Y2xhc3NOYW1lOlwibGlzdC1ncm91cC1pdGVtLXRleHRcIn0sIFwiSGF2ZSBhIHNwZWNpZmljIHF1ZXN0aW9uPyBXZSB3aWxsIGdldCByaWdodCBiYWNrIHRvIHlvdSB2aWEgZW1haWwuXCIpXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJsaXN0LWdyb3VwLWl0ZW1cIiwgaHJlZjpcIiNxYW5kYVwiLCBvbkNsaWNrOnRoaXMuc2V0QWN0aXZlTW9kYWwuYmluZChudWxsLCBHbG9iYWxNb2RhbC5RX0FORF9BKX0sIFxuICAgICAgICAgICAgICBSZWFjdC5ET00uaDQoIHtjbGFzc05hbWU6XCJsaXN0LWdyb3VwLWl0ZW0taGVhZGluZ1wifSwgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWluZm8tc2lnblwifSksIFwiIFF1ZXN0aW9ucyBcIiwgJyYnLCBcIiBBbnN3ZXJzXCIpLFxuICAgICAgICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcImxpc3QtZ3JvdXAtaXRlbS10ZXh0XCJ9LCBcIkxvb2sgaGVyZSBmb3IgYW5zd2VycyB0byBjb21tb25seS1hc2tlZCBxdWVzdGlvbnMuXCIpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcInRleHQtY2VudGVyXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5hKCB7aHJlZjpMaWZlUXVvdGVDb25zdGFudHMuTE9DQUxfU0FMRVNfQUdFTlRfVVJMLCB0YXJnZXQ6XCJfYmxhbmtcIn0sIFwiRmluZCBhIExvY2FsIFNhbGVzIEFnZW50IFwiLCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tc2hhcmVcIn0pKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIG1vZGFsXG4gICAgKVxuICB9XG5cbiwgaGFuZGxlTW9kYWxIaWRkZW46IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLm5leHRNb2RhbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIG1vZGFsOiB0aGlzLnN0YXRlLm5leHRNb2RhbFxuICAgICAgLCBuZXh0TW9kYWw6IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bW9kYWw6IG51bGx9KVxuICAgIH1cbiAgfVxuXG4sIGhhbmRsZUNyZWF0ZUxlYWQ6IGZ1bmN0aW9uKG5leHQsIGhhbmRsZUVycm9yKSB7XG4gICAgTGVhZFNlcnZpY2UuY3JlYXRlTGVhZChmdW5jdGlvbihlcnIsIGxlYWQpIHtcbiAgICAgIGlmIChlcnIpIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICB0aGlzLnNldFN0YXRlKHtsZWFkOiBsZWFkfSlcbiAgICAgIG5leHQobGVhZClcbiAgICB9LmJpbmQodGhpcykpXG4gIH1cblxuLCBoYW5kbGVHZXRRdW90ZTogZnVuY3Rpb24oZ2VuZXJhbEluZm8pIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGdlbmVyYWxJbmZvOiBnZW5lcmFsSW5mb1xuICAgICwgY29udGFjdEluZm86IGV4dGVuZCh7fSwgdGhpcy5zdGF0ZS5jb250YWN0SW5mbywge1xuICAgICAgICBzdGF0ZUNvZGU6IGdlbmVyYWxJbmZvLnN0YXRlQ29kZVxuICAgICAgLCB6aXBDb2RlOiBnZW5lcmFsSW5mby56aXBDb2RlXG4gICAgICB9KVxuICAgICwgbG9hZGluZzogdHJ1ZVxuICAgIH0pXG5cbiAgICB2YXIgaGFuZGxlRXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBsb2FkaW5nOiBmYWxzZVxuICAgICAgLCBtb2RhbDogR2xvYmFsTW9kYWwuU0VSVklDRV9VTkFWQUlMQUJMRVxuICAgICAgfSlcbiAgICB9LmJpbmQodGhpcylcblxuICAgIHZhciBnZXRRdW90ZSA9IGZ1bmN0aW9uKGxlYWQpIHtcbiAgICAgIGlmIChsZWFkID09PSBudWxsKSByZXR1cm4gdGhpcy5oYW5kbGVDcmVhdGVMZWFkKGdldFF1b3RlLCBoYW5kbGVFcnJvcilcblxuICAgICAgdmFyIGRhdGEgPSBleHRlbmQoe30sIHtsZWFkSWQ6IGxlYWQuaWR9LCBnZW5lcmFsSW5mbylcblxuICAgICAgTGVhZFNlcnZpY2UuY2FsY3VsYXRlUXVvdGUoZGF0YSwgZnVuY3Rpb24oZXJyLCBxdW90ZSkge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm4gaGFuZGxlRXJyb3IoZXJyKVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBsb2FkaW5nOiBmYWxzZVxuICAgICAgICAsIHBheW1lbnRzOiBxdW90ZS5wYXltZW50c1xuICAgICAgICAsIHN0ZXA6IFN0ZXAuUVVPVEVfSU5GT1xuICAgICAgICB9KVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH0uYmluZCh0aGlzKVxuXG4gICAgZ2V0UXVvdGUodGhpcy5zdGF0ZS5sZWFkKVxuICB9XG5cbiwgaGFuZGxlU2VuZDogZnVuY3Rpb24oY29udGFjdEluZm8sIGNiKSB7XG4gICAgdmFyIHVwZGF0ZWRDb250YWN0SW5mbyA9IGV4dGVuZCh7fSwgdGhpcy5zdGF0ZS5jb250YWN0SW5mbywgY29udGFjdEluZm8pXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjb250YWN0SW5mbzogdXBkYXRlZENvbnRhY3RJbmZvXG4gICAgLCBsb2FkaW5nOiB0cnVlXG4gICAgfSlcblxuICAgIHZhciBoYW5kbGVFcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7bG9hZGluZzogZmFsc2V9KVxuICAgICAgY2IoZXJyKVxuICAgIH0uYmluZCh0aGlzKVxuXG4gICAgdmFyIHVwZGF0ZUxlYWQgPSBmdW5jdGlvbihsZWFkKSB7XG4gICAgICBpZiAobGVhZCA9PT0gbnVsbCkgcmV0dXJuIHRoaXMuaGFuZGxlQ3JlYXRlTGVhZCh1cGRhdGVMZWFkLCBoYW5kbGVFcnJvcilcblxuICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIGlkOiBsZWFkLmlkXG4gICAgICAsIGZpcnN0TmFtZTogY29udGFjdEluZm8uZmlyc3ROYW1lXG4gICAgICAsIGxhc3ROYW1lOiBjb250YWN0SW5mby5sYXN0TmFtZVxuICAgICAgLCBwaG9uZU5tYnI6IGNvbnRhY3RJbmZvLnBob25lTm1iclxuICAgICAgLCBhZGRyZXNzOiBjb250YWN0SW5mby5hZGRyZXNzICsgJyAnICtcbiAgICAgICAgICAgICAgICAgY29udGFjdEluZm8uY2l0eSArICcsICcgK1xuICAgICAgICAgICAgICAgICBTdGF0ZXNbY29udGFjdEluZm8uc3RhdGVDb2RlXS5hYmJyZXZpYXRpb25cbiAgICAgICwgc3RhdGVDb2RlOiBjb250YWN0SW5mby5zdGF0ZUNvZGVcbiAgICAgICwgemlwQ29kZTogY29udGFjdEluZm8uemlwQ29kZVxuICAgICAgLCBjdXJyZW50Q3VzdG9tZXI6IGNvbnRhY3RJbmZvLmN1cnJlbnRDdXN0b21lciA9PSAnWWVzJ1xuICAgICAgfVxuICAgICAgaWYgKGNvbnRhY3RJbmZvLmVtYWlsQWRkcikgZGF0YS5lbWFpbEFkZHIgPSBjb250YWN0SW5mby5lbWFpbEFkZHJcbiAgICAgIGlmIChjb250YWN0SW5mby5xdWVzdGlvbikgZGF0YS5xdWVzdGlvbiA9IGNvbnRhY3RJbmZvLnF1ZXN0aW9uXG5cbiAgICAgIExlYWRTZXJ2aWNlLnVwZGF0ZUxlYWQoZGF0YSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHJldHVybiBoYW5kbGVFcnJvcihlcnIpXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvYWRpbmc6IGZhbHNlfSlcbiAgICAgICAgY2IobnVsbClcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9LmJpbmQodGhpcylcblxuICAgIHVwZGF0ZUxlYWQodGhpcy5zdGF0ZS5sZWFkKVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpZmVRdW90ZSIsInZhciBDT01QQU5ZID0gJ01lcnJ5IFdpZG93IEluc3VyYW5jZSBDby4nXG4gICwgUFJJVkFDWV9QT0xJQ1lfVVJMID0gJ2h0dHA6Ly9leGFtcGxlLmNvbS9wcml2YWN5X3BvbGljeSdcbiAgLCBMT0NBTF9TQUxFU19BR0VOVF9VUkwgPSAnaHR0cDovL2V4YW1wbGUuY29tL2ZpbmRfc2FsZXNfb2ZmaWNlJ1xuICAsIExJRkVfSU5TVVJBTkNFX1BST0RVQ1RTX1VSTCA9ICdodHRwOi8vZXhhbXBsZS5jb20vbGlmZV9pbnN1cmFuY2VfcHJvZHVjdHMnXG5cbnZhciBMaWZlUXVvdGVDb25zdGFudHMgPSB7XG4gIENPTVBBTlk6IENPTVBBTllcbiwgUFJJVkFDWV9QT0xJQ1lfVVJMOiBQUklWQUNZX1BPTElDWV9VUkxcbiwgTE9DQUxfU0FMRVNfQUdFTlRfVVJMOiBMT0NBTF9TQUxFU19BR0VOVF9VUkxcbiwgTElGRV9JTlNVUkFOQ0VfUFJPRFVDVFNfVVJMOiBMSUZFX0lOU1VSQU5DRV9QUk9EVUNUU19VUkxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaWZlUXVvdGVDb25zdGFudHMiLCJ2YXIgU1RBVEVfQ09ERVMgPSBbXG4gIHtjb2RlOiAxLCAgYWJicmV2aWF0aW9uOiAnQUwnLCBuYW1lOiAnQWxhYmFtYSd9XG4sIHtjb2RlOiAyLCAgYWJicmV2aWF0aW9uOiAnQUsnLCBuYW1lOiAnQWxhc2thJ31cbiwge2NvZGU6IDQsICBhYmJyZXZpYXRpb246ICdBWicsIG5hbWU6ICdBcml6b25hJ31cbiwge2NvZGU6IDUsICBhYmJyZXZpYXRpb246ICdBUicsIG5hbWU6ICdBcmthbnNhcyd9XG4sIHtjb2RlOiA2LCAgYWJicmV2aWF0aW9uOiAnQ0EnLCBuYW1lOiAnQ2FsaWZvcm5pYSd9XG4sIHtjb2RlOiA4LCAgYWJicmV2aWF0aW9uOiAnQ08nLCBuYW1lOiAnQ29ubmVjdGljdXQnfVxuLCB7Y29kZTogMTAsIGFiYnJldmlhdGlvbjogJ0RFJywgbmFtZTogJ0RlbGF3YXJlJ31cbiwge2NvZGU6IDExLCBhYmJyZXZpYXRpb246ICdEQycsIG5hbWU6ICdEaXN0cmljdCBvZiBDb2x1bWJpYSd9XG4sIHtjb2RlOiAxMiwgYWJicmV2aWF0aW9uOiAnRkwnLCBuYW1lOiAnRmxvcmlkYSd9XG4sIHtjb2RlOiAxMywgYWJicmV2aWF0aW9uOiAnR0EnLCBuYW1lOiAnR2VvcmdpYSd9XG4sIHtjb2RlOiAxNSwgYWJicmV2aWF0aW9uOiAnSEknLCBuYW1lOiAnSGF3YWlpJ31cbiwge2NvZGU6IDE2LCBhYmJyZXZpYXRpb246ICdJRCcsIG5hbWU6ICdJZGFobyd9XG4sIHtjb2RlOiAxNywgYWJicmV2aWF0aW9uOiAnSUwnLCBuYW1lOiAnSWxsaW5vaXMnfVxuLCB7Y29kZTogMTgsIGFiYnJldmlhdGlvbjogJ0lOJywgbmFtZTogJ0luZGlhbmEnfVxuLCB7Y29kZTogMTksIGFiYnJldmlhdGlvbjogJ0lBJywgbmFtZTogJ0lvd2EnfVxuLCB7Y29kZTogMjAsIGFiYnJldmlhdGlvbjogJ0tTJywgbmFtZTogJ0thbnNhcyd9XG4sIHtjb2RlOiAyMSwgYWJicmV2aWF0aW9uOiAnS1knLCBuYW1lOiAnS2VudHVja3knfVxuLCB7Y29kZTogMjIsIGFiYnJldmlhdGlvbjogJ0xBJywgbmFtZTogJ0xvdWlzaWFuYSd9XG4sIHtjb2RlOiAyMywgYWJicmV2aWF0aW9uOiAnTUUnLCBuYW1lOiAnTWFpbmUnfVxuLCB7Y29kZTogMjQsIGFiYnJldmlhdGlvbjogJ01EJywgbmFtZTogJ01hcnlsYW5kJ31cbiwge2NvZGU6IDI1LCBhYmJyZXZpYXRpb246ICdNQScsIG5hbWU6ICdNYXNzYWNodXNldHRzJ31cbiwge2NvZGU6IDI2LCBhYmJyZXZpYXRpb246ICdNSScsIG5hbWU6ICdNaWNoaWdhbid9XG4sIHtjb2RlOiAyNywgYWJicmV2aWF0aW9uOiAnTU4nLCBuYW1lOiAnTWlubmVzb3RhJ31cbiwge2NvZGU6IDI4LCBhYmJyZXZpYXRpb246ICdNUycsIG5hbWU6ICdNaXNzaXNzaXBwaSd9XG4sIHtjb2RlOiAyOSwgYWJicmV2aWF0aW9uOiAnTU8nLCBuYW1lOiAnTWlzc291cmknfVxuLCB7Y29kZTogMzAsIGFiYnJldmlhdGlvbjogJ01UJywgbmFtZTogJ01vbnRhbmEnfVxuLCB7Y29kZTogMzEsIGFiYnJldmlhdGlvbjogJ05FJywgbmFtZTogJ05lYnJhc2thJ31cbiwge2NvZGU6IDMyLCBhYmJyZXZpYXRpb246ICdOVicsIG5hbWU6ICdOZXZhZGEnfVxuLCB7Y29kZTogMzMsIGFiYnJldmlhdGlvbjogJ05IJywgbmFtZTogJ05ldyBIYW1wc2hpcmUnfVxuLCB7Y29kZTogMzQsIGFiYnJldmlhdGlvbjogJ05KJywgbmFtZTogJ05ldyBKZXJzZXknfVxuLCB7Y29kZTogMzUsIGFiYnJldmlhdGlvbjogJ05NJywgbmFtZTogJ05ldyBNZXhpY28nfVxuLCB7Y29kZTogMzYsIGFiYnJldmlhdGlvbjogJ05ZJywgbmFtZTogJ05ldyBZb3JrJ31cbiwge2NvZGU6IDM3LCBhYmJyZXZpYXRpb246ICdOQycsIG5hbWU6ICdOb3J0aCBDYXJvbGluYSd9XG4sIHtjb2RlOiAzOCwgYWJicmV2aWF0aW9uOiAnTkQnLCBuYW1lOiAnTm9ydGggRGFrb3RhJ31cbiwge2NvZGU6IDM5LCBhYmJyZXZpYXRpb246ICdPSCcsIG5hbWU6ICdPaGlvJ31cbiwge2NvZGU6IDQwLCBhYmJyZXZpYXRpb246ICdPSycsIG5hbWU6ICdPa2xhaG9tYSd9XG4sIHtjb2RlOiA0MSwgYWJicmV2aWF0aW9uOiAnT1InLCBuYW1lOiAnT3JlZ29uJ31cbiwge2NvZGU6IDQyLCBhYmJyZXZpYXRpb246ICdQQScsIG5hbWU6ICdQZW5uc3lsdmFuaWEnfVxuLCB7Y29kZTogNDQsIGFiYnJldmlhdGlvbjogJ1JJJywgbmFtZTogJ1Job2RlIElzbGFuZCd9XG4sIHtjb2RlOiA0NSwgYWJicmV2aWF0aW9uOiAnU0MnLCBuYW1lOiAnU291dGggQ2Fyb2xpbmEnfVxuLCB7Y29kZTogNDYsIGFiYnJldmlhdGlvbjogJ1NEJywgbmFtZTogJ1NvdXRoIERha290YSd9XG4sIHtjb2RlOiA0NywgYWJicmV2aWF0aW9uOiAnVE4nLCBuYW1lOiAnVGVubmVzc2VlJ31cbiwge2NvZGU6IDQ4LCBhYmJyZXZpYXRpb246ICdUWCcsIG5hbWU6ICdUZXhhcyd9XG4sIHtjb2RlOiA0OSwgYWJicmV2aWF0aW9uOiAnVVQnLCBuYW1lOiAnVXRhaCd9XG4sIHtjb2RlOiA1MCwgYWJicmV2aWF0aW9uOiAnVlQnLCBuYW1lOiAnVmVybW9udCd9XG4sIHtjb2RlOiA1MSwgYWJicmV2aWF0aW9uOiAnVkEnLCBuYW1lOiAnVmlyZ2luaWEnfVxuLCB7Y29kZTogNTMsIGFiYnJldmlhdGlvbjogJ1dBJywgbmFtZTogJ1dhc2hpbmd0b24nfVxuLCB7Y29kZTogNTQsIGFiYnJldmlhdGlvbjogJ1dWJywgbmFtZTogJ1dlc3QgVmlyZ2luaWEnfVxuLCB7Y29kZTogNTUsIGFiYnJldmlhdGlvbjogJ1dJJywgbmFtZTogJ1dpc2NvbnNpbid9XG4sIHtjb2RlOiA1NiwgYWJicmV2aWF0aW9uOiAnV1knLCBuYW1lOiAnV3lvbWluZyd9XG5dXG5cbnZhciBQUk9EVUNUX0NPREVTID0gW1xuICB7Y29kZTogMSwgbmFtZTogJ1Rlcm0nfVxuLCB7Y29kZTogMiwgbmFtZTogJ1Blcm1hbmVudCd9XG5dXG5cbnZhciBIRUFMVEhfQ09ERVMgPSAgW1xuICB7Y29kZTogMSwgdGl0bGU6ICdGYWlyJ31cbiwge2NvZGU6IDIsIHRpdGxlOiAnR29vZCd9XG4sIHtjb2RlOiAzLCB0aXRsZTogJ1ZlcnkgR29vZCd9XG4sIHtjb2RlOiA0LCB0aXRsZTogJ0V4Y2VsbGVudCd9XG5dXG5cbnZhciBHRU5ERVJfQ09ERVMgPSBbXG4gIHtjb2RlOiAnRicsIHRpdGxlOiAnRmVtYWxlJ31cbiwge2NvZGU6ICdNJywgdGl0bGU6ICdNYWxlJ31cbl1cblxudmFyIExpZmVRdW90ZVJlZkRhdGEgPSB7XG4gIFNUQVRFX0NPREVTOiBTVEFURV9DT0RFU1xuLCBQUk9EVUNUX0NPREVTOiBQUk9EVUNUX0NPREVTXG4sIEhFQUxUSF9DT0RFUzogSEVBTFRIX0NPREVTXG4sIEdFTkRFUl9DT0RFUzogR0VOREVSX0NPREVTXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlmZVF1b3RlUmVmRGF0YSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIEJvb3RzdHJhcERldmljZSA9IHJlcXVpcmUoJ0Jvb3RzdHJhcERldmljZScpXG52YXIgQm9vdHN0cmFwTW9kYWxNaXhpbiA9IHJlcXVpcmUoJ0Jvb3RzdHJhcE1vZGFsTWl4aW4nKVxudmFyIEZvcm1NaXhpbiA9IHJlcXVpcmUoJ0Zvcm1NaXhpbicpXG52YXIgSGVscEljb24gPSByZXF1aXJlKCdIZWxwSWNvbicpXG52YXIgSW5jcmVtZW50aW5nS2V5TWl4aW4gPSByZXF1aXJlKCdJbmNyZW1lbnRpbmdLZXlNaXhpbicpXG5cbnZhciAkYyA9IHJlcXVpcmUoJ2NsYXNzTmFtZXMnKVxudmFyIGJzRGV2aWNlID0gcmVxdWlyZSgnYnNEZXZpY2UnKVxudmFyIGZvcm1hdERvbGxhcnMgPSByZXF1aXJlKCdmb3JtYXREb2xsYXJzJylcbnZhciB0cmltID0gcmVxdWlyZSgndHJpbScpXG5cbnZhciBOZWVkc0NhbGN1bGF0b3JNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05lZWRzQ2FsY3VsYXRvck1vZGFsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTW9kYWxNaXhpbiwgRm9ybU1peGluLCBJbmNyZW1lbnRpbmdLZXlNaXhpbl1cblxuLCBmaWVsZHM6IHtcbiAgICAnbW9udGhseU5ldEluY29tZSc6ICdpc0Zsb2F0J1xuICAsICdvdXRzdGFuZGluZ01vcnRnYWdlT3JSZW50JzogJ2lzRmxvYXQnXG4gICwgJ2N1cnJlbnRPdXRzdGFuZGluZ0RlYnRzJzogJ2lzRmxvYXQnXG4gICwgJ2VzdENvbGxlZ2VFeHBlbnNlUGVyQ2hpbGQnOiAnaXNGbG9hdCdcbiAgLCAnZXN0RmluYWxFeHBlbnNlcyc6ICdpc0Zsb2F0J1xuICAsICdjdXJyZW50TGlxdWlkQXNzZXRzJzogJ2lzRmxvYXQnXG4gICwgJ3BlcnNvbmFsbHlPd25lZEluc3VyYW5jZSc6ICdpc0Zsb2F0J1xuICAsICd5ZWFyc0luY29tZVByb3ZpZGVkJzogJ2lzSW50J1xuICAsICdudW1Db2xsZWdlQ2hpbGRyZW4nOiAnaXNJbnQnXG4gIH1cblxuLCBlcnJvck1lc3NhZ2VzOiB7XG4gICAgJ2lzRmxvYXQnOiAnUGxlYXNlIGVudGVyIGEgZG9sbGFyIGFtb3VudCdcbiAgLCAnaXNJbnQnOiAnUGxlYXNlIGVudGVyIGEgbnVtYmVyJ1xuICB9XG5cbiwgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VnZ2VzdGVkQ292ZXJhZ2U6IG51bGxcbiAgICAsIGRhdGE6IHt9XG4gICAgLCBlcnJvcnM6IHt9XG4gICAgfVxuICB9XG5cbiwgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24obmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICB0aGlzLnVwZGF0ZUVycm9yVG9vbHRpcHModGhpcy5zdGF0ZS5lcnJvcnMsIG5leHRTdGF0ZS5lcnJvcnMsIHtcbiAgICAgIHBsYWNlbWVudDogYnNEZXZpY2UoKSA+PSBCb290c3RyYXBEZXZpY2UuTUQgPyAnYXV0byByaWdodCcgOiAnYm90dG9tJ1xuICAgICwgdHJpZ2dlcjogJ2hvdmVyIGNsaWNrJ1xuICAgICwgYW5pbWF0aW9uOiBmYWxzZVxuICAgICwgY29udGFpbmVyOiAnYm9keSdcbiAgICB9KVxuICB9XG5cbiwgaGFuZGxlUmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGZpZWxkUmVmIGluIHRoaXMuZmllbGRSZWZzKSB7XG4gICAgICB0aGlzLnJlZnNbZmllbGRSZWZdLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnXG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZGF0YToge31cbiAgICAsIGVycm9yczoge31cbiAgICB9KVxuICB9XG5cbiwgaGFuZGxlQ2FsY3VsYXRlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0YSA9IHt9XG4gICAgICAsIGVycm9ycyA9IHt9XG4gICAgZm9yICh2YXIgZmllbGRSZWYgaW4gdGhpcy5maWVsZHMpIHtcbiAgICAgIGRhdGFbZmllbGRSZWZdID0gdHJpbSh0aGlzLnJlZnNbZmllbGRSZWZdLmdldERPTU5vZGUoKS52YWx1ZSlcbiAgICAgIGlmICghZGF0YVtmaWVsZFJlZl0pIHtcbiAgICAgICAgZXJyb3JzW2ZpZWxkUmVmXSA9ICdUaGlzIGZpZWxkIGlzIHJlcXVpcmVkJ1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgdmFyIHZhbGlkYXRpb24gPSB0aGlzLmZpZWxkc1tmaWVsZFJlZl1cbiAgICAgIGlmICghdmFsaWRhdG9yW3ZhbGlkYXRpb25dKGRhdGFbZmllbGRSZWZdKSkge1xuICAgICAgICBlcnJvcnNbZmllbGRSZWZdID0gdGhpcy5lcnJvck1lc3NhZ2VzW3ZhbGlkYXRpb25dXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe2Vycm9yczogZXJyb3JzfSlcblxuICAgIHZhciBpc1ZhbGlkID0gdHJ1ZVxuICAgIGZvciAodmFyIGZpZWxkUmVmIGluIGVycm9ycykge1xuICAgICAgaXNWYWxpZCA9IGZhbHNlXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmIChpc1ZhbGlkKSB7XG4gICAgICAvLyBUT0RPIENhbGN1bGF0ZSBzdWdnZXN0ZWQgYW1vdW50XG4gICAgICBjb25zb2xlLmluZm8oZGF0YSlcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICwgc3VnZ2VzdGVkQ292ZXJhZ2U6IDEwMDAwMFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuLCBoYW5kbGVCYWNrOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtzdWdnZXN0ZWRDb3ZlcmFnZTogbnVsbH0pXG4gIH1cblxuLCBoYW5kbGVBY2NlcHQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucHJvcHMuaGFuZGxlQWNjZXB0KHRoaXMuc3RhdGUuc3VnZ2VzdGVkQ292ZXJhZ2UpXG4gICAgdGhpcy5oaWRlKClcbiAgfVxuXG4sIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJvZHksIGZvb3RlclxuICAgIGlmICh0aGlzLnN0YXRlLnN1Z2dlc3RlZENvdmVyYWdlID09PSBudWxsKSB7XG4gICAgICBib2R5ID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJPdXIgbmVlZHMgY2FsY3VsYXRvciBsZXRzIHlvdSBlc3RpbWF0ZSBob3cgbXVjaCBsaWZlIGluc3VyYW5jZSB5b3UgbWF5IG5lZWQgaW4gYWRkaXRpb24gdG8gdGhlIGFtb3VudCB5b3UgbWF5IGFscmVhZHkgb3duLlwiKSxcbiAgICAgICAgUmVhY3QuRE9NLmZvcm0oIHtyZWY6XCJmb3JtXCIsIGNsYXNzTmFtZTpcImZvcm0taG9yaXpvbnRhbFwiLCByb2xlOlwiZm9ybVwifSwgXG4gICAgICAgICAgdGhpcy5yZW5kZXJEb2xsYXJGaWVsZCgnbW9udGhseU5ldEluY29tZScsICdNb250aGx5IG5ldCBpbmNvbWUnLFxuICAgICAgICAgICAgSGVscEljb24obnVsbCwgXG4gICAgICAgICAgICAgIFwiIEFmdGVyLXRheCBlYXJuaW5ncyBwZXIgbW9udGggXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVySW50ZWdlckZpZWxkKCd5ZWFyc0luY29tZVByb3ZpZGVkJywgJ051bWJlciBvZiB5ZWFycyB5b3Ugd2lzaCB0byBwcm92aWRlIGluY29tZScsXG4gICAgICAgICAgICBIZWxwSWNvbihudWxsLCBcbiAgICAgICAgICAgICAgXCIgVGhpcyBudW1iZXIgaXMgaG93IG1hbnkgeWVhcnMgeW91IHdvdWxkIGxpa2UgdG8gZ2VuZXJhdGUgaW5jb21lIGZvciB5b3VyIGZhbWlseSBtZW1iZXJzIG9yIGJlbmVmaWNpYXJpZXMgaW4gb3JkZXIgdG8gY292ZXIgZXhwZW5zZXMgaWRlbnRpZmllZC4gXCIrXG4gICAgICAgICAgICAgIFwiTW9zdCBleHBlcnRzIHJlY29tbWVuZCBhIG1pbmltdW0gb2YgMy01IHllYXJzLiBcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICksXG4gICAgICAgICAgdGhpcy5yZW5kZXJEb2xsYXJGaWVsZCgnb3V0c3RhbmRpbmdNb3J0Z2FnZU9yUmVudCcsICdPdXRzdGFuZGluZyBtb3J0Z2FnZSBvciByZW50IHBheW1lbnRzJyxcbiAgICAgICAgICAgIEhlbHBJY29uKG51bGwsIFxuICAgICAgICAgICAgICBcIiBJbmNsdWRlIG1vcnRnYWdlIGJhbGFuY2UgYW5kIGhvbWUgZXF1aXR5IGxvYW4gYmFsYW5jZXMuIFwiK1xuICAgICAgICAgICAgICBcIk9yLCBkZXRlcm1pbmUgdGhlIHN1ZmZpY2llbnQgYW1vdW50IGZvciAxMCB5ZWFycywgb3IgMTIwIG1vbnRocywgb2YgcmVudC4gXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVyRG9sbGFyRmllbGQoJ2N1cnJlbnRPdXRzdGFuZGluZ0RlYnRzJywgJ0N1cnJlbnQgb3V0c3RhbmRpbmcgZGVidHMnLFxuICAgICAgICAgICAgSGVscEljb24obnVsbCwgXG4gICAgICAgICAgICAgIFwiIEluY2x1ZGUgY3JlZGl0IGNhcmRzLCBpbnN0YWxsbWVudCBjcmVkaXQgb3Igb3RoZXIgbG9hbiBkZWJ0cywgc3VjaCBhcyBzY2hvb2wgYW5kIGF1dG8uIFwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0aGlzLnJlbmRlckludGVnZXJGaWVsZCgnbnVtQ29sbGVnZUNoaWxkcmVuJywgJ051bWJlciBvZiBjaGlsZHJlbiB0byBhdHRlbmQgY29sbGVnZScsXG4gICAgICAgICAgICBIZWxwSWNvbihudWxsLCBcbiAgICAgICAgICAgICAgXCIgTnVtYmVyIG9mIGNoaWxkcmVuIHdobyBoYXZlIHlldCB0byBlbnRlciBjb2xsZWdlLiBUaGlzIHdvdWxkIG5vdCBpbmNsdWRlIGNoaWxkcmVuIHdobyBoYXZlIGNvbXBsZXRlZCBjb2xsZWdlLiBcIitcbiAgICAgICAgICAgICAgXCJDaGlsZHJlbiB3aG8gZG8gbm90IHJlcXVpcmUgY29sbGVnZSBmdW5kaW5nIGRvIG5vdCBuZWVkIHRvIGJlIGluY2x1ZGVkIGhlcmUuIFwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0aGlzLnJlbmRlckRvbGxhckZpZWxkKCdlc3RDb2xsZWdlRXhwZW5zZVBlckNoaWxkJywgJ0VzdGltYXRlZCBjb2xsZWdlIGV4cGVuc2VzIHBlciBjaGlsZCcsXG4gICAgICAgICAgICBIZWxwSWNvbihudWxsLCBcbiAgICAgICAgICAgICAgXCIgRm91ciB5ZWFycyBhdCBhIHByaXZhdGUgaW5zdGl0dXRpb24gYXZlcmFnZXMgJDEyOSwyMjguIFwiK1xuICAgICAgICAgICAgICBcIkZvdXIgeWVhcnMgYXQgYSBwdWJsaWMgaW5zdGl0dXRpb24gYXZlcmFnZXMgJDU0LDM1Ni4gXCIrXG4gICAgICAgICAgICAgIFwiQ29zdHMgaW5jbHVkZSB0dWl0aW9uIGZlZXMsIHJvb20gYW5kIGJvYXJkIGFzIHJlcG9ydGVkIGJ5IHRoZSBDb2xsZWdlIEJvYXJkLCBOZXcgWW9yayAyMDA3LiBcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICksXG4gICAgICAgICAgdGhpcy5yZW5kZXJEb2xsYXJGaWVsZCgnZXN0RmluYWxFeHBlbnNlcycsICdFc3RpbWF0ZWQgZmluYWwgZXhwZW5zZXMnLFxuICAgICAgICAgICAgSGVscEljb24obnVsbCwgXG4gICAgICAgICAgICAgIFwiIEZpbmFsIGV4cGVuc2UgY29zdHMgYXJlIHRoZSBjb3N0cyBhc3NvY2lhdGVkIHdpdGggYSBmdW5lcmFsIG9yIGZpbmFsIGVzdGF0ZSBzZXR0bGVtZW50IGNvc3RzLiBcIitcbiAgICAgICAgICAgICAgXCJBIHR5cGljYWwgYnVyaWFsIGNvc3RzIGJldHdlZW4gJDgsMDAwIGFuZCAkMTIsMDAwLiBcIlxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHtwbGFjZWhvbGRlcjogJzEwLDAwMCd9XG4gICAgICAgICAgKSxcbiAgICAgICAgICB0aGlzLnJlbmRlckRvbGxhckZpZWxkKCdjdXJyZW50TGlxdWlkQXNzZXRzJywgJ0N1cnJlbnQgbGlxdWlkIGFzc2V0cycsXG4gICAgICAgICAgICBIZWxwSWNvbihudWxsLCBcbiAgICAgICAgICAgICAgXCIgTGlxdWlkIGFzc2V0cyB3b3VsZCBpbmNsdWRlIHNhdmluZ3MgYW5kIGludmVzdG1lbnRzLCBidXQgd291bGQgbm90IGluY2x1ZGUgYSA0MDFLIG9yIHJlYWwgZXN0YXRlIHN1Y2ggYXMgYSBob3VzZS4gXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVyRG9sbGFyRmllbGQoJ3BlcnNvbmFsbHlPd25lZEluc3VyYW5jZScsICdQZXJzb25hbGx5IG93bmVkIGxpZmUgaW5zdXJhbmNlJyxcbiAgICAgICAgICAgIEhlbHBJY29uKG51bGwsIFxuICAgICAgICAgICAgICBcIiBUaGlzIG51bWJlciBzaG91bGQgZXF1YWwgdGhlIHRvdGFsIGFtb3VudCBvZiBjb3ZlcmFnZSBvbiB5b3VyIGxpZmUsIGluY2x1ZGluZyBjb3ZlcmFnZSBmcm9tIGFueSBpbmRpdmlkdWFsIHBvbGljaWVzLiBcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVSZXNldH0sIFwiUmVzZXRcIiksXG4gICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tcHJpbWFyeVwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlQ2FsY3VsYXRlfSwgXCJDYWxjdWxhdGVcIilcbiAgICAgIClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBib2R5ID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJCYXNlZCBvbiB0aGUgaW5mb3JtYXRpb24gZW50ZXJlZCwgeW91IG5lZWQgYSB0b3RhbCBvZiBcIiwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBmb3JtYXREb2xsYXJzKHRoaXMuc3RhdGUuc3VnZ2VzdGVkQ292ZXJhZ2UpKSwgXCIgaW4gb3JkZXIgdG8gY292ZXIgeW91ciBsaWZlIGluc3VyYW5jZSBuZWVkcy5cIiksXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJOb3RlOlwiKSwgXCIgVGhpcyBjYWxjdWxhdGlvbiBkb2VzIG5vdCBpbmNvcnBvcmF0ZSBhbnkgYXNzdW1wdGlvbnMgYWJvdXQgaW52ZXN0bWVudCByZXN1bHRzLCBlc3RhdGUgdGF4ZXMgb3IgaW5mbGF0aW9uLlwiKVxuICAgICAgKVxuICAgICAgZm9vdGVyID0gUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1kZWZhdWx0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVCYWNrfSwgXCJCYWNrXCIpLFxuICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLXByaW1hcnlcIiwgb25DbGljazp0aGlzLmhhbmRsZUFjY2VwdH0sIFwiQWNjZXB0XCIpXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbCBmYWRlXCJ9LCBcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1kaWFsb2dcIn0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtY29udGVudFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWhlYWRlclwifSwgXG4gICAgICAgICAgICB0aGlzLnJlbmRlckNsb3NlQnV0dG9uKCksXG4gICAgICAgICAgICBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiTmVlZHMgQ2FsY3VsYXRvclwiKVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWJvZHlcIn0sIFxuICAgICAgICAgICAgYm9keVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWZvb3RlclwiLCBzdHlsZTp7bWFyZ2luVG9wOiAwfX0sIFxuICAgICAgICAgICAgZm9vdGVyXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuICB9XG5cbiwgcmVuZGVyRG9sbGFyRmllbGQ6IGZ1bmN0aW9uKGlkLCBsYWJlbCwgaGVscCwga3dhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyRmllbGQoaWQsIGxhYmVsLCBoZWxwLFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwifSwgXCIkXCIpLFxuICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOmlkLCBpZDppZCxcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6dGhpcy5zdGF0ZS5kYXRhW2lkXSB8fCAnJyxcbiAgICAgICAgICBwbGFjZWhvbGRlcjprd2FyZ3MgJiYga3dhcmdzLnBsYWNlaG9sZGVyIHx8ICcnfVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuICB9XG5cbiwgcmVuZGVySW50ZWdlckZpZWxkOiBmdW5jdGlvbihpZCwgbGFiZWwsIGhlbHApIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJGaWVsZChpZCwgbGFiZWwsIGhlbHAsXG4gICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwidGV4dFwiLCBjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOmlkLCBpZDppZCxcbiAgICAgICAgZGVmYXVsdFZhbHVlOnRoaXMuc3RhdGUuZGF0YVtpZF0gfHwgJyd9XG4gICAgICApXG4gICAgKVxuICB9XG5cbiwgcmVuZGVyRmllbGQ6IGZ1bmN0aW9uKGlkLCBsYWJlbCwgaGVscCwgZmllbGQpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTokYygnZm9ybS1ncm91cCcsIHsnaGFzLWVycm9yJzogaWQgaW4gdGhpcy5zdGF0ZS5lcnJvcnN9KX0sIFxuICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7aHRtbEZvcjppZCwgY2xhc3NOYW1lOlwiY29sLXNtLTggY29udHJvbC1sYWJlbFwifSwgbGFiZWwpLFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS0zXCJ9LCBcbiAgICAgICAgZmllbGRcbiAgICAgICksXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTFcIn0sIFxuICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbC1zdGF0aWNcIn0sIFxuICAgICAgICAgIGhlbHBcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBOZWVkc0NhbGN1bGF0b3JNb2RhbCIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIEJvb3RzdHJhcE1vZGFsTWl4aW4gPSByZXF1aXJlKCdCb290c3RyYXBNb2RhbE1peGluJylcbnZhciBHbG9iYWxNb2RhbCA9IHJlcXVpcmUoJ0dsb2JhbE1vZGFsJylcbnZhciBJbmNyZW1lbnRpbmdLZXlNaXhpbiA9IHJlcXVpcmUoJ0luY3JlbWVudGluZ0tleU1peGluJylcbnZhciBMaWZlUXVvdGVDb25zdGFudHMgPSByZXF1aXJlKCdMaWZlUXVvdGVDb25zdGFudHMnKVxuXG52YXIgUGVybWFuZW50SW5zdXJhbmNlTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQZXJtYW5lbnRJbnN1cmFuY2VNb2RhbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1vZGFsTWl4aW4sIEluY3JlbWVudGluZ0tleU1peGluXVxuXG4sIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdsb2JhbE1vZGFsOiBudWxsXG4gICAgfVxuICB9XG5cbiwgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsIGZhZGVcIn0sIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWRpYWxvZ1wifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1jb250ZW50XCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtaGVhZGVyXCJ9LCBcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQ2xvc2VCdXR0b24oKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJQZXJtYW5lbnQgSW5zdXJhbmNlXCIpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtYm9keVwifSwgXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiVGhhbmtzIGZvciB5b3VyIGludGVyZXN0IGluIHBlcm1hbmVudCBsaWZlIGluc3VyYW5jZS5cIikpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJUaGUgYmVzdCB3YXkgdG8gZ2V0IGEgcXVvdGUgZm9yIHBlcm1hbmVudCBsaWZlIGluc3VyYW5jZSBpcyB0byBzcGVhayBkaXJlY3RseSB3aXRoIG9uZSBvZiBvdXIgZXhwZXJpZW5jZWQgYWdlbnRzLiBUaGVyZSBhcmUgc2V2ZXJhbCB3YXlzIHRvIGdldCBpbiB0b3VjaCB3aXRoIHlvdXIgbG9jYWwgYWdlbnQ6XCIpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJ0ZXh0LWNlbnRlclwifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5hKCB7aHJlZjpMaWZlUXVvdGVDb25zdGFudHMuTE9DQUxfU0FMRVNfQUdFTlRfVVJMLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIFwiRmluZCB5b3VyIGxvY2FsIGFnZW50IFwiLCBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tc2hhcmVcIn0pKSxcbiAgICAgICAgICAgICAgJyAnLFxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIiwgb25DbGljazp0aGlzLmhhbmRsZVNob3dHbG9iYWxNb2RhbC5iaW5kKG51bGwsIEdsb2JhbE1vZGFsLldFX0NBTExfWU9VKX0sIFwiV2XigJlsbCBjYWxsIHlvdVwiKSxcbiAgICAgICAgICAgICAgJyAnLFxuICAgICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIiwgb25DbGljazp0aGlzLmhhbmRsZVNob3dHbG9iYWxNb2RhbC5iaW5kKG51bGwsIEdsb2JhbE1vZGFsLkVNQUlMX1VTKX0sIFwiRW1haWwgdXNcIilcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH1cblxuLCBoYW5kbGVTaG93R2xvYmFsTW9kYWw6IGZ1bmN0aW9uKGdsb2JhbE1vZGFsKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7Z2xvYmFsTW9kYWw6IGdsb2JhbE1vZGFsfSlcbiAgICB0aGlzLmhpZGUoKVxuICB9XG5cbiwgaGFuZGxlSGlkZGVuOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5nbG9iYWxNb2RhbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5wcm9wcy5oYW5kbGVTaG93R2xvYmFsTW9kYWwodGhpcy5zdGF0ZS5nbG9iYWxNb2RhbClcbiAgICB9XG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gUGVybWFuZW50SW5zdXJhbmNlTW9kYWwiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBMaWZlUXVvdGVSZWZEYXRhID0gcmVxdWlyZSgnTGlmZVF1b3RlUmVmRGF0YScpXG5cbnZhciBCb290c3RyYXBNb2RhbE1peGluID0gcmVxdWlyZSgnQm9vdHN0cmFwTW9kYWxNaXhpbicpXG52YXIgSW5jcmVtZW50aW5nS2V5TWl4aW4gPSByZXF1aXJlKCdJbmNyZW1lbnRpbmdLZXlNaXhpbicpXG5cbnZhciBQb2xpY3lBZHZpc29yTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQb2xpY3lBZHZpc29yTW9kYWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNb2RhbE1peGluLCBJbmNyZW1lbnRpbmdLZXlNaXhpbl1cblxuLCBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwb2xpY3lDb2RlOiBudWxsXG4gICAgfVxuICB9XG5cbiwgaGFuZGxlQ2hhbmdlOiBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7cG9saWN5Q29kZTogZS50YXJnZXQudmFsdWV9KVxuICB9XG5cbiwgaGFuZGxlUmV0dXJuVG9RdW90ZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5wcm9wcy5oYW5kbGVTZWxlY3RQcm9kdWN0Q29kZShOdW1iZXIodGhpcy5zdGF0ZS5wb2xpY3lDb2RlKSlcbiAgICB0aGlzLmhpZGUoKVxuICB9XG5cbiwgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmFkaW9zID0gTGlmZVF1b3RlUmVmRGF0YS5QUk9EVUNUX0NPREVTLm1hcChmdW5jdGlvbihwcm9kdWN0KSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLmxhYmVsKCB7Y2xhc3NOYW1lOlwicmFkaW8taW5saW5lXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcInJhZGlvXCIsIG5hbWU6XCJwb2xpY3lDb2RlXCIsIHZhbHVlOnByb2R1Y3QuY29kZSwgb25DaGFuZ2U6dGhpcy5oYW5kbGVDaGFuZ2V9KSwgcHJvZHVjdC5uYW1lXG4gICAgICApXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwgZmFkZVwifSwgXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZGlhbG9nXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWNvbnRlbnRcIn0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1oZWFkZXJcIn0sIFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJDbG9zZUJ1dHRvbigpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlBvbGljeSBBZHZpc29yXCIpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtYm9keVwiLCBzdHlsZTp7aGVpZ2h0OiA1MDAsIG92ZXJmbG93WTogJ3Njcm9sbCd9fSwgXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiV2hhdCBraW5kIG9mIGxpZmUgaW5zdXJhbmNlIHBvbGljeSBzaG91bGQgeW91IGJ1eT9cIikpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJUaGF0IGRlcGVuZHMgb24geW91ciBuZWVkcyBhbmQgYnVkZ2V0LiBBIGdvb2QgZmlyc3Qgc3RlcCBpcyB0byBkZXRlcm1pbmUgaWYgeW91ciBuZWVkcyBhcmUgdGVtcG9yYXJ5IG9yIHBlcm1hbmVudC4gRm9yIGV4YW1wbGUsIGEgbW9ydGdhZ2UgaXMgYSB0ZW1wb3JhcnkgbmVlZCwgYmVjYXVzZSB5b3VyIG1vcnRnYWdlIHdpbGwgZXZlbnR1YWxseSBiZSBwYWlkIG9mZi4gRnVuZHMgZm9yIGZpbmFsIGV4cGVuc2VzIGFyZSBwZXJtYW5lbnQsIGJlY2F1c2UgdGhlIG5lZWQgd2lsbCBuZXZlciBnbyBhd2F5LlwiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS50YWJsZSgge2NsYXNzTmFtZTpcInRhYmxlIHRhYmxlLWJvcmRlcmVkXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnRoZWFkKG51bGwsIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50aChudWxsLCBcIlRlbXBvcmFyeSBOZWVkc1wiKSxcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50aChudWxsLCBcIlBlcm1hbmVudCBOZWVkc1wiKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnRib2R5KG51bGwsIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50ZChudWxsLCBcIk1vcnRnYWdlXCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIFwiSW5jb21lIHJlcGxhY2VtZW50XCIpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgXCJDb2xsZWdlIGVkdWNhdGlvblwiKSxcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50ZChudWxsLCBcIkZpbmFsIGV4cGVuc2VzXCIpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgXCJDaGlsZCBjYXJlXCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIFwiRW1lcmdlbmN5IGZ1bmRcIilcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIkdlbmVyYWxseSBzcGVha2luZywgdGVybSBsaWZlIGluc3VyYW5jZSBpcyBhIGdvb2QgZml0IGZvciBwZW9wbGUgd2l0aCB0ZW1wb3JhcnkgbmVlZHMsIHN1Y2ggYXMgcHJvdGVjdGluZyBhIG1vcnRnYWdlIG9yIGNvdmVyaW5nIGNvc3RzIGFzc29jaWF0ZWQgd2l0aCByYWlzaW5nIGNoaWxkcmVuLCBzdWNoIGFzIGRhaWx5IGNoaWxkIGNhcmUuIEluaXRpYWxseSwgaXTigJlzIHVzdWFsbHkgdGhlIGxlYXN0IGV4cGVuc2l2ZSBjb3ZlcmFnZSB5b3UgY2FuIGJ1eS5cIiksXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIk1hbnkgcGVvcGxlIGhhdmUgcGVybWFuZW50IG5lZWRzLCBzdWNoIGFzIHBheWluZyBmb3IgZmluYWwgZXhwZW5zZXMgYW5kIHJlcGxhY2luZyBpbmNvbWUgc2hvdWxkIGEgYnJlYWR3aW5uZXIgZGllIHByZW1hdHVyZWx5LiBQZXJtYW5lbnQgaW5zdXJhbmNlIGxhc3RzIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIGluc3VyZWQuXCIpLFxuXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBSZWFjdC5ET00uc3Ryb25nKG51bGwsIFwiV2hhdOKAmXMgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0ZXJtIGFuZCBwZXJtYW5lbnQgbGlmZSBpbnN1cmFuY2U/XCIpKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS50YWJsZSgge2NsYXNzTmFtZTpcInRhYmxlIHRhYmxlLWJvcmRlcmVkXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnRoZWFkKG51bGwsIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50aChudWxsLCBcIlRlcm1cIiksXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGgobnVsbCwgXCJQZXJtYW5lbnRcIilcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS50Ym9keShudWxsLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgXCJMb3dlc3QgaW5pdGlhbCBjb3N0XCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIFwiRml4ZWQgcHJlbWl1bXNcIilcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50ZChudWxsLCBcIk1vcmUgY292ZXJhZ2UgcGVyIGRvbGxhclwiKSxcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50ZChudWxsLCBcIkNhc2ggdmFsdWUgYWNjdW11bGF0aW9uXCIpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgXCJQcmVtaXVtcyB3aWxsIGluY3JlYXNlIGFmdGVyIGluaXRpYWwgdGVybSBwZXJpb2RcIiksXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgXCJHdWFyYW50ZWVkIGNhc2ggdmFsdWVcIilcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50ZChudWxsLCBcIkNvdmVyYWdlIGlzIG5vdCBwZXJtYW5lbnQoMilcIiksXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgXCJDb3ZlcmFnZSBmb3IgbGlmZSgxKSwgYXMgbG9uZyBhcyBwcmVtaXVtcyBhcmUgcGFpZFwiKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSxcblxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgUmVhY3QuRE9NLnN0cm9uZyhudWxsLCBcIlRlcm0gbGlmZSBpbnN1cmFuY2VcIikpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJUZXJtIGluc3VyYW5jZSBwcm92aWRlcyBjb3ZlcmFnZSBmb3IgYSBzcGVjaWZpYyBwZXJpb2Qgb2YgdGltZSwgc3VjaCBhcyAxMCwgMjAgb3IgMzAgeWVhcnMuIElmIHlvdSBkaWUgZHVyaW5nIHRoYXQgcGVyaW9kLCB0aGUgYmVuZWZpY2lhcnkgeW91IG5hbWUgb24geW91ciBwb2xpY3kgcmVjZWl2ZXMgdGhlIGRlYXRoIGJlbmVmaXQgYW1vdW50LiBXaGVuIHRoZSB0ZXJtIGVuZHMsIHNvIGRvZXMgeW91ciBwcm90ZWN0aW9uLCB1bmxlc3MgeW91IHNlbGVjdCBhIHRlcm0gcG9saWN5IHRoYXQgZ2l2ZXMgeW91IHRoZSBvcHRpb24gb2YgcmVuZXdpbmcgeW91ciBjb3ZlcmFnZS5cIiksXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIlRlcm0gcG9saWNpZXMgZG9u4oCZdCBidWlsZCBjYXNoIHZhbHVlIGFzIG1vc3QgcGVybWFuZW50IGxpZmUgaW5zdXJhbmNlIHByb2R1Y3RzIGRvLiBCZWNhdXNlIG9mIHRoaXMgZmFjdCwgd2hlbiB5b3UgYnV5IGEgdGVybSBwb2xpY3kgeW914oCZcmUgcGF5aW5nIGZvciBwdXJlIHByb3RlY3Rpb24uIFNvIG1vc3Qgb2YgdGhlIHRpbWUsIHRlcm0gaW5zdXJhbmNlIGlzIHRoZSBsZWFzdCBleHBlbnNpdmUga2luZCBvZiBjb3ZlcmFnZSB5b3UgY2FuIGJ1eS5cIiksXG5cbiAgICAgICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJQZXJtYW5lbnQgbGlmZSBpbnN1cmFuY2VcIikpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJQZXJtYW5lbnQgcG9saWNpZXMgcHJvdmlkZSBwcm90ZWN0aW9uIGZvciB5b3VyIGVudGlyZSBsaWZlIGJ5IHBheWluZyBhIHN1bSB0byB5b3VyIGJlbmVmaWNpYXJ5IHVwb24geW91ciBkZWF0aCgxKS4gTW9zdCBwZXJtYW5lbnQgcG9saWNpZXMgYnVpbGQgY2FzaCB2YWx1ZSBvdmVyIHRpbWUsIGFuZCB5b3UgY2FuIGFjY2VzcyB0aGlzIGNhc2ggdmFsdWUgZm9yIGVtZXJnZW5jaWVzLCBvcHBvcnR1bml0aWVzIG9yIHBsYW5uZWQgbGlmZSBldmVudHMgc3VjaCBhcyBhIGNvbGxlZ2UgZWR1Y2F0aW9uIG9yIHJldGlyZW1lbnQuXCIpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJUaGVyZSBhcmUgZGlmZmVyZW50IHR5cGVzIG9mIHBlcm1hbmVudCBwb2xpY2llcy4gV2hvbGUgbGlmZSBwb2xpY2llcyB1c3VhbGx5IG9mZmVyIGxldmVsIHByZW1pdW1zIGFuZCBzdHJvbmcsIHRyYWRpdGlvbmFsIGd1YXJhbnRlZXMsIHN1Y2ggYXMgYSBzY2hlZHVsZSBvZiBndWFyYW50ZWVkIHZhbHVlcy4gVW5pdmVyc2FsIGxpZmUgcG9saWNpZXMgbm9ybWFsbHkgb2ZmZXIgZmxleGlibGUgZmVhdHVyZXMsIHN1Y2ggYXMgdGhlIGFiaWxpdHkgdG8gY2hhbmdlIHlvdXIgY292ZXJhZ2UgYW1vdW50IG9yIHlvdXIgcGF5bWVudCBzY2hlZHVsZSBhZnRlciB5b3UgcHVyY2hhc2UgdGhlIHBvbGljeS4gQSB2YXJpYXRpb24gb24gdW5pdmVyc2FsIGxpZmUsIHZhcmlhYmxlIHVuaXZlcnNhbCBsaWZlIGFsbG93cyB5b3UgdG8gaW52ZXN0IHlvdXIgcG9saWN54oCZcyBjYXNoIHZhbHVlcyBpbiBmaXhlZCBhY2NvdW50cyBhbmQgc3ViLWFjY291bnRzIHRoYXQgaGF2ZSB0aGUgcG90ZW50aWFsIHRvIGVhcm4gbWFya2V0IHJldHVybnMuIFwiICksXG4gICAgICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIkZpbmFsbHksIHNpbmdsZSBwYXltZW50IHdob2xlIGxpZmUgaXMgYSB0eXBlIG9mIGxpZmUgaW5zdXJhbmNlIHlvdSBidXkgd2l0aCBvbmUgcGF5bWVudC4gQmVjYXVzZSB0aGUgZGVhdGggYmVuZWZpdCBpcyBoaWdoZXIgdGhhbiB0aGUgc2luZ2xlIHBheW1lbnQsIHRoaXMga2luZCBvZiBsaWZlIGluc3VyYW5jZSBpcyBvZnRlbiBhIGdvb2QgZml0IGZvciBwZW9wbGUgbG9va2luZyB0byB0cmFuc2ZlciB3ZWFsdGguXCIpLFxuXG4gICAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZm9vdG5vdGVzXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCIoMSkgTWFueSBwZXJtYW5lbnQgcG9saWNpZXMgZW5kb3cgYXQgYWdlIDEyMS5cIiksXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiKDIpIFNvbWUgdGVybSBwb2xpY2llcyBvZmZlciB0aGUgb3B0aW9uIHRvIGNvbnRpbnVlIGNvdmVyYWdlIGF0IHRoZSBlbmQgb2YgdGhlIGxldmVsIHRlcm0gcGVyaW9kLiBJbiBtb3N0IGNhc2VzLCBwcmVtaXVtcyB3aWxsIGluY3JlYXNlIGFubnVhbGx5IGFzIHlvdSBhZ2UuXCIpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtZm9vdGVyXCIsIHN0eWxlOnttYXJnaW5Ub3A6IDB9fSwgXG4gICAgICAgICAgICByYWRpb3MsXG4gICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLXByaW1hcnlcIiwgb25DbGljazp0aGlzLmhhbmRsZVJldHVyblRvUXVvdGV9LCBcIlJldHVybiB0byBxdW90ZVwiKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBQb2xpY3lBZHZpc29yTW9kYWwiLCJ2YXIgTGlmZVF1b3RlUmVmRGF0YSA9IHJlcXVpcmUoJ0xpZmVRdW90ZVJlZkRhdGEnKVxuXG52YXIgbWFrZUVudW0gPSByZXF1aXJlKCdtYWtlRW51bScpXG5cbnZhciBQcm9kdWN0Q29kZSA9IG1ha2VFbnVtKExpZmVRdW90ZVJlZkRhdGEuUFJPRFVDVF9DT0RFUywgJ25hbWUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2R1Y3RDb2RlIiwidmFyIExpZmVRdW90ZVJlZkRhdGEgPSByZXF1aXJlKCdMaWZlUXVvdGVSZWZEYXRhJylcblxudmFyIG1ha2VMb29rdXAgPSByZXF1aXJlKCdtYWtlTG9va3VwJylcblxudmFyIFByb2R1Y3RDb2RlcyA9IG1ha2VMb29rdXAoTGlmZVF1b3RlUmVmRGF0YS5QUk9EVUNUX0NPREVTKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2R1Y3RDb2RlcyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIEJvb3RzdHJhcE1vZGFsTWl4aW4gPSByZXF1aXJlKCdCb290c3RyYXBNb2RhbE1peGluJylcbnZhciBJbmNyZW1lbnRpbmdLZXlNaXhpbiA9IHJlcXVpcmUoJ0luY3JlbWVudGluZ0tleU1peGluJylcblxudmFyIFFBbmRBTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdRQW5kQU1vZGFsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTW9kYWxNaXhpbiwgSW5jcmVtZW50aW5nS2V5TWl4aW5dXG5cbiwgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsIGZhZGVcIn0sIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWRpYWxvZ1wifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1jb250ZW50XCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtaGVhZGVyXCJ9LCBcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQ2xvc2VCdXR0b24oKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJRdWVzdGlvbnMgXCIsICcmJywgXCIgQW5zd2Vyc1wiKVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWJvZHlcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJxdWVzdGlvblwifSwgXCJXaHkgZG8geW91IGFzayBmb3IgbXkgZ2VuZGVyIGFuZCBhZ2U/XCIpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJQcmljaW5nIGZvciBsaWZlIGluc3VyYW5jZSBpcyBiYXNlZCBvbiBtb3J0YWxpdHksIG9yIGluIG90aGVyIHdvcmRzLCB0aGUgcHJlZGljdGlvbiBvZiBob3cgbG9uZyB5b3Ugd2lsbCBsaXZlLiBUaGF0IHByZWRpY3Rpb24gaXMgYmFzZWQgb24gbWFueSBmYWN0b3JzLCBpbmNsdWRpbmcgeW91ciBhZ2UgYW5kIGdlbmRlci4gT2J2aW91c2x5LCBpZiB5b3UgYXJlIG9sZGVyLCB5b3Ugd2lsbCBsaWtlbHkgcGFzcyBhd2F5IGJlZm9yZSBzb21lb25lIHdobyBpcyBzdWJzdGFudGlhbGx5IHlvdW5nZXIuIEFuZCBnZW5kZXIgcGxheXMgYSByb2xlIGJlY2F1c2Ugc3RhdGlzdGljYWxseSBzcGVha2luZywgd29tZW4gYXJlIGxpa2VseSB0byBsaXZlIGxvbmdlciB0aGFuIG1lbi5cIiksXG4gICAgICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcInF1ZXN0aW9uXCJ9LCBcIldoeSBkbyB5b3UgYXNrIGlmIEkgdXNlIHRvYmFjY28gcHJvZHVjdHM/XCIpLFxuICAgICAgICAgICAgUmVhY3QuRE9NLnAobnVsbCwgXCJQcmljaW5nIGZvciBsaWZlIGluc3VyYW5jZSBpcyBiYXNlZCBvbiBhIHByZWRpY3Rpb24gb2YgaG93IGxvbmcgeW91IHdpbGwgbGl2ZS4gU3RhdGlzdGljcyBzaG93IHBlb3BsZSB3aG8gdXNlIHRvYmFjY28gcHJvZHVjdHMgaGF2ZSBhIGhpZ2hlciBtb3J0YWxpdHkgcmF0ZSDigJMgb3IgYSBoaWdoZXIgbGlrZWxpaG9vZCBvZiBwYXNzaW5nIGF3YXkgc29vbmVyIOKAkyB0aGFuIG5vbi1zbW9rZXJzLlwiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5wKCB7Y2xhc3NOYW1lOlwicXVlc3Rpb25cIn0sIFwiV2hhdOKAmXMgYW4gdW5kZXJ3cml0aW5nIGNsYXNzP1wiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiQW4gdW5kZXJ3cml0aW5nIGNsYXNzIGlzIGEgZ2VuZXJhbCBjbGFzc2lmaWNhdGlvbiB0aGF0IGRlc2NyaWJlcyB5b3VyIG92ZXJhbGwgaGVhbHRoLiBUaGVzZSBjbGFzc2lmaWNhdGlvbnMgaGF2ZSBuYW1lcyBsaWtlIOKAmEVsaXRlIFByZWZlcnJlZOKAmSBmb3IgdGhlIGhlYWx0aGllc3QgaW5kaXZpZHVhbHMgYW5kIOKAmFN0YW5kYXJk4oCZIGZvciBpbmRpdmlkdWFscyB3aXRoIGdlbmVyYWxseSBnb29kIGhlYWx0aC4gWW91ciB1bmRlcndyaXRpbmcgY2xhc3MgZGlyZWN0bHkgaW1wYWN0cyB0aGUgcHJpY2UgeW91IHdpbGwgcGF5IGZvciBjb3ZlcmFnZSwgYmVjYXVzZSBoZWFsdGh5IHBlb3BsZSB0ZW5kIHRvIGxpdmUgbG9uZ2VyLlwiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiVGhlIG1lZGljYWwgcXVlc3Rpb25zIHdlIGFzayBoZXJlIGhlbHAgeW91IGFycml2ZSBhdCBhbiBlc3RpbWF0ZWQgdW5kZXJ3cml0aW5nIGNsYXNzLCB3aGljaCBpcyB0aGVuIHVzZWQgdG8gY2FsY3VsYXRlIHlvdXIgcXVvdGUuIFlvdXIgYW5zd2VycyB0byB0aGUgbWVkaWNhbCBxdWVzdGlvbnMgYXJlIG5vdCBzYXZlZCBpbiBhbnkgd2F5LlwiKVxuICAgICAgICAgICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWZvb3RlclwiLCBzdHlsZTp7bWFyZ2luVG9wOiAwfX0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiYnRuIGJ0bi1wcmltYXJ5XCIsIG9uQ2xpY2s6dGhpcy5oaWRlfSwgXCJSZXR1cm4gdG8gcXVvdGVcIilcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gUUFuZEFNb2RhbCIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIEdlbmRlcnMgPSByZXF1aXJlKCdHZW5kZXJzJylcbnZhciBIZWFsdGhDb2RlcyA9IHJlcXVpcmUoJ0hlYWx0aENvZGVzJylcbnZhciBQcm9kdWN0Q29kZXMgPSByZXF1aXJlKCdQcm9kdWN0Q29kZXMnKVxudmFyIFN0YXRlcyA9IHJlcXVpcmUoJ1N0YXRlcycpXG52YXIgU3RlcCA9IHJlcXVpcmUoJ1N0ZXAnKVxuXG52YXIgZm9ybWF0RG9sbGFycyA9IHJlcXVpcmUoJ2Zvcm1hdERvbGxhcnMnKVxuXG52YXIgUXVvdGVJbmZvID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUXVvdGVJbmZvJyxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGVhZGVyUm93ID0gW1JlYWN0LkRPTS50aChudWxsKV1cbiAgICAgICwgYW5udWFsUm93ID0gW1JlYWN0LkRPTS50aChudWxsLCBcIkFubnVhbFwiKV1cbiAgICAgICwgbW9udGhseVJvdyA9IFtSZWFjdC5ET00udGgobnVsbCwgXCJNb250aGx5XCIpXVxuICAgIHRoaXMucHJvcHMucGF5bWVudHMuZm9yRWFjaChmdW5jdGlvbihwYXltZW50KSB7XG4gICAgICBoZWFkZXJSb3cucHVzaChSZWFjdC5ET00udGgobnVsbCwgcGF5bWVudC50ZXJtLCBcIiB5ZWFyXCIpKVxuICAgICAgYW5udWFsUm93LnB1c2goUmVhY3QuRE9NLnRkKG51bGwsIHBheW1lbnQuYW5udWFsUGF5bWVudC50b0ZpeGVkKDIpKSlcbiAgICAgIG1vbnRobHlSb3cucHVzaChSZWFjdC5ET00udGQobnVsbCwgcGF5bWVudC5tb250aGx5UGF5bWVudC50b0ZpeGVkKDIpKSlcbiAgICB9KVxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIn0sIFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIkNvbmdyYXR1bGF0aW9ucyEgWW914oCZdmUganVzdCB0YWtlbiB0aGUgZmlyc3Qgc3RlcCB0b3dhcmQgc2VjdXJpbmcgeW91ciBsb3ZlZCBvbmVz4oCZIGZpbmFuY2lhbCBmdXR1cmUuIFlvdXIgbGlmZSBpbnN1cmFuY2UgcXVvdGUgaXMgYmVsb3cuIFdoYXTigJlzIG5leHQ/IEZvcndhcmQgeW91ciBxdW90ZSB0byBvbmUgb2Ygb3VyIGV4cGVyaWVuY2VkIGFnZW50cyB3aG8gd2lsbCB3YWxrIHlvdSB0aHJvdWdoIHRoZSBhcHBsaWNhdGlvbiBwcm9jZXNzLlwiKSxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInJvd1wifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNvbC1zbS02XCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5oMyhudWxsLCBcIllvdXIgSW5mb3JtYXRpb25cIiksXG4gICAgICAgICAgICBSZWFjdC5ET00udGFibGUoIHtjbGFzc05hbWU6XCJ0YWJsZSB0YWJsZS1ib3JkZXJlZFwifSwgXG4gICAgICAgICAgICAgIFJlYWN0LkRPTS50Ym9keShudWxsLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGgobnVsbCwgXCJHZW5kZXJcIiksXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgR2VuZGVyc1t0aGlzLnByb3BzLmdlbmVyYWxJbmZvLmdlbmRlcl0udGl0bGUpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGgobnVsbCwgXCJBZ2VcIiksXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGQobnVsbCwgdGhpcy5wcm9wcy5nZW5lcmFsSW5mby5hZ2UpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGgobnVsbCwgXCJTdGF0ZVwiKSxcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50ZChudWxsLCBTdGF0ZXNbdGhpcy5wcm9wcy5nZW5lcmFsSW5mby5zdGF0ZUNvZGVdLmFiYnJldmlhdGlvbilcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50aChudWxsLCBcIlRvYmFjY28gVXNlXCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIHRoaXMucHJvcHMuZ2VuZXJhbEluZm8udG9iYWNjbyA/ICdTbW9rZXInIDogJ05vbiBTbW9rZXInKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRyKG51bGwsIFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRoKG51bGwsIFwiQW1vdW50IG9mIGNvdmVyYWdlXCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIGZvcm1hdERvbGxhcnModGhpcy5wcm9wcy5nZW5lcmFsSW5mby5jb3ZlcmFnZSkpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5ET00udHIobnVsbCwgXG4gICAgICAgICAgICAgICAgICBSZWFjdC5ET00udGgobnVsbCwgXCJUeXBlIG9mIGNvdmVyYWdlXCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIFByb2R1Y3RDb2Rlc1t0aGlzLnByb3BzLmdlbmVyYWxJbmZvLnByb2R1Y3RDb2RlXS5uYW1lKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRyKG51bGwsIFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRoKG51bGwsIFwiVW5kZXJ3cml0aW5nIGNsYXNzXCIpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRkKG51bGwsIEhlYWx0aENvZGVzW3RoaXMucHJvcHMuZ2VuZXJhbEluZm8uaGVhbHRoQ29kZV0udGl0bGUpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTZcIn0sIFxuICAgICAgICAgICAgUmVhY3QuRE9NLmgzKG51bGwsIFwiVGVybVwiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS50YWJsZSgge2NsYXNzTmFtZTpcInRhYmxlIHRhYmxlLWJvcmRlcmVkXCJ9LCBcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnRoZWFkKG51bGwsIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIGhlYWRlclJvd1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgUmVhY3QuRE9NLnRib2R5KG51bGwsIFxuICAgICAgICAgICAgICAgIFJlYWN0LkRPTS50cihudWxsLCBcbiAgICAgICAgICAgICAgICAgIGFubnVhbFJvd1xuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgUmVhY3QuRE9NLnRyKG51bGwsIFxuICAgICAgICAgICAgICAgICAgbW9udGhseVJvd1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1mb290ZXJcIn0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTEyXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdCBwdWxsLWxlZnRcIiwgb25DbGljazp0aGlzLnByb3BzLnNldEFjdGl2ZVN0ZXAuYmluZChudWxsLCBTdGVwLkdFTkVSQUxfSU5GTyl9LCBcIkVkaXRcIiksXG4gICAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJidG4gYnRuLXByaW1hcnkgcHVsbC1yaWdodFwiLCBvbkNsaWNrOnRoaXMucHJvcHMuc2V0QWN0aXZlU3RlcC5iaW5kKG51bGwsIFN0ZXAuU0VORF9RVU9URSl9LCBcIkZvcndhcmQgdG8gQWdlbnRcIilcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gUXVvdGVJbmZvIiwiLyoqXG4gKiBEaXNwbGF5cyBhIGxpc3Qgb2YgcmFkaW8gYnV0dG9ucyB3aXRoIHRoZSBnaXZlbiBsYWJlbHMgYW5kIG1hbmFnZXMgdHJhY2tpbmdcbiAqIG9mIHRoZSBzZWxlY3RlZCBpbmRleCBhbmQgbGFiZWwuXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG52YXIgUmFkaW9TZWxlY3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSYWRpb1NlbGVjdCcsXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhhc1NlbGVjdGVkSW5kZXggPSAodHlwZW9mIHRoaXMucHJvcHMuc2VsZWN0ZWRJbmRleCAhPSAndW5kZWZpbmVkJylcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0ZWRJbmRleDogKGhhc1NlbGVjdGVkSW5kZXggPyB0aGlzLnByb3BzLnNlbGVjdGVkSW5kZXg6IG51bGwpXG4gICAgLCBzZWxlY3RlZExhYmVsOiAoaGFzU2VsZWN0ZWRJbmRleCA/IHRoaXMucHJvcHMubGFiZWxzW3RoaXMucHJvcHMuc2VsZWN0ZWRJbmRleF0gOiBudWxsKVxuICAgIH1cbiAgfVxuXG4sIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJhZGlvcyA9IHRoaXMucHJvcHMubGFiZWxzLm1hcChmdW5jdGlvbihsYWJlbCwgaSkge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJyYWRpb1wifSwgXG4gICAgICAgIFJlYWN0LkRPTS5sYWJlbChudWxsLCBcbiAgICAgICAgICBSZWFjdC5ET00uaW5wdXQoIHt0eXBlOlwicmFkaW9cIixcbiAgICAgICAgICAgIHJlZjp0aGlzLnByb3BzLnJlZiArICdfJyArIGksXG4gICAgICAgICAgICBuYW1lOnRoaXMucHJvcHMucmVmLFxuICAgICAgICAgICAgdmFsdWU6aSxcbiAgICAgICAgICAgIGNoZWNrZWQ6dGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4ID09PSBpLFxuICAgICAgICAgICAgb25DaGFuZ2U6dGhpcy5oYW5kbGVDaGFuZ2UuYmluZCh0aGlzLCBpLCBsYWJlbCl9KSxcbiAgICAgICAgICBsYWJlbFxuICAgICAgICApXG4gICAgICApXG4gICAgfS5iaW5kKHRoaXMpKVxuICAgIHJldHVybiBSZWFjdC5ET00uZGl2KG51bGwsIHJhZGlvcylcbiAgfVxuXG4sIGhhbmRsZUNoYW5nZTogZnVuY3Rpb24oaSwgbGFiZWwpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IGlcbiAgICAsIHNlbGVjdGVkTGFiZWw6IGxhYmVsXG4gICAgfSlcbiAgfVxuXG4sIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IG51bGxcbiAgICAsIHNlbGVjdGVkTGFiZWw6IG51bGxcbiAgICB9KVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJhZGlvU2VsZWN0IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgQ29udGFjdEZvcm0gPSByZXF1aXJlKCdDb250YWN0Rm9ybScpXG52YXIgR2xvYmFsTW9kYWwgPSByZXF1aXJlKCdHbG9iYWxNb2RhbCcpXG52YXIgU3RlcCA9IHJlcXVpcmUoJ1N0ZXAnKVxuXG52YXIgU2VuZFF1b3RlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU2VuZFF1b3RlJyxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLmZvcm0oIHtjbGFzc05hbWU6XCJmb3JtLWhvcml6b250YWxcIiwgcm9sZTpcImZvcm1cIn0sIFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIn0sIFxuICAgICAgICBSZWFjdC5ET00ucChudWxsLCBcIk9uZSBvZiBvdXIgZXhwZXJpZW5jZWQgYWdlbnRzIHdpbGwgYmUgaGFwcHkgdG8gdGFsayB0byB5b3UgYWJvdXQgeW91ciBsaWZlIGluc3VyYW5jZSBuZWVkcywgYW5kIHdpbGwgYmUgd2l0aCB5b3UgZXZlcnkgc3RlcCBvZiB0aGUgd2F5IHdoZW4geW91IHB1cmNoYXNlIHlvdXIgcG9saWN5LiBTaW1wbHkgdGVsbCB1cyB3aGVuIHlvdeKAmWQgbGlrZSB0byBiZSBjb250YWN0ZWQsIGFuZCB3ZeKAmWxsIGNhbGwgeW91LlwiKSxcbiAgICAgICAgQ29udGFjdEZvcm0oIHtyZWY6XCJjb250YWN0Rm9ybVwiLCBlcnJvckRpc3BsYXk6XCJ0ZXh0XCIsXG4gICAgICAgICAgaW5pdGlhbERhdGE6dGhpcy5wcm9wcy5jb250YWN0SW5mb31cbiAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1mb290ZXJcIn0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY29sLXNtLTEyXCJ9LCBcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tZGVmYXVsdCBwdWxsLWxlZnRcIiwgb25DbGljazp0aGlzLnByb3BzLnNldEFjdGl2ZVN0ZXAuYmluZChudWxsLCBTdGVwLlFVT1RFX0lORk8pLCBkaXNhYmxlZDp0aGlzLnByb3BzLmxvYWRpbmd9LCBcIkJhY2sgdG8gUmVzdWx0c1wiKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImJ0biBidG4tcHJpbWFyeSBwdWxsLXJpZ2h0XCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVTZW5kLCBkaXNhYmxlZDp0aGlzLnByb3BzLmxvYWRpbmd9LCBcIlNlbmRcIilcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH1cblxuLCBoYW5kbGVTZW5kOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGF0YSA9IHRoaXMucmVmcy5jb250YWN0Rm9ybS5nZXRGb3JtRGF0YSgpXG4gICAgaWYgKGRhdGEgIT09IG51bGwpIHtcbiAgICAgIHRoaXMucHJvcHMuaGFuZGxlU2VuZChkYXRhLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiB0aGlzLnByb3BzLmhhbmRsZVNob3dHbG9iYWxNb2RhbChHbG9iYWxNb2RhbC5TRVJWSUNFX1VOQVZBSUxBQkxFKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvcHMuc2V0QWN0aXZlU3RlcChTdGVwLlRURk4pXG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgfVxuICB9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbmRRdW90ZSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIEJvb3RzdHJhcE1vZGFsTWl4aW4gPSByZXF1aXJlKCdCb290c3RyYXBNb2RhbE1peGluJylcbnZhciBJbmNyZW1lbnRpbmdLZXlNaXhpbiA9IHJlcXVpcmUoJ0luY3JlbWVudGluZ0tleU1peGluJylcbnZhciBMaWZlUXVvdGVDb25zdGFudHMgPSByZXF1aXJlKCdMaWZlUXVvdGVDb25zdGFudHMnKVxuXG52YXIgU2VydmljZVVuYXZhaWxhYmxlTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTZXJ2aWNlVW5hdmFpbGFibGVNb2RhbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1vZGFsTWl4aW4sIEluY3JlbWVudGluZ0tleU1peGluXVxuXG4sIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbCBmYWRlXCJ9LCBcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1kaWFsb2dcIn0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtY29udGVudFwifSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWhlYWRlclwifSwgXG5cbiAgICAgICAgICAgIHRoaXMucmVuZGVyQ2xvc2VCdXR0b24oKSxcbiAgICAgICAgICAgIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJTZXJ2aWNlIFVuYXZhaWxhYmxlXCIpXG4gICAgICAgICAgKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtYm9keVwifSwgXG4gICAgICAgICAgICBcIiBUaGFuayB5b3UgZm9yIHlvdXIgaW50ZXJlc3QgaW4gYSBsaWZlIGluc3VyYW5jZSBxdW90ZS4gVW5mb3J0dW5hdGVseSwgb3VyIHNlcnZpY2UgaXMgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUgYXMgd2Ugd29yayB0byBlbmhhbmNlIHlvdXIgZXhwZXJpZW5jZS4gVG8gb2J0YWluIGEgcXVvdGUsIHBsZWFzZSBcIiwgUmVhY3QuRE9NLmEoIHtocmVmOkxpZmVRdW90ZUNvbnN0YW50cy5MT0NBTF9TQUxFU19BR0VOVF9VUkx9LCBcImNvbnRhY3Qgb25lIG9mIG91ciBleHBlcmllbmNlZCByZXByZXNlbnRhdGl2ZXMgXCIsIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZVwifSkpLCBcIiBkaXJlY3RseS4gXCJcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gU2VydmljZVVuYXZhaWxhYmxlTW9kYWwiLCJ2YXIgTGlmZVF1b3RlUmVmRGF0YSA9IHJlcXVpcmUoJ0xpZmVRdW90ZVJlZkRhdGEnKVxuXG52YXIgbWFrZUVudW0gPSByZXF1aXJlKCdtYWtlRW51bScpXG5cbnZhciBTdGF0ZSA9IG1ha2VFbnVtKExpZmVRdW90ZVJlZkRhdGEuU1RBVEVfQ09ERVMsICdhYmJyZXZpYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlIiwidmFyIExpZmVRdW90ZVJlZkRhdGEgPSByZXF1aXJlKCdMaWZlUXVvdGVSZWZEYXRhJylcblxudmFyIG1ha2VMb29rdXAgPSByZXF1aXJlKCdtYWtlTG9va3VwJylcblxudmFyIFN0YXRlcyA9IG1ha2VMb29rdXAoTGlmZVF1b3RlUmVmRGF0YS5TVEFURV9DT0RFUylcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZXMiLCJ2YXIgU3RlcCA9IHtcbiAgR0VORVJBTF9JTkZPOiAxXG4sIFFVT1RFX0lORk86IDJcbiwgU0VORF9RVU9URTogM1xuLCBUVEZOOiA0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RlcCIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIExpZmVRdW90ZUNvbnN0YW50cyA9IHJlcXVpcmUoJ0xpZmVRdW90ZUNvbnN0YW50cycpXG5cbnZhciBUVEZOID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVFRGTicsXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFJlYWN0LkRPTS5zdHJvbmcobnVsbCwgXCJUaGFua3MgZm9yIHNlbmRpbmcgdXMgeW91ciBxdW90ZVwiKSksXG4gICAgICAgIFJlYWN0LkRPTS5wKG51bGwsIFwiT25lIG9mIG91ciBhZ2VudHMgd2lsbCBiZSBpbiB0b3VjaCB3aXRoIHlvdSBzaG9ydGx5IHRvIHRhbGsgYWJvdXQgbmV4dCBzdGVwcy5cIiksXG4gICAgICAgIFJlYWN0LkRPTS5hKCB7aHJlZjpMaWZlUXVvdGVDb25zdGFudHMuTElGRV9JTlNVUkFOQ0VfUFJPRFVDVFNfVVJMLCBjbGFzc05hbWU6XCJidG4gYnRuLWRlZmF1bHRcIn0sIFwiTGVhcm4gTW9yZSBcIiwgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLXNoYXJlXCJ9KSlcbiAgICAgIClcbiAgICApXG4gIH1cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gVFRGTiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIFdURk4gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdXVEZOJyxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUmVhY3QuRE9NLmRpdihudWxsLCBSZWFjdC5ET00uYSgge2hyZWY6XCJodHRwOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0XCIsIHRhcmdldDpcIl9ibGFua1wifSwgXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keSByZWFjdFwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5pbWcoIHtzcmM6XCJpbWcvcmVhY3RfbG9nby5wbmdcIn0pXG4gICAgICApXG4gICAgKSlcbiAgfVxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBXVEZOIiwidmFyIEJvb3RzdHJhcERldmljZSA9IHJlcXVpcmUoJ0Jvb3RzdHJhcERldmljZScpXG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgYWN0aXZlIEJvb3RzdHJhcCAzIGRldmljZSBjbGFzcyBiYXNlZCBvbiBkZXZpY2Ugd2lkdGggb3JcbiAqIGN1cnJlbnQgd2luZG93IHdpZHRoLlxuICogQHJldHVybiB7Qm9vdHN0cmFwRGV2aWNlfVxuICovXG5mdW5jdGlvbiBic0RldmljZSgpIHtcbiAgdmFyIHdpZHRoID0gKHdpbmRvdy5pbm5lcldpZHRoID4gMCA/IHdpbmRvdy5pbm5lcldpZHRoIDogc2NyZWVuLndpZHRoKVxuICBpZiAod2lkdGggPCA3NjgpIHJldHVybiBCb290c3RyYXBEZXZpY2UuWFNcbiAgaWYgKHdpZHRoIDwgOTkyKSByZXR1cm4gQm9vdHN0cmFwRGV2aWNlLlNNXG4gIGlmICh3aWR0aCA8IDEyMDApIHJldHVybiBCb290c3RyYXBEZXZpY2UuTURcbiAgcmV0dXJuIEJvb3RzdHJhcERldmljZS5MR1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJzRGV2aWNlIiwiLyoqXG4gKiBDcmVhdGVzIGEgY2xhc3NOYW1lIHN0cmluZyBpbmNsdWRpbmcgc29tZSBjbGFzcyBuYW1lcyBjb25kaXRpb25hbGx5LlxuICogQHBhcmFtIHtzdHJpbmc9fSBzdGF0aWNDbGFzc05hbWUgY2xhc3MgbmFtZShzKSB3aGljaCBzaG91bGQgYWx3YXlzIGJlXG4gKiAgIGluY2x1ZGVkLlxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj59IGNvbmRpdGlvbmFsQ2xhc3NOYW1lcyBhbiBvYmplY3QgbWFwcGluZyBjbGFzc1xuICogICBuYW1lcyB0byBhIHZhbHVlIHdoaWNoIGluZGljYXRlcyBpZiB0aGUgY2xhc3MgbmFtZSBzaG91bGQgYmUgaW5jbHVkZWQgLVxuICogICBjbGFzcyBuYW1lcyB3aWxsIGJlIGluY2x1ZGVkIGlmIHRoZWlyIGNvcnJlc3BvbmRpbmcgdmFsdWUgaXMgdHJ1dGh5LlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBjbGFzc05hbWVzKHN0YXRpY0NsYXNzTmFtZSwgY29uZGl0aW9uYWxDbGFzc05hbWVzKSB7XG4gIHZhciBuYW1lcyA9IFtdXG4gIGlmICh0eXBlb2YgY29uZGl0aW9uYWxDbGFzc05hbWVzID09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uZGl0aW9uYWxDbGFzc05hbWVzID0gc3RhdGljQ2xhc3NOYW1lXG4gIH1cbiAgZWxzZSB7XG4gICAgbmFtZXMucHVzaChzdGF0aWNDbGFzc05hbWUpXG4gIH1cbiAgZm9yICh2YXIgY2xhc3NOYW1lIGluIGNvbmRpdGlvbmFsQ2xhc3NOYW1lcykge1xuICAgIGlmICghIWNvbmRpdGlvbmFsQ2xhc3NOYW1lc1tjbGFzc05hbWVdKSB7XG4gICAgICBuYW1lcy5wdXNoKGNsYXNzTmFtZSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hbWVzLmpvaW4oJyAnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXMiLCIvKipcbiAqIEZyb20gVW5kZXJzY29yZS5qcyAxLjUuMlxuICogaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbiAqIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAqIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAqIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICogbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdFxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgY29udGV4dCA9IHRoaXNcbiAgICBhcmdzID0gYXJndW1lbnRzXG4gICAgdGltZXN0YW1wID0gbmV3IERhdGUoKVxuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxhc3QgPSAobmV3IERhdGUoKSkgLSB0aW1lc3RhbXBcbiAgICAgIGlmIChsYXN0IDwgd2FpdCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aW1lb3V0ID0gbnVsbFxuICAgICAgICBpZiAoIWltbWVkaWF0ZSkgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXRcbiAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KVxuICAgIH1cbiAgICBpZiAoY2FsbE5vdykgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgZm9ybWF0RG9sbGFycyA9IHJlcXVpcmUoJ2Zvcm1hdERvbGxhcnMnKVxuXG5mdW5jdGlvbiBkb2xsYXJPcHRpb25zKHN0YXJ0LCBlbmRJbmNsdXNpdmUsIHN0ZXApIHtcbiAgdmFyIG9wdGlvbnMgPSBbXVxuICBmb3IgKHZhciBhbW91bnQgPSBzdGFydDsgYW1vdW50IDw9IGVuZEluY2x1c2l2ZTsgYW1vdW50ICs9IHN0ZXApIHtcbiAgICBvcHRpb25zLnB1c2goUmVhY3QuRE9NLm9wdGlvbigge3ZhbHVlOmFtb3VudH0sIGZvcm1hdERvbGxhcnMoYW1vdW50KSkpXG4gIH1cbiAgcmV0dXJuIG9wdGlvbnNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkb2xsYXJPcHRpb25zIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gZXh0ZW5kKGRlc3QpIHtcbiAgZm9yICh2YXIgaSA9IDEsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIHNyYyA9IGFyZ3VtZW50c1tpXVxuICAgIGlmICghc3JjIHx8IHR5cGVvZiBzcmMgIT0gJ29iamVjdCcpIGNvbnRpbnVlXG4gICAgZm9yICh2YXIgcHJvcCBpbiBzcmMpIHtcbiAgICAgIGlmICghaGFzT3duLmNhbGwoc3JjLCBwcm9wKSkgY29udGludWVcbiAgICAgIGRlc3RbcHJvcF0gPSBzcmNbcHJvcF1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlc3Rcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHRlbmQiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBMaWZlUXVvdGUgPSByZXF1aXJlKCdMaWZlUXVvdGUnKVxuXG52YXIgemlwQ29kZU1hdGNoID0gL3ppcENvZGU9KFxcZHs1fSkvLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpXG52YXIgcXVlcnlQYXJhbVppcENvZGUgPSAoemlwQ29kZU1hdGNoICE9IG51bGwgPyB6aXBDb2RlTWF0Y2hbMV0gOiAnJylcblxuUmVhY3QucmVuZGVyQ29tcG9uZW50KExpZmVRdW90ZSgge3F1ZXJ5UGFyYW1aaXBDb2RlOnF1ZXJ5UGFyYW1aaXBDb2RlfSksXG4gICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpZmVxdW90ZScpKVxuIiwiZnVuY3Rpb24gZm9ybWF0RG9sbGFycyhkb2xsYXJzKSB7XG4gIHJldHVybiAnJCcgKyBkb2xsYXJzLnRvTG9jYWxlU3RyaW5nKClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmb3JtYXREb2xsYXJzIiwidmFyIExpZmVRdW90ZVJlZkRhdGEgPSByZXF1aXJlKCdMaWZlUXVvdGVSZWZEYXRhJylcblxudmFyIHJlZkRhdGFPcHRpb25zID0gcmVxdWlyZSgncmVmRGF0YU9wdGlvbnMnKVxuXG52YXIgZ2VuZGVyT3B0aW9ucyA9IHJlZkRhdGFPcHRpb25zLmJpbmQobnVsbCwgTGlmZVF1b3RlUmVmRGF0YS5HRU5ERVJfQ09ERVMsICd0aXRsZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuZGVyT3B0aW9ucyIsInZhciBMaWZlUXVvdGVSZWZEYXRhID0gcmVxdWlyZSgnTGlmZVF1b3RlUmVmRGF0YScpXG5cbnZhciByZWZEYXRhT3B0aW9ucyA9IHJlcXVpcmUoJ3JlZkRhdGFPcHRpb25zJylcblxudmFyIGhlYWx0aE9wdGlvbnMgPSByZWZEYXRhT3B0aW9ucy5iaW5kKG51bGwsIExpZmVRdW90ZVJlZkRhdGEuSEVBTFRIX0NPREVTLCAndGl0bGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhlYWx0aE9wdGlvbnMiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbmZ1bmN0aW9uIGludGVnZXJPcHRpb25zKHN0YXJ0LCBlbmRJbmNsdXNpdmUpIHtcbiAgdmFyIG9wdGlvbnMgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPD0gZW5kSW5jbHVzaXZlOyBpKyspIHtcbiAgICBvcHRpb25zLnB1c2goUmVhY3QuRE9NLm9wdGlvbigge3ZhbHVlOml9LCBpKSlcbiAgfVxuICByZXR1cm4gb3B0aW9uc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGludGVnZXJPcHRpb25zIiwidmFyIGlzWmlwID0gZnVuY3Rpb24oKSB7XG4gIHZhciBaSVBfUkUgPSAvXlxcZHs1fSg/Oi0/XFxkezR9KT8kL1xuICByZXR1cm4gZnVuY3Rpb24gaXNaaXAodmFsdWUpIHtcbiAgICByZXR1cm4gWklQX1JFLnRlc3QodmFsdWUpXG4gIH1cbn0oKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzWmlwIiwiLy8gRW51bXMgZm9yIGRpcmVjdCBhY2Nlc3MgdG8gY29kZXMgYnkgbmFtZSAoaW4gQ09OU1RBTlRfQ0FQU19TVFlMRSlcbmZ1bmN0aW9uIG1ha2VFbnVtKHJlZkRhdGEsIG5hbWVQcm9wKSB7XG4gIHZhciBlbnVtXyA9IHt9XG4gIHJlZkRhdGEuZm9yRWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgZW51bV9bZGF0YVtuYW1lUHJvcF0ucmVwbGFjZSgvXFxzL2csICdfJykudG9VcHBlckNhc2UoKV0gPSBkYXRhLmNvZGVcbiAgfSlcbiAgcmV0dXJuIGVudW1fXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFrZUVudW0iLCIvLyBDb2RlIC0+IFJlZiBEYXRhIExvb2t1cHNcbmZ1bmN0aW9uIG1ha2VMb29rdXAocmVmRGF0YSkge1xuICB2YXIgbG9va3VwID0ge31cbiAgcmVmRGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBsb29rdXBbZGF0YS5jb2RlXSA9IGRhdGFcbiAgfSlcbiAgcmV0dXJuIGxvb2t1cFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1ha2VMb29rdXAiLCJ2YXIgTGlmZVF1b3RlUmVmRGF0YSA9IHJlcXVpcmUoJ0xpZmVRdW90ZVJlZkRhdGEnKVxuXG52YXIgcmVmRGF0YU9wdGlvbnMgPSByZXF1aXJlKCdyZWZEYXRhT3B0aW9ucycpXG5cbnZhciBwcm9kdWN0T3B0aW9ucyA9IHJlZkRhdGFPcHRpb25zLmJpbmQobnVsbCwgTGlmZVF1b3RlUmVmRGF0YS5QUk9EVUNUX0NPREVTLCAnbmFtZScpXG5cbm1vZHVsZS5leHBvcnRzID0gcHJvZHVjdE9wdGlvbnMiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbmZ1bmN0aW9uIHJlZkRhdGFPcHRpb25zKHJlZkRhdGEsIG9wdGlvblByb3ApIHtcbiAgcmV0dXJuIHJlZkRhdGEubWFwKGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgcmV0dXJuIFJlYWN0LkRPTS5vcHRpb24oIHt2YWx1ZTpkYXR1bS5jb2RlfSwgZGF0dW1bb3B0aW9uUHJvcF0pXG4gIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVmRGF0YU9wdGlvbnMiLCJ2YXIgTGlmZVF1b3RlUmVmRGF0YSA9IHJlcXVpcmUoJ0xpZmVRdW90ZVJlZkRhdGEnKVxuXG52YXIgcmVmRGF0YU9wdGlvbnMgPSByZXF1aXJlKCdyZWZEYXRhT3B0aW9ucycpXG5cbnZhciBzdGF0ZU9wdGlvbnMgPSByZWZEYXRhT3B0aW9ucy5iaW5kKG51bGwsIExpZmVRdW90ZVJlZkRhdGEuU1RBVEVfQ09ERVMsICdhYmJyZXZpYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlT3B0aW9ucyIsInZhciBUUklNX1JFID0gL15cXHMrfFxccyskL2dcblxuZnVuY3Rpb24gdHJpbShzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFRSSU1fUkUsICcnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRyaW0iXX0=
