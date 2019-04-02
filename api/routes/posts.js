const KoaRouter = require("koa-router");
const router = new KoaRouter();
const middleware = require("./middleware");
const models = require("../models");
const schemas = require("../schemas");
const config = require("../../config/config");
const libs = require("../../libs");

// Fetch threads on board
router.get("/posts/:board/threads",
  async function(ctx) {
    ctx.body = await models.post.getThreads(ctx.params.board);
  }
);

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
    models.ban.getByBoard(ctx.ip, board.uid)
  ]);

  ctx.assert(
    !cd || cd < Date.now(), 400,
    `You must wait ${Math.floor((cd - Date.now()) / 1000)} seconds before posting again`
  );
  ctx.assert(!ban || ban.expires && ban.expires < new Date(Date.now()), 403, "You are banned");

  // Ban must have expired
  if(ban) {
    await models.ban.remove(ban.uid);
  }  
  
  // Validate fields
  postData = schemas.post(fields, files, Boolean(parent === 0));

  const { filesProcessed } = await models.post.create({
    ...postData,
    parent,
    boardUid: board.uid,
    ip: ctx.ip,
    lastBump: parent ? null : new Date(Date.now())
  });

  // Put user back on cooldown
  if(board.cooldown) models.ip.createCooldown(ctx.ip, board.uid, board.cooldown);

  if (parent == 0) {
    // Delete oldest thread if max threads has been reached
    const threadCount = await models.post.getThreadCount(board.uid);
    if (threadCount > board.maxThreads) {
      const oldestThreadId = await models.post.getOldestThreadId(board.uid);
      await models.post.deletePost(board.uid, oldestThreadId);
    }
  } else {
    // Bump OP as long as bump limit hasn't been reached
    const replyCount = await models.post.getReplyCount(board.uid, parent);
    if (replyCount <= board.bumpLimit) {
      try {
        await models.post.bumpPost(board.uid, parent);
      } catch (error) {
        return ctx.throw(409, "Bumping thread failed, OP may have been deleted?");
      }
    }
  }
  ctx.log.info(`Post submitted to /${board.uid}/`);
  ctx.body = `Submitted post to /${board.uid}/, uploaded ${
    filesProcessed} ${filesProcessed == 1 ? "file." : "files."
  }`;
});

// Delete post
router.del("/posts/:board/:post",
  async(ctx, next) =>  await middleware.requireBoardModerator(ctx.params.board)(ctx, next),
  async function(ctx) {
    const {
      deletedPosts, deletedFiles
    } = await models.post.removeWithReplies(ctx.params.board, ctx.params.post);
  
    if(!deletedPosts) {
      ctx.body = "Didn't delete any posts, check the board is correct and the post is still up";
      return;
    }
    ctx.body = `Deleted ${deletedPosts} ${deletedPosts == 1 ? "post" : "posts"}`;
    if(deletedFiles) {
      ctx.body += ` and ${deletedFiles} ${deletedFiles == 1 ? "file" : "files"}`;
    }
  }
);

module.exports = router.routes();