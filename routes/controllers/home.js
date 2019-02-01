const templatesConfig = require("../../config/templates");

exports.render = async ctx => {
    try {
        await ctx.render("home", { title: templatesConfig.titles.home });
    } catch (error) {
        return ctx.throw(500, error);
    }
};