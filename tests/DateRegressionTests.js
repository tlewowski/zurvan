var zurvan = require("../zurvan");

var util = require("util");
var assert = require("assert");

describe('zurvan', function() {
  describe('had a buggy behavior', function() {
    beforeEach(function() {
	  return zurvan.interceptTimers();
	});
	afterEach(function() {
	  return zurvan.releaseTimers();
	});
	
	it('when serializing Date via util.format', function(done) {
	  zurvan.setSystemTime(new Date(Date.UTC(2005, 5, 6, 2, 1, 3)).toISOString());
	  var formatted = util.format(new Date());
	  assert(formatted.search("2005") !== -1);
	  done();
	});
  });
});