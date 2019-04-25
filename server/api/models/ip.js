const connection = require("../db/connection");

async function createCooldown(ip, board, seconds) {
  await connection.mem.hSet(ip, board, Date.now() + seconds * 1000);
  await connection.mem.expire(ip, 24 * 60 * 60);
}

async function getCooldown(ip, board) {
  return Number(await connection.mem.hGet(ip, board)) || null;
}

async function deleteCooldown(ip, board) {
  await connection.mem.hDel(ip, board);
}

async function getLogins(ip) {
  const attempts = Number(await connection.mem.hGet(ip, "attempts"));
  const lastAttempt = await connection.mem.hGet(ip, "attempts");
  return { attempts, lastAttempt: new Date(lastAttempt) || null };
}

async function setLogins(ip, attempts, lastAttempt) {
  await Promise.all([
    connection.mem.hSet(ip, "attempts", attempts),
    connection.mem.hSet(ip, "lastAttempt", lastAttempt),
    connection.mem.expire(ip, 48 * 60 * 60)
  ]);
}

async function setLastReport(ip, timestamp) {
  await Promise.all([
    connection.mem.hSet(ip, "lastReport", timestamp),
    connection.mem.expire(ip, 48 * 60 * 60)
  ]);
}

async function getLastReport(ip) {
  return await connection.mem.hGet(ip, "lastReport");
}

module.exports = {
  createCooldown,
  getCooldown,
  deleteCooldown,
  getLogins,
  setLogins,
  setLastReport,
  getLastReport,
};
