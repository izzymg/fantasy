const KoaRouter = require("koa-router");
const router = new KoaRouter();

const models = require("../models");
const schemas = require("../schemas");
const config = require("../../config/config");
const libs = require("../../libs");

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
  let postData;
  ctx.assert(ctx.is("multipart/form-data"), 400, "Invalid content type");
  const { fields, files } = await libs.multipart(
    ctx, config.posts.maxFiles, config.posts.maxFileSize, config.posts.tmpDir
  );

  // Validate fields
  try {
    postData = schemas.post(fields, files);
  } catch(error) {
    if(error.status && error.status == 400) ctx.throw(400, error);
    ctx.throw(error);
  }
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
    `You must wait ${Math.floor((cd - Date.now()) / 1000)} seconds before posting again`
  );
  ctx.assert(!ban || ban.expires && ban.expires < new Date(Date.now()), 403, "You are banned");
    
  // Ban must have expired
  if(ban) {
    await models.ban.deleteBan(ban.uid);
  }

  const { filesProcessed } = await models.post.create({
    ...postData,
    parent,
    boardUid: board.uid,
    ip: ctx.ip,
  });

  // Put user back on cooldown
  if(board.cooldown) models.ip.createCooldown(ctx.ip, board.uid, board.cooldown);

  ctx.log.info(`Post submitted to /${board.uid}/`);
  ctx.body = `Submitted post to /${board.uid}/, uploaded ${
    filesProcessed} ${filesProcessed == 1 ? "file." : "files."
  }`;
});

module.exports = router.routes();