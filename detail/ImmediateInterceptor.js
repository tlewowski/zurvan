var FieldOverrider = require("./FieldOverrider");

function ImmediateInterceptor() {
  this.immediateOverrider = new FieldOverrider(global, "setImmediate", this.addImmediate.bind(this));
  this.awaitingImmediates = 0;
  this.enqueue = this.immediateOverrider.oldValue;
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

ImmediateInterceptor.prototype.restore = function() {
  this.awaitingImmediates = 0;
  this.immediateOverrider.restore();
};

ImmediateInterceptor.prototype.areAwaiting = function() {
  return this.awaitingImmediates > 0;
};

module.exports = ImmediateInterceptor;