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