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
var TOP_ITEMS_URL = 'https://hacker-news.firebaseio.com/v0/topstories'
var ITEMS_PER_PAGE = 30

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
    if (!user.id) { return React.DOM.div({className: "User User--loading"}) }
    var createdMoment = moment(user.created * 1000)
    return React.DOM.div({className: "User"},
      React.DOM.h4(null, user.id),
      React.DOM.dl(null,
        React.DOM.dt(null, "Created"),
        React.DOM.dd(null, createdMoment.fromNow(), " (", createdMoment.format('LL'), ")"),
        React.DOM.dt(null, "Karma"),
        React.DOM.dd(null, user.karma),
        React.DOM.dt(null, "Delay"),
        React.DOM.dd(null, user.delay),
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
    if (!comment.id) { return React.DOM.div({className: "Comment Comment--loading"}) }
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

var PollOption = React.createClass({displayName: 'PollOption',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {pollopt: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + this.props.id), 'pollopt')
  },
  render: function() {
    var pollopt = this.state.pollopt
    if (!pollopt.id) { return React.DOM.div({className: "PollOption PollOption--loading"}) }
    return React.DOM.div({className: "PollOption"},
      React.DOM.div({className: "PollOption__text"},
        pollopt.text
      ),
      React.DOM.div({className: "PollOption__score"},
        pollopt.score, " point", pluralise(pollopt.score)
      )
    )
  }
})

function renderItemTitle(item) {
  var hasURL = !!item.url
  var title
  if (item.dead) {
    title = '[dead] ' + item.title
  }
  else {
    title = (hasURL ? React.DOM.a({href: item.url}, item.title)
                    : Link({to: item.type, params: {id: item.id}}, item.title))
  }
  return React.DOM.div({className: "Item__title"},
    title,
    hasURL && ' ',
    hasURL && React.DOM.span({className: "Item__host"}, "(", parseHost(item.url), ")")
  )
}

function renderItemMeta(item, commentsLink) {
  var timeMoment = moment(item.time * 1000)
  var isNotJob = (item.type != 'job')
  return React.DOM.div({className: "Item__meta"},
    isNotJob && React.DOM.span({className: "Item__score"},
      item.score, " point", pluralise(item.score)
    ), ' ',
    isNotJob && React.DOM.span({className: "Item__by"},
      "by ", Link({to: "user", params: {id: item.by}}, item.by)
    ), ' ',
    React.DOM.span({className: "Item__time"}, timeMoment.fromNow()),
    isNotJob && commentsLink && ' | ',
    isNotJob && commentsLink && Link({to: item.type, params: {id: item.id}}, "comments")
  )
}

var Item = React.createClass({displayName: 'Item',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {item: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + (this.props.id || this.props.params.id)), 'item')
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (!this.state.item.id && nextState.item.id) {
      setTitle(nextState.item.title)
    }
  },
  render: function() {
    var item = this.state.item
    if (!item.id) { return React.DOM.div({className: "Item Item--loading"}) }
    var timeMoment = moment(item.time * 1000)
    return React.DOM.div({className: "Item"},
      renderItemTitle(item),
      renderItemMeta(item),
      item.text && React.DOM.div({className: "Item__text"},
        React.DOM.div({dangerouslySetInnerHTML: {__html: item.text}})
      ),
      item.type == 'poll' && React.DOM.div({className: "Item__poll"},
        item.parts.map(function(id) {
          return PollOption({key: id, id: id})
        })
      ),
      item.kids && React.DOM.div({className: "Item__kids"},
        item.kids.map(function(id) {
          return Comment({key: id, id: id})
        })
      )
    )
  }
})

var ListItem = React.createClass({displayName: 'ListItem',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {item: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + this.props.id || this.props.params.id), 'item')
  },
  render: function() {
    var item = this.state.item
    if (!item.id) { return React.DOM.li({className: "ListItem ListItem--loading"}) }
    var timeMoment = moment(item.time * 1000)
    return React.DOM.li({className: "ListItem"},
      renderItemTitle(item),
      renderItemMeta(item, true)
    )
  }
})

var Items = React.createClass({displayName: 'Items',
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {items: []}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(TOP_ITEMS_URL), 'items')
    setTitle()
  },
  getPage: function() {
    return (this.props.query.page && /^\d+$/.test(this.props.query.page)
            ? Math.max(1, Number(this.props.query.page))
            : 1)
  },
  render: function() {
    if (this.state.items.length == 0) {
      return React.DOM.div({className: "Items Items--loading"})
    }
    var page = this.getPage()
    var startIndex = (page - 1) * ITEMS_PER_PAGE
    var endIndex = startIndex + ITEMS_PER_PAGE
    var items = this.state.items.slice(startIndex, endIndex)
    var hasNext = endIndex < this.state.items.length - 1
    return React.DOM.div({className: "Items"},
      page > 1 && Paginator({route: "news", page: page, hasNext: hasNext}),
      React.DOM.ol({className: "Items__list", start: startIndex + 1},
        this.state.items.slice(startIndex, endIndex).map(function(id, index) {
          return ListItem({key: id, id: id})
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
        Link({to: "news", className: "App__homelink"}, "React Hacker News")
      ),
      React.DOM.div({className: "App__content"},
        this.props.activeRouteHandler(null)
      )
    )
  }
})

var routes = Routes({location: "hash"},
  Route({name: "app", path: "/", handler: App},
    DefaultRoute({handler: Items}),
    NotFoundRoute({handler: NotFound}),
    Route({name: "news", path: "news", handler: Items}),
    Route({name: "item", path: "item/:id", handler: Item}),
    Route({name: "job", path: "job/:id", handler: Item}),
    Route({name: "poll", path: "poll/:id", handler: Item}),
    Route({name: "story", path: "story/:id", handler: Item}),
    Route({name: "comment", path: "comment/:id", handler: Comment}),
    Route({name: "user", path: "user/:id", handler: User})
  )
)

React.renderComponent(routes, document.getElementById('app'))

}()
