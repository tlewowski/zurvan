"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");
var TimeUnit = require("../TimeUnit");

/*
  Example below is the trickies case zurvan may be used - all async methods (setImmediate/process.nextTick and Promise)
  are used. I suppose it _might_ be possible to bypass zurvan's waitForEmptyQueue mechanism
  the please increase number of requested cycles (numberOfCyclesOnEventLoop configuration parameter)
  
  Mocha structure is used to make sure that examples will stay up-to-date with library code
*/

describe('zurvan tricky example', function() {
  it('single loop failure', function() {	
	var holder = [];
	var i = 0;
	
	return zurvan.interceptTimers()  
      .then(function() {
		setImmediate(function() {
		  holder.push(i++); //0
		  
		  process.nextTick(function() {
			holder.push(i++); //1
			setImmediate(function() {
				holder.push(i++); //2
				process.nextTick(function() {
					holder.push(i++); //3
					setImmediate(function() {
					  holder.push(i++); //4
					  process.nextTick(function() {
						holder.push(i++); //5
						setImmediate(function() {
							holder.push(i++); //6
							process.nextTick(function() {
							  holder.push(i++); //7
							  setImmediate(function() {
								holder.push(i++); //8
								process.nextTick(function() {
									holder.push(i++); //9
									setImmediate(function() {
										holder.push(i++); //10
										process.nextTick(function() {
											holder.push(i++); //11
											setImmediate(function() {
												holder.push(i++); //12
												process.nextTick(function() {
													holder.push(i++); //13
													setImmediate(function() {
														holder.push(i++); //14
														process.nextTick(function() {
															holder.push(i++); //15
															process.nextTick(function() {
																holder.push(i++); //16
																process.nextTick(function() {
																	holder.push(i++); //17
																	setImmediate(function() {
																		holder.push(i++); //18
																		setImmediate(function() {
																			holder.push(i++); //19
																			setImmediate(function() {
																				holder.push(i++); //20
																				process.nextTick(function() {
																					holder.push(i++); //21
																					Promise.resolve().
																					  then(function() {
																						holder.push(i++); //22
																					  }).then(function() {
																						holder.push(i++); //23
																					  });
																				});
																			});
																		});
																	});
																});
															});
														});
													});
												});
											});
										});
									});
								});
							  });
							});
						});
					  });
					});
				});
			});
		  });
		});
		
		// just wait for everything to happen
    	return zurvan.waitForEmptyQueue();
	  }).then(function() {  
	    // placeholder was filled before resolving "wait" promise
	    assert(holder.length === i);
	  
	    // perform cleanup
	    return zurvan.releaseTimers();
	  });
  });
});