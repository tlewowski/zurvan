var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");
var FieldOverrider = require("../detail/FieldOverrider");

var assert = require("assert");

describe('TimeUnit', function() {
  it('can be compared in standard ways', function(done) {
    var hour = TimeUnit.hours(1);
	var threeQuarters = TimeUnit.minutes(45);
	
	assert(hour.isLongerThan(threeQuarters));
	assert(!hour.isShorterThan(threeQuarters));
	assert(!hour.isEqualTo(threeQuarters));
	assert(threeQuarters.isShorterThan(hour));
	assert(!threeQuarters.isLongerThan(hour));
	assert(!threeQuarters.isEqualTo(hour));
	
    done();
  });
  
  it('can be compared even if different units were used at first', function(done) {
    var month = TimeUnit.weeks(4);
	var monthInNanoseconds = TimeUnit.nanoseconds(1e9 * 60 * 60 * 24 * 7 * 4);
	
	assert(!month.isLongerThan(monthInNanoseconds));
	assert(!month.isShorterThan(monthInNanoseconds));
	assert(month.isEqualTo(monthInNanoseconds));
	
	assert(!monthInNanoseconds.isLongerThan(month));
	assert(!monthInNanoseconds.isShorterThan(month));
	assert(monthInNanoseconds.isEqualTo(month));
	
	done();	
  });
  
  it('can be reliably compared even after calculations', function(done) {
    var hour = TimeUnit.hours(1);
	var quarter = TimeUnit.minutes(15);
	var hourInQuarters = quarter.extended(quarter).extended(quarter).extended(quarter);
	assert(hour.isEqualTo(quarter.extended(quarter).extended(quarter).extended(quarter)));

	var second = TimeUnit.seconds(1);
	var quarterInSeconds = second.copy();
	
	var i;
	for(i = 0; i < 15 * 60; ++i) {
	  quarterInSeconds.add(second);
	}
	
	assert(quarterInSeconds.isLongerThan(quarter));
	quarterInSeconds.subtract(TimeUnit.nanoseconds(1e9 - 1));
	assert(quarterInSeconds.isLongerThan(quarter));
	quarterInSeconds.subtract(TimeUnit.nanoseconds(1));
	assert(quarterInSeconds.isEqualTo(quarter));
	quarterInSeconds.subtract(TimeUnit.nanoseconds(1));
	assert(quarterInSeconds.isShorterThan(quarter));
	
    done();
  });
  
  it('is still reliable after many calculations', function(done) {
    var month = TimeUnit.weeks(4);
	var day = TimeUnit.days(1);
	var minute = TimeUnit.minutes(1);
	var second = TimeUnit.seconds(1);
	var nanosecond = TimeUnit.nanoseconds(1);
	
	var toIncrease = nanosecond.copy();
	var toDecrease = month.copy();
	
	var i;
	for(i = 0; i < 27; ++i) {
	  toDecrease.subtract(day);
	}
	
	for(i = 0; i < 3600; ++i) {
	  toIncrease.add(second);
	}
	
	for(i = 0; i < 12*60; ++i) {
	  toDecrease.subtract(minute);
	}
	
	for(i = 0; i < 11*60; ++i) {
      toIncrease.add(minute);
	}
	
	assert(toIncrease.isLongerThan(toDecrease));
	assert(toDecrease.isShorterThan(toIncrease));
	toDecrease.add(nanosecond);
	assert(toIncrease.isEqualTo(toDecrease));
	assert(toDecrease.isEqualTo(toIncrease));
	toDecrease.add(nanosecond);
	assert(toIncrease.isShorterThan(toDecrease));
	assert(toDecrease.isLongerThan(toIncrease));
  
    done();
  });
});