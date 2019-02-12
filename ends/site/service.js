const Koa = require("Koa");
const Router = require("koa-router");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const path = require("path");
const logger = require("../../libs/logger");
const serverConfig = require("../../config/config").server;

const middleware = require("./middleware");
const home = require("./endpoints/home");
const boards = require("./endpoints/boards");
const catalog = require("./endpoints/catalog");
const thread = require("./endpoints/thread");
const files = require("./endpoints/files");
const dashboard = require("./endpoints/dashboard");
const auth = require("./endpoints/auth");


const router = new Router({ strict: true });

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

const server = new Koa();

// Views
server.use(
    koaViews(path.join(__dirname, "templates"), {
        extension: "pug",
        options: { cache: process.env.NODE_ENV === "production" },
    })
);

// Server static files (JS/CSS/Media)
server.use(koaStatic(path.join(__dirname, "static/dist")));

// Securely handle and log 500 errors
server.use(async (ctx, next) => {
    ctx.state.webname = serverConfig.webname;
    try {
        await next();
    } catch (error) {
        ctx.status = error.status || 500;
        if (ctx.status == 500) {
            ctx.body = "Internal server error";
            ctx.app.emit("error", error, ctx);
        } else {
            ctx.body = error.message;
        }
    }
});

server.on("error", error => {
    if (serverConfig.consoleErrors) {
        console.error(`ZThree: ${error}`);
        console.trace(error);
    }
    logger.logOut(error, serverConfig.log);
});


server.use(router.routes());
module.exports = server;