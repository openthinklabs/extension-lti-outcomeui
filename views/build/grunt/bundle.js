module.exports = function(grunt) { 

    var requirejs   = grunt.config('requirejs') || {};
    var clean       = grunt.config('clean') || {};
    var copy        = grunt.config('copy') || {};

    var root        = grunt.option('root');
    var libs        = grunt.option('mainlibs');
    var ext         = require(root + '/tao/views/build/tasks/helpers/extensions')(grunt, root);
    var out         = 'output';

    /**
     * Remove bundled and bundling files
     */
    clean.ltioutcomeuibundle = [out];
    
    /**
     * Compile tao files into a bundle 
     */
    requirejs.ltioutcomeuibundle = {
        options: {
            baseUrl : '../js',
            dir : out,
            mainConfigFile : './config/requirejs.build.js',
            paths : { 'ltiOutcomeUi' : root + '/ltiOutcomeUi/views/js' },
            modules : [{
                name: 'ltiOutcomeUi/controller/routes',
                include : ext.getExtensionsControllers(['ltiOutcomeUi']),
                exclude : ['mathJax'].concat(libs)
            }]
        }
    };

    /**
     * copy the bundles to the right place
     */
    copy.ltideliveryproviderbundle = {
        files: [
            { src: [out + '/ltiOutcomeUi/controller/routes.js'],  dest: root + '/ltiOutcomeUi/views/js/controllers.min.js' },
            { src: [out + '/ltiOutcomeUi/controller/routes.js.map'],  dest: root + '/ltiOutcomeUi/views/js/controllers.min.js.map' }
        ]
    };

    grunt.config('clean', clean);
    grunt.config('requirejs', requirejs);
    grunt.config('copy', copy);

    // bundle task
    grunt.registerTask('ltioutcomeuibundle', ['clean:ltioutcomeuibundle', 'requirejs:ltioutcomeuibundle', 'copy:ltioutcomeuibundle']);
};
