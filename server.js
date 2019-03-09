const persistence = require("./db/persistence");
const api = require("./api/server");
const config = require("./config/config");

console.log("Fantasy starting in", config.env, "mode");

persistence.initialize().then(function() {
  try {
    api.start();
    if(config.ssr.enabled) {
      const ssr = require("./ssr/server");
      ssr.start();
    }
  } catch(error) {
    console.error("Error starting Fantasy", error);
    process.exit(1);
  }
}).catch(function(error) {
  console.error("Error initializing persistence", error);
});