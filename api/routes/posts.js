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

module.exports = router.routes();