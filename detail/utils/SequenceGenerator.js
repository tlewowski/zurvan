'use strict';
function SequenceGenerator() {
  this._sequenceNumber = 0;
}

SequenceGenerator.prototype.generate = function() {
  return this._sequenceNumber++;
};

module.exports = SequenceGenerator;
