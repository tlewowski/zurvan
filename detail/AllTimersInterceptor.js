"use strict";
var TimerInterceptor = require("./TimerInterceptor");
var SequenceGenerator = require("./SequenceGenerator");
var TimerTypes = require("./timers/TimerTypes");

function AllTimersInterceptor(timeServer) {
  this._sequenceGenerator = new SequenceGenerator();
  this._timeoutInterceptor = new TimerInterceptor(timeServer, TimerTypes.timeout);
  this._intervalInterceptor = new TimerInterceptor(timeServer, TimerTypes.interval);
}

AllTimersInterceptor.prototype.intercept = function(config) {
  this._timeoutInterceptor.intercept(config, this._sequenceGenerator);
  this._intervalInterceptor.intercept(config, this._sequenceGenerator);
};

AllTimersInterceptor.prototype.release = function() {
  var timers = {};
  timers.timeouts = this._timeoutInterceptor.release();
  timers.intervals = this._intervalInterceptor.release();
  this._sequenceGenerator.clear();
  
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