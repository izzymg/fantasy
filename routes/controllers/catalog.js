const db = require("../../database/database");

exports.render = async (ctx, next) => {
    try {
        const board = await db.fetch("SELECT url, title, about, sfw FROM boards WHERE url = ?", ctx.params.board);
        if (!board) {
            return await next();
        }
        const threads = await db.fetchAll(
            `SELECT id, name, subject, content, date, lastBump
            FROM posts_${board.url}
            WHERE parent = 0
            ORDER BY lastBump ASC`
        );
        return await ctx.render("catalog", { board, threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};
exports.createThread = async ctx => {
    const post = ctx.state.post;
    if (!post) {
        return ctx.throw(500, "No post object found on context state");
    }

};