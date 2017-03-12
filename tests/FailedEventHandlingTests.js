"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");
var TimeUnit = require("../TimeUnit");

var Promise = Promise || require('bluebird');

describe('zurvan during runtime exception', function() {
  function fail() {
	throw new Error("I shall fail");
  }
  
  it('continues as if nothing happened (default node behavior), but resolves with an array of failures', function() {
    return zurvan.interceptTimers( { timeSinceStartup: 1 } )
	  .then(function() {
	    setTimeout(fail, 1000);
  	    return zurvan.advanceTime(TimeUnit.milliseconds(1000));  
	  })
	  .then(function(arr) {
		assert.equal(arr.length, 1);
		assert.equal(arr[0].failedAt.toMilliseconds(), 2000);
		assert.equal(arr[0].timerCallDelay, 1000);
		assert.equal(process.uptime(), 2);
  	    return zurvan.releaseTimers();
	  });
  });
  
  it('on special configuration rejects with an array of failures', function() {
    return zurvan.interceptTimers( { timeSinceStartup: 1, rejectOnCallbackFailure: true } )
	  .then(function() {
	    setTimeout(fail, 1000);
  	    return zurvan.advanceTime(TimeUnit.milliseconds(1000));  
	  })
	  .then(function() { 
	    return Promise.reject(new Error("Should reject when asked to, but didn't"));
	  }, function(arr) {
		assert.equal(arr.length, 1);
		assert.equal(arr[0].failedAt.toMilliseconds(), 2000);
		assert.equal(arr[0].timerCallDelay, 1000);
		assert.equal(process.uptime(), 2);
  	    return zurvan.releaseTimers();
	  });
  });
  
});