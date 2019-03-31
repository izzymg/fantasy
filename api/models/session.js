const connection = require("../db/connection");

exports.remove = async(id) => {
  await connection.mem.del(id);
};

exports.get = async(id) => {
  const username = await connection.mem.hGet(id || "", "username");
  if(!username) return null;
  return { username };
};

exports.create = async(id, username) => {
  await Promise.all([
    connection.mem.hSet(id, "username", username),
    connection.mem.expire(id, 48 * 60 * 60)
  ]);
};