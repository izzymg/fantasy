const connection = require("../db/connection");
const libs = require("../../libs");
const config = require("../../config/config");
const path = require("path");

const safePost = 
  "number, boardUid, parent, createdAt, lastBump, name, subject, content, sticky, locked";
const safeFile = 
  "filename, mimetype, originalName, size, hash";
const joinPostFiles = "LEFT JOIN files ON files.postUid = posts.uid";
const threadOrder = "ORDER BY sticky DESC, lastBump DESC";
const replyOrder = "ORDER BY number ASC, createdAt ASC";

/**
 * @typedef File
 * @property {number} postUid
 * @property {string} filename
 * @property {string} mimetype
 * @property {string} originalName
 * @property {number} size
 * @property {string} hash
 * @property {string} tempPath
 */

/**
 * @typedef {object} Post
 * @property {number} uid Unique ID of post
 * @property {number} number Post number on board
 * @property {string} boardUid Board post is on
 * @property {number} parent 0 if thread post or ID of replied-to thread
 * @property {Date} lastBump Date the post was last bumped
 * @property {string} name
 * @property {string} subject
 * @property {string} content
 * @property {boolean} sticky Post is sticked to top of board
 * @property {boolean} locked Post cannot be replied to
 * @property {string} ip Poster's IP address
 * @property {Array<File>} files Array of post files
*/

