"use strict";
var TimeUnit = require("../TimeUnit");
var zurvan = require("../zurvan").withDefaultConfiguration({systemTime: "2015-09-01T00:00:00.000Z"});

var assert = require("assert");

describe('second zurvan', function() {
  it('shall reject intercepting timers if they are already intercepted', function() {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
	return zurvan.interceptTimers().then(function() {
	  return zurvan2.interceptTimers();
	}).then(function() {
	  throw new Error("Zurvan should not be able to intercept timers that are already intercepted");
	}, function() {
	  return zurvan.releaseTimers();
	});
  });
  
  it('inherits configuration of previous one and only overrides own fields', function() {
    var zurvan2 = zurvan.withDefaultConfiguration({timeSinceStartup: 60});
	return zurvan2.interceptTimers().then(function() {
	  assert.equal(process.uptime(), 60);
	  assert.equal(new Date().toISOString(), "2015-09-01T00:00:00.000Z");
	  return zurvan2.advanceTime(TimeUnit.minutes(1));
	}).then(function() {
	  assert.equal(process.uptime(), 120);
	  assert.equal(new Date().toISOString(), "2015-09-01T00:01:00.000Z");
	  return zurvan2.releaseTimers();
	});
  });
  
  it('cannot forward time if timers were intercepted by the other instance', function() {
    var zurvan2 = zurvan.withDefaultConfiguration({});
	
	return zurvan2.interceptTimers().then(function() {
	  return zurvan2.releaseTimers();
	}).then(function() {
	  return zurvan.interceptTimers();
	}).then(function() {
	  return zurvan2.advanceTime(TimeUnit.seconds(1));
	}).then(function(err) {
	  throw new Error("Zurvan should not be able to advance time before intercepting it");
	}, function(err) {
	  assert.equal(process.uptime(), 0);
	  assert.throws(zurvan2.blockSystem.bind(zurvan2, TimeUnit.minutes(1)));
	  return zurvan.releaseTimers();
	});
  });
});