/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(1);
	var Demo = __webpack_require__(2);

	React.render(React.createElement(Demo, null), document.querySelector('#app'));

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = React;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	__webpack_require__(3);

	var React = __webpack_require__(1);
	var Octicon = __webpack_require__(7);

	var OCTICON_NAMES = 'alert alignment-align alignment-aligned-to alignment-unalign arrow-down arrow-left arrow-right arrow-small-down arrow-small-left arrow-small-right arrow-small-up arrow-up beer book bookmark briefcase broadcast browser bug calendar check checklist chevron-down chevron-left chevron-right chevron-up circle-slash circuit-board clippy clock cloud-download cloud-upload code color-mode comment-add comment comment-discussion credit-card dash dashboard database device-camera device-camera-video device-desktop device-mobile diff diff-added diff-ignored diff-modified diff-removed diff-renamed ellipsis eye-unwatch eye-watch eye file-binary file-code file-directory file-media file-pdf file-submodule file-symlink-directory file-symlink-file file-text file-zip flame fold gear gift gist gist-secret git-branch-create git-branch-delete git-branch git-commit git-compare git-merge git-pull-request-abandoned git-pull-request globe graph heart history home horizontal-rule hourglass hubot inbox info issue-closed issue-opened issue-reopened jersey jump-down jump-left jump-right jump-up key keyboard law light-bulb link link-external list-ordered list-unordered location gist-private mirror-private git-fork-private lock logo-github mail mail-read mail-reply mark-github markdown megaphone mention microscope milestone mirror-public mirror mortar-board move-down move-left move-right move-up mute no-newline octoface organization package paintcan pencil person-add person-follow person pin playback-fast-forward playback-pause playback-play playback-rewind plug repo-create gist-new file-directory-create file-add plus podium primitive-dot primitive-square pulse puzzle question quote radio-tower repo-delete repo repo-clone repo-force-push gist-fork repo-forked repo-pull repo-push rocket rss ruby screen-full screen-normal search-save search server settings log-in sign-in log-out sign-out split squirrel star-add star-delete star steps stop repo-sync sync tag-remove tag-add tag telescope terminal three-bars thumbsdown thumbsup tools trashcan triangle-down triangle-left triangle-right triangle-up unfold unmute versions remove-close x zap'.split(' ').sort();
	var OCTICON_NAMES_LOOKUP = OCTICON_NAMES.reduce(function (lookup, name) {
	  return (lookup[name] = true, lookup);
	}, {});

	var Demo = React.createClass({
	  displayName: 'Demo',

	  getInitialState: function getInitialState() {
	    return { mega: true, search: 'sync', name: 'sync', spin: false };
	  },
	  getCode: function getCode() {
	    var _state = this.state;
	    var mega = _state.mega;
	    var name = _state.name;
	    var spin = _state.spin;

	    return '<Octicon name="' + name + '"' + (mega ? ' mega' : '') + (spin ? ' spin' : '') + '/>';
	  },

	  handleCheckedChange: function handleCheckedChange(e) {
	    this.setState(_defineProperty({}, e.target.name, e.target.checked));
	  },
	  handleNameChange: function handleNameChange(e) {
	    var name = e.target.value;
	    this.setState({ name: name, search: name });
	  },
	  // <select> doesn't have its value updated yet when onKeyDown fires
	  handleNameChangeDelayed: function handleNameChangeDelayed(e) {
	    var _this = this;

	    var target = e.target;

	    setTimeout(function () {
	      return _this.handleNameChange({ target: target });
	    }, 0);
	  },
	  handleSearchChange: function handleSearchChange(e) {
	    var search = e.target.value;
	    this.setState({
	      search: search,
	      name: search in OCTICON_NAMES_LOOKUP ? search : this.state.name
	    });
	  },

	  render: function render() {
	    var _state2 = this.state;
	    var mega = _state2.mega;
	    var name = _state2.name;
	    var search = _state2.search;
	    var spin = _state2.spin;

	    return React.createElement(
	      'div',
	      { className: 'Demo' },
	      React.createElement(
	        'h1',
	        null,
	        'react-octicon'
	      ),
	      React.createElement(
	        'p',
	        null,
	        React.createElement(Octicon, { name: name, mega: mega, spin: spin })
	      ),
	      React.createElement(
	        'p',
	        null,
	        React.createElement(
	          'code',
	          null,
	          this.getCode()
	        )
	      ),
	      React.createElement(
	        'p',
	        null,
	        React.createElement('input', { name: 'search', value: search,
	          list: 'names',
	          onChange: this.handleSearchChange }),
	        React.createElement(
	          'datalist',
	          { id: 'names' },
	          OCTICON_NAMES.map(function (name) {
	            return React.createElement('option', { value: name });
	          })
	        ),
	        ' ',
	        React.createElement(
	          'select',
	          { name: 'name', value: name,
	            onChange: this.handleNameChange,
	            onKeyDown: this.handleNameChangeDelayed,
	            onKeyUp: this.handleNameChange },
	          OCTICON_NAMES.map(function (name) {
	            return React.createElement(
	              'option',
	              null,
	              name
	            );
	          })
	        ),
	        ' ',
	        React.createElement(
	          'label',
	          null,
	          React.createElement('input', { type: 'checkbox', name: 'mega', checked: mega, onChange: this.handleCheckedChange }),
	          ' mega'
	        ),
	        ' ',
	        React.createElement(
	          'label',
	          null,
	          React.createElement('input', { type: 'checkbox', name: 'spin', checked: spin, onChange: this.handleCheckedChange }),
	          ' spin'
	        )
	      ),
	      React.createElement(
	        'p',
	        null,
	        React.createElement(
	          'small',
	          null,
	          React.createElement(
	            'a',
	            { href: 'https://github.com/insin/react-octicon' },
	            React.createElement(Octicon, { name: 'repo-forked' }),
	            ' me on ',
	            React.createElement(Octicon, { name: 'logo-github' })
	          )
	        )
	      )
	    );
	  }
	});

	module.exports = Demo;

/***/ },
/* 3 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(8);

	module.exports = __webpack_require__(14);

/***/ },
/* 8 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ },
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }return target;
	};

	function _objectWithoutProperties(obj, keys) {
	  var target = {};for (var i in obj) {
	    if (keys.indexOf(i) >= 0) continue;if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;target[i] = obj[i];
	  }return target;
	}

	__webpack_require__(15);

	var React = __webpack_require__(1);

	var Octicon = React.createClass({
	  displayName: 'Octicon',

	  propTypes: {
	    name: React.PropTypes.string.isRequired,
	    className: React.PropTypes.string,
	    mega: React.PropTypes.bool,
	    spin: React.PropTypes.bool
	  },
	  getDefaultProps: function getDefaultProps() {
	    return {
	      mega: false,
	      spin: false
	    };
	  },
	  render: function render() {
	    var _props = this.props;
	    var name = _props.name;
	    var className = _props.className;
	    var mega = _props.mega;
	    var spin = _props.spin;

	    var props = _objectWithoutProperties(_props, ['name', 'className', 'mega', 'spin']);

	    var classNames = [mega ? 'mega-octicon' : 'octicon', 'octicon-' + name];
	    if (spin) {
	      classNames.push('octicon-spin');
	    }
	    if (className) {
	      classNames.push(className);
	    }
	    return React.createElement('span', _extends({}, props, { className: classNames.join(' ') }));
	  }
	});

	module.exports = Octicon;

/***/ },
/* 15 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }
/******/ ]);