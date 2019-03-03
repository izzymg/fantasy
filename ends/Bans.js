const persistence = require("./persistence");

/**
 * @typedef DbBan
 * @property {number} uid
 * @property {string} ip
 * @property {string} boardUrl
 * @property {boolean} allBoards
 * @property {Date} expires
 * @property {string} reason
 */

const Ban = exports.Ban = function({ uid, ip, boardUrl, allBoards, expires, reason }) {
  return {
    uid,
    ip,
    boardUrl,
    allBoards: allBoards || false,
    expires: expires || new Date(Date.now() + 24 * 60 * 1000),
    reason 
  };
};

exports.getBan = async function(ip, board) {
  const row = await persistence.rawDb.getOne({
    sql: `SELECT uid, ip, boardUrl, allBoards, expires, reason FROM bans
          WHERE ip = ? AND (boardUrl = ? OR allBoards = true)`,
    values: [ip, board]
  });
  if(row) return Ban(row);
};

exports.deleteBan = async(uid) => await persistence.rawDb.query({
  sql: "DELETE FROM bans WHERE uid = ?",
  values: [uid]
});