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

function Thoth() {
  this.timers = [];
  this.currentTime = {milliseconds: 0, nanoseconds: 0};
}

Thoth.prototype.startTime = function() {
};

Thoth.prototype.stopTime = function() {
  this.timeoutOverrider = new FieldOverrider(global, "setTimeout", this.addTimer.bind(this));
};

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

Thoth.prototype.advanceTime = function(time) {
  while(this.timers.length > 0 && this.timers[0].dueTime <= this.currentTime.milliseconds + time) {
    var expired = this.timers.splice(0, 1);
    expired[0].callback.call();
  }
  
  this.currentTime.milliseconds += time;
};

function createThoth() {
  return new Thoth();
}

module.exports = createThoth();