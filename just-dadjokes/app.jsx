void function() { 'use strict';

var SETTINGS_KEY = 'jdj:settings'

var _div = document.createElement('div')

function last(items) {
  return items[items.length - 1]
}

function fullname(joke) {
  return `t3_${joke.id}`
}

function saveSettings(state) {
  var {minScore} = state
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({minScore}))
}

function loadSettings() {
  var json = localStorage.getItem(SETTINGS_KEY)
  return json ? JSON.parse(json) : {}
}

var DadJokes = React.createClass({
  getDefaultProps() {
    return {
      limit: 25
    , page: ''
    }
  },

  getInitialState() {
    var settings = loadSettings()
    return {
      after: null
    , before: null
    , count: 0
    , jokes: []
    , minScore: settings.minScore || 0
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

  minScoreChanged(e) {
    var minScore = Number(e.target.value)
    if (isNaN(minScore)) { return }
    this.setState({minScore}, () => saveSettings(this.state))
  },

  render() {
    return <div className="DadJokes">
      <header>
        <h1>
          <a href="https://www.reddit.com/r/dadjokes/" onClick={this.home}>Just /r/dadjokes</a>{' '}
          <img src="cog.png" tabIndex="0" alt="Settings" className="control" onClick={this.toggleSettings}/>
        </h1>
        {this.state.showSettings && <div className="DadJokes__settings">
          <label htmlFor="minScore">Minimum score:</label>{' '}
          <input type="number" value={this.state.minScore} id="minScore" min="0" onChange={this.minScoreChanged}/>
        </div>}
      </header>
      {this.state.loading && <p>Gathering puns&hellip;</p>}
      {this.state.jokes.filter(joke => joke.score >= this.state.minScore)
                       .map(joke => <Joke key={joke.id} {...joke}/>)}
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
          <img
            style={{position: 'absolute', top: 0, right: 0, border: 0}}
            src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub"
          />
        </a>
      </footer>
    </div>
  }
})

var Joke = React.createClass({
  /**
   * Find links to imgur and inline them as images.
   */
  componentDidMount() {
    var imgurLinks = document.querySelectorAll(`#joke-${this.props.id} a[href*="imgur.com"]`)
    if (imgurLinks.length === 0) { return }
    for (var i = 0, l = imgurLinks.length; i < l ; i++) {
      var a = imgurLinks[i]
      var {href, textContent} = a

      var imgMatch = /imgur\.com\/(?:gallery\/)?([^\/]+)/.exec(href)
      if (imgMatch == null) {
        console.log(`Unable to process imgur link: ${href}`)
        continue
      }
      if (imgMatch[1] == 'a') {
        console.log(`Ignoring imgur album link: ${href}`)
        continue
      }
      var src = `http://i.imgur.com/${imgMatch[1]}`
      if (!/\.[a-z]{3,4}$/i.test(src)) {
        src += '.png'
      }
      var img = document.createElement('img')
      img.src = src
      while (a.firstChild) {
        a.removeChild(a.firstChild)
      }
      a.appendChild(img)

      if (textContent != href) {
        a.parentNode.insertBefore(document.createTextNode(`(${textContent})`), a.nextSibling)
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