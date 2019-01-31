const db = require("../../database/database");
const templatesConfig = require("../../config/templates");

exports.render = async (ctx) => {
    try {
        const boards = await db.fetchAll("select url, title, about, sfw, createdAt from boards");
        await ctx.render("boards", { title: templatesConfig.titles.boards, boards });
    } catch(error) {
        return ctx.throw(500, error);
    }
};