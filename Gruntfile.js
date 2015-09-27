module.exports = function(grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-madge');

  var allFiles = ['*.js', 'detail', 'tests', 'examples' ];
  
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt',
        },
        src: ['tests/*.js', 'examples/*.js']
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
            src: ['tests', 'examples']
        }
    }
  });

  grunt.registerTask('default', 'mochaTest');  
};