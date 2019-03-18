const persistence = require("./persistence");
const config = require("../config/config");
const path = require("path");
const fs = require("../libs/fs");
const validation = require("../libs/validation");
const validationError = (message) => ({ status: 400, message });

/**
 * @typedef {object} DbPost
 * @property {number} uid Unique ID of post
 * @property {number} id Board-unique ID of post
 * @property {string} boardUrl Board post is on
 * @property {number} parent 0 if thread post or ID of replied-to thread
 * @property {Date} lastBump Date the post was last bumped
 * @property {string} name
 * @property {string} subject
 * @property {string} content
 * @property {boolean} sticky
 * @property {boolean} locked
 * @property {string} ip Poster's IP address
 * @property {Array<UserFile>} files Array of files
*/


const Post = exports.Post = function(
  { postId, boardUrl, uid, parent, createdAt,
    lastBump, name, subject, 
    content, sticky, locked, ip, files = [] }, { fresh } = {  fresh: false }) {
  
  const post = {
    ip,
    boardUrl,
    parent: parent || 0,
    createdAt: createdAt || new Date(Date.now()),
    lastBump: lastBump || (!parent ? new Date(Date.now()) : null),
    name: name || "Anonymous",
    subject,
    content,
    sticky: sticky || false,
    locked: locked || false,
    files
  };
  if(!fresh) {
    post.uid = uid;
    post.id = postId;
  } else {
    if(post.parent) {
      if(config.posts.replies.requireContentOrFiles && (!post.files) && !post.content) {
        throw validationError("Content or file required");
      }
      // Remove subject from replies
      post.subject = null;
    } else {
      if(config.posts.threads.requireContent && !post.content) {
        throw validationError("Content required");
      }
      if(config.posts.threads.requireSubject && !post.subject) {
        throw validationError("Subject required");
      }
      if(config.posts.threads.requireFiles && (!post.files)) {
        throw validationError("File required");
      }
    }
    validation.lengthCheck(post.name, config.posts.maxNameLength, "Name");
    validation.lengthCheck(post.subject, config.posts.maxSubjectLength, "Subject");
    validation.lengthCheck(post.content, config.posts.maxContentLength, "Content");
    // Sanitize and format fields
    post.subject = validation.sanitize(post.subject);
    post.name = validation.formatNameContent(
      validation.sanitize(post.name), config.posts.tripAlgorithm, config.posts.tripSalt
    );
    post.content = validation.formatPostContent(validation.sanitize(post.content));
  }
  return post;
};

/**
 * @typedef UserFile
 * @property {number} postUid
 * @property {string} filename
 * @property {string} thumbFilename
 * @property {string} mimetype
 * @property {string} originalName
 * @property {number} size
 * @property {string} hash
 * @property {string} tempPath
 */

const File = exports.File = function({ postUid, filename, thumbFilename,
  mimetype, originalName, size, hash, tempPath }, { fresh } = { fresh: false }) {
  const file = {
    filename,
    thumbFilename,
    mimetype,
    originalName: originalName || "image.png",
    size,
    hash
  };
  if(!fresh) {
    file.postUid = postUid;
  } else {
    file.tempPath = tempPath;
    file.originalName = validation.sanitize(file.originalName);
  }
  return file;
};

/**
 * 
 * @returns {Array<DbPost>}
 */
const FilePosts = function(rows) {
  let lastPost = null;
  let posts = [];
  rows.forEach((row) => {
    // Push row file data onto already existent post
    if(row.filename && lastPost && lastPost.id == row.postId) {
      lastPost.files.push(File(row));
      return;
    }
    const post = Post(row);
    if(row.filename) post.files.push(File(row));
    lastPost = post;
    posts.push(post);
  });
  return posts;
};

/**
 * 
 * @returns {DbPost} 
 */
const FilePost = function(rows) {
  const post = Post(rows[0].posts);
  if(rows[0].files) post.files = rows.map((row) => File(row.files));
  return post;
};

exports.getPost = async function(board, id) {
  const sql = 
    `SELECT postId, createdAt, name, subject, content, sticky, locked, parent,
      lastBump, filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files on files.postUid = posts.uid
      WHERE boardUrl = ? AND postId = ?`;
  const rows = await persistence.db.getAll({ sql, values: [board, id], nestTables: true });
  if(!rows) return null;
  return FilePost(rows);
};

exports.getThreads = async function(board) {
  const sql = 
    `SELECT postId, createdAt, name, subject, content, sticky, locked, lastBump,
      filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files ON files.postUid = posts.uid
      WHERE boardUrl = ? AND parent = 0
      ORDER BY sticky DESC, lastBump DESC`;
  const rows = await persistence.db.getAll({ sql, values: [board], nestTables: false });
  if(!rows) return null;
  return FilePosts(rows);
};

exports.getThread = async function(board, id) {
  const sql =
    `SELECT postId, createdAt, name, subject, content, sticky, locked, lastBump, 
      filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files ON files.postUid = posts.uid
      WHERE parent = 0 AND boardUrl = ? AND postId = ?`;
  const rows = await persistence.db.getAll({ sql, values: [board, id], nestTables: true});
  if(!rows) return null;
  return FilePost(rows);
};

exports.getReplies = async function(board, threadId) {
  const sql = 
    `SELECT postId, createdAt, name, subject, content, sticky, locked,
      filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files ON files.postUid = posts.uid
      WHERE boardUrl = ? AND parent = ?
      ORDER BY createdAt ASC`;
  const rows = await persistence.db.getAll({ sql, values: [board, threadId], nestTables: false});
  if(!rows) return null;
  return FilePosts(rows);
};

