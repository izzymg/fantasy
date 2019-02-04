console.log("ZThree starting, press CTRL-C/sigint/sigterm to exit");

const Koa = require("koa");
const koaStatic = require("koa-static");
const koaViews = require("koa-views");
const mainRouter = require("./routes/main.router");
const serverConfig = require("./config/server");

const path = require("path");
const http = require("http");
const https = require("https");
const logger = require("./libs/logger");

const db = require("./database/database");
const server = new Koa();

db.open().then(settings => {
    console.log(`Starting SQL connection on ${settings.host}:${settings.port}`);
    init();
}).catch(e => {
    console.error("Error initialising db connection", e);
});

function init() {

    // Views
    server.use(koaViews(path.join(__dirname, "templates"), { extension: "pug", options: { cache: process.env.NODE_ENV === "production" } }));

    // Server static files (JS/CSS/Media)
    server.use(koaStatic(path.join(__dirname, "static/dist")));

    // Securely handle and log 500 errors
    server.use(async (ctx, next) => {
        ctx.state.webname = serverConfig.webname;
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

    server.on("error", error => {
        if (serverConfig.consoleErrors) { console.error(`ZThree: ${error}`); console.trace(error); }
        logger.logOut(error, serverConfig.log);
    });

    // Routes setup
    mainRouter.setup().then(() => {
        console.log("Routes setup");
    }).catch(e => console.error(`${e}\n\tThe above error prevented setting up server routes. Check your database connectivity and credentials.`));
    server.use(mainRouter.routes);

    // Create server
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
        process.exit(0);
    }

    process.on("SIGINT", onExit);
    process.on("SIGTERM", onExit);
}