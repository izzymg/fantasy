const persistence = require("./persistence");

/**
 * @typedef DbUser
 * @property {string} username
 * @property {string} password Password hash, if safe = false in constructor
 * @property {Date} createdAt
 */

const User = exports.User = function({ username, password, createdAt }, { safe } = { safe: true }) {
  const user = {
    username,
    createdAt: createdAt || new Date(Date.now())
  };
  if(!safe) {
    user.password = password;
  }
  return user;
};

exports.getUser = async function(username) {
  const user = await persistence.db.getOne({
    sql: "SELECT username, createdAt FROM users WHERE username = ?",
    values: [username]
  });
  if(!user) return null;
  return User(user, { safe: true });
};

/**
 * @returns {DbUser}
 */
exports.getUserWithPassword = async function(username) {
  const user = await persistence.db.getOne({
    sql: "SELECT username, password, createdAt FROM users WHERE username = ?",
    values: [username]
  });
  if(!user) return null;
  return User(user, { safe: false });
};

exports.updateUserPassword = async function(username, hash) {
  const res = await persistence.db.query({
    sql: "UPDATE users SET password = ? WHERE username = ?",
    values: [hash, username]
  });
  if(!res.affectedRows) throw("Failed to update password");
};

/**
 * @returns True/false indicating if the user can moderate the board, or is an administrator
 * @param username Username of user
 * @param board Url of board being checked
 */

exports.canUserModerate = async function(username, board) {
  const res = await persistence.db.getOne({
    sql: `SELECT createdAt FROM administrators WHERE username = ?
          UNION
          SELECT createdAt FROM moderators WHERE boardUrl = ? AND username = ?`,
    values: [username, board, username]
  });
  return Boolean(res && res.createdAt);
};