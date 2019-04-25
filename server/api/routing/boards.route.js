const KoaRouter = require("koa-router");
const models = require("../models");

const router = new KoaRouter({
  prefix: "/boards",
});

router.get("/",
  async function getBoards(ctx) {
    ctx.body = await models.board.getAll();
  }
);

router.get("/:uid",
  async function getBoard(ctx) {
    ctx.body = await models.board.get(ctx.params.uid);
    ctx.assert(ctx.body, 404, "No board found");
  }
);

module.exports = router.routes();