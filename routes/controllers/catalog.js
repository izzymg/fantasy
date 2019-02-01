const templatesConfig = require("../../config/templates");
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
        return await ctx.render("catalog", { title: `${templatesConfig.titles.catalog} /${board.url}/ - ${board.title}`, board, threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};