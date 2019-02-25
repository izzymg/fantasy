const Router = require("koa-router");
const router = new Router();

const bcrypt = require("bcrypt");

const middles = require("../middles");
const persistence = require("../persistence");

router.use(async function(ctx, next) {
  const session = await persistence.getSession(ctx.cookies.get("id"));
  if (session) {
    const user = await persistence.getUser(session.username);
    if(user && user.createdAt) {
      ctx.session = { ...user };
      return await next();
    }
  }
  ctx.status = 403;
  return ctx.body = "You don't have permission to do that";
});

router.post("/changePassword", middles.getJson(), async function(ctx) {
  ctx.assert(ctx.fields.currentPassword && typeof ctx.fields.currentPassword === "string", 
    400, "Expected current password"
  );
  ctx.assert(ctx.fields.newPassword && typeof ctx.fields.newPassword === "string", 
    400, "Expected new password"
  );
  ctx.assert(ctx.fields.confirmationPassword && typeof ctx.fields.confirmationPassword === "string",
    400, "Expected confirmation password"
  );

  if(ctx.fields.newPassword !== ctx.fields.confirmationPassword) {
    ctx.throw(400, "New password and confirmation do not match");
  }
  if(ctx.fields.newPassword.length < 8) {
    ctx.throw(400, "New password must be at least 8 characters");
  }

  const authenticated = await bcrypt.compare(ctx.fields.currentPassword, ctx.session.password);
  ctx.assert(authenticated === true, 403, "Invalid current password");

  const hash = await bcrypt.hash(ctx.fields.newPassword, 15);
  await persistence.updateUserPassword(ctx.session.username, hash);
  return ctx.body = "Password updated";
});

module.exports = router;