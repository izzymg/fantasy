const db = require("../../database/database");

exports.render = async ctx => {
    try {
        const boards = await db.fetchAll("SELECT url, title, about, sfw, createdAt FROM boards");
        await ctx.render("boards", { boards });
    } catch (error) {
        return ctx.throw(500, error);
    }
};