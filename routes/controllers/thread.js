const db = require("../../database/database");
const functions = require("./functions");
const postsConfig = require("../../config/posts");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async ctx => {

    const thread = await db.fetch("SELECT boardId FROM posts WHERE parent = 0 AND boardUrl = ? AND boardId = ?",
        [ctx.state.board.url, ctx.params.thread]
    );
    if (!thread) {
        return ctx.throw(404);
    }

    let formData;

    try {
        formData = await functions.getMultipart(ctx);
    } catch (error) {
        if (error.status && error.text && error.status === 400) {
            return ctx.throw(400, error.text);
        } else {
            return ctx.throw(500, error);
        }
    }

    const fields = formData.fields;
    const files = formData.files;

    let lengthErr;
    if (!fields.name) {
        fields.name = postsConfig.defaultName;
    } else {
        lengthErr = lengthCheck(fields.name, postsConfig.maxNameLength, "Name") || lengthErr;
    }
    if (fields.content) {
        lengthErr = lengthCheck(fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    } else if (postsConfig.replies.requireContentOrFiles && (!files || files.length < 1)) {
        return ctx.throw(400, "File or content required to post replies.");
    }
    if (fields.subject) {
        lengthErr = lengthCheck(fields.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
    }

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    const { postId, processedFiles } = await functions.submitPost({
        boardUrl: ctx.state.board.url,
        parent: thread.boardId,
        name: fields.name,
        subject: fields.subject,
        content: fields.content
    }, files);
    await functions.bumpPost(ctx.state.board.url, thread.boardId);
    return ctx.body = `Created reply ${postId}${processedFiles ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}` : "."}`;
};

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
        if (!opData) {
            return ctx.throw(404);
        }

        // Remove duplicate post data from op
        const op = opData[0].posts;
        op.files = opData.map(data => data.files);

        // Remove duplicate post data from replies
        const replies = {};
        let replyCount = 0;
        if (repliesData) {
            repliesData.forEach(reply => {
                if (replies[reply.posts.id] && reply.files.fileId) {
                    replies[reply.posts.id].files.push(reply.files);
                } else {
                    replies[reply.posts.id] = reply.posts;
                    replyCount++;
                    if (reply.files.fileId) {
                        replies[reply.posts.id].files = [reply.files];
                    }
                }
            });
        }

        return await ctx.render("thread", { replies, op, replyCount });
    } catch (error) {
        return ctx.throw(500, error);
    }
};