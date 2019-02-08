const redis = require("../../database/redis");
const uuid = require("uuid/v4");
const database = require("../../database/database");
const bcrypt = require("bcrypt");
const functions = require("./functions");

exports.createCooldown = async (ctx, next) => {
    try {
        await redis.set(ctx.ip, "cd", ctx.state.board.cooldown);
    } catch (error) {
        ctx.throw(500, new Error(error));
    }
    return next();
};

exports.checkCooldown = async (ctx, next) => {
    let cd;
    try {
        cd = await redis.get(ctx.ip);
    } catch (error) {
        return ctx.throw(500, new Error(error));
    }
    if (!cd) {
        return next();
    }
    return ctx.body = `You need to wait ${ctx.state.board.cooldown} seconds between posts`;
};

exports.login = async ctx => {

    let fields;
    try {
        fields = await functions.getForm(ctx);
    } catch (error) {
        if (error.status && error.status === 400) {
            return ctx.throw(400, error.text);
        }
        return ctx.throw(500, error);
    }

    if (!fields.username) {
        return ctx.throw(400, "Expected username");
    }
    if (!fields.password) {
        return ctx.throw(400, "Expected password");
    }

    let user;

    try {
        user = await database.fetch("SELECT password, role FROM users WHERE username = ?", fields.username);
    } catch (error) {
        return ctx.throw(500, error);
    }
    if (user) {
        let authenticated = false;
        try {
            authenticated = await bcrypt.compare(fields.password, user.password);
        } catch (error) {
            return ctx.throw(500, new Error(error));
        }
        if (authenticated) {
            const sessionId = uuid();
            try {
                await redis.hashSet(sessionId, { username: fields.username, role: user.role || "" }, 60 * 60);
            } catch (error) {
                return ctx.throw(500, new Error(error));
            }
            ctx.set("set-cookie", `id=${sessionId}`);
            return ctx.body = "Login successful, authenticated";
        }
    }
    return ctx.throw(401, "Incorrect username or password");
};

exports.requireRole = function (role) {
    return async (ctx, next) => {
        if (ctx.cookies) {
            const sessionId = ctx.cookies.get("id");
            if (sessionId) {
                let userSession;
                try {
                    userSession = await redis.hashGet(sessionId);
                } catch (error) {
                    return ctx.throw(500, new Error(error));
                }
                if (userSession && userSession.role && userSession.role === role) {
                    return next();
                }
            }
        }
        return ctx.throw(403, "You don't have permission to perform that action");
    };
};