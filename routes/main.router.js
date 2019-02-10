const Router = require("koa-router");
const router = new Router({ strict: true });
const middleware = require("./middleware");
const home = require("./controllers/home");
const boards = require("./controllers/boards");
const catalog = require("./controllers/catalog");
const thread = require("./controllers/thread");
const files = require("./controllers/files");
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

router.get("*", auth.checkSession);

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

router.get("/",  home.render);

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

// Boards list
router.get("/boards/", boards.render);

// Set board state up on all board routes
router.all("/boards/:board/*", boards.checkBoard);

// Test route
router.get("/boards/:board/authtest", auth.requireModOrAdmin, ctx => ctx.body = "You are an admin, or moderator of this board");

// Get catalog and post thread
router.get("/boards/:board/", catalog.render);
router.post("/boards/:board/",
    auth.checkCooldown, middleware.getMultipart,
    catalog.post, auth.createCooldown
);

// Get thread and post reply
router.get("/boards/:board/threads/:thread", thread.render);
router.post("/boards/:board/threads/:thread",
    auth.checkCooldown, middleware.getMultipart,
    thread.post, auth.createCooldown
);

// Serve files
router.get("/files/:filename", files.render);

// Authentication
router.post("/login", middleware.getForm, auth.login);
router.get("/login",  auth.render);
router.get("/logout", auth.logout);

router.get("/dashboard", 
    dashboard.render);
router.post("/dashboard/createUser", 
    middleware.getForm, dashboard.createUser);
router.post("/dashboard/changePassword", 
    middleware.getForm, dashboard.changePassword);

// Fallthroughs
router.get("*", async ctx => {
    await ctx.render("notfound");
});

module.exports = { setup, routes: router.routes() };
