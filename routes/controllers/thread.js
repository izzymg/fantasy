const functions = require("./functions");
const postsConfig = require("../../config/posts");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async (ctx, next) => {
    const isThread = await functions.postIsThread(ctx.state.board.url, ctx.params.thread);
    if(!isThread) {
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
    fields.subject = null;

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: ctx.params.thread,
            name: fields.name,
            subject: fields.subject,
            content: fields.content,
        },
        files
    );
    await functions.bumpPost(ctx.state.board.url, ctx.params.thread, ctx.state.board.bumpLimit);
    ctx.body = `Created reply ${postId}${
        processedFiles
            ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}`
            : "."
    }`;
    return next();
};

exports.render = async ctx => {
    const thread = await functions.getThread(
        ctx.state.board.url, ctx.params.thread
    );
    if(!thread) {
        return ctx.throw(404);
    }
    return await ctx.render("thread", { op: thread.op, replies: thread.replies, replyCount: thread.replyCount });
};
