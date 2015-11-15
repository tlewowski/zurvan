var IntervalTimer = require("./IntervalTimer");
var TimeoutTimer = require("./TimeoutTimer");

var timeout = {
  context: global,
  setName: "setTimeout",
  clearName: "clearTimeout",
  type: TimeoutTimer
};

var interval = {
  context: global,
  setName: "setInterval",
  clearName: "clearInterval",
  type: IntervalTimer
};

module.exports = {
  interval: interval,
  timeout: timeout
};