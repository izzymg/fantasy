const Koa = require("koa");
const server = new Koa();
const middles = require("../middles");
const config = require("../../config/config");

server.proxy = config.proxy;

server.use(
  middles.logRequest(
    config.site.logLevel === null ? false : true, 
    config.site.logLevel === "debug" ? true : false, 
    config.site.log
  )
);

server.use(
  middles.handleErrors(`${new Date(Date.now())} Site server error `,
    config.enableLogging && config.logInternalErrors ? config.site.log : null,
    config.consoleErrors ? true : false
  )
);

module.exports = server;