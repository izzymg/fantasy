exports.render = async ctx => {
    try {
        await ctx.render("home");
    } catch (error) {
        return ctx.throw(500, error);
    }
};