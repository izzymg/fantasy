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
  if(session) {
    ctx.body = {
      username: session.username
    };
  }
});

module.exports = router.routes();