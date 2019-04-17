const KoaRouter = require("koa-router");
const router = new KoaRouter();
const coBody = require("co-body");
const models = require("../models");
const schemas = require("../schemas");
const middleware = require("./middleware");

// Get bans
router.get("/bans",
  async function getBan(ctx) {
    ctx.body = await models.ban.getByIp(ctx.ip);
  }
);

router.post("/bans",
  async function createBan(ctx) {
    const { board: boardUid, number: postNo } = ctx.query;
    ctx.assert(boardUid && parseInt(postNo), 400);
    
    await middleware.requireBoardModerator(boardUid)(ctx);
    const ban = schemas.createBan(await coBody.json(ctx, { strict: true }));
    const ip = await models.post.getIp(boardUid, postNo);
    ctx.assert(ip, 404, "No IP associated with post, ensure the post exists.");
    await models.ban.create({ ...ban, ip, boardUid, });

    ctx.body = {
      allBoards: ban.allBoards,
      expires: ban.expires,
    };
  }
);

module.exports = router.routes();