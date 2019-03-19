const KoaRouter = require("koa-router");
const router = new KoaRouter();
const coBody = require("co-body");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const ipsDb = require("../../db/ips");
const sessionsDb = require("../../db/sessions");
const usersDb = require("../../db/users");

// POST to login page
router.post("/auth/login", async(ctx) => {
  const fields = await coBody.json(ctx, { strict: true });
  ctx.assert(fields.username && typeof fields.username == "string",
    400, "Expected username"
  );
  ctx.assert(fields.password && typeof fields.password == "string",
    400, "Expected password"
  );

  let { attempts, lastAttempt } = await ipsDb.getLogins(ctx.ip);
  // Delete attempts if last attempt was over 12 hrs ago
  if (lastAttempt && lastAttempt > Date.now() - (12 * 60 * 60 * 1000)) {
    attempts = 0;
  } else if (attempts > 5) {
    ctx.throw(403, "Too many login attempts, try again later");
  }

  await ipsDb.setLogins(ctx.ip, attempts + 1, new Date(Date.now()));

  const user = await usersDb.getUserWithPassword(fields.username);

  if (user && user.password) {
    const passwordMatch = await bcrypt.compare(fields.password, user.password);
    if (passwordMatch === true) {
      const sessionId = uuid();
      await sessionsDb.setSession(sessionId, user.username);
      ctx.set("Set-Cookie", `id=${sessionId}; HttpOnly; path=/`);
      ctx.body = "Success";
      return;
    }
  }
  ctx.throw(403, "Invalid username or password");
});

// Get session information
router.get("/auth/session", async(ctx) => {
  const session = await sessionsDb.getSession(ctx.cookies.get("id"));
  ctx.assert(session, 403, "No session found");
  ctx.body = { username: session.username };
});

// Change password
router.post("/auth/changePassword",  async(ctx) => {
  const sessionId = ctx.cookies.get("id");
  const session = await sessionsDb.getSession(sessionId);
  ctx.assert(session, 400, "You are not logged in");
  const fields = await coBody.json(ctx, { strict: true });
  ctx.assert(fields.currentPassword && typeof fields.currentPassword === "string",
    400, "Expected current password"
  );
  ctx.assert(fields.newPassword && typeof fields.newPassword === "string",
    400, "Expected new password"
  );
  ctx.assert(fields.confirmationPassword && typeof fields.confirmationPassword === "string",
    400, "Expected confirmation password"
  );

  if (fields.newPassword !== fields.confirmationPassword) {
    ctx.throw(400, "New password and confirmation do not match");
  }
  if (fields.newPassword.length < 8) {
    ctx.throw(400, "New password must be at least 8 characters");
  }

  const user = await usersDb.getUserWithPassword(session.username);
  ctx.assert(user && user.password, 403, "Invalid current password");
  const authenticated = await bcrypt.compare(fields.currentPassword, user.password);
  ctx.assert(authenticated === true, 403, "Invalid current password");

  const hash = await bcrypt.hash(fields.newPassword, 15);
  await usersDb.updateUserPassword(session.username, hash);
  await sessionsDb.deleteSession(sessionId);
  return ctx.body = "Password updated, please login again";
});


module.exports = router.routes();