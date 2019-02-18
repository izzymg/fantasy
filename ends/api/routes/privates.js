const Router = require("koa-router");
const router = new Router();
const middles = require("../../middles");
const config = require("../../../config/config");

router.get("/private", (ctx) => ctx.body = `
    <p> Authenticate </p>
    <form method="POST">
        <input placeholder="Password" name="password"></input>
        <input type="submit" value="Authenticate"></input>
    </form>`
);

router.post("/private", middles.getFormData, async(ctx) => {
  if(ctx.fields && ctx.fields.password && typeof ctx.fields.password === "string"
    && ctx.fields.password === config.privatePassword) {
    ctx.cookies.set("pk", config.privateKey);
    return ctx.body = "Success - cookie generated";
  }
  return ctx.throw(403, "Failed authentication");
});

module.exports = router;