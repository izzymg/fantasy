const Board = require("../../models/board.model");
const templatesConfig = require("../../config/templates");

exports.render = async (ctx) => {
    try {
        const boards = await Board.findAll();
        await ctx.render("boards", { title: templatesConfig.titles.boards, boards });
    } catch(error) {
        return ctx.throw(500, error);
    }
};