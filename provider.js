// Provider.js 0.2
// (c) 2013 Nick Williams
// Provider may be freely distributed under the MIT license

(function() {

	// global on the server, window in the browser
	var root = this;

	// Widget
	// ------

	function Widget() {
		var deps = depsFromArgs( this, arguments );
		this.initialize.apply( this, deps );
	}

	Widget.prototype.initialize = function(options) {};

	Widget.extend = function(protoProps, staticProps) {
		annotate( protoProps.initialize );
		return extend.call( this, protoProps, staticProps );
	}

	// Provider
	// --------

	var Provider = {
		cache: [],
		provide: function(serviceName, fn) {
			this.cache[ serviceName ] = fn;
		},
		provideMultiple: function(hash) {
			for (var serviceName in hash) {
				this.cache[ serviceName ] = hash[ serviceName ];
			}
		}
	};

	// `depsFromArgs()` - The magic that happens when a constructor is called
	// Grab the list of *annotated* parameter names from the `initialize` function. For each parameter
	// either lookup from the appropriate provider, or override with the argument passed in

	function depsFromArgs(context, args) {
		var paramNames = context.initialize.$inject;

		// If `extend` hasn't been called (no injection)
		// or more arguments have been passed in than the injectables, just pass them right through
		if ( !paramNames || paramNames.length < args.length ) return Array.prototype.slice.apply( args );

		// `options` is magic. if it is anywhere in paramNames, it will get passed to the provider fn call
		var optsPosition = paramNames.indexOf('options');
		var options = optsPosition !== -1 && (optsPosition < args.length) ? args[optsPosition] : null;

		var deps = [];
		paramNames.forEach(function(paramName, i) {
			if ( i < args.length ) {
				deps.push( args[i] );
				return;
			}

			// Lookup the provider for this parameter
			if ( Provider.cache[paramName] ) {
				deps.push( Provider.cache[paramName](options) );
			} else {
				deps.push( null );
			}
		});
		return deps;
	}

	// Infect Backbone's `Model`, `View` and `Collection` objects

	function infect() {
		if ( !Backbone ) {
			console.log("Provider: Couldn't infect(). No reference to Backbone found");
			return;
		}

		['View', 'Model', 'Collection'].forEach(function(Type) {

			// Save a reference to the constructor.
			var Constructor = Backbone[ Type ];

			// Monkey-patch the constructor to figure out what to inject
			Backbone[ Type ] = function() {
				var argsPlusInjectedArgs = depsFromArgs( this, arguments );

				Constructor.apply( this, argsPlusInjectedArgs );
			};

			// Copy over the prototype
			Backbone[ Type ].prototype = Constructor.prototype;

			// Monkey-patch `extend()`
			Backbone[ Type ].extend = function(protoProps, staticProps) {
				annotate( protoProps.initialize );
				return Constructor.extend.call( this, protoProps, staticProps );
			};

		});
	}

	Provider.Object = Widget;
	Provider.infect = infect;

	// Helpers / 3rd Party
	// -------------------

	// `extend()` from Backbone.js - not required in the 'backbone-only-build'. License:
	//
	// (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
	// (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	// Backbone may be freely distributed under the MIT license.
	// For all details and documentation:
	// http://backbonejs.org
	var extend = function(protoProps, staticProps) {
		var parent = this;
		var child;

		// The constructor function for the new subclass is either defined by you
		// (the "constructor" property in your `extend` definition), or defaulted
		// by us to simply call the parent's constructor.
		if ( protoProps && protoProps.hasOwnProperty('constructor') ) {
			child = protoProps.constructor;
		} else {
			child = function() { return parent.apply(this, arguments); };
		}

		// Add static properties to the constructor function, if supplied.
		_extend( child, parent, staticProps );

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		var Surrogate = function() { this.constructor = child; };
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate;

		// Add prototype/instance properties to the subclass if supplied
		if ( protoProps ) _extend( child.prototype, protoProps );

		// Set a convenience property in case the parent's prototype is needed
		// later.
		child.__super__ = parent.prototype;
		return child;
	};

	var _extend = function(obj) {
	  Array.prototype.slice.call(arguments, 1).forEach(function(source) {
	    if ( source ) {
	      for ( var prop in source ) { obj[prop] = source[prop]; }
	    }
	  });
	  return obj;
	};

	// Adapted version of `annotate()` from Angular.js. License:
	//
	// @license AngularJS v1.2.3
	// (c) 2010-2014 Google, Inc. http://angularjs.org
	// License: MIT
	var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
	var FN_ARG_SPLIT = /,/;
	var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

	var annotate = function(fn) {
	  if ( typeof fn !== 'function' ) return;
	  if ( fn.$inject ) return fn.$inject;

	  var fnText  = fn.toString().replace(STRIP_COMMENTS, '');
	  var argDecl = fnText.match(FN_ARGS);

	  var $inject = [];
	  argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
	    arg.replace( FN_ARG, function(all, underscore, name) {
	      $inject.push(name);
	    });
	  });

	  fn.$inject = $inject;
	  return $inject;
	};


	// AMD / RequireJS
  if ( typeof define !== 'undefined' && define.amd ) {
    define([], function() { return Provider; });
  }
  // Node.js
  else if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = Provider;
  }
  // included directly via <script> tag
  else {
    root.Provider = Provider;
  }

}());