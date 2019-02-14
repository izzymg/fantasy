console.log("ZThree starting, press CTRL-C/sigint/sigterm to exit");

const config = require("./config/config");

const http = require("http");
const https = require("https");

const db = require("./database/database");
const redis = require("./database/redis");

const apiService = require("./ends/api/service");
const siteService = require("./ends/site/service");
const fileService = require("./ends/files/service");

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
