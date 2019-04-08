const KoaRouter = require("koa-router");
const router = new KoaRouter();
const config = require("../../config/config");
const middleware = require("./middleware");
const schemas = require("../schemas");
const models = require("../models");
const coBody = require("co-body");

router.get("/reports", async function(ctx) {
  ctx.body = await models.report.getLevels();
});

router.get("/reports/:board",
  async(ctx, next) =>  await middleware.requireBoardModerator(ctx.params.board)(ctx, next),
  async function(ctx) {
    const page = parseInt(ctx.query.page) || 1;
    const limit = parseInt(ctx.query.limit) || 10;
    ctx.body = await models.report.getPageOnBoard(
      ctx.params.board, limit || 25, page
    );
  }
);

router.post("/reports/:board/:post", async function(ctx) {
  const lastReport = await models.ip.getLastReport(ctx.ip);
  if(lastReport && lastReport + config.posts.reportCooldown > Date.now()) {
    ctx.throw(400, "Please wait before you do that again");
  }
  const postUid = await models.post.getUid(ctx.params.board, ctx.params.post);
  ctx.assert(postUid, 404, "No post found");
  const reportLevel = parseInt(ctx.query.level);
  ctx.assert(typeof reportLevel == "number", 400, "Invalid report level");
  await models.report.create({
    level: reportLevel,
    postUid,
    postId: ctx.params.post,
    boardUid: ctx.params.board,
    ip: ctx.ip,
  });
  ctx.body = "Post reported";
});

module.exports = router.routes();