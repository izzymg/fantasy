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

exports.validateThread = async (ctx, next) => {

    if (!ctx.state.post.post) {
        return ctx.throw(500, "No post object found on context state");
    }

    ctx.state.post.post.parent = 0;

    if (!ctx.state.post.post.name) {
        ctx.state.post.post.name = postsConfig.defaultName;
    }
    if (!ctx.state.post.post.content) {
        if (postsConfig.threads.requireContent) {
            return ctx.throw(400, "Post content required");
        }
        ctx.state.post.post.content = "";
    }
    if (!ctx.state.post.post.subject) {
        if (postsConfig.threads.requireSubject) {
            return ctx.throw(400, "Post subject required");
        }
        ctx.state.post.post.subject = "";
    }

    if (ctx.state.post.files.length < 1) {
        if (postsConfig.threads.requireFiles) {
            return ctx.throw(400, "File required to post");
        }
    }
    return await next();
};


exports.validateReply = async (ctx, next) => {
    if (!ctx.state.post.post) {
        return ctx.throw(500, "No post object found on context state");
    }

    ctx.state.post.post.parent = ctx.params.thread;

    ctx.state.post.post.subject = null;
    if (!ctx.state.post.post.name) {
        ctx.state.post.post.name = postsConfig.defaultName;
    }
    if (postsConfig.replies.requireContentOrFiles) {
        if (!ctx.state.post.post.content && ctx.state.post.files.length < 1) {
            return ctx.throw(400, "Post content or files required");
        }
    }
    return await next();
};

exports.submitPost = async ctx => {
    const insertPost = await db.query(`INSERT INTO posts_${ctx.state.board.url} set ?`, ctx.state.post.post);
    let processedFiles = 0;
    await Promise.all(ctx.state.post.files.map(async file => {
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
        processedFiles++;
        await db.query(`INSERT INTO files_${ctx.state.board.url} set ?`, file);
    }));
    ctx.body = `Created post ${insertPost.inserted}${processedFiles ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}` : "."}`;
};


exports.render = async ctx => {
    if (boardCache && boardCache.length > 0) {
        return await ctx.render("boards", { boards: boardCache });
    }
    const boards = await db.fetchAll("SELECT * FROM boards");
    return await ctx.render("boards", { boards });
};