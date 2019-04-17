const KoaRouter = require("koa-router");
const router = new KoaRouter();
const middleware = require("./middleware");
const schemas = require("../schemas");
const models = require("../models");
const coBody = require("co-body");
const bcrypt = require("bcrypt");
const uuid = require("uuid/v4");
const crypto = require("crypto");

// Login
router.post("/auth/login",
  async function login(ctx) {
    const { username, password } = schemas.login(await coBody.json(ctx, { strict: true }));
    let { attempts, lastAttempt } = await models.ip.getLogins(ctx.ip);
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
        await models.session.create(sessionId, username, isAdmin);
        ctx.set("Set-Cookie", `id=${sessionId}; HttpOnly; path=/`);
        ctx.body = "Success";
        return;
      }
    }
    ctx.throw(403, "Invalid credentials");
  }
);

// Session info
router.get("/auth/session",
  async function getSessionInfo(ctx) {
    const session = await models.session.get(ctx.cookies.get("id"));
    ctx.assert(session, 403, "No session found");
    ctx.body = { username: session.username, isAdmin: session.isAdmin };
  }
);

router.post("/auth/changePassword",
  async function changePassword(ctx) {
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
  }
);

router.get("/auth/users",
  async function getUsers(ctx) {
    await middleware.requireAdmin()(ctx);
    if(ctx.query.username) {
      ctx.body = await models.user.search(ctx.query.username);
    } else if(ctx.query.page) {
      const page = parseInt(ctx.query.page);
      const limit = parseInt(ctx.query.limit);
      ctx.assert(page, 400, "Malformed query");
      ctx.body = await models.user.getPage(limit || 25, page);
    }
  }
);

// Create user
router.post("/auth/users",
  async function createUser(ctx) {
    await middleware.requireAdmin()(ctx);
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

router.delete("/auth/users/:username",
  async function deleteUser(ctx) {
    await middleware.requireAdmin()(ctx);
    const { usersRemoved } = await models.user.remove(ctx.params.username);
    if(usersRemoved > 0) {
      ctx.body = `User "${ctx.params.username}" removed`;
    } else {
      ctx.throw(400, "No users removed, check the username exists");
    }
  }
);

module.exports = router.routes();