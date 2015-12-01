"use strict";
var Timer = require("./Timer");

function TimeoutTimer(callback, timerRepository, currentTime, callDelay) {
  Timer.bind(this)(callback, timerRepository, currentTime, callDelay);
}

TimeoutTimer.prototype = Object.create(Timer.prototype);
TimeoutTimer.prototype.precall = function ignore() {};

module.exports = TimeoutTimer;