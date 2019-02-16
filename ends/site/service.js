const Koa = require("Koa");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const path = require("path");

const server = new Koa();

const baseRouter = require("./routes/base");

// Views
server.use(
    koaViews(path.join(__dirname, "templates"), {
        extension: "pug",
        options: { cache: process.env.NODE_ENV === "production" },
    })
);

// Server static files (JS/CSS/Media)
server.use(koaStatic(path.join(__dirname, "static/dist")));

// Router
server.use(baseRouter.routes());
module.exports = server;