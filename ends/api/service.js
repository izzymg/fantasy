const server = require("../httpserver");
const config = require("../../config/config");
const boards = require("./boards");

module.exports = async function() {
  const { host, port } = await server(boards, config.api);
  console.log(`API listening on ${host}:${port}`);
};