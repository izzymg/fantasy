const db = require("../../database/database");

exports.render = async (ctx, next) => {
    try {
        const [opData, repliesData] = await Promise.all([
            db.fetchAll(
                `SELECT id, name, subject, content, date, lastBump, fileId, thumbSuffix, originalName, extension
                FROM posts_${ctx.state.board.url} posts
                LEFT JOIN files_${ctx.state.board.url} files
                ON files.postId = posts.id
                WHERE id = ? AND parent = 0`,
                ctx.params.thread, true),
            db.fetchAll(
                `SELECT id, name, subject, content, date, lastBump, fileId, thumbSuffix, originalName, extension
                FROM posts_${ctx.state.board.url} posts
                LEFT JOIN files_${ctx.state.board.url} files
                ON files.postId = posts.id
                WHERE parent = ?`, ctx.params.thread, true)
        ]);
        if (!opData) {
            return await next();
        }

        // Remove duplicate post data and add files to posts
        const op = opData[0].posts;
        op.files = [];
        opData.forEach(p => op.files.push(p.files));

        const replies = {};
        let replyCount = 0;
        if (repliesData) {
            repliesData.forEach(reply => {
                replyCount++;
                if (replies[reply.posts.id] && reply.files.fileId) {
                    replies[reply.posts.id].files.push(reply.files);
                } else {
                    replies[reply.posts.id] = reply.posts;
                    if (reply.files.fileId) {
                        replies[reply.posts.id].files = [];
                        replies[reply.posts.id].files.push(reply.files);
                    }
                }
            });
        }
        return await ctx.render("thread", { thread: { op, replies }, replyCount });
    } catch (error) {
        return ctx.throw(500, error);
    }
};