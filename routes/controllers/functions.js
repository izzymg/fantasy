const db = require("../../database/database");
const postsConfig = require("../../config/posts");
const fileFunctions = require("../../libs/fileFunctions");
const path = require("path");
const bcrypt = require("bcrypt");

exports.submitPost = async ({ boardUrl, parent, name, subject, content, lastBump }, files) =>  {
    const queries = [
        {
            sql: "SELECT @postId:=MAX(postId) FROM posts WHERE boardUrl = ?",
            values: boardUrl,
        },
        {
            sql: "SET @postId = COALESCE(@postId, 0)",
        },
        {
            sql: "SET @postId = @postId + 1",
        },
        {
            sql: "INSERT INTO posts SET postId = @postId, ?",
            values: { boardUrl, parent, name, subject, content, lastBump },
        },
        {
            sql: "SELECT @postId as postId",
        },
    ];
    const [, , , insertPost, selectId] = await db.transaction(queries);
    let postId = selectId[0].postId;
    let processedFiles = 0;
    if (files && files.length > 0) {
        await Promise.all(
            files.map(async file => {
                const permaPath = path.join(
                    postsConfig.filesDir,
                    `${file.fileId}.${file.extension}`
                );

                // Move temp file into permanent store
                try {
                    await fileFunctions.rename(file.tempPath, permaPath);
                } catch (error) {
                    await fileFunctions.unlink(file.tempPath);
                }

                // Create thumbnail if mimetype contains "image"
                if (file.mimetype.indexOf("image") != -1) {
                    await fileFunctions.createThumbnail(
                        permaPath,
                        path.join(
                            postsConfig.filesDir,
                            `${file.fileId}${postsConfig.thumbSuffix}.jpg`
                        ),
                        postsConfig.thumbWidth
                    );
                    file.thumbSuffix = postsConfig.thumbSuffix;
                }

                // Object is modified to fit database columns
                delete file.tempPath;
                file.postUid = insertPost.insertId;
                processedFiles++;
                await db.query("INSERT INTO files SET ?", file);
            })
        );
    }
    return { postId, processedFiles };
};

exports.deletePostAndReplies = async (id, board) =>  {
    const files = await db.fetchAll(
        `SELECT fileId, extension, thumbSuffix 
        FROM files INNER JOIN posts ON files.postUid = posts.uid
        WHERE boardUrl = ? AND (postId = ? OR parent = ?)`,
        [board, id, id]
    );
    let deletedFiles = 0;
    if (files && files.length > 0) {
        await Promise.all(
            files.map(async file => {
                try {
                    await fileFunctions.unlink(
                        path.join(postsConfig.filesDir, file.fileId + "." + file.extension)
                    );
                } catch (e) {
                    console.error(e);
                }
                if (file.thumbSuffix) {
                    try {
                        await fileFunctions.unlink(
                            path.join(postsConfig.filesDir, file.fileId + file.thumbSuffix + ".jpg")
                        );
                    } catch (e) {
                        console.error(e);
                    }
                    deletedFiles++;
                }
            })
        );
    }
    const { affected } = await db.query(
        `DELETE posts, files FROM posts
        LEFT JOIN files ON files.postUid = posts.uid
        WHERE boardUrl = ? AND (postId = ? OR parent = ?)`,
        [board, id, id]
    );
    // Affected rows includes file entries deleted in sql join: subtracted for number of posts only
    return { deletedPosts: affected - deletedFiles, deletedFiles };
};

exports.deleteOldestThread = async (boardUrl, boardMaxThreads) =>  {
    const num = await db.fetch(
        "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = 0",
        boardUrl
    );
    if (num.count > boardMaxThreads) {
        const oldest = await db.fetch(
            "SELECT postId, MIN(lastBump) FROM posts WHERE boardUrl = ?",
            boardUrl
        );
        if (oldest) {
            return await exports.deletePostAndReplies(oldest.postId, boardUrl);
        }
    }
};

