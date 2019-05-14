// Common test functions
const request = require("supertest");
const models = require("../../models");

/**
 * Posts login request to httpServer
 * @returns { Array } Set-cookie header result
*/
async function createSession(httpServer, { username, password }) {
  const response = await request(httpServer)
    .post("/auth/login")
    .send({ username, password });
  if(!response.headers || !response.headers["set-cookie"]) {
    throw "Got no set-cookie header";
  }
  return response.headers["set-cookie"];
}

module.exports = {
  createSession,
}