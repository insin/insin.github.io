/** @jsx React.DOM */

'use strict';

var Route = ReactRouter.Route
var DefaultRoute = ReactRouter.DefaultRoute
var Routes = ReactRouter.Routes
var Link = ReactRouter.Link
var NotFoundRoute = ReactRouter.NotFoundRoute

var cx = React.addons.classSet

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri (str) {
  var o   = parseUri.options,
    m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};

parseUri.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

var SITE_TITLE = 'React Hacker News'
var ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item/'
var STORIES_PER_PAGE = 30

function pluralise(n) {
  return (n == 1 ? '' : 's')
}

function parseHost(url) {
  var parts = parseUri(url).host.split('.').slice(-3)
  if (parts[0] === 'www') {
    parts.shift()
  }
  return parts.join('.')
}

function setTitle(title) {
  if (title) {
    document.title = title + ' | ' + SITE_TITLE
  }
  else {
    document.title = SITE_TITLE
  }
}

var NotFound = React.createClass({
  render: function() {
    return <h2>Not found</h2>
  }
})

var User = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      user: {}
    }
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase('https://hacker-news.firebaseio.com/v0/user/' + (this.props.id || this.props.params.id)), 'user')
  },
  componentWillUnmount: function() {
    try {
      this.unbind('user')
    }
    catch (e) {
      console.error('Error unbinding', e.message)
    }
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (!this.state.user.id && nextState.user.id) {
      setTitle('Profile: ' + nextState.user.id)
    }
  },
  render: function() {
    var user = this.state.user
    if (!user.id) { return <div className="User User--loading">Loading...</div> }
    return <div className="User">
      <h4>{user.id}</h4>
      <dl>
        <dt>Karma</dt>
        <dd>{user.karma}</dd>
        {user.about && <dt>About</dt>}
        {user.about && <dd><div className="User__about" dangerouslySetInnerHTML={{__html: user.about}}/></dd>}
      </dl>
    </div>
  }
})

var Comment = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      comment: null
    , collapsed: false
    }
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + (this.props.id || this.props.params.id)), 'comment')
  },
  componentWillUnmount: function() {
    try {
      this.unbind('comment')
    }
    catch (e) {
      console.error('Error unbinding', e.message)
    }
  },
  toggleCollapsed: function() {
    this.setState({collapsed: !this.state.collapsed})
  },
  render: function() {
    var comment = this.state.comment || {}
    if (!comment.id) { return <div className="Comment Comment--loading">Loading...</div> }
    if (comment.deleted && !comment.kids) { return }
    var className = cx({
      'Comment': true
    , 'Comment--deleted': comment.deleted
    , 'Comment--dead': comment.dead
    , 'Comment--collapsed': this.state.collapsed
    })
    var timeMoment = moment(comment.time * 1000)
    return <div className={className}>
      {comment.deleted && <div className="Comment__meta">
        {this.renderCollapseControl()}{' '}
        [deleted]
      </div>}
      {!comment.deleted && <div className="Comment__meta">
        {this.renderCollapseControl()}{' '}
        <Link to="user" params={{id: comment.by}} className="Comment__meta__user">{comment.by}</Link>{' '}
        {timeMoment.fromNow()}{' '}
        | <Link to="comment" params={{id: comment.id}}>link</Link>
        {comment.dead && <span> | [dead]</span>}
      </div>}
      {!comment.deleted && <div className="Comment__text">
        <div dangerouslySetInnerHTML={{__html: comment.text}}/>
      </div>}
      {comment.kids && <div className="Comment__kids">
        {comment.kids && comment.kids.map(function(id) {
          return <Comment key={id} id={id}/>
        })}
      </div>}
    </div>
  },
  renderCollapseControl: function() {
    return <span className="Comment__collapse" onClick={this.toggleCollapsed} onKeyPress={this.toggleCollapsed} tabIndex="0">
      [{this.state.collapsed ? '+' : '–'}]
    </span>
  }
})

