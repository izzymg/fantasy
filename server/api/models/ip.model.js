const db = require("../persistent/db");

async function createCooldown(ip, board, seconds) {
  await db.mem.hSet(ip, board, Date.now() + seconds * 1000);
  await db.mem.expire(ip, 24 * 60 * 60);
}

async function getCooldown(ip, board) {
  return Number(await db.mem.hGet(ip, board)) || null;
}

async function deleteCooldown(ip, board) {
  await db.mem.hDel(ip, board);
}

async function getLogins(ip) {
  const attempts = Number(await db.mem.hGet(ip, "attempts"));
  const lastAttempt = await db.mem.hGet(ip, "attempts");
  return { attempts, lastAttempt: new Date(lastAttempt) || null, };
}

async function setLogins(ip, attempts, lastAttempt) {
  await Promise.all([
    db.mem.hSet(ip, "attempts", attempts),
    db.mem.hSet(ip, "lastAttempt", lastAttempt),
    db.mem.expire(ip, 48 * 60 * 60)
  ]);
}

async function setLastReport(ip, timestamp) {
  await Promise.all([
    db.mem.hSet(ip, "lastReport", timestamp),
    db.mem.expire(ip, 48 * 60 * 60)
  ]);
}

async function getLastReport(ip) {
  return await db.mem.hGet(ip, "lastReport");
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
