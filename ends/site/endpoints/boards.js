const persistence = require("../../persistence");
// Stub

exports.render = async ctx => {
    const boards = await persistence.getBoards();
    await ctx.render("boards", { boards });
};
