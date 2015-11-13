var TimerInterceptor = require("./TimerInterceptor");
var IntervalTimer = require("./timers/IntervalTimer");
var TimeoutTimer = require("./timers/TimeoutTimer");
var SequenceGenerator = require("./SequenceGenerator");

var timeoutType = {
  context: global,
  setName: "setTimeout",
  clearName: "clearTimeout",
  type: TimeoutTimer
};

var intervalType = {
  context: global,
  setName: "setInterval",
  clearName: "clearInterval",
  type: IntervalTimer
};

function AllTimersInterceptor(timeServer) {
  this._sequenceGenerator = new SequenceGenerator();
  this.timeoutInterceptor = new TimerInterceptor(timeServer, timeoutType);
  this.intervalInterceptor = new TimerInterceptor(timeServer, intervalType);
}

AllTimersInterceptor.prototype.intercept = function(config) {
  this.timeoutInterceptor.intercept(config, this._sequenceGenerator);
  this.intervalInterceptor.intercept(config, this._sequenceGenerator);
};

AllTimersInterceptor.prototype.release = function() {
  this.timeoutInterceptor.release();
  this.intervalInterceptor.release();
  this._sequenceGenerator.clear();
};

AllTimersInterceptor.prototype.timerOrderingResolution = function(timeout, interval) {
  if(timeout.sequenceNumber < interval.sequenceNumber) {
    return timeout;
  };	
  
  return interval;
};
AllTimersInterceptor.prototype.lastTimeout = function() {
  return this.timeoutInterceptor.lastTimer();
}

AllTimersInterceptor.prototype.nextTimer = function() {
  var nextTimeout = this.timeoutInterceptor.nextTimer();
  var nextInterval = this.intervalInterceptor.nextTimer();
  
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