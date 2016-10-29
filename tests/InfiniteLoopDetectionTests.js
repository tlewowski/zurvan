"use strict";
var assert = require("assert");
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");


describe('zurvan', function() {
  describe('detects infinite setImmediate loop when there are enough calls', function() {
	it('throws on infinite loop detection', function() {
	  return zurvan.interceptTimers()
  	  .then(function() {
	    var onlyOneSuchFunctionInWholeProgram = function() {setImmediate(onlyOneSuchFunctionInWholeProgram);};
		setImmediate(onlyOneSuchFunctionInWholeProgram);
	    return zurvan.waitForEmptyQueue();
	  }).then(function() {
         throw new Error("Infinite loop should be detected!");
      }, function(err) {
	    assert(err instanceof Error);
		assert(new RegExp("Possible infinite setImmediate loop detected").test(err.message));
	    return zurvan.forcedReleaseTimers();
	  }).then(function(res) {
	    assert(res.immediates);
		assert(res.immediates.size > 0);
		Object.keys(res.immediates).forEach(function(k) {
		  if(k !== 'size') {
		    assert(new RegExp("onlyOneSuchFunctionInWholeProgram").test(res.immediates[k]));
		  }
		});
	  });
	});
  });
});