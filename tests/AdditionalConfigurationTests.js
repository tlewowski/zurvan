var assert = require("assert");
var Zurvan = require("../Zurvan");
var FieldOverrider = require("../detail/FieldOverrider")

describe('Zurvan', function() {
  it('by default denies timers that use eval (they do not work in nodejs)', function(done) {
    Zurvan.stopTime().then(function() {
	  setTimeout("global.timeoutCalled = true", 75);
	}).then(function() {
	  done(new Error("Shouldn't accept timer with eval call!"));
	}, function() {
	  Zurvan.startTime().then(done, done);
	});
  });

  describe('under special configuration', function() { 
    var timeoutCalledOverrider;
    var intervalCalledOverrider;
    before(function() {
	  timeoutCalledOverrider = new FieldOverrider(global, "timeoutCalled", false);
      intervalCalledOverrider = new FieldOverrider(global, "intervalCalled", 0);
    });
	
	after(function() {
	  timeoutCalledOverrider.restore();
	  intervalCalledOverrider.restore();
	});
	
    it('timer or interval set with string will be evaluated if configured to', function(done) {
      Zurvan.stopTime({acceptEvalTimers: true}).then(function() {
	    setTimeout("global.timeoutCalled = true", 75);
	    setInterval("global.intervalCalled = global.intervalCalled || 0; ++global.intervalCalled;", 50);
        return Zurvan.advanceTime(100);
	  }).then(function() {
	      assert(global.intervalCalled === 2);
	      assert(global.timeoutCalled === true);
    	  return Zurvan.startTime();
	  }).then(done, done);
	});
  });
});