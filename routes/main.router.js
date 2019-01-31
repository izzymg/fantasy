const Router = require("koa-router");
const router = new Router();
const templatesConfig = require("../config/templates");

const Board = require("../models/board.model");

// Render home
router.get("/", async (ctx) => {
    try {
        await ctx.render("home", { title: templatesConfig.titles.home });
    } catch (error) {
        return ctx.throw(500, error);
    }
});

router.get("/boards", async (ctx) => {
    try {
        const boards = await Board.findAll();
        await ctx.render("boards", { title: templatesConfig.titles.boards, boards });
    } catch(error) {
        return ctx.throw(500, error);
    }
});

module.exports = router;