var TimeUnit = require("../TimeUnit");
var TypeUtils = require("../detail/TypeUtils");
var Zurvan = require("../Zurvan");

var assert = require("assert");

describe('Zurvan', function() {
  describe('when faking Date', function() {
    beforeEach(function(done) {
      Zurvan.stopTime().then(done, done);
    });
    afterEach(function(done) {
	  Zurvan.startTime().then(done, done);
    });
	
    it('intercepts Date and by default resets timestamp to 0', function(done) {
      var now = Date.now();
      var nowDate = new Date();
	
	  assert.equal(now, 0);
	  assert.equal(nowDate.toISOString(), "1970-01-01T00:00:00.000Z");
	  done();
    });
  
    it('behaves the same as original in all cases that do not require referring to current time', function(done) {
      var orig = new Date(0);
	  var now = new Date();
	  
	  assert.equal(orig.toISOString(), now.toISOString());
      done();
    });
	
	it('adjusts to how far time is moved', function(done) {
	  Zurvan.advanceTime(TimeUnit.days(10)).then(function() {
	    var nowDate = new Date();
	    assert.equal(nowDate.toISOString(), "1970-01-11T00:00:00.000Z");
		return Zurvan.advanceTime(TimeUnit.nanoseconds(17e9 + 673e6));
	  }).then(function() {
	    var nowDate = new Date();
		assert.equal(nowDate.toISOString(), "1970-01-11T00:00:17.673Z");
		return Zurvan.advanceTime(TimeUnit.minutes(86));
	  }).then(function() {
	    var nowDate = new Date();
		var origFromString = new Date(Date.UTC(2020, 3, 5, 2, 5, 6, 78));
		
		assert.equal(nowDate.toISOString(), "1970-01-11T01:26:17.673Z");
		assert.equal(origFromString.toISOString(), "2020-04-05T02:05:06.078Z");
		
	    var origFromWhole = new Date(1995, 4, 1, 9, 12, 5, 854);
		assert.equal(origFromWhole.getFullYear(), 1995);
		assert.equal(origFromWhole.getMonth(), 4);
		assert.equal(origFromWhole.getDate(), 1);
		assert.equal(origFromWhole.getHours(), 9);
		assert.equal(origFromWhole.getMinutes(), 12);
		assert.equal(origFromWhole.getSeconds(), 5);
		assert.equal(origFromWhole.getMilliseconds(), 854);
	  }).then(function() {
	  }).then(done, done);
	});
	
	it('allows Date to be called as function as in original', function(done) {
	  var date = Date();
	  assert(TypeUtils.isString(date));
	  
	  var dateObj = new Date(date);
	  assert(TypeUtils.isObject(dateObj));	  
	  done();
	});
	
	it('makes it possible to set system timer to arbitrary date', function(done) {
	  Zurvan.setSystemTimeTo(new Date(Date.UTC(2010, 5, 6, 2, 1, 3)));
      var nowDate = new Date();
	  
	  assert.equal(nowDate.toISOString(), "2010-06-06T02:01:03.000Z");
	  done();	
	});

	it('makes it possible to set system timer to arbitrary date from parseable string', function(done) {
	  Zurvan.setSystemTimeTo(new Date(Date.UTC(2005, 5, 6, 2, 1, 3)).toISOString());
      var nowDate = new Date();
	  
	  assert.equal(nowDate.toISOString(), "2005-06-06T02:01:03.000Z");
	  done();	
	});
	
	it('makes it possible to set system timer to arbitrary date from timestamp', function(done) {
	  Zurvan.setSystemTimeTo(Date.UTC(2005, 5, 13, 2, 1, 3));
      var nowDate = new Date();
	  
	  assert.equal(nowDate.toISOString(), "2005-06-13T02:01:03.000Z");
	  done();	
	});
	
	it('properly synchronizes system timer even if changed after startup', function(done) {
	  Zurvan.advanceTime(TimeUnit.days(10)).then(function() {
	    Zurvan.setSystemTimeTo(Date.UTC(1990, 1, 1));
		var nowDate = new Date();
		assert.equal(nowDate.toISOString(), "1990-02-01T00:00:00.000Z");
		
		setTimeout(function() {
		  var nowDate = new Date();
		  assert.equal(nowDate.toISOString(), "1990-02-01T01:00:00.000Z");
		}, TimeUnit.hours(1).toMilliseconds());
		
		return Zurvan.advanceTime(TimeUnit.days(10));
	  }).then(function() {
	    var nowDate = new Date();
		assert.equal(nowDate.toISOString(), "1990-02-11T00:00:00.000Z");
	  }).then(done, done);
	});
	
  });
});