const functions = require("../routes/controllers/functions");
const db = require("../database/database");
const assert = require("assert");

describe("hooks", () => {
    before(async () => {
        await db.open();
    });
    after(async () => {
        await db.close();
    });
    describe("Post submission and deletion", () => {
        it("Should create a thread, reply to the thread, delete the thread and reply", async () => {
            const thread = await functions.submitPost({
                boardUrl: "g",
                parent: 0,
                name: "Anonymous",
                subject: "Mocha test thread",
            });
            assert(typeof thread.postId === "number");
            const reply = await functions.submitPost({
                boardUrl: "g",
                parent: thread.postId,
                name: "Anonymous",
                content: "Reply to test thread",
            });
            const { deletedPosts } = await functions.deletePostAndReplies(thread.postId, "g");
            assert(deletedPosts === 2);
        });
    });
});
