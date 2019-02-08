const redis = require("../../database/redis");
const uuid = require("uuid/v4");
const database = require("../../database/database");
const bcrypt = require("bcrypt");
const functions = require("./functions");

exports.createCooldown = async (ctx, next) => {
    try {
        await redis.hSet(ctx.ip, "cooldown", Date.now() + (ctx.state.board.cooldown * 1000));
        await redis.expire(ctx.ip, 24 * 60 * 60);
    } catch (error) {
        ctx.throw(500, new Error(error));
    }
    return next();
};

exports.checkCooldown = async (ctx, next) => {
    let cd;
    try {
        cd = await redis.hGet(ctx.ip, "cooldown");
    } catch (error) {
        return ctx.throw(500, new Error(error));
    }
    let now = Date.now();
    if (cd && cd < now) {
        await redis.hDel(ctx.ip, "cooldown");
    } else if (cd) {
        return ctx.body = `You need to wait ${Math.floor((cd - now) / 1000)} seconds before posting again`;
    }
    return next();
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
                await Promise.all([
                    redis.hSet(sessionId, "username", fields.username),
                    redis.hSet(sessionId, "role", user.role),
                    redis.expire(sessionId, 60 * 60)]
                );
            } catch (error) {
                return ctx.throw(500, new Error(error));
            }
            ctx.set("set-cookie", `id=${sessionId}`);
            return ctx.body = "Login successful, authenticated";
        }
    }
    return ctx.throw(401, "Incorrect username or password");
};

exports.logout = async ctx => {
    if (ctx.cookies) {
        const sessionId = ctx.cookies.get("id");
        if (sessionId) {
            try {
                await redis.hDel(sessionId);
                return ctx.body = "Logged out";
            } catch (error) {
                return ctx.throw(500, error);
            }
        }
    }
    return ctx.body = "You weren't logged in";
};

exports.checkSession = async (ctx, next) => {
    if (ctx.cookies) {
        const sessionId = ctx.cookies.get("id");
        if (sessionId) {
            let username, role;
            try {
                username = await redis.hGet(sessionId, "username");
                role = await redis.hGet(sessionId, "role");
            } catch (error) {
                return ctx.throw(500, new Error(error));
            }
            if (username && role) {
                ctx.state.session = {
                    username,
                    role
                };
                return next();
            }
        }
    }
    return next();
};

exports.render = async ctx => await ctx.render("login");