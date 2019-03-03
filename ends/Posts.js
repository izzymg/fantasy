const persistence = require("./persistence");
const config = require("../config/config");
const path = require("path");
const fs = require("../libs/fs");

/**
 * @typedef {object} UserPost
 * @property {number} uid
 * @property {number} id
 * @property {string} boardUrl
 * @property {number} parent
 * @property {Date} lastBump
 * @property {string} name
 * @property {string} subject
 * @property {string} content
 * @property {boolean} sticky
 * @property {string} ip
 * @property {Array<UserFile>} files
*/


const Post = exports.Post = function(
  { postId, boardUrl, uid, parent = 0, createdAt = new Date(Date.now()),
    lastBump, name = "Anonymous", subject, 
    content, sticky = false, ip, files = [] }, { fresh } = {  fresh: false }) {
  
  const post = {
    ip,
    boardUrl,
    parent,
    createdAt,
    lastBump,
    name,
    subject,
    content,
    sticky,
    files
  };
  if(!fresh) {
    post.uid = uid;
    post.id = postId;
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
  }
  return file;
};

/**
 * 
 * @returns {Array<UserPost>}
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
 * @returns {UserPost} 
 */
const FilePost = function(rows) {
  const post = Post(rows[0].posts);
  if(rows[0].files) post.files = rows.map((row) => File(row.files));
  return post;
};

exports.getPost = async function(board, id) {
  const sql = 
    `SELECT createdAt, name, subject, content, sticky, parent,
      lastBump, filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files on files.postUid = posts.uid
      WHERE boardUrl = ? AND postId = ?`;
  const rows = await persistence.rawDb.getAll({ sql, values: [board, id], nestTables: true });
  if(!rows) return null;
  return FilePost(rows);
};

exports.getThreads = async function(board) {
  const sql = 
    `SELECT postId, createdAt, name, subject, content, sticky, lastBump,
      filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files ON files.postUid = posts.uid
      WHERE boardUrl = ? AND parent = 0
      ORDER BY sticky DESC, lastBump DESC`;
  const rows = await persistence.rawDb.getAll({ sql, values: [board], nestTables: false });
  if(!rows) return null;
  return FilePosts(rows);
};

exports.getThread = async function(board, id) {
  const sql =
    `SELECT postId, createdAt, name, subject, content, sticky, lastBump, 
      filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files ON files.postUid = posts.uid
      WHERE parent = 0 AND boardUrl = ? AND postId = ?`;
  const rows = await persistence.rawDb.getAll({ sql, values: [board, id], nestTables: true});
  if(!rows) return null;
  return FilePost(rows);
};

exports.getReplies = async function(board, threadId) {
  const sql = 
    `SELECT postId, createdAt, name, subject, content, sticky,
      filename, thumbFilename, originalName, mimetype, size
      FROM posts LEFT JOIN files ON files.postUid = posts.uid
      WHERE boardUrl = ? AND parent = ?
      ORDER BY createdAt ASC`;
  const rows = await persistence.rawDb.getAll({ sql, values: [board, threadId], nestTables: false});
  if(!rows) return null;
  return FilePosts(rows);
};

/**
 * @param {UserPost} post
 */
exports.savePost = async function(post) {
  const validationError = (message) => ({ status: 400, message });

  const lengthCheck = (str, max, name) => {
    if (!str) {
      return null;
    }
    if (typeof str !== "string") {
      return `${name}: expected string.`;
    }
    if (str.length > max) {
      return `${name} must be under ${max} characters.`;
    }
    return null;
  };

  const formatPostContent = (str) => {
    if (!str || typeof str !== "string") {
      return null;
    }
    str = str.replace(/&gt;&gt;([0-9]*)\/([0-9]*)/gm, 
      "<a class='quotelink' data-id='$2' href='../threads/$2#$3'>>>$2/$3</a>"
    );
    str = str.replace(/&gt;&gt;([0-9]*)/gm, 
      "<a class='quotelink' data-id='$1' href='#$1'>>>$1</a>"
    );
    str = str.replace(/^&gt;(.*)/gm, "<span class='quote'>$1</span>");
    return str;
  };

  let lengthError = null;
  lengthError = lengthCheck(post.name, config.posts.maxNameLength, "Name") || lengthError;
  lengthError = lengthCheck(post.subject, config.posts.maxSubjectLength, "Subject") || lengthError;
  lengthError = lengthCheck(post.content, config.posts.maxContentLength, "Content") || lengthError;
  if(lengthError) throw validationError(lengthError);
  if(post.parent) {
    if(config.posts.replies.requireContentOrFiles && (!post.files) && !post.content) {
      throw validationError("Content or file required");
    }
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

  post.content = formatPostContent(post.content);

  const postFiles = post.files;
  delete post.files;
  const dbConnecton = await persistence.rawDb.getConnection();
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
        // Copy temp store to permanent
        await fs.copy(
          userFile.tempPath,
          path.join(config.posts.filesDir, userFile.filename)
        );
        // Create thumbnail on image mimetypes
        if(userFile.thumbFilename) {
          await fs.createThumbnail(
            path.join(config.posts.filesDir, userFile.filename),
            path.join(config.posts.filesDir, userFile.thumbFilename),
            config.posts.thumbWidth
          );
        }
        delete userFile.tempPath;
        // Save to db
        await dbConnecton.query({
          sql: "INSERT INTO files SET postUId = ?, ?",
          values: [insertedPost.insertId, userFile]
        });
      }));
    }
    await dbConnecton.commit();
  } catch(error) {
    dbConnecton.rollback();
    throw new Error(error);
  } finally {
    dbConnecton.release();
  }
};