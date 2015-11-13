var Timer = require("./Timer");
var TimerType = require("./TimerType");

function IntervalTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
}

IntervalTimer.prototype = Object.create(Timer.prototype);
IntervalTimer.prototype.type = TimerType.interval;
IntervalTimer.prototype.precall = function reschedule() {
  this.dueTime = this._currentTime.extended(this._callDelay);
  this._timerRepository.insertTimer(this);
};

module.exports = IntervalTimer;