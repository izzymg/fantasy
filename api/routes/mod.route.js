const KoaRouter = require("koa-router");
const router = new KoaRouter();
const middleware = require("./middleware");
const models = require("../models");

// Get boards moderated by user
router.get("/mod/boards",
  async function(ctx) {
    await middleware.requireLogin()(ctx),
    ctx.body = await models.board.getModeratedByUser(ctx.state.session.username);
  }
);

module.exports = router.routes();