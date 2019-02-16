// Database and filesystem interactions

const path = require("path");
const fs = require("../libs/fileFunctions");
const memstore = require("../libs/memstore");
const sql = require("../libs/sql");
const redis = require("../libs/redis");
const config = require("../config/config");
const secrets = require("../config/private");
let database;
let mem;

exports.initialize = async () => {
    database = sql.createPool(secrets.database, config.database);
    if(config.database.memStore) {
        mem = memstore.createClient();
    } else {
        mem = await redis.createClient(secrets.redis);
    }
};

exports.end = async () => await Promise.all([database.end(), mem.close()]);

exports.getBoards = async () => await database.getAll({
    sql: "SELECT url, title, about, bumpLimit, maxThreads, cooldown, createdAt, sfw FROM boards",
});

exports.getBoard = async url => await database.getOne({
    sql: "SELECT url, title, about, bumpLimit,\
    maxThreads, cooldown, createdAt, sfw FROM boards WHERE url = ?",
    values: url,
});

exports.getThread = async (board, id) => {
    const data = await database.getAll({
        sql: "SELECT postId AS id, createdAt, name, subject, content, sticky, lastBump, \
            fileId, extension, thumbSuffix, originalName, mimetype, size\
            FROM posts\
            LEFT JOIN files ON files.postUid = posts.uid\
            WHERE parent = 0 AND boardUrl = ? AND postId = ?",
        values: [board, id],
        nestTables: true,
    });
    if(!data) return null;

    // Remove duplicate post data from op
    const op = data[0].posts;
    op.files = data.map(data => data.files);
    return op;
};

exports.getThreads = async board => {
    const data = await database.getAll({
        sql: "SELECT postId AS id, createdAt AS date,\
            name, subject, content, sticky, fileId, extension, thumbSuffix, lastBump \
            FROM posts LEFT JOIN files ON posts.uid = files.postUid \
            WHERE boardUrl = ? AND parent = 0 \
            ORDER BY lastBump DESC",
        values: board,
        nestTables: true,
    });
    // Remove duplicate post data from join and process into ordered array
    if(!data) return;
    const threads = [];
    data.forEach(data => {
        let found = false;
        threads.forEach(thread => {
            if (thread.id === data.posts.id) {
                thread.files.push(data.files);
                found = true;
            }
        });
        if (!found) {
            data.posts.files = [];
            if (data.files.fileId) {
                data.posts.files.push(data.files);
            }
            threads.push(data.posts);
        }
    });
    return threads;
};

