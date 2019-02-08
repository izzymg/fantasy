const functions = require("./functions");

exports.deletePost = async ctx => {
    const post = Number(ctx.params.post);
    if (!post) {
        return ctx.throw(403, "Expected post to delete");
    }
    if (ctx.state.session && ctx.state.session.role && ctx.state.session.role == "admin") {
        const { deletedFiles, deletedPosts } = await functions.deletePostAndReplies(
            post,
            ctx.state.board.url
        );
        return (ctx.body = `Deleted ${deletedPosts} ${
            deletedPosts == 1 ? "post" : "posts"
        } and ${deletedFiles} ${deletedFiles === 1 ? "file" : "files."}`);
    }
    return ctx.throw(403, "You don't have permission to do that");
};
