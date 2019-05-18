const db = require("../persistent/db");

async function createCooldown(ip, board, seconds) {
  await db.redis.hSet(ip, board, Date.now() + seconds * 1000);
  await db.redis.expire(ip, 24 * 60 * 60);
}

async function getCooldown(ip, board) {
  return Number(await db.redis.hGet(ip, board)) || null;
}

async function deleteCooldown(ip, board) {
  await db.redis.hDel(ip, board);
}

async function getLogins(ip) {
  const attempts = Number(await db.redis.hGet(ip, "attempts"));
  const lastAttempt = await db.redis.hGet(ip, "attempts");
  return { attempts, lastAttempt: new Date(lastAttempt) || null, };
}

async function setLogins(ip, attempts, lastAttempt) {
  await Promise.all([
    db.redis.hSet(ip, "attempts", attempts),
    db.redis.hSet(ip, "lastAttempt", lastAttempt),
    db.redis.expire(ip, 48 * 60 * 60)
  ]);
}

async function setLastReport(ip, timestamp) {
  await Promise.all([
    db.redis.hSet(ip, "lastReport", timestamp),
    db.redis.expire(ip, 48 * 60 * 60)
  ]);
}

async function getLastReport(ip) {
  return await db.redis.hGet(ip, "lastReport");
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
