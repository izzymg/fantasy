const persistence = require("../../persistence");

exports.render = async ctx => {
    const [ thread, replies ] = await Promise.all([
        persistence.getThread(
            ctx.state.board.url, ctx.params.thread
        ),
        persistence.getReplies(
            ctx.state.board.url, ctx.params.thread
        )
    ]);
    if(!thread) {
        return ctx.throw(404);
    }
    return await ctx.render("thread", {
        op: thread, replies: replies
    });
};
