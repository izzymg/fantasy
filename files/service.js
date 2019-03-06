const config = require("../config/config");
const server = require("../libs/httpserver");
const router = require("./router");


module.exports = async function() {
  const { host, port } = await server(router, config.files);
  console.log(`Files listening on ${host}:${port}`);
};