const connection = require("../db/connection");

const safeBoard = "uid, title, about, sfw, bumpLimit, maxThreads, cooldown";

async function get(uid) {
  const [board] = await connection.db.query({
    sql: `SELECT ${safeBoard} FROM boards WHERE uid = ?`,
    values: uid
  });
  if(!board || board.length > 1) return null;
  return board[0];
}

async function getAll() {
  const [boards] = await connection.db.query({
    sql: `SELECT ${safeBoard} FROM boards`
  });
  return boards;
}

exports.get = get;
exports.getAll = getAll;