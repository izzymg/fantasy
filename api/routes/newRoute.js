const models = require("../models");
const Router = require("koa-router");
const router = new Router();

router.get("/new/posts/:board/threads", async function(ctx) {
  const x = await models.post.getThreads(ctx.params.board);
  ctx.body = x;
});

module.exports = router.routes();