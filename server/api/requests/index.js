// Request processing

const post = require("./post.req");
const auth = require("./auth.req");
const user = require("./user.req");
const ban = require("./ban.req");

module.exports = {
  post,
  auth,
  user,
  ban,
};