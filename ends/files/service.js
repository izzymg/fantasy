
const path = require("path");
const config = require("../../config/config");
const Koa = require("koa");
const server = new Koa();
const Router = require("koa-router");
const router = new Router();
const sendFile = require("koa-sendfile");

router.get("/:filename", async ctx => {
    const filesDir = path.normalize(config.posts.filesDir);
    const fp = path.join(filesDir, ctx.params.filename);
    const pathStats = path.parse(fp);

    // Reject any filepaths that aren't in the files directory
    if (pathStats.dir != filesDir) {
        return ctx.throw(404);
    }
    // Reject any filepaths where the filename isn't the same as the request filename
    if (pathStats.base != ctx.params.filename) {
        return ctx.throw(404);
    }
    const stats = await sendFile(ctx, fp);
    if (!stats) {
        return ctx.throw(404);
    }
});

server.use(router.routes());
module.exports = server;