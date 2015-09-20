var ImmediateInterceptor = require("./detail/ImmediateInterceptor");
var TimerInterceptor = require("./detail/TimerInterceptor");
var ProcessTimerInterceptor = require("./detail/ProcessTimerInterceptor");
var assert = require("assert");

function Thoth() {
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
  this.targetTime = {milliseconds: 0, nanoseconds: 0};
  this.timeForwardingOngoing = false;
  this.isStopped = false;
}

Thoth.prototype.startTime = function() {
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

Thoth.prototype.stopTime = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    if(that.isStopped) {
	  return reject(Error("Cannot stop time that is already stopped"));
	}
	return resolve();
  }).then(function() {
    that.isStopped = true;
	that.currentTime = {milliseconds: 0, nanoseconds: 0};
	that.targetTime = {milliseconds: 0, nanoseconds: 0};

    that.timerInterceptor = new TimerInterceptor(that);
    that.processTimerInterceptor = new ProcessTimerInterceptor(that);
    that.immediateInterceptor = new ImmediateInterceptor();	
  });
  
};

Thoth.prototype.stopExpiringEvents = function() {
  this.timeForwardingOngoing = false;
};

Thoth.prototype.startExpiringEvents = function() {
  this.timeForwardingOngoing = true;  
};

Thoth.prototype.isExpiringEvents = function() {
  return this.timeForwardingOngoing;
};

Thoth.prototype.advanceTime = function(timeToForward) {
  
  var that = this;
  return new Promise(function(resolve, reject) {
    if(timeToForward < 0) {
      reject("Even Thoth cannot move back in time!");
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

Thoth.prototype.expireAllTimeouts = function() {
  var lastTimeout = this.timerInterceptor.lastTimeout();
  if(lastTimeout) {
    var that = this;
	return this.advanceTime(lastTimeout.dueTime - that.currentTime.milliseconds).then(function() {
	  return that.expireAllTimeouts();
	});
  }

  return Promise.resolve();
};

Thoth.prototype.forwardTimeToNextTimer = function() {
  var closestTimer = this.timerInterceptor.nextTimer();
  if(closestTimer) {
    return this.advanceTime(closestTimer.dueTime - this.currentTime.milliseconds);
  }
  
  return Promise.resolve();
};

Thoth.prototype.blockSystem = function(timeToBlock) {

  var that = this;  
  return new Promise(function(resolve, reject) {
    if(timeToBlock < 0) {
      return reject(Error("Even Thoth cannot move back in time!"));
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

function createThoth() {
  return new Thoth();
}

module.exports = createThoth();