const Koa = require("Koa");
const Router = require("koa-router");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const path = require("path");
const logger = require("../../libs/logger");
const config = require("../../config/config");

const middleware = require("./middleware");
const home = require("./endpoints/home");
const boards = require("./endpoints/boards");
const catalog = require("./endpoints/catalog");
const thread = require("./endpoints/thread");

const router = new Router({ strict: true });

router.use(middleware.getSession);
router.use(async (ctx, next) => {
    if(config.api.https) {
        ctx.state.api = `https://${config.api.host}:${config.api.httpsPort}`;
    } else {
        ctx.state.api = `http://${config.api.host}:${config.api.port}`;
    }
    if(config.files.https) {
        ctx.state.files = `https://${config.files.host}:${config.files.httpsPort}`;
    } else {
        ctx.state.files = `http://${config.files.host}:${config.files.port}`;
    }
    return await next();
});

// Try following middleware and catch 404s to render page
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

// Get catalog and post thread
router.get("/boards/:board/", catalog.render);

// Get thread and post reply
router.get("/boards/:board/threads/:thread", thread.render);

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
    ctx.state.webname = config.server.webname;
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
    if (config.server.consoleErrors) {
        console.error(`ZThree: ${error}`);
        console.trace(error);
    }
    logger.logOut(error, config.server.log);
});

server.use(router.routes());
module.exports = server;