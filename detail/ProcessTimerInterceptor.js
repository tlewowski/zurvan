var assert = require("assert");
var FieldOverrider = require("./FieldOverrider");

function ProcessTimerInterceptor(timeServer) {
  this.timeServer = timeServer;
  this.uptimeOverrider = new FieldOverrider(process, "uptime", this.uptime.bind(this));
  this.hrtimeOverrider = new FieldOverrider(process, "hrtime", this.hrtime.bind(this));
}

ProcessTimerInterceptor.prototype.uptime = function() {
  return this.timeServer.currentTime.milliseconds / 1000;
};

function nanosecondsToHrtimeFormat(timeInNanoseconds) {
  return [Math.floor(timeInNanoseconds / 1e9), timeInNanoseconds % 1e9];  
};

ProcessTimerInterceptor.prototype.hrtime = function(previousValue) {
  var currentTime = this.timeServer.currentTime;
  var currentTimeInNanoseconds = currentTime.milliseconds * 1e6 + currentTime.nanoseconds;
  if(previousValue !== undefined) {
    assert(previousValue.length === 2);
	var previousTimeInNanoseconds = previousValue[0] * 1e9 + previousValue[1];
	return nanosecondsToHrtimeFormat(currentTimeInNanoseconds - previousTimeInNanoseconds);
  }
  
  return nanosecondsToHrtimeFormat(currentTimeInNanoseconds);
};

ProcessTimerInterceptor.prototype.restore = function() {
  this.uptimeOverrider.restore();
  this.hrtimeOverrider.restore();
};

module.exports = ProcessTimerInterceptor;