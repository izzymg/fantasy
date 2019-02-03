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
        const insertPost = await db.query(`INSERT INTO posts_${ctx.state.board.url} set ?`, postData.post);
        // Copy all files from temp to permanent store and add record to db
        if (postData.files) {
            await Promise.all(postData.files.map(async file => {
                await miscFunctions.rename(file.tempPath, path.join(postsConfig.filesDir, `${file.id}.${file.extension}`));
                delete file.tempPath;
                file.postId = insertPost.inserted;
                await db.query(`INSERT INTO files_${ctx.state.board.url} set ?`, file);
            }));
        }
        ctx.body = `Post successful, created post no.${insertPost.inserted}`;
    } catch (error) {
        for (const file of postData.files) {
            miscFunctions.unlink(file.tempPath);
        }
        return ctx.throw(500, error);
    }
};