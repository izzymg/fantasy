const config = require("../../config/config");
const multipart = require("../../libs/multipart");
const persistence = require("../persistence");
const Posts = require("../Posts");
const Boards = require("../Boards");
const Router = require("koa-router");
const router = new Router();

router.use("/boards/:board/*", async(ctx, next) => {
  const board = await persistence.getBoard(ctx.params.board);
  if (!board) {
    return ctx.throw(404, "No such board");
  }
  ctx.state.board = board;
  return await next();
});

router.get("/boards", async(ctx) => {
  const boards = await Boards.getBoards();
  if (!boards) {
    return ctx.body = {};
  }
  ctx.body = {
    boards
  };
});

router.get("/boards/:board", async(ctx) => {
  const board = await Boards.getBoard(ctx.params.board);
  if (!board) return ctx.throw(404);
  ctx.body = {
    board
  };
});

router.get("/boards/:board/threads", async(ctx) => {
  const threads = await Posts.getThreads(ctx.params.board);
  if (!threads) {
    return ctx.body = {};
  }
  ctx.body = {
    threads
  };
});

router.get("/boards/:board/:post", async(ctx) => {
  const post = await Posts.getPost(ctx.params.board, ctx.params.post);
  if (!post) return ctx.throw(404);
  ctx.body = {
    post
  };
});

router.get("/boards/:board/threads/:thread", async(ctx) => {
  const [thread, replies] = await Promise.all([
    Posts.getThread(ctx.state.board.url, ctx.params.thread),
    Posts.getReplies(ctx.state.board.url, ctx.params.thread)
  ]);
  if (!thread) return ctx.throw(404);
  ctx.body = {
    thread,
    replies
  };
});

// Submit new thread to board
router.post("/boards/:board/:thread?",
  async(ctx) => {
    ctx.body = "";
    // IP cooldown
    const cd = await persistence.getCooldown(ctx.ip);
    if (cd) return ctx.throw(400, `You must wait ${cd} seconds before posting again`);

    // Does board exist?
    const board = await Boards.getBoard(ctx.params.board);
    if (!board) return ctx.throw(404, "No such board");
    ctx.state.board = board;

    // Is user banned from this board/all boards?
    const ban = await persistence.getBan(ctx.ip, board.url);
    if (ban && ban.expires < new Date(Date.now())) {
      await persistence.deleteBan(ban.uid);
      ctx.body += "You were just unbanned. ";
    } else if (ban) {
      ctx.throw(403, "You are banned");
    }

    // Does thread exist if reply?
    if (ctx.params.thread) {
      const thread = await Posts.getThread(ctx.state.board.url, ctx.params.thread);
      if (!thread) {
        return ctx.throw(404);
      }
      ctx.state.thread = thread;
    }

    // Get the multipart data
    let fields, files;
    try {
      ({
        fields,
        files
      } = await multipart(ctx, config.posts.maxFiles,
        config.posts.maxFileSize, config.posts.tmpDir
      ));
    } catch (error) {
      if (error.status == 400) {
        return ctx.throw(400, error.message);
      }
      return ctx.throw(500, error);
    }

    const userFiles = files ? files.map((file) => Posts.File(file, { fresh: true })) : null;

    const userPost = Posts.Post({
      boardUrl: ctx.state.board.url,
      parent: ctx.params.thread ? ctx.state.thread.id : 0,
      name: fields.name,
      subject: fields.subject,
      content: fields.content,
      ip: ctx.ip,
      files: userFiles
    }, { fresh: true });
    try {
      await Posts.savePost(userPost);
    } catch(error) {
      if(error.status && error.status === 400) {
        return ctx.throw(400, error.message);
      }
      return ctx.throw(500, error);
    }

    if (userPost.parent == 0) {
      // Delete oldest thread if max threads has been reached
      const threadCount = await Posts.getThreadCount(ctx.state.board.url);
      if (threadCount > ctx.state.board.maxThreads) {
        const oldestThreadId = await Posts.getOldestThreadId(ctx.state.board.url);
        await Posts.deletePost(ctx.state.board.url, oldestThreadId);
      }
    } else {
      // Bump OP as long as bump limit hasn't been reached
      const replyCount = await Posts.getReplyCount(ctx.state.board.url, userPost.parent);
      if (replyCount <= ctx.state.board.bumpLimit) {
        try {
          await Posts.bumpPost(ctx.state.board.url, userPost.parent);
        } catch (error) {
          return ctx.throw(409, "Bumping thread failed, OP may have been deleted?");
        }
      }
    }

    // Create a new cooldown
    await persistence.createCooldown(ctx.ip, ctx.state.board.cooldown);
  }
);

module.exports = router;