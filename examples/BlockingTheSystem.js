"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");
var TimeUnit = require("../TimeUnit");

/*
  Example below is pretty rare - it should be used to simulate high load - for example a long, continous computation.
  During this time no timer callbacks are executed, but all expired timers are moved to the event queue.
  This is done regardless of their due time, so only basic ordering is preserved.
  Called functions will push numbers to an array.
  
  Mocha structure is used to make sure that examples will stay up-to-date with library code
*/

describe('zurvan system block example', function() {
  it('all events are on the queue', function() {
	
	// timers need to be intercepted before first timeout call, otherwise original functions will be called
	var calls = [];
	return zurvan.interceptTimers()
    .then(function() {
      // time is cleared after interception
      assert(process.uptime() === 0);
    
      // schedule some pushes to array
      setTimeout(function() {
        calls.push(3);
      }, 2000);
      
      setTimeout(function() {
        calls.push(2);
        setTimeout(function() {
          calls.push(5);
        }, 1000)
      }, 1000);
      
      setInterval(function() {
        calls.push(1);
      }, 500);
      
      setTimeout(function() {
        calls.push(4);
      }, 5100);
      
      zurvan.blockSystem(TimeUnit.seconds(5));
      
      // time was already forwarded
      assert(process.uptime() === 5);
      
      // but no calls were executed yet - they were only scheduled
      assert.deepEqual(calls, []);
      
      // let's wait for the queue to expire
      return zurvan.waitForEmptyQueue();
    }).then(function() {
      
      // no time has passed
      assert(process.uptime() === 5);
      
      // calls were executed - but only the first level of timeouts and first intervals
      // they were rescheduled, so we'll forward time to them later on
      assert.deepEqual(calls, [1, 2, 3]);
      
      // now let's forward time for a second more, to check that other calls will be executed as well
      return zurvan.advanceTime(TimeUnit.seconds(1));
    }).then(function() {
      
      // time forwarded exactly by one second
      assert.deepEqual(process.hrtime(), [6, 0]);
      
      // all other calls executed - interval twice, as advanceTime expires one-by-one
      assert.deepEqual(calls, [1, 2, 3, 4, 1, 5, 1]);
      
      // perform cleanup
      return zurvan.releaseTimers();
    });	
  });
});