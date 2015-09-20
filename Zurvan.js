var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var TypeUtils = require("./detail/TypeUtils");
var assert = require("assert");

function Zurvan() {
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
  this.targetTime = {milliseconds: 0, nanoseconds: 0};
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
  
  this.currentTime = {milliseconds: Math.floor(startupTimeInNanoseconds / 1e6), nanoseconds: startupTimeInNanoseconds % 1e6};
  this.targetTime = {milliseconds: this.currentTime.milliseconds, nanoseconds: this.currentTime.nanoseconds};
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
  
  var that = this;
  return new Promise(function(resolve, reject) {
    if(timeToForward < 0) {
      reject("Even Zurvan cannot move back in time!");
    }

    if(that.isExpiringEvents()) {
      return reject(Error("Cannot forward time before previous forwarding ends. Currently at: " + 
	    that.currentTime.milliseconds + " ms, target: " + that.targetTime.milliseconds + " ms"));
    }

    that.targetTime.milliseconds = that.currentTime.milliseconds + timeToForward;
  
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
      if(closestTimer && closestTimer.dueTime <= that.targetTime.milliseconds) {
	    that.timerInterceptor.clearTimer(closestTimer.uid);
        that.currentTime.milliseconds = closestTimer.dueTime;	  
        setImmediate(function() {
  	      closestTimer.expire();
          advanceTimeHelper();
        });
      }
	  else {
        that.currentTime.milliseconds = that.targetTime.milliseconds;
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
	return this.advanceTime(lastTimeout.dueTime - that.currentTime.milliseconds).then(function() {
	  return that.expireAllTimeouts();
	});
  }

  return Promise.resolve();
};

Zurvan.prototype.forwardTimeToNextTimer = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  if(closestTimer) {
    return this.advanceTime(closestTimer.dueTime - this.currentTime.milliseconds);
  }
  
  return Promise.resolve();
};

Zurvan.prototype.blockSystem = function(timeToBlock) {

  var that = this;  
  return new Promise(function(resolve, reject) {
    if(timeToBlock < 0) {
      return reject(Error("Even Zurvan cannot move back in time!"));
    }
	
	if(!that.isExpiringEvents()) {
	  assert(that.targetTime.milliseconds === that.currentTime.milliseconds);
	  that.targetTime.milliseconds += timeToBlock;
	}
	else if(that.targetTime.milliseconds < that.currentTime.milliseconds + timeToBlock) {
	  return reject(Error("Cannot block system during advancing for longer than requested advance time"));
	}
	
    that.currentTime.milliseconds += timeToBlock;
		
    var closestTimer = that.timerInterceptor.nextTimer();
    while(closestTimer && closestTimer.dueTime <= that.currentTime.milliseconds) {
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