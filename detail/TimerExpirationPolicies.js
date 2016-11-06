function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function firstElement(array) {
  return array[0];
}

var policies = {
  "FIFO": {
    selectGroup: function(timeouts, intervals) {
      return timeouts[0].sequenceNumber < intervals[0].sequenceNumber ? timeouts : intervals;
    },
    selectElement: firstElement
  },
  "Timeouts-First-FIFO": {
    selectGroup: function(timeouts) { return timeouts; },
    selectElement: firstElement
  },
  "Intervals-First-FIFO": {
    selectGroup: function(_, intervals) { return intervals; },
    selectElement: firstElement
  },
  "Random": {
    selectGroup: function(timeouts, intervals) { return [].concat(timeouts, intervals); },
    selectElement: randomElement
  },
  "Timeouts-First-Random": {
    selectGroup: function(timeouts) { return timeouts; },
    selectElement: randomElement
  },
  "Intervals-First-Random": {
    selectGroup: function(_, intervals) { return intervals; },
    selectElement: randomElement
  }
};

module.exports = policies;