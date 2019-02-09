exports.render = async ctx => {
    if(!ctx.state.session) {
        return ctx.throw(404);
    }
    return await ctx.render("dashboard");
};