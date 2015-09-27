var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan").withDefaultConfiguration({systemTime: "2015-09-01T00:00:00.000Z"});

var assert = require("assert");

describe('second zurvan', function() {
  it('shall reject intercepting timers if they are already intercepted', function(done) {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
	zurvan.interceptTimers().then(function() {
	  return zurvan2.interceptTimers();
	}).then(function() {
	  done(new Error("Zurvan should not be able to intercept timers that are already intercepted"));
	}, function() {
	  return zurvan.releaseTimers().then(done, done);
	});
  });
  
  it('inherits configuration of previous one and only overrides own fields', function(done) {
    var zurvan2 = zurvan.withDefaultConfiguration({timeSinceStartup: 60});
	zurvan2.interceptTimers().then(function() {
	  assert.equal(process.uptime(), 60);
	  assert.equal(new Date().toISOString(), "2015-09-01T00:00:00.000Z");
	  return zurvan2.advanceTime(TimeUnit.minutes(1));
	}).then(function() {
	  assert.equal(process.uptime(), 120);
	  assert.equal(new Date().toISOString(), "2015-09-01T00:01:00.000Z");
	  return zurvan2.releaseTimers();
	}).then(done, done);
  });
  
  it('cannot forward time if timers were intercepted by the other instance', function(done) {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
	zurvan2.interceptTimers().then(function() {
	  return zurvan2.releaseTimers();
	}).then(function() {
	  return zurvan.interceptTimers();
	}).then(function() {
	  return zurvan2.advanceTime(TimeUnit.seconds(1));
	}).then(function(err) {
	  done(Error("Zurvan should not be able to advance time before intercepting it"));
	}, function(err) {
	  assert.equal(process.uptime(), 0);
	  zurvan.releaseTimers().then(done, done);
	});
	
  });
});