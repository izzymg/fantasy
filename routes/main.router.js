const Router = require("koa-router");
const router = new Router({ strict: true });
const middleware = require("./middleware");
const home = require("./endpoints//home");
const boards = require("./endpoints/boards");
const catalog = require("./endpoints/catalog");
const thread = require("./endpoints/thread");
const files = require("./endpoints/files");
const dashboard = require("./endpoints/dashboard");
const auth = require("./endpoints/auth");

// Boards are cached to prevent excess DB queries
async function setup() {
    try {
        await boards.genCache();
    } catch (e) {
        throw e;
    }
}

router.use(middleware.getSession);
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
router.all("/boards/:board/*", middleware.getBoard);

// Test route
router.get("/boards/:board/authtest",
    ctx => ctx.body = "You are an admin, or moderator of this board");

// Get catalog and post thread
router.get("/boards/:board/", catalog.render);
router.post("/boards/:board/",
    middleware.checkCooldown, middleware.getMultipart,
    catalog.post, middleware.createCooldown
);

// Get thread and post reply
router.get("/boards/:board/threads/:thread", thread.render);
router.post("/boards/:board/threads/:thread",
    middleware.checkCooldown, middleware.getMultipart,
    thread.post, middleware.createCooldown
);

// Serve files
router.get("/files/:filename", files.render);

// Authentication
router.post("/login", middleware.getForm, auth.login);
router.get("/login",  auth.render);
router.get("/logout", auth.logout);

router.get("/dashboard", 
    dashboard.render
);
router.post("/dashboard/createUser", 
    middleware.getForm, dashboard.createUser
);
router.post("/dashboard/changePassword", 
    middleware.getForm, dashboard.changePassword
);
router.post("/dashboard/addModerator",
    middleware.getForm, dashboard.addModerator
);

// Fallthroughs
router.get("*", async ctx => {
    await ctx.render("notfound");
});

module.exports = { setup, routes: router.routes() };