exports.bumpPost = async (boardUrl, id, boardBumpLimit) =>  {
    const numReplies = await db.fetch(
        "SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = ?",
        [boardUrl, id]
    );
    if (numReplies.count < boardBumpLimit) {
        const { affected } = await db.query(
            "UPDATE posts SET lastBump = NOW() WHERE boardUrl = ? AND parent = 0 AND postId = ?",
            [boardUrl, id]
        );
        if (!affected) {
            throw "Bump failed";
        }
    }
    return;
};

exports.getBoard = async url => await db.fetch(`SELECT url, title, about, bumpLimit, 
    maxThreads, cooldown, createdAt, sfw FROM boards WHERE url = ?`, url);

exports.getBoards = async () => await db.fetchAll(`SELECT url, title, about, bumpLimit, 
maxThreads, cooldown, createdAt, sfw FROM boards`);

exports.getThreads = async board => {
    const data = await db.fetchAll(
        `SELECT postId AS id, createdAt AS date, name, subject, content, sticky,
            fileId, extension, thumbSuffix
        FROM posts
        LEFT JOIN files ON posts.uid = files.postUid
        WHERE boardUrl = ? AND parent = 0
        ORDER BY lastBump DESC`,
        board,
        true
    );
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

exports.getThread = async (board, id) => {
    const [opData, repliesData] = await Promise.all([
        db.fetchAll(
            `SELECT postId AS id, createdAt, name, subject, content, sticky,
            fileId, extension, thumbSuffix, originalName, mimetype, size
            FROM posts
            LEFT JOIN files ON files.postUid = posts.uid
            WHERE parent = 0 AND boardUrl = ? AND postId = ?`,
            [board, id],
            true
        ),
        db.fetchAll(
            `SELECT postId AS id, createdAt, name, subject, content, sticky,
            fileId, extension, thumbSuffix, originalName, mimetype, size
            FROM posts
            LEFT JOIN files ON files.postUid = posts.uid
            WHERE boardUrl = ? AND parent = ?
            ORDER BY createdAt ASC`,
            [board, id],
            true
        ),
    ]);

    if(!opData) return;

    // Remove duplicate post data from op
    const op = opData[0].posts;
    op.files = opData.map(data => data.files);

    if(!repliesData) {
        return { op };
    }
    
    let replyCount = 0;
    // Remove duplicate post data from join and process into ordered array
    const replies = [];
    repliesData.forEach(replyData => {
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
            replyCount++;
        }
    });
    return { op, replies, replyCount };
};

exports.postIsThread = async(board, id) => {
    const post = await db.fetch("SELECT parent FROM posts WHERE boardUrl = ? AND postId = ?",
        [board, id]
    );
    if(!post) return;
    return (post.parent === 0);
};

exports.createUser = async (username, password, role) =>  {
    const hash = await bcrypt.hash(password, 15);
    const res = await db.query("INSERT INTO users SET ?", { username, password: hash, role });
    if(!res.affected) {
        throw "Create user failed";
    }
    return username;
};

exports.getUsers = async () =>  await db.fetchAll("SELECT username, role, createdAt FROM users");

exports.getUser = async username =>  await db.fetch(
    "SELECT role, createdAt FROM users WHERE username = ?", username
);

exports.addMod = async (username, boardUrl) => {
    const res = await db.query("INSERT INTO boardmods SET ?", { username, boardUrl });
    if(!res.affected) {
        throw "Add moderator failed";
    }
    return username;
};

exports.canModOrAdmin = async (username, boardUrl) => {
    const res = await db.fetch(
        `SELECT username FROM boardmods
        WHERE username = ? AND boardUrl = ?
        UNION
        SELECT username FROM users
        WHERE username = ? AND role = "administrator"`,
        [username, boardUrl, username]
    );
    if(res && res.username) return true;
    return false;
};

exports.comparePasswords = async (username, comparison) =>  {
    const user = await db.fetch("SELECT password FROM users WHERE username = ?", username);
    if(!user) {
        return false;
    }
    return await bcrypt.compare(comparison, user.password);
};

exports.updateUserPassword = async (username, newPassword) =>  {
    const hash = await bcrypt.hash(newPassword, 15);
    const res = await db.query("UPDATE users SET password = ? WHERE username = ?",
        [hash, username]
    );
    if(!res.changed) {
        throw "Update password failed";
    }
    return username;
};
