const functions = require("../../site/functions");
const crypto = require("crypto");
const persistence = require("../../persistence");

exports.render = async ctx => {
    if(!ctx.state.session) {
        return ctx.throw(404);
    }
    const isAdmin = await persistence.isUserAdmin(ctx.state.session.username);
    if(isAdmin) {
        ctx.state.admin = true;
        ctx.state.users = await persistence.getUsers();
        ctx.state.boards = await persistence.getBoards();
    } else {
        ctx.state.modOf = await persistence.getUserModeration(ctx.state.session.username);
    }
    return await ctx.render("dashboard");
};

exports.createUser = async ctx => {
    if(!ctx.session) {
        return ctx.throw(404);
    }
    if(!ctx.fields.username || typeof ctx.fields.username !== "string") {
        return ctx.throw(400, "Expected username");
    }
    if(!ctx.fields.role ||
        (ctx.fields.role !== "administrator" && ctx.fields.role !== "moderator")
    ) {
        return ctx.throw(400, "Expected role: 'administrator' or 'moderator'");
    }
    const isAdmin = await functions.isAdmin(ctx.session.username);
    if(!isAdmin) {
        return ctx.throw(403, "You don't have permisson.");
    }
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
    // Ensure password
    const authenticated = await functions.compareUserPassword(
        ctx.state.session.username, ctx.fields.currentPassword
    );
    if(!authenticated) {
        return ctx.throw(401, "Current password is incorrect.");
    }
    await functions.updateUserPassword(ctx.state.session.username, ctx.fields.newPassword);
    return ctx.body = "Updated password";
};

exports.addModerator = async ctx => {
    if(!ctx.state.session) {
        return ctx.throw(404);
    }
    if(!ctx.fields.username || typeof ctx.fields.username !== "string") {
        return ctx.throw(400, "Expected username");
    }
    if(!ctx.fields.board || typeof ctx.fields.board !== "string") {
        return ctx.throw(400, "Expected board");
    }
    // User is admin or can moderate the board they're adding a moderator to
    const authorized = await functions.canModOrAdmin(ctx.state.session.username, ctx.fields.board);
    if(!authorized) {
        return ctx.throw(403, "You don't have permission.");
    }
    try {
        await functions.addMod(ctx.fields.username, ctx.fields.board);
        return ctx.body = 
            `Successfully added ${ctx.fields.username} as a moderator of ${ctx.fields.board}`;
    } catch(error) {
        if(error.errno === 1452) {
            // Ugly fix, mariadb/mysql driver doesn't return which constraint failed
            if(error.sqlMessage.includes("mod_username")) {
                return ctx.throw(400, `User ${ctx.fields.username} does not exist`);
            }
            return ctx.throw(400, `Board ${ctx.fields.board} does not exist.`);
        }
        if(error.code === "ER_DUP_ENTRY") {
            return ctx.throw(400, 
                `Error: User ${ctx.fields.username} is already a moderator of ${ctx.fields.board}`);
        }
        return ctx.throw(500, error);
    }
};