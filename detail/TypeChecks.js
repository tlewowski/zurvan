module.exports.isFunction = function(f) {
  return typeof f === 'function';
};

module.exports.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports.isString = function(s) {
  return typeof s === 'string';
};

module.exports.isObject = function(o) {
  return typeof o === 'object';
};