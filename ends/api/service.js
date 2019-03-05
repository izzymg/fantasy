const server = require("../httpserver");
const config = require("../../config/config");
const main = require("./main");
const auth = require("./auth");
const Router = require("koa-router");
const router = new Router();
router.use(main.routes());
router.use(auth.routes());
router.use(auth.allowedMethods());

module.exports = async function() {
  const { host, port } = await server(router, config.api);
  console.log(`API listening on ${host}:${port}`);
};