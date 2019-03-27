const connection = require("../db/connection");
const libs = require("../../libs");
const config = require("../../config/config");
const path = require("path");

const safePost = 
  "id, boardUid, parent, createdAt, lastBump, name, subject, content, sticky, locked";
const safeFile = 
  "filename, mimetype, originalName, size, hash";
const joinPostFiles = "LEFT JOIN files ON files.postUid = posts.uid";
const orderByDateSticky = "ORDER BY sticky DESC, lastBump DESC";

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
 * @property {number} id Board-unique ID of post
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

/**
 * @returns { Post } 
*/
async function get(boardUid, id) {
  const [post] = await connection.db.query({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND id = ?`,
    values: [boardUid, id], nestTables: true
  });
  return singleNestJoin(post);
}

/**
 * @returns { Array<Post> } 
*/
async function getThreads(boardUid) {
  const [threads] = await connection.db.execute({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND parent = 0 ${orderByDateSticky}`,
    values: [boardUid], nestTables: true
  });
  return nestJoin(threads);
}

/**
 * @returns { Post } 
*/
async function getThread(boardUid, id) {
  const [thread] = await connection.db.execute({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND id = ? AND parent = 0 ${orderByDateSticky}`,
    values: [boardUid, id], nestTables: true
  });
  return singleNestJoin(thread);
}

/**
 * Faster than doing getThread if files are unneeded
 * @returns { Number } ID of thread
 * @returns { false } if thread does not exist
 */
async function threadAllowsReplies(boardUid, id) {
  const [thread] = await connection.db.execute({
    sql: "SELECT id FROM posts WHERE boardUid = ? AND id = ? AND parent = 0 AND locked = false",
    values: [boardUid, id]
  });
  if(thread[0] && thread[0].id) return thread.id;
  return false;
}

/**
 * @returns { Array<Post> } 
*/
async function getThreadReplies(boardUid, id) {
  const [thread] = await connection.db.execute({
    sql: `SELECT ${safePost}, ${safeFile} FROM posts ${joinPostFiles}
      WHERE boardUid = ? AND parent = ? ${orderByDateSticky}`,
    values: [boardUid, id], nestTables: true
  });
  return nestJoin(thread);
}

/**
 * @param {Post} post
*/
async function createPost(post) {
  const poolConnection = await connection.db.getConnection();
  await poolConnection.beginTransaction();
  try {

    let filesProcessed = 0;

    // Workaround files column not existing
    // TODO: figure out better parameter escaping
    const postFiles = post.files;
    delete post.files;

    // Insert post with board's current post id
    const [{ insertId }] = await poolConnection.query({
      sql: `INSERT INTO posts
        SET id = (SELECT id FROM boardids WHERE boardUid = ? FOR UPDATE), ?`,
      values: [post.boardUid, post]
    });
    // Update board's current post id
    await poolConnection.query({
      sql: "UPDATE boardids SET id = id + 1 WHERE boardUid = ?",
      values: [post.boardUid]
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
          const err = new Error(error);
          err.code = "IMAGE";
          throw err;
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
    return { filesProcessed };
  } catch(error) {
    /* Files that may have been processed are untouched
    because the file processing may have caused the error itself */
    poolConnection.rollback();
    throw error;
  } finally {
    if(poolConnection) poolConnection.release();
  }
}

module.exports = {
  get,
  getThread,
  threadAllowsReplies,
  getThreads,
  getThreadReplies,
  createPost,
};