const KoaRouter = require("koa-router");
const router = new KoaRouter();
const boardsDb = require("../../db/boards");

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