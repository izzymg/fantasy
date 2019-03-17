const KoaRouter = require("koa-router");
const router = new KoaRouter();
const coBody = require("co-body");
const bansDb = require("../../db/bans");
const postsDb = require("../../db/posts");
const middleware = require("./middleware");

// Get your bans
router.get("/bans", async(ctx) => ctx.body = (await bansDb.getAllBans(ctx.ip) || null));

// Ban user for post
router.post("/ban/:board/:post", async(ctx, next) => {
  await middleware.requireModOfBoard(ctx.params.board)(ctx, next);
  const fields = await coBody.json(ctx, { strict: true });
  const hours = Number(fields.hours) || 0;
  const days = Number(fields.days) || 0;
  ctx.assert(fields.reason, 400, "Expected reason for ban");

  const currentTime = Date.now();
  let banExpiry = null;
  if(hours || days) {
    banExpiry = new Date(currentTime + (hours * 60 * 60 * 1000) + (days * 24 * 60 * 60 * 1000));
    ctx.assert(banExpiry > currentTime, 400, "Ban expires in the past");
  }

  const postIp = await postsDb.getPostIp(ctx.params.board, ctx.params.post);
  if(!postIp) {
    ctx.throw(404, "No such post, check board is correct or that it hasn't been deleted.");
  }
  try {
    await bansDb.saveBan(bansDb.Ban({
      ip: postIp,
      boardUrl: ctx.params.board,
      allBoards: fields.allBoards || false,
      expires: banExpiry,
      reason: fields.reason
    }, { fresh: true }));
    ctx.body = `Banned user from ${
      fields.allBoards ? "all boards" : `/${ctx.params.board}/`} for post ${
      ctx.params.post}. ${
      banExpiry ? `Expires ${banExpiry.toLocaleString()}.` : "This ban is permanent."}`;
  } catch(error) {
    if(error.status && error.status === 400) {
      ctx.throw(400, error.message);
    }
    ctx.throw(500, error);
  }
});

module.exports = router.routes();