void function() { 'use strict';

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

var hasOwn = Object.prototype.hasOwnProperty

var SETTINGS_KEY = 'jdj:settings'

var _div = document.createElement('div')

function last(items) {
  return items[items.length - 1]
}

function fullname(joke) {
  return `t3_${joke.id}`
}

function el(tagName, attrs, ...children) {
  var element = document.createElement(tagName)
  if (attrs) {
    for (var attr in attrs) {
      if (hasOwn.call(attrs, attr)) {
        element[attr] = attrs[attr]
      }
    }
  }
  for (var i = 0, l = children.length; i < l ; i++) {
    var child = children[i]
    if (typeof child == 'string') {
      child = document.createTextNode(child)
    }
    if (child != null && child !== false) {
      element.appendChild(child)
    }
  }
  return element
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function loadSettings() {
  var json = localStorage.getItem(SETTINGS_KEY)
  var settings = json ? JSON.parse(json) : {minScore: 0, inlineMedia: true}
  // Patch defaults for new settings
  if (typeof settings.inlineMedia == 'undefined') {
    settings.inlineMedia = true
  }
  return settings
}

var DadJokes = React.createClass({
  getDefaultProps() {
    return {
      limit: 25
    , page: ''
    }
  },

  getInitialState() {
    return {
      after: null
    , before: null
    , count: 0
    , jokes: []
    , settings: loadSettings()
    , loading: false
    , page: this.props.page || ''
    , showSettings: false
    }
  },

  componentDidMount() {
    this.getJokes()
    window.onhashchange = this.onHashChange
  },

  getJokes() {
    this.setState({loading: true})
    window.scrollTo(0, 0)
    jsonp(`http://www.reddit.com/r/dadjokes/hot.json?${this.state.page}`, (err, listing) => {
      if (err) {
        this.setState({loading: false})
        throw err
      }
      var {children, after, before} = listing.data
      var jokes = []
      children.forEach(item => {
        var {id, score, selftext_html, title, url} = item.data
        var html = ''
        if (selftext_html) {
          _div.innerHTML = selftext_html
          html = _div.childNodes[0].nodeValue
        }
        jokes.push({id, html, score, title, url})
      })
      this.setState({after, before, jokes, loading: false})
    })
  },

  onHashChange(e) {
    var match = /^#?((after|before)=t3_[0-9a-z]{6}&count=(\d+))?$/.exec(window.location.hash)
    if (!match) { return }
    var page = ''
    var count = 0
    if (match[1]) {
      page = match[1]
      count = Number(match[3])
      if (match[2] == 'before') {
        count = Math.max(0, count - this.props.limit - 1)
      }
    }
    this.setState({count, page, jokes: []}, this.getJokes)
  },

  home(e) {
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return
    }
    e.preventDefault()
    window.location.hash = ''
  },

  toggleSettings(e) {
    var showSettings = !this.state.showSettings
    this.setState({showSettings})
  },

  settingChanged(e) {
    var value
    switch(e.target.type) {
      case 'number':
        value = Number(e.target.value)
        if (isNaN(value)) { return }
        break
      case 'checkbox':
        value = e.target.checked
        break
      default:
        value = e.target.value
    }

    var settings = this.state.settings
    settings[e.target.id] = value
    saveSettings(settings)
    this.setState({settings})
  },

  render() {
    var {settings} = this.state
    return <div className="DadJokes">
      <header>
        <h1>
          <a href="https://www.reddit.com/r/dadjokes/" onClick={this.home}>Just /r/dadjokes</a>{' '}
          <img src="cog.png" tabIndex="0" alt="Settings" className="control" onClick={this.toggleSettings}/>
        </h1>
        <ReactCSSTransitionGroup transitionName="settings" component="div" className="settings-wrap">
          {this.state.showSettings && <div className="DadJokes__settings" key="settings" onChange={this.settingChanged}>
            <div className="Setting">
              <label htmlFor="minScore">Minimum score:</label>{' '}
              <input type="number" value={settings.minScore} id="minScore" min="0"/>
            </div>
            <div className="Setting">
              <label><input type="checkbox" checked={settings.inlineMedia} id="inlineMedia"/> Display media inline</label>
            </div>
          </div>}
        </ReactCSSTransitionGroup>
      </header>
      {this.state.loading && <p>Gathering puns&hellip;</p>}
      {this.state.jokes.filter(joke => joke.score >= settings.minScore)
                       .map(joke => <Joke key={`${joke.id}-${settings.inlineMedia}`} inlineMedia={settings.inlineMedia} {...joke}/>)}
      {!this.state.loading && <h1>
        {this.state.before && <a href={`#before=${this.state.before}&count=${this.state.count + 1}`}>
          &lt; Prev
        </a>}
        {this.state.before && this.state.after && ' · '}
        {this.state.after && <a href={`#after=${this.state.after}&count=${this.state.count + this.props.limit}`}>
          Next &gt;
        </a>}
      </h1>}
      <footer>
        <a href="https://github.com/insin/just-dadjokes">
          Source on GitHub
        </a>
      </footer>
    </div>
  }
})

var Joke = React.createClass({
  componentDidMount() {
    var links = document.querySelectorAll(`#joke-${this.props.id} a`)

    for (var i = 0, l = links.length; i < l ; i++) {
      var link = links[i]
      var href = link.href.replace(/^file:\/\//, '')

      // Convert spoiler links to display spoilers inline on hover/focus
      if (href == '/s') {
        link.parentNode.replaceChild(el('div', {className: 'Spoiler', tabIndex: 0},
          el('span', {className: 'Spoiler__hint'}, link.textContent), ' ',
          el('span', {className: 'Spoiler__spoiler'}, link.title)
        ), link)
        continue
      }
      // Convert root relative links to absolute links to Reddit
      else if (href.charAt(0) == '/') {
        link.href = href = `https://www.reddit.com${href}`
      }

      if (!this.props.inlineMedia) { return }

      // Get the image href from imgur links
      if (/imgur.com/.test(href)) {
        var imgMatch = /imgur\.com\/(?:gallery\/)?([^\/]+)/.exec(href)
        // No match, or it was a gallery URL
        if (imgMatch == null || imgMatch[1] == 'a') { continue }
        href = `http://i.imgur.com/${imgMatch[1]}`
        if (!/\.[a-z]{3,4}$/i.test(href)) {
          href += '.png'
        }
      }

      if (/youtube.com|youtu.be/.test(href)) {
        var ytMatch = /https?:\/\/(?:www\.)youtu(?:be\.com|\.be)\/(?:watch\?v=)(.+)/.exec(href)
        if (ytMatch == null) { continue }
        link.parentNode.replaceChild(el('div', {className: 'Video'},
          el('iframe', {
            width: 480
          , height: 360
          , src: `https://www.youtube.com/embed/${ytMatch[1]}`
          , frameBorder: 0
          , allowfullscreen: true
          })
        ), link)
        continue
      }

      if (/\.(?:png|gif|jpe?g)$/i.test(href)) {
        var {textContent} = link
        var img = el('img', {src: href})
        while (link.firstChild) {
          link.removeChild(link.firstChild)
        }
        link.appendChild(img)
        // If the link text wasn't a repeat of the href, display it after the
        // inlined image.
        if (textContent != link.href) {
          link.parentNode.insertBefore(document.createTextNode(`(${textContent})`), link.nextSibling)
        }
      }
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return false
  },

  titlePadding() {
    var score = this.props.score
    if (score < 10) { return 3 }
    if (score < 100) { return 4 }
    if (score < 1000) { return 5 }
    if (score < 10000) { return 6 }
    return 7
  },

  render() {
    if (!this.props.html) { return null } // No punchliney? No showy!
    return <div className="Joke">
      <div className="Joke__link" style={{paddingRight: `${this.titlePadding()}em`}}>
        <a href={this.props.url}>{this.props.title}</a>{' '}
        <small className="Joke__score">{this.props.score}</small>
      </div>
      <p className="Joke__waitforit">&hellip;</p>
      <div id={`joke-${this.props.id}`} ref="html" dangerouslySetInnerHTML={{__html: this.props.html}}/>
    </div>
  }
})

var pageMatch = /^#((?:after|before)=t3_[0-9a-z]{6}&count=\d+)$/.exec(window.location.hash)
var page = (pageMatch != null ? pageMatch[1] : '')
React.render(<DadJokes page={page}/>, document.getElementById('app'))

}()