const functions = require("./functions");
const crypto = require("crypto");

exports.render = async ctx => {
    if(!ctx.state.session) {
        return ctx.throw(404);
    }
    if(ctx.state.session.role === "administrator") {
        const users = await functions.getUsers();
        return await ctx.render("dashboard", { users });
    }
    return await ctx.render("dashboard");
};

exports.createUser = async ctx => {
    let fields;
    try {
        fields = await functions.getForm(ctx);
    } catch (error) {
        if (error.status && error.status === 400) {
            return ctx.throw(400, error.text);
        }
        return ctx.throw(500, error);
    }
    if(!fields.username || typeof fields.username !== "string") {
        return ctx.throw(400, "Expected username");
    }
    if(!fields.role || (fields.role !== "administrator" && fields.role !== "moderator")) {
        return ctx.throw(400, "Expected role: 'administrator' or 'moderator'");
    }
    if (ctx.state.session && ctx.state.session.role && ctx.state.session.role == "administrator") {
        const password = await crypto.randomBytes(4).toString("hex");
        try {
            await functions.createUser(fields.username, password, fields.role);
            return ctx.body = `Created user ${
                fields.username
            }. Send them this password: ${
                password
            } and instruct them to change their password from their dashboard.`;
        } catch(error) {
            if(error.code === "ER_DUP_ENTRY") {
                return ctx.throw(400, "A user with that name already exists.");
            }
            return ctx.throw(500, error);
        }
    }
};

exports.changePassword = async ctx => {
    if(!ctx.state.session) {
        return ctx.throw(404);
    }
    let fields;
    try {
        fields = await functions.getForm(ctx);
    } catch (error) {
        if (error.status && error.status === 400) {
            return ctx.throw(400, error.text);
        }
        return ctx.throw(500, error);
    }
    if(!fields.currentPassword || typeof fields.currentPassword !== "string") {
        return ctx.throw(400, "Expected currentPassword");
    }
    if(!fields.newPassword || typeof fields.newPassword !== "string") {
        return ctx.throw(400, "Expected newPassword");
    }
    if(!fields.confirmation || typeof fields.newPassword !== "string") {
        return ctx.throw(400, "Expected confirmation");
    }
    if(fields.newPassword.length < 10) {
        return ctx.throw(400, "New password should be at least 10 characters");
    }
    if(fields.confirmation !== fields.newPassword) {
        return ctx.throw(400, "New password and confirmation do not match");
    }
    const password = await functions.getUserPassword(ctx.state.session.username);
    if(!password) {
        return ctx.throw(404);
    }
    const authenticated = await functions.comparePasswords(fields.currentPassword, password);
    if(!authenticated) {
        return ctx.throw(401, "Current password is incorrect.");
    }
    await functions.updateUserPassword(ctx.state.session.username, fields.newPassword);
    return ctx.body = "Updated password";
};