const templatesConfig = require("../../config/templates");
const db = require("../../database/database");

exports.render = async (ctx, next) => {
    try {
        const board = await db.fetch("select url, title, about, sfw from boards where url = ?", ctx.params.board);
        if (!board) {
            return await next();
        }
        await ctx.render("catalog", { title: `${templatesConfig.titles.catalog} /${board.url}/ - ${board.title}`, board });
    } catch (error) {
        ctx.throw(500, error);
    }
};