var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan");
var FieldOverrider = require("../detail/FieldOverrider");

var assert = require("assert");

describe('zurvan', function() {
  describe('by default', function() {
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

	it('executes immediately when setting timer without time', function(done) {
	  var called;
	  setTimeout(function() {called = true;}, {invalid:"type",of:"dueTime"});
	  assert.equal(0, process.uptime());
	  
      zurvan.expireAllTimeouts().then(function() {
	    assert(called === true);
      }).then(done, done);
	});
  });
  
  describe('under special configuration', function() { 
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
	
    it('timer or interval set with string will be evaluated', function(done) {
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
	
	it('denies implicit timeout time (0)', function(done) {
	  var called;
	  zurvan.interceptTimers({denyImplicitTimer: true}).then(function() {
	    setTimeout(function(){called = true;}, function(){});
	  }).then(function() {
	    return done(new Error("Implicit timer shall be denied and setting timer shall throw"));
	  }, function() {
     	return zurvan.releaseTimers().then(done, done);
	  });
	});
	
	it('runs at arbitrary time since process startup', function(done) {
	  zurvan.interceptTimers({timeSinceStartup: 4}).then(function() {
	    assert.equal(4, process.uptime());
		assert.deepEqual([4, 0], process.hrtime());
		return zurvan.releaseTimers();
	  }).then(function() {
	    return zurvan.interceptTimers({timeSinceStartup: [100, 132587951]});
	  }).then(function() {
	    assert(Math.abs(100.132587951 - process.uptime()) < 1e-12);
		assert.deepEqual([100, 132587951], process.hrtime());
		return zurvan.releaseTimers();
	  }).then(function() {
	    return zurvan.interceptTimers({timeSinceStartup: TimeUnit.microseconds(12e8 + 100)});
	  }).then(function() {
	    assert(Math.abs(1200.0001 - process.uptime()) < 1e-12);
		assert.deepEqual([1200, 100000], process.hrtime());
		return zurvan.releaseTimers();
	  }).then(function() {
	    return zurvan.interceptTimers({timeSinceStartup: [0, 1e10]});
	  }).then(function() {
	    assert.equal(10, process.uptime());
		assert.deepEqual([10, 0], process.hrtime());
		return zurvan.releaseTimers();
	  }).then(done, done);
	});
	
	it('runs at any required system time', function(done) {
	  zurvan.interceptTimers({systemTime: Date.UTC(2015, 0, 5)}).then(function() {
	    var nowDate = new Date();
		assert.equal(nowDate.toISOString(), "2015-01-05T00:00:00.000Z");
		assert.equal(0, process.uptime());
		return zurvan.releaseTimers();
	  }).then(function() {
	    return zurvan.interceptTimers({systemTime: new Date(Date.UTC(2010, 5, 6))});
	  }).then(function() {
  	    var nowDate = new Date();
	    assert.equal(nowDate.toISOString(), "2010-06-06T00:00:00.000Z");
		assert.equal(0, process.uptime());
		return zurvan.releaseTimers();
	  }).then(function() {
	    return zurvan.interceptTimers({systemTime: new Date(Date.UTC(1999, 9, 8, 15)).toString(),
		  timeSinceStartup: TimeUnit.seconds(45)});
	  }).then(function() {
	    var nowDate = new Date();
        assert(nowDate.toISOString(), "1999-10-08T15:00:00.000Z");
		assert.equal(45, process.uptime());
		return zurvan.releaseTimers();
	  }).then(done, done);
	});
  });
});