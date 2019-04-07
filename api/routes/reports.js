const KoaRouter = require("koa-router");
const router = new KoaRouter();
const middleware = require("./middleware");
const schemas = require("../schemas");
const models = require("../models");
const coBody = require("co-body");

router.get("/reports/:board",
  async(ctx, next) =>  await middleware.requireBoardModerator(ctx.params.board)(ctx, next),
  async function(ctx) {
    if(ctx.query.page) {
      const page = parseInt(ctx.query.page);
      const limit = parseInt(ctx.query.limit);
      ctx.assert(page, 400, "Malformed query");
      ctx.body = await models.report.getPageOnBoard(
        ctx.params.board, limit || 25, page
      );
    }
  }
);

module.exports = router;