const db = require("../../database/database");

exports.render = async ctx => {
    try {
        const [opData, repliesData] = await Promise.all([
            db.fetchAll(`SELECT boardId AS id, createdAt AS date, name, subject, content, sticky,
                fileId, extension, thumbSuffix
                FROM posts
                LEFT JOIN files ON files.postUid = posts.uid
                WHERE parent = 0 AND boardUrl = ? AND boardId = ?`, [ctx.state.board.url, ctx.params.thread], true),
            db.fetchAll(`SELECT boardId AS id, createdAt AS date, name, subject, content, sticky,
            fileId, extension, thumbSuffix
            FROM posts
            LEFT JOIN files ON files.postUid = posts.uid
            WHERE boardUrl = ? AND parent = ?`, [ctx.state.board.url, ctx.params.thread], true)
        ]);
        if(!opData) {
            return ctx.throw(404);
        }

        // Remove duplicate post data from op
        const op = opData[0].posts;
        op.files = opData.map(data => data.files);

        // Remove duplicate post data from replies
        const replies = {};
        let replyCount = 0;
        if(repliesData) {
            repliesData.forEach(reply => {
                if(replies[reply.posts.id] && reply.files.fileId) {
                    replies[reply.posts.id].files.push(reply.files);
                } else {
                    replies[reply.posts.id] = reply.posts;
                    replyCount++;
                    if(reply.files.fileId) {
                        replies[reply.posts.id].files = [reply.files];
                    }
                }
            });
        }

        return await ctx.render("thread", {replies, op, replyCount});
    } catch (error) {
        return ctx.throw(500, error);
    }
};