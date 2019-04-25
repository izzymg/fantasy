const KoaRouter = require("koa-router");
const requests = require("../requests");
const models = require("../models");
const bcrypt = require("bcrypt");
const uuid = require("uuid/v4");

const router = new KoaRouter({
  prefix: "/auth",
});

router.post("/login",
  async function login(ctx) {
    const { username, password, } = await requests.auth.login(ctx);
    let { attempts, lastAttempt, } = await models.ip.getLogins(ctx.ip);
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
        const isAdmin = await models.user.isAdmin(username);
        await models.session.insert(sessionId, username, isAdmin);
        ctx.set("Set-Cookie", `id=${sessionId}; HttpOnly; path=/`);
        ctx.body = "Success";
        return;
      }
    }
    ctx.throw(403, "Invalid credentials");
  }
);

router.get("/session",
  async function getSessionInfo(ctx) {
    const session = await models.session.get(ctx.cookies.get("id"));
    ctx.assert(session, 403, "No session found");
    ctx.body = { username: session.username, isAdmin: session.isAdmin, };
  }
);

router.post("/changePassword",
  async function changePassword(ctx) {
    // User must have a valid session to change their password
    const sessionId = ctx.cookies.get("id");
    const session = await models.session.get(sessionId);
    ctx.assert(session, 403, "You aren't logged in");

    const {
      newPassword, currentPassword,
    } = await requests.auth.changePassword(ctx);
    
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
      newUsername: session.username, newPassword: newHash,
    });
    // Force user to login again with new credentials
    await models.session.remove(sessionId);
    ctx.body = "Changed password, please login again";
  }
);

router.get("/boards",
  async function getModeratedUserBoards(ctx) {
    const sessionId = ctx.cookies.get("id");
    const session = await models.session.get(sessionId);
    ctx.assert(session, 403, "You aren't logged in");
    ctx.body = await models.board.getModeratedByUser(session.username);
  }
);

module.exports = router.routes();