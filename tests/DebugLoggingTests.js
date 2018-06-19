'use strict';
var TimeUnit = require('../TimeUnit');
var zurvan = require('../zurvan');

var assert = require('assert');

describe('zurvan', function() {
  describe('debug logging', function() {
    it('logs on interceptTimers and releaseTimers', function() {
      var messages = [];
      var logger = function(message) {
        messages.push(message);
      };
      return zurvan
        .interceptTimers({ debugLogger: logger })
        .then(function() {
          assert(messages.length === 2);
          assert(messages[0] === 'intercepting timers');
          assert(messages[1] === 'advancing time to 0ns');
          return zurvan.releaseTimers();
        })
        .then(function() {
          console.log(messages);
          assert(messages.length === 4);
          assert(messages[2] === 'releasing timers');
          assert(messages[3] === 'advancing time to 0ns');
        });
    });

    it('logs on forcedReleaseTimers', function() {
      var messages = [];
      var logger = function(message) {
        messages.push(message);
      };
      return zurvan
        .interceptTimers({ debugLogger: logger })
        .then(function() {
          assert(messages.length === 2);
          assert(messages[0] === 'intercepting timers');
          assert(messages[1] === 'advancing time to 0ns');
          return zurvan.forcedReleaseTimers();
        })
        .then(function() {
          console.log(messages);
          assert(messages.length === 3);
          assert(messages[2] === 'releasing timers (forced)');
        });
    });

    it('logs on advancing time', function() {
      var messages = [];
      var logger = function(message) {
        messages.push(message);
      };
      return zurvan
        .interceptTimers({ debugLogger: logger })
        .then(function() {
          assert(messages.length === 2);
          assert(messages[0] === 'intercepting timers');
          assert(messages[1] === 'advancing time to 0ns');
          return zurvan.advanceTime(1000);
        })
        .then(function() {
          assert(messages.length === 3);
          assert(messages[2] === 'advancing time to 1000000000ns');
          return zurvan.releaseTimers();
        });
    });

    it('logs on blockSystem', function() {
      var messages = [];
      var logger = function(message) {
        messages.push(message);
      };
      return zurvan
        .interceptTimers({ debugLogger: logger })
        .then(function() {
          assert(messages.length === 2);
          assert(messages[0] === 'intercepting timers');
          assert(messages[1] === 'advancing time to 0ns');
          return zurvan.blockSystem(1000);
        })
        .then(function() {
          assert(messages.length === 3);
          assert(messages[2] === 'simulating blocking call until 1000000000ns');
          return zurvan.releaseTimers();
        });
    });
  });
});
