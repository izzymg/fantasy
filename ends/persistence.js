// Database and filesystem interactions

const path = require("path");
const fs = require("../libs/fs");
const memstore = require("../libs/memstore");
const sql = require("../libs/sql");
const redis = require("../libs/redis");
const config = require("../config/config");
const secrets = require("../config/private");
let database;
let mem;

exports.initialize = async() => {
  database = sql.createPool(secrets.database, config.database);
  if(config.database.memStore) {
    mem = memstore.createClient();
  } else {
    mem = await redis.createClient(secrets.redis);
  }
};

exports.end = async() => await Promise.all([database.end(), mem.close()]);

exports.query = ({ sql, values = [], nestTables = false }) => 
  database.query({ sql, values, nestTables });
exports.getOne = ({ sql, values = [], nestTables = false }) => 
  database.getOne({ sql, values, nestTables });
exports.getAll = async({ sql, values = [], nestTables = false }) => 
  database.getAll({ sql, values, nestTables });

exports.getBoards = async() => await database.getAll({
  sql: "SELECT url, title, about, bumpLimit, maxThreads, cooldown, createdAt, sfw FROM boards",
});

exports.getBoard = async(url) => await database.getOne({
  sql: "SELECT url, title, about, bumpLimit,\
    maxThreads, cooldown, createdAt, sfw FROM boards WHERE url = ?",
  values: url,
});

exports.getPost = async(board, id) => {
  const data = await database.getAll({
    sql: "SELECT postId AS id, createdAt, name, subject, content, sticky, parent \
            filename, thumbFilename, originalName, mimetype, size\
            FROM posts\
            LEFT JOIN files ON files.postUid = posts.uid\
            WHERE boardUrl = ? AND postId = ?",
    values: [board, id],
    nestTables: true,
  });
  if(!data) return null;

  const post = data[0].posts;
  if(post.files)
    post.files = data.map((data) => data.files);
  return post;
};

exports.getThread = async(board, id) => {
  const data = await database.getAll({
    sql: "SELECT postId AS id, createdAt, name, subject, content, sticky, lastBump, \
            filename, thumbFilename, originalName, mimetype, size\
            FROM posts\
            LEFT JOIN files ON files.postUid = posts.uid\
            WHERE parent = 0 AND boardUrl = ? AND postId = ?",
    values: [board, id],
    nestTables: true,
  });
  if(!data) return null;

  // Remove duplicate post data from op
  const op = data[0].posts;
  op.files = data.map((data) => data.files);
  return op;
};

exports.getThreads = async(board) => {
  const data = await database.getAll({
    sql: "SELECT postId AS id, createdAt,\
            name, subject, content, sticky, filename, thumbFilename, lastBump \
            FROM posts LEFT JOIN files ON posts.uid = files.postUid \
            WHERE boardUrl = ? AND parent = 0 \
            ORDER BY sticky DESC, lastBump DESC",
    values: board,
    nestTables: true,
  });
    // Remove duplicate post data from join and process into ordered array
  if(!data) return;
  const threads = [];
  data.forEach((data) => {
    let found = false;
    threads.forEach((thread) => {
      if (thread.id === data.posts.id) {
        thread.files.push(data.files);
        found = true;
      }
    });
    if (!found) {
      data.posts.files = [];
      if (data.files.filename) {
        data.posts.files.push(data.files);
      }
      threads.push(data.posts);
    }
  });
  return threads;
};

exports.getReplies = async(board, id) => {
  const data = await database.getAll({
    sql: "SELECT postId AS id, createdAt, name, subject, content, sticky,\
            filename, thumbFilename, originalName, mimetype, size\
            FROM posts\
            LEFT JOIN files ON files.postUid = posts.uid\
            WHERE boardUrl = ? AND parent = ?\
            ORDER BY createdAt ASC",
    values: [board, id],
    nestTables: true,
  });
  if(!data) {
    return null;
  }
  // Remove duplicate post data from join and process into ordered array
  const replies = [];
  data.forEach((replyData) => {
    let found = false;
    replies.forEach((reply) => {
      if (reply.id === replyData.posts.id) {
        reply.files.push(replyData.files);
        found = true;
      }
    });
    if (!found) {
      replyData.posts.files = [];
      if (replyData.files.filename) {
        replyData.posts.files.push(replyData.files);
      }
      replies.push(replyData.posts);
    }
  });
  return replies;
};


