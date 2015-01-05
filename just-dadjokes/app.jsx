void function() { 'use strict';

var _div = document.createElement('div')

function last(items) {
  return items[items.length - 1]
}

function fullname(joke) {
  return `t3_${joke.id}`
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
    , loading: false
    , page: this.props.page || ''
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

  render() {
    return <div className="DadJokes">
      <h1><a href="https://www.reddit.com/r/dadjokes/" onClick={this.home}>Just /r/dadjokes</a></h1>
      {this.state.loading && <p>Gathering puns&hellip;</p>}
      {this.state.jokes.map(joke => <Joke key={joke.id} {...joke}/>)}
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
    var imgurLinks = document.querySelectorAll(`#joke-${this.props.id} a[href*="//i.imgur.com"]`)
    if (imgurLinks.length > 0) {
      for (var i = 0, l = imgurLinks.length; i < l ; i++) {
        var a =imgurLinks[i]
        var img = document.createElement('img')
        img.src = a.href
        a.parentNode.replaceChild(img, a)
      }
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return false
  },

  render() {
    if (!this.props.html) { return null } // No punchliney? No showy!
    return <div className="Joke">
      <div className="Joke__link">
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