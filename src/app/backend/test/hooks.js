let tpProcess;
let dockerProcess;
let backendProcess;
const { spawn } = require("child_process");
const kill = require("tree-kill");
const shell = require("shelljs");
exports.mochaHooks = {
  beforeAll: function (done) {
    this.timeout(30000);
    setTimeout(done, 6000);
  },
  beforeAllBk: function (done) {
    this.timeout(30000);
    tpProcess = shell.exec("npm --prefix ../transaction_processor run start", {
      async: true,
      silent: true,
    });
    dockerProcess = shell.exec(
      "docker-compose -f ../../../blockchain_network/docker-compose-dev/sawtooth/docker-compose.yaml up",
      {
        async: true,
        silent: true,
      }
    );
    setTimeout(() => {
      backendProcess = shell.exec("npm run start", {
        async: true,
        silent: true,
      });
    }, 20000);
    setTimeout(() => {
      done();
    }, 25000);
  },
  afterAllBk: function (done) {
    try {
      kill(dockerProcess.pid);
      kill(tpProcess.pid);
      kill(backendProcess.pid);
    } catch (error) {
      console.log(error);
    }

    spawn(
      "gnome-terminal",
      [
        "--disable-factory",

        "--",
        "bash -c 'docker-compose -f ../../../blockchain_network/docker-compose-dev/sawtooth/docker-compose.yaml down;exec bash'",
      ],
      { detached: true, shell: true }
    );
    spawn(
      "gnome-terminal",
      [
        "--disable-factory",
        "--",
        `bash -c 'sudo kill -9 $(sudo lsof -t -i:${
          process.env.PORT || "3000"
        })'`,
      ],
      { detached: true, shell: true }
    );
    done();
  },
};
