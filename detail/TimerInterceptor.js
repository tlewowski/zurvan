var FieldOverrider = require("./FieldOverrider");

function Timer(precall, callback, timerRepository, currentTime, callDelay) {
  this.callback = callback;
  this.dueTime = currentTime + callDelay;
  this.callDelay = callDelay;
  this.precall = precall;
  this.timerRepository = timerRepository;
}

function addTimer(timerRepository, precall, callbk, callDelay) {
  var callback = new Callback(callbk, [].splice.call(arguments, 4));
  var timer = new Timer(precall, callback, timerRepository, timerRepository.currentTime.milliseconds, callDelay);
  timerRepository.insertTimer(timer);
};

Timer.prototype.expire = function() {
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

function TimerInterceptor(timerRepository) {
  this.timeouts = new FieldOverrider(global, "setTimeout", addTimer.bind(undefined, timerRepository, Timer.prototype.ignore));
  this.intervals = new FieldOverrider(global, "setInterval", addTimer.bind(undefined, timerRepository, Timer.prototype.reschedule));
};

TimerInterceptor.prototype.restore = function() {
  this.timeouts.restore();
  this.intervals.restore();
};

module.exports = TimerInterceptor;