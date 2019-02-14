const db = require("../../database/database");
const postsConfig = require("../../config/config").posts;
const fileFunctions = require("../../libs/fileFunctions");
const path = require("path");
const bcrypt = require("bcrypt");

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

exports.getUsers = async () =>  await db.fetchAll("SELECT username, createdAt FROM users");

exports.addMod = async (username, boardUrl) => {
    const res = await db.query("INSERT INTO boardmods SET ?", { username, boardUrl });
    if(!res.affected) {
        throw "Add moderator failed";
    }
    return username;
};

exports.getModOf = async username => await db.fetchAll(
    `SELECT url, title, about, sfw FROM boardmods
    INNER JOIN boards ON boards.url = boardmods.boardUrl
    WHERE boardmods.username = ?`, username
);

exports.canModOrAdmin = async (username, boardUrl) => {
    const res = await db.fetch(
        `SELECT username FROM boardmods
        WHERE username = ? AND boardUrl = ?
        UNION
        SELECT administrators.username FROM users
        INNER JOIN administrators
        ON administrators.username = users.username
        WHERE administrators.username = ?`,
        [username, boardUrl, username]
    );
    if(res && res.username) return true;
    return false;
};

exports.isAdmin = async username => {
    const res = await db.fetch(
        "SELECT username FROM administrators WHERE username = ?",
        username
    );
    if(res && res.username) return true;
    return false;
};

exports.compareUserPassword = async (username, comparison) =>  {
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
