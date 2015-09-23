module.exports = function(grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-madge');

  var allFiles = ['*.js', 'detail', 'tests' ];
  
  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt', // Optionally capture the reporter output to a file
        },
        src: ['tests/*.js']
      }
    },
    watch : {
      files : allFiles,
      tasks : 'default'
    },
    jshint : {
      files : allFiles
	},
	madge: {
	  all: allFiles
	},
    mocha_istanbul: {
        coverage: {
            src: 'tests'
        }
    }
  });

  grunt.registerTask('default', 'mochaTest');  
};