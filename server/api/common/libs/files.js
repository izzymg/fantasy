const fs = require("fs");
const { promisify, } = require("util");
const unlink = promisify(fs.unlink);

module.exports = { unlink, };