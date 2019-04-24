const KoaRouter = require("koa-router");
const coBody = require("co-body");
const models = require("../models");
const schemas = require("../schemas");
const middleware = require("./middleware");

const router = new KoaRouter({
  prefix: "/bans",
});

router.get("/",
  async function getBan(ctx) {
    ctx.body = await models.ban.getByIp(ctx.ip);
  }
);

router.post("/",
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