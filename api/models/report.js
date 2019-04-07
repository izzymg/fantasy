const connection = require("../db/connection");

const safeReportJoin = "boardUid, postId, createdAt, ip, description \
  FROM reports INNER JOIN reportlevels ON reportlevels.level = reports.level";

/**
 * @typedef Report
 * @property {string} boardUid
 * @property {number} postUid
 * @property {number} postId
 * @property {Date} createdAt
 * @property {string} ip
 * @property {number} level
*/

async function create(report) {
  await connection.db.execute({
    sql: "INSERT INTO reports SET ?",
    values: [report]
  });
}

async function getOnBoard(boardUid) {
  const [reports] = await connection.db.execute({
    sql: `SELECT ${safeReportJoin} WHERE boardUid = ? ORDER BY createdAt`,
    values: [boardUid]
  });
  return reports;
}

async function getPageOnBoard(boardUid, limit, page) {
  let offset = 0;
  // Pages start at 1
  if(page > 1) offset = limit * (page - 1) -1;
  const [reports] = await connection.db.execute({
    sql: `SELECT ${safeReportJoin} WHERE boardUid = ?
      ORDER BY createdAt LIMIT ? OFFSET ?`,
    values: [boardUid, limit, offset]
  });
  return reports;
}

module.exports = {
  create,
  getOnBoard,
  getPageOnBoard,
};