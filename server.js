const config = require("./config/config");

process.on("warning", (e) => console.warn(e.stack));

if(config.env !== "production" && config.env !== "development") {
  config.env = "production";
  console.warn("Warning: ZThree defaulting to production mode. Set config.env correctly.");
}

console.log(`ZThree starting in ${config.env} mode. Send SIGINT or SIGTERM to cleanly exit.`);

const http = require("http");

const apiService = require("./ends/api/service");
const authService = require("./ends/auth/service");
const siteService = require("./ends/site/service");
const fileService = require("./ends/files/service");

const persistence = require("./ends/persistence");

let servers = [];


persistence.initialize().then(() => {
  init();
}).catch((e) => {
  console.error("Error initialising persistence", e);
});

function init() {
  
  // Site
  servers.push(http.createServer(siteService.callback())
    .listen(config.site.port, config.site.host, () => {
      console.log(`Site listening ${config.site.host}:${config.site.port}`);
    })
  );

  // Auth
  servers.push(http.createServer(authService.callback())
    .listen(config.auth.port, config.auth.host, () => {
      console.log(`Auth listening ${config.auth.host}:${config.auth.port}`);
    })
  );

  // API
  servers.push(http.createServer(apiService.callback()).
    listen(config.api.port, config.api.host, () => {
      console.log(`API listening ${config.api.host}:${config.api.port}`);
    })
  );

  // Files
  servers.push(http.createServer(fileService.callback())
    .listen(config.files.port, config.files.host, () => {
      console.log(`File server listening ${
        config.files.host
      }:${config.files.port}`);
    })
  );

  servers.forEach((server) => server.env = config.env);

  async function onExit(sig) {
    console.log(`Received ${sig}, exiting`);
    servers.forEach((server) => server.close());
    await persistence.end();
    process.exit(0);
  }

  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
}
