const Router = require("koa-router");
const config = require("../../config/config");
const router = new Router({ strict: true });
const persistence = require("../persistence");
const koaViews = require("koa-views");
const koaStatic = require("koa-static");
const path = require("path");

// Views
router.use(
  koaViews(config.staticDir || path.join(__dirname, "../../static/templates"), {
    extension: "pug",
    options: { cache: config.env == "production" ? true: false },
  })
);

// Server static files (JS/CSS/Media)
router.use(koaStatic(config.staticDir || path.join(__dirname, "../../static/dist")));

router.use(async(ctx, next) => {
  ctx.state.api = `${config.api.url}`;
  ctx.state.files = `${config.files.url}`;
  ctx.state.auth = `${config.auth.url}`;
  ctx.state.webname = config.webname;
  return await next();
});

// Try following routes and catch 404s to render page
router.get("*", async(ctx, next) => {
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

router.get("/",  async(ctx) => await ctx.render("home"));
router.get("/login",  async(ctx) => await ctx.render("login"));

// Redirect to "folder" directories (trailing slash)
// This is so relative HTML links work consistently
router.get("/boards", async(ctx) => {
  await ctx.redirect("/boards/");
});
router.get("/boards/:board", async(ctx) => {
  await ctx.redirect(`/boards/${ctx.params.board}/`);
});
router.get("/boards/:board/threads/:thread/", async(ctx) => {
  await ctx.redirect(`/boards/${ctx.params.board}/threads/${ctx.params.thread}`);
});

// Boards list
router.get("/boards/", async(ctx) => {
  const boards = await persistence.getBoards();
  await ctx.render("boards", { boards });
});

// Set state up on all board routes
router.all("/boards/:board/*", async(ctx, next) => {
  const board = await persistence.getBoard(ctx.params.board);
  if (!board) {
    return ctx.throw(404);
  }
  ctx.state.board = board;

  const id = ctx.cookies.get("id");
  if(id) {
    const session = await persistence.getSession(id);
    if(session && session.username) {
      ctx.state.isModOrAdmin = await persistence.isModOrAdmin(session.username, board.url);
      ctx.state.session = session;
    }
  }
  return await next();
});

// Get catalog
router.get("/boards/:board/", async(ctx) => {
  try {
    const threads = await persistence.getThreads(ctx.state.board.url);
    return await ctx.render("catalog", { threads });
  } catch (error) {
    return ctx.throw(500, error);
  }
});

// Get thread
router.get("/boards/:board/threads/:thread", async(ctx) => {
  const [ thread, replies ] = await Promise.all([
    persistence.getThread(
      ctx.state.board.url, ctx.params.thread
    ),
    persistence.getReplies(
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
router.get("*", async(ctx) => {
  ctx.status = 404;
  await ctx.render("notfound");
});

module.exports = router;