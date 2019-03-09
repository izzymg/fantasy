const persistence = require("./persistence");

/**
 * @typedef report
 * @property {string} boardUrl Board url of reported post
 * @property {number} postUid UID of reported post
 * @property {string} ip Reporter's IP address
 * @property {date} createdAt Time report was made
 */


/**
 * @returns {report} Report
 */
const Report = exports.Report = function({ boardUrl, postUid, ip, createdAt }) {
  const Report = { boardUrl, postUid, ip, createdAt };
  return Report;
};

exports.saveReport = async function(report) {
  const insertion = await persistence.db.query({
    sql: "INSERT INTO reports SET ?",
    values: [report]
  });
  if(!insertion.affectedRows) throw "Saving report failed";
};