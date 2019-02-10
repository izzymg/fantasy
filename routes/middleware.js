const multipart = require("../libs/multipart");
const { trimEscapeHtml } = require("../libs/textFunctions");
const parse = require("co-body");
const postsConfig = require("../config/posts");
const redis = require ("../database/redis");
const functions = require("./functions");

exports.getBoard = async (ctx, next) => {
    const board = await functions.getBoard(ctx.params.board);
    if (!board) {
        return ctx.throw(404);
    }
    ctx.state.board = board;
    return await next();
};

exports.getSession = async (ctx, next) => {
    if (ctx.cookies) {
        const sessionId = ctx.cookies.get("id");
        if (sessionId) {
            const username = await redis.hGet(sessionId, "username");
            const role = await redis.hGet(sessionId, "role");
            if (username && role) {
                ctx.state.session = {
                    id: sessionId,
                    username,
                    role,
                };
                return next();
            }
        }
    }
    return next();
};

exports.requireModOrAdmin = async (ctx, next) => {
    if(ctx.state.session) {
        const authorized = await functions.canModOrAdmin(
            ctx.state.session.username, ctx.state.board.url
        );
        if(authorized) {
            return next();
        }
    }
    return ctx.throw(403, "You don't have permission to do that");
};

exports.createCooldown = async (ctx, next) => {
    await redis.hSet(ctx.ip, "cooldown", Date.now() + ctx.state.board.cooldown * 1000);
    await redis.expire(ctx.ip, 24 * 60 * 60);
    return next();
};

exports.checkCooldown = async (ctx, next) => {
    const cd = await redis.hGet(ctx.ip, "cooldown");
    let now = Date.now();
    if (cd && cd < now) {
        await redis.hDel(ctx.ip, "cooldown");
    } else if (cd) {
        return (ctx.body = `You need to wait ${Math.floor(
            (cd - now) / 1000
        )} seconds before posting again`);
    }
    return next();
};


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
            postsConfig.maxFileSize,
            postsConfig.maxFiles,
            postsConfig.tmpDir,
            postsConfig.md5
        );
    } catch (error) {
        switch (error) {
            case "UNACCEPTED_MIMETYPE":
                return ctx.throw (400, "Unsupported file format");
            case "FILE_SIZE_LIMIT":
                return ctx.throw(400, `Files must be under ${
                    Math.floor(postsConfig.maxFileSize / 1000)
                }kb`);
            case "FILES_LIMIT":
                return ctx.throw(400, `You may not send more than ${postsConfig.maxFiles} files`);
            case "FIELDS_LIMIT":
                return ctx.throw(400, "Too many text fields");
            default:
                return ctx.throw(500, new Error(error));
        }
    }

    if (data.fields) {
        for (const field in data.fields) {
            data.fields[field] = trimEscapeHtml(data.fields[field]);
        }
    }

    if (data.files) {
        for (const file of data.files) {
            file.originalName = trimEscapeHtml(file.originalName);
        }
    }
    ctx.fields = data.fields;
    ctx.files = data.files;
    return await next();
};