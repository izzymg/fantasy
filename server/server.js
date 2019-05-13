// Fantasy Imageboard API/server entrypoint

const api = require("./api");

function onFatal(error) {
  console.error(error);
  process.exit(1);
}

api.start(console.log, console.warn, onFatal).then(({ host, port, }) => {
  console.log(`Fantasy started on ${host} ${port}`);
  async function exit() {
    console.log("Fantasy exiting...");
    await api.end();
    process.exit(0);
  }
  process.on("SIGINT", exit);
  process.on("SIGTERM", exit);
});