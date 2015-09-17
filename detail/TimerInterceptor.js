var FieldOverrider = require("./FieldOverrider");
var TimerRepository = require("./TimerRepository");

function Timer(precall, callback, timerRepository, currentTime, callDelay) {
  this.callback = callback;
  this.dueTime = currentTime + callDelay;
  this.callDelay = callDelay;
  this.precall = precall;
  this.timerRepository = timerRepository;
}

Timer.prototype.expire = function() {
  this.timerRepository.removeTimer(this);
  this.precall();
  this.callback.call();
};

Timer.prototype.reschedule = function() {
  this.dueTime += this.callDelay;
  this.timerRepository.insertTimer(this);
};

Timer.prototype.ignore = function() {
};

function Callback(f, args) {
  this.f = f;
  this.args = args;
}

Callback.prototype.call = function() {
  this.f.apply(undefined, this.args);
};

function TimerInterceptor(timeServer) {
  this.timeServer = timeServer;
  this.timerRepository = new TimerRepository();
  this.timeouts = new FieldOverrider(global, "setTimeout", this.addTimer.bind(this, Timer.prototype.ignore));
  this.intervals = new FieldOverrider(global, "setInterval", this.addTimer.bind(this, Timer.prototype.reschedule));
}

TimerInterceptor.prototype.restore = function() {
  this.timeouts.restore();
  this.intervals.restore();
};

TimerInterceptor.prototype.next = function() {
  return this.timerRepository.nextTimer();
};

TimerInterceptor.prototype.addTimer = function(precall, callbk, callDelay) {
  var callback = new Callback(callbk, [].splice.call(arguments, 3));
  var timer = new Timer(precall, callback, this.timerRepository, this.timeServer.currentTime.milliseconds, callDelay);
  this.timerRepository.insertTimer(timer);
};

module.exports = TimerInterceptor;