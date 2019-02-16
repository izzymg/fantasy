const Koa = require("koa");
const server = new Koa();
const config = require("../../config/config");
const gMiddleware = require("../gMiddleware");

if(config.private) {
    const privates = require("./routes/privates");
    server.use(privates.routes());
    server.use(gMiddleware.requirePrivate(config.privateKey));
}

const boards = require("./routes/boards");

server.use(boards.allowedMethods());
server.use(boards.routes());

module.exports = server;