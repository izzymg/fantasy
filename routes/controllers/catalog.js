const db = require("../../database/database");
const parseJson = require("../parseRequests");

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
    console.log({ threadPostBody: ctx.body });
};