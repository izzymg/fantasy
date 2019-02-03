const path = require("path");
const postsConfig = require("../../config/posts");
const sendFile = require("koa-sendfile");

exports.render = async ctx => {
    const filesDir = path.normalize(postsConfig.filesDir);
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
};