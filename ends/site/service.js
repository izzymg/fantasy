const Koa = require("koa");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const config = require("../../config/config");
const middles = require("../middles");
const path = require("path");
const server = new Koa();

server.proxy = config.proxy;

server.use(
  middles.logRequest(
    config.site.logLevel === null ? false : true, 
    config.site.logLevel === "debug" ? true : false, 
    config.site.log
  )
);

server.use(
  middles.handleErrors(`${new Date(Date.now())} Site server error `,
    config.enableLogging && config.logInternalErrors ? config.site.log : null,
    config.consoleErrors ? true : false
  )
);

const baseRouter = require("./routes/base");

// Views
server.use(
  koaViews(config.staticDir || path.join(__dirname, "../../static/templates"), {
    extension: "pug",
    options: { cache: config.env == "production" ? true: false },
  })
);

// Server static files (JS/CSS/Media)
server.use(koaStatic(config.staticDir || path.join(__dirname, "../../static/dist")));

// Router
server.use(baseRouter.routes());
module.exports = server;