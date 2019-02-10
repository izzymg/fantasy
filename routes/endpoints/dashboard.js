const functions = require("../functions");
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
    if(!ctx.fields.username || typeof ctx.fields.username !== "string") {
        return ctx.throw(400, "Expected username");
    }
    if(!ctx.fields.role ||
        (ctx.fields.role !== "administrator" && ctx.fields.role !== "moderator")
    ) {
        return ctx.throw(400, "Expected role: 'administrator' or 'moderator'");
    }
    if (ctx.state.session && ctx.state.session.role && ctx.state.session.role == "administrator") {
        const password = await crypto.randomBytes(4).toString("hex");
        try {
            await functions.createUser(ctx.fields.username, password, ctx.fields.role);
            return ctx.body = `Created user ${
                ctx.fields.username
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
    if(!ctx.fields.currentPassword || typeof ctx.fields.currentPassword !== "string") {
        return ctx.throw(400, "Expected currentPassword");
    }
    if(!ctx.fields.newPassword || typeof ctx.fields.newPassword !== "string") {
        return ctx.throw(400, "Expected newPassword");
    }
    if(!ctx.fields.confirmation || typeof ctx.fields.newPassword !== "string") {
        return ctx.throw(400, "Expected confirmation");
    }
    if(ctx.fields.newPassword.length < 10) {
        return ctx.throw(400, "New password should be at least 10 characters");
    }
    if(ctx.fields.confirmation !== ctx.fields.newPassword) {
        return ctx.throw(400, "New password and confirmation do not match");
    }
    const authenticated = await functions.comparePasswords(
        ctx.state.session.username, ctx.fields.currentPassword
    );
    if(!authenticated) {
        return ctx.throw(401, "Current password is incorrect.");
    }
    await functions.updateUserPassword(ctx.state.session.username, ctx.fields.newPassword);
    return ctx.body = "Updated password";
};