// Transform flat SQL left join post/file results into nested object data
function nestJoin(rows = []) {
  if(!rows || rows.length < 1) return null;
  const posts = [];
  rows.forEach((row) => {
    const lastPost = posts[posts.length - 1];
    // Push new file data onto existent post data
    if(lastPost && lastPost.number == row.posts.number && row.files.filename) {
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

/**
 * @returns { Post } 
*/
async function get(boardUid, number) {
  const [post] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND number = ?`,
    values: [boardUid, number], nestTables: true
  });
  return singleNestJoin(post);
}

/**
 * @returns { Post } 
*/
async function getByUid(uid) {
  const [post] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE uid = ?`,
    values: [uid], nestTables: true
  });
  return singleNestJoin(post);
}

async function getIp(boardUid, number) {
  const [res] = await connection.db.execute({
    sql: "SELECT ip FROM posts WHERE boardUid = ? AND number = ?",
    values: [boardUid, number]
  });
  if(!res || !res.length) return null;
  return res[0].ip;
}

/**
 * @param {Post} post
*/
async function create(post) {
  const poolConnection = await connection.db.getConnection();
  await poolConnection.beginTransaction();
  try {

    let filesProcessed = 0;

    // Workaround files column not existing
    // TODO: figure out better parameter escaping
    const postFiles = post.files;
    delete post.files;

    const [{ insertId }] = await poolConnection.query({
      sql: "INSERT INTO posts SET ?",
      values: [post]
    });

    const [insertedPost] = await poolConnection.query({
      sql: "SELECT number FROM posts WHERE uid = ?",
      values: [insertId]
    });

    // File processing and database records
    if(postFiles) {
      await Promise.all(postFiles.map(async(file) => {
        try {
          await libs.files.processPostFile(
            file.tempPath,
            path.join(config.posts.filesDir, file.filename),
            path.join(config.posts.thumbsDir, file.filename),
            file.mimetype,
            { thumbQuality: config.posts.thumbQuality,
              thumbWidth: config.posts.thumbWidth }
          );
        } catch(error) {
          throw { status: 400, message: "Failed to process image", error: error };
        }
        // TODO: better parameters here too
        delete file.tempPath;
        await poolConnection.query({
          sql: "INSERT INTO files SET postUid = ?, ?",
          values: [insertId, file]
        });
        filesProcessed++;
      }));
    }

    // Bop
    await poolConnection.commit();
    return { filesProcessed, postNumber: insertedPost[0].number };
  } catch(error) {
    /* Files that may have been processed are untouched
    because the file processing may have caused the error itself */
    poolConnection.rollback();
    throw error;
  } finally {
    if(poolConnection) poolConnection.release();
  }
}

/**
 * Removes post and replies 
 */
async function removeWithReplies(boardUid, number) {
  let deletedFiles = 0;
  const [files] = await connection.db.execute({
    sql: `SELECT filename FROM files
      INNER JOIN posts on files.postUid = posts.uid
      WHERE boardUid = ? AND (number = ? OR parent = ?)`,
    values: [boardUid, number, number]
  });
  if(files && files.length  > 0) {
    await Promise.all(files.map(async(file) => {
      try {
        await libs.files.unlink(path.join(config.posts.filesDir, file.filename));
        await libs.files.unlink(path.join(config.posts.thumbsDir, file.filename));
      } catch(error) {
        // Ignore image not found errors
        if(error.code !== "ENOENT") throw error;
      }
      deletedFiles++;
    }));
  }
  const [{ affectedRows }] = await connection.db.execute({
    sql: "DELETE from posts WHERE boardUid = ? AND (number = ? OR parent = ?)",
    values: [boardUid, number, number]
  });
  return { deletedPosts: affectedRows, deletedFiles };
}

/**
 * @returns { Array<Post> } 
*/
async function getThreads(boardUid) {
  const [threads] = await connection.db.execute({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND parent = 0 ${threadOrder}`,
    values: [boardUid], nestTables: true
  });
  return nestJoin(threads);
}

/**
 * @returns { Post } 
*/
async function getThread(boardUid, number) {
  const [thread] = await connection.db.execute({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND number = ? AND parent = 0`,
    values: [boardUid, number], nestTables: true
  });
  return singleNestJoin(thread);
}

/**
 * @returns { Array<Post> } 
*/
async function getThreadReplies(boardUid, number) {
  const [thread] = await connection.db.execute({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND parent = ? ${replyOrder}`,
    values: [boardUid, number], nestTables: true
  });
  return nestJoin(thread);
}

/**
 * Faster than doing getThread if files are unneeded
 * @returns { Number } Number of thread
 * @returns { false } if thread does not exist
 */
async function threadAllowsReplies(boardUid, number) {
  const [thread] = await connection.db.execute({
    sql: `SELECT number FROM posts
      WHERE boardUid = ? AND number = ? AND parent = 0 AND locked = false`,
    values: [boardUid, number]
  });
  if(thread[0] && thread[0].number) return thread[0].number;
  return false;
}

async function getThreadCount(boardUid) {
  const [num] = await connection.db.execute({
    sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUid = ? AND parent = 0",
    values: [boardUid]
  });
  if(!num || !num[0].count) return 0;
  return num[0].count;
}

async function getReplyCount(boardUid, number) {
  const [num] = await connection.db.execute({
    sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUid = ? AND parent = ?",
    values: [boardUid, number]
  });
  if(!num || !num[0].count) return 0;
  return num[0].count;
}

async function getOldestThreadNumber(boardUid) {
  const [oldest] = await connection.db.execute({
    sql: `SELECT number FROM posts WHERE parent = 0 AND boardUid = ? AND sticky = false
        ORDER BY lastBump ASC LIMIT 1;`,
    values: [boardUid]
  });
  if(!oldest.length || !oldest[0].number) return null;
  return oldest[0].number;
}

async function getUid(boardUid, number) {
  const [rows] = await connection.db.execute({
    sql: "SELECT uid FROM posts WHERE number = ? AND boardUid = ?",
    values: [number, boardUid]
  });
  if(!rows || !rows.length) return null;
  return rows[0].uid;
}

async function bumpPost(boardUid, number) {
  const [res] = await connection.db.query({
    sql: "UPDATE posts SET lastBump = ? WHERE boardUid = ? AND number = ? AND parent = 0",
    values: [new Date(Date.now()), boardUid, number]
  });
  if (!res || !res.affectedRows) {
    throw "Bump failed";
  }
  return res.affectedRows;
}

module.exports = {
  get,
  getByUid,
  getIp,
  create,
  getThread,
  threadAllowsReplies,
  getThreads,
  getThreadReplies,
  removeWithReplies,
  getThreadCount,
  getReplyCount,
  getOldestThreadNumber,
  getUid,
  bumpPost,
};