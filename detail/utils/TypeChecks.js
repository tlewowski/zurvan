"use strict";
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
  return typeof o === 'object' && o !== null;
};

module.exports.isBoolean = function(b) {
  return typeof b === 'boolean';
};

module.exports.isInteger = function(i) {
  return typeof i === 'number' && parseInt(i) === i;
};