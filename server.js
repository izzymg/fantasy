const config = require("./config/config");

process.on("warning", (e) => console.warn(e.stack));

if(config.env !== "production" && config.env !== "development") {
  config.env = "production";
  console.warn("Warning: ZThree defaulting to production mode. Set config.env correctly.");
}

console.log(`ZThree starting in ${config.env} mode. Send SIGINT or SIGTERM to cleanly exit.`);

const apiService = require("./api/service");
const siteService = require("./ssr/service");
const fileService = require("./files/service");

const persistence = require("./db/persistence");

persistence.initialize().then(() => {
  init();
}).catch((e) => {
  console.error("Error initialising persistence", e);
});

async function init() {
  
  try {
    await siteService();
    await fileService();
    await apiService();
  } catch(error) {
    return console.error("Failed to start server", error);
  }

  async function onExit(sig) {
    console.log(`Received ${sig}, exiting`);
    await persistence.end();
    process.exit(0);
  }

  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
}
