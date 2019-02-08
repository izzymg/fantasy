const redis = require("../../database/redis");
const uuid = require("uuid/v4");
const database = require("../../database/database");
const bcrypt = require("bcrypt");
const functions = require("./functions");

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
            return ctx.throw(500, error);
        }
        if (authenticated) {
            const sessionId = uuid();
            await redis.hashSet(sessionId, { username: fields.username, role: user.role || "" }, 60 * 60);
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
                    return ctx.throw(500, error);
                }
                if (userSession && userSession.role && userSession.role === role) {
                    return next();
                }
            }
        }
        return ctx.throw(403, "You don't have permission to perform that action");
    };
};