exports.getPostIp = async(board, id) => await database.getOne({
  sql: "SELECT boardUrl, postId AS id, ip \
    FROM posts WHERE boardUrl = ? AND postId = ?",
  values: [board, id]
});

exports.submitPost = async({ 
  boardUrl, parent, name, subject, content,
  lastBump = parent == 0 ? new Date(Date.now()) : null, ip }) => {

  let postUid;
  let connection;
  try {
    // Manually obtain connection to start safe transaction
    connection = await database.getConnection();
    await connection.beginTransaction();

    const inserted = await connection.query({
      sql: "INSERT INTO posts \
       SET postId = (SELECT id FROM boardids WHERE boardUrl = ? FOR UPDATE), ?",
      values: [boardUrl, { boardUrl, parent, name, subject, content, lastBump, ip }], 
    });

    await connection.query({
      sql: "UPDATE boardids SET id = id + 1 WHERE boardUrl = ?",
      values: [boardUrl]
    });

    // Wait for all queries in the transaction and pull post ID
    if(!inserted.insertId) {
      throw "Post insertion failed";
    }
    postUid = inserted.insertId;
    await connection.commit();
  } catch(error) {
    await connection.rollback();
    throw error;
  } finally {
    // Always release connection back into pool after use
    connection.release();
  }
  return { postUid };
};

exports.deletePost = async(board, id) => {
  const files = await database.getAll({
    sql: "SELECT filename \
            FROM files INNER JOIN posts ON files.postUid = posts.uid \
            WHERE boardUrl = ? AND (postId = ? OR parent = ?)",
    values: [board, id, id]}
  );
  let deletedFiles = 0;
  if (files && files.length > 0) {
    const fileDeletion = files.map(async(file) => {
      await fs.unlink(
        path.join(config.posts.filesDir, file.filename)
      );
      if (file.thumbFilename) {
        await fs.unlink(
          path.join(config.posts.filesDir, file.thumbFilename)
        );
      }
      deletedFiles++;
    });
    await Promise.all(fileDeletion);
  }
  const { affectedRows } = await database.query({
    sql: "DELETE posts, files FROM posts \
            LEFT JOIN files ON files.postUid = posts.uid \
        WHERE boardUrl = ? AND (postId = ? OR parent = ?)",
    values: [board, id, id]
  });
  return { deletedPosts: affectedRows, deletedFiles };
};

exports.saveFile = async(
  { postUid, filename, thumbFilename = null, tempPath, mimetype, size, originalName, hash },
  deleteTemp = false) => {

  const permaPath = path.join(config.posts.filesDir, filename);

  // Move temp file into permanent store
  await fs.copy(tempPath, permaPath);
  if(deleteTemp) {
    await fs.unlink(tempPath);
  }

  if(thumbFilename) {
    await fs.createThumbnail(
      permaPath,
      path.join(
        config.posts.filesDir,
        thumbFilename
      ),
      config.posts.thumbWidth
    );
  }

  await database.query({
    sql: "INSERT INTO files SET ?",
    values: [{ postUid, filename, thumbFilename, mimetype, size, originalName, hash }]
  });
};

exports.getThreadCount = async(board) => {
  const num = await database.getOne({
    sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = 0",
    values: [board]
  });
  if(!num) throw "Thread count failed";
  return num.count;
};

exports.getReplyCount = async(board, id) => {
  const numReplies = await database.getOne({
    sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = ?",
    values: [board, id]
  });
  if(!numReplies) return 0;
  return numReplies.count;
};

exports.getOldestThreadId = async(board) =>  {
  const oldest = await database.getOne({
    sql: "SELECT postId as id FROM posts WHERE parent = 0 AND boardUrl = ? AND sticky = false \
            ORDER BY lastBump ASC LIMIT 1;",
    values: [board]
  });
  if(!oldest) return null;
  return oldest.id;
};

