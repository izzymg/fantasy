const Koa = require("koa");
const Router = require("koa-router");
const router = new Router();
const server = new Koa();
const cors = require("@koa/cors");
const config = require("../config/config");
const main = require("./main");
const auth = require("./auth");
const { logRequestTime, handleErrors } = require("../libs/middleware");

router.use(main.routes());
router.use(auth.routes());
router.use(auth.allowedMethods());

if(config.api.allowCors) {
  server.use(cors({ origin: config.api.allowCors }));
}

if(config.logRequestTime) {
  server.use(logRequestTime(config.infoLog));
}

server.use(handleErrors(config.logErrors ? config.errorLog : null, config.consoleErrors));

if(config.proxy) server.proxy = true;

server.use(router.routes());

exports.start = function() {
  server.listen(config.api.port, config.api.host, function() {
    console.log(`API server listening on ${config.api.host}:${config.api.port}`);
  });
};