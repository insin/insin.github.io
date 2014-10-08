/** @jsx React.DOM */

void function() {

'use strict';

var Route = ReactRouter.Route
var DefaultRoute = ReactRouter.DefaultRoute
var Routes = ReactRouter.Routes
var Link = ReactRouter.Link
var NotFoundRoute = ReactRouter.NotFoundRoute

var cx = React.addons.classSet

var SITE_TITLE = 'React Hacker News'
var ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item/'
var USER_URL = 'https://hacker-news.firebaseio.com/v0/user/'
var TOP_STORIES_URL = 'https://hacker-news.firebaseio.com/v0/topstories'
var STORIES_PER_PAGE = 30

function pluralise(n) {
  return (n == 1 ? '' : 's')
}

var parseHost = (function() {
  var a = document.createElement('a')
  return function(url) {
    a.href = url
    var parts = a.hostname.split('.').slice(-3)
    if (parts[0] === 'www') {
      parts.shift()
    }
    return parts.join('.')
  }
})()

function setTitle(title) {
  document.title = (title ? title + ' | ' + SITE_TITLE : SITE_TITLE)
}

var NotFound = React.createClass({displayName: 'NotFound',
  render: function() {
    return React.DOM.h2(null, "Not found")
  }
})

var User = React.createClass({displayName: 'User',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {user: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(USER_URL + (this.props.id || this.props.params.id)), 'user')
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (!this.state.user.id && nextState.user.id) {
      setTitle('Profile: ' + nextState.user.id)
    }
  },
  render: function() {
    var user = this.state.user
    if (!user.id) { return React.DOM.div({className: "User User--loading"}, "Loading...") }
    return React.DOM.div({className: "User"},
      React.DOM.h4(null, user.id),
      React.DOM.dl(null,
        React.DOM.dt(null, "Karma"),
        React.DOM.dd(null, user.karma),
        user.about && React.DOM.dt(null, "About"),
        user.about && React.DOM.dd(null, React.DOM.div({className: "User__about", dangerouslySetInnerHTML: {__html: user.about}}))
      )
    )
  }
})

var Comment = React.createClass({displayName: 'Comment',
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
  toggleCollapsed: function() {
    this.setState({collapsed: !this.state.collapsed})
  },
  render: function() {
    var comment = this.state.comment || {}
    if (!comment.id) { return React.DOM.div({className: "Comment Comment--loading"}, "Loading...") }
    if (comment.deleted && !comment.kids) { return }
    var className = cx({
      'Comment': true
    , 'Comment--deleted': comment.deleted
    , 'Comment--dead': comment.dead
    , 'Comment--collapsed': this.state.collapsed
    })
    var timeMoment = moment(comment.time * 1000)
    return React.DOM.div({className: className},
      comment.deleted && React.DOM.div({className: "Comment__meta"},
        this.renderCollapseControl(), ' ',
        "[deleted]"
      ),
      !comment.deleted && React.DOM.div({className: "Comment__meta"},
        this.renderCollapseControl(), ' ',
        Link({to: "user", params: {id: comment.by}, className: "Comment__meta__user"}, comment.by), ' ',
        timeMoment.fromNow(), ' ',
        "| ", Link({to: "comment", params: {id: comment.id}}, "link"),
        comment.dead && React.DOM.span(null, " | [dead]")
      ),
      !comment.deleted && React.DOM.div({className: "Comment__text"},
        React.DOM.div({dangerouslySetInnerHTML: {__html: comment.text}})
      ),
      comment.kids && React.DOM.div({className: "Comment__kids"},
        comment.kids.map(function(id) {
          return Comment({key: id, id: id})
        })
      )
    )
  },
  renderCollapseControl: function() {
    return React.DOM.span({className: "Comment__collapse", onClick: this.toggleCollapsed, onKeyPress: this.toggleCollapsed, tabIndex: "0"},
      "[", this.state.collapsed ? '+' : '–', "]"
    )
  }
})

