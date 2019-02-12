const functions = require("../functions");
const postsConfig = require("../../../config/config").posts;
const { lengthCheck } = require("../../../libs/textFunctions");

exports.post = async (ctx, next) => {
    const isThread = await functions.postIsThread(ctx.state.board.url, ctx.params.thread);
    if(!isThread) {
        return ctx.throw(404);
    }

    let lengthErr;
    if (!ctx.fields.name) {
        ctx.fields.name = postsConfig.defaultName;
    } else {
        lengthErr = lengthCheck(ctx.fields.name, postsConfig.maxNameLength, "Name") || lengthErr;
    }
    if (ctx.fields.content) {
        lengthErr =
            lengthCheck(ctx.fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    } else if (postsConfig.replies.requireContentOrFiles && (!ctx.files || ctx.files.length < 1)) {
        return ctx.throw(400, "File or content required to post replies.");
    }
    ctx.fields.subject = null;

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: ctx.params.thread,
            name: ctx.fields.name,
            subject: ctx.fields.subject,
            content: ctx.fields.content,
        },
        ctx.files
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
    return await ctx.render("thread", {
        op: thread.op, replies: thread.replies, replyCount: thread.replyCount
    });
};
