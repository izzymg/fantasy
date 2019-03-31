const KoaRouter = require("koa-router");
const router = new KoaRouter();
const schemas = require("../schemas");
const models = require("../models");
const coBody = require("co-body");
const bcrypt = require("bcrypt");
const uuid = require("uuid/v4");

// Login
router.post("/auth/login", async function(ctx) {
  const { username, password } = schemas.login(await coBody.json(ctx, { strict: true }));
  let { attempts, lastAttempt } = await models.ip.getLogins();
  // Last  attempt was over 12 hours ago
  if(lastAttempt && lastAttempt > Date.now() - (12 * 60 * 60 * 1000)) {
    attempts = 0;
  } else if(attempts > 5) {
    ctx.throw(403, "Too many login attempts, try again later");
  }
  await models.ip.setLogins(ctx.ip, attempts + 1, new Date(Date.now()));

  const userPassword = await models.user.getPassword(username);

  if(userPassword) {
    const passwordMatches = await bcrypt.compare(password, userPassword);
    if(passwordMatches === true) {
      // Session creation
      const sessionId = uuid();
      await models.session.create(sessionId, username);
      ctx.set("Set-Cookie", `id=${sessionId}; HttpOnly; path=/`);
      ctx.body = "Success";
      return;
    }
  }
  ctx.throw(403, "Invalid credentials");
});

// Session info
router.get("/auth/session", async function(ctx) {
  const session = await models.session.get(ctx.cookies.get("id"));
  ctx.assert(session, 403, "No session found");
  ctx.body = { username: session.username };
});

// Change password
router.post("/auth/changePassword", async function(ctx) {
  // User must have a valid session to change their password
  const sessionId = ctx.cookies.get("id");
  const session = await models.session.get(sessionId);
  ctx.assert(session, 403, "You aren't logged in");

  const {
    newPassword, currentPassword,
  } = schemas.passwordChange(await coBody.json(ctx, { strict: true }));
  
  // Ensure current password matches user password
  const userPassword = await models.user.getPassword(session.username);
  ctx.assert(
    userPassword, 403,
    "Found session but no matching user, your account may have been deleted."
  );
  const passwordMatch = await bcrypt.compare(currentPassword, userPassword);
  ctx.assert(passwordMatch === true, 403, "Invalid current password");
  const newHash = await bcrypt.hash(newPassword, 15);
  await models.user.update(session.username, {
    newUsername: session.username, newPassword: newHash
  });
  // Force user to login again with new credentials
  await models.session.remove(sessionId);
  ctx.body = "Changed password, please login again";
});

module.exports = router.routes();