exports.getReplies = async (board, id) => {
    const data = await database.getAll({
        sql: "SELECT postId AS id, createdAt, name, subject, content, sticky,\
            fileId, extension, thumbSuffix, originalName, mimetype, size\
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
    data.forEach(replyData => {
        let found = false;
        replies.forEach(reply => {
            if (reply.id === replyData.posts.id) {
                reply.files.push(replyData.files);
                found = true;
            }
        });
        if (!found) {
            replyData.posts.files = [];
            if (replyData.files.fileId) {
                replyData.posts.files.push(replyData.files);
            }
            replies.push(replyData.posts);
        }
    });
    return replies;
};

exports.submitPost = async ({ 
    boardUrl, parent, name, subject, content,
    lastBump = parent == 0 ? new Date(Date.now()) : null }) => {

    let postId;
    let postUid;
    let connection;
    try {
        // Manually obtain connection to start safe transaction
        connection = await database.getConnection();
        await connection.beginTransaction();
        
        const transaction = [];

        // Get last post ID from board or 0, and increment by 1
        transaction.push(connection.query({ 
            sql: "SELECT @postId:=MAX(postId) FROM posts WHERE boardUrl = ?",
            values: boardUrl
        }));
        transaction.push(connection.query({ sql: "SET @postId = COALESCE(@postId, 0)" }));
        transaction.push(connection.query({ sql: "SET @postId = @postId + 1" }));

        // Push post to database
        transaction.push(connection.query({
            sql: "INSERT INTO posts SET postId = @postId, ?",
            values: { boardUrl, parent, name, subject, content, lastBump }, 
        }));

        transaction.push(connection.getOne({ sql: "SELECT @postId as postId" }));

        // Wait for all queries in the transaction and pull post ID
        const [,,, inserted, selectId] = await Promise.all(transaction);
        if(!inserted.insertId) {
            throw "Post insertion failed";
        }
        postId = selectId.postId;
        postUid = inserted.insertId;
        await connection.commit();
    } catch(error) {
        await connection.rollback();
        throw error;
    } finally {
        // Always release connection back into pool after use
        connection.release();
    }
    return { postId, postUid };
};

exports.deletePost = async (board, id) => {
    const files = await database.getAll({
        sql: "SELECT fileId, extension, thumbSuffix \
            FROM files INNER JOIN posts ON files.postUid = posts.uid \
            WHERE boardUrl = ? AND (postId = ? OR parent = ?)",
        values: [board, id, id]}
    );
    let deletedFiles = 0;
    if (files && files.length > 0) {
        const fileDeletion = files.map(async file => {
            await fs.unlink(
                path.join(config.posts.filesDir, file.fileId + "." + file.extension)
            );
            if (file.thumbSuffix) {
                await fs.unlink(
                    path.join(config.posts.filesDir, file.fileId + file.thumbSuffix + ".jpg")
                );
            }
            deletedFiles++;
        });
        await Promise.all(fileDeletion);
    }
    const { affectedRows: deletedRows } = await database.query({
        sql: "DELETE posts, files FROM posts \
            LEFT JOIN files ON files.postUid = posts.uid \
        WHERE boardUrl = ? AND (postId = ? OR parent = ?)",
        values: [board, id, id]
    });
    return { deletedPosts: deletedRows - deletedFiles, deletedFiles };
};

exports.saveFile = async (
    { postUid, id, extension, tempPath, mimetype, size, originalName, hash },
    createThumb = false, deleteTemp = true) => {

    const permaPath = path.join(
        config.posts.filesDir,
        `${id}.${extension}`
    );

    // Move temp file into permanent store
    await fs.copy(tempPath, permaPath);
    if(deleteTemp) {
        fs.unlink(tempPath);
    }

    const post = {
        fileId: id, postUid, extension, 
        mimetype, size, originalName, hash
    };

    if(createThumb) {
        await fs.createThumbnail(
            permaPath,
            path.join(
                config.posts.filesDir,
                `${id}${config.posts.thumbSuffix}.jpg`
            ),
            config.posts.thumbWidth
        );
        post.thumbSuffix = config.posts.thumbSuffix;
    }

    await database.query({
        sql: "INSERT INTO files SET ?",
        values: [post]
    });
};

exports.getThreadCount = async board => {
    const num = await database.getOne({
        sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = 0",
        values: [board]
    });
    if(!num) throw "Thread count failed";
    return num.count;
};

exports.getReplyCount = async (board, id) => {
    const numReplies = await database.getOne({
        sql: "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = ?",
        values: [board, id]
    });
    if(!numReplies) return 0;
    return numReplies.count;
};

exports.getOldestThreadId = async board =>  {
    const oldest = await database.getOne({
        sql: "SELECT postId as id FROM posts WHERE parent = 0 AND boardUrl = ? \
            ORDER BY lastBump ASC LIMIT 1;",
        values: [board]
    });
    if(!oldest) return null;
    return oldest.id;
};

exports.bumpPost = async (board, id) =>  {
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


exports.getUsers = async () =>  await database.getAll({
    sql: "SELECT username, createdAt FROM users"
});

exports.isUserAdmin = async username => {
    const res = await database.getOne({
        sql: "SELECT username FROM administrators WHERE username = ?",
        values: username
    });
    if(res && res.username) return true;
    return false;
};

exports.getUserModeration = async username => await database.getAll({
    sql: `SELECT url, title, about, sfw FROM boardmods
    INNER JOIN boards ON boards.url = boardmods.boardUrl
    WHERE boardmods.username = ?`,
    values: username
});

exports.createCooldown = async (ip, seconds) => {
    await mem.hSet(ip, "cooldown", Date.now() + seconds * 1000);
    await mem.expire(ip, 24 * 60 * 60);
};

exports.getCooldown = async ip => {
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