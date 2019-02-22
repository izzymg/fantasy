const server = require("../httpserver");
const config = require("../../config/config");
const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcrypt");
const persistence = require("../persistence");
const middles = require("../middles");
const uuid = require("uuid/v4");

router.post("/login", middles.getFormData, async function(ctx) {

  ctx.assert(ctx.fields.username && typeof ctx.fields.username == "string", 
    400, "Expected username"
  );
  ctx.assert(ctx.fields.password && typeof ctx.fields.password == "string", 
    400, "Expected password"
  );

  let { attempts, lastAttempt } = await persistence.getLoginAttempts(ctx.ip);
  if(lastAttempt && lastAttempt + (12 * 60 * 60 * 1000) < Date.now()) {
    attempts = 0;
  } else if(attempts > 5) {
    return ctx.throw(403, "Too many login attempts, try again later");
  }

  await persistence.setLoginAttempts(ctx.ip, attempts + 1, Date.now());

  const user = await persistence.getUser(ctx.fields.username);
  
  if(user && user.password) {
    const passwordMatch = await bcrypt.compare(ctx.fields.password, user.password);
    if(passwordMatch === true) {
      const sessionId = uuid();
      await persistence.createSession(sessionId, user.username);
      ctx.set("Set-Cookie", `id=${sessionId}`);
      return ctx.body = "Successful login";
    }
  }
  return ctx.throw(403, "Invalid username or password");
});

router.get("/logout", async function(ctx) {
  const sessionId = ctx.cookies.get("id");
  if(!sessionId) {
    return ctx.body = "You weren't logged in";
  }
  await persistence.deleteSession(sessionId);
  ctx.cookies.set("id");
  return ctx.body = "Logged out";
});

router.post("/delete", middles.getFormData, async function(ctx) {
  const session = await persistence.getSession(ctx.cookies.get("id"));
  ctx.assert((session && session.username), 403, "You don't have persmission");

  ctx.assert(ctx.fields.post, 400, "Expected post to delete");
  ctx.assert(ctx.fields.board, 400, "Expected url of board");

  const [isAdmin, isModerator] = await Promise.all([
    persistence.isUserAdministrator(session.username),
    persistence.isUserModerator(session.username, ctx.fields.board)
  ]);
  ctx.assert((isAdmin === true || isModerator === true), 403, "You don't have persmission");
  const { deletedPosts, deletedFiles } = await persistence.deletePost(
    ctx.fields.board, ctx.fields.post
  );
  ctx.body = `Deleted ${deletedPosts} posts and ${deletedFiles} files.`;
  if(!deletedPosts) {
    ctx.body += " Post may already be deleted or board may not exist.";
  }
  return;
});

module.exports = async function() {
  const { host, port } = await server(router, config.auth);
  console.log(`Auth listening on ${host}:${port}`);
};