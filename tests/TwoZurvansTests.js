"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan").withDefaultConfiguration({systemTime: "2015-09-01T00:00:00.000Z"});

var assert = require("assert");
var Promise = Promise || require('bluebird');

describe('second zurvan', function() {
  it('shall reject intercepting timers if they are already intercepted', function() {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
    return zurvan.interceptTimers().then(function() {
      return zurvan2.interceptTimers();
    }).then(function() {
      throw new Error("Zurvan should not be able to intercept timers that are already intercepted");
    }, function(err) {
      assert(err.message.match(/Cannot intercept timers that are already intercepted/));
    }).then(function() {
        return zurvan.releaseTimers();
    });
  });
  
  it('inherits configuration of previous one and only overrides own fields', function() {
    var zurvan2 = zurvan.withDefaultConfiguration({timeSinceStartup: 60});
    return zurvan2.interceptTimers().then(function() {
      assert.equal(process.uptime(), 60);
      assert.equal(new Date().toISOString(), "2015-09-01T00:00:00.000Z");
      return zurvan2.advanceTime(TimeUnit.minutes(1));
    }).then(function() {
      assert.equal(process.uptime(), 120);
      assert.equal(new Date().toISOString(), "2015-09-01T00:01:00.000Z");
      return zurvan2.releaseTimers();
    });
  });
  
  it('cannot forward time if timers were intercepted by the other instance', function() {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
    return zurvan2.interceptTimers().then(function() {
      return zurvan2.releaseTimers();
    }).then(function() {
      return zurvan.interceptTimers();
    }).then(function() {
      return zurvan2.advanceTime(TimeUnit.seconds(1));
    }).then(function(err) {
      throw new Error("Zurvan should not be able to advance time before intercepting it");
    }, function(err) {
      assert.equal(process.uptime(), 0);
      assert(err.message.match(/Cannot advance time if timers are not intercepted by this instance/));
      assert.throws(zurvan2.blockSystem.bind(zurvan2, TimeUnit.minutes(1)));
    }).then(function() {
      return zurvan.releaseTimers();
    });
  });
  
  it('shall not release timers that were not intercepted', function(done) {
    zurvan.releaseTimers()
      .then(function() {
        done(new Error("Should not release timers that were not intercepted"));
      }, function() {
        done();
      });
  });
  
  it('shall not release timers that were intercepted by second instance', function(done) {
    var zurvan2 = zurvan.withDefaultConfiguration({timeSinceStartup: 60});
    zurvan.interceptTimers()
      .then(function() {
        return zurvan2.releaseTimers();
      }).then(function() {
        done(new Error("Should not release timers that were not intercepted"));
      }, function() {
        return zurvan.releaseTimers()
          .then(function(){
            done();
        });
      });
  });
	
  it('after configuration reset only new instance has default configuration (old configuration is not modified)', function() {
	var zurvanForwardedStart = zurvan.withDefaultConfiguration({timeSinceStartup: 100});
	var zurvanDefault = zurvanForwardedStart.withDefaultConfiguration();

	return zurvanForwardedStart.interceptTimers()
	  .then(function() {
		assert.equal(100, process.uptime());
		return zurvanForwardedStart.releaseTimers();
	  })
	  .then(function() {
		  return zurvanDefault.interceptTimers();
	  })
	  .then(function() {
		  assert.equal(0, process.uptime());
		  return zurvanDefault.releaseTimers();
	  })
	  .then(function() {
		  return zurvanForwardedStart.interceptTimers();
	  })
      .then(function() {
		assert.equal(100, process.uptime());
   	    return zurvanDefault.releaseTimers();
	  })
      .then(function() {
        return zurvanForwardedStart.releaseTimers()
  	      .then(Promise.reject);
	  }, function(err) {
	    return zurvanForwardedStart.releaseTimers();			  
	  });
  });
});