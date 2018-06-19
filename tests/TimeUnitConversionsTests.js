'use strict';
var TimeUnit = require('../TimeUnit');
var assert = require('assert');

describe('TimeUnit', function() {
  it('can be converted to any time interval', function(done) {
    var second = TimeUnit.seconds(1);

    assert(Math.abs(second.toNanoseconds() - 1e9) < 1e-3);
    assert(Math.abs(second.toMicroseconds() - 1e6) < 1e-6);
    assert(Math.abs(second.toMilliseconds() - 1e3) < 1e-9);
    assert(Math.abs(second.toSeconds() - 1) < 1e-12);

    var week = TimeUnit.weeks(1);
    assert(Math.abs(week.toWeeks() - 1) < 1e-12);
    assert(Math.abs(week.toDays() - 7) < 1e-12);
    assert(Math.abs(week.toHours() - 7 * 24) < 1e-10);
    done();
  });

  it('default value is milliseconds', function(done) {
    assert(new TimeUnit(10).isEqualTo(TimeUnit.milliseconds(10)));
    done();
  });

  it('conversions are stable', function(done) {
    var hour = TimeUnit.hours(10);
    var nanoseconds = TimeUnit.nanoseconds(hour.toNanoseconds());
    var days = TimeUnit.days(nanoseconds.toDays());
    var minutes = TimeUnit.minutes(hour.toMinutes());
    var microseconds = TimeUnit.microseconds(minutes.toMicroseconds());
    var milliseconds = TimeUnit.milliseconds(microseconds.toMilliseconds());

    assert(
      Math.abs(hour.toMilliseconds() - nanoseconds.toMilliseconds()) < 1e-12
    );
    assert(Math.abs(hour.toMilliseconds() - days.toMilliseconds()) < 1e-12);
    assert(Math.abs(hour.toMilliseconds() - minutes.toMilliseconds()) < 1e-12);
    assert(
      Math.abs(hour.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(hour.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(nanoseconds.toMilliseconds() - days.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(nanoseconds.toMilliseconds() - minutes.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(nanoseconds.toMilliseconds() - microseconds.toMilliseconds()) <
        1e-12
    );
    assert(
      Math.abs(nanoseconds.toMilliseconds() - milliseconds.toMilliseconds()) <
        1e-12
    );
    assert(Math.abs(days.toMilliseconds() - minutes.toMilliseconds()) < 1e-12);
    assert(
      Math.abs(days.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(days.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(minutes.toMilliseconds() - microseconds.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(minutes.toMilliseconds() - milliseconds.toMilliseconds()) < 1e-12
    );
    assert(
      Math.abs(milliseconds.toMilliseconds() - microseconds.toMilliseconds()) <
        1e-12
    );
    assert(
      Math.abs(microseconds.toMilliseconds() - microseconds.toMilliseconds()) <
        1e-12
    );

    done();
  });

  describe('cannot be added to', function() {
    function addFailureScenario(toAdd) {
      return function(done) {
        var day = TimeUnit.days(1);
        try {
          day.add(toAdd);
          done(new Error('Cannot add not TimeUnit to TimeUnit'));
        } catch (err) {
          done();
        }
      };
    }

    it('cannot be added to number', addFailureScenario(10));
    it('cannot be added to string', addFailureScenario('10:00'));
    it(
      'cannot be added to object',
      addFailureScenario({ value: 100, coefficient: 1 })
    );
  });
});
