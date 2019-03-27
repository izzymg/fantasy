const KoaRouter = require("koa-router");
const router = new KoaRouter();

const models = require("../models");

// Fetch threads on board
router.get("/posts/:board/threads", async function(ctx) {
  ctx.body = await models.post.getThreads(ctx.params.board);
});

// Fetch single post
router.get("/posts/:board/:id", async function(ctx) {
  ctx.body = await models.post.get(ctx.params.board, ctx.params.id);
  ctx.assert(ctx.body, 404, "No post found");
});

// Fetch thread and reply data
router.get("/posts/:board/threads/:id", async function(ctx) {
  const [ thread, replies ] = await Promise.all([
    models.post.getThread(ctx.params.board, ctx.params.id),
    models.post.getThreadReplies(ctx.params.board, ctx.params.id),
  ]);
  ctx.assert(thread, 404, "No thread found");
  ctx.body = { thread, replies };
});

// Submit post
router.post("/posts/:board/:parent?", async function(ctx) {

  // Ensure board and post exists
  let parent = 0;
  const board = await models.board.get(ctx.params.board);
  if(ctx.params.parent) {
    parent = await models.post.threadAllowsReplies(ctx.params.board, ctx.params.parent);
    ctx.assert(parent !== false , 400, "You cannot reply to this thread");
  }
  ctx.assert(board && board.uid, 404, "No such board");

  // IP must be off cooldown, and cannot be banned
  const [ cd, ban ] = await Promise.all([
    models.ip.getCooldown(ctx.ip, board.uid),
    models.ban.getBoardBan(ctx.ip, board.uid)
  ]);

  ctx.assert(
    !cd || cd < Date.now(), 400,
    `You must wait ${ Math.floor((cd - Date.now()) / 1000) } seconds before posting again`
  );
  ctx.assert(!ban || ban.expires && ban.expires < new Date(Date.now()), 403, "You are banned");
  
  if(ban) {
    await models.ban.deleteBan(ban.uid);
  }

  if(board.cooldown) models.ip.createCooldown(ctx.ip, board.uid, board.cooldown);
  ctx.log.info(`Post submitted to /${board}/`);
});

module.exports = router.routes();