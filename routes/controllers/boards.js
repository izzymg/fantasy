const db = require("../../database/database");
const miscFunctions = require("../../libs/miscfunctions");
const path = require("path");
const postsConfig = require("../../config/posts");
var boardCache = [];

exports.genCache = async () => {
    const boards = await db.fetchAll("SELECT * FROM boards");
    boardCache = boards;
};

exports.checkBoard = async (ctx, next) => {
    const boardUrl = ctx.params.board;
    for (const board of boardCache) {
        if (board.url === boardUrl) {
            ctx.state.board = board;
            return await next();
        }
    }
    const board = await db.fetch("SELECT * FROM boards where url = ?", boardUrl);
    if (!board) {
        return ctx.throw(404);
    }
    ctx.state.board = board;
    return await next();
};

exports.submitThread = async ctx => {

    // Form data
    const post = ctx.state.post.post;
    const files = ctx.state.post.files;
    if (!post) {
        return ctx.throw(500, "No post object found on context state");
    }

    // Validate field existence

    if (!post.name) {
        post.name = postsConfig.defaultName;
    }
    if (!post.content) {
        if (postsConfig.threads.requireContent) {
            return ctx.throw(400, "Post content required");
        }
        post.content = "";
    }
    if (!post.subject) {
        if (postsConfig.threads.requireSubject) {
            return ctx.throw(400, "Post subject required");
        }
        post.subject = "";
    }

    if (!files || files.length < 1) {
        if (postsConfig.threads.requireFiles) {
            return ctx.throw(400, "File required to post");
        }
    }

    // Standardise/escape text

    post.name = miscFunctions.standardText(post.name);
    post.subject = miscFunctions.standardText(post.subject);
    post.content = miscFunctions.standardText(post.content);
    post.parent = 0;

    if (files.length < 1) {
        ctx.state.post.files = null;
    } else {
        for (const file of files) {
            file.originalName = miscFunctions.standardText(file.originalName);
        }
    }    

    const insertPost = await db.query(`INSERT INTO posts_${ctx.state.board.url} set ?`, post);
    let processedFiles = 0;
    if (files) {
        await Promise.all(files.map(async file => {
            const permaPath = path.join(postsConfig.filesDir, `${file.fileId}.${file.extension}`);
            // Move temp file into permanent store
            try {
                await miscFunctions.rename(file.tempPath, permaPath);
            } catch (error) {
                await miscFunctions.unlink(file.tempPath);
            }
            // Create thumbnail if mimetype contains "image"
            if (file.mimetype.indexOf("image") != -1) {
                await miscFunctions.createThumbnail(permaPath, path.join(postsConfig.filesDir, `${file.fileId}${postsConfig.thumbSuffix}.jpg`), postsConfig.thumbWidth);
                file.thumbSuffix = postsConfig.thumbSuffix;
            }
            // Object is modified to fit database columns
            delete file.tempPath;
            file.postId = insertPost.inserted;
            await db.query(`INSERT INTO files_${ctx.state.board.url} set ?`, file);
            processedFiles++;
        }));
    }
    ctx.body = `Created post ${insertPost.inserted} ${processedFiles ? `and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}` : "."}`;
};


exports.render = async ctx => {
    if (boardCache.length > 0) {
        return await ctx.render("boards", { boards: boardCache });
    }
    const boards = await db.fetchAll("SELECT * FROM boards");
    return await ctx.render("boards", { boards });
};