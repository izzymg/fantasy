const Router = require("koa-router");
const router = new Router();

const home = require("./controllers/home");
const boards = require("./controllers/boards");
const notfound = require("./controllers/notfound");

// Render home
router.get("/", home.render);
router.get("/boards", boards.render);
router.get("*", notfound.render);

module.exports = router;