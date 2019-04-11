const KoaRouter = require("koa-router");
const router = new KoaRouter();
const crypto = require("crypto");
const models = require("../models");
const bcrypt = require("bcrypt");
const schemas = require("../schemas");
const middleware = require("./middleware");
const coBody = require("co-body");

// Create user
router.post("/users",
  middleware.requireAdmin(),
  async function(ctx) {
    const { username, isAdmin } = schemas.createUser(await coBody.json(ctx, { strict: true }));
    const password = crypto.randomBytes(6).toString("hex");
    const hashedPw = await bcrypt.hash(password, 15);
    try {
      await models.user.create({ username, password: hashedPw });
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

// Update user
router.put("/users/:username",
  middleware.requireAdmin(),
  async function(ctx) {
    if(ctx.query.board) {
      if(ctx.query.moderator == true) {
        await models.user.makeModerator(ctx.query.board, ctx.params.username);
        ctx.body = `Made ${ctx.params.username} a moderator of /${ctx.query.board}/`;
      } else if(ctx.query.moderator == false) {
        await models.user.removeModerator(ctx.query.board, ctx.params.username);
        ctx.body = `Removed ${ctx.params.username} as a moderator of /${ctx.query.board}/`;
      }
    }
  }
);

// Delete user
router.delete("/users/:username",
  middleware.requireAdmin(),
  async function(ctx) {
    const { usersRemoved } = await models.user.remove(ctx.params.username);
    if(usersRemoved > 0) {
      ctx.body = `User "${ctx.params.username} removed"`;
    } else {
      ctx.throw(400, "No users removed, check the username exists");
    }
  }
);

// User search
router.get("/users",
  middleware.requireAdmin(),
  async function(ctx) {
    if(ctx.query.board) {
      ctx.body = await models.user.getBoardModerators(ctx.query.board);
    } else if(ctx.query.username) {
      ctx.body = await models.user.search(ctx.query.username);
    } else if(ctx.query.page) {
      const page = parseInt(ctx.query.page);
      const limit = parseInt(ctx.query.limit);
      ctx.assert(page, 400, "Malformed query");
      ctx.body = await models.user.getPage(limit || 25, page);
    } else {
      ctx.body = await models.user.getAll();
    }
  }
);

module.exports = router.routes();