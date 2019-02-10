const postsConfig = require("../../config/posts");
const functions = require("../functions");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async (ctx, next) => {
    let lengthErr;
    if (!ctx.fields.name) {
        ctx.fields.name = postsConfig.defaultName;
    } else {
        lengthErr = lengthCheck(ctx.fields.name, postsConfig.maxNameLength, "Name") || lengthErr;
    }

    if (!ctx.fields.content && postsConfig.threads.requireContent) {
        return ctx.throw(400, "Post content required");
    } else {
        lengthErr =
            lengthCheck(ctx.fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    }

    if (!ctx.fields.subject && postsConfig.threads.requireSubject) {
        return ctx.throw(400, "Post subject required");
    } else {
        lengthErr =
            lengthCheck(ctx.fields.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
    }

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    if (!ctx.files && ctx.files.length < 1 && postsConfig.threads.requireFiles) {
        return ctx.throw(400, "File required to post");
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: 0,
            name: ctx.fields.name,
            subject: ctx.fields.subject,
            content: ctx.fields.content,
            lastBump: new Date(Date.now()),
        },
        ctx.files
    );
    await functions.deleteOldestThread(ctx.state.board.url, ctx.state.board.maxThreads);
    ctx.body = `Created thread ${postId}${
        processedFiles
            ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}`
            : "."
    }`;
    return next();
};

exports.render = async ctx => {
    try {
        const threads = await functions.getThreads(ctx.state.board.url);
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};
