'use strict';
var TypeChecks = require('./utils/TypeChecks');
var TimeUnit = require('../TimeUnit');

function TimeServer() {}

TimeServer.prototype.setupTime = function(timeSinceStartup, systemTime) {
  if (TypeChecks.isNumber(timeSinceStartup)) {
    this.currentTime = TimeUnit.seconds(timeSinceStartup);
  } else if (timeSinceStartup && timeSinceStartup.length === 2) {
    this.currentTime = TimeUnit.seconds(timeSinceStartup[0]).extended(
      TimeUnit.nanoseconds(timeSinceStartup[1])
    );
  } else {
    this.currentTime = TimeUnit.seconds(0);
    this.currentTime.add(timeSinceStartup);
  }

  this.targetTime = this.currentTime.copy();
  this.setSystemTime(systemTime || 0);
};

TimeServer.prototype.setSystemTime = function(value) {
  if (TypeChecks.isString(value) || TypeChecks.isNumber(value)) {
    value = new Date(value);
  }

  this.systemTimeOffset = TimeUnit.milliseconds(
    value.getTime() - this.currentTime.toMilliseconds()
  );
};

module.exports = TimeServer;
