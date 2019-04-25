const connection = require("../db/connection");

exports.remove = async function(id) {
  await connection.mem.del(id);
};

exports.get = async function(id) {
  const [username, isAdmin] = await Promise.all([
    connection.mem.hGet(id || "", "username"),
    connection.mem.hGet(id || "", "isAdmin"),
  ]);
  if(!username) return null;
  return { username, isAdmin };
};

exports.insert = async function(id, username, isAdmin = false) {
  await Promise.all([
    connection.mem.hSet(id, "username", username),
    connection.mem.hSet(id, "isAdmin", isAdmin),
    connection.mem.expire(id, 48 * 60 * 60)
  ]);
};