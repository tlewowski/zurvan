function SequenceGenerator() {
  this._sequenceNumber = 0;
}

SequenceGenerator.prototype.generate = function() {
  return this._sequenceNumber++;
};

SequenceGenerator.prototype.clear = function() {
};

module.exports = SequenceGenerator;