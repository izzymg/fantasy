const db = require("../persistent/db");

exports.remove = async function(id) {
  await db.mem.del(id);
};

exports.get = async function(id) {
  const [username, isAdmin] = await Promise.all([
    db.mem.hGet(id || "", "username"),
    db.mem.hGet(id || "", "isAdmin"),
  ]);
  if(!username) return null;
  return { username, isAdmin, };
};

exports.insert = async function(id, username, isAdmin = false) {
  await Promise.all([
    db.mem.hSet(id, "username", username),
    db.mem.hSet(id, "isAdmin", isAdmin),
    db.mem.expire(id, 48 * 60 * 60)
  ]);
};