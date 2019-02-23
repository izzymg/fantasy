// HTTP server factory
const Koa = require("koa");
const config = require("../config/config");
const fileFunctions = require("../libs/fs");
const cors = require("@koa/cors");

// Wait on listen callback
function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    try {
      server.listen(port, host, () => {
        resolve({ host, port });
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = async function(router, {
  host,
  port,
  allowCors = null,
  allowCorsCredentials = null,
  logLevel = null,
  log
}) {
  const server = new Koa();
  server.proxy = config.proxy;

  if (allowCors) {
    server.use(cors({ origin: allowCors, credentials:  allowCorsCredentials}));
  }

  if (logLevel) {
    server.use(async(ctx, next) => {
      let writeOut = `${new Date(Date.now()).toLocaleString()}: `;
      if (logLevel == "debug") {
        // Write traffic info on debug levels
        writeOut += `IP: ${ctx.ip}, Method: ${ctx.method}, Url: ${
          ctx.url}, Protocol: ${ctx.protocol}, Secure: ${ctx.secure || false}`;
      }
      // Add request time always
      const start = Date.now();
      await next();
      const timeTaken = Date.now() - start;
      writeOut += `\n\tResponse time: ${timeTaken}ms`;
      fileFunctions.writeAppend(log, writeOut + "\n");
    });
  }
  if(router) {
    server.use(router.routes());
  }
  return await listen(server, host, port);
};