// Publically accessible API routes 

const config = require("../../config/config");
const multipart = require("../../libs/multipart");
const Posts = require("../../db/Posts");
const Boards = require("../../db/Boards");
const Bans = require("../../db/Bans");
const Ips = require("../../db/Ips");
const Router = require("koa-router");
const router = new Router();

// Set board for all board routes
router.use("/boards/:board/*", async(ctx, next) => {
  const board = await Boards.getBoard(ctx.params.board);
  if (!board) {
    return ctx.throw(404, "No such board");
  }
  ctx.state.board = board;
  return await next();
});

// Get all boards
router.get("/boards", async(ctx) => {
  const boards = await Boards.getBoards();
  if (!boards) {
    return ctx.body = {};
  }
  ctx.body = { boards };
});

// Get info about board
router.get("/boards/:board", async(ctx) => {
  const board = await Boards.getBoard(ctx.params.board);
  if (!board) return ctx.throw(404);
  ctx.body = {
    board
  };
});

// Get board threads
router.get("/boards/:board/threads", async(ctx) => {
  const threads = await Posts.getThreads(ctx.params.board);
  if (!threads) {
    return ctx.body = {};
  }
  ctx.body = { threads };
});

// Get single post
router.get("/boards/:board/:post", async(ctx) => {
  const post = await Posts.getPost(ctx.params.board, ctx.params.post);
  if (!post) return ctx.throw(404);
  ctx.body = { post };
});

// Get thread and replies to thread
router.get("/boards/:board/threads/:thread", async(ctx) => {
  const [thread, replies] = await Promise.all([
    Posts.getThread(ctx.state.board.url, ctx.params.thread),
    Posts.getReplies(ctx.state.board.url, ctx.params.thread)
  ]);
  if (!thread) return ctx.throw(404);
  ctx.body = { thread, replies };
});

// Submit new thread to board
router.post("/boards/:board/:thread?",
  async(ctx) => {
    ctx.body = "";

    // Is IP on cooldown?
    const cd = await Ips.getCooldown(ctx.ip, ctx.params.board);
    if(cd && cd < Date.now()) {
      await Ips.deleteCooldown(ctx.ip, ctx.params.board);
    } else if (cd) {
      return ctx.throw(400, `You must wait ${
        Math.floor((cd - Date.now()) / 1000)
      } seconds before posting again`);
    }

    // Does board exist?
    const board = await Boards.getBoard(ctx.params.board);
    if (!board) return ctx.throw(404, "No such board");

    // Is user banned from this board/all boards?
    const ban = await Bans.getBan(ctx.ip, board.url);
    if (ban && ban.expires && ban.expires < new Date(Date.now())) {
      await Bans.deleteBan(ban.uid);
      ctx.body += "You were just unbanned. ";
    } else if (ban) {
      ctx.throw(403, "You are banned");
    }

    // Does thread exist if reply?
    if (ctx.params.thread) {
      const thread = await Posts.getThread(board.url, ctx.params.thread);
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
      boardUrl: board.url,
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
      const threadCount = await Posts.getThreadCount(board.url);
      if (threadCount > board.maxThreads) {
        const oldestThreadId = await Posts.getOldestThreadId(board.url);
        await Posts.deletePost(board.url, oldestThreadId);
      }
    } else {
      // Bump OP as long as bump limit hasn't been reached
      const replyCount = await Posts.getReplyCount(board.url, userPost.parent);
      if (replyCount <= board.bumpLimit) {
        try {
          await Posts.bumpPost(board.url, userPost.parent);
        } catch (error) {
          return ctx.throw(409, "Bumping thread failed, OP may have been deleted?");
        }
      }
    }

    // Create a new cooldown
    await Ips.createCooldown(ctx.ip, board.url, board.cooldown);
    ctx.body += "Post submitted";
  }
);

// Get user ban status
router.get("/banInfo", async function(ctx) {
  const bans = await Bans.getAllBans(ctx.ip);
  ctx.body = bans ? { bans } : null;
});

module.exports = router;