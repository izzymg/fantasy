const Koa = require("koa");
const server = new Koa();
const http = require("http");
const cors = require("@koa/cors");
const config = require("../config/config");
const persistence = require("./db/persistence");
const dbConnection = require("./db/connection");
const authRoute = require("./routes/auth");
const boardsRoute = require("./routes/boards");
const postsRoute = require("./routes/posts");
const bansRoute = require("./routes/bans");
const newRoute = require("./routes/newRoute");
const { logRequestTime, handleErrors } = require("../libs/middleware");

let httpServer;

if(config.api.allowCors) {
  server.use(cors({ origin: config.api.allowCors, credentials: config.api.allowCorsCredentials }));
}

if(config.logRequestTime) {
  server.use(logRequestTime(config.infoLog));
}

server.use(handleErrors(
  config.logErrors ? config.errorLog : null,
  config.consoleErrors, config.logAllErrors)
);

if(config.proxy) server.proxy = true;

server.use(authRoute);
server.use(boardsRoute);
server.use(postsRoute);
server.use(bansRoute);
server.use(newRoute);

exports.start = function() {
  dbConnection.start().then(() => {
    persistence.start().then(() => {
      httpServer = http.createServer(server.callback())
        .listen(config.api.port, config.api.host, function() {
          console.log(`API listening on ${config.api.host}:${config.api.port}`);
        });
    }).catch((error) => {
      console.error("API failed to start database", error);
    });
  });
};

exports.end = function() {
  console.log("API exiting");
  persistence.end().then(() => {
    httpServer.close();
  }).catch((error) => {
    console.error("API failed to close database", error);
  });
  return;
};