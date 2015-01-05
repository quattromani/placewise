module.exports = function(grunt) {

    // load all grunt tasks matching the `grunt-*` pattern
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),

      concat: {
        dist: {
          src: [
          'js/*.js',
          'sandbox/*/js/*.js'
          ],
          dest: 'js/build/production.js',
        }
      },

      uglify: {
        build: {
          src: 'js/build/production.js',
          dest: 'js/build/production.min.js'
        }
      },

      sass: {
        dist: {
          options: {
            style: 'expanded'
          },
          files: [{
            expand: true,
            cwd: 'css/scss/partials',
            src: ['*.scss'],
            dest: 'css/partials',
            ext: '.css'
          }],
          'main.css': 'main.scss',
        },
        dev: {
          files: [{'css/main.css': 'css/scss/main.scss'}]
        }
      },

      autoprefixer: {
        prefix: {
          src: 'css/main.css',
          dest: 'css/main.css'
        },
      },

      cssmin: {
        build: {
          src: 'css/main.css',
          dest: 'css/build/main.min.css'
        }
      },

      imagemin: {
        dynamic: {
          files: [{
            expand: true,
            cwd: 'images/orig_assets',
            src: ['*.{png,jpg,gif}'],
            dest: 'images'
          }]
        }
      },

      markdown: {
        all: {
          files: [{
          expand: true,
          src: ['**/*.md', '!node_modules/**/*.md', '!**/README.md'],
          ext: '.html'
        }]
        }
      },

      watch: {
        options: {
          livereload: true
        },
        scripts: {
          files: ['js/*.js', 'sandbox/*/js/*.js'],
          tasks: ['concat', 'uglify'],
        },
        css: {
          files: ['css/scss/globals/*.scss','css/scss/partials/*.scss','css/scss/theme/*.scss', 'sandbox/*/css/scss/*.scss'],
          tasks: ['sass', 'cssmin', 'autoprefixer'],
        }
      }

    });

grunt.loadNpmTasks('grunt-contrib');

grunt.registerTask('build', ['concat', 'uglify', 'sass', 'autoprefixer', 'cssmin', 'imagemin', 'markdown', 'watch']);
grunt.registerTask('dev', ['concat', 'uglify', 'sass', 'autoprefixer', 'cssmin', 'watch']);
grunt.registerTask('js', ['concat', 'uglify', 'watch']);
grunt.registerTask('css', ['sass', 'autoprefixer', 'cssmin', 'watch']);
grunt.registerTask('default', ['watch']);

};
