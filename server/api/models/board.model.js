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

/**
 * Creates a board
 * @param { Board } board
*/

async function insert(board) {
  await connection.db.query({
    sql: "INSERT INTO boards SET ?",
    values: [board],
  });
}

/**
 * Deletes a board
 * @param { number } uid Board's UID
*/

async function remove(uid) {
  const [{ affectedRows, }] = await connection.db.query({
    sql: "DELETE FROM boards WHERE uid = ?",
    values: [uid],
  });
  return { boardsRemoved: affectedRows, };
}

module.exports = {
  get,
  getAll,
  getModeratedByUser,
  insert,
  remove,
};