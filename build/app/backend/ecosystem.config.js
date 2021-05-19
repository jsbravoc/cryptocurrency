module.exports = [
  {
    script: "bin/www.js",
    name: "crypto-api",
    exec_mode: "cluster",
    instances: "max",
  },
];
