const KoaRouter = require("koa-router");
const router = new KoaRouter();
const config = require("../../config/config");
const middleware = require("./middleware");
const models = require("../models");

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
    ip: ctx.ip,
  });
  await models.ip.setLastReport(ctx.ip, Date.now());
  ctx.body = "Post reported";
});

module.exports = router.routes();