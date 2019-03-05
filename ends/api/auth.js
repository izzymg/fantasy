// Authentication based API routes

const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const coBody = require("co-body");
const Users = require("../../db/Users");
const Sessions = require("../../db/Sessions");
const Ips = require("../../db/Ips");
const Posts = require("../../db/Posts");
const Bans = require("../../db/Bans");

async function fetchJson(ctx, next) {
  ctx.assert(ctx.is("application/json"), 400, "Expected JSON data");
  try {
    const body = await coBody.json(ctx, {
      strict: true
    });
    ctx.fields = body;
  } catch (error) {
    if (error.status == 400) {
      ctx.throw(400, error.message);
    }
    ctx.throw(500, error);
  }
  return await next();
}

async function requireModOrAdmin(ctx, next) {
  const user = await Users.getUser(ctx.session.username);
  const authorized = await Users.canUserModerate(ctx.session.username, ctx.params.board);
  ctx.assert(user && authorized === true, 403, "You don't have permission to do that");
  return await next();
}

// POST to login page
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
    ctx.throw(403, "Too many login attempts, try again later");
  }

  await Ips.setLogins(ctx.ip, attempts + 1, new Date(Date.now()));

  const user = await Users.getUserWithPassword(ctx.fields.username);

  if (user && user.password) {
    const passwordMatch = await bcrypt.compare(ctx.fields.password, user.password);
    if (passwordMatch === true) {
      const sessionId = uuid();
      await Sessions.setSession(sessionId, user.username);
      ctx.set("Set-Cookie", `id=${sessionId}`);
      ctx.body = "Success";
      return;
    }
  }
  ctx.throw(403, "Invalid username or password");
});

// Set session on future routes
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
  ctx.throw(403, "You don't have permission to do that");
});

// Get session information
router.get("/sessionInfo", async function(ctx) {
  return ctx.body = { username: ctx.session.username };
});


// Change password
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

// Delete post from board
router.post("/delete/:board/:post", requireModOrAdmin, async function(ctx) {
  const { deletedPosts, deletedFiles } = await Posts.deletePost(ctx.params.board, ctx.params.post);

  if(!deletedPosts) {
    ctx.body = "Didn't delete any posts, check the board url is correct and the post is still up";
    return;
  }

  ctx.body = `Deleted ${deletedPosts} ${deletedPosts == 1 ? "post" : "posts"}`;
  if(deletedFiles) {
    ctx.body += ` and ${deletedFiles} ${deletedFiles == 1 ? "file" : "files."}`;
  }
});

// Ban user by post
router.post("/ban/:board/:post", requireModOrAdmin, fetchJson, async function(ctx) {
  const hours = Number(ctx.fields.hours) || 0;
  const days = Number(ctx.fields.days) || 0;
  ctx.assert(ctx.fields.reason, 400, "Expected reason for ban");

  const currentTime = Date.now();
  let banExpiry = null;
  if(hours || days) {
    banExpiry = new Date(currentTime + (hours * 60 * 60 * 1000) + (days * 24 * 60 * 60 * 1000));
    ctx.assert(banExpiry > currentTime, 400, "Ban expires in the past");
  }

  const postIp = await Posts.getPostIp(ctx.params.board, ctx.params.post);
  if(!postIp) {
    ctx.throw(404, "No such post, check board is corrent or that it hasn't been deleted.");
  }
  try {
    await Bans.saveBan(Bans.Ban({
      ip: postIp,
      boardUrl: ctx.params.board,
      allBoards: ctx.fields.allBoards || false,
      expires: banExpiry,
      reason: ctx.fields.reason
    }, { fresh: true }));
    ctx.body = `Banned user from ${
      ctx.fields.allBoards ? "all boards" : `/${ctx.params.board}/`} for post ${
      ctx.params.post}. ${
      banExpiry ? `Expires ${banExpiry.toLocaleString()}.` : "This ban is permanent."}`;
  } catch(error) {
    if(error.status && error.status === 400) {
      ctx.throw(400, error.message);
    }
    ctx.throw(500, error);
  }

});

module.exports = router;