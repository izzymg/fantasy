const db = require("../../database/database");

exports.render = async ctx => {
    try {
        const threadsData = await db.fetchAll(
            `SELECT id, name, subject, content, date, lastBump, fileId, thumbSuffix, originalName, extension
            FROM posts_${ctx.state.board.url} posts
            INNER JOIN files_${ctx.state.board.url} files
            ON files.postId = posts.id
            WHERE parent = 0
            ORDER BY lastBump ASC`
            , null, true);
        const threads = {};
        // Remove duplicate post data and add files to posts
        if (threadsData) {
            threadsData.forEach(thread => {
                if (threads[thread.posts.id]) {
                    threads[thread.posts.id].files.push(thread.files);
                } else {
                    threads[thread.posts.id] = thread.posts;
                    threads[thread.posts.id].files = [];
                    threads[thread.posts.id].files.push(thread.files);
                }
            });
        }
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};