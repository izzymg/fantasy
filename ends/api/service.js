const Koa = require("koa");
const server = new Koa();

const boards = require("./routes/boards");

server.use(boards.allowedMethods());
server.use(boards.routes());

module.exports = server;