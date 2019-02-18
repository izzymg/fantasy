const { lengthCheck } = require("../../../libs/textFunctions");
const config = require("../../../config/config");
const middleware = require("../middleware");
const persistence = require("../../persistence");

const Router = require("koa-router");
const router = new Router();

router.use("/boards/:board/*", async (ctx, next) => {
  const board = await persistence.getBoard(ctx.params.board);
  if(!board) {
    return ctx.throw(404, "No such board");
  }
  ctx.state.board = board;
  return await next();
});

router.get("/boards", async ctx => {
  const boards = await persistence.getBoards();
  if(!boards) {
    return ctx.body = { };
  }
  ctx.body = { boards };
});

router.get("/boards/:board", async ctx => {
  const board = await persistence.getBoard(ctx.params.board);
  if(!board) return ctx.throw(404);
  ctx.body = { board };
});

router.get("/boards/:board/threads", async ctx => {
  const threads = await persistence.getThreads(ctx.state.board.url);
  if(!threads) {
    return ctx.body = { };
  }
  ctx.body = { threads };
});

router.get("/boards/:board/threads/:thread", async ctx => {
  const [thread, replies] = await Promise.all([
    persistence.getThread(ctx.state.board.url, ctx.params.thread),
    persistence.getReplies(ctx.state.board.url, ctx.params.thread)
  ]);
  if(!thread) return ctx.throw(404);
  ctx.body = { thread, replies };
});

// Submit new thread to board
router.post("/boards/:board/:thread?", 
  // Check if IP is on cooldown
  async (ctx, next) => {
    const cd = await persistence.getCooldown(ctx.ip);
    if(!cd) {
      return await next();
    }
    return ctx.throw(400, `You must wait ${cd} seconds before posting again`);
  },
  // Validate and save board and optionally thread being posted to
  async (ctx, next) => {
    const board = await persistence.getBoard(ctx.params.board);
    if(!board) {
      return ctx.throw(404, "No such board");
    }
    ctx.state.board = board;
    if(ctx.params.thread) {
      const thread = await persistence.getThread(ctx.state.board.url, ctx.params.thread);
      if(!thread) {
        return ctx.throw(404);
      }
      ctx.state.thread = thread;
    }
        
    return await next();
  },
  // Grab multipart data off request
  middleware.getMultipart,
  // Submit post and save files
  async ctx => {
    if(!ctx.fields) {
      return ctx.throw(400, "Received no fields");
    }
    const name = ctx.fields.name || "Anonymous";
    const subject = ctx.fields.subject || "";
    const content = ctx.fields.content || "";
    const parent = ctx.state.thread ? ctx.state.thread.id : 0;
    if(parent) {
      if(config.posts.replies.requireContentOrFiles && 
                (!ctx.files || ctx.files.length < 1) && !content) {
        return ctx.throw(400, "Content or file required");
      }
    } else {
      if(config.posts.threads.requireContent && !content) {
        return ctx.throw(400, "Content required");
      }
      if(config.posts.threads.requireSubject && !subject) {
        return ctx.throw(400, "Subject required");
      }
      if(config.posts.threads.requireFiles && (!ctx.files || ctx.files.length < 1)) {
        return ctx.throw(400, "File required");
      }
    }

    let lengthError = lengthCheck(
      name, config.posts.maxNameLength, "Name");
    lengthError = lengthCheck(
      subject, config.posts.maxSubjectLength, "Subject") || lengthError;
    lengthError = lengthCheck(
      content, config.posts.maxContentLength, "Post content") || lengthError;
    if(lengthError) return ctx.throw(400, lengthError);

    // Parent = 0 if no thread parameter: new thread
    const { postUid, postId } = await persistence.submitPost({
      boardUrl: ctx.params.board,
      name, subject, content,
      parent,
    });
    ctx.body = `Submitted post ${postId}.`;
    if(ctx.files && ctx.files.length > 0) {
      const fileUploads = ctx.files.map(async file => {
        await persistence.saveFile({
          postUid,
          id: file.fileId,
          tempPath: file.tempPath,
          originalName: file.originalName,
          mimetype: file.mimetype,
          extension: file.extension,
          size: file.size
          // Save thumbnail if the mimetype is an image
        }, Boolean(file.mimetype.indexOf("image") !== -1), true);
      });
      await Promise.all(fileUploads);
      ctx.body += ` Uploaded ${fileUploads.length} ${
        fileUploads.length > 1 ? "files." : "file."
      }`;
    }

    if(parent == 0) {
      // Delete oldest thread if max threads has been reached
      const threadCount = await persistence.getThreadCount(ctx.state.board.url);
      if(threadCount > ctx.state.board.maxThreads) {
        const oldestThreadId = await persistence.getOldestThreadId(ctx.state.board.url);
        await persistence.deletePost(ctx.state.board.url, oldestThreadId);
      }
    } else {
      // Bump OP as long as bump limit hasn't been reached
      const replyCount = await persistence.getReplyCount(ctx.state.board.url, parent);
      if(replyCount <= ctx.state.board.bumpLimit) {
        try {
          await persistence.bumpPost(ctx.state.board.url, parent);
        } catch(error) {
          return ctx.throw(409, "Bumping thread failed, OP may have been deleted?");
        }
      }
    }
    await persistence.createCooldown(ctx.ip, ctx.state.board.cooldown);
  }
);

module.exports = router;