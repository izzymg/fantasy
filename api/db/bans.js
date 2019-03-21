const persistence = require("./persistence");
const validation = require("../../libs/validation");
const validationError = (message) => ({ status: 400, message });

/**
 * @typedef DbBan
 * @property {number} uid
 * @property {string} ip
 * @property {string} boardUrl
 * @property {boolean} allBoards
 * @property {Date} expires
 * @property {string} reason
 */

const Ban = exports.Ban = function({
  uid, ip, boardUrl, allBoards, expires, reason }, { fresh } = { fresh: false }) {
  const ban = {
    ip,
    boardUrl,
    allBoards: allBoards || false,
    expires: expires,
    reason 
  };
  if(!fresh) {
    ban.uid = uid;
  } else {
    ban.reason = validation.sanitize(ban.reason);
  }
  return ban;
};

/**
 * @param {DbBan} ban
 */
exports.saveBan = async function(ban) {
  let lengthError = validation.lengthCheck(ban.reason, 1000, "Ban");
  if(lengthError) throw validationError(lengthError);
  const res = await persistence.db.query({
    sql: "INSERT INTO BANS SET ?", values: [ban]
  });
  if(!res.affectedRows) throw "Ban failed";
  return { banId: res.insertId };
};

/**
 * @returns {Array<DbBan>} Array of bans related to the IP Address parameter, if any
 */
exports.getAllBans = async function(ip) {
  const rows = await persistence.db.getAll({
    sql: "SELECT boardUrl, allBoards, expires, reason FROM bans WHERE ip = ?",
    values: [ip]
  });
  if(!rows) return null;
  return rows.map((row) => Ban(row));
};

/**
 * @returns {DbBan} A ban matching the ip and board, or where allBoards is true 
 */
exports.getBan = async function(ip, board) {
  const row = await persistence.db.getOne({
    sql: `SELECT ip, boardUrl, allBoards, expires, reason FROM bans
          WHERE ip = ? AND (boardUrl = ? OR allBoards = true)`,
    values: [ip, board]
  });
  if(row) return Ban(row);
};

exports.deleteBan = async(uid) => await persistence.db.query({
  sql: "DELETE FROM bans WHERE uid = ?",
  values: [uid]
});