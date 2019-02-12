const Koa = require("koa");
const Router = require("koa-router");
const server = new Koa();

const router = new Router();
const functions = require("./functions");

router.get("/", async ctx => {
    const boards = await functions.getBoards();
    if(!boards) {
        return ctx.body = { };
    }
    ctx.body = { boards };
});

router.get("/:board", async ctx => {
    const board = await functions.getBoard(ctx.params.board);
    if(!board) return ctx.throw(404);
    ctx.body = { board };
});

router.get("/:board/threads", async ctx => {
    const threads = await functions.getThreads(ctx.params.board);
    if(!threads) {
        return ctx.body = { };
    }
    ctx.body = { threads };
});

router.get("/:board/:thread", async ctx => {
    const [thread, replies] = await Promise.all([
        functions.getThread(ctx.params.board, ctx.params.thread),
        functions.getReplies(ctx.params.board, ctx.params.thread)
    ]);
    if(!thread) return ctx.throw(404);
    ctx.body = { thread, replies };
});

server.use(router.routes());
server.use(router.allowedMethods());

module.exports = server;