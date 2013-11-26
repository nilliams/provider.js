	
// Possible Names - Providerly, Providence
//
// Possible more ambitious goal: "Angular-style DI for Backbone, Ember or Vanilla JS"
// TODO: A `wasInjected` property on injected objects? (won't work for primitives tho, e.g. strings)
// TODO: Provider.infect(Backbone.Model, Backbone.View, Backbone.Collection)
//       (infects `extend()` friendly objects)
//
//
//
//
/*
	_oldExtend = Backbone.Model.extend;
	Backbone.Model.extend = function(protoProps, staticProps) {
		Provider.annotate( protoProps.initialize );
		return _oldExtend( protoProps, staticProps );
	}
	var Test = Backbone.Model.extend({
		initialize: function(options, $http) {

		}
	});
	var test = new Test({});
*/


var Provider = require('./provider');

// Create a widget that depends on an `$http` service
var MyWidget = Provider.Widget.extend({
	initialize: function(options, $http) {
		console.log( 'Initialized with:', options, '&', $http );
	}
});

// Perhaps generally better to do keep the top-level of options clean as
// it is meant to configure the object *requesting* this dep. do this by 
// namespacing dependency-related stuff, i.e. `options.dependencies.fooOption`
Provider.provide('$http', function(options) {
	return ( options && options.fooOption === 'bar' ) ? '$http-bar' : '$http-default';
});

// Normal use
// Prints `Initialized with: { fooOption: 'bar' } & $http-bar`
var w = new MyWidget({ fooOption: 'bar' });

// Override the `$http` injection with a manually passed-in param
// Prints `Initialized with: { fooOption: 'bar' } & $http-qux`
w = new MyWidget({ fooOption: 'bar' }, '$http-qux');

// Don't even pass in options. options should be null, http should be injected?
// Prints `Initialized with: null & $http-default`
w = new MyWidget();

// Hmm
w = new MyWidget(null, '$http-beep-boop');


// Can declare a widget type that doesn't have an `options` param
var MyWidget2 = Provider.Widget.extend({
	initialize: function($http) {
		console.log( 'Initialized MyWidget2 with:', $http );
	}
});

w = new MyWidget2();

w = new MyWidget2('$http-wat');

// is the shared `options` hash, even a good idea? does Angular do anything like this?
// `options` is a magic paramater. if your widget names it in its constructor
// the same hash will be passed as a parameter to your provider
// this can allow you to make dependency decisions, based on your options hash, yet
// keep the logic out of your main Widget
// I've not really decided if this is a good idea or not.

// TODO: Trickling dependencies

console.log("Try Trickling deps...")

var Apple = Provider.Widget.extend({
	initialize: function(options, $worm) {
		console.log("Made apple with", $worm);
	},
	breed: function() {
		return "Granny smith";
	}
});

// TreeProviders.js
// Now specify my '$apple' provider
Provider.provideMultiple({
	'$apple': function(options) {
		return new Apple();
	},
	'$worm': function(options) {
		return 'long worm';
	}
});

var Tree = Provider.Widget.extend({
	initialize: function(options, $apple) {
		console.log("Made Tree with apple", $apple.breed());
	}
});

var t = new Tree({ what: 'wut' });