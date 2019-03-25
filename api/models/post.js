const connection = require("../db/connection");

const safePost = 
  "id, boardUid, parent, createdAt, lastBump, name, subject, content, sticky, locked";
const safeFile = 
  "filename, thumbFilename, mimetype, originalName, size, hash";
const joinPostFiles = "LEFT JOIN files ON files.postUid = posts.uid";
const orderByDateSticky = "ORDER BY sticky DESC, lastBump DESC";

// Transform flat SQL left join results into nested object data
function nestJoin(rows = []) {
  let posts = [];
  rows.forEach((row) => {
  return posts;
  });
};

exports.getThreads = async function(boardUid) {
  const [threads] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND parent = 0 ${orderByDateSticky}`,
    values: boardUid, nestTables: true
  });
  return threads || null;
};

exports.getPost = async function(boardUid, id) {
  const [post] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles} WERE boardUid = ? AND id = ?`,
    values: boardUid, id, nestTables: true
  });
  return post || null;
};