const Koa = require("koa");
const koaStatic = require("koa-static");
const serverConfig = require("./config/server");

const path = require("path");

const http = require("http");
const https = require("https");

const logger = require("./libs/logger");
const mainRouter = require("./routes/main.router");

const server = new Koa();

const views = require("koa-views");

const db = require("./database/database");

db.open();

// Views
server.use(views(path.join(__dirname, "templates"), { extension: "pug" }));

// Server static files (JS/CSS/Media)
server.use(koaStatic(path.join(__dirname, "static/dist")));

server.use(async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        ctx.status = error.status || 500;
        if (ctx.status == 500) {
            ctx.body = "Internal server error";
            ctx.app.emit("error", error, ctx);
        } else {
            ctx.body = error.message;
        }
    }
});

server.use(mainRouter.routes());

server.on("error", error => {
    if (serverConfig.consoleErrors) { console.error(`ZThree: ${error}`); }
    logger.logOut(error, serverConfig.log);
});


http.createServer(server.callback()).listen(serverConfig.port, serverConfig.host, () => {
    console.log(`HTTP Listening ${serverConfig.host}:${serverConfig.port}`);
});
if (serverConfig.https) {
    https.createServer(server.callback()).listen(serverConfig.httpsPort, serverConfig.host, () => {
        console.log(`HTTPS Listening ${serverConfig.host}:${serverConfig.httpsPort}`);
    });
}

function onExit(sig) {
    console.log(`Received ${sig}, exiting`);
    db.close();
}

process.on("SIGINT", onExit);
process.on("SIGTERM", onExit);