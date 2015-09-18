function UIDGenerator() {
  this.uid = 0;
}

UIDGenerator.prototype.generate = function() {
  var uid = {uid: this.uid++};
  uid.ref = uid;
  return uid;
};

module.exports = UIDGenerator;