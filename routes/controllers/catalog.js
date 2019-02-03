const db = require("../../database/database");

exports.render = async ctx => {
    try {
        const threads = await db.fetchAll(
            `SELECT id, name, subject, content, date, lastBump
            FROM posts_${ctx.state.board.url}
            WHERE parent = 0
            ORDER BY lastBump ASC`
        );
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};