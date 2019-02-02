const db = require("../../database/database");
var boardCache = [];

exports.genCache = () => {
    db.fetchAll("SELECT * FROM boards").then(boards => {
        boardCache = boards;
    }).catch(e => {
        throw `Error caching boards\n${e}`
    });
}

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
}

exports.render = async ctx => {
    try {
        if (boardCache.length > 0) {
            return await ctx.render("boards", { boards: boardCache });
        }
        const boards = await db.fetchAll("SELECT * FROM boards");
        return await ctx.render("boards", { boards });
    } catch (error) {
        return ctx.throw(500, error);
    }
};