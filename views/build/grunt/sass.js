module.exports = function(grunt) {
    'use strict';

    var root    = grunt.option('root') + '/ltioutcomeui/views/';

    let css = 'themes/platform/default/theme';
    grunt.config.merge({
        sass: {
            ltioutcomeui: {
                files: [
                    {
                        src: root + 'js/previewer/plugins/content/scss/highlighterTray.scss',
                        dest: root + 'js/previewer/plugins/content/css/highlighterTray.css'
                    }
                ],
            }
        },

        watch: {
            ltioutcomeuisass: {
                files: [root + 'scss/**/*.scss'],
                tasks: ['sass:ltioutcomeui', 'notify:ltioutcomeuisass'],
                options: {
                    debounceDelay: 1000
                }
            }
        },

        notify: {
            ltioutcomeuisass: {
                options: {
                    title: 'Grunt SASS',
                    message: 'SASS files compiled to CSS'
                }
            }
        }
    });

    //register an alias for main build
    grunt.registerTask('ltioutcomeuisass', ['sass:ltioutcomeui']);
};
