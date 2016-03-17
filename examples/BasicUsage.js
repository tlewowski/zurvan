"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");
var TimeUnit = require("../TimeUnit");

/*
  Example below is the most common way zurvan shall be used - first intercept all timer events,
  then production code sets up some timeouts, then fire them by expiring events from test code,
  in the end clean up after zurvan.
  
  Mocha structure is used to make sure that examples will stay up-to-date with library code
*/

describe('zurvan basic example', function() {
  it('is able to expire', function() {
	
	// function that will be tested - returns a placeholder for value
	// value will be filled in after a timeout
	var producer = function() {
	  var placeholder = {value: undefined};
	  setTimeout(function() {
		  placeholder.value = 1;
	  }, 100);
	  
	  return placeholder;
	};
		
	// timers need to be intercepted before first timeout call, otherwise original functions will be called
	// keep in mind that code above is just a definition using global.setTimeout, so it is not actually called yet
	var holder;
	return zurvan.interceptTimers()  
    .then(function() {
      // time is cleared after interception
      assert(process.uptime() === 0);
    holder = producer();
      
      // make sure that it is empty
      assert(holder.value === undefined);
      
      // forward time to expire the timeout - use zurvan TimeUnit module
      // a number of milliseconds can be used as well, but is less readable
      var timeAdvancer = zurvan.advanceTime(TimeUnit.milliseconds(1000));
      
      // make sure that placeholder is still empty and was not filled in synchronously
      assert(holder.value === undefined);
      return timeAdvancer;
    }).then(function() {
      
      // placeholder was filled before resolving advancing promise
      assert(holder.value === 1);
      
      // time was advanced for a whole second
      assert(process.uptime() === 1)
      
      // perform cleanup
      return zurvan.releaseTimers();
    });	
  });
});