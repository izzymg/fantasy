const persistence = require("../persistence");

exports.getBoard = async (ctx, next) => {
    const board = await persistence.getBoard(ctx.params.board);
    if (!board) {
        return ctx.throw(404);
    }
    ctx.state.board = board;
    return await next();
};