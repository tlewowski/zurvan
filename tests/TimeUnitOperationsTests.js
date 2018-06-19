'use strict';
var TimeUnit = require('../TimeUnit');
var assert = require('assert');

describe('Two TimeUnits', function() {
  it('can be added, which mutates one of them', function(done) {
    var hour = TimeUnit.hours(1);
    var quarter = TimeUnit.minutes(15);

    assert.equal(hour.add(quarter).toMinutes(), 75);
    assert.equal(hour.toMinutes(), 75);

    var second = TimeUnit.nanoseconds(1e9);
    assert.equal(second.add(quarter).toSeconds(), 901);
    assert.equal(second.toSeconds(), 901);

    done();
  });

  it('can be used to calculate time extended both, without mutating arguments', function(done) {
    var hour = TimeUnit.hours(1);
    var quarter = TimeUnit.nanoseconds(TimeUnit.minutes(15).toNanoseconds());

    assert.equal(hour.extended(quarter).toMinutes(), 75);
    assert.equal(hour.toMinutes(), 60);

    done();
  });

  it('can be used to set one another value', function(done) {
    var tenSeconds = TimeUnit.microseconds(
      TimeUnit.seconds(10).toMicroseconds()
    );
    var week = TimeUnit.days(7);

    week.setTo(tenSeconds);
    assert.equal(week.toMilliseconds(), tenSeconds.toMilliseconds());

    done();
  });

  it('can be used to calculate time difference, mutatning one argument', function(done) {
    var tenSeconds = TimeUnit.seconds(10);
    var minute = TimeUnit.minutes(1);

    // behavior is a little weird - it's not meant for this use case
    var diff1 = minute.subtract(tenSeconds);
    var diff2 = tenSeconds.subtract(minute);

    assert.equal(diff1.toSeconds(), 50);
    assert.equal(minute.toSeconds(), 50);
    assert.equal(diff2.toSeconds(), -40);
    assert.equal(tenSeconds.toSeconds(), -40);

    done();
  });

  it('can be used to calculate time shortened, without mutating any argument', function(done) {
    var hour = TimeUnit.hours(1);
    var quarter = TimeUnit.seconds(TimeUnit.minutes(15).toSeconds());

    assert.equal(hour.shortened(quarter).toMinutes(), 45);
    assert.equal(hour.toMinutes(), 60);

    done();
  });

  it('can be used to calculate time shortened but may have floating-point errors in case of decimal places', function(done) {
    var hour = TimeUnit.hours(1);
    var quarter = TimeUnit.nanoseconds(TimeUnit.minutes(15).toNanoseconds());

    assert(Math.abs(hour.shortened(quarter).toMinutes() - 45) < 1e-12);
    assert.equal(hour.toMinutes(), 60);

    done();
  });
});
