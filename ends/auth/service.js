const server = require("../httpserver");
const config = require("../../config/config");

module.exports = async function() {
  const { host, port } = await server(null /* stub */, config.auth);
  console.log(`Auth listening on ${host}:${port}`);
};