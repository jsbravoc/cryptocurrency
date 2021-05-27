module.exports = [
  {
    script: "npm",
    args: "start",
    name: "crypto-api",
    exec_mode: "cluster",
    instances: "max",
  },
];
