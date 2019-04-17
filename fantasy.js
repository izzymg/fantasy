// Fantasy Imageboard entry point

const Koa = require("koa");
const http = require("http");
const cors = require("@koa/cors");
const config = require("./config/config");
const dbConnection = require("./db/connection");
const api = require("./api");
const pino = require("pino");

let httpServer;
const server = new Koa();
const logger = pino({
  level: config.logLevel,
}, pino.destination(config.logFile));

// Kill everything on unhandled rejection
process.on("unhandledRejection", function(error) {
  console.error("Unhandled Promise Rejection occured:", error);
  logger.fatal(error);
  process.exit(1);
}); 

// Proxy option must be set for Koa to recognise X-Forwarded-For IP address
if(config.proxy) server.proxy = true;

// Global middlewares

server.use(async function(ctx, next) {
  ctx.log = logger;
  await next();
});

if(config.api.allowCors) {
  server.use(cors({ origin: config.api.allowCors, credentials: config.api.allowCorsCredentials }));
}

server.use(async function(ctx, next) {
  try {
    ctx.log.info(ctx.request);
    await next();
  } catch(error) {
    const status = error.status || 500;
    if(status !== 500) {
      ctx.log.info(error);
      ctx.status = error.status;
      ctx.body = error.message || `Status ${error.status}`;
      return;
    }
    if(config.consoleLogErrors) {
      console.error(error);
    }
    ctx.log.error(error);
    // Never expose 500 errors
    ctx.body = "Internal server error, status 500";
    ctx.status = 500;
    return;
  }
});

// API exported router
server.use(api);

// Database connection must boot before server is started
// TODO: better solution to this
dbConnection.start().then(() => {
  httpServer = http.createServer(server.callback())
    .listen(config.api.port, config.api.host, function() {
      const started = `Fantasy listening on ${config.api.host}:${config.api.port}`;
      logger.info(started);
      // Don't even console log if fantasy is silent
      if(config.logLevel) {
        console.log(started);
      }
    });
}).catch((error) => {
  logger.fatal(error);
  process.exit(1);
});

function end() {
  dbConnection.end().then(() => {
    httpServer.close();
    const ended = "Fantasy exited successfully";
    logger.info(ended);
    if(config.logLevel) {
      console.log(ended);
    }
  }).catch((error) => {
    logger.fatal(error);
    if(config.logLevel) {
      console.error(error);
    }
  });
  return;
}

process.on("SIGINT", end);
process.on("SIGTERM", end);
