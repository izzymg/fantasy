const KoaRouter = require("koa-router");
const router = new KoaRouter();

const models = require("../models");

router.get("/posts/:board/threads", async function(ctx) {
  ctx.body = await models.post.getThreads(ctx.params.board);
});

router.get("/posts/:board/:id", async function(ctx) {
  ctx.body = await models.post.getPost(ctx.params.board, ctx.params.id);
  ctx.assert(ctx.body, 404, "No post found");
});

router.get("/posts/:board/threads/:id", async function(ctx) {
  const [ thread, replies ] = await Promise.all([
    models.post.getThread(ctx.params.board, ctx.params.id),
    models.post.getThreadReplies(ctx.params.board, ctx.params.id),
  ]);
  ctx.assert(thread, 404, "No thread found");
  ctx.body = { thread, replies };
});

module.exports = router.routes();