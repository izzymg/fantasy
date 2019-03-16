const Koa = require("koa");
const server = new Koa();
const cors = require("@koa/cors");
const config = require("../config/config");
const authRoute = require("./routes/auth");
const boardsRoute = require("./routes/boards");
const postsRoute = require("./routes/posts");
const { logRequestTime, handleErrors } = require("../libs/middleware");


if(config.api.allowCors) {
  server.use(cors({ origin: config.api.allowCors, credentials: config.api.allowCorsCredentials }));
}

if(config.logRequestTime) {
  server.use(logRequestTime(config.infoLog));
}

server.use(handleErrors(config.logErrors ? config.errorLog : null, config.consoleErrors));

if(config.proxy) server.proxy = true;

server.use(authRoute);
server.use(boardsRoute);
server.use(postsRoute);

exports.start = function() {
  server.listen(config.api.port, config.api.host, function() {
    console.log(`API server listening on ${config.api.host}:${config.api.port}`);
  });
};