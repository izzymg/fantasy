const connection = require("../db/connection");

/**
 * @typedef {object} Board
 * @property {string} uid
 * @property {string} title
 * @property {string} about
 * @property {boolean} sfw
 * @property {number} bumpLimit
 * @property {number} maxThreads
 * @property {number} cooldown
 * @property {Date} createdAt
 */

const safeBoard = "uid, title, about, sfw, bumpLimit, maxThreads, cooldown";

/** 
 * @returns { Board } 
*/
async function get(uid) {
  const [board] = await connection.db.execute({
    sql: `SELECT ${safeBoard} FROM boards WHERE uid = ?`,
    values: [uid]
  });
  if(!board || board.length > 1) return null;
  return board[0];
}

/**
 * @returns { Array<Board> }
*/
async function getAll() {
  const [boards] = await connection.db.execute({
    sql: `SELECT * FROM boards`
  });
  return boards;
}

module.exports = {
  get,
  getAll,
};