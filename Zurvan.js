var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var TypeUtils = require("./detail/TypeUtils");
var TimeUnit = require("./TimeUnit");
var assert = require("assert");

function Zurvan() {
  this.currentTime = TimeUnit.nanoseconds(0);
  this.targetTime = TimeUnit.nanoseconds(0);
  this.timeForwardingOngoing = false;
  this.isStopped = false;
}

Zurvan.prototype.startTime = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(that.isStopped && !that.isExpiringEvents()) {
	  return resolve();
	}
	
	return reject(Error("Cannot start time during event expiration"));
  }).then(function() {
    that.isStopped = false;
    that.immediateInterceptor.restore();	
    that.processTimerInterceptor.restore();
    that.timerInterceptor.restore();
  });
};

Zurvan.prototype.stopTime = function(config) {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(that.isStopped) {
	  return reject(Error("Cannot stop time that is already stopped"));
	}
	return resolve();
  }).then(function() {
    that.config = config || {};
    that.isStopped = true;
	that.setupTime(that.config.timeSinceStartup);

    that.timerInterceptor = new TimerInterceptor(that, that.config);
    that.processTimerInterceptor = new ProcessTimerInterceptor(that);
    that.immediateInterceptor = new ImmediateInterceptor();	
  });
  
};

Zurvan.prototype.setupTime = function(timeSinceStartup) {
  var startupTimeInNanoseconds = 0;
  if(TypeUtils.isNumber(timeSinceStartup)) {
    startupTimeInNanoseconds = timeSinceStartup * 1e9;
  }
  else if (timeSinceStartup !== undefined){
    startupTimeInNanoseconds = timeSinceStartup[0] * 1e9 + timeSinceStartup[1];
  }
  
  this.currentTime = TimeUnit.nanoseconds(startupTimeInNanoseconds);
  this.targetTime = TimeUnit.nanoseconds(startupTimeInNanoseconds);
};

Zurvan.prototype.stopExpiringEvents = function() {
  this.timeForwardingOngoing = false;
};

Zurvan.prototype.startExpiringEvents = function() {
  this.timeForwardingOngoing = true;  
};

Zurvan.prototype.isExpiringEvents = function() {
  return this.timeForwardingOngoing;
};

Zurvan.prototype.advanceTime = function(timeToForward) {
  var advanceStep = (TypeUtils.isNumber(timeToForward)) ? TimeUnit.milliseconds(timeToForward) : timeToForward;  
  var that = this;
  return new Promise(function(resolve, reject) {
    if(advanceStep.toMilliseconds() < 0) {
      reject("Even Zurvan cannot move back in time!");
    }

    if(that.isExpiringEvents()) {
      return reject(Error("Cannot forward time before previous forwarding ends. Currently at: " + 
	    that.currentTime.toMilliseconds() + " ms, target: " + that.targetTime.toMilliseconds() + " ms"));
    }

    that.targetTime = that.currentTime.after(advanceStep);
  
    that.startExpiringEvents();
    setImmediate(function() {
	  advanceTimeHelper();
    });
  
    function advanceTimeHelper() {
      if(that.immediateInterceptor.areAwaiting()) {
        setImmediate(function() {
          advanceTimeHelper();
        });
        return;
      }
	
	  var closestTimer = that.timerInterceptor.nextTimer();
      if(closestTimer && closestTimer.dueTime.toMilliseconds() <= that.targetTime.toMilliseconds()) {
	    that.timerInterceptor.clearTimer(closestTimer.uid);
        that.currentTime.setTo(closestTimer.dueTime);
        setImmediate(function() {
  	      closestTimer.expire();
          advanceTimeHelper();
        });
      }
	  else {
        that.currentTime.setTo(that.targetTime);
        that.stopExpiringEvents();
		resolve();
      }
    }
  });  
};

Zurvan.prototype.expireAllTimeouts = function() {
  var lastTimeout = this.timerInterceptor.lastTimeout();
  if(lastTimeout) {
    var that = this;
	return this.advanceTime(lastTimeout.dueTime.toMilliseconds() - that.currentTime.toMilliseconds()).then(function() {
	  return that.expireAllTimeouts();
	});
  }

  return Promise.resolve();
};

Zurvan.prototype.forwardTimeToNextTimer = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  if(closestTimer) {
    return this.advanceTime(closestTimer.dueTime.toMilliseconds() - this.currentTime.toMilliseconds());
  }
  
  return Promise.resolve();
};

Zurvan.prototype.blockSystem = function(timeToBlock) {
  var blockStep = (TypeUtils.isNumber(timeToBlock)) ? TimeUnit.milliseconds(timeToBlock) : timeToBlock;  

  var that = this;  
  return new Promise(function(resolve, reject) {
    if(blockStep.toMilliseconds() < 0) {
      return reject(Error("Even Zurvan cannot move back in time!"));
    }
	
	if(!that.isExpiringEvents()) {
	  assert(Math.round(that.targetTime.toMilliseconds()) === Math.round(that.currentTime.toMilliseconds()));
	  that.targetTime.add(blockStep);
	}
	else if(Math.round(that.targetTime.toMilliseconds()) < Math.round(that.currentTime.after(blockStep).toMilliseconds())) {
	  return reject(Error("Cannot block system during advancing for longer than requested advance time"));
	}
	
    that.currentTime.add(blockStep);
		
    var closestTimer = that.timerInterceptor.nextTimer();
    while(closestTimer && Math.round(closestTimer.dueTime.toMilliseconds()) <= Math.round(that.currentTime.toMilliseconds())) {
      that.timerInterceptor.clearTimer(closestTimer.uid);
  	  setImmediate(closestTimer.expire.bind(closestTimer));
      closestTimer = that.timerInterceptor.nextTimer();
    }
	
  	resolve();
  }).then(function() {
    if(!that.isExpiringEvents()) {
      return that.advanceTime(0);
	}
  });
};

function createZurvan() {
  return new Zurvan();
}

module.exports = createZurvan();