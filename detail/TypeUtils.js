module.exports.isFunction = function(callbk) {
  return typeof callbk === 'function';
};

module.exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};