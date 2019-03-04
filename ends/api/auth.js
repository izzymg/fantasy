const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const coBody = require("co-body");
const Users = require("../../db/Users");
const Sessions = require("../../db/Sessions");
const Ips = require("../../db/Ips");
const Posts = require("../../db/Posts");

const fetchJson = async function(ctx, next) {
  ctx.assert(ctx.is("application/json"), 400, "Expected JSON data");
  try {
    const body = await coBody.json(ctx, {
      strict: true
    });
    ctx.fields = body;
  } catch (error) {
    if (error.status == 400) {
      return ctx.throw(400, error.message);
    }
    return ctx.throw(500, error);
  }
  return await next();
};

router.post("/login", fetchJson, async function(ctx) {
  ctx.assert(ctx.fields.username && typeof ctx.fields.username == "string",
    400, "Expected username"
  );
  ctx.assert(ctx.fields.password && typeof ctx.fields.password == "string",
    400, "Expected password"
  );

  let { attempts, lastAttempt } = await Ips.getLogins(ctx.ip);
  // Delete attempts if last attempt was over 12 hrs ago
  if (lastAttempt && lastAttempt > Date.now() - (12 * 60 * 60 * 1000)) {
    attempts = 0;
  } else if (attempts > 5) {
    return ctx.throw(403, "Too many login attempts, try again later");
  }

  await Ips.setLogins(ctx.ip, attempts + 1, new Date(Date.now()));

  const user = await Users.getUserWithPassword(ctx.fields.username);

  if (user && user.password) {
    const passwordMatch = await bcrypt.compare(ctx.fields.password, user.password);
    if (passwordMatch === true) {
      const sessionId = uuid();
      await Sessions.setSession(sessionId, user.username);
      ctx.set("Set-Cookie", `id=${sessionId}`);
      return ctx.body = "Success";
    }
  }
  return ctx.throw(403, "Invalid username or password");
});

router.use(async function(ctx, next) {
  const id = ctx.cookies.get("id");
  const session = await Sessions.getSession(id);
  if (session) {
    ctx.session = {
      id,
      username: session.username
    };
    return await next();
  }
  return ctx.throw(403, "You don't have permission to do that");
});

router.get("/sessionInfo", async function(ctx) {
  return ctx.body = { username: ctx.session.username };
});

router.post("/changePassword", fetchJson, async function(ctx) {
  ctx.assert(ctx.fields.currentPassword && typeof ctx.fields.currentPassword === "string",
    400, "Expected current password"
  );
  ctx.assert(ctx.fields.newPassword && typeof ctx.fields.newPassword === "string",
    400, "Expected new password"
  );
  ctx.assert(ctx.fields.confirmationPassword && typeof ctx.fields.confirmationPassword === "string",
    400, "Expected confirmation password"
  );

  if (ctx.fields.newPassword !== ctx.fields.confirmationPassword) {
    ctx.throw(400, "New password and confirmation do not match");
  }
  if (ctx.fields.newPassword.length < 8) {
    ctx.throw(400, "New password must be at least 8 characters");
  }

  const user = await Users.getUserWithPassword(ctx.session.username);
  ctx.assert(user && user.password, 403, "Invalid current password");
  const authenticated = await bcrypt.compare(ctx.fields.currentPassword, user.password);
  ctx.assert(authenticated === true, 403, "Invalid current password");

  const hash = await bcrypt.hash(ctx.fields.newPassword, 15);
  await Users.updateUserPassword(ctx.session.username, hash);
  await Sessions.deleteSession(ctx.session.id);
  return ctx.body = "Password updated, please login again";
});

router.post("/delete/:board/:post", async function(ctx, next) {
  const user = await Users.getUser(ctx.session.username);
  const authorized = await Users.canUserModerate(ctx.session.username, ctx.params.board);
  ctx.assert(user && authorized === true, 403, "You don't have permission to do that");
});

module.exports = router;