const Koa = require("koa");
const Router = require("koa-router");
const server = new Koa();

const router = new Router();
const middleware = require("./middleware");
const persistence = require("../persistence");

router.get("/", async ctx => {
    const boards = await persistence.getBoards();
    if(!boards) {
        return ctx.body = { };
    }
    ctx.body = { boards };
});

router.get("/:board", async ctx => {
    const board = await persistence.getBoard(ctx.params.board);
    if(!board) return ctx.throw(404);
    ctx.body = { board };
});

router.get("/:board/threads", async ctx => {
    const threads = await persistence.getThreads(ctx.params.board);
    if(!threads) {
        return ctx.body = { };
    }
    ctx.body = { threads };
});

router.get("/:board/:thread", async ctx => {
    const [thread, replies] = await Promise.all([
        persistence.getThread(ctx.params.board, ctx.params.thread),
        persistence.getReplies(ctx.params.board, ctx.params.thread)
    ]);
    if(!thread) return ctx.throw(404);
    ctx.body = { thread, replies };
});

// Submit new thread to board
router.post("/:board", middleware.getMultipart, async ctx => {
    const board = await persistence.getBoard(ctx.params.board);
    if(!board) {
        return ctx.throw(404);
    }

    await persistence.submitPost();
});

server.use(router.routes());
server.use(router.allowedMethods());

module.exports = server;