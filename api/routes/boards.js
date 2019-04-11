const KoaRouter = require("koa-router");
const router = new KoaRouter();
const middleware = require("./middleware");
const models = require("../models");

// All boards or moderated boards
router.get("/boards",
  async function(ctx, next) {
    if(ctx.query.moderated) {
      middleware.requireLogin()(ctx, next);
    }
  },
  async function(ctx) {
    if(ctx.query.moderated) {
      ctx.body = await models.board.getModeratedByUser(ctx.state.session.username);
    } else {
      ctx.body = await models.board.getAll();
    }
  }
);

// Single board
router.get("/boards/:id", async function(ctx) {
  ctx.body = await models.board.get(ctx.params.id);
  ctx.assert(ctx.body, 404, "No board found");
});

module.exports = router.routes();