const db = require("../../database/database");

exports.render = async ctx => {
    try {
        const threadsData = await db.fetchAll(
            `SELECT boardId AS id, createdAt AS date, name, subject, content, sticky,
                fileId, extension, thumbSuffix
            FROM posts
            LEFT JOIN files ON posts.uid = files.postUid
            WHERE boardUrl = ? AND parent = 0
            ORDER BY lastBump ASC`,
            ctx.state.board.url, true);
        const threads = {};
        // Remove duplicates from query and join files to posts
        if(threadsData) {
            for(const thread of threadsData) {
                if(threads[thread.posts.id] && thread.files.fileId) {
                    threads[thread.posts.id].files.push(thread.files);
                } else {
                    // Copy thread posts table into new key/val pair
                    threads[thread.posts.id] = thread.posts;
                    // Add thread files array
                    if(thread.files.fileId) {
                        threads[thread.posts.id].files = [thread.files];
                    }
                }
            }
        }
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};