var Story = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      story: {kids: []}
    }
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + (this.props.id || this.props.params.id)), 'story')
  },
  componentWillUnmount: function() {
    try {
      this.unbind('story')
    }
    catch (e) {
      console.error('Error unbinding', e.message)
    }
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (!this.state.story.id && nextState.story.id) {
      setTitle(nextState.story.title)
    }
  },
  render: function() {
    var story = this.state.story
    if (!story.id) { return <div className="Story Story--loading">Loading...</div> }
    var timeMoment = moment(story.time * 1000)
    return <div className="Story">
      <div className="Story__url">
        <a href={story.url}>{story.title}</a>{' '}
        <span className="Story__host">({parseHost(story.url)})</span>
      </div>
      <div className="Story__meta">
        <span className="Story__score">
          {story.score} point{pluralise(story.score)}
        </span>{' '}
        <span className="Story__by">
          by <Link to="user" params={{id: story.by}}>{story.by}</Link>
        </span>{' '}
        <span className="Story__time">{timeMoment.fromNow()}</span>
      </div>
      <div className="Story__kids">
        {story.kids && story.kids.map(function(id) {
          return <Comment key={id} id={id}/>
        })}
      </div>
    </div>
  }
})

var ListStory = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      story: {}
    }
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + this.props.id || this.props.params.id), 'story')
  },
  componentWillUnmount: function() {
    try {
      this.unbind('story')
    }
    catch (e) {
      console.error('Error unbinding', e.message)
    }
  },
  render: function() {
    var story = this.state.story
    if (!story.id) { return <li className="ListStory ListStory--loading">Loading...</li> }
    var timeMoment = moment(story.time * 1000)
    return <li className="ListStory">
      <div className="Story__url">
        <a href={story.url}>{story.title}</a>{' '}
        <span className="Story__host">({parseHost(story.url)})</span>
      </div>
      <div className="Story__meta">
        <span className="Story__score">
          {story.score} point{pluralise(story.score)}
        </span>{' '}
        <span className="Story__by">
          by <Link to="user" params={{id: story.by}}>{story.by}</Link>
        </span>{' '}
        <span className="Story__time">{timeMoment.fromNow()}</span>{' '}
        | <Link to="story" params={{id: story.id}}>comments</Link>
      </div>
    </li>
  }
})

var Stories = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      stories: []
    }
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase('https://hacker-news.firebaseio.com/v0/topstories'), 'stories')
    setTitle()
  },
  componentWillUnmount: function() {
    try {
      this.unbind('stories')
    }
    catch (e) {
      console.error('Error unbinding', e.message)
    }
  },
  getPage: function() {
    return (this.props.query.page && /^\d+$/.test(this.props.query.page)
            ? Math.max(1, Number(this.props.query.page))
            : 1)
  },
  render: function() {
    if (this.state.stories.length == 0) {
      return <div className="Stories Stories--loading">Loading...</div>
    }
    var page = this.getPage()
    var startIndex = (page - 1) * STORIES_PER_PAGE
    var endIndex = startIndex + STORIES_PER_PAGE
    var stories = this.state.stories.slice(startIndex, endIndex)
    return <div className="Stories">
      {page > 1 && <Paginator route="news" page={page}/>}
      <ol className="Stories__list" start={startIndex + 1}>
        {this.state.stories.slice(startIndex, endIndex).map(function(id, index) {
          return <ListStory key={id} id={id}/>
        })}
      </ol>
      <Paginator route="news" page={page}/>
    </div>
  }
})

var Paginator = React.createClass({
  render: function() {
    return <div className="Paginator">
      {this.props.page > 1 && <span className="Paginator__prev">
        <Link to={this.props.route} query={{page: this.props.page - 1}}>Prev</Link> |
      </span>}{' '}
      {/** Always show next for now */}
      <span className="Paginator__next">
        <Link to={this.props.route} query={{page: this.props.page + 1}}>More</Link>
      </span>
    </div>
  }
})

var App = React.createClass({
  render: function() {
    return <div className="App">
      <div className="App__header">
        <a href="http://facebook.github.io/react/"><img src="logo.png" width="16" height="16" alt="React" title="React website"/></a>{' '}
        <Link to="news" className="App__header__homelink">React Hacker News</Link>
      </div>
      <div className="App__content">
        <this.props.activeRouteHandler/>
      </div>
    </div>
  }
})

var routes = <Routes location="hash">
  <Route name="app" path="/" handler={App}>
    <DefaultRoute handler={Stories}/>
    <Route name="news" path="news" handler={Stories}/>
    <Route name="story" path="story/:id" handler={Story}/>
    <Route name="comment" path="comment/:id" handler={Comment}/>
    <Route name="user" path="user/:id" handler={User}/>
    <NotFoundRoute handler={NotFound}/>
  </Route>
</Routes>

React.renderComponent(routes, document.getElementById('app'))
