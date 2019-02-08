const db = require("../../database/database");
const postsConfig = require("../../config/posts");
const fileFunctions = require("../../libs/fileFunctions");
const path = require("path");
const multipart = require("../../libs/multipart");
const { trimEscapeHtml } = require("../../libs/textFunctions");
const parse = require("co-body");

// Incomming JSON and urlencoded form data
async function getForm(ctx) {
    if (ctx.is("application/json")) {
        try {
            return await parse(ctx, { limit: "12kb" });
        } catch (error) {
            if (error.status === 400) {
                throw { status: 400, text: "Received invalid JSON data" };
            }
        }
    }
    if (ctx.is("application/x-www-form-urlencoded")) {
        try {
            return await parse(ctx, { limit: "12kb" });
        } catch (error) {
            if (error.status === 400) {
                throw { status: 400, text: "Received invalid formdata" };
            }
        }
    }
    throw { status: 400, text: "Expected JSON or urlencoded form data" };
}

// Strips files and fields off of multipart requests
async function getMultipart(ctx) {

    if (!ctx.is("multipart/form-data")) {
        throw { status: 400, text: "Expected multipart/form-data" };
    }
    let data;
    try {
        data = await multipart(ctx, postsConfig.maxFileSize, postsConfig.maxFiles, postsConfig.tmpDir, postsConfig.md5);
    } catch (error) {
        switch (error) {
            case "UNACCEPTED_MIMETYPE":
                throw ({ status: 400, text: "Unaccepted mimetype" });
            case "FILE_SIZE_LIMIT":
                throw ({ status: 400, text: `Files must be under ${Math.floor(postsConfig.maxFileSize / 1000)}kb` });
            case "FILES_LIMIT":
                throw ({ status: 400, text: `You may not send more than ${postsConfig.maxFiles} files` });
            case "FIELDS_LIMIT":
                throw ({ status: 400, text: "Too many text fields" });
            default:
                throw (new Error(error));
        }
    }

    if (data.fields) {
        for (const field in data.fields) {
            data.fields[field] = trimEscapeHtml(data.fields[field]);
        }
    }

    if (data.files) {
        for (const file of data.files) {
            file.originalName = trimEscapeHtml(file.originalName);
        }
    }
    return { fields: data.fields, files: data.files };
}

async function submitPost({ boardUrl, parent, name, subject, content, lastBump }, files) {
    const queries = [
        {
            sql: "SELECT @boardId:=MAX(boardId) FROM posts WHERE boardUrl = ?",
            values: boardUrl
        },
        {
            sql: "SET @boardId = COALESCE(@boardId, 0)"
        },
        {
            sql: "SET @boardId = @boardId + 1"
        },
        {
            sql: "INSERT INTO posts SET boardId = @boardId, ?",
            values: { boardUrl, parent, name, subject, content, lastBump }
        },
        {
            sql: "SELECT @boardId as postId"
        }
    ];
    const [, , , insertPost, selectId] = await db.transaction(queries);
    let postId = selectId[0].postId;
    let processedFiles = 0;
    if (files && files.length > 0) {
        await Promise.all(files.map(async file => {
            const permaPath = path.join(postsConfig.filesDir, `${file.fileId}.${file.extension}`);

            // Move temp file into permanent store
            try {
                await fileFunctions.rename(file.tempPath, permaPath);
            } catch (error) {
                await fileFunctions.unlink(file.tempPath);
            }

            // Create thumbnail if mimetype contains "image"
            if (file.mimetype.indexOf("image") != -1) {
                await fileFunctions.createThumbnail(permaPath, path.join(postsConfig.filesDir, `${file.fileId}${postsConfig.thumbSuffix}.jpg`), postsConfig.thumbWidth);
                file.thumbSuffix = postsConfig.thumbSuffix;
            }

            // Object is modified to fit database columns
            delete file.tempPath;
            file.postUid = insertPost.insertId;
            processedFiles++;
            await db.query("INSERT INTO files SET ?", file);
        }));
    }
    return { postId, processedFiles };
}

async function deletePostAndReplies(id, board) {
    const files = await db.fetchAll(
        `SELECT fileId, extension, thumbSuffix 
        FROM files INNER JOIN posts ON files.postUid = posts.uid
        WHERE boardUrl = ? AND (boardId = ? OR parent = ?)`,
        [board, id, id]);
    let deletedFiles = 0;
    if (files && files.length > 1) {
        await Promise.all(files.map(async file => {
            await fileFunctions.unlink(path.join(postsConfig.filesDir, file.fileId + "." + file.extension));
            if (file.thumbSuffix) {
                await fileFunctions.unlink(path.join(postsConfig.filesDir, file.fileId + file.thumbSuffix + "." + file.extension));
            }
            deletedFiles++;
        }));
    }
    const { affected } = await db.query(
        `DELETE posts, files FROM posts
        LEFT JOIN files ON files.postUid = posts.uid
        WHERE boardUrl = ? AND (boardId = ? OR parent = ?)`,
        [board, id, id]);
    // Affected rows includes file entries deleted in sql join: subtracted for number of posts only
    return { deletedPosts: affected - deletedFiles, deletedFiles };
}

async function deleteOldestThread(boardUrl, boardMaxThreads) {
    const num = await db.fetch("SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = 0", boardUrl);
    if (num.count >= boardMaxThreads) {
        const oldest = await db.fetch("SELECT boardId, MIN(lastBump) FROM posts WHERE boardUrl = ?", boardUrl);
        if (oldest) {
            return await deletePostAndReplies(oldest.boardId, boardUrl);
        }
    }
}

async function bumpPost(boardUrl, id, boardBumpLimit) {
    const numReplies = await db.query("SELECT COUNT(uid) AS count FROM posts WHERE boardUrl = ? AND parent = ?", [boardUrl, id]);
    if (numReplies.count < boardBumpLimit) {
        const { affected } = await db.query("UPDATE posts SET lastBump = NOW() WHERE boardUrl = ? AND parent = 0 AND boardId = ?", [boardUrl, id]);
        if (!affected) {
            throw "Bump failed";
        }
    }
    return;
}

module.exports = {
    getForm,
    getMultipart,
    submitPost,
    deletePostAndReplies,
    deleteOldestThread,
    bumpPost
};