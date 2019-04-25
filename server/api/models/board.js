const connection = require("../db/connection");

/**
 * @typedef {object} Board
 * @property {string} uid
 * @property {string} title
 * @property {string} about
 * @property {boolean} sfw
 * @property {number} bumpLimit
 * @property {number} fileLimit
 * @property {number} maxThreads
 * @property {number} cooldown
 * @property {Date} createdAt
 */

const safeBoard = "uid, title, about, sfw, fileLimit, bumpLimit, maxThreads, cooldown";

/** 
 * @returns { Board } Board by UID
*/
async function get(uid) {
  const [board] = await connection.db.execute({
    sql: `SELECT ${safeBoard} FROM boards WHERE uid = ?`,
    values: [uid],
  });
  if(board && board.length) return board[0];
}

/**
 * @returns { Array<Board> } Array of all boards
*/
async function getAll() {
  const [boards] = await connection.db.execute({
    sql: `SELECT ${safeBoard} FROM boards`,
  });
  return boards;
}

/**
 * @returns { Board } Moderated boards by username
*/

async function getModeratedByUser(username) {
  const [boards] = await connection.db.execute({
    sql: `SELECT ${safeBoard} FROM boards
      INNER JOIN moderators ON moderators.boardUid = boards.uid
      WHERE username = ?`,
    values: [username],
  });
  if(boards && boards.length) return boards;
}

module.exports = {
  get,
  getAll,
  getModeratedByUser,
};