// Licensed under Gnu Public Licence version 2
// Copyright (c) 2020 (original work) Open Assessment Technologies SA ;

module.exports = function(grunt) {
  "use strict";

  grunt.config.merge({
    bundle: {
      ltioutcomeui: {
        options: {
          extension: "ltiOutcomeUi",
          outputDir: "loader",
          dependencies: ["taoItems"],
          bundles: [
            {
              name: "ltiOutcomeUi",
              default: true,
              babel: true
            }
          ]
        }
      }
    }
  });

  // bundle task
  grunt.registerTask("ltioutcomeuibundle", ["bundle:ltioutcomeui"]);
};
