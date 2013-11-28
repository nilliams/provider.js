Provider.js
===========

Simple Dependency Injection for Backbone.js or vanilla JavaScript

> WARNING: This is new, something of a learning exercise, and aimed at a specific use-case I had with a largely vanilla JS system. I have not explored all Backbone use-cases thoroughly. Simply put, this may be a terrible idea.

## Standalone Usage 

Define a provider like so:

    // Define a provider called `$http`
    Provider.provide('$http', function() {
      return SOME_CONDITION ? $.ajax : $.mockjax;
    });

Use `Provider.Object` to define objects with a Backbone-like `extend/initialize` syntax...

    var MyObject = Provider.Object.extend({
      initialize: function() { /* constructor */ }
    });

... with the added bonus that parameters of the constructor function (`initialize`), will be injected if their name matches that of a defined provider. 

      ...
      initialize: function($http) {
        // The '$http' *service* is injected as a provider for '$http' exists
      }

Here's a trivial example in full, providing a simple string value:

    Provider.provide('$foo', function() {
      return ENV_TEST ? 'Yehuda!' : 'World!';    
    });

    var Widget = Provider.Object.extend({
      initialize: function($foo) {
        console.log('Hello', $foo);
      });
    });

    ENV_TEST = true;
    var w1 = new Widget();  // prints 'Hello Yehuda!'

    ENV_TEST = false;
    var w2 = new Widget();  // prints 'Hello World!'

### The `options` parameter

If you use an `options` parameter (yes the name is magic) in your constructor, that same `options` object will be passed to your provider when your object is instantiated.

    var MyObject = Provider.Object.extend({
      initialize: function(options, $http) {
        // See that options ^^^ param - the use of that name here is magic
        console.log($http);
      }
    });

    // The provider can use `options` to help make it's mind up
    Provider.provider('$http', function(options) {
      return ( options.foo ) ? $.foojax : $.ajax;
    });

    var m = new MyObject({ foo: true }); // logs out $.foojax

I've no idea if this is a good idea generally, but I had a use-case in mind.

## Provider + Backbone

Allows you to define injectables in your Backbone Views, Models or Collections, right in the constructor function, for example.

    var MyModel = Backbone.Model.extend({

      // The parameters named here will be looked up by name
      initialize: function(attrs, options, $http) {
        
        // The `$http` *service* is injected, if a provider exists.
      });
    });

Where the definition of how `$http` should be injected is defined with a provider:

    Provider.provide('$http', function() {
      return SOME_CONDITION ? $.ajax : $.mockjax;
    });

Note that prefixing your *injectable* parameters with `$` symbols (like `$http`, `$myservice` etc. is ***not*** required, it's just a suggested convention borrowed from Angular. In the above example, creating a provider for `options` or `attrs` would also cause those params to be injected (obviously this is not desirable behaviour as you typically want to let Backbone handle those).

You can override any injectable parameter when you instantiate your objects. This can be useful in your tests.

    // Allow the dependency injection to take place, the provider is used
    new MyModel({ name: 'Yehuda' });

    // Pass $.nojax as the $http parameter, the provider will not be used
    new MyModel({ name: 'Yehuda' }, {}, $.nojax);

Your provider can return object instances (to act like a factory), references (i.e. `$.ajax` vs `$.mockjax`), or values. Whatever you want to inject.

### Why?

Why would I do this?

 * Allows easy substitution of dependencies in testing.
 * Dependencies are made explicit in the constructor.
 * Keep your object construction code out of your main business logic, i.e. not inside your actual Views, Models or Collections.
 * Combined with Polymorphism, this can push a lot of conditional logic out of your business logic and into your factories/providers.
 * And (similarly) the NullObject pattern - eliminate null-checks from your business logic, e.g. simply inject one of `User` or `Guest` and call the same methods on both, rather than checking `isLoggedIn` all over the place.