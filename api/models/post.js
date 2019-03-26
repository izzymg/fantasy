const connection = require("../db/connection");

const safePost = 
  "id, boardUid, parent, createdAt, lastBump, name, subject, content, sticky, locked";
const safeFile = 
  "filename, thumbFilename, mimetype, originalName, size, hash";
const joinPostFiles = "LEFT JOIN files ON files.postUid = posts.uid";
const orderByDateSticky = "ORDER BY sticky DESC, lastBump DESC";

// Transform flat SQL left join post/file results into nested object data
function nestJoin(rows = []) {
  if(!rows || rows.length < 1) return null;
  const posts = [];
  rows.forEach((row) => {
    const lastPost = posts[posts.length - 1];
    // Push new file data onto existent post data
    if(lastPost && lastPost.id == row.posts.id && row.files.filename) {
      lastPost.files.push(row.files);
    // Push new post and file data
    } else {
      posts.push({
        ...row.posts,
        files: row.files.filename ? [row.files] : []
      });
    }
  });
  return posts;
}

function singleNestJoin(row) {
  const res = nestJoin(row);
  if(res) return res[0];
}

exports.getThreads = async function(boardUid) {
  const [threads] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND parent = 0 ${orderByDateSticky}`,
    values: [boardUid], nestTables: true
  });
  return nestJoin(threads);
};

exports.getPost = async function(boardUid, id) {
  const [post] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND id = ?`,
    values: [boardUid, id], nestTables: true
  });
  return singleNestJoin(post);
};