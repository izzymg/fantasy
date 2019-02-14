// Unit test for persistence layer

const persistence = require("../ends/persistence");
const assert = require("assert");

let postId;

describe("Persistence functions", function () {
    describe("#getBoards()", function() {
        it("Should return the boards including /dev/ in an array", async function() {
            const boards = await persistence.getBoards();
            assert(boards.length > 0);
            let dev;
            for(const board of boards) {
                assert(board.url);
                if(board.url == "dev") {
                    dev = board.url;
                }
            }
            assert(dev);
        });
    });
    describe("#submitPost()", function () {
        it("Should add a thread to the database with no image on board /dev/", async function () {
            const submission = await persistence.submitPost({
                boardUrl: "dev",
                parent: 0,
                name: "Unit Test",
                subject: "Unit testing",
                content: "Post submitted by mocha test",
            });
            assert(typeof submission.postId === "number");
            postId = submission.postId;
        });
    });
    describe("#getThread()", function() {
        it("Should return the OP data of the thread submitted", async function() {
            const thread = await persistence.getThread("/dev/", postId);
            assert(thread);
            assert(thread.name === "Unit test");
        });
    });
});