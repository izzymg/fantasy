const connection = require("../persistent/db");

const reportJoin = "reports.postUid, reports.createdAt, reports.ip, reportlevels.description \
  FROM reports INNER JOIN reportlevels ON reportlevels.level = reports.level";
const reportOrder = "ORDER BY reports.createdAt DESC";
const postsJoin = "LEFT JOIN posts ON posts.uid = reports.postUid";

/**
 * @typedef Report
 * @property {number} postUid
 * @property {Date} createdAt
 * @property {string} ip
 * @property {number} level
*/

/**
 * @typedef ReportLevel
 * @property {number} level
 * @property {string} description 
*/

/**
 * @typedef PostReport
 * @property {number} postUid
 * @property {Date} createdAt
 * @property {string} ip
 * @property {number} level
 * @property {number} number Post number
*/

/** 
 * @param { PostReport } report 
*/
async function insert(report) {
  try {
    await connection.sql.query({
      sql: "INSERT INTO reports SET ?",
      values: [report],
    });
  } catch(error) {
    if(error.code == "ER_NO_REFERENCED_ROW_2" || error.code == "ER_NO_REFERENCED_ROW") {
      throw { status: 400, message: "Invalid report level", };
    }
    throw error;
  }
}

/**
 * 
 * @returns { Array<PostReport> } 
*/
async function getOnBoard(boardUid) {
  const [reports] = await connection.sql.execute({
    sql: `SELECT posts.number, ${reportJoin} ${postsJoin}
      WHERE posts.boardUid = ? ${reportOrder}`,
    values: [boardUid],
  });
  return reports;
}

/**
 * 
 * @returns { Array<Report> } 
*/
async function getPageOnBoard(boardUid, limit, page) {
  let offset = 0;
  // Pages start at 1
  if(page > 1) offset = limit * (page - 1) -1;
  const [reports] = await connection.sql.execute({
    sql: `SELECT posts.number, ${reportJoin} ${postsJoin} WHERE posts.boardUid = ?
      ${reportOrder} LIMIT ? OFFSET ?`,
    values: [boardUid, limit, offset],
  });
  return reports;
}

/**
 * @returns { ReportLevel }
*/
async function getLevel(level) {
  const [reportlevel] = await connection.sql.execute({
    sql: "SELECT description, level FROM reportlevels WHERE level = ? ORDER BY level ASC",
    values: [level],
  });
  if(!reportlevel && !reportlevel.description) return null;
  return reportlevel;
}

/**
 * @returns { Array<ReportLevel> }
*/
async function getLevels() {
  const [reportlevels] = await connection.sql.execute({
    sql: "SELECT description, level FROM reportlevels ORDER BY level ASC",
  });
  return reportlevels;
}

module.exports = {
  insert,
  getOnBoard,
  getPageOnBoard,
  getLevel,
  getLevels,
};