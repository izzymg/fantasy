const db = require("../../database/database");
const functions = require("./functions");
const postsConfig = require("../../config/posts");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async (ctx, next) => {
    const thread = await db.fetch(
        "SELECT postId FROM posts WHERE parent = 0 AND boardUrl = ? AND postId = ?",
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
        lengthErr =
            lengthCheck(fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    } else if (postsConfig.replies.requireContentOrFiles && (!files || files.length < 1)) {
        return ctx.throw(400, "File or content required to post replies.");
    }
    if (fields.subject) {
        lengthErr =
            lengthCheck(fields.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
    }

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: thread.postId,
            name: fields.name,
            subject: fields.subject,
            content: fields.content,
        },
        files
    );
    await functions.bumpPost(ctx.state.board.url, thread.postId, ctx.state.board.bumpLimit);
    ctx.body = `Created reply ${postId}${
        processedFiles
            ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}`
            : "."
    }`;
    return next();
};

exports.render = async ctx => {
    try {
        const [opData, repliesData] = await Promise.all([
            db.fetchAll(
                `SELECT postId AS id, createdAt AS date, name, subject, content, sticky,
                fileId, extension, thumbSuffix
                FROM posts
                LEFT JOIN files ON files.postUid = posts.uid
                WHERE parent = 0 AND boardUrl = ? AND postId = ?`,
                [ctx.state.board.url, ctx.params.thread],
                true
            ),
            db.fetchAll(
                `SELECT postId AS id, createdAt AS date, name, subject, content, sticky,
            fileId, extension, thumbSuffix
            FROM posts
            LEFT JOIN files ON files.postUid = posts.uid
            WHERE boardUrl = ? AND parent = ?`,
                [ctx.state.board.url, ctx.params.thread],
                true
            ),
        ]);
        if (!opData) {
            return ctx.throw(404);
        }

        // Remove duplicate post data from op
        const op = opData[0].posts;
        op.files = opData.map(data => data.files);
        if (!repliesData) {
            return await ctx.render("thread", { op });
        }
        let replyCount = 0;
        // Remove duplicate post data from join and process into ordered array
        const replies = [];
        repliesData.forEach(replyData => {
            let found = false;
            replies.forEach(reply => {
                if (reply.id === replyData.posts.id) {
                    reply.files.push(replyData.files);
                    found = true;
                }
            });
            if (!found) {
                replyData.posts.files = [];
                if (replyData.files.fileId) {
                    replyData.posts.files.push(replyData.files);
                }
                replies.push(replyData.posts);
                replyCount++;
            }
        });

        return await ctx.render("thread", { replies, op, replyCount });
    } catch (error) {
        return ctx.throw(500, error);
    }
};
