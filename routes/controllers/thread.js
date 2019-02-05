const db = require("../../database/database");

exports.render = async (ctx, next) => {
    try {
        return await ctx.render("thread");
    } catch (error) {
        return ctx.throw(500, error);
    }
};