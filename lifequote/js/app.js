/** @jsx React.DOM */

// Constants -------------------------------------------------------------------

var STATES = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI',
  'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
  'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

var ZIP_RE = /^\d{5}(?:-?\d{4})?$/

var DEFAULT_GENERAL_INFO = {
  gender: 'Male'
, age: 35
, state: 'AL'
, zipCode: '12345'
, tobaccoUse: false
, coverageAmount: 250000
, coverageType: 'Term'
, healthCategory: 'Excellent'
, privacyPolicy: false
}

var COMPANY = 'Springfield Power'

// Utils -----------------------------------------------------------------------

function extend(dest) {
  for (var i = 1, l = arguments.length; i < l; i++) {
    var src = arguments[i]
    for (var prop in src) {
      dest[prop] = src[prop]
    }
  }
  return dest
}

function lookup(array) {
  var lookup = {}
  for (var i = 0, l = array.length; i < l; i++) {
    lookup[a[i]] = true
  }
  return lookup
}

var trim = function() {
  var TRIM_RE = /^\s+|\s+$/g
  return function trim(string) {
    return string.replace(TRIM_RE, '')
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

// Templating Utils ------------------------------------------------------------

function integerOptions(start, end) {
  var options = []
  for (var i = start; i <= end; i++) {
    options.push(<option value={i}>{i}</option>)
  }
  return options
}

function stateOptions() {
  return STATES.map(function(state) {
    return <option value={state}>{state}</option>
  })
}

function dollarOptions(start, end, step) {
  var options = []
  for (var amount = start; amount <= end; amount += step) {
    options.push(<option value={amount}>{formatDollars(amount)}</option>)
  }
  return options
}

function formatDollars(dollars) {
  return '$' + dollars.toLocaleString()
}

/**
 * Creates a className string including some class names conditionally.
 * @param {string=} staticClassName class name(s) which should always be
 *   included.
 * @param {Object.<string, *>} conditionalClassNames an object mapping class
 *   names to a value which indicates if the class name should be included -
 *   class names will be included if their corresponding value is truthy.
 * @return {string}
 */
function $c(staticClassName, conditionalClassNames) {
  var classNames = []
  if (typeof conditionalClassNames == 'undefined') {
    conditionalClassNames = staticClassName
  }
  else {
    classNames.push(staticClassName)
  }
  for (var className in conditionalClassNames) {
    if (!!conditionalClassNames[className]) {
      classNames.push(className)
    }
  }
  return classNames.join(' ')
}

// Mixins ----------------------------------------------------------------------

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

var BootstrapModalMixin = function() {
  var handlerProps =
    ['handleShow', 'handleShown', 'handleHide', 'handleHidden']

  var bsModalEvents = {
    handleShow: 'show.bs.modal'
  , handleShown: 'shown.bs.modal'
  , handleHide: 'hide.bs.modal'
  , handleHidden: 'hidden.bs.modal'
  }

  return {
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
        if (this.props[prop]) {
          $modal.on(bsModalEvents[prop], this.props[prop])
        }
      }.bind(this))
    }

  , componentWillUnmount: function() {
      var $modal = $(this.getDOMNode())
      handlerProps.forEach(function(prop) {
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
      $(this.getDOMNode()).modal('show')
    }

  , renderCloseButton: function() {
      return <button
        type="button"
        className="close"
        onClick={this.hide}
        dangerouslySetInnerHTML={{__html: '&times'}}
      />
    }
  }
}()

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

// Reusable components ---------------------------------------------------------

/**
 * Displays a help icon which displays help as a popover on hover. This
 * component should only have text as its child content.
 */
var HelpIcon = React.createClass({
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
    return <span style={{cursor: 'help'}} className={'glyphicon glyphicon-' + this.props.glyphicon}></span>
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

/**
 * Displays a list of radio buttons with the given labels and manages tracking
 * of the selected index and label.
 */
var RadioSelect = React.createClass({
  getInitialState: function() {
    var hasSelectedIndex = (typeof this.props.selectedIndex != 'undefined')
    return {
      selectedIndex: (hasSelectedIndex ? this.props.selectedIndex: null)
    , selectedLabel: (hasSelectedIndex ? this.props.labels[this.props.selectedIndex] : null)
    }
  }

, render: function() {
    var radios = this.props.labels.map(function(label, i) {
      return <div className="radio">
        <label>
          <input type="radio"
            ref={this.props.ref + '_' + i}
            name={this.props.ref}
            value={i}
            checked={this.state.selectedIndex === i}
            onChange={this.handleChange.bind(this, i, label)}/>
          {label}
        </label>
      </div>
    }.bind(this))
    return <div>{radios}</div>
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

var ContactForm = React.createClass({
  mixins: [FormMixin]

, propTypes: {
    email: React.PropTypes.bool
  , question: React.PropTypes.bool
  , errorDisplay: React.PropTypes.oneOf(['text', 'tooltip']).required
  }

, getDefaultProps: function() {
    return {
      email: true
    , question: false
    }
  }

, getInitialState: function() {
    return {errors: {}}
  }

, componentDidUpdate: function(prevProps, prevState) {
    if (this.props.errorDisplay == 'tooltip') {
      this.updateErrorTooltips(prevState.errors, this.state.errors, {
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
    var fieldRefs = ['firstName', 'lastName', 'phoneNumber', 'address', 'city', 'state', 'zipCode']
    if (this.props.email) fieldRefs.push('email')
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
    if (!('zipCode' in errors) && !ZIP_RE.test(data.zipCode)) {
      errors.zipCode = 'Must be 5 digts or 5+4 digits'
    }
    if (this.props.email && !('email' in errors)  && !validator.isEmail(data.email)) {
      errors.email = 'Must be a valid email address'
    }
    this.setState({errors: errors})

    for (var error in errors) {
      return null
    }
    data.currentCustomer = this.refs.currentCustomerYes.getDOMNode().checked
    return data
  }

, render: function() {
    return <div className="form-horizontal">
      {this.renderTextInput('firstName', 'First Name')}
      {this.renderTextInput('lastName', 'Last Name')}
      {this.renderTextInput('phoneNumber', 'Phone number')}
      {this.props.email && this.renderTextInput('email', 'Email')}
      {this.props.question && this.renderTextarea('question', 'Question')}
      {this.renderTextInput('address', 'Address')}
      {this.renderTextInput('city', 'City')}
      {this.renderSelect('state', 'State', STATES)}
      {this.renderTextInput('zipCode', 'Zip Code')}
      {this.renderRadioInlines('currentCustomer', 'Are you currently a ' + COMPANY + ' Customer?', {
        values: ['Yes', 'No']
      , defaultCheckedValue: 'No'
      })}
    </div>
  }

, renderTextInput: function(id, label) {
    return this.renderField(id, label,
      <input type="text" className="form-control" id={id}  ref={id}/>
    )
  }

, renderTextarea: function(id, label) {
    return this.renderField(id, label,
      <textarea className="form-control" id={id} ref={id}/>
    )
  }

, renderSelect: function(id, label, values) {
    var options = values.map(function(value) {
      return <option value={value}>{value}</option>
    })
    return this.renderField(id, label,
      <select className="form-control" id={id} ref={id}>
        {options}
      </select>
    )
  }

, renderRadioInlines: function(id, label, kwargs) {
    var radios = kwargs.values.map(function(value) {
      var defaultChecked = (value == kwargs.defaultCheckedValue)
      return <label className="radio-inline">
        <input type="radio" ref={id + value} name={id} value={value} defaultChecked={defaultChecked}/>
        {value}
      </label>
    })
    return this.renderField(id, label, radios)
  }

, renderField: function(id, label, field) {
    var fieldColClass = 'col-sm-6'
      , hasError = (id in this.state.errors)
      , errorDisplay
    if (this.props.errorDisplay == 'text') {
      fieldColClass = 'col-sm-4'
      errorDisplay = <div className="col-sm-4 help-text">
        <p className="form-control-static">
          {hasError && this.state.errors[id]}
        </p>
      </div>
    }
    return <div className={$c('form-group', {'has-error': hasError})}>
      <label htmlFor={id} className="col-sm-4 control-label">{label}</label>
      <div className={fieldColClass}>
        {field}
      </div>
      {errorDisplay}
    </div>
  }
})

// Main ------------------------------------------------------------------------

var LifeQuote = React.createClass({
  getInitialState: function() {
    return {
      stepNum: 1
    , loading: false
    , modal: null
    , generalInfo: {}
    , quoteInfo: {}
    , contactInfo: {}
    }
  }

, render: function() {
    var content
    if (this.state.stepNum == 1)
      content = <GeneralInfo
                  submittedZipCode={this.props.submittedZipCode}
                  handleReset={this.handleReset}
                  handleGetQuote={this.handleGetQuote}
                  loading={this.state.loading}
                />
    else if (this.state.stepNum == 2)
      content = <QuoteInfo
                  generalInfo={this.state.generalInfo}
                  quoteInfo={this.state.quoteInfo}
                  setActiveStep={this.setActiveStep}
                />
    else if (this.state.stepNum == 3)
      content = <SendQuote
                  setActiveStep={this.setActiveStep}
                  handleSend={this.handleSend}
                  loading={this.state.loading}
                />
    else if (this.state.stepNum == 4)
      content = <TTFN/>

    return <div className={this.state.loading ? 'loading' : ''}>
      <div className="row">
        <div className="col-sm-9">
          <div className="quote-progress clearfix">
            <div className={$c('col-sm-4', {active: this.state.stepNum == 1})}>
              <span className="step-number">1</span>{' '}
              <span className="step-name">General Information</span>
            </div>
            <div className={$c('col-sm-4', {active: this.state.stepNum == 2})}>
              <span className="step-number">2</span>{' '}
              <span className="step-name">Get your quote</span>
            </div>
            <div className={$c('col-sm-4', {active: this.state.stepNum == 3})}>
              <span className="step-number">3</span>{' '}
              <span className="step-name">Send your quote to an agent</span>
            </div>
          </div>
          <div className="panel panel-default">
            {content}
          </div>
        </div>
        <div className="col-sm-3">
          <h3 className="text-center">Need Assistance?</h3>
          <div className="list-group">
            <a className="list-group-item" href="#callcontact" onClick={this.handleShowCallModal}>
              <h4 className="list-group-item-heading"><span className="glyphicon glyphicon-phone-alt"></span> We’ll call you</h4>
              <p className="list-group-item-text">Need assistance? A licensed representative will contact you.</p>
            </a>
            <a className="list-group-item" href="#questioncontact" onClick={this.handleShowEmailModal}>
              <h4 className="list-group-item-heading"><span className="glyphicon glyphicon-envelope"></span> Email us</h4>
              <p className="list-group-item-text">Have a specific question? We will get right back to you via email.</p>
            </a>
            <a className="list-group-item" href="#qanda" onClick={this.handleShowQAndAModal}>
              <h4 className="list-group-item-heading"><span className="glyphicon glyphicon-info-sign"></span> Questions {'&'} Answers</h4>
              <p className="list-group-item-text">Look here for answers to commonly-asked questions.</p>
            </a>
          </div>
        </div>
      </div>
      {this.state.modal}
    </div>
  }

, handleShowCallModal: function(e) {
    e.preventDefault()
    this.setState({modal: <CallYouModal handleHidden={this.handleModalHidden}/>})
  }

, handleShowEmailModal: function(e) {
    e.preventDefault()
    this.setState({modal: <EmailUsModal handleHidden={this.handleModalHidden}/>})
  }

, handleShowQAndAModal: function(e) {
    e.preventDefault()
    this.setState({modal: <QAndAModal handleHidden={this.handleModalHidden}/>})
  }

, handleModalHidden: function() {
    this.setState({modal: null})
  }

, setActiveStep: function(stepNum) {
    this.setState({stepNum: stepNum})
  }

, handleGetQuote: function(generalInfo) {
    this.setState({
      generalInfo: generalInfo
    , loading: true
    })

    // TODO Call quoting service
    console.info(generalInfo)

    setTimeout(function() {
      this.setState({
        loading: false
      , quoteInfo: {
          annual20: 252.50
        , annual30: 377.50
        , monthly20: 22.73
        , monthly30: 32.98
        }
      , stepNum: 2
      })
    }.bind(this), 1000)
  }

, handleSend: function(contactInfo) {
    this.setState({
      contactInfo: contactInfo
    , loading: true
    })

    // TODO Call lead submission service
    console.info(contactInfo)

    setTimeout(function() {
      this.setState({
        loading: false
      , stepNum: 4
      })
    }.bind(this), 1000)
  }
})

// Quote Sections --------------------------------------------------------------

var GeneralInfo = React.createClass({
  getInitialState: function() {
    return {
      errors: {}
    , modal: null
    }
  }

, render: function() {
    return <div><form className="form-horizontal" role="form">
      <div className="panel-body">
        <p><strong>Simply enter your information for a no-obligation quote.</strong></p>
        <div className="form-group">
          <label htmlFor="gender" className="col-sm-4 control-label">Gender</label>
          <div className="col-sm-4">
            <select className="form-control" ref="gender" id="gender" defaultValue="Male">
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="age" className="col-sm-4 control-label">Age</label>
          <div className="col-sm-4">
            <select className="form-control" ref="age" id="age" defaultValue={35}>
              {integerOptions(25, 70)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="state" className="col-sm-4 control-label">State</label>
          <div className="col-sm-4">
            <select className="form-control" ref="state" id="state">
              {stateOptions()}
            </select>
          </div>
        </div>
        <div className={$c('form-group', {'has-error': 'zipCode' in this.state.errors})}>
          <label htmlFor="zipCode" className="col-sm-4 control-label">Zip Code</label>
          <div className="col-sm-4">
            <input className="form-control" ref="zipCode" type="text" id="zipCode"
              defaultValue={this.props.submittedZipCode}
              onChange={this.handleZipChange}
            />
          </div>
          <div className="col-sm-4 help-text">
            <p className="form-control-static">
              {'zipCode' in this.state.errors && this.state.errors.zipCode}
            </p>
          </div>
        </div>
        <div className="form-group">
          <label className="col-sm-4 control-label">Do you use tobacco products?</label>
          <div className="col-sm-4">
            <label className="radio-inline"><input ref="tobaccoUseYes" type="radio" name="tobaccoUse" value="yes"/> Yes</label>
            <label className="radio-inline"><input ref="tobaccoUseNo" type="radio" name="tobaccoUse" value="no" defaultChecked={true}/> No</label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="coverageAmount" className="col-sm-4 control-label">Amount of coverage</label>
          <div className="col-sm-4">
            <select className="form-control" ref="coverageAmount" id="coverageAmount" defaultValue={250000}>
              {dollarOptions(100000, 950000, 50000).concat(dollarOptions(1000000, 3000000, 500000))}
            </select>
          </div>
          <div className="col-sm-4">
            <p className="form-control-static">
              <a href="#needscalculator" onClick={this.handleShowNeedsCalculatorModal}>How much do you need?</a>
            </p>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="coverageType" className="col-sm-4 control-label">Type of coverage</label>
          <div className="col-sm-4">
            <select className="form-control" ref="coverageType" id="coverageType">
              <option value="Term">Term</option>
              <option value="Permanent">Permanent</option>
            </select>
          </div>
          <div className="col-sm-4">
            <p className="form-control-static">
              <a href="#policyadvisor" onClick={this.handleShowPolicyAdvisorModal}>What kind should you buy?</a>
            </p>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="healthCategory" className="col-sm-4 control-label">Health category</label>
          <div className="col-sm-4">
            <select className="form-control" ref="healthCategory" id="healthCategory" defaultValue="Excellent">
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Very Good">Very Good</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>
          <div className="col-sm-4">
            <p className="form-control-static">
              <a href="#healthCategory" onClick={this.handleShowHealthCategoryModal}>What’s your category?</a>
            </p>
          </div>
        </div>
        <p><strong>Privacy Policy</strong></p>
        <p>Please read our <a href="">privacy policy</a> which explains how we use and protect your personal information.</p>
        <div className="form-group">
          <div className="col-sm-8 col-sm-offset-4">
            <div className="checkbox">
              <label><input ref="privacyPolicy" type="checkbox" name="privacyPolicy"/> I have reviewed the privacy policy and want to continue</label>
            </div>
          </div>
        </div>
        <p><strong>Thanks for helping us provide you with a more accurate quote.</strong></p>
      </div>
      <div className="panel-footer">
        <div className="row">
          <div className="col-sm-12">
            <button type="button" className="btn btn-default pull-left" disabled={this.props.loading} onClick={this.handleReset}>Reset</button>
            <button type="button" className="btn btn-primary pull-right" disabled={this.props.loading} onClick={this.handleGetQuote}>Get Quote</button>
          </div>
        </div>
      </div>
    </form>
    {this.state.modal}
    </div>
  }

, handleZipChange: debounce(function(e) {
    var zipCode = this.refs.zipCode.getDOMNode().value
    if (zipCode.length == 0) {
      this.setState({errors: {zipCode: 'A Zip code is required'}})
    }
    else if (!ZIP_RE.test(zipCode)) {
      this.setState({errors: {zipCode: 'Zip code must be 5 digts or 5+4 digits'}})
    }
    else {
      this.setState({errors: {}})
    }
  }, 250)

, handleShowNeedsCalculatorModal: function(e) {
    e.preventDefault()
    this.setState({modal:
      <NeedsCalculatorModal
        handleAccept={this.handleAcceptCoverageAmount}
        handleHidden={this.handleModalHidden}
      />
    })
  }

, handleAcceptCoverageAmount: function(coverageAmount) {
    this.refs.coverageAmount.getDOMNode().value =
        Math.min(Math.max(coverageAmount, 100000), 3000000)
  }

, handleShowPolicyAdvisorModal: function(e) {
    e.preventDefault()
    this.setState({modal:
      <PolicyAdvisorModal
        handleSelectPolicyType={this.handleSelectPolicyType}
        handleHidden={this.handleModalHidden}
      />
    })
  }

, handleSelectPolicyType: function(policyType) {
    if (policyType) {
      this.refs.coverageType.getDOMNode().value = policyType
    }
  }

, handleShowHealthCategoryModal: function(e) {
    e.preventDefault()
    this.setState({modal:
      <HealthCategoryModal
        handleAccept={this.handleAcceptHealthCategory}
        handleHidden={this.handleModalHidden}
      />
    })
  }

, handleAcceptHealthCategory: function(category) {
    this.refs.healthCategory.getDOMNode().value = category
  }

, handleModalHidden: function() {
    this.setState({modal: null})
  }

, handleReset: function() {
    this.refs.gender.getDOMNode().value = DEFAULT_GENERAL_INFO.gender
    this.refs.age.getDOMNode().value = DEFAULT_GENERAL_INFO.age
    this.refs.state.getDOMNode().value = DEFAULT_GENERAL_INFO.state
    this.refs.zipCode.getDOMNode().value = DEFAULT_GENERAL_INFO.zipCode
    this.refs.tobaccoUseNo.getDOMNode().checked = true
    this.refs.coverageAmount.getDOMNode().value = DEFAULT_GENERAL_INFO.coverageAmount
    this.refs.coverageType.getDOMNode().value = DEFAULT_GENERAL_INFO.coverageType
    this.refs.healthCategory.getDOMNode().value = DEFAULT_GENERAL_INFO.healthCategory
    this.refs.privacyPolicy.getDOMNode().checked = false
    this.setState({errors: {}})
  }

, handleGetQuote: function() {
    for (var prop in this.state.errors) {
      return
    }
    if (!this.refs.privacyPolicy.getDOMNode().checked) {
      return alert('You must indicate that you have read our privacy policy before proceeding.')
    }
    this.props.handleGetQuote({
      gender: this.refs.gender.getDOMNode().value
    , age: this.refs.age.getDOMNode().value
    , state: this.refs.state.getDOMNode().value
    , zipCode: this.refs.zipCode.getDOMNode().value
    , tobaccoUse: this.refs.tobaccoUseYes.getDOMNode().checked
    , coverageAmount: Number(this.refs.coverageAmount.getDOMNode().value)
    , coverageType: this.refs.coverageType.getDOMNode().value
    , healthCategory: this.refs.healthCategory.getDOMNode().value
    , privacyPolicy: true
    })
  }
})

var QuoteInfo = React.createClass({
  render: function() {
    return <div>
      <div className="panel-body">
        <p>Congratulations! You’ve just taken the first step toward securing your loved ones’ financial future. Your life insurance quote is below. What’s next? Forward your quote to one of our experienced agents who will walk you through the application process.</p>
        <div className="row">
          <div className="col-sm-6">
            <h3>Your Information</h3>
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th>Gender</th>
                  <td>{this.props.generalInfo.gender}</td>
                </tr>
                <tr>
                  <th>Age</th>
                  <td>{this.props.generalInfo.age}</td>
                </tr>
                <tr>
                  <th>State</th>
                  <td>{this.props.generalInfo.state}</td>
                </tr>
                <tr>
                  <th>Tobacco Use</th>
                  <td>{this.props.generalInfo.tobaccoUse ? 'Smoker' : 'Non Smoker'}</td>
                </tr>
                <tr>
                  <th>Amount of coverage</th>
                  <td>{formatDollars(this.props.generalInfo.coverageAmount)}</td>
                </tr>
                <tr>
                  <th>Type of coverage</th>
                  <td>{this.props.generalInfo.coverageType}</td>
                </tr>
                <tr>
                  <th>Underwriting class</th>
                  <td>{this.props.generalInfo.healthCategory}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-sm-6">
            <h3>Term</h3>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th></th>
                  <th>20 year</th>
                  <th>30 year</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Annual</th>
                  <td>{this.props.quoteInfo.annual20.toFixed(2)}</td>
                  <td>{this.props.quoteInfo.annual30.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Monthly</th>
                  <td>{this.props.quoteInfo.monthly20.toFixed(2)}</td>
                  <td>{this.props.quoteInfo.monthly30.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <div className="row">
          <div className="col-sm-12">
            <button type="button" className="btn btn-default pull-left" onClick={this.props.setActiveStep.bind(null, 1)}>Edit</button>
            <button type="button" className="btn btn-primary pull-right" onClick={this.props.setActiveStep.bind(null, 3)}>Forward to Agent</button>
          </div>
        </div>
      </div>
    </div>
  }
})

var SendQuote = React.createClass({
  render: function() {
    return <form className="form-horizontal" role="form">
      <div className="panel-body">
        <p>One of our experienced agents will be happy to talk to you about your life insurance needs, and will be with you every step of the way when you purchase your policy. Simply tell us when you’d like to be contacted, and we’ll call you.</p>
        <ContactForm ref="contactForm" errorDisplay="text"/>
      </div>
      <div className="panel-footer">
        <div className="row">
          <div className="col-sm-12">
            <button type="button" className="btn btn-default pull-left" onClick={this.props.setActiveStep.bind(this.props, 2)} disabled={this.props.loading}>Back to Results</button>
            <button type="button" className="btn btn-primary pull-right" onClick={this.handleSend} disabled={this.props.loading}>Send</button>
          </div>
        </div>
      </div>
    </form>
  }

, handleSend: function() {
    var data = this.refs.contactForm.getFormData()
    if (data !== null) {
      this.props.handleSend(data)
    }
  }
})

var TTFN = React.createClass({
  render: function() {
    return <div><a href="http://facebook.github.io/react" target="_blank">
      <div className="panel-body react">
        <img src="img/react_logo.png"/>
      </div>
    </a></div>
  }
})

// Ganeral Information Modals ---------------------------------------------------

var NeedsCalculatorModal = React.createClass({
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
      suggestedAmount: null
    , data: {}
    , errors: {}
    }
  }

, componentDidUpdate: function(prevProps, prevState) {
    this.updateErrorTooltips(prevState.errors, this.state.errors, {
      placement: bsDevice() >= BootstrapDevice.MD ? 'auto right' : 'bottom'
    , trigger: 'hover click'
    , animation: false
    , container: 'body'
    })
  }

, handleReset: function() {
    for (var field in this.fields) {
      this.refs[field].getDOMNode().value = ''
    }
    this.setState({
      data: {}
    , errors: {}
    })
  }

, handleCalculate: function() {
    var data = {}
      , errors = {}
    for (var field in this.fields) {
      data[field] = trim(this.refs[field].getDOMNode().value)
      if (!data[field]) {
        errors[field] = 'This field is required'
        continue
      }
      var validation = this.fields[field]
      if (!validator[validation](data[field])) {
        errors[field] = this.errorMessages[validation]
      }
    }
    this.setState({errors: errors})

    var isValid = true
    for (var field in errors) {
      isValid = false
      break
    }

    if (isValid) {
      // TODO Calculate suggested amount
      console.info(data)

      this.setState({
        data: data
      , suggestedAmount: 100000
      })
    }
  }

, handleBack: function() {
    this.setState({suggestedAmount: null})
  }

, handleAccept: function() {
    this.props.handleAccept(this.state.suggestedAmount)
    this.hide()
  }

, render: function() {
    var body, footer
    if (this.state.suggestedAmount === null) {
      body = <div>
        <p>Our needs calculator lets you estimate how much life insurance you may need in addition to the amount you may already own.</p>
        <form ref="form" className="form-horizontal" role="form">
          {this.renderDollarField('monthlyNetIncome', 'Monthly net income',
            <HelpIcon>
              After-tax earnings per month
            </HelpIcon>
          )}
          {this.renderIntegerField('yearsIncomeProvided', 'Number of years you wish to provide income',
            <HelpIcon>
              This number is how many years you would like to generate income for your family members or beneficiaries in order to cover expenses identified.
              Most experts recommend a minimum of 3-5 years.
            </HelpIcon>
          )}
          {this.renderDollarField('outstandingMortgageOrRent', 'Outstanding mortgage or rent payments',
            <HelpIcon>
              Include mortgage balance and home equity loan balances.
              Or, determine the sufficient amount for 10 years, or 120 months, of rent.
            </HelpIcon>
          )}
          {this.renderDollarField('currentOutstandingDebts', 'Current outstanding debts',
            <HelpIcon>
              Include credit cards, installment credit or other loan debts, such as school and auto.
            </HelpIcon>
          )}
          {this.renderIntegerField('numCollegeChildren', 'Number of children to attend college',
            <HelpIcon>
              Number of children who have yet to enter college. This would not include children who have completed college.
              Children who do not require college funding do not need to be included here.
            </HelpIcon>
          )}
          {this.renderDollarField('estCollegeExpensePerChild', 'Estimated college expenses per child',
            <HelpIcon>
              Four years at a private institution averages $129,228.
              Four years at a public institution averages $54,356.
              Costs include tuition fees, room and board as reported by the College Board, New York 2007.
            </HelpIcon>
          )}
          {this.renderDollarField('estFinalExpenses', 'Estimated final expenses',
            <HelpIcon>
              Final expense costs are the costs associated with a funeral or final estate settlement costs.
              A typical burial costs between $8,000 and $12,000.
            </HelpIcon>,
            {placeholder: '10,000'}
          )}
          {this.renderDollarField('currentLiquidAssets', 'Current liquid assets',
            <HelpIcon>
              Liquid assets would include savings and investments, but would not include a 401K or real estate such as a house.
            </HelpIcon>
          )}
          {this.renderDollarField('personallyOwnedInsurance', 'Personally owned life insurance',
            <HelpIcon>
              This number should equal the total amount of coverage on your life, including coverage from any individual policies.
            </HelpIcon>
          )}
        </form>
      </div>
      footer = <div>
        <button type="button" className="btn btn-default" onClick={this.handleReset}>Reset</button>
        <button type="button" className="btn btn-primary" onClick={this.handleCalculate}>Calculate</button>
      </div>
    }
    else {
      body = <div>
        <p>Based on the information entered, you need a total of <strong>{formatDollars(this.state.suggestedAmount)}</strong> in order to cover your life insurance needs.</p>
        <p><strong>Note:</strong> This calculation does not incorporate any assumptions about investment results, estate taxes or inflation.</p>
      </div>
      footer = <div>
        <button type="button" className="btn btn-default" onClick={this.handleBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={this.handleAccept}>Accept</button>
      </div>
    }

    return <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {this.renderCloseButton()}
            <strong>Needs Calculator</strong>
          </div>
          <div className="modal-body">
            {body}
          </div>
          <div className="modal-footer" style={{marginTop: 0}}>
            {footer}
          </div>
        </div>
      </div>
    </div>
  }

, renderDollarField: function(id, label, help, kwargs) {
    return this.renderField(id, label, help,
      <div className="input-group">
        <span className="input-group-addon">$</span>
        <input type="text" className="form-control" ref={id} id={id}
          defaultValue={this.state.data[id] || ''}
          placeholder={kwargs && kwargs.placeholder || ''}
        />
      </div>
    )
  }

, renderIntegerField: function(id, label, help) {
    return this.renderField(id, label, help,
      <input type="text" className="form-control" ref={id} id={id}
        defaultValue={this.state.data[id] || ''}
      />
    )
  }

, renderField: function(id, label, help, field) {
    return <div className={$c('form-group', {'has-error': id in this.state.errors})}>
      <label htmlFor={id} className="col-sm-8 control-label">{label}</label>
      <div className="col-sm-3">
        {field}
      </div>
      <div className="col-sm-1">
        <p className="form-control-static">
          {help}
        </p>
      </div>
    </div>
  }
})

var HealthCategoryModal = React.createClass({
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      suggestedCategory: null
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
    var questionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    for (var i = 0, l = questionNumbers.length; i < l; i++) {
      var num = questionNumbers[i]
        , radios = this.refs['question' + num]
      if (radios.state.selectedIndex === null) {
        radios.getDOMNode().parentNode.scrollIntoView()
        return alert('Please answer Question #' + num)
      }
      data['question' + num] = radios.state.selectedIndex
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
    , suggestedCategory: 'Good'
    })
  }

, handleBack: function() {
    this.setState({suggestedCategory: null})
  }

, handleAccept: function() {
    this.props.handleAccept(this.state.suggestedCategory)
    this.hide()
  }

, render: function() {
    var body, footer
    if (this.state.suggestedCategory === null) {
      body = <div>
        <p>Pricing for life insurance is based on an overall picture of your health, among other factors. By answering the brief medical questions to help estimate your health category, we can provide you with a more accurate quote. </p>
        <p>Your information will not be recorded or saved in any way. All questions are required.</p>
        <form ref="form" role="form">
        <div className="modal-form-group">
          <label>1. When was the last time you used tobacco?</label>
          <RadioSelect ref="question1" selectedIndex={this.state.data.question1}
            labels={['Never' , 'None in the last 36 months', 'None in the last 12 months', 'Within the last 12 months']}
          />
        </div>
        <div className="modal-form-group">
          <label>2. When was the last time you were treated for alcohol or drug abuse?</label>
          <RadioSelect ref="question2" selectedIndex={this.state.data.question2}
            labels={['Never', 'Within the last 10 years', '10 or more years ago']}
          />
        </div>
        <div className="modal-form-group">
          <label>3. Do you have any DUI convictions?</label>
          <RadioSelect ref="question3" selectedIndex={this.state.data.question3}
            labels={['No', 'Yes, less than 5 years ago', 'Yes, more than 5 years ago']}
          />
        </div>
        <div className="modal-form-group">
          <label>4. How many moving violations have you been convicted of in the last 3 years?</label>
          <RadioSelect ref="question4" selectedIndex={this.state.data.question4}
            labels={['None or 1', '2', '3 or more', '6 or more']}
          />
        </div>
        <div className="modal-form-group">
          <label>5. Do you have parents or siblings that died from cancer, cardiac disease or diabetes?</label>
          <RadioSelect ref="question5" selectedIndex={this.state.data.question5}
            labels={['None', 'Yes, only 1 parent or sibling prior to age 60', 'Yes, only 1 parent or sibling between ages 61-65', 'More than 1 parent or sibling']}
          />
        </div>
        <div className="modal-form-group">
          <label>6. Do you have a history of diabetes, cardiac disease, cancer or stroke?</label>
          <RadioSelect ref="question6" selectedIndex={this.state.data.question6} labels={['No', 'Yes']}/>
        </div>
        <div className="modal-form-group">
          <label>7. Are you taking any medication for high blood pressure?</label>
          <RadioSelect ref="question7" selectedIndex={this.state.data.question7}
            labels={['No', 'Yes and I am under the age of 50', 'Yes and I am age 50 or over']}
          />
        </div>
        <div className="modal-form-group">
          <label>8. What was your last blood pressure reading?</label>
          <RadioSelect ref="question8" selectedIndex={this.state.data.question8}
            labels={["I don’t know", 'Less than or equal to 140/78', 'Between 140/78 and 140/90 and I am less than age 50', 'Between 140/78 and 150/92 and I am older than 50', '151/93 and higher']}
          />
        </div>
        <div className="modal-form-group">
          <label>9. What was your last cholesterol reading?</label>
          <RadioSelect ref="question9" selectedIndex={this.state.data.question9}
            labels={['I don’t know', 'Less than 210', 'Between 211 and 250', '251-400', '401 or higher']}
          />
        </div>
        <div className="modal-form-group">
          <label>10. What is your current height and weight?</label>
          <div className="form-horizontal">
            <div className="form-group">
              <label className="col-sm-2 control-label" htmlFor="heightFeet">Feet</label>
              <div className="col-sm-3">
                <select id="heightFeet" ref="heightFeet" className="form-control" defaultValue={this.state.data.heightFeet}>{integerOptions(4, 6)}</select>
              </div>
              <label className="col-sm-2 control-label" htmlFor="heightInches">Inches</label>
              <div className="col-sm-3">
                <select id="heightInches" ref="heightInches" className="form-control" defaultValue={this.state.data.heightInches}>{integerOptions(0, 11)}</select>
              </div>
            </div>
            <div className="form-group">
              <label className="col-sm-2 control-label" htmlFor="weight">Weight</label>
              <div className="col-sm-3">
                <div className="input-group">
                  <input type="text" id="weight" ref="weight" className="form-control" defaultValue={this.state.data.weight}/>
                  <span className="input-group-addon">lbs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-form-group">
          <label>11. Do you pilot an airplane or helicpoter?</label>
          <RadioSelect ref="question11" selectedIndex={this.state.data.question11} labels={['No', 'Yes']}/>
        </div>
        </form>
        <div className="footnotes">
          <p>It’s important to know this tool is a guide to the most common underwriting questions, and does not represent every scenario. When you apply for coverage, you will be asked to fill out a full application.</p>
          <p>This estimated health category is not guaranteed.  Your final underwriting class will be determined by the results of any examinations, laboratory results, medical history, and non-medical information developed during the underwriting process. </p>
        </div>
      </div>
      footer = <div>
        <button type="button" className="btn btn-default" onClick={this.handleReset}>Reset</button>
        <button type="button" className="btn btn-primary" onClick={this.handleGetCategory}>Get your category</button>
      </div>
    }
    else {
      body = <p>
        Based on the information provided, your estimated health category is: <strong>{this.state.suggestedCategory}</strong>
      </p>
      footer = <div>
        <button type="button" className="btn btn-default" onClick={this.handleBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={this.handleAccept}>Accept</button>
      </div>
    }

    return <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {this.renderCloseButton()}
            <strong>Determine your health category</strong>
          </div>
          <div className="modal-body" style={{height: 400, overflowY: 'scroll'}}>
            {body}
          </div>
          <div className="modal-footer" style={{marginTop: 0}}>
            {footer}
          </div>
        </div>
      </div>
    </div>
  }
})

var PolicyAdvisorModal = React.createClass({
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, getInitialState: function() {
    return {
      policyType: null
    }
  }

, handleChange: function(e) {
    this.setState({policyType: e.target.value})
  }

, handleReturnToQuote: function() {
    this.props.handleSelectPolicyType(this.state.policyType)
    this.hide()
  }

, render: function() {
    return <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {this.renderCloseButton()}
            <strong>Policy Advisor</strong>
          </div>
          <div className="modal-body" style={{height: 400, overflowY: 'scroll'}}>
            <p><strong>What kind of life insurance policy should you buy?</strong></p>
            <p>That depends on your needs and budget. A good first step is to determine if your needs are temporary or permanent. For example, a mortgage is a temporary need, because your mortgage will eventually be paid off. Funds for final expenses are permanent, because the need will never go away.</p>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Temporary Needs</th>
                  <th>Permanent Needs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mortgage</td>
                  <td>Income replacement</td>
                </tr>
                <tr>
                  <td>College education</td>
                  <td>Final expenses</td>
                </tr>
                <tr>
                  <td>Child care</td>
                  <td>Emergency fund</td>
                </tr>
              </tbody>
            </table>
            <p>Generally speaking, term life insurance is a good fit for people with temporary needs, such as protecting a mortgage or covering costs associated with raising children, such as daily child care. Initially, it’s usually the least expensive coverage you can buy.</p>
            <p>Many people have permanent needs, such as paying for final expenses and replacing income should a breadwinner die prematurely. Permanent insurance lasts for the lifetime of the insured.</p>

            <p><strong>What’s the difference between term and permanent life insurance?</strong></p>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Permanent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lowest initial cost</td>
                  <td>Fixed premiums</td>
                </tr>
                <tr>
                  <td>More coverage per dollar</td>
                  <td>Cash value accumulation</td>
                </tr>
                <tr>
                  <td>Premiums will increase after initial term period</td>
                  <td>Guaranteed cash value</td>
                </tr>
                <tr>
                  <td>Coverage is not permanent(2)</td>
                  <td>Coverage for life(1), as long as premiums are paid</td>
                </tr>
              </tbody>
            </table>

            <p><strong>Term life insurance</strong></p>
            <p>Term insurance provides coverage for a specific period of time, such as 10, 20 or 30 years. If you die during that period, the beneficiary you name on your policy receives the death benefit amount. When the term ends, so does your protection, unless you select a term policy that gives you the option of renewing your coverage.</p>
            <p>Term policies don’t build cash value as most permanent life insurance products do. Because of this fact, when you buy a term policy you’re paying for pure protection. So most of the time, term insurance is the least expensive kind of coverage you can buy.</p>

            <p><strong>Permanent life insurance</strong></p>
            <p>Permanent policies provide protection for your entire life by paying a sum to your beneficiary upon your death(1). Most permanent policies build cash value over time, and you can access this cash value for emergencies, opportunities or planned life events such as a college education or retirement.</p>
            <p>There are different types of permanent policies. Whole life policies usually offer level premiums and strong, traditional guarantees, such as a schedule of guaranteed values. Universal life policies normally offer flexible features, such as the ability to change your coverage amount or your payment schedule after you purchase the policy. A variation on universal life, variable universal life allows you to invest your policy’s cash values in fixed accounts and sub-accounts that have the potential to earn market returns. </p>
            <p>Finally, single payment whole life is a type of life insurance you buy with one payment. Because the death benefit is higher than the single payment, this kind of life insurance is often a good fit for people looking to transfer wealth.</p>

            <div className="footnotes">
              <p>(1) Many permanent policies endow at age 121.</p>
              <p>(2) Some term policies offer the option to continue coverage at the end of the level term period. In most cases, premiums will increase annually as you age.</p>
            </div>
          </div>
          <div className="modal-footer" style={{marginTop: 0}}>
            <label className="radio-inline"><input type="radio" name="policyType" value="Term" onChange={this.handleChange}/> Term</label>
            <label className="radio-inline"><input type="radio" name="policyType" value="Permanent" onChange={this.handleChange}/> Permanent</label>
            <button type="button" className="btn btn-primary" onClick={this.handleReturnToQuote}>Return to quote</button>
          </div>
        </div>
      </div>
    </div>
  }
})

// Contact Modals --------------------------------------------------------------

var CallYouModal = React.createClass({
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, handleSubmit: function() {
    var data = this.refs.contactForm.getFormData()
    if (data !== null) {
      // TODO Call lead submission service
      console.info(data)
    }
  }

, render: function() {
    return <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {this.renderCloseButton()}
            <strong>We’ll call you</strong>
          </div>
          <div className="modal-body">
            <p><strong>Thank you for your interest in life insurance.</strong></p>
            <p>One of our experienced agents will be happy to talk to you about your life insurance needs. Simply tell us when you'd like to be contacted, and we'll call you.</p>
            <p><strong>Please fill out the following fields</strong></p>
            <ContactForm ref="contactForm" email={false} errorDisplay="tooltip"/>
         </div>
          <div className="modal-footer" style={{marginTop: 0}}>
            <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>Submit</button>
          </div>
        </div>
      </div>
    </div>
  }
})

var EmailUsModal = React.createClass({
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, handleSubmit: function() {
    var data = this.refs.contactForm.getFormData()
    if (data !== null) {
      // TODO Call lead submission service
      console.info(data)
    }
  }

, render: function() {
    return <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {this.renderCloseButton()}
            <strong>Email us</strong>
          </div>
          <div className="modal-body">
            <p><strong>Thank you for your interest in life insurance.</strong></p>
            <p>One of our experienced agents will be happy to answer all your questions. Enter your name, email, and the question you’d like to ask, and an agent will respond within 24 hours.</p>
            <p><strong>Please fill out the following fields</strong></p>
            <ContactForm ref="contactForm" question={true} errorDisplay="tooltip"/>
         </div>
          <div className="modal-footer" style={{marginTop: 0}}>
            <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>Submit</button>
          </div>
        </div>
      </div>
    </div>
  }
})

var QAndAModal = React.createClass({
  mixins: [BootstrapModalMixin, IncrementingKeyMixin]

, render: function() {
    return <div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {this.renderCloseButton()}
            <strong>Questions {'&'} Answers</strong>
          </div>
          <div className="modal-body">
            <p className="question">Why do you ask for my gender and age?</p>
            <p>Pricing for life insurance is based on mortality, or in other words, the prediction of how long you will live. That prediction is based on many factors, including your age and gender. Obviously, if you are older, you will likely pass away before someone who is substantially younger. And gender plays a role because statistically speaking, women are likely to live longer than men.</p>
            <p className="question">Why do you ask if I use tobacco products?</p>
            <p>Pricing for life insurance is based on a prediction of how long you will live. Statistics show people who use tobacco products have a higher mortality rate – or a higher likelihood of passing away sooner – than non-smokers.</p>
            <p className="question">What’s an underwriting class?</p>
            <p>An underwriting class is a general classification that describes your overall health. These classifications have names like ‘Elite Preferred’ for the healthiest individuals and ‘Standard’ for individuals with generally good health. Your underwriting class directly impacts the price you will pay for coverage, because healthy people tend to live longer.</p>
            <p>The medical questions we ask here help you arrive at an estimated underwriting class, which is then used to calculate your quote. Your answers to the medical questions are not saved in any way.</p>
          </div>
          <div className="modal-footer" style={{marginTop: 0}}>
            <button type="button" className="btn btn-primary" onClick={this.close}>Return to quote</button>
          </div>
        </div>
      </div>
    </div>
  }
})

React.renderComponent(<LifeQuote submittedZipCode="12345"/>, document.getElementById('lifequote'))
