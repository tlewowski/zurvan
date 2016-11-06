module.exports.setTestTimers = function(calls) {
  setTimeout(function() {
    calls.push(1);
  }, 100);
  setInterval(function() {
    calls.push(2);
  }, 100);
  setTimeout(function() {
    calls.push(3);
  },100);
  setTimeout(function() {
    calls.push(4);
  },100);
  setTimeout(function() {
    calls.push(6);
  },200);
  setTimeout(function() {
    calls.push(7);
  },300);
  setInterval(function() {
    calls.push(5);
  }, 100);
};