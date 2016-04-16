"use strict";
var assert = require("assert");
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan").withDefaultConfiguration({throwOnInvalidClearTimer: true});


describe('zurvan', function() {
  describe('while manages immediates with strict configuration', function() {
	it('throws on clearing of non-existent immediate', function() {
	  var immediate;
	  var called;
	  return zurvan.interceptTimers()
	  .then(function() {
	    immediate = setImmediate(function() { called = true; });
	    clearImmediate(immediate);
		return zurvan.waitForEmptyQueue();
	  }).then(function() {
	    assert(!called);
	  }).then(function() {
	    return zurvan.releaseTimers();
	  }).then(function() {
	    return zurvan.interceptTimers();
	  }).then(function() {
	    clearImmediate(immediate);
	  }).then(function() {
	    return zurvan.releaseTimers().then(function() {
    		throw new Error("Should not be able to clear unexistent immediate");
		  }, function() {
		    throw new Error("Should not be able to clear unexistent immediate");
		  });
	  }, function(err) {
	    assert(err instanceof Error);
		assert(new RegExp("Invalid UID during clearing immediate").test(err.message));
	    return zurvan.releaseTimers();
	  });
	});
  });
});