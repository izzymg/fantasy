const Koa = require("koa");
const serverConfig = require("./config/server");

const server = new Koa();
server.use(async ctx => {
    ctx.body = "Hello.";
});

if(!serverConfig.https) {
    server.listen(serverConfig.port, serverConfig.host, () => {
        console.log(`Listening ${serverConfig.host}:${serverConfig.port}`);
    });
} else {
    const http = require("http");
    const https = require("https");
    http.createServer(server.callback()).listen(serverConfig.port, serverConfig.host, () => {
        console.log(`HTTP Listening ${serverConfig.host}:${serverConfig.port}`);
    });
    https.createServer(server.callback()).listen(serverConfig.httpsPort, serverConfig.host, () => {
        console.log(`HTTPS Listening ${serverConfig.host}:${serverConfig.httpsPort}`);
    });
}