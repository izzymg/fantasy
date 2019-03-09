// Serves static files for dev testing


const config = require("./config/config");
const koaStatic = require("koa-static");
const Koa = require("koa");
const server = new Koa();

if(!process.argv[2]) {
  console.error("Usage: node ./devStatic.js [port]");
  process.exit(1);
}

server.use(koaStatic(config.posts.filesDir));
server.use(koaStatic(__dirname + "/ssr/view/dist"));

server.listen(process.argv[2], function() {
  console.warn("Listening. Never use this in production");
});