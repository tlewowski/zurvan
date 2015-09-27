var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");
var FieldOverrider = require("../detail/FieldOverrider");

var assert = require("assert");

describe('zurvan', function() {
  describe('by default (for compatibility)', function() {
    beforeEach(function(done) {
	  zurvan.interceptTimers().then(done, done);
	});
	afterEach(function(done) {
	  zurvan.releaseTimers().then(done, done);
	});
	
    it('denies timers that use eval (they do not work in nodejs)', function(done) {
      try {	  
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
	
	it('does not intercept process timers (browsers do not have it)', function(done) {
	  zurvan.interceptTimers({ignoreProcessTimers: true}).then(function() {
	    assert(process.uptime() !== 0);
		
		var hrtime = process.hrtime();
		assert(hrtime[0] !== 0 || hrtime[1] !== 0);		
		return zurvan.releaseTimers();
	  }).then(done, done);
	});
	
    it('evaluates timer or interval set with string as first argument (nodejs does not)', function(done) {
      zurvan.interceptTimers({acceptEvalTimers: true}).then(function() {
	    setTimeout("global.timeoutCalled = true;", 75);
	    setInterval("global.intervalCalled = global.intervalCalled || 0; ++global.intervalCalled;", 50);
        return zurvan.advanceTime(100);
	  }).then(function() {
	      assert(global.intervalCalled === 2);
	      assert(global.timeoutCalled === true);
    	  return zurvan.releaseTimers();
	  }).then(done, done);
	});
	
	it('denies implicit timeout time (1 millisecond) - it shall not be used, as is not safe at all', function(done) {
	  var called;
	  zurvan.interceptTimers({denyImplicitTimer: true}).then(function() {
	    setTimeout(function(){called = true;}, function(){});
	  }).then(function() {
	    return done(new Error("Implicit timer shall be denied and setting timer shall throw"));
	  }, function() {
     	return zurvan.releaseTimers().then(done, done);
	  });
	});
  });
});