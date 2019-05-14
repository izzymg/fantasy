// Request processing

const board = require("./board.req");
const post = require("./post.req");
const auth = require("./auth.req");
const user = require("./user.req");
const ban = require("./ban.req");

module.exports = {
  board,
  post,
  auth,
  user,
  ban,
};