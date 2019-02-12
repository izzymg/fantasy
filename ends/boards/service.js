const Koa = require("koa");
const Router = require("koa-router");
const server = new Koa();

const router = new Router();
const functions = require("./functions");

router.get("/", async ctx => {
    const boards = await functions.getBoards();
    ctx.body = { boards };
});

router.get("/:board", async ctx => {
    const board = await functions.getBoard(ctx.params.board);
    ctx.body = { board };
});

router.get("/:board/threads", async ctx => {
    const threads = await functions.getThreads(ctx.params.board);
    ctx.body = { threads };
});

router.get("/:board/:thread", async ctx => {
    const thread = await functions.getThread(ctx.params.board, ctx.params.thread);
    ctx.body = { thread };
});

router.get("/:board/:thread/replies", async ctx => {
    const replies = await functions.getReplies(ctx.params.board, ctx.params.thread);
    ctx.body = { replies };
});

server.use(router.routes());
server.use(router.allowedMethods());

module.exports = server;