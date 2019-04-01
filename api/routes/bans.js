const KoaRouter = require("koa-router");
const router = new KoaRouter();
const models = require("../models");

// Get bans
router.get("/bans", async(ctx) => 
  ctx.body = (await models.ban.getByIp(ctx.ip) || null)
);

module.exports = router.routes();