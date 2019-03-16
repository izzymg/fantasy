const KoaRouter = require("koa-router");
const router = new KoaRouter();
const postsDb = require("../../db/posts");

// Threads on board
router.get("/posts/:board/threads", async(ctx) => {
  const threads = await postsDb.getThreads(ctx.params.board);
  if(threads) ctx.body = { threads };
});

// Thread and replies
router.get("/posts/:board/threads/:id", async(ctx) => {
  const [thread, replies] = await Promise.all([
    postsDb.getThread(ctx.params.board, ctx.params.id),
    postsDb.getReplies(ctx.params.board, ctx.params.id)
  ]);
  if (!thread) ctx.throw(404);
  ctx.body = { thread, replies };
});

// Single post
router.get("/posts/:board/:id", async(ctx) => {
  const post = await postsDb.getPost(ctx.params.board, ctx.params.id);
  if (!post) ctx.throw(404);
  ctx.body = { post };
});

module.exports = router.routes();