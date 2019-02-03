const db = require("../../database/database");
const miscFunctions = require("../../libs/miscfunctions");
const path = require("path");
const postsConfig = require("../../config/posts");
var boardCache = [];

exports.genCache = () => {
    db.fetchAll("SELECT * FROM boards").then(boards => {
        boardCache = boards;
    }).catch(e => {
        throw `Error caching boards\n${e}`;
    });
};

exports.checkBoard = async (ctx, next) => {
    const boardUrl = ctx.params.board;
    for (const board of boardCache) {
        if (board.url === boardUrl) {
            ctx.state.board = board;
            return await next();
        }
    }
    const board = db.fetch("SELECT * FROM boards where url = ?", boardUrl);
    if (!board) {
        return ctx.throw(404, "Board not found");
    }
    ctx.state.board = board;
    return await next();
};

exports.processPost = async (ctx, next) => {
    const post = ctx.state.postData.post;
    const files = ctx.state.postData.files;
    if (!post) {
        return ctx.throw(500, "No post object found on context state");
    }
    const insertPost = await db.query(`INSERT INTO posts_${ctx.state.board.url} set ?`, post);
    let i = 0;
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
            i++;
        }));
    }
    ctx.state.processedFiles = i;
    ctx.state.postId = insertPost.inserted;
    await next();
};


exports.render = async ctx => {
    if (boardCache.length > 0) {
        return await ctx.render("boards", { boards: boardCache });
    }
    const boards = await db.fetchAll("SELECT * FROM boards");
    return await ctx.render("boards", { boards });
};