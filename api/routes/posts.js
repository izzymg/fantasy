const KoaRouter = require("koa-router");
const router = new KoaRouter();
const config = require("../../config/config");
const postsDb = require("../db/posts");
const boardsDb = require("../db/boards");
const ipsDb = require("../db/ips");
const bansDb = require("../db/bans");
const reportsDb = require("../db/reports");
const multipart = require("../../libs/multipart");
const middleware = require("./middleware");

// Threads on board
router.get("/posts/:board/threads", async(ctx) => {
  const threads = await postsDb.getThreads(ctx.params.board);
  ctx.body = threads ? { threads } : null;
});

// Thread and replies
router.get("/posts/:board/threads/:post", async(ctx) => {
  const [thread, replies] = await Promise.all([
    postsDb.getThread(ctx.params.board, ctx.params.post),
    postsDb.getReplies(ctx.params.board, ctx.params.post)
  ]);
  if (!thread) ctx.throw(404);
  ctx.body = { thread, replies };
});

// Single post
router.get("/posts/:board/:post", async(ctx) => {
  const post = await postsDb.getPost(ctx.params.board, ctx.params.post);
  if (!post) ctx.throw(404);
  ctx.body = { post };
});

// Submit post
router.post("/posts/:board/:parent?", async(ctx) => {

  ctx.assert(ctx.is("multipart/form-data"), 400, "Invalid content type");

  let parent, files, fields, unbanned;
  
  const board = await boardsDb.getBoard(ctx.params.board);
  ctx.assert(board, 404, "No such board");
  if(ctx.params.parent) {
    parent = await postsDb.getThread(ctx.params.board, ctx.params.parent);
    ctx.assert(parent, 404, "No such thread");
    ctx.assert(!parent.locked, 400, "Thread is locked");
  }

  // Is IP on cooldown?
  const cd = await ipsDb.getCooldown(ctx.ip, board.url);
  ctx.assert(!cd || cd < Date.now(), 400,
    `You must wait ${Math.floor((cd - Date.now()) / 1000)} seconds before posting again`
  );
  if(cd) await ipsDb.deleteCooldown(ctx.ip, board.url);

  // Get post data
  try {
    ({ fields, files } = await multipart(ctx,
      config.posts.maxFiles, config.posts.maxFileSize, config.posts.tmpDir));
  } catch(error) {
    if(error.status === 400) ctx.throw(400, error.message);
    ctx.throw(500, error);
  }

  // Is user banned from this board/all boards?
  const ban = await bansDb.getBan(ctx.ip, board.url);
  ctx.assert(!ban || ban.expires && ban.expires < new Date(Date.now()), 403, "You are banned");
  if(ban) {
    await bansDb.deleteBan(ban.uid);
    unbanned = true;
  }

  const userFiles = files ? files.map((file) => postsDb.File(file, { fresh: true })) : null;
  const userPost = postsDb.Post({
    boardUrl: board.url,
    parent: parent ? parent.id : 0,
    name: fields.name,
    subject: fields.subject,
    content: fields.content,
    ip: ctx.ip,
    files: userFiles
  }, { fresh: true });
  
  try {
    await postsDb.savePost(userPost);
  } catch(error) {
    if(error.status && error.status === 400) {
      return ctx.throw(400, error.message);
    }
    return ctx.throw(500, error);
  }

  if (userPost.parent == 0) {
    // Delete oldest thread if max threads has been reached
    const threadCount = await postsDb.getThreadCount(board.url);
    if (threadCount > board.maxThreads) {
      const oldestThreadId = await postsDb.getOldestThreadId(board.url);
      await postsDb.deletePost(board.url, oldestThreadId);
    }
  } else {
    // Bump OP as long as bump limit hasn't been reached
    const replyCount = await postsDb.getReplyCount(board.url, userPost.parent);
    if (replyCount <= board.bumpLimit) {
      try {
        await postsDb.bumpPost(board.url, userPost.parent);
      } catch (error) {
        return ctx.throw(409, "Bumping thread failed, OP may have been deleted?");
      }
    }
  }
  await ipsDb.createCooldown(ctx.ip, board.url, board.cooldown);
  ctx.body = "Post submitted.";
  if(unbanned) ctx.body += " You were just unbanned.";
});

router.delete("/posts/:board/:post", async(ctx, next) => {
  await middleware.requireModOfBoard(ctx.params.board)(ctx, next);
  const { deletedPosts, deletedFiles } = await postsDb.deletePost(ctx.params.board, ctx.params.post);

  if(!deletedPosts) {
    ctx.body = "Didn't delete any posts, check the board is correct and the post is still up";
    return;
  }

  ctx.body = `Deleted ${deletedPosts} ${deletedPosts == 1 ? "post" : "posts"}`;
  if(deletedFiles) {
    ctx.body += ` and ${deletedFiles} ${deletedFiles == 1 ? "file" : "files"}`;
  }
});

// Report post
router.post("/posts/report/:board/:post", async function(ctx) {
  const lastReport = await ipsDb.getLastReport(ctx.ip);
  if(lastReport && lastReport + config.posts.reportCooldown > Date.now()) {
    ctx.throw(400, "Please wait before you can do that again");
  }
  const postUid = await postsDb.getPostUid(ctx.params.board, ctx.params.post);
  if(!postUid) ctx.throw(404, "No post found");
  const report = reportsDb.Report({
    level: 0,
    postUid,
    postId: ctx.params.post,
    ip: ctx.ip,
    createdAt: new Date(Date.now()),
    boardUrl: ctx.params.board
  });
  await reportsDb.saveReport(report);
  ctx.body = "Reported post";
  await ipsDb.setLastReport(ctx.ip, Date.now());
});

// Sticky post
router.put ("/posts/stick/:board/:post", async function(ctx, next) {
  await middleware.requireModOfBoard(ctx.params.board)(ctx, next);
  const post = await postsDb.getThread(ctx.params.board, ctx.params.post);
  ctx.assert(post, 404, "No post found, is the post a thread?");
  await postsDb.setSticky(ctx.params.board, ctx.params.post, true);
  ctx.body = "Stickied";
});

// Sticky post
router.put("/posts/unstick/:board/:post", async function(ctx, next) {
  await middleware.requireModOfBoard(ctx.params.board)(ctx, next);
  const post = await postsDb.getThread(ctx.params.board, ctx.params.post);
  if(!post) ctx.throw(404, "No post found, is the post a thread?");
  await postsDb.setSticky(ctx.params.board, ctx.params.post, false);
  ctx.body = "Unstickied";
});

module.exports = router.routes();