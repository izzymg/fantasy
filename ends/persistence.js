const sql = require("../libs/sql");
const config = require("../config/config");
const secrets = require("../config/private");
const database = sql.createPool(secrets.database, config.database);
const fs = require("../libs/fileFunctions");
const path = require("path");

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
        sql: "SELECT postId AS id, createdAt, name, subject, content, sticky,\
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
            name, subject, content, sticky, fileId, extension, thumbSuffix\
            FROM posts LEFT JOIN files ON posts.uid = files.postUid\
            WHERE boardUrl = ? AND parent = 0\
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

exports.submitPost = async ({ boardUrl, parent, name, subject, content, lastBump }) => {

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