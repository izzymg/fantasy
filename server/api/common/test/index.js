// Common test functions
const request = require("supertest");
const crypto = require("crypto");
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

/**
 * Sets up a test board with a randomly generated UID
 * @returns { Object } UID of board, and remove() to delete it
*/
async function createTestBoard({
  cooldown, maxThreads, sfw,
}) {
  const uid = crypto.randomBytes(4).toString("hex");
  await models.board.insert({
    uid,
    title: "UnitTestBoard",
    about: "Test board",
    cooldown,
    maxThreads,
    sfw
  });
  return {
    uid,
  };
}

/**
 * Clears cooldowns on board
 * @param { number } uid Board's UID
*/
async function clearCooldowns({ uid }) {
  await models.ip.deleteCooldown("127.0.0.1", uid);
}

/**
 * Inserts post directly into DB
*/
async function insertDummyPost({ board, name, subject, content }) {
  return await models.post.insert(board, { name, subject, content });
}

module.exports = {
  createSession,
  createTestBoard,
  clearCooldowns,
}