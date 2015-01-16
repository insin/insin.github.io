void function() { 'use strict';

// From Underscore.js 1.7.0
// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
function throttle(func, wait, options) {
  var context, args, result
  var timeout = null
  var previous = 0
  if (!options) options = {}
  var later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) { context = args = null }
  }
  return function() {
    var now = Date.now()
    if (!previous && options.leading === false) { previous = now }
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      clearTimeout(timeout)
      timeout = null
      previous = now
      result = func.apply(context, args)
      if (!timeout) { context = args = null }
    }
    else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

var MarkerStore = {
  _markers: {},

  updateMarker(id, marker) {
    this._markers[id] = marker
    this._onChange()
  },

  deleteMarker(id) {
    delete this._markers[id]
    this._onChange()
  },

  get() {
    return this._markers
  },

  _onChange() {}
}

// Stuff which will inevitably need cross-browser hacks

function getDocumentHeight() {
  return document.documentElement.offsetHeight
}

function getWindowHeight() {
  return document.documentElement.clientHeight
}

function getElementHeight(el) {
  return el.offsetHeight
}

function getElementScrollOffset(el) {
  return el.offsetTop
}

function getScrollOffsetY() {
  if (window.pageYOffset != null) {
    return window.pageYOffset
  }
  return (document.documentElement || document.body.parentNode || document.body).scrollTop
}

/**
 * Mouse position relative to the viewport.
 */
function getMouseY(e) {
  return e.clientY
}

var ScrollThing = React.createClass({
  getInitialState() {
    return {
      documentHeight: getDocumentHeight()
    , mouseDown: false
    , scrollOffsetY: getScrollOffsetY()
    , markers: MarkerStore.get()
    , windowHeight: getWindowHeight()
    }
  },

  componentDidMount() {
    MarkerStore._onChange = () => this.setState({markers: MarkerStore.get()})
    window.addEventListener('scroll', this._onChange)
    addResizeListener(document.body, this._onChange)
  },

  componentWillUnmount() {
    window.removeEventListener('scroll', this._onChange)
    removeResizeListener(document.body, this._onChange)
  },

  _onChange: throttle(function(e) {
    console.log('on change', e.type)
    this.setState({
      documentHeight: getDocumentHeight()
    , scrollOffsetY: getScrollOffsetY()
    , windowHeight: getWindowHeight()
    })
  }, 33),

  _onMouseDown(e) {
    console.log('mouse down')
    document.addEventListener('mouseup', this._onMouseUp)
    document.addEventListener('mousemove', this._onMouseMove)
    this._scrollToMousePosition(e)
    this.setState({mouseDown: true})
  },

  _scrollToMousePosition(e) {
    var mouseY = getMouseY(e)
    if (mouseY) {
      var {documentHeight, windowHeight} = this.state
      window.scrollTo(0, Math.max(0, (mouseY / windowHeight * documentHeight) - windowHeight / 2))
    }
  },

  _onMouseMove: throttle(function(e) {
    console.log('mouse move', getMouseY(e))
    if (this.state.mouseDown) {
      this._scrollToMousePosition(e)
    }
  }, 33),

  _onMouseUp() {
    console.log('mouse up')
    document.removeEventListener('mouseup', this._onMouseUp)
    document.removeEventListener('mousemove', this._onMouseMove)
    this.setState({mouseDown: false})
  },

  render() {
    console.log(this.state.scrollOffsetY)
    var {documentHeight, markers, windowHeight} = this.state
    return <div className="ScrollThing" onMouseDown={this._onMouseDown}>
      <ViewPort {...this.state}/>
      {Object.keys(markers).map(id => <Marker
         documentHeight={documentHeight}
         windowHeight={windowHeight}
         {...markers[id]}
       />)}
    </div>
  }
})

var ViewPort = React.createClass({
  render() {
    var {documentHeight, scrollOffsetY, windowHeight} = this.props
    var height = windowHeight / documentHeight * windowHeight
    var top = scrollOffsetY / documentHeight * windowHeight
    return <div
      className="ViewPort"
      style={{height, top}}
    />
  }
})

var Marker = React.createClass({
  _onClick(e) {
    e.stopPropagation()
  },

  _onMouseDown(e) {
    e.stopPropagation()
    window.scrollTo(0 ,this.props.scrollOffset)
  },

  render() {
    var {documentHeight, elementHeight, scrollOffset, windowHeight} = this.props
    var height = elementHeight / documentHeight * windowHeight
    var top = scrollOffset / documentHeight * windowHeight
    return <div
      className="Marker"
      style={{height, top}}
      onClick={this._onClick}
      onMouseDown={this._onMouseDown}
    />
  }
})

var MarkerMixin = {
  componentDidMount() {
    this._onResize()
    addResizeListener(this.getDOMNode(), this._onResize)
  },

  componentWillUnmount() {
    removeResizeListener(this.getDOMNode(), this._onResize)
    MarkerStore.deleteMarker(this.getDOMNode().getAttribute('data-reactid'))
  },

  _onResize: throttle(function() {
    var el = this.getDOMNode()
    MarkerStore.updateMarker(el.getAttribute('data-reactid'), {
      elementHeight: getElementHeight(el)
    , scrollOffset: getElementScrollOffset(el)
    })
  }, 33)
}

var Content = React.createClass({
  render() {
    return <div style={{
      backgroundColor: '#'+(Math.random() * 0xFFFFFF << 0).toString(16)
    , height: 100 + (Math.random() * 400)
    }}/>
  }
})

var MarkerContent = React.createClass({
  mixins: [MarkerMixin],

  getInitialState() {
    return {
      backgroundColor: '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
    , doubleHeight: false
    , height: 100 + (Math.random() * 400)
    }
  },

  _onClick() {
    this.setState({doubleHeight: !this.state.doubleHeight})
  },

  render() {
    return <div onClick={this._onClick} style={{
      backgroundColor: this.state.backgroundColor
    , height: this.state.height * (this.state.doubleHeight ? 2 : 1)
    , fontSize: 64
    }}>
      Click to toggle double height.
    </div>
  }
})

var App = React.createClass({
  render() {
    return <div className="App">
      <ScrollThing/>
      <Content/>
      <Content/>
      <MarkerContent/>
      <Content/>
      <Content/>
      <Content/>
      <Content/>
      <MarkerContent/>
      <Content/>
      <Content/>
    </div>
  }
})

React.render(<App/>, document.getElementById('app'))

}()