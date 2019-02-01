const Router = require("koa-router");
const router = new Router();

const home = require("./controllers/home");
const boards = require("./controllers/boards");
const catalog = require("./controllers/catalog");
const notfound = require("./controllers/notfound");

router.get("/", home.render);
router.get("/boards", boards.render);
router.get("/boards/:board", catalog.render);
router.get("*", notfound.render);
router.get("/404", notfound.render);

module.exports = router;