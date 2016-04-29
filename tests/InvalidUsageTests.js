"use strict";
var assert = require("assert");
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");


describe('during wrong usage', function() {
  it('throws if releasing is attempted before event queue is cleared', function() {
    var errorMessage;
    return zurvan.interceptTimers()
      .then(function() {
        setTimeout(function() {
        zurvan.releaseTimers()
          .catch(function(err) {
            errorMessage = err.message;
          });
        }, 2000);
    
      return zurvan.advanceTime(TimeUnit.seconds(4));
    }).then(function() {
      assert(errorMessage);
      assert(/current time: <<2000>> ms, target time: <<4000>> ms./.test(errorMessage));
      return zurvan.releaseTimers();
    });
  });
  
  it('includes additional information if target time is reached', function() {
    var errorMessage;
    return zurvan.interceptTimers()
      .then(function() {
        setTimeout(function() {
          zurvan.releaseTimers()
            .catch(function(err) {
              errorMessage = err.message;
            });
        }, 2000);
    
        return zurvan.advanceTime(TimeUnit.seconds(2));
      }).then(function() {
        assert(errorMessage);
        assert(/current time: <<2000>> ms, target time: <<2000>> ms./.test(errorMessage));
        assert(/Target time reached, but queue not cleared yet./.test(errorMessage));
      return zurvan.releaseTimers();
    });
  });
});