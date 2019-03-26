const KoaRouter = require("koa-router");
const router = new KoaRouter();
const models = require("../models");

router.get("/boards", async function(ctx) {
  ctx.body = await models.board.getAll();
});

router.get("/boards/:id", async function(ctx) {
  ctx.body = await models.board.get(ctx.params.id);
  ctx.assert(ctx.body, 404, "No board found");
});

module.exports = router.routes();