const Koa = require("koa");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const path = require("path");
const config = require("../../config/config");
const middles = require("../middles");
const server = new Koa();

if(config.private) {
  server.use(middles.requirePrivate(config.privateKey));
}

server.use(
  middles.handleErrors(`${new Date(Date.now())} Site server error `,
    config.enableLogging && config.logInternalErrors ? config.site.log : null,
    config.consoleErrors ? true : false
  )
);

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