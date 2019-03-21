const api = require("./api/server");
const config = require("./config/config");
console.log("Fantasy starting in", config.env, "mode");

function end(sig) {
  console.log("Recieved", sig, ", exiting");
  api.end();
  process.exit(0);
}

try {
  api.start();
  process.on("SIGINT", end);
  process.on("SIGTERM", end);
} catch(error) {
  console.error("Error starting Fantasy", error);
  process.exit(1);
}