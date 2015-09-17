var FieldOverrider = require("./FieldOverrider");

function ImmediateInterceptor() {
  this.setImmediates = new FieldOverrider(global, "setImmediate", this.addImmediate.bind(this));
  this.clearImmediates = new FieldOverrider(global, "clearImmediate", this.removeImmediate.bind(this));
  this.awaitingImmediates = 0;
  this.enqueue = this.setImmediates.oldValue;
  this.dequeue = this.clearImmediates.oldValue;
}

ImmediateInterceptor.prototype.addImmediate = function(callback) {
  ++this.awaitingImmediates;
  
  var that = this;
  var args = [].splice.call(arguments, 1);
  return this.enqueue(function() {
    --that.awaitingImmediates;
    callback.apply(undefined, args);
  });
};

ImmediateInterceptor.prototype.removeImmediate = function(uid) {
  --this.awaitingImmediates;
  return this.dequeue(uid);
};

ImmediateInterceptor.prototype.restore = function() {
  this.awaitingImmediates = 0;
  this.setImmediates.restore();
  this.clearImmediates.restore();
};

ImmediateInterceptor.prototype.areAwaiting = function() {
  return this.awaitingImmediates > 0;
};

module.exports = ImmediateInterceptor;