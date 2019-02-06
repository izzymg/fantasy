const db = require("../../database/database");
const postsConfig = require("../../config/posts");
const fileFunctions = require("../../libs/fileFunctions");
const path = require("path");
const multipart = require("../../libs/multipart");
const { trimEscapeHtml } = require("../../libs/textFunctions");

exports.getMultipart = async function (ctx) {

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
};

exports.submitPost = async function ({ boardUrl, parent, name, subject, content }, files) {
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
            values: { parent, name, subject, content, boardUrl }
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
};