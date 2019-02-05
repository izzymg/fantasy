const db = require("../../database/database");
const miscFunctions = require("../../libs/miscfunctions");
const path = require("path");
const postsConfig = require("../../config/posts");
var boardCache = [];

exports.genCache = async () => {
    const boards = await db.fetchAll("SELECT url, title, about, bumpLimit, maxThreads, createdAt FROM boards");
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
    const board = await db.fetch("SELECT url, title, about, bumpLimit, maxThreads, createdAt FROM boards where boardUrl = ?", boardUrl);
    if (!board) {
        return ctx.throw(404);
    }
    ctx.state.board = board;
    await next();
};

exports.checkThread = async (ctx, next) => {
    const thread = await db.fetch("SELECT boardId FROM posts WHERE parent = 0 AND boardUrl = ? AND boardId = ?", [ctx.state.board.url, ctx.params.thread]);
    if (!thread) {
        return ctx.throw(404);
    }
    await next();
};

exports.validateThread = async (ctx, next) => {

    if (!ctx.state.post) {
        return ctx.throw(500, "No post object found on context state");
    }

    ctx.state.post.parent = 0;

    if (!ctx.state.post.name) {
        ctx.state.post.name = postsConfig.defaultName;
    }
    if (!ctx.state.post.content) {
        if (postsConfig.threads.requireContent) {
            return ctx.throw(400, "Post content required");
        }
        ctx.state.post.content = "";
    }
    if (!ctx.state.post.subject) {
        if (postsConfig.threads.requireSubject) {
            return ctx.throw(400, "Post subject required");
        }
        ctx.state.post.subject = "";
    }

    if (ctx.state.post.files.length < 1) {
        if (postsConfig.threads.requireFiles) {
            return ctx.throw(400, "File required to post");
        }
    }
    await next();
};


exports.validateReply = async (ctx, next) => {
    if (!ctx.state.post) {
        return ctx.throw(500, "No post object found on context state");
    }

    ctx.state.post.parent = ctx.params.thread;

    ctx.state.post.subject = null;
    if (!ctx.state.post.name) {
        ctx.state.post.name = postsConfig.defaultName;
    }
    if (postsConfig.replies.requireContentOrFiles) {
        if (!ctx.state.post.content && ctx.state.post.files.length < 1) {
            return ctx.throw(400, "Post content or files required");
        }
    }
    await next();
};

exports.submitPost = async ctx => {
    ctx.state.post.boardUrl = ctx.state.board.url;
    const files = ctx.state.post.files;
    delete ctx.state.post.files;
    const queries = [
        {
            sql: "SELECT @boardId:=MAX(boardId) FROM posts WHERE boardUrl = ?",
            values: ctx.state.board.url
        },
        {
            sql: "SET @boardId = COALESCE(@boardId, 0)"
        },
        {
            sql: "SET @boardId = @boardId + 1"
        },
        {
            sql: "INSERT INTO posts SET boardId = @boardId, ?",
            values: {...ctx.state.post}
        }
    ];
    const [,,,insertPost] = await db.transaction(queries);
    let processedFiles = 0;
    if (files && files.length > 0) {
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
            file.postUid = insertPost.insertId;
            processedFiles++;
            await db.query("INSERT INTO files SET ?", file);
        }));
    }
    ctx.body = `Post created${processedFiles ? `, uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}` : "."}`;
};


exports.render = async ctx => {
    if (boardCache && boardCache.length > 0) {
        return await ctx.render("boards", { boards: boardCache });
    }
    const boards = await db.fetchAll("SELECT url, title, about, bumpLimit, maxThreads, createdAt FROM boards");
    await ctx.render("boards", { boards });
};