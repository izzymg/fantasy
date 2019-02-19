const Koa = require("koa");
const server = new Koa();
const config = require("../../config/config");
const middles = require("../middles");

server.proxy = config.proxy;

if(config.api.allowCors) {
  server.use(middles.cors());
}

server.use(
  middles.logRequest(
    config.api.logLevel === null ? false : true, 
    config.api.logLevel === "debug" ? true : false, 
    config.api.log
  )
);

server.use(
  middles.handleErrors(`${new Date(Date.now())} API server error `,
    config.enableLogging && config.logInternalErrors ? config.api.log : null,
    config.consoleErrors ? true : false
  )
);

const boards = require("./routes/boards");

server.use(boards.allowedMethods());
server.use(boards.routes());

module.exports = server;