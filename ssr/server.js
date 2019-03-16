const { logRequestTime, handleErrors } = require("../libs/middleware");
const path = require("path");
const koaViews = require("koa-views");
const Koa = require("koa");
const server = new Koa();
const Router = require("koa-router");
const router = new Router({ strict: true });
const config = require("../config/config");
const Boards = require("../db/boards");
const Posts = require("../db/posts");

if(config.logRequestTime) {
  server.use(logRequestTime(config.infoLog));
}

server.use(handleErrors(config.logErrors ? config.errorLog : null, config.consoleErrors));

// Views
router.use(
  koaViews(path.join(__dirname, "/view/templates"), {
    extension: "pug",
    options: { cache: config.env == "production" ? true : false },
  })
);

router.use(async function(ctx, next) {
  ctx.state.api = `${config.ssr.apiUrl}`;
  ctx.state.files = `${config.ssr.filesUrl}`;
  ctx.state.static = `${config.ssr.staticUrl}`;
  ctx.state.webname = config.ssr.webname;
  return await next();
});

// Try following routes and catch 404s to render page
router.get("*", async function(ctx, next) {
  try {
    await next();
  } catch (error) {
    if (error.status === 404) {
      ctx.status = 404;
      return ctx.render("notfound");
    }
    return ctx.throw(error);
  }
});

router.get("/",  async function(ctx) {
  await ctx.render("home");
});

// Redirect to "folder" directories (trailing slash)
// This is so relative HTML links work consistently
router.get("/boards", async function(ctx)  {
  await ctx.redirect("/boards/");
});
router.get("/boards/:board", async function(ctx)  {
  await ctx.redirect(`/boards/${ctx.params.board}/`);
});
router.get("/boards/:board/threads/:thread/", async function(ctx)  {
  await ctx.redirect(`/boards/${ctx.params.board}/threads/${ctx.params.thread}`);
});

// Boards list
router.get("/boards/", async function(ctx)  {
  const boards = await Boards.getBoards();
  await ctx.render("boards", { boards });
});

// Set state up on all board routes
router.all("/boards/:board/*", async(ctx, next) => {
  const board = await Boards.getBoard(ctx.params.board);
  if (!board) {
    return ctx.throw(404);
  }
  ctx.state.board = board;
  return await next();
});

// Get catalog
router.get("/boards/:board/", async function(ctx)  {
  try {
    const threads = await Posts.getThreads(ctx.state.board.url);
    return await ctx.render("catalog", { threads });
  } catch (error) {
    return ctx.throw(500, error);
  }
});

// Get thread
router.get("/boards/:board/threads/:thread", async function(ctx)  {
  const [ thread, replies ] = await Promise.all([
    Posts.getThread(
      ctx.state.board.url, ctx.params.thread
    ),
    Posts.getReplies(
      ctx.state.board.url, ctx.params.thread
    )
  ]);
  if(!thread) {
    return ctx.throw(404);
  }
  return await ctx.render("thread", {
    op: thread, replies: replies
  });
});

// Fallthroughs
router.get("*", async function(ctx)  {
  ctx.status = 404;
  await ctx.render("notfound");
});

if(config.proxy) server.proxy = true;

server.use(router.routes());

exports.start = function() {
  server.listen(config.ssr.port, config.ssr.host, function() {
    console.log(`SSR server listening on ${config.ssr.host}:${config.ssr.port}`);
  });
};