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

/**
 * @typedef MemLogin
 * @property {number} attempts
 * @property {Date} lastAttempt
 */

/**
 * @returns {MemLogin} Number of login attempts and date of last attempt
 */
exports.getLogins = async function(ip) {
  const attempts = Number(await persistence.mem.hGet(ip, "attempts"));
  const lastAttempt = new Date(await persistence.mem.hGet(ip, "attempts"));
  return { attempts, lastAttempt };
};

/**
 * @param {number} attempts Number of login attempts
 * @param {Date} lastAttempt Last login attempt
 */
exports.setLogins = async function(ip, attempts, lastAttempt) {
  await Promise.all([
    persistence.mem.hSet(ip, "attempts", attempts),
    persistence.mem.hSet(ip, "lastAttempt", lastAttempt),
    persistence.mem.expire(ip, 48 * 60 * 60)
  ]);
};