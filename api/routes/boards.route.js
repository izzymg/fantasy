const KoaRouter = require("koa-router");
const router = new KoaRouter();
const models = require("../models");

router.get("/boards",
  async function getBoards(ctx) {
    ctx.body = await models.board.getAll();
  }
);

router.get("/boards/:uid",
  async function getBoard(ctx) {
    ctx.body = await models.board.get(ctx.params.uid);
    ctx.assert(ctx.body, 404, "No board found");
  }
);

module.exports = router.routes();