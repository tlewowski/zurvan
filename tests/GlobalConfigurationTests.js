var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan").withDefaultConfiguration({systemTime: "2015-09-01T00:00:00.000Z"});

var assert = require("assert");

describe('zurvan with globally configured time to 2015-09-01T00:00:00.000Z', function() {
  it('without additional configuration returns Date() = 2015-09-01T00:00:00.000Z', function(done) {
    zurvan.interceptTimers().then(function() {
      assert.equal(new Date().toISOString(), "2015-09-01T00:00:00.000Z");
	  assert.equal(process.uptime(), 0);
	  return zurvan.advanceTime(TimeUnit.days(3));
	}).then(function() {
	  assert.equal(new Date().toISOString(), "2015-09-04T00:00:00.000Z");
	  assert.equal(process.uptime(), 3*24*60*60);
	  return zurvan.releaseTimers();
	}).then(done, done);
  });
  
  it('with additional local configuration global settings are overridden', function(done) {
    zurvan.interceptTimers({systemTime: "2010-01-05T05:55:11.158Z"}).then(function() {
	  assert.equal(new Date().toISOString(), "2010-01-05T05:55:11.158Z");
	  assert.equal(process.uptime(), 0);
	  return zurvan.advanceTime(TimeUnit.hours(4));
	}).then(function() {
	  assert.equal(new Date().toISOString(), "2010-01-05T09:55:11.158Z");
	  assert.equal(process.uptime(), 4*60*60);
	  return zurvan.releaseTimers();
	}).then(done, done);
  });
});