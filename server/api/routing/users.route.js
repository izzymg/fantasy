const KoaRouter = require("koa-router");
const middleware = require("./middleware");
const crypto = require("crypto");
const requests = require("../requests");
const models = require("../models");
const bcrypt = require("bcrypt");

const router = new KoaRouter({
  prefix: "/users",
});

router.get("/",
  async function getUsers(ctx) {
    await middleware.requireAdmin()(ctx);
    const { username, page, limit, } = ctx.query;
    ctx.assert(username || parseInt(page), 404, "No user found");
    if(username) {
      ctx.body = await models.user.search(username);
      return;
    }
    ctx.body = await models.user.getPage(parseInt(limit) || 25, page);
  }
);

router.get("/:username",
  async function getUserInfo(ctx) {
    await middleware.requireAdmin()(ctx);
    const moderatedBoards = await models.board.getModeratedByUser(ctx.params.username);
    ctx.body = {
      moderatedBoards,
    };
  }
);

router.delete("/:username",
  async function deleteUser(ctx) {
    await middleware.requireAdmin()(ctx);
    const { usersRemoved, } = await models.user.remove(ctx.params.username);
    if(usersRemoved > 0) {
      ctx.body = `User "${ctx.params.username}" removed`;
    } else {
      ctx.throw(400, "No users removed, check the username exists");
    }
  }
);

router.post("/",
  async function createUser(ctx) {
    await middleware.requireAdmin()(ctx);
    const { username, isAdmin, } = await requests.user.create(ctx);
    const password = crypto.randomBytes(6).toString("hex");
    const hashedPw = await bcrypt.hash(password, 15);
    try {
      await models.user.insert({ username, password: hashedPw, });
    } catch(error) {
      if(error.code == "ER_DUP_ENTRY") {
        ctx.throw(400, "User already exists by that username");
      }
    }
    if(isAdmin) {
      await models.user.makeAdmin(username);
    }
    ctx.body = `User ${username} created, give them this password: ${password}.
    Instruct them to change it after they login.`;
    if(isAdmin) {
      ctx.body += " This user is an administrator.";
    }
  }
);

module.exports = router.routes();