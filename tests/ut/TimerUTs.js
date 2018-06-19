var Timer = require('../../detail/timers/Timer');
var TimeUnit = require('../../TimeUnit');

var nop = function() {};
describe('Timer when cleared', function() {
  it('without uid - throws an error', function(done) {
    var timer = new Timer(nop, { clearTimer: nop }, TimeUnit.seconds(0), 0);
    try {
      timer.clear();
      done(new Error('Timer shall not be cleared if no UID is assigned!'));
    } catch (err) {
      done();
    }
  });

  it('with falsy uid - behaves fine', function(done) {
    var timer = new Timer(nop, { clearTimer: nop }, TimeUnit.seconds(0), 0);
    timer.uid = 0;
    timer.clear();
    done();
  });

  it('with truthy uid - behaves fine', function(done) {
    var timer = new Timer(nop, { clearTimer: nop }, TimeUnit.seconds(0), 0);
    timer.uid = {};
    timer.clear();
    done();
  });
});