var Story = React.createClass({displayName: 'Story',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {story: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + (this.props.id || this.props.params.id)), 'story')
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (!this.state.story.id && nextState.story.id) {
      setTitle(nextState.story.title)
    }
  },
  render: function() {
    var story = this.state.story
    if (!story.id) { return React.DOM.div({className: "Story Story--loading"}, "Loading...") }
    var timeMoment = moment(story.time * 1000)
    return React.DOM.div({className: "Story"},
      React.DOM.div({className: "Story__url"},
        React.DOM.a({href: story.url}, story.title), ' ',
        React.DOM.span({className: "Story__host"}, "(", parseHost(story.url), ")")
      ),
      React.DOM.div({className: "Story__meta"},
        React.DOM.span({className: "Story__score"},
          story.score, " point", pluralise(story.score)
        ), ' ',
        React.DOM.span({className: "Story__by"},
          "by ", Link({to: "user", params: {id: story.by}}, story.by)
        ), ' ',
        React.DOM.span({className: "Story__time"}, timeMoment.fromNow())
      ),
      React.DOM.div({className: "Story__kids"},
        story.kids && story.kids.map(function(id) {
          return Comment({key: id, id: id})
        })
      )
    )
  }
})

var ListStory = React.createClass({displayName: 'ListStory',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {story: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + this.props.id || this.props.params.id), 'story')
  },
  render: function() {
    var story = this.state.story
    if (!story.id) { return React.DOM.li({className: "ListStory ListStory--loading"}, "Loading...") }
    var timeMoment = moment(story.time * 1000)
    return React.DOM.li({className: "ListStory"},
      React.DOM.div({className: "Story__url"},
        React.DOM.a({href: story.url}, story.title), ' ',
        React.DOM.span({className: "Story__host"}, "(", parseHost(story.url), ")")
      ),
      React.DOM.div({className: "Story__meta"},
        React.DOM.span({className: "Story__score"},
          story.score, " point", pluralise(story.score)
        ), ' ',
        React.DOM.span({className: "Story__by"},
          "by ", Link({to: "user", params: {id: story.by}}, story.by)
        ), ' ',
        React.DOM.span({className: "Story__time"}, timeMoment.fromNow()), ' ',
        "| ", Link({to: "story", params: {id: story.id}}, "comments")
      )
    )
  }
})

var Stories = React.createClass({displayName: 'Stories',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {stories: []}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(TOP_STORIES_URL), 'stories')
    setTitle()
  },
  getPage: function() {
    return (this.props.query.page && /^\d+$/.test(this.props.query.page)
            ? Math.max(1, Number(this.props.query.page))
            : 1)
  },
  render: function() {
    if (this.state.stories.length == 0) {
      return React.DOM.div({className: "Stories Stories--loading"}, "Loading...")
    }
    var page = this.getPage()
    var startIndex = (page - 1) * STORIES_PER_PAGE
    var endIndex = startIndex + STORIES_PER_PAGE
    var stories = this.state.stories.slice(startIndex, endIndex)
    var hasNext = endIndex < this.state.stories.length - 1
    return React.DOM.div({className: "Stories"},
      page > 1 && Paginator({route: "news", page: page, hasNext: hasNext}),
      React.DOM.ol({className: "Stories__list", start: startIndex + 1},
        this.state.stories.slice(startIndex, endIndex).map(function(id, index) {
          return ListStory({key: id, id: id})
        })
      ),
      Paginator({route: "news", page: page, hasNext: hasNext})
    )
  }
})

var Paginator = React.createClass({displayName: 'Paginator',
  render: function() {
    return React.DOM.div({className: "Paginator"},
      this.props.page > 1 && React.DOM.span({className: "Paginator__prev"},
        Link({to: this.props.route, query: {page: this.props.page - 1}}, "Prev")
      ),
      this.props.page > 1 && this.props.hasNext && ' | ',
      this.props.hasNext && React.DOM.span({className: "Paginator__next"},
        Link({to: this.props.route, query: {page: this.props.page + 1}}, "More")
      )
    )
  }
})

var App = React.createClass({displayName: 'App',
  render: function() {
    return React.DOM.div({className: "App"},
      React.DOM.div({className: "App__header"},
        React.DOM.a({href: "http://facebook.github.io/react/"}, React.DOM.img({src: "logo.png", width: "16", height: "16", alt: "React", title: "React website"})), ' ',
        Link({to: "news", className: "App__header__homelink"}, "React Hacker News")
      ),
      React.DOM.div({className: "App__content"},
        this.props.activeRouteHandler(null)
      )
    )
  }
})

var routes = Routes({location: "hash"},
  Route({name: "app", path: "/", handler: App},
    DefaultRoute({handler: Stories}),
    Route({name: "news", path: "news", handler: Stories}),
    Route({name: "story", path: "story/:id", handler: Story}),
    Route({name: "comment", path: "comment/:id", handler: Comment}),
    Route({name: "user", path: "user/:id", handler: User}),
    NotFoundRoute({handler: NotFound})
  )
)

React.renderComponent(routes, document.getElementById('app'))

}()
