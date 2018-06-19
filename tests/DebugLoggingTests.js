"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");

var assert = require("assert");

describe('zurvan', function() {
  describe('debug logging', function() { 
	it('logs on interceptTimers and releaseTimers', function() {
    var messages = []
    var logger = function(message) {
      messages.push(message);
    };
	  return zurvan.interceptTimers({debugLogger: logger})
      .then(function() {
        assert(messages.length === 1);
        assert(messages[0] === 'intercepting timers');
        return zurvan.releaseTimers();
      }).then(function() {
        assert(messages.length === 2);
        assert(messages[1] === 'releasing timers');
      });
  });

	it('logs on forcedReleaseTimers', function() {
    var messages = []
    var logger = function(message) {
      messages.push(message);
    };
	  return zurvan.interceptTimers({debugLogger: logger})
      .then(function() {
        assert(messages.length === 1);
        assert(messages[0] === 'intercepting timers');
        return zurvan.forcedReleaseTimers();
      }).then(function() {
        assert(messages.length === 2);
        assert(messages[1] === 'releasing timers (forced)');
      });
  });

	it('logs on advancing time', function() {
    var messages = []
    var logger = function(message) {
      messages.push(message);
    };
	  return zurvan.interceptTimers({debugLogger: logger})
      .then(function() {
        assert(messages.length === 2);
        assert(messages[0] === 'intercepting timers');
        assert(messages[1] === 'advancing time to 0ns');
        return zurvan.advanceTime(1000);
      }).then(function() {
        assert(messages.length === 3);
        assert(messages[2] === 'advancing time to 1000000000ns');
        return zurvan.releaseTimers();
      });
  });
  });
});
