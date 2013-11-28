
// Tests require mocha and expect.js

describe("Provider.Object#extend", function() {

	// Note: These annotation tests can be useful, yet check private functionality.
	// As such, you can delete them if they fail (thanks Sandi Metz).
  it("annotates constructor parameters under $inject", function() {
		var Widget = Provider.Object.extend({
			initialize: function($foo, bar) {}
		});

		var params = Widget.prototype.initialize.$inject;
		expect( params ).to.contain("$foo");
		expect( params ).to.contain("bar");
		expect( params ).to.have.length( 2 );
  });

  it("annotates with an empty array if no parameters are named", function() {
 		var Widget = Provider.Object.extend({
			initialize: function() {}
		});

 		expect( Widget.prototype.initialize.$inject ).to.be.empty();
  });
});

describe("Provider#provide", function() {

	it("adds a provider to the cache", function() {
		// Prevent false-positive, i.e. caused by other tests
		expect( Provider.cache ).to.not.have.key("$foo");

		Provider.provide("$foo", function() { return "foo-service"; });
		expect( Provider.cache ).to.have.key("$foo");
	});

	it("adds multiple providers to the cache", function() {
		// Prevent false-positive, i.e. caused by other tests
		expect( Provider.cache ).to.not.have.keys([ "$bark", "$meow" ]);

		Provider.provideMultiple({
			"$bark": function() { return "bark-service" },
			"$meow": function() { return "meow-service" }
		});
		expect( Provider.cache ).to.have.keys([ "$bark", "$meow" ]);
	});
});

describe("Provider.Object#initialize", function() {

  it("injects a provided parameter on instantiation", function() {
		var Widget = Provider.Object.extend({
			initialize: function($bar) {
				expect( $bar ).to.be("bar-service");
			}
		});

		Provider.provide("$bar", function() { return "bar-service"; });
		var w = new Widget();
	});

	it("allows provided parameters to be overridden by values passed into the constructor", function() {
		var Widget = Provider.Object.extend({
			initialize: function($qux) {
				expect( $qux ).to.be("overridden!");
			}
		});

		Provider.provide("$qux", function() { return "qux-service"; });
		var w = new Widget("overridden!");
	});
});

describe("The options parameter", function() {

  it("gets passed to the provider, on instantation", function() {
		var Widget = Provider.Object.extend({
			initialize: function(options, $beep) {
				expect( $beep ).to.be("boop!");
			}
		});

		Provider.provide("$beep", function(options) {
			return options.shouldBoop ? "boop!" : "whirr";
		});

		var w = new Widget({ shouldBoop: true });
  });
});