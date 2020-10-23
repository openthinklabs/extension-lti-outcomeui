module.exports = function(grunt) {
    'use strict';

    var root    = grunt.option('root') + '/ltiOutcomeUi/views/';
    var pluginDir = root + 'js/previewer/plugins/';

    grunt.config.merge({
        sass : {
            ltioutcomeui: {
                files : [{
                    expand: true,
                    src: root + 'js/**/scss/*.scss',
                    rename : function rename(dest, src){
                        return src.replace(/scss/g, 'css');
                    }
                }]
            },
        },
        watch : {
            ltioutcomeuisass : {
                files : [root + 'scss/**/*.scss', pluginDir + '**/*.scss'],
                tasks : ['sass:ltioutcomeui'],
                options : {
                    debounceDelay : 1000
                }
            }
        },
        notify : {
            ltioutcomeuisass : {
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
