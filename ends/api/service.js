const server = require("../httpserver");
const config = require("../../config/config");
const router = require("./router");

module.exports = async function() {
  const { host, port } = await server(router, config.api);
  console.log(`API listening on ${host}:${port}`);
};