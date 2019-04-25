const KoaRouter = require("koa-router");
const models = require("../models");
const requests = require("../requests");
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
    ctx.assert(boardUid && parseInt(postNo), 400, "Expected board and post number");
    
    await middleware.requireBoardModerator(boardUid)(ctx);
    const ban = await requests.ban.create(ctx);
    const ip = await models.post.getIp(boardUid, postNo);
    ctx.assert(ip, 404, "No IP associated with post, ensure the post exists.");
    await models.ban.insert({ ...ban, boardUid, });

    ctx.body = {
      allBoards: ban.allBoards,
      expires: ban.expires,
    };
  }
);

module.exports = router.routes();