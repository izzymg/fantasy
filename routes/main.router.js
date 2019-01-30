const Router = require("koa-router");
const router = new Router();
const templatesConfig = require("../config/templates");

// Render home
router.get("/", async (ctx) => {
    try {
        await ctx.render("home", { title: templatesConfig.titles.home });
    } catch (error) {
        return ctx.throw(500, error);
    }
});

module.exports = router;