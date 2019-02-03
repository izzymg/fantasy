const Router = require("koa-router");
const router = new Router({ strict: true });
const parseRequests = require("./parseRequests");
const home = require("./controllers/home");
const boards = require("./controllers/boards");
const catalog = require("./controllers/catalog");
const thread = require("./controllers/thread");
const files = require("./controllers/files");
const notfound = require("./controllers/notfound");

function setup() {
    boards.genCache();
}

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
router.get("/boards/:board/", boards.checkBoard, catalog.render);

router.post("/boards/:board/", boards.checkBoard, parseRequests.parseThread, parseRequests.validateThread, boards.processPost,
    async (ctx, next) => {
        await next();
        const postId = ctx.state.postId;
        const files = ctx.state.processedFiles;
        ctx.body = `Created post ${postId} ${files ? `and uploaded ${files} ${files > 1 ? "files." : "file."}` : "."}`;
    }
);

router.get("/boards/:board/threads/:thread", thread.render);

router.get("/files/:filename", files.render);

router.get("*", notfound.render);
router.get("/404", notfound.render);

module.exports = { setup, routes: router.routes() };