var FieldOverrider = require("./FieldOverrider");
var TimerRepository = require("./TimerRepository");

function Timer(callback, timerRepository, currentTime, callDelay) {
  this.callback = callback;
  this.dueTime = currentTime + callDelay;
  this.callDelay = callDelay;
  this.timerRepository = timerRepository;
}

Timer.prototype.expire = function() {
  this.timerRepository.removeTimer(this);
  this.precall();
  this.callback.call();
};

function TimeoutTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
  this.precall = function ignore() {};
}

TimeoutTimer.prototype = Timer.prototype;

function IntervalTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
  this.precall = function reschedule() {
    this.dueTime += this.callDelay;
    this.timerRepository.insertTimer(this);
  };
}

IntervalTimer.prototype = Timer.prototype;

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
  this.timeouts = new FieldOverrider(global, "setTimeout", this.addTimer.bind(this, TimeoutTimer));
  this.intervals = new FieldOverrider(global, "setInterval", this.addTimer.bind(this, IntervalTimer));
}

TimerInterceptor.prototype.restore = function() {
  this.timeouts.restore();
  this.intervals.restore();
};

TimerInterceptor.prototype.next = function() {
  return this.timerRepository.nextTimer();
};

TimerInterceptor.prototype.addTimer = function(TimerType, callbk, callDelay) {
  var callback = new Callback(callbk, [].splice.call(arguments, 3));
  var timer = new TimerType(callback, this.timerRepository, this.timeServer.currentTime.milliseconds, callDelay);
  this.timerRepository.insertTimer(timer);
};

module.exports = TimerInterceptor;