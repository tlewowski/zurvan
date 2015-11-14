var IntervalTimer = require("./IntervalTimer");
var TimeoutTimer = require("./TimeoutTimer");

var timeoutType = {
  context: global,
  setName: "setTimeout",
  clearName: "clearTimeout",
  type: TimeoutTimer
};

var intervalType = {
  context: global,
  setName: "setInterval",
  clearName: "clearInterval",
  type: IntervalTimer
};

module.exports = {
  interval: intervalType,
  timeout: timeoutType
};