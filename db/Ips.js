const persistence = require("./persistence");

exports.createCooldown = async function(ip, board, seconds) {
  await persistence.mem.hSet(ip, board, Date.now() + seconds * 1000);
  await persistence.mem.expire(ip, 24 * 60 * 60);
};

exports.getCooldown = async function(ip, board) {
  return Number(await persistence.mem.hGet(ip, board)) || null;
};

exports.deleteCooldown = async function(ip, board) {
  await persistence.mem.hDel(ip, board);
};

exports.getLogins = async function(ip) {
  const attempts = Number(await persistence.mem.hGet(ip, "attempts"));
  const lastAttempt = await persistence.mem.hGet(ip, "attempts");
  return { attempts, lastAttempt: new Date(lastAttempt) || null };
};

exports.setLogins = async function(ip, attempts, lastAttempt) {
  await Promise.all([
    persistence.mem.hSet(ip, "attempts", attempts),
    persistence.mem.hSet(ip, "lastAttempt", lastAttempt),
    persistence.mem.expire(ip, 48 * 60 * 60)
  ]);
};

exports.setLastReport = async function(ip, timestamp) {
  await Promise.all([
    persistence.mem.hSet(ip, "lastReport", timestamp),
    persistence.mem.expire(ip, 48 * 60 * 60)
  ]);
};

exports.getLastReport = async function(ip) {
  return await persistence.mem.hGet(ip, "lastReport");
};