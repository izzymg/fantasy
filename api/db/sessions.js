const persistence = require("./persistence");

exports.remove = async(id) => {
  await persistence.mem.del(id);
};

exports.get = async(id) => {
  const username = await persistence.mem.hGet(id || "", "username");
  if(!username) return null;
  return { username };
};

exports.create = async(id, username) => {
  await Promise.all([
    persistence.mem.hSet(id, "username", username),
    persistence.mem.expire(id, 48 * 60 * 60)
  ]);
};