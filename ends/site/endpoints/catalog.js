const persistence = require("../../persistence");

exports.render = async ctx => {
    try {
        const threads = await persistence.getThreads(ctx.state.board.url);
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};
