const Koa = require("koa");
const koaStatic = require("koa-static");
const koaEjs = require("koa-ejs");
const serverConfig = require("./config/server");

const path = require("path");

const http = require("http");
const https = require("https");

const logger = require("./libs/logger");

const server = new Koa();

// Serve templates to view engine
koaEjs(server, {
    root: path.join(__dirname, "templates"),
    viewExt: "html",
    layout: false,
    // Cache if production, debug if development
    cache: (process.env.NODE_ENV === "production"),
    debug: (process.env.NODE_ENV === "development"),
    async: true
});

// Server static files (JS/CSS/Media)
server.use(koaStatic(path.join(__dirname, "static/dist")));

server.use(async (ctx, next) => {
    try {
        await next();
    } catch(error) {
        ctx.status = error.status || 500;
        ctx.body = error.message || "Internal server error";
        if(ctx.status == 500) {
            ctx.app.emit("error", error, ctx);
        }
    }
});

server.on("error", error => {
    if(serverConfig.consoleErrors) { console.error(`ZThree: ${error}`); }
    logger.logOut(error, serverConfig.log);
});

http.createServer(server.callback()).listen(serverConfig.port, serverConfig.host, () => {
    console.log(`HTTP Listening ${serverConfig.host}:${serverConfig.port}`);
});
if(serverConfig.https) {
    https.createServer(server.callback()).listen(serverConfig.httpsPort, serverConfig.host, () => {
        console.log(`HTTPS Listening ${serverConfig.host}:${serverConfig.httpsPort}`);
    });
}

function exit(sig) {
    console.log(`Received ${sig}, exiting`);
}

process.on("SIGINT", exit);
process.on("SIGTERM", exit);