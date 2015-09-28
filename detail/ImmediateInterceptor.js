var FieldOverrider = require("./FieldOverrider");
var UIDGenerator = require("./UIDGenerator");
var assert = require("assert");

function ImmediateInterceptor() {
  this.awaitingImmediates = {size: 0};
  this.uidGenerator = new UIDGenerator();
}

ImmediateInterceptor.prototype.intercept = function() {
  this.setImmediates = new FieldOverrider(global, "setImmediate", this.addImmediate.bind(this));
  this.clearImmediates = new FieldOverrider(global, "clearImmediate", this.removeImmediate.bind(this));
  
  this.enqueue = this.setImmediates.oldValue;
  this.dequeue = this.clearImmediates.oldValue;
};

ImmediateInterceptor.prototype.release = function() {
  var that = this;
  Object.keys(this.awaitingImmediates).forEach(function(uid) {
    that.dequeue(that.awaitingImmediates[uid]);
  });
  this.awaitingImmediates = {size: 0};

  this.setImmediates.restore();
  this.clearImmediates.restore();
  
  this.enqueue = undefined;
  this.dequeue = undefined;
};

ImmediateInterceptor.prototype.addImmediate = function(callback) {
  var uid = this.uidGenerator.generate();
  
  var that = this;
  var args = [].splice.call(arguments, 1);
  this.awaitingImmediates[uid.uid] = this.enqueue(function() {
    that.remove(uid);	
    callback.apply(undefined, args);
  });
  ++this.awaitingImmediates.size;
  
  return uid;
};

ImmediateInterceptor.prototype.remove = function(uid) {
  var toDequeue;
  if(this.awaitingImmediates[uid.uid] !== undefined) {
    toDequeue = this.awaitingImmediates[uid.uid];
	delete this.awaitingImmediates[uid.uid];
    --this.awaitingImmediates.size;
  }
  assert(this.awaitingImmediates.size >= 0);

  return toDequeue;
};

ImmediateInterceptor.prototype.removeImmediate = function(uid) {
  return this.dequeue(this.remove(uid));
};

ImmediateInterceptor.prototype.areAwaiting = function() {
  return this.awaitingImmediates.size > 0;
};

module.exports = ImmediateInterceptor;