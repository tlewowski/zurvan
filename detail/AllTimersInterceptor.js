"use strict";
var TimerInterceptor = require("./TimerInterceptor");
var SequenceGenerator = require("./utils/SequenceGenerator");
var TimerTypes = require("./timers/TimerTypes");
var TimerExpirationPolicies = require("./TimerExpirationPolicies");

var FieldOverrider = require("./utils/FieldOverrider");

function AllTimersInterceptor(timeServer) {
  this._sequenceGenerator = new SequenceGenerator();
  this._timeoutInterceptor = new TimerInterceptor(timeServer, TimerTypes.timeout);
  this._intervalInterceptor = new TimerInterceptor(timeServer, TimerTypes.interval);
}

AllTimersInterceptor.prototype.intercept = function(config) {
  this._timeoutInterceptor.intercept(config, this._sequenceGenerator);
  this._intervalInterceptor.intercept(config, this._sequenceGenerator);
  
  this._timerExpirationPolicy = TimerExpirationPolicies[config.timerExpirationPolicy];
};

AllTimersInterceptor.prototype.release = function() {
  var timers = {};
  timers.timeouts = this._timeoutInterceptor.release();
  timers.intervals = this._intervalInterceptor.release();
    
  return timers;
};

AllTimersInterceptor.prototype.lastTimeout = function() {
  return this._timeoutInterceptor.lastTimer();
};

AllTimersInterceptor.prototype._nextTimersGroup = function(nextTimeouts, nextIntervals) {
  if(!nextTimeouts[0]) {
    return nextIntervals;
  }
  
  if(!nextIntervals[0]) {
	return nextTimeouts;
  }
  
  if(nextTimeouts[0].dueTime.isShorterThan(nextIntervals[0].dueTime)) {
	  return nextTimeouts;
  }
  
  if(nextTimeouts[0].dueTime.isEqualTo(nextIntervals[0].dueTime)) {
	  return this._timerExpirationPolicy.selectGroup(nextTimeouts, nextIntervals);
  }
  
  return nextIntervals;
};

AllTimersInterceptor.prototype.nextTimer = function() {
  var nextTimeouts = this._timeoutInterceptor.nextTimers();
  var nextIntervals = this._intervalInterceptor.nextTimers();
  
  return this._timerExpirationPolicy.selectElement(this._nextTimersGroup(nextTimeouts, nextIntervals));
};

module.exports = AllTimersInterceptor;