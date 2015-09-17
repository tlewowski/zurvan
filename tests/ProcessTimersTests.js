var assert = require("assert");
var Thoth = require("../Thoth");

describe('Thoth', function() {
  describe('after stopping time', function() {
    beforeEach(function(done) {
	  Thoth.stopTime();
	  done();
	});
	
	afterEach(function(done) {
	  Thoth.startTime();
	  done();
	});

    it('resets process.uptime and process.hrtime', function(done) {
	  assert.equal(0, process.uptime());
	  assert.deepEqual([0,0], process.hrtime());
	  done();
	});
	
	it('advances all times together, asynchronously', function(done) {
	  setTimeout(function() {
	    assert.equal(1.523, process.uptime());
		assert.deepEqual([1, 523e6], process.hrtime());
		done();
	  }, 1523);
	  
	  Thoth.advanceTime(1600);
	});
	
	it('can calculate diff in process.hrtime', function(done) {
	  var previousHrtime;
	  setTimeout(function() {
	    previousHrtime = process.hrtime();
		assert.deepEqual([1, 523e6], previousHrtime);
		
		setTimeout(function() {
		  var hrtimeDiff = process.hrtime(previousHrtime);
		  assert.deepEqual([10, 244e6], process.hrtime());
		  assert.deepEqual([8, 721e6], hrtimeDiff);
		  done();
		}, 8721);
	  }, 1523);
	  
	  Thoth.advanceTime(11000);
	});

  });
});