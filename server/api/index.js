// API HTTP server bootstrap

const Koa = require("koa");
const http = require("http");
const cors = require("@koa/cors");
const config = require("../config/config");
const db = require("./persistent/db");
const logger = require("./persistent/logger");
const routing = require("./routing");
const healthCheck = require("./tools/healthCheck");

let _httpServer = null;
const fantasy = new Koa();

/**
 * Error handling middleware
*/
async function errorHandler(ctx, next) {
  logger.log.info(ctx.request);
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
    logger.log.error(error);
    // Never expose 500 errors
    ctx.body = "Internal server error, status 500";
    ctx.status = 500;
  }
}

/**
 * Create and run HTTP server
 * @returns { Object } Host, port
*/
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

  // Error handling and routing
  fantasy.use(errorHandler);
  fantasy.use(routing);

  // Start server
  exports.rawHttpServer = _httpServer = http.createServer(
    fantasy.callback()).listen(
    config.api.port, config.api.host, function() {
      logger.log.info(`Fantasy listening on ${config.api.host}:${config.api.port}`);
    });
  return { host: config.api.host, port: config.api.port, };
}

/**
 * Provides access to the raw HTTP server, can be null
*/
exports.rawHttpServer = _httpServer;

/**
 * HTTP server boot
*/
const noop = (msg) => { msg; };
exports.start = async function(
  onMessage = noop, onWarning = noop,
  onError = (err) => { throw err; }) {
  try {
    if(config.healthCheck) {
      await healthCheck(onMessage, onWarning, onError);
    }
    return init();
  } catch(error) {
    onError(error);
  }
};

/**
 * Tries to gracefully end database connection and http server
*/
exports.end = async function() {
  logger.end();
  await db.end();
  if(_httpServer) {
    _httpServer.close();
  }
  exports.rawHttpServer = _httpServer = null;
};