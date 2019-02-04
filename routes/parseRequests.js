// Request parser middleware

const postsConfig = require("../config/posts");
const multipart = require("../libs/multipart");

function fieldCheck(str, max, name) {
    if (!str) {
        return null;
    }
    if (typeof str !== "string") {
        return `${name}: expected string.`;
    }
    if (str.length > max) {
        return `${name} must be under ${max} characters.`;
    }
    return null;
}

exports.parsePost = async (ctx, next) => {
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
                content: data.fields.content
            }
        };
        let lengthErr;
        lengthErr = fieldCheck(post.post.name, postsConfig.maxNameLength, "Name") || lengthErr;
        lengthErr = fieldCheck(post.post.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
        lengthErr = fieldCheck(post.post.content, postsConfig.maxContentLength, "Content") || lengthErr;
        if (lengthErr) {
            return ctx.throw(400, lengthErr);
        }
        ctx.state.post = post;
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
                return ctx.throw(500, new Error(error));
        }
    }
    return await next();
};