webpackJsonp([1],{0:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}var l=a(4),u=n(l),r=a(141),s=a(129),c=n(s),o=a(22),d=a(134),i=a(225),f=n(i);a(127);var m=(0,f.default)(d.createHashHistory)();(0,r.render)(u.default.createElement(o.Router,{history:m,RoutingContext:c.default,renderLoading:function(){return u.default.createElement("div",null,"Loading...")}},u.default.createElement(o.Route,{path:"/",component:a(120)},u.default.createElement(o.Route,{path:":username",component:a(126)},u.default.createElement(o.IndexRoute,{component:a(125)}),u.default.createElement(o.Route,{path:":repo_name",component:a(124)},u.default.createElement(o.IndexRoute,{component:a(123)}),u.default.createElement(o.Route,{path:":issue_number",component:a(121)}))))),document.querySelector("#app"))},120:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(27),s=n(r);t.default=u.default.createClass({displayName:"App",render:function(){return u.default.createElement("div",null,u.default.createElement("header",null,u.default.createElement("a",{href:"https://github.com/insin/nwb",target:"_blank"},u.default.createElement(s.default,{name:"github"})),u.default.createElement("a",{href:"https://github.com/insin/react-nwb-github-issues",target:"_blank",className:"btn primary fork"},u.default.createElement(s.default,{name:"code-fork"})," Fork Me on GitHub")),this.props.children)}}),e.exports=t.default},121:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(22),s=a(37),c=n(s),o=a(122),d=n(o),i=function(e,t){var a=e.username,n=e.repo_name,l=e.issue_number;window.fetch("https://api.github.com/repos/"+a+"/"+n+"/issues/"+l).then(function(e){return e.json()}).then(function(e){window.fetch("https://api.github.com/repos/"+a+"/"+n+"/issues/"+l+"/comments").then(function(e){return e.json()}).then(function(a){e.comments=a,t(null,{issue:e})})}).catch(function(e){return t(e)})};t.default=u.default.createClass({displayName:"Issue",statics:{loadProps:function(e,t){i(e,t)}},render:function(){var e=this.props.issue;return u.default.createElement("div",null,u.default.createElement("div",{className:"issue-header"},u.default.createElement("h2",null,e.title," ",u.default.createElement("span",{className:"number"},"#",e.number)),u.default.createElement("p",{className:"details"},u.default.createElement("span",{className:"user"},u.default.createElement(r.Link,{to:"/"+e.user.login},e.user.login))," opened this issue ",u.default.createElement(c.default,{date:e.created_at}))),u.default.createElement("div",{className:"issue-comments"},u.default.createElement(d.default,{comment:e}),e.comments.map(function(e){return u.default.createElement(d.default,{comment:e})})))}}),e.exports=t.default},122:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(22),s=a(37),c=n(s);t.default=u.default.createClass({displayName:"IssueComment",render:function(){var e=this.props.comment;return u.default.createElement("div",null,u.default.createElement(r.Link,{to:"/"+e.user.login},u.default.createElement("img",{className:"avatar",height:"48",width:"48",src:e.user.avatar_url+"&s=96"})),u.default.createElement("div",{className:"comment"},u.default.createElement("p",{className:"comment-header"},u.default.createElement("span",{className:"user"},u.default.createElement(r.Link,{to:"/"+e.user.login},e.user.login)),"commented ",u.default.createElement(c.default,{date:e.created_at})),u.default.createElement("div",{className:"comment-body"},e.body)))}}),e.exports=t.default},123:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(22),s=a(27),c=n(s),o=a(37),d=n(o);t.default=u.default.createClass({displayName:"IssueList",render:function(){var e=this.props.repo;return u.default.createElement("ul",{className:"repo-issues"},e.issues.map(function(t){return u.default.createElement("li",null,u.default.createElement(c.default,{name:"bug"}),u.default.createElement("div",{className:"comments"},u.default.createElement(c.default,{name:"comment-o"})," ",t.comments),u.default.createElement("h3",null,u.default.createElement(r.Link,{to:"/"+e.owner.login+"/"+e.name+"/"+t.number},t.title)),u.default.createElement("p",{className:"details"},"#",t.number," opened ",u.default.createElement(d.default,{date:t.created_at})," by ",u.default.createElement(r.Link,{to:"/"+t.user.login},t.user.login)))}))}}),e.exports=t.default},124:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(22),s=a(27),c=n(s),o=function(e,t,a){window.fetch("https://api.github.com/repos/"+e+"/"+t).then(function(e){return e.json()}).then(function(t){window.fetch("https://api.github.com/repos/"+e+"/"+t.name+"/issues?per_page=10").then(function(e){return e.json()}).then(function(e){t.issues=e,a(null,{repo:t})})}).catch(function(e){return a(e)})};t.default=u.default.createClass({displayName:"Repo",statics:{loadProps:function(e,t){o(e.username,e.repo_name,t)}},render:function(){var e=this.props.repo;return u.default.createElement("div",null,u.default.createElement("div",{className:"repo-header"},u.default.createElement("h1",null,u.default.createElement(c.default,{name:"book"})," ",u.default.createElement("span",{className:"user"},u.default.createElement(r.Link,{to:"/"+e.owner.login},e.owner.login))," / ",u.default.createElement("span",{className:"repo"},u.default.createElement(r.Link,{to:"/"+e.owner.login+"/"+e.name},e.name)))),this.props.children&&u.default.cloneElement(this.props.children,{repo:e}))}}),e.exports=t.default},125:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(22),s=a(27),c=n(s),o=a(37),d=n(o);t.default=u.default.createClass({displayName:"RepoList",render:function(){var e=this.props.user;return u.default.createElement("div",null,u.default.createElement("ul",{className:"user-repos"},e.repos.map(function(t){return u.default.createElement("li",{key:t.name},u.default.createElement("ul",{className:"repo-info"},t.language&&u.default.createElement("li",null,t.language),u.default.createElement("li",null,u.default.createElement(c.default,{name:"star"})," ",t.stargazers_count),u.default.createElement("li",null,u.default.createElement(c.default,{name:"code-fork"})," ",t.forks_count),u.default.createElement("li",null,u.default.createElement(c.default,{name:"bug"})," ",t.open_issues_count)),u.default.createElement("h3",null,u.default.createElement(r.Link,{to:"/"+e.login+"/"+t.name},t.name)),t.description&&u.default.createElement("p",{className:"description"},"The source for ",t.description),u.default.createElement("p",{className:"updated"},"Updated ",u.default.createElement(d.default,{date:t.pushed_at})))})))}}),e.exports=t.default},126:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var l=a(4),u=n(l),r=a(27),s=n(r),c=function(e,t){window.fetch("https://api.github.com/users/"+e).then(function(e){return e.json()}).then(function(e){window.fetch("https://api.github.com/users/"+e.login+"/repos?sort=pushed&direction=desc&per_page=100").then(function(e){return e.json()}).then(function(a){e.repos=a,t(null,{user:e})})}).catch(function(e){return t(e)})};t.default=u.default.createClass({displayName:"User",statics:{loadProps:function(e,t){c(e.username,t)}},render:function(){var e=this.props.user;return u.default.createElement("div",null,u.default.createElement("div",{className:"user-header"},u.default.createElement("img",{className:"avatar",height:"120",src:e.avatar_url+"&s=240",width:"120"}),u.default.createElement("h1",null,e.name),u.default.createElement("ul",{className:"user-details"},e.company&&u.default.createElement("li",null,u.default.createElement(s.default,{name:"briefcase"}),e.company),e.location&&u.default.createElement("li",null,u.default.createElement(s.default,{name:"globe"}),e.location),e.blog&&u.default.createElement("li",null,u.default.createElement(s.default,{name:"link"}),u.default.createElement("a",{href:e.blog,target:"_blank"},e.blog))),u.default.createElement("ul",{className:"user-tabs"},u.default.createElement("li",{className:"active"},u.default.createElement(s.default,{name:"book"})," Repositories ",u.default.createElement("span",{className:"badge"},e.public_repos)))),this.props.children&&u.default.cloneElement(this.props.children,{user:e}))}}),e.exports=t.default},127:128});
//# sourceMappingURL=app.js.map