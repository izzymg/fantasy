// Fantasy Imageboard entry point

const Koa = require("koa");
const http = require("http");
const cors = require("@koa/cors");
const config = require("../config/config");
const dbConnection = require("./db/connection");
const dbInitTables = require("./db/initTables");
const routing = require("./routing");
const libs = require("./libs");
const healthCheck = require("./tools/healthCheck");

let _httpServer;
const fantasy = new Koa();

function init() {
  // Proxy option must be set for Koa to recognise X-Forwarded-For IP address
  if(config.proxy) fantasy.proxy = true;

  // Allow cors
  if(config.api.allowCors) {
    fantasy.use(cors({
      origin: config.api.allowCors,
      credentials: config.api.allowCorsCredentials,
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

  fantasy.use(routing);

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

function onFatal(error) {
  console.error(error);
  process.exit(1);
}

async function boot() {
  console.log("Fantasy started");
  await dbConnection.start();
  await libs.logger.init(config.logLevel, config.logFile);
  if(config.healthCheck) {
    await healthCheck(console.log, console.warn, onFatal);
  }
  if(config.initTables) {
    await dbInitTables(console.log, onFatal);
  }
  process.on("unhandledRejection", function(error) {
    console.error("Fatal: Unhandled Promise Rejection:", error);
    process.exit(1);
  }); 
  process.on("SIGINT", end);
  process.on("SIGTERM", end);
  init();
}

boot().then(() => {

}).catch((error) => {
  console.error(`Fantasy failed to start: ${error}`);
  process.exit(1);
});