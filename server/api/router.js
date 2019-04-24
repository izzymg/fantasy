const KoaRouter = require("koa-router");
const routes = require("./routes");

// TODO: Clean this up
const router = new KoaRouter();
router.use(routes.auth);
router.use(routes.bans);
router.use(routes.boards);
router.use(routes.users);
router.use(routes.posts);
router.use(routes.reports);

module.exports = router.routes();