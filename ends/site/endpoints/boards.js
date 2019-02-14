const persistence = require("../../persistence");
// Stub
const functions = { cacheBoards: () => {} };

exports.genCache = async () => await functions.cacheBoards();

exports.render = async ctx => {
    const boards = await persistence.getBoards();
    await ctx.render("boards", { boards });
};
