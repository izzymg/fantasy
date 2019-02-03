const db = require("../../database/database");
const miscFunctions = require("../../libs/miscfunctions");
const path = require("path");
const postsConfig = require("../../config/posts");

exports.render = async (ctx, next) => {
    try {
        const threads = await db.fetchAll(
            `SELECT id, name, subject, content, date, lastBump
            FROM posts_${ctx.state.board.url}
            WHERE parent = 0
            ORDER BY lastBump ASC`
        );
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};
exports.createThread = async ctx => {
    const postData = ctx.state.postData;
    if (!postData) {
        return ctx.throw(500, "No post object found on context state");
    }
    try {
        const data = await db.query(`INSERT INTO posts_${ctx.state.board.url} set ?`, postData.post);
        for (const file of postData.files) {
            // Move temp files into permanent store
            miscFunctions.rename(file.tempPath, path.join(postsConfig.imageDir, `${file.id}.${file.extension}`));
        }
        ctx.body = `Post successful, created post no.${data.inserted}`;
    } catch (error) {
        for (const file of postData.files) {
            miscFunctions.unlink(file.tempPath);
        }
        return ctx.throw(500, error);
    }
};