exports.bumpPost = async(board, id) =>  {
  const now = new Date(Date.now());
  const res = await database.query({
    sql: "UPDATE posts SET lastBump = ? WHERE boardUrl = ? AND parent = 0 AND postId = ?",
    values: [now, board, id]
  });
  if (!res || !res.affectedRows) {
    throw "Bump failed";
  }
  return now;
};

exports.getBans = async(ip) => await database.getAll({
  sql: "SELECT boardUrl, expires, reason FROM WHERE bans ip = ?",
  values: [ip]
});

exports.getBan = async(ip, board) => await database.getOne({
  sql: "SELECT uid, expires, reason FROM bans WHERE ip = ? AND (boardUrl = ? OR allBoards = true)",
  values: [ip, board]
});

exports.deleteBan = async(uid) => await database.query({
  sql: "DELETE FROM bans WHERE uid = ?",
  values: [uid]
});

exports.createBan = async({ ip, boardUrl, expires, reason, allBoards = false }) => {
  await database.query({
    sql: "INSERT INTO bans SET ?",
    values: { ip, boardUrl, expires, reason, allBoards }
  });
};

exports.updateUserPassword = async(username, newPassHash) => await database.query({
  sql: "UPDATE users SET password = ? WHERE username = ?",
  values: [newPassHash, username]
});

exports.getUsers = async() =>  await database.getAll({
  sql: "SELECT username, createdAt FROM users"
});

exports.getUser = async(username) =>  await database.getOne({
  sql: "SELECT username, password, createdAt FROM users WHERE username = ?",
  values: [username]
});

exports.isUserAdministrator = async(username) => {
  const admin = await database.getOne({
    sql: "SELECT createdAt FROM administrators WHERE username = ?",
    values: [username]
  });
  return Boolean(admin && admin.createdAt);
};

exports.isUserModerator = async(username, boardUrl) => {
  const mod = await database.getOne({
    sql: "SELECT createdAt FROM moderators WHERE boardUrl = ? AND username = ?",
    values: [boardUrl, username]
  });
  return Boolean(mod && mod.createdAt);
};

exports.isModOrAdmin = async(username, boardUrl) => {
  const res = await database.getOne({
    sql: "SELECT createdAt FROM administrators WHERE username = ? \
    UNION SELECT createdAt FROM moderators WHERE boardUrl = ? AND username = ?",
    values: [username, boardUrl, username]
  });
  return Boolean(res && res.createdAt);
};

exports.createSession = async(id, username) => {
  await mem.hSet(id, "username", username);
  await mem.expire(id, 48 * 60 * 60);
};

exports.deleteSession = async(id) => {
  await mem.del(id);
};

exports.getSession = async(id) => {
  const username = await mem.hGet(id || "", "username");
  if(!username) return null;
  return { username };
};

exports.setLoginAttempts = async(ip, attempts, lastAttempt) => {
  await Promise.all([
    mem.hSet(ip, "attempts", attempts), mem.hSet(ip, "lastAttempt", lastAttempt)
  ]);
  await mem.expire(ip, 24 * 60 * 60);
};

exports.getLoginAttempts = async(ip) => {
  const [attempts, lastAttempt] = await Promise.all([
    mem.hGet(ip || "", "attempts"), mem.hGet(ip || "", "lastAttempt")
  ]);
  return { attempts: parseInt(attempts) || 0, lastAttempt: parseInt(lastAttempt) || 0 };
};

exports.createCooldown = async(ip, seconds) => {
  await mem.hSet(ip, "cooldown", Date.now() + seconds * 1000);
  await mem.expire(ip, 24 * 60 * 60);
};

exports.getCooldown = async(ip) => {
  const cd = Number(await mem.hGet(ip, "cooldown"));
  let now = Date.now();
  if (cd) {
    if(cd < now) {
      // Delete cooldown field if in the past
      await mem.hDel(ip, "cooldown");
      return null;
    }
    return Math.floor((cd - now) / 1000);
  }
  return null;
};