const Router = require("koa-router");
const router = new Router({ strict: true });
const home = require("./controllers/home");
const boards = require("./controllers/boards");
const catalog = require("./controllers/catalog");
const thread = require("./controllers/thread");
const files = require("./controllers/files");
const mod = require("./controllers/mod");
const dashboard = require("./controllers/dashboard");
const auth = require("./controllers/auth");

// Boards are cached to prevent excess DB queries
async function setup() {
    try {
        await boards.genCache();
    } catch (e) {
        throw e;
    }
}

router.get("*", async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        if (error.status === 404) {
            return ctx.render("notfound");
        }
        return ctx.throw(error);
    }
});

router.get("/", auth.checkSession, home.render);

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
router.get("/boards/", auth.checkSession, boards.render);
router.get("/boards/:board/", auth.checkSession, boards.checkBoard, catalog.render);

router.post(
    "/boards/:board/",
    boards.checkBoard,
    auth.checkCooldown,
    catalog.post,
    auth.createCooldown
);

// Thread
router.get("/boards/:board/threads/:thread", auth.checkSession, boards.checkBoard, thread.render);

router.post(
    "/boards/:board/threads/:thread",
    boards.checkBoard,
    auth.checkCooldown,
    thread.post,
    auth.createCooldown
);

router.post("/boards/:board/delete/:post", auth.checkSession, boards.checkBoard, mod.deletePost);

// Serve files
router.get("/files/:filename", files.render);

// Authentication
router.post("/login", auth.login);
router.get("/login", auth.checkSession, auth.render);
router.get("/logout", auth.logout);

router.get("/dashboard", auth.checkSession, dashboard.render);
router.post("/dashboard/createUser", auth.checkSession, dashboard.createUser);
router.post("/dashboard/changePassword", auth.checkSession, dashboard.changePassword);

// Fallthroughs
router.get("*", async ctx => {
    await ctx.render("notfound");
});

module.exports = { setup, routes: router.routes() };
