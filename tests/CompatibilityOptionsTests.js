"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");
var FieldOverrider = require("../detail/utils/FieldOverrider");

var assert = require("assert");

describe('zurvan', function() {
  describe('by default (for compatibility)', function() {
    beforeEach(function() {
	    return zurvan.interceptTimers();
    });
    afterEach(function() {
      return zurvan.releaseTimers();
    });
    
    it('denies timers that use eval (they do not work in nodejs)', function(done) {
      try {
      /*jshint -W066 */
	      setTimeout("global.timeoutCalled = true;", 75);
          done(new Error("Shouldn't accept timer with eval call!"));
	    }
	    catch(err) {
	      done();
	    }
    });

    it('executes after 1 millisecond when setting timer without time', function(done) {
      var called;
      setTimeout(function() {called = true;}, {invalid:"type",of:"dueTime"});
      assert.equal(0, process.uptime());
      
      zurvan.expireAllTimeouts().then(function() {
        assert(called === true);
        assert.equal(process.uptime(), 0.001);
      }).then(done, done);
    });
    
    it('executes after 1 millisecond when setting timer with negative time', function(done) {
      var called;
      setTimeout(function() {called = true;}, -100);
      assert.equal(0, process.uptime());
      
      zurvan.expireAllTimeouts().then(function() {
        assert(called === true);
        assert.equal(process.uptime(), 0.001);
      }).then(done, done);
    });
  });
  

  describe('under special configuration (for compatibility)', function() { 
    var timeoutCalledOverrider;
    var intervalCalledOverrider;
    beforeEach(function() {
	    timeoutCalledOverrider = new FieldOverrider(global, "timeoutCalled", false);
      intervalCalledOverrider = new FieldOverrider(global, "intervalCalled", 0);
    });
	
    afterEach(function() {
      timeoutCalledOverrider.restore();
      intervalCalledOverrider.restore();
    });
    
    it('does not intercept process timers (browsers do not have it)', function() {
      return zurvan.interceptTimers({ignoreProcessTimers: true}).then(function() {
        assert(process.uptime() !== 0);
      
      var hrtime = process.hrtime();
      assert(hrtime[0] !== 0 || hrtime[1] !== 0);		
      return zurvan.releaseTimers();
      });
    });
    
    it('does not intercept Date (behavior differs from original Date)', function() {
      return zurvan.interceptTimers({ignoreDate: true}).then(function() {
        assert(new Date().toISOString() !== "1970-01-01T00:00:00.000Z");
      return zurvan.releaseTimers();
      });
    });
	
    it('evaluates timer or interval set with string as first argument (nodejs does not)', function() {
      return zurvan.interceptTimers({acceptEvalTimers: true}).then(function() {        
          /*jshint -W066 */
          setTimeout("global.timeoutCalled = true;", 75);
          
          /*jshint -W066 */
          setInterval("global.intervalCalled = global.intervalCalled || 0; ++global.intervalCalled;", 50);
          return zurvan.advanceTime(100);
        }).then(function() {
          assert(global.intervalCalled === 2);
          assert(global.timeoutCalled === true);
          return zurvan.releaseTimers();
        });
    });
	
	it('denies implicit timeout time (by default set to 1 millisecond) - it is a mighty bad habit, possibly an error', function() {
	  var called;
	  return zurvan.interceptTimers({denyImplicitTimer: true}).then(function() {
	    setTimeout(function(){called = true;}, function(){});
	  }).then(function() {
	    throw new Error("Implicit timer shall be denied and setting timer shall throw");
	  }, function() {
     	return zurvan.releaseTimers();
	  });
	});
	
	it('denies negative timeout time (by default set to 1 millisecond) - it is a mighty bad habit, possibly an error', function() {
	  var called;
	  return zurvan.interceptTimers({denyTimersShorterThan1Ms: true}).then(function() {
        setTimeout(function(){called = true;}, -1);
      }).then(function() {
        throw new Error("Implicit timer shall be denied and setting timer shall throw");
      }, function() {
        return zurvan.releaseTimers();
      });
    });
  });
});