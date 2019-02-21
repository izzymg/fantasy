const { lengthCheck } = require("../../libs/textFunctions");
const config = require("../../config/config");
const multipart = require("../../libs/multipart");
const persistence = require("../persistence");

const Router = require("koa-router");
const router = new Router();

router.use("/boards/:board/*", async(ctx, next) => {
  const board = await persistence.getBoard(ctx.params.board);
  if(!board) {
    return ctx.throw(404, "No such board");
  }
  ctx.state.board = board;
  return await next();
});

router.get("/boards", async(ctx) => {
  const boards = await persistence.getBoards();
  if(!boards) {
    return ctx.body = { };
  }
  ctx.body = { boards };
});

router.get("/boards/:board", async(ctx) => {
  const board = await persistence.getBoard(ctx.params.board);
  if(!board) return ctx.throw(404);
  ctx.body = { board };
});

router.get("/boards/:board/threads", async(ctx) => {
  const threads = await persistence.getThreads(ctx.state.board.url);
  if(!threads) {
    return ctx.body = { };
  }
  ctx.body = { threads };
});

router.get("/boards/:board/threads/:thread", async(ctx) => {
  const [thread, replies] = await Promise.all([
    persistence.getThread(ctx.state.board.url, ctx.params.thread),
    persistence.getReplies(ctx.state.board.url, ctx.params.thread)
  ]);
  if(!thread) return ctx.throw(404);
  ctx.body = { thread, replies };
});

// Submit new thread to board
router.post("/boards/:board/:thread?", 
  async(ctx) => {
    // IP cooldown
    const cd = await persistence.getCooldown(ctx.ip);
    if(cd) return ctx.throw(400, `You must wait ${cd} seconds before posting again`);

    // Does board exist?
    const board = await persistence.getBoard(ctx.params.board);
    if(!board) return ctx.throw(404, "No such board");
    ctx.state.board = board;

    // Does thread exist if reply?
    if(ctx.params.thread) {
      const thread = await persistence.getThread(ctx.state.board.url, ctx.params.thread);
      if(!thread) {
        return ctx.throw(404);
      }
      ctx.state.thread = thread;
    }

    // Get the multipart data
    let fields, files;
    try {
      ({ fields, files } = await multipart(ctx, config.posts.maxFiles, 
        config.posts.maxFileSize, config.posts.tmpDir
      ));
    } catch(error) {
      if(error.status == 400) {
        return ctx.throw(400, error.message);
      }
      return ctx.throw(500, error);
    }

    // Default fields
    const name = fields.name || "Anonymous";
    const subject = fields.subject || "";
    const content = fields.content || "";
    const parent = ctx.state.thread ? ctx.state.thread.id : 0;

    // Validate field existence
    if(parent) {
      if(config.posts.replies.requireContentOrFiles && 
                (!files || files.length < 1) && !content) {
        return ctx.throw(400, "Content or file required");
      }
    } else {
      if(config.posts.threads.requireContent && !content) {
        return ctx.throw(400, "Content required");
      }
      if(config.posts.threads.requireSubject && !subject) {
        return ctx.throw(400, "Subject required");
      }
      if(config.posts.threads.requireFiles && (!files || files.length < 1)) {
        return ctx.throw(400, "File required");
      }
    }

    // Length check fields
    let lengthError = lengthCheck(
      name, config.posts.maxNameLength, "Name");
    lengthError = lengthCheck(
      subject, config.posts.maxSubjectLength, "Subject") || lengthError;
    lengthError = lengthCheck(
      content, config.posts.maxContentLength, "Post content") || lengthError;
    if(lengthError) return ctx.throw(400, lengthError);

    // Submit post
    const { postUid } = await persistence.submitPost({
      boardUrl: ctx.params.board,
      name, subject, content,
      parent,
    });
    ctx.body = "Submitted post.";

    // Save files
    if(files) {
      const fileUploads = files.map(async(file) => {
        file.postUid = postUid;
        const createThumb = file.mimetype.indexOf("image") > -1 ? true : false;
        await persistence.saveFile(file, createThumb);
      });
      await Promise.all(fileUploads);
      ctx.body += ` Uploaded ${fileUploads.length} ${
        fileUploads.length > 1 ? "files." : "file."
      }`;
    }

    // Handle post bumping and pruning
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

    // Create a new cooldown
    await persistence.createCooldown(ctx.ip, ctx.state.board.cooldown);
  }
);

module.exports = router;