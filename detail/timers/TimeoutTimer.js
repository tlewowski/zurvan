var Timer = require("./Timer");
var TimerType = require("./TimerType");

function TimeoutTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
}

TimeoutTimer.prototype = Object.create(Timer.prototype);
TimeoutTimer.prototype.type = TimerType.timeout;
TimeoutTimer.prototype.precall = function ignore() {};

module.exports = TimeoutTimer;