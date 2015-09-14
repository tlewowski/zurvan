var FieldOverrider = require("./FieldOverrider");

function Timer(callback, dueTime) {
  this.callback = callback;
  this.dueTime = dueTime;
}

function Callback(f, args) {
  this.f = f;
  this.args = args;
}

Callback.prototype.call = function() {
  this.f.apply(undefined, this.args);
}

function ImmediateInterceptor() {
  this.immediateOverrider = new FieldOverrider(global, "setImmediate", this.addImmediate.bind(this));
  this.immediates = [];
}

ImmediateInterceptor.prototype.addImmediate = function(callback) {
  this.immediates.push(new Callback(callback, [].splice.call(arguments, 1)));
}

ImmediateInterceptor.prototype.flush = function() {
  while(this.immediates.length > 0) {
    this.immediates.splice(0,1)[0].call();
  }
}

ImmediateInterceptor.prototype.restore = function() {
  this.immediates = [];
  this.immediateOverrider.restore();
}

function Thoth() {
  this.timers = [];
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
}

Thoth.prototype.startTime = function() {
  this.timeoutOverrider.restore();
  if(this.immediateInterceptor)
    this.immediateInterceptor.restore();
	
  this.stopForwarding();  
  this.timers = [];
  this.currentTime = {milliseconds: 0, nanoseconds: 0};  
};

Thoth.prototype.stopTime = function() {
  this.timeoutOverrider = new FieldOverrider(global, "setTimeout", this.addTimer.bind(this));
};

Thoth.prototype.startForwarding = function() {
  this.forwardingOngoing = true;
}

Thoth.prototype.stopForwarding = function() {
  this.forwardingOngoing = false;
}

Thoth.prototype.isForwarding = function() {
  return this.forwardingOngoing;
}

Thoth.prototype.addTimer = function(callback, callAfter) {
  var callback = new Callback(callback, [].splice.call(arguments, 2));
  var dueTime = callAfter + this.currentTime.milliseconds;
  var timer = new Timer(callback, dueTime);
  
  var i;
  for(i = 0; i < this.timers.length; ++i) {
    if(this.timers[i].dueTime > timer.dueTime) {
	  break;
	}
  }
  
  this.timers.splice(i, 0, timer);
}

Thoth.prototype.advanceTime = function(timeToForward) {
  if(timeToForward < 0) {
    throw new Error("Even Thoth cannot move back in time!");
  }

  if(this.isForwarding()) {
      throw new Error("Cannot forward time from two places simultaneously");
  }

  var that = this;
  advanceTimeHelper(timeToForward);
  
  function advanceTimeHelper(time) {
  
    if(that.immediateInterceptor) {
      that.immediateInterceptor.flush();
      that.immediateInterceptor.restore();    
    }

    if(time === 0)
      return;

    var targetTime = that.currentTime.milliseconds + time;
    if(that.timers.length === 0) {
      that.currentTime.milliseconds = targetTime;
	  that.stopForwarding();
  	  return;
    }

    that.startForwarding();
    if(that.timers[0].dueTime <= targetTime) {
      var expiredTimer = that.timers.splice(0, 1)[0];

      that.currentTime.milliseconds = expiredTimer.dueTime;
	  var nextTimeStep = targetTime - expiredTimer.dueTime;
      if(nextTimeStep === 0)
	    that.stopForwarding();
	
      setImmediate(function() {
	    expiredTimer.callback.call();
	    that.immediateInterceptor.flush();
	    that.immediateInterceptor.restore();
	    that.immediateInterceptor = undefined;
        advanceTimeHelper(nextTimeStep);
  	  });
	  that.immediateInterceptor = new ImmediateInterceptor();
    }
  }
};

function createThoth() {
  return new Thoth();
}

module.exports = createThoth();