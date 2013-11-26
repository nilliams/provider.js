Provider.js
===========

Dependency Injection for Backbone.js or Vanilla JavaScript
----------------------------------------------------------

> WARNING: This is new, something of a learning exercise, and aimed at a specific use-case I had with a largely vanilla JS system. I have not explored all Backbone use-cases thoroughly. Simply put, this may be a terrible idea.

Jump ahead:

 - Standalone (for Vanilla JS)
 - Backbone

## Standalone Usage 

Provider.Object has a Backbone-like `extend/initialize` syntax for constructing objects:

    var MyObject = Provider.Object.extend({
      initialize: function($http) {
        // The `$http` *service* is injected, if a provider exists.
      }
    }); 

Where the definition of how `$http` should be injected is defined with a provider:

    Provider.provide('$http', function() {
      return SOME_CONDITION ? $.ajax : $.mockjax;
    });

### The options parameter

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

Why would I do this?

 * Keep your object construction code out of your main business logic, i.e. not inside your actual Views, Models or Collections.
 * Allows easy substitution of dependencies in testing.
 * Dependencies are made explicit in the constructor, useful in testing.
 * Often eases polymorphism.
 * And (similarly) the NullObject pattern - eliminate null-checks from your business logic, e.g. simply inject one of `User` or `Guest` rather than repeatedly checking `isLoggedIn`.

Rephrase, this keeps your Views, Models & Collections:  

 * free of object construction code (i.e. no `new`-ing of objects)
 * free from being tied to any particular implementation of the injected service/object. e.g. should a `View` need to know how to create a `$dialog` or `$spinner`. No, it just gets handed one that works.

Pondering
---------

Scopes? Like `$modelScope`?

Good Example?


    Provider.provide($dialog, function() {
	  if ( ENV_TEST ) {
        // Setup a dialog without animations
	  }

	  // Setup a dialog with animations
    }); 