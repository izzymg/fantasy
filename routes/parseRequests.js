// Request parser middleware

const postsConfig = require("../config/posts");
const multipart = require("../libs/multipart");
const { standardText } = require("../libs/miscfunctions");

function fieldCheck(str, max, name) {
    if (!str) {
        return null;
    }
    if (!typeof str === "string") {
        return `${name}: expected string.`;
    }
    if (str.length > max) {
        return `${name} must be under ${max} characters.`;
    }
    return null;
}

exports.parseThread = async (ctx, next) => {

    if (!ctx.is("multipart/form-data")) {
        return ctx.throw(400, "Expected multipart/form-data");
    }

    try {
        const data = await multipart(ctx, postsConfig.maxFileSize, postsConfig.maxFiles, postsConfig.tmpDir, postsConfig.md5);
        const post = {
            files: data.files,
            post: {
                name: data.fields.name,
                subject: data.fields.subject,
                content: data.fields.content,
                parent: 0
            }
        }
        let lengthErr;
        lengthErr = fieldCheck(post.post.name, postsConfig.maxNameLength, "Name") || lengthErr;
        lengthErr = fieldCheck(post.post.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
        lengthErr = fieldCheck(post.post.content, postsConfig.maxContentLength, "Content") || lengthErr;
        if (lengthErr) {
            return ctx.throw(400, lengthErr);
        }
        ctx.state.postData = post;
        return await next();
    } catch (error) {
        switch (error) {
            case "UNACCEPTED_MIMETYPE":
                return ctx.throw(400, "Unaccepted mimetype");
            case "FILE_SIZE_LIMIT":
                return ctx.throw(400, `Images must be under ${Math.floor(postsConfig.maxFileSize / 1000)}kb`);
            case "FILES_LIMIT":
                return ctx.throw(400, `You may not post more than ${postsConfig.maxFiles} files`);
            case "FIELDS_LIMIT":
                return ctx.throw(400, "Too many text fields");
            default:
                return ctx.throw(500, error);
        }
    }
};

exports.validateThread = async (ctx, next) => {
    const post = ctx.state.postData.post;
    const files = ctx.state.postData.files;
    if (!post.name) {
        post.name = postsConfig.defaultName;
    }
    if (!post.content) {
        if (postsConfig.threads.requireContent) {
            return ctx.throw(400, "Post content required");
        }
        post.content = "";
    }
    if (!post.subject) {
        if (postsConfig.threads.requireSubject) {
            return ctx.throw(400, "Post subject required");
        }
        post.subject = "";
    }
    if (!files || files.length < 1) {
        if (postsConfig.threads.requireFiles) {
            return ctx.throw(400, "File required to post");
        }
    }
    post.name = standardText(post.name);
    post.subject = standardText(post.subject);
    post.content = standardText(post.content);
    return await next();
}