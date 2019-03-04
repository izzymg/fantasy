const server = require("../httpserver");
const config = require("../../config/config");
const boards = require("./boards");
const auth = require("./auth");
const Router = require("koa-router");
const router = new Router();
router.use(boards.routes());
router.use(auth.routes());
router.use(auth.allowedMethods());

module.exports = async function() {
  const { host, port } = await server(router, config.api);
  console.log(`API listening on ${host}:${port}`);
};