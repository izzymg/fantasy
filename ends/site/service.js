const Koa = require("koa");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const path = require("path");
const config = require("../../config/config");
const gMiddleware = require("../gMiddleware");
const server = new Koa();

if(config.private) {
    server.use(gMiddleware.requirePrivate(config.privateKey));
}

const baseRouter = require("./routes/base");

// Views
server.use(
    koaViews(path.join(__dirname, "templates"), {
        extension: "pug",
        options: { cache: true },
    })
);

// Server static files (JS/CSS/Media)
server.use(koaStatic(path.join(__dirname, "static/dist")));

// Router
server.use(baseRouter.routes());
module.exports = server;