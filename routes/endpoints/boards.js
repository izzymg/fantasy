const functions = require("../functions");

exports.genCache = async () => await functions.cacheBoards();

exports.render = async ctx => {
    const boards = await functions.getBoards();
    await ctx.render("boards", { boards });
};
