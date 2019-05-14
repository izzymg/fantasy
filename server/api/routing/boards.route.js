const KoaRouter = require("koa-router");
const models = require("../models");
const requests = require("../requests");
const middleware = require("./middleware");

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

router.post("/",
  async function createBoard(ctx) {
    await middleware.requireAdmin()(ctx);
    const board = await requests.board.create(ctx);
    await models.board.insert(board);
    ctx.body = {
      uid: board.uid,
      title: board.title,
    };
  }
);

router.delete("/:uid",
  async function deleteBoard(ctx) {
    await middleware.requireAdmin()(ctx);
    const { boardsRemoved, } = await models.board.remove(ctx.params.uid);
    if(boardsRemoved > 0) {
      ctx.body = `Board /${ctx.params.uid}/ removed`;
    } else {
      ctx.throw(400, "No boards removed, check the uid is correct");
    }
  }
);

module.exports = router.routes();