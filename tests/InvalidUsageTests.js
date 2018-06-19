'use strict';
var assert = require('assert');
var TimeUnit = require('../TimeUnit');
var zurvan = require('../zurvan');

var Promise = Promise || require('bluebird');

describe('during wrong usage', function() {
  it('throws if releasing is attempted before event queue is cleared', function() {
    var errorMessage;
    return zurvan
      .interceptTimers()
      .then(function() {
        setTimeout(function() {
          zurvan.releaseTimers().catch(function(err) {
            errorMessage = err.message;
          });
        }, 2000);

        return zurvan.advanceTime(TimeUnit.seconds(4));
      })
      .then(function() {
        assert(errorMessage);
        assert(
          /current time: <<2000>> ms, target time: <<4000>> ms./.test(
            errorMessage
          )
        );
        return zurvan.releaseTimers();
      });
  });

  it('includes additional information if target time is reached', function() {
    var errorMessage;
    return zurvan
      .interceptTimers()
      .then(function() {
        setTimeout(function() {
          zurvan.releaseTimers().catch(function(err) {
            errorMessage = err.message;
          });
        }, 2000);

        return zurvan.advanceTime(TimeUnit.seconds(2));
      })
      .then(function() {
        assert(errorMessage);
        assert(
          /current time: <<2000>> ms, target time: <<2000>> ms./.test(
            errorMessage
          )
        );
        assert(
          /Target time reached, but queue not cleared yet./.test(errorMessage)
        );
        return zurvan.releaseTimers();
      });
  });

  it('fails at double interception', function() {
    return zurvan
      .interceptTimers()
      .then(function() {
        return zurvan.interceptTimers();
      })
      .then(
        function() {
          return zurvan.releaseTimers().then(function() {
            return Promise.reject(
              new Error('Second interception should be rejected')
            );
          });
        },
        function(err) {
          return zurvan.waitForEmptyQueue();
        }
      )
      .then(function() {
        return zurvan.releaseTimers();
      });
  });

  it('fails gracefully and cleans up resources when called with invalid arguments', function() {
    return zurvan
      .interceptTimers({
        ignoreProcessTimers: true,
        ignoreDate: true,
        bluebird: false
      })
      .catch(function() {
        return zurvan.interceptTimers();
      })
      .then(function() {
        return zurvan.advanceTime(TimeUnit.seconds(1));
      })
      .then(function() {
        assert.equal(process.uptime(), 1);
        return zurvan.releaseTimers();
      });
  });
});
