const functions = require("./functions");
var boardCache = [];

exports.genCache = async () => {
    const boards = await functions.getBoards();
    boardCache = boards || [];
};

exports.checkBoard = async (ctx, next) => {
    for (const board of boardCache) {
        if (board.url === ctx.params.board) {
            ctx.state.board = board;
            return await next();
        }
    }
    // Fetch from DB if cache missed
    const board = await functions.getBoard(ctx.params.board);
    if (!board) {
        return ctx.throw(404);
    }
    ctx.state.board = board;
    return await next();
};

exports.render = async ctx => {
    if (boardCache.length > 0) {
        return await ctx.render("boards", { boards: boardCache });
    }
    const boards = await functions.getBoards();
    await ctx.render("boards", { boards });
};
