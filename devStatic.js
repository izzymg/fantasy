// Serves static files for dev testing

const path = require("path");
const koaStatic = require("koa-static");
const Koa = require("koa");
const server = new Koa();

const host = process.argv[2];
const port = process.argv[3];
const dir = process.argv[4];

if(!port || !path || !host) {
  console.error("Usage: node ./devStatic.js [host] [port] [dir]");
  process.exit(1);
}

server.use(koaStatic(path.normalize(dir)));

server.listen(port, host, function() {
  console.warn(`Serving ${dir} on ${host}:${port}. Never use this in production`);
});