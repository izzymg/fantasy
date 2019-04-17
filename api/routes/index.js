const posts = require("./posts.route");
const boards = require("./boards.route");
const reports = require("./reports.route");
const bans = require("./bans.route");
const mod = require("./mod.route");
const auth = require("./auth.route");

module.exports = {
  posts,
  boards,
  reports,
  bans,
  mod,
  auth,
};