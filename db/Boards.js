const persistence = require("./persistence");

/**
 * @typedef {object} DbBoard
 * @property {string} url
 * @property {string} title
 * @property {string} about
 * @property {boolean} sfw
 * @property {number} bumpLimit
 * @property {number} maxThreads
 * @property {number} cooldown
 * @property {Date} createdAt
 */

const Board = exports.Board = function({
  url, title, about, sfw = true, bumpLimit = 100, maxThreads = 20, cooldown = 30,
  createdAt = new Date(Date.now())}) {

  return {
    url,
    title,
    about,
    sfw,
    bumpLimit,
    maxThreads,
    cooldown,
    createdAt
  };
};

exports.getBoard = async function(url) {
  const row = await persistence.db.getOne({
    sql: "SELECT url, title, about, sfw, bumpLimit, maxThreads, cooldown FROM boards WHERE url = ?",
    values: [url]
  });
  if(row) return Board(row);
};

/**
 * @returns {Promise<Array<DbBoard>>}
 */
exports.getBoards = async function() {
  const rows = await persistence.db.getAll({
    sql: "SELECT url, title, about, sfw, bumpLimit, maxThreads, cooldown FROM boards"
  });
  if(rows) return rows.map((row) => Board(row));
};