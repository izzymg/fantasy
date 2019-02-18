console.log("ZThree starting, press CTRL-C/sigint/sigterm to exit");

const config = require("./config/config");

const http = require("http");
const https = require("https");

const apiService = require("./ends/api/service");
const siteService = require("./ends/site/service");
const fileService = require("./ends/files/service");

const persistence = require("./ends/persistence");

let servers = [];
process.env.NODE_ENV = process.env.NODE_ENV || "production";

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
  if (config.site.https) {
    servers.push(https.createServer(siteService.callback())
      .listen(config.site.httpsPort, config.site.host, () => {
        console.log(`Site HTTPS detected: listening ${
          config.site.host
        }:${config.site.httpsPort}`);
      })
    );
  }

  // API
  servers.push(http.createServer(apiService.callback()).
    listen(config.api.port, config.api.host, () => {
      console.log(`API listening ${config.api.host}:${config.api.port}`);
    })
  );

  if (config.api.https) {
    servers.push(https.createServer(apiService.callback())
      .listen(config.api.httpsPort, config.api.host, () => {
        console.log(`API HTTPS detected: listening ${
          config.api.host
        }:${config.api.httpsPort}`);
      })
    );
  }

  // Files
  servers.push(http.createServer(fileService.callback())
    .listen(config.files.port, config.files.host, () => {
      console.log(`File server listening ${
        config.files.host
      }:${config.files.port}`);
    })
  );
  if(config.files.https){
    servers.push(https.createServer(fileService.callback())
      .listen(config.files.httpsPort, config.files.host, () => {
        console.log(`File server HTTPS detected: listening ${
          config.files.host
        }:${config.files.httpsPort}`);
      })
    );
  }

  async function onExit(sig) {
    console.log(`Received ${sig}, exiting`);
    servers.forEach((server) => server.close());
    await persistence.end();
    process.exit(0);
  }

  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
}
