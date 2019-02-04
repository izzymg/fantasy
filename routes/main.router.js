const Router = require("koa-router");
const router = new Router({ strict: true });
const parseRequests = require("./parseRequests");
const home = require("./controllers/home");
const boards = require("./controllers/boards");
const catalog = require("./controllers/catalog");
const thread = require("./controllers/thread");
const files = require("./controllers/files");

// Boards are cached to prevent excess DB queries
async function setup() {
    try {
        await boards.genCache();
    } catch(e) {
        throw e;
    }
}

router.use(async (ctx, next) => {
    try {
        await next();
    } catch(error) {
        if(ctx.status === 404) {
            return ctx.render("notfound");
        }
        return await next();
    }
});

router.get("/", home.render);

// Redirect to "folder" directories (trailing slash)
// This is so relative HTML links work consistently
router.get("/boards", async ctx => {
    await ctx.redirect("/boards/");
});
router.get("/boards/:board", async ctx => {
    await ctx.redirect(`/boards/${ctx.params.board}/`);
});
router.get("/boards/:board/threads/:thread/", async ctx => {
    await ctx.redirect(`/boards/${ctx.params.board}/threads/${ctx.params.thread}`);
});

// Render boards list and board catalog
router.get("/boards/", boards.render);
router.get("/boards/:board/", boards.checkBoard, catalog.render);

router.post("/boards/:board/", boards.checkBoard, parseRequests.parseThread, parseRequests.validateThread, boards.processPost,
    async ctx => {
        const postId = ctx.state.postId;
        const files = ctx.state.processedFiles;
        ctx.body = `Created post ${postId} ${files ? `and uploaded ${files} ${files > 1 ? "files." : "file."}` : "."}`;
    }
);

// Thread
router.get("/boards/:board/threads/:thread", boards.checkBoard, thread.render);

// Serve files
router.get("/files/:filename", files.render);

// Fallthroughs
router.get("*", async ctx => {
    await ctx.render("notfound");
});

module.exports = { setup, routes: router.routes() };