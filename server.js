console.log("ZThree starting, press CTRL-C/sigint/sigterm to exit");

const config = require("./config/config");

const http = require("http");
const https = require("https");

const logger = require("./libs/logger");

const apiService = require("./ends/api/service");
const siteService = require("./ends/site/service");
const fileService = require("./ends/files/service");

const persistence = require("./ends/persistence");

let servers = [];

// Securely handle and log 500 errors
async function errorHandler (ctx, next) {
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
}

async function onFatalError(error) {
    if(error.status !== 500) return;
    if (config.server.consoleErrors) {
        console.error(`ZThree: ${error}`);
        console.trace(error);
    }
    logger.logOut(error, config.server.log);
}

persistence.initialize().then(() => {
    init();
}).catch(e => {
    console.error("Error initialising persistence", e);
});

function init() {
    
    // Site service
    siteService.use(errorHandler);
    siteService.on("error", onFatalError);
    servers.push(http.createServer(siteService.callback())
        .listen(config.server.port, config.server.host, () => {
            console.log(`Site listening ${config.server.host}:${config.server.port}`);
        })
    );
    if (config.server.https) {
        servers.push(https.createServer(siteService.callback())
            .listen(config.server.httpsPort, config.server.host, () => {
                console.log(`Site HTTPS detected: listening ${
                    config.server.host
                }:${config.server.httpsPort}`);
            })
        );
    }

    // API service
    apiService.use(errorHandler);
    apiService.on("error", onFatalError);
    servers.push(http.createServer(apiService.callback()).
        listen(config.api.port, config.api.host, () => {
            console.log(`API listening ${config.api.host}:${config.api.port}`);
        })
    );

    if (config.api.https) {
        servers.push(https.createServer(apiService.callback())
            .listen(config.api.httpsPort, config.api.host, () => {
                console.log(`API HTTPS detected: listening ${
                    config.api.host
                }:${config.api.httpsPort}`);
            })
        );
    }

    // File service
    fileService.use(errorHandler);
    fileService.on("error", onFatalError);
    servers.push(http.createServer(fileService.callback())
        .listen(config.files.port, config.files.host, () => {
            console.log(`File server listening ${
                config.files.host
            }:${config.files.port}`);
        })
    );
    if(config.files.https){
        servers.push(https.createServer(fileService.callback())
            .listen(config.files.httpsPort, config.files.host, () => {
                console.log(`File server HTTPS detected: listening ${
                    config.files.host
                }:${config.files.httpsPort}`);
            })
        );
    }

    async function onExit(sig) {
        console.log(`Received ${sig}, exiting`);
        servers.forEach(server => server.close());
        await persistence.end();
        process.exit(0);
    }

    process.on("SIGINT", onExit);
    process.on("SIGTERM", onExit);
}
