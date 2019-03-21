const KoaRouter = require("koa-router");
const router = new KoaRouter();
const boardsDb = require("..//db/boards");
const sessionsDb = require("..//db/sessions");
const usersDb = require("..//db/users");
const reportsDb = require("..//db/reports");
const middleware = require("./middleware");

// Get reports
router.get("/boards/:board/reports", async function(ctx, next) {
  await middleware.requireModOfBoard(ctx.params.board)(ctx, next);
  ctx.body = await reportsDb.getBoardReports(ctx.params.board);
});

// Get user moderated boards
router.get("/boards/mod", async(ctx) => {
  const cookie = ctx.cookies.get("id");
  const session = await sessionsDb.getSession(cookie);
  if(session) {
    const isAdmin = await usersDb.getAdmin(session.username);
    if(isAdmin) {
      ctx.body = await boardsDb.getBoards();
    } else {
      const boards = await boardsDb.getModable(session.username);
      ctx.body = boards;
    }
  }
});

// Get all boards
router.get("/boards", async(ctx) => {
  const boards = await boardsDb.getBoards();
  if(boards) ctx.body = { boards };
});

// Get info about board
router.get("/boards/:board", async(ctx) => {
  const board = await boardsDb.getBoard(ctx.params.board);
  if (!board) ctx.throw(404);
  ctx.body = { board };
});

module.exports = router.routes();