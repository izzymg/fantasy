const templatesConfig = require("../../config/templates");

exports.render = async ctx => {
    await ctx.render("notfound", { title: templatesConfig.titles.notfound });
};