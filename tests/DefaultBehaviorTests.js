"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");

var assert = require("assert");

describe('zurvan', function() {
  describe('by default', function() { 
	it('ignores invalid clearTimeout/clearInterval request', function(done) {
	  zurvan.interceptTimers().then(function() {
		clearTimeout(undefined);
		clearInterval(3);
		clearInterval({});
		clearInterval(function(){var t;});
		clearTimeout({uid:3});
		
		var trickyRef = {
			uid: 1
		};
		trickyRef.ref = trickyRef;
		
		clearTimeout(trickyRef);
		
		return zurvan.releaseTimers();
	  }).then(done, done);
	});
  });
});