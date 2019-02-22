const server = require("../httpserver");
const config = require("../../config/config");
const Router = require("koa-router");
const router = new Router();
const bcrypt = require("bcrypt");
const persistence = require("../persistence");
const middles = require("../middles");

router.post("/login", middles.getFormData, async function(ctx) {
  ctx.assert(ctx.fields.username && typeof ctx.fields.username == "string", 
    400, "Expected username"
  );
  ctx.assert(ctx.fields.password && typeof ctx.fields.password == "string", 
    400, "Expected password"
  );

  const user = await persistence.getUser(ctx.fields.username);
  
  if(user && user.password) {
    const passwordMatch = await bcrypt.compare(ctx.fields.password, user.password);
    if(passwordMatch === true) {
      // create JWT
      ctx.body = "Successful login";
    }
  }
  return ctx.throw(403, "Invalid username or password");
});

module.exports = async function() {
  const { host, port } = await server(router, config.auth);
  console.log(`Auth listening on ${host}:${port}`);
};