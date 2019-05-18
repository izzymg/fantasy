const db = require("../persistent/db");

exports.remove = async function(id) {
  await db.redis.del(id);
};

exports.get = async function(id) {
  const [username, isAdmin] = await Promise.all([
    db.redis.hGet(id || "", "username"),
    db.redis.hGet(id || "", "isAdmin"),
  ]);
  if(!username) return null;
  return { username, isAdmin, };
};

exports.insert = async function(id, username, isAdmin = false) {
  await Promise.all([
    db.redis.hSet(id, "username", username),
    db.redis.hSet(id, "isAdmin", isAdmin),
    db.redis.expire(id, 48 * 60 * 60)
  ]);
};