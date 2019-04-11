const KoaRouter = require("koa-router");
const router = new KoaRouter();
const coBody = require("co-body");
const models = require("../models");
const schemas = require("../schemas");
const middleware = require("./middleware");

// Get bans
router.get("/bans", async function(ctx) {
  ctx.body = await models.ban.getByIp(ctx.ip) || null;
});

// Ban user
router.post("/bans/:board/:post",
  async(ctx, next) => await middleware.requireBoardModerator(ctx.params.board)(ctx, next),
  async function(ctx) {
    const ban = schemas.createBan(await coBody.json(ctx, { strict: true }));
    const postIp = await models.post.getIp(ctx.params.board, ctx.params.post);
    ctx.assert(postIp, 404, "No IP associated with post, ensure the post exists.");
    await models.ban.create({
      ...ban,
      ip: postIp,
      boardUid: ctx.params.board,
    });
    ctx.body = `Banned user from ${
      ban.allBoards ? "all boards" : `/${ctx.params.board}/`} for post ${
      ctx.params.post}. ${
      ban.banExpiry ? `Expires ${ban.banExpiry.toLocaleString()}.` : "This ban is permanent."}`;
  }
);

module.exports = router.routes();