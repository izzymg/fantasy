const db = require("../persistent/db");

/**
 * @typedef Ban
 * @property { number } uid
 * @property { string } ip
 * @property { string } boardUid
 * @property { boolean } allBoards
 * @property { Date } expires
 * @property { string } reason
*/

const safeBan = "uid, ip, boardUid, allBoards, expires, reason";

/**
 * @returns { Ban } 
 */
async function getByBoard(ip, board) {
  const [ban] = await db.sql.execute({
    sql: `SELECT ${safeBan} FROM bans WHERE ip = ? AND (boardUid = ? OR allBoards = true)`,
    values: [ip, board],
  });
  if(ban && ban.length) return ban[0];
}

/**
 * @returns { Array<Ban> }
 */
async function getByIp(ip) {
  const [bans] = await db.sql.execute({
    sql: `SELECT ${safeBan} FROM bans WHERE ip = ?`,
    values: [ip],
  });
  if(bans && bans.length) return bans;
}

/**
 * @param { Ban } ban 
 */
async function insert(ban) {
  await db.sql.query({
    sql: "INSERT INTO bans SET ?",
    values: [ban],
  });
}

async function remove(uid) {
  await db.sql.query({
    sql: "DELETE FROM bans WHERE uid = ?",
    values: [uid],
  });
}

module.exports = {
  getByBoard,
  getByIp,
  insert,
  remove,
};