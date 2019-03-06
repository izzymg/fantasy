const server = require("../libs/httpserver");
const config = require("../config/config");
const router = require("./router");

module.exports = async function() {
  const { host, port } = await server(router, config.site);
  console.log(`Site listening on ${host}:${port}`);
};