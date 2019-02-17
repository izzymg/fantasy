const Koa = require("koa");
const server = new Koa();
const config = require("../../config/config");
const middles = require("../middles");

if(config.private) {
    const privates = require("./routes/privates");
    server.use(privates.routes());
    server.use(middles.requirePrivate(config.privateKey));
}

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