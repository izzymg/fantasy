console.log("ZThree starting, press CTRL-C/sigint/sigterm to exit");

const serverConfig = require("./config/config").server;

const http = require("http");
const https = require("https");

const db = require("./database/database");
const redis = require("./database/redis");

const apiService = require("./ends/api/service");
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
            console.log(`Site listening ${serverConfig.host}:${serverConfig.port}`);
        })
    );
    if (serverConfig.https) {
        servers.push(https.createServer(siteService.callback())
            .listen(serverConfig.httpsPort, serverConfig.host, () => {
                console.log(`Site HTTPS detected: listening ${
                    serverConfig.host
                }:${serverConfig.httpsPort}`);
            })
        );
    }

    servers.push(http.createServer(apiService.callback()).
        listen(serverConfig.boards.port, serverConfig.boards.host, () => {
            console.log(`API listening ${serverConfig.boards.host}:${serverConfig.boards.port}`);
        })
    );

    // Boards service
    
    if (serverConfig.boards.https) {
        servers.push(https.createServer(apiService.callback())
            .listen(serverConfig.boards.httpsPort, serverConfig.boards.host, () => {
                console.log(`API HTTPS detected: listening ${
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
