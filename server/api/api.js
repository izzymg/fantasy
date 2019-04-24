// Fantasy Imageboard entry point

const Koa = require("koa");
const http = require("http");
const cors = require("@koa/cors");
const config = require("../config/config");
const dbConnection = require("./db/connection");
const router = require("./router");
const libs = require("./libs");

let _httpServer;
const fantasy = new Koa();

function init() {
  // Proxy option must be set for Koa to recognise X-Forwarded-For IP address
  if(config.proxy) fantasy.proxy = true;

  // Allow cors
  if(config.api.allowCors) {
    fantasy.use(cors({
      origin: config.api.allowCors,
      credentials: config.api.allowCorsCredentials
    }));
  }

  // Error handling
  fantasy.use(async function(ctx, next) {
    libs.logger.log.info(ctx.request);
    try {
      await next();
    } catch(error) {
      const status = error.status || 500;
      if(status !== 500) {
        ctx.status = error.status;
        ctx.body = error.message || `Status ${error.status}`;
        return;
      }
      if(config.consoleLogErrors) {
        console.error(error);
      }
      libs.logger.log.error(error);
      // Never expose 500 errors
      ctx.body = "Internal server error, status 500";
      ctx.status = 500;
      return;
    }
  });

  fantasy.use(router);

  _httpServer = http.createServer(fantasy.callback())
    .listen(config.api.port, config.api.host, function() {
      const started = `Fantasy listening on ${config.api.host}:${config.api.port}`;
      console.log(started);
      libs.logger.log.info(started);
    });
}

// Try to gracefully end database conn and http server
function end() {
  dbConnection.end().then(() => {
    _httpServer.close();
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
  return;
}

console.log("Fantasy started, establishing DB connections");
// Initialise database and logger
dbConnection.start().then(() => {
  console.log("DB connection started");
  libs.logger.init(config.logLevel, config.logFile);
  init();
  // Kill everything on unhandled rejection
  process.on("unhandledRejection", function(error) {
    console.error("Fatal: Unhandled Promise Rejection:", error);
    process.exit(1);
  }); 
  process.on("SIGINT", end);
  process.on("SIGTERM", end);
}).catch((error) => {
  console.error("Fatal: Failed to initialise db:", error);
  process.exit(1);
});