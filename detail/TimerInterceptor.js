var FieldOverrider = require("./FieldOverrider");
var TimerRepository = require("./TimerRepository");
var TimerType = require("./TimerType");
var TypeChecks = require("./TypeChecks");
var TimeUnit = require("../TimeUnit");

function Timer(callback, timerRepository, currentTime, callDelay) {
  this.callback = callback;
  this.callDelay = TimeUnit.milliseconds(callDelay);
  this.dueTime = currentTime.extended(this.callDelay);
  this.timerRepository = timerRepository;
}

Timer.prototype.expire = function() {
  this.precall();
  this.callback.call();
};

function TimeoutTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
  this.type = TimerType.timeout;
  this.precall = function ignore() {};
}

TimeoutTimer.prototype = Timer.prototype;

function IntervalTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
  this.type = TimerType.interval;
  this.precall = function reschedule() {
    this.dueTime = currentTime.extended(this.callDelay);
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
}

TimerInterceptor.prototype.intercept = function(config) {
  this.config = config;
  this.setTimeouts = new FieldOverrider(global, "setTimeout", this.addTimer.bind(this, TimeoutTimer));
  this.clearTimeouts = new FieldOverrider(global, "clearTimeout", this.clearTimer.bind(this));
  this.setIntervals = new FieldOverrider(global, "setInterval", this.addTimer.bind(this, IntervalTimer));
  this.clearIntervals = new FieldOverrider(global, "clearInterval", this.clearTimer.bind(this));
};

TimerInterceptor.prototype.release = function() {
  this.setTimeouts.restore();
  this.clearTimeouts.restore();
  this.setIntervals.restore();
  this.clearIntervals.restore();
  this.timerRepository.clearAll();
};

TimerInterceptor.prototype.nextTimer = function() {
  return this.timerRepository.nextTimer();
};

TimerInterceptor.prototype.lastTimeout = function() {
  return this.timerRepository.lastTimeout();
};

TimerInterceptor.prototype.addTimer = function(TimerType, callbk, callDelay) {

  var callback;
  if(TypeChecks.isFunction(callbk)) {
    callback = new Callback(callbk, [].splice.call(arguments, 3));
  }
  else if(this.config.acceptEvalTimers) {
    callback = new Callback(function() {return eval(callbk);}, []);
  }
  else {
    throw new Error("Node.js does not accept strings in timers. If you wish, you can configure Zurvan to use them, but beware.");
  }
  
  if(!TypeChecks.isNumber(callDelay)) {
    if(this.config.denyImplicitTimer) {
      throw new Error("Call delay in timer call must be a numeric value");
	}
	
	callDelay = 0;
  }
  
  var timer = new TimerType(callback, this.timerRepository, this.timeServer.currentTime, callDelay);
  return this.timerRepository.insertTimer(timer);
};

TimerInterceptor.prototype.clearTimer = function(uid) {
  return this.timerRepository.clearTimer(uid);
};

module.exports = TimerInterceptor;