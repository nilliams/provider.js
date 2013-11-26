(function() {

	// global on the server, window in the browser
	var root = this;

	// _extend() - adapted from `_.extend()` from underscore.js; minor tweak (use `Array.forEach`)
	var _extend = function(obj) {
	  Array.prototype.slice.call(arguments, 1).forEach(function(source) {
	    if ( source ) {
	      for ( var prop in source ) { obj[prop] = source[prop]; }
	    }
	  });
	  return obj;
	};

	// `extend()` from Backbone.js
	// plus annotation of constructors
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

		// Annotate
		annotate( protoProps.initialize )
		console.log( "Constructor has been annotated with its params:", protoProps.initialize.$inject )

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

	// Widget
	// ------
	// Get all argument names previously annotated within the Obj's constructor, e.g. '$pager', '$dataStore'
	// TODO: Error if no '$inject'?
	function Widget() {
		var deps = depsFromArgs( this, arguments )
		this.initialize.apply( this, deps );
	}

	function depsFromArgs(context, args) {
		var paramNames = context.initialize.$inject;

		// A-HA. That's why this was broken
		// The forEach is on paramNames
		// so if paramNames.length = 0  but there *are* passed in arguments, those args aren't returned/applied
		if ( paramNames.length < args.length ) return Array.prototype.slice.apply( args );

		// `options` is magic. if it is anywhere in paramNames, it will get passed to the provider fn call
		var optsPosition = paramNames.indexOf('options');
		var options = optsPosition !== -1 && (optsPosition < args.length) ? args[optsPosition] : null;

		var deps = [];
		paramNames.forEach(function(paramName, i) {
			if ( i < args.length ) {
				deps.push( args[i] );
				return;
			}

			if ( Provider.cache[paramName] ) {
				deps.push( Provider.cache[paramName](options) );
			} else {
				deps.push( null );
				console.log( 'WARNING: No provider for param:', paramName );
			}
		});
		return deps;
	}

	Widget.prototype.initialize = function(options) {};
	Widget.extend = extend;

	// Provider
	// --------

	var Provider = {
		cache: [],
		provide: function(serviceName, fn) {
			this.cache[ serviceName ] = fn;
		},
		provideMultiple: function(hash) {
			for (var serviceName in hash) {
				this.cache[ serviceName ] = hash[serviceName];
			}
		}
	};

	// Infect Backbone's `Model`, `View` and `Collection` objects

	function infect() {
		if ( !Backbone ) {
			console.log("Provider: Couldn't infect(). No reference to Backbone found");
			return;
		}

		// Save a reference to the constructor.
		var ModelConstructor = Backbone.Model;

		Backbone.Model = function(attributes, options) {
			var argsPlusInjectedArgs = depsFromArgs(this, arguments);

			// Act like nothing happened, eh tbranyen.
			ModelConstructor.apply(this, argsPlusInjectedArgs);
		};

		// Copy over the prototype as well.
		Backbone.Model.prototype = ModelConstructor.prototype;

		// Monkey-patch `extend()`
		Backbone.Model.extend = function(protoProps, staticProps) {
			annotate(protoProps.initialize);

			return ModelConstructor.extend.call(this, protoProps, staticProps);
		};
	}


	Provider.Widget = Widget;
	Provider.infect = infect;

	//Provider.annotate = annotate;
	//Provider.deps = depsFromArgs;

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