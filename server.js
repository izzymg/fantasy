const Koa = require("koa");
const koaStatic = require("koa-static");
const koaEjs = require("koa-ejs");
const serverConfig = require("./config/server");

const path = require("path");

const http = require("http");
const https = require("https");

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

server.use(async ctx => {
    await ctx.render("home", {text: "h"});
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