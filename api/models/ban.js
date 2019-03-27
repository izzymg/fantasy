const connection = require("../db/connection");

/**
 * @typedef Ban
 * @property {number} uid
 * @property {string} ip
 * @property {string} boardUrl
 * @property {boolean} allBoards
 * @property {Date} expires
 * @property {string} reason
*/

const safeBan = "ip, boardUid, allBoards, expires, reason";

/**
 * 
 * @returns { Ban } 
 */
async function getBoardBan(ip, board) {
  const [ban] = await connection.db.execute({
    sql: `SELECT ${safeBan} FROM bans WHERE ip = ? AND (boardUid = ? OR allBoards = true)`,
    values: [ip, board]
  });
  if(ban && ban.length) return ban[0];
}

async function deleteBan(uid) {
  connection.db.query({
    sql: "DELETE FROM bans WHERE uid = ?", values: [uid]
  });
}

module.exports = {
  getBoardBan,
  deleteBan
};