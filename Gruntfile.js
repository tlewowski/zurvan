module.exports = function(grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-istanbul');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-madge');

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
      files : [ '*.js', 'tests' ],
      tasks : 'default'
    },
    jshint : {
      files : ['*.js', 'detail', 'tests' ],
	},
	madge: {
	  options: {
	    format: 'cjs'
	  },
	  all: ['*.js', 'tests', 'detail']
	},
    mocha_istanbul: {
        coverage: {
            src: 'tests'
        }
    }
  });

  grunt.registerTask('default', 'mochaTest');  
};