/**
 * @returns {string} IP Address of post or null if not found
 */
exports.getPostIp = async function(board, id) {
  const row = await persistence.db.getOne({
    sql: "SELECT ip FROM posts WHERE boardUrl = ? AND postId = ?",
    values: [board, id]
  });
  return row ? row.ip : null;
};

/**
 * @returns {number} UID of post or null if not found
 */
exports.getPostUid = async function(board, id) {
  const row = await persistence.db.getOne({
    sql: "SELECT uid FROM posts WHERE boardUrl = ? AND postId = ?",
    values: [board, id]
  });
  return row ? row.uid : null;
};

exports.getThreadCount = async function(board) {
  const num = await persistence.db.getOne({
    sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = 0",
    values: [board]
  });
  if(!num || !num.count) return 0;
  return num.count;
};

exports.getReplyCount = async function(board, id) {
  const num = await persistence.db.getOne({
    sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = ?",
    values: [board, id]
  });
  if(!num || !num.count) return 0;
  return num.count;
};

exports.getOldestThreadId = async function(board) {
  const oldest = await persistence.db.getOne({
    sql: `SELECT postId as id FROM posts WHERE parent = 0 AND boardUrl = ? AND sticky = false
            ORDER BY lastBump ASC LIMIT 1;`,
    values: [board]
  });
  if(!oldest) return null;
  return oldest.id;
};

exports.bumpPost = async function(board, id) {
  const res = await persistence.db.query({
    sql: "UPDATE posts SET lastBump = ? WHERE boardUrl = ? AND postId = ? AND parent = 0",
    values: [new Date(Date.now()), board, id]
  });
  if (!res || !res.affectedRows) {
    throw "Bump failed";
  }
  return res.affectedRows;
};

/**
 * @param {DbPost} post
 */
exports.savePost = async function(post) {
  let processedFiles = 0;

  const postFiles = post.files;
  delete post.files;
  const dbConnecton = await persistence.db.getConnection();
  try {
    await dbConnecton.beginTransaction();

    const insertedPost = await dbConnecton.query({
      sql: `INSERT INTO posts
            SET postId = (SELECT id FROM boardids WHERE boardUrl = ? FOR UPDATE), ?`,
      values: [post.boardUrl, post]
    });
    await dbConnecton.query({ 
      sql: "UPDATE boardids SET id = id + 1 WHERE boardUrl = ?",
      values: [post.boardUrl]
    });

    if(!insertedPost.insertId) throw new Error("Failed to insert post into DB");
    if(postFiles) {
      await Promise.all(postFiles.map(async(userFile) => {
        try {
          if(userFile.mimetype == "image/jpeg" || userFile.mimetype == "image/png") {
            await fs.createImage(
              userFile.tempPath,
              path.join(config.posts.filesDir, userFile.filename)
            );
          } else {
            await fs.rename(
              userFile.tempPath,
              path.join(config.posts.filesDir, userFile.filename)
            );
          }
          if(userFile.thumbFilename) {
            await fs.createThumbnail(
              path.join(config.posts.filesDir, userFile.filename),
              path.join(config.posts.filesDir, userFile.thumbFilename),
              config.posts.thumbWidth, config.posts.thumbQuality
            );
          }
        } catch(e) {
          throw validationError("Failed to process image");
        }
        delete userFile.tempPath;
        // Save to db
        await dbConnecton.query({
          sql: "INSERT INTO files SET postUId = ?, ?",
          values: [insertedPost.insertId, userFile]
        });
        processedFiles++;
      }));
    }
    await dbConnecton.commit();
  } catch(error) {
    // Always rollback before throwing the error again
    dbConnecton.rollback();
    throw error;
  } finally {
    dbConnecton.release();
  }
  return { processedFiles };
};

exports.deletePost = async(board, id) => {
  const files = await persistence.db.getAll({
    sql: `SELECT filename, thumbFilename
          FROM files INNER JOIN posts ON files.postUid = posts.uid
          WHERE boardUrl = ? AND (postId = ? OR parent = ?)`,
    values: [board, id, id]}
  );
  let deletedFiles = 0;
  if (files && files.length > 0) {
    await Promise.all(files.map(async(file) => {
      await fs.unlink(
        path.join(config.posts.filesDir, file.filename)
      );
      if (file.thumbFilename) {
        await fs.unlink(
          path.join(config.posts.filesDir, file.thumbFilename)
        );
      }
      deletedFiles++;
    }));
  }
  const { affectedRows } = await persistence.db.query({
    sql: `DELETE posts, files FROM posts
          LEFT JOIN files ON files.postUid = posts.uid
          WHERE boardUrl = ? AND (postId = ? OR parent = ?)`,
    values: [board, id, id]
  });
  return { deletedPosts: affectedRows, deletedFiles };
};

exports.setSticky = async function(board, id, sticky = true) {
  const res = await persistence.db.query({
    sql: "UPDATE posts SET sticky = ? WHERE boardUrl = ? AND postId = ? AND parent = 0",
    values: [sticky, board, id]
  });
  if(!res.affectedRows) throw "Set sticky failed";
};

exports.setLocked = async function(board, id, locked = true) {
  const res = await persistence.db.query({
    sql: "UPDATE posts SET locked = ? WHERE boardUrl = ? AND postId = ? AND parent = 0",
    values: [locked, board, id]
  });
  if(!res.affectedRows) throw "Set locked failed";
};