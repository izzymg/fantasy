const db = require("../../database/database");
var boardCache = [];

exports.genCache = async () => {
    const boards = await db.fetchAll(
        "SELECT url, title, about, bumpLimit, maxThreads, cooldown, createdAt FROM boards"
    );
    boardCache = boards || [];
};

exports.checkBoard = async (ctx, next) => {
    const boardUrl = ctx.params.board;
    for (const board of boardCache) {
        if (board.url === boardUrl) {
            ctx.state.board = board;
            return await next();
        }
    }
    const board = await db.fetch(
        "SELECT url, title, about, bumpLimit, maxThreads, cooldown, createdAt FROM boards where url = ?",
        boardUrl
    );
    if (!board) {
        return ctx.throw(404);
    }
    ctx.state.board = board;
    await next();
};

exports.render = async ctx => {
    if (boardCache && boardCache.length > 0) {
        return await ctx.render("boards", { boards: boardCache });
    }
    const boards = await db.fetchAll(
        "SELECT url, title, about, bumpLimit, maxThreads, cooldown, createdAt FROM boards"
    );
    await ctx.render("boards", { boards });
};
