console.log("ZThree starting, press CTRL-C/sigint/sigterm to exit");

const serverConfig = require("./config/config").server;

const http = require("http");
const https = require("https");

const db = require("./database/database");
const redis = require("./database/redis");

const boardsService = require("./ends/boards/service");
const siteService = require("./ends/site/service");

let servers = [];

db.open().then(settings => {
    console.log(`Starting SQL connection on ${settings.host}:${settings.port}`);
    init();
}).catch(e => {
    console.error("Error initialising db connection", e);
});

function init() {
    // Site service
    servers.push(http.createServer(siteService.callback())
        .listen(serverConfig.port, serverConfig.host, () => {
            console.log(`HTTP Listening ${serverConfig.host}:${serverConfig.port}`);
        })
    );
    if (serverConfig.https) {
        servers.push(https.createServer(siteService.callback())
            .listen(serverConfig.httpsPort, serverConfig.host, () => {
                console.log(`HTTPS Listening ${serverConfig.host}:${serverConfig.httpsPort}`);
            })
        );
    }

    servers.push(http.createServer(boardsService.callback()).
        listen(serverConfig.boards.port, serverConfig.boards.host, () => {
            console.log(`HTTP Listening ${serverConfig.boards.host}:${serverConfig.boards.port}`);
        })
    );

    // Boards service
    
    if (serverConfig.boards.https) {
        servers.push(https.createServer(boardsService.callback())
            .listen(serverConfig.boards.httpsPort, serverConfig.boards.host, () => {
                console.log(`HTTPS Listening ${
                    serverConfig.boards.host
                }:${serverConfig.boards.httpsPort}`);
            })
        );
    }

    function onExit(sig) {
        console.log(`Received ${sig}, exiting`);
        servers.forEach(server => server.close());
        db.close();
        redis.close();
        process.exit(0);
    }

    process.on("SIGINT", onExit);
    process.on("SIGTERM", onExit);
}
