var TypeChecks = require("./TypeChecks");
var TimeUnit = require("../TimeUnit");
var assert = require("assert");

function TimeForwarder(timeServer, timerInterceptor, immediateInterceptor) {
  this.timeForwardingOngoing = false;
  this.timerInterceptor = timerInterceptor;  
  this.timeServer = timeServer;
  this.immediateInterceptor = immediateInterceptor; 
}

TimeForwarder.prototype.stopForwarding = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(that.isExpiringEvents()) {
	  return reject(Error("Cannot release timers during event expiration"));
    }
	
	return resolve();
  });
};

TimeForwarder.prototype.stopExpiringEvents = function() {
  this.timeForwardingOngoing = false;
};

TimeForwarder.prototype.startExpiringEvents = function() {
  this.timeForwardingOngoing = true;  
};

TimeForwarder.prototype.isExpiringEvents = function() {
  return this.timeForwardingOngoing;
};

TimeForwarder.prototype.advanceTime = function(timeToForward) {
  var advanceStep = (TypeChecks.isNumber(timeToForward)) ? TimeUnit.milliseconds(timeToForward) : timeToForward;  
  var that = this;

  return new Promise(function(resolve, reject) {
    if(advanceStep.isShorterThan(TimeUnit.milliseconds(0))) {
      return reject(Error("Even Zurvan cannot move back in time!"));
    }

    if(that.isExpiringEvents()) {
      return reject(Error("Cannot forward time shortened previous forwarding ends. Currently at: " + 
        that.timeServer.currentTime.toMilliseconds() + " ms, target: " + that.timeServer.targetTime.toMilliseconds() + " ms"));
    }
	
    that.timeServer.targetTime = that.timeServer.currentTime.extended(advanceStep);
    that.startExpiringEvents();
    setImmediate(function() {
      fireTimersOneByOne();
    });
  
    function fireTimersOneByOne() {
      if(that.immediateInterceptor.areAwaiting()) {
        setImmediate(function() {
          fireTimersOneByOne();
        });
        return;
      }
	
  	  var closestTimer = that.timerInterceptor.nextTimer();
      if(closestTimer && !closestTimer.dueTime.isLongerThan(that.timeServer.targetTime)) {
	    that.timerInterceptor.clearTimer(closestTimer.uid);
        that.timeServer.currentTime.setTo(closestTimer.dueTime);
        setImmediate(function() {
  	      closestTimer.expire();
	
	      // schedule on macroqueue, to make sure that all microqueue tasks already expired
		  // clearing macroqueue is handled in the beginning of this function
		  setImmediate(function() {
            fireTimersOneByOne();
		  });
        });
      }
	  else {
        that.timeServer.currentTime.setTo(that.timeServer.targetTime);
        that.stopExpiringEvents();
		resolve();
      }
    }
  });
};


TimeForwarder.prototype.expireAllTimeouts = function() {
  var lastTimeout = this.timerInterceptor.lastTimeout();
  if(lastTimeout) {
    var that = this;
	return this.advanceTime(lastTimeout.dueTime.shortened(that.timeServer.currentTime)).then(function() {
	  return that.expireAllTimeouts();
	});
  }

  return Promise.resolve();
};

TimeForwarder.prototype.forwardTimeToNextTimer = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  if(closestTimer) {
    return this.advanceTime(closestTimer.dueTime.shortened(this.timeServer.currentTime));
  }
  
  return Promise.resolve();
};

TimeForwarder.prototype.fireAllOutdatedTimers = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  while(closestTimer && !closestTimer.dueTime.isLongerThan(this.timeServer.currentTime)) {
    this.timerInterceptor.clearTimer(closestTimer.uid);
    setImmediate(closestTimer.expire.bind(closestTimer));
    closestTimer = this.timerInterceptor.nextTimer();
  }
};

TimeForwarder.prototype.blockSystem = function(timeToBlock) {
  var blockStep = (TypeChecks.isNumber(timeToBlock)) ? TimeUnit.milliseconds(timeToBlock) : timeToBlock;
 
  if(blockStep.isShorterThan(TimeUnit.milliseconds(0))) {
    throw new Error("Even Zurvan cannot move back in time!");
  }
	
  if(!this.isExpiringEvents()) {
	assert(this.timeServer.targetTime.isEqualTo(this.timeServer.currentTime));
    this.timeServer.targetTime.add(blockStep);
  }
  else if(this.timeServer.targetTime.isShorterThan(this.timeServer.currentTime.extended(blockStep))) {
    throw new Error("Cannot block system during advancing for longer than requested advance time");
  }
	
  this.timeServer.currentTime.add(blockStep);
  this.fireAllOutdatedTimers();
};

module.exports = TimeForwarder;