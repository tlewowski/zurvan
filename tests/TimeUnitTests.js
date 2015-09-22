var TimeUnit = require("../TimeUnit");
var assert = require("assert");

describe('TimeUnit', function() {
  it('can be converted to any time interval', function(done) {
	var second = TimeUnit.seconds(1);

	assert(Math.abs(second.toNanoseconds() - 1e9) < 1e-3);
	assert(Math.abs(second.toMicroseconds() - 1e6) < 1e-6);
	assert(Math.abs(second.toMilliseconds() - 1e3) < 1e-9);
	assert(Math.abs(second.toSeconds() - 1) < 1e-12);

	var week = TimeUnit.weeks(1);
	assert(Math.abs(week.toWeeks() - 1) < 1e-12);
	assert(Math.abs(week.toDays() - 7) < 1e-12);
	assert(Math.abs(week.toHours() - 7*24) < 1e-10);
	done();	  
  });
  
  it('conversions are stable', function(done) {
    var hour = TimeUnit.hours(10);
	var nanoseconds = TimeUnit.nanoseconds(hour.toNanoseconds());
	var days = TimeUnit.days(nanoseconds.toDays());
	var minutes = TimeUnit.minutes(hour.toMinutes());
	var microseconds = TimeUnit.microseconds(minutes.toMicroseconds());
	var milliseconds = TimeUnit.milliseconds(microseconds.toMilliseconds());
	
	assert(Math.abs(hour.toMilliseconds() - nanoseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(hour.toMilliseconds() - days.toMilliseconds()) < 1e-12);
	assert(Math.abs(hour.toMilliseconds() - minutes.toMilliseconds()) < 1e-12);
	assert(Math.abs(hour.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(hour.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(nanoseconds.toMilliseconds() - days.toMilliseconds()) < 1e-12);
	assert(Math.abs(nanoseconds.toMilliseconds() - minutes.toMilliseconds()) < 1e-12);
	assert(Math.abs(nanoseconds.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(nanoseconds.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(days.toMilliseconds() - minutes.toMilliseconds()) < 1e-12);
	assert(Math.abs(days.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(days.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(minutes.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(minutes.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(milliseconds.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12);
	assert(Math.abs(microseconds.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12);
	
	done();
  });
  
  describe('cannot be added to', function() {
    function addFailureScenario(toAdd) {
	  return function(done) {
        var day = TimeUnit.days(1);
	    try {
	      day.add(toAdd);
          done(new Error("Cannot add not TimeUnit to TimeUnit"));
	    }
	    catch(err) {
	      done();
	    }	 	
	  };
	}
  
    it('cannot be added to number', addFailureScenario(10));  
    it('cannot be added to string', addFailureScenario("10:00"));
    it('cannot be added to object', addFailureScenario({value: 100, coefficient: 1}));
  });
});

describe('Two TimeUnits', function() {
  it('can be added, which mutates one of them', function(done) {
    var hour = TimeUnit.hours(1);
	var quarter = TimeUnit.minutes(15);
	
	assert.equal(hour.add(quarter).toMinutes(), 75);
	assert.equal(hour.toMinutes(), 75);
	
	var second = TimeUnit.nanoseconds(1e9);
	assert.equal(second.add(quarter).toSeconds(), 901);
	assert.equal(second.toSeconds(), 901);
	
	done();
  });
  
  it('can be used to calculate time after both, without mutating arguments', function(done) {
    var hour = TimeUnit.hours(1);
	var quarter = TimeUnit.nanoseconds(TimeUnit.minutes(15).toNanoseconds());
	
	assert.equal(hour.after(quarter).toMinutes(), 75);
	assert.equal(hour.toMinutes(), 60);
	
	done();
  });
  
  it('can be used to set one another value', function(done) {
    var tenSeconds = TimeUnit.microseconds(TimeUnit.seconds(10).toMicroseconds());
	var week = TimeUnit.days(7);
	
	week.setTo(tenSeconds);
	assert.equal(week.toMilliseconds(), tenSeconds.toMilliseconds());
	
	done();
  });
  
  it('can be used to calculate time difference, mutatning one argument', function(done) {
    var tenSeconds = TimeUnit.seconds(10);
	var minute = TimeUnit.minutes(1);
	
	// behavior is a little weird - it's not meant for this use case
	var diff1 = minute.minus(tenSeconds);
	var diff2 = tenSeconds.minus(minute);
	
	assert.equal(diff1.toSeconds(), 50);
	assert.equal(minute.toSeconds(), 50);
	assert.equal(diff2.toSeconds(), -40);
	assert.equal(tenSeconds.toSeconds(), -40);
	
	done();
  });
  
  it('can be used to calculate time before, without mutating any argument', function(done) {
    var hour = TimeUnit.hours(1);
	var quarter = TimeUnit.seconds(TimeUnit.minutes(15).toSeconds());
	
	assert.equal(hour.before(quarter).toMinutes(), 45);
	assert.equal(hour.toMinutes(), 60);
	
	done();
  });

  it('can be used to calculate time before but may have floating-point errors in case of decimal places', function(done) {
    var hour = TimeUnit.hours(1);
	var quarter = TimeUnit.nanoseconds(TimeUnit.minutes(15).toNanoseconds());
	
	assert(Math.abs(hour.before(quarter).toMinutes() - 45) < 1e-12);
	assert.equal(hour.toMinutes(), 60);
	
	done();
  });
  
});