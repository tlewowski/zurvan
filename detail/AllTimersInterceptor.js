"use strict";
var TimerInterceptor = require("./TimerInterceptor");
var SequenceGenerator = require("./utils/SequenceGenerator");
var TimerTypes = require("./timers/TimerTypes");

var FieldOverrider = require("./utils/FieldOverrider");

function AllTimersInterceptor(timeServer) {
  this._sequenceGenerator = new SequenceGenerator();
  this._timeoutInterceptor = new TimerInterceptor(timeServer, TimerTypes.timeout);
  this._intervalInterceptor = new TimerInterceptor(timeServer, TimerTypes.interval);
}

AllTimersInterceptor.prototype.intercept = function(config) {
  this._timeoutInterceptor.intercept(config, this._sequenceGenerator);
  this._intervalInterceptor.intercept(config, this._sequenceGenerator);
  this._fakeNodeDedicatedTimers = config.fakeNodeDedicatedTimers;
  
  if(this._fakeNodeDedicatedTimers)   {
    var nodeTimers = require('timers');

    this._nodeSetTimeoutOverrider = new FieldOverrider(nodeTimers, 'setTimeout', setTimeout.bind(global));
    this._nodeClearTimeoutOverrider = new FieldOverrider(nodeTimers, 'clearTimeout', clearTimeout.bind(global));
    this._nodeSetIntervalOverrider = new FieldOverrider(nodeTimers, 'setInterval', setInterval.bind(global));
    this._nodeClearIntervalOverrider = new FieldOverrider(nodeTimers, 'clearInterval', clearInterval.bind(global));	  
  }
};

AllTimersInterceptor.prototype.release = function() {
  var timers = {};
  timers.timeouts = this._timeoutInterceptor.release();
  timers.intervals = this._intervalInterceptor.release();
  
  if(this._fakeNodeDedicatedTimers) {
    this._nodeSetTimeoutOverrider.restore();
    this._nodeClearTimeoutOverrider.restore();
    this._nodeSetIntervalOverrider.restore();
    this._nodeClearIntervalOverrider.restore();	  
  }
  
  return timers;
};

AllTimersInterceptor.prototype.timerOrderingResolution = function(timeout, interval) {
  if(timeout.sequenceNumber < interval.sequenceNumber) {
    return timeout;
  }
  
  return interval;
};

AllTimersInterceptor.prototype.lastTimeout = function() {
  return this._timeoutInterceptor.lastTimer();
};

AllTimersInterceptor.prototype.nextTimer = function() {
  var nextTimeout = this._timeoutInterceptor.nextTimer();
  var nextInterval = this._intervalInterceptor.nextTimer();
  
  if(!nextTimeout) {
    return nextInterval;
  }
  
  if(!nextInterval) {
	return nextTimeout;	  
  }
  
  if(nextTimeout.dueTime.isShorterThan(nextInterval.dueTime)) {
	return nextTimeout;
  }
  
  if(nextTimeout.dueTime.isEqualTo(nextInterval.dueTime)) {
	return this.timerOrderingResolution(nextTimeout, nextInterval);
  }
  
  return nextInterval;
};

module.exports = AllTimersInterceptor;