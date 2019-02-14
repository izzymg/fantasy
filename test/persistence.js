// Unit test for persistence layer

const persistence = require("../ends/persistence");
const assert = require("assert");
const crypto = require("crypto");
const config = require("../config/config");
const { statSync } = require("fs");
const path = require("path");

let postId;
let postUid;

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
            assert(submission && typeof submission.postId === "number");
            postId = submission.postId;
            postUid = submission.postUid;
        });
    });
    describe("#saveFile()", function() {
        it("Should save a file with the post ID of the test thread attached", async function () {
            const id = crypto.randomBytes(4).toString("hex");
            await persistence.saveFile({
                postUid,
                id,
                extension: "png",
                mimetype: "image/png",
                size: 1330,
                originalName: "testfile.png",
                tempPath: __dirname + "/testfile.png"
            }, true, true);
            assert(statSync(path.join(config.posts.filesDir, id + ".png")));
        });
    });
    describe("#getThread()", function() {
        it("Should return the OP data of the thread submitted", async function() {
            const thread = await persistence.getThread("dev", postId);
            assert(thread);
            assert(thread.name === "Unit Test");
        });
    });
});