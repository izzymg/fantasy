// Request parser middleware

const postsConfig = require("../config/posts");
const multipart = require("../libs/multipart");

const parseThread = async (ctx, next) => {
    // Only accept multipart/form-data
    if (!ctx.is("multipart/form-data")) {
        return ctx.throw(400, "Expected multipart/form-data");
    }

    try {
        const data = await multipart(ctx, postsConfig.maxFileSize, postsConfig.maxFiles, postsConfig.tmpDir);
        const post = {
            files: data.files,
        }
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

module.exports = {
    parseThread
}