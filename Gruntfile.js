"use strict";
const loadTasks = require("load-grunt-tasks");

module.exports = function (grunt) {
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-string-replace");
  loadTasks(grunt);
  const configObject = {
    pkg: grunt.file.readJSON("package.json"),
    eslint: {
      options: {
        configFile: ".eslintrc.js",
        fix: true,
      },
      target: [
        "src/app/backend/bin/*.js",
        "src/app/backend/controllers/*.js",
        "src/app/backend/database/*.js",
        "src/app/backend/models/*.js",
        "src/app/backend/test/*.js",
        "src/app/backend/routes/*.js",
        "src/app/backend/sawtooth/*.js",
        "src/app/backend/utils/*.js",
        "src/app/backend/validators/*.js",
        "src/app/backend/resources/*.js",
      ],
    },
    uglify: {},
    "string-replace": {},
  };
  // Project configuration.
  grunt.initConfig(configObject);

  grunt.task.registerTask("minifyJS", () => {
    const config = {
      all_vendor_js: {
        files: [
          {
            expand: true,
            cwd: "src/app/backend",
            src: ["*.js", "!*.min.js", "!ecosystem.config.js"],
            dest: "build/app/backend",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/bin",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/bin",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/controllers",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/controllers",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/database",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/database",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/resources",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/resources",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/resources/locales",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/resources/locales",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/resources/docs",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/resources/docs",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/routes",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/routes",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/sawtooth",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/sawtooth",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/models",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/models",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/enforcer",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/enforcer",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/database/utils",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/database/utils",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/utils",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/utils",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/utils/constants",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/utils/constants",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/utils/init",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/utils/init",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/utils/logger",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/utils/logger",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/utils/signature",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/utils/signature",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/utils/errors",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/utils/errors",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/backend/validators",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/backend/validators",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/helpers",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/helpers",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/utils/constants",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/utils/constants",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/utils/logger",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/utils/logger",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/models",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/models",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/validators",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/validators",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/controllers",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/controllers",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/utils/init",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/utils/init",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor/utils/errors",
            src: ["*.js", "!*.min.js"],
            dest: "build/app/transaction_processor/utils/errors",
            ext: ".js",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor",
            src: ["*.js", "!*.min.js", "!ecosystem.config.js"],
            dest: "build/app/transaction_processor",
            ext: ".js",
          },
        ],
      },
    };

    grunt.config("uglify", config);
    grunt.task.run(["uglify"]);
  });

  grunt.task.registerTask("copyDependencies", () => {
    const config = {
      main: {
        files: [
          {
            expand: true,
            cwd: "src/app/backend",
            src: "*.{json,env}",
            dest: "build/app/backend/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/backend",
            src: ".env",
            dest: "build/app/backend/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/backend",
            src: ".dockerignore",
            dest: "build/app/backend/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/backend",
            src: "Dockerfile",
            dest: "build/app/backend/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/backend",
            src: "ecosystem.config.js",
            dest: "build/app/backend/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/backend/resources/locales",
            src: ["**"],
            dest: "build/app/backend/resources/locales/",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor",
            src: "*.{json,env}",
            dest: "build/app/transaction_processor/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor",
            src: ".env",
            dest: "build/app/transaction_processor/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor",
            src: ".dockerignore",
            dest: "build/app/transaction_processor/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor",
            src: "Dockerfile",
            dest: "build/app/transaction_processor/",
            filter: "isFile",
          },
          {
            expand: true,
            cwd: "src/app/transaction_processor",
            src: "ecosystem.config.js",
            dest: "build/app/transaction_processor/",
            filter: "isFile",
          },
        ],
      },
    };

    grunt.config("copy", config);
    grunt.task.run(["copy"]);
  });
  grunt.task.registerTask("replaceBuildScript", () => {
    const config = {
      inline: {
        files: [
          {
            src: "build/app/backend/package.json",
            dest: "build/app/backend/package.json",
            filter: "isFile",
          },
          {
            src: "build/app/backend/.env",
            dest: "build/app/backend/.env",
            filter: "isFile",
          },
        ],
        options: {
          replacements: [
            // place files inline example
            {
              pattern: `node ./bin/www.js`,
              replacement: "NODE_ENV=production node ./bin/www.js",
            },
            {
              pattern: `ALLOW_DEV_ENV_CHANGES=true`,
              replacement: "ALLOW_DEV_ENV_CHANGES=false",
            },
          ],
        },
      },
    };

    grunt.config("string-replace", config);
    grunt.task.run(["string-replace"]);
  });

  // Default task(s).
  grunt.registerTask("default", [
    "minifyJS",
    "copyDependencies",
    "replaceBuildScript",
  ]);
};
