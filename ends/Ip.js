const persistence = require("./persistence");

exports.createCooldown = async function(ip, seconds) {
  await persistence.rawMem.hSet(ip, "cooldown", Date.now() + seconds * 1000);
  await persistence.rawMem.expire(ip, 24 * 60 * 60);
};

exports.getCooldown = async function(ip) {
  return Number(await persistence.rawMem.hGet(ip, "cooldown")) || null;
};

exports.deleteCooldown = async function(ip) {
  await persistence.rawMem.hDel(ip, "cooldown");
};