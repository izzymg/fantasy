const Koa = require("koa");
const Router = require("koa-router");
const server = new Koa();
const { lengthCheck } = require("../../libs/textFunctions");
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
router.post("/:board/:thread?", 
    // Validate and save board and optionally thread being posted to
    async ctx => {
        const board = await persistence.getBoard(ctx.params.board);
        if(!board) {
            return ctx.throw(404);
        }
        if(ctx.params.thread) {
            const thread = await persistence.getThread(ctx.params.thread);
            if(!thread) {
                return ctx.throw(404);
            }
            ctx.state.thread = thread;
        }
        ctx.state.board = board;
    },
    // Grab multipart data off request
    middleware.getMultipart,
    // Submit post and save files
    async ctx => {
        if(!ctx.fields) {
            return ctx.throw(400, "Received no fields");
        }
        const name = ctx.fields.name || "Anonymous";
        const subject = ctx.fields.subject || "";
        const content = ctx.fields.content || "";

        let lengthError = lengthCheck(name);
        lengthError = lengthCheck(subject);
        lengthError = lengthCheck(content);
        if(lengthError) ctx.throw(400, lengthError);

        // Parent = 0 if no thread to reply to - it's a new thread
        const { postUid, postId } = await persistence.submitPost({
            name, subject, content,
            parent: ctx.state.thread ? ctx.state.thread.id : 0
        });
        ctx.body = `Submitted post ${postId}.`;
        if(ctx.files && ctx.files.length > 0) {
            const fileUploads = ctx.files.map(async file => {
                await persistence.saveFile({
                    postUid,
                    id: file.id,
                    tempPath: file.tempPath,
                    originalName: file.originalName,
                    mimetype: file.mimetype,
                    extension: file.extension,
                    size: file.size
                    // Save thumbnail if the mimetype is an image
                }, Boolean(file.mimetype.indexOf("image") == -1));
            });
            await Promise.all(fileUploads);
            ctx.body += ` Uploaded ${fileUploads.length} files`;
        }
    }
);

server.use(router.routes());
server.use(router.allowedMethods());

module.exports = server;