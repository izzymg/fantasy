const Router = require("koa-router");
const router = new Router({ strict: true });

const home = require("./controllers/home");
const boards = require("./controllers/boards");
const catalog = require("./controllers/catalog");
const thread = require("./controllers/thread");
const notfound = require("./controllers/notfound");

router.get("/", home.render);

// Redirect to "folder" directories (trailing slash)
// This is so relative HTML links work consistently
router.get("/boards", async ctx => {
    await ctx.redirect("/boards/");
});
router.get("/boards/:board", async ctx => {
    await ctx.redirect(`/boards/${ctx.params.board}/`);
});

router.get("/boards/", boards.render);
router.get("/boards/:board/", catalog.render);

router.get("/boards/:board/threads/:thread", thread.render);

router.get("*", notfound.render);
router.get("/404", notfound.render);

module.exports = router;