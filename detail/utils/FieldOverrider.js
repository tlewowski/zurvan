'use strict';
function FieldOverrider(objectRef, fieldName, newValue) {
  this.objectRef = objectRef;
  this.fieldName = fieldName;
  this.oldValue = objectRef[fieldName];
  objectRef[fieldName] = newValue;
}

FieldOverrider.prototype.restore = function() {
  this.objectRef[this.fieldName] = this.oldValue;
};

module.exports = FieldOverrider;
