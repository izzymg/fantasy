const posts = require("./posts.route");
const boards = require("./boards.route");
const reports = require("./reports.route");
const bans = require("./bans.route");
const users = require("./users.route");
const auth = require("./auth.route");

const KoaRouter = require("koa-router");

const router = new KoaRouter();
router.use(auth);
router.use(bans);
router.use(boards);
router.use(users);
router.use(posts);
router.use(reports);

module.exports = router.routes();