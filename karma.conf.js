module.exports = function(config) {
  config.set({
    frameworks: ['browserify', 'mocha'],
    files: [
      'tests/**.js',
      'examples/**.js'
    ],
    preprocessors: {
        'tests/**.js': ['browserify'],
        'examples/**.js': ['browserify']
    },
    client: {      
        mocha: {
            reporter: 'html'
        }
    },
    browsers: ['PhantomJS'],
    phantomjsLauncher: {
        exitOnResourceError: true
    },
    browserify: {
        debug: true
    }
  });
};