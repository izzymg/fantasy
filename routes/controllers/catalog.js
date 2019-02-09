const postsConfig = require("../../config/posts");
const functions = require("./functions");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async (ctx, next) => {
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

    if (!fields.content && postsConfig.threads.requireContent) {
        return ctx.throw(400, "Post content required");
    } else {
        lengthErr =
            lengthCheck(fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    }

    if (!fields.subject && postsConfig.threads.requireSubject) {
        return ctx.throw(400, "Post subject required");
    } else {
        lengthErr =
            lengthCheck(fields.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
    }

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    if (!files && files.length < 1 && postsConfig.threads.requireFiles) {
        return ctx.throw(400, "File required to post");
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: 0,
            name: fields.name,
            subject: fields.subject,
            content: fields.content,
            lastBump: new Date(Date.now()),
        },
        files
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
