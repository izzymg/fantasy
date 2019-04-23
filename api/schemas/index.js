// Request processing

const post = require("./post");
const auth = require("./auth");
const user = require("./user");
const ban = require("./ban");

module.exports = {
  createPostRequest: post.createPostRequest,
  loginRequest: auth.login,
  passwordChange: auth.passwordChange,
  createUser: user.createUser,
  createBan: ban.createBan,
};