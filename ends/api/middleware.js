// Middleware used by routes to establish data on the request body
const config = require("../../config/config");
const textFunctions = require("../../libs/textFunctions");
const multipart = require("../../libs/multipart");
const parse = require("co-body");

// Incomming JSON and urlencoded form data
exports.getForm = async (ctx, next) =>  {
    if (!ctx.is("application/json") && !ctx.is("application/x-www-form-urlencoded")) {
        return ctx.throw(400, "Expected JSON or x-www-urlencoded form data");
    }
    try {
        ctx.fields = await parse(ctx, { limit: "12kb" });
    } catch (error) {
        if (error.status === 400) {
            return ctx.throw(400, "Received invalid data");
        }
        return ctx.throw(500, new Error(error));
    }
    return next();
};

// Strips files and fields off of multipart requests
exports.getMultipart = async (ctx, next) =>  {
    if (!ctx.is("multipart/form-data")) {
        return ctx.throw(400, "Expected multipart/form-data");
    }
    let data;
    try {
        data = await multipart(
            ctx,
            config.posts.maxFileSize,
            config.posts.maxFiles,
            config.posts.tmpDir,
            config.posts.md5
        );
    } catch (error) {
        switch (error) {
            case "UNACCEPTED_MIMETYPE":
                return ctx.throw (400, "Unsupported file format");
            case "FILE_SIZE_LIMIT":
                return ctx.throw(400, `Files must be under ${
                    Math.floor(config.posts.maxFileSize / 1000)
                }kb`);
            case "FILES_LIMIT":
                return ctx.throw(400, `You may not send more than ${config.posts.maxFiles} files`);
            case "FIELDS_LIMIT":
                return ctx.throw(400, "Too many text fields");
            default:
                return ctx.throw(500, new Error(error));
        }
    }

    if (data.fields) {
        for (const field in data.fields) {
            data.fields[field] = textFunctions.trimEscapeHtml(data.fields[field]);
        }
    }

    if (data.files) {
        for (const file of data.files) {
            file.originalName = textFunctions.trimEscapeHtml(file.originalName);
        }
    }
    ctx.fields = data.fields;
    ctx.files = data.files;
    return await next();
};