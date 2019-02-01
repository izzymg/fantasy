const db = require("../../database/database");

exports.render = async (ctx, next) => {
    try {
        const board = await db.fetch("SELECT url, title, about, sfw FROM boards WHERE url = ?", ctx.params.board);
        if (!board) {
            return await next();
        }
        const [op, replies] = await Promise.all([
            db.fetch(
                `SELECT id, name, subject, content, date, parent, lastBump
                FROM posts_${board.url}
                WHERE id = ?`, ctx.params.thread
            ),
            db.fetchAll(
                `SELECT id, name, subject, content, date, parent, lastBump
                FROM posts_${board.url}
                WHERE parent = ?`, ctx.params.thread
            )
        ]);
        if (!op) {
            return await next();
        }
        return await ctx.render("thread", { board, thread: { op, replies } });
    } catch (error) {
        return ctx.throw(500, error);
    }
};