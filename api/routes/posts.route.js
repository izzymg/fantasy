const KoaRouter = require("koa-router");
const middleware = require("./middleware");
const models = require("../models");
const schemas = require("../schemas");
const config = require("../../config/config");
const libs = require("../libs");

const router = new KoaRouter({
  prefix: "/posts",
});

router.get("/",
  async function getPosts(ctx) {
    const { board: boardUid, thread: threadNo } = ctx.query;
    ctx.assert(boardUid, 404, "No post found");

    // Fetch thread and reply data
    if(threadNo) {
      ctx.assert(parseInt(threadNo), 400);
      const [ thread, replies ] = await Promise.all([
        models.post.getThread(boardUid, threadNo),
        models.post.getThreadReplies(boardUid, threadNo),
      ]);
      ctx.assert(thread, 404, "No thread found");
      ctx.body = { thread, replies };
      return;
    }

    // Get board threads
    ctx.body = await models.post.getThreads(boardUid);
    ctx.assert(ctx.body, 404, "No thread found");
    return;
  }
);

router.get("/:number",
  async function getPost(ctx) {
    const postNo = parseInt(ctx.params.number);
    const { board: boardUid } = ctx.query;

    ctx.assert(boardUid, 404, "No post found");
    ctx.assert(postNo, 400);
    
    // Fetch single post on board
    ctx.body = await models.post.get(boardUid, postNo);
    ctx.assert(ctx.body, 404, "No post found");
    return;
  }
);

router.delete("/:number",
  async function deletePost(ctx) {
    const { board: boardUid } = ctx.query;
    const postNo = parseInt(ctx.params.number);
    ctx.assert(boardUid && postNo, 400);
    await middleware.requireBoardModerator(boardUid)(ctx);
    ctx.body = await models.post.removeWithReplies(boardUid, postNo);
  }
);

router.post("/:board/:parent?",
  async function createPost(ctx) {
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

    // Ensure file limit hasn't been reached
    if(parent && files) {
      const fileCount = await models.post.getThreadFileCount(board.uid, parent);
      ctx.assert(
        !fileCount || fileCount <= board.fileLimit, 400,
        "You no longer make file replies to this thread"
      );
    }

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

    const { filesProcessed, postNumber } = await models.post.create({
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
        const oldestThreadNumber = await models.post.getOldestThreadNumber(board.uid);
        await models.post.removeWithReplies(board.uid, oldestThreadNumber);
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
    ctx.body = {
      boardUid: board.uid,
      filesProcessed,
      postNumber,
    };
  }
);

module.exports = router.routes();