// Request processing

const libs = require("../libs");
const createPostRequest = require("./post");
const auth = require("./auth");

function validationError(message) {
  throw { status: 400, message };
}

function createUser(fields) {
  const requiredMessage = "Username required";
  if(!fields || typeof fields.username !== "string") {
    validationError(requiredMessage);
  }
  if(fields.username.length > 15) {
    validationError("Username can't be over 15 characters");
  }
  fields.username = fields.username.trim();
  if(!fields.username) {
    validationError(requiredMessage);
  }
  if(/[^a-zA-Z0-9_]+/g.test(fields.username)) {
    validationError("Username may only contain letters, numbers or underscores");
  }
  return {
    username: fields.username,
    isAdmin: Boolean(fields.isAdmin === true),
  };
}

function createBan(fields) {
  if(!fields) validationError("Reason for ban required");
  const hours = Number(fields.hours) || 0;
  const days = Number(fields.days) || 0;
  const reason = libs.validation.sanitize(fields.reason);
  if(!reason) {
    validationError("Reason for ban required");
  }
  let expires = null;
  if(hours || days) {
    const currentTime = Date.now();
    expires = new Date(currentTime + (hours * 60 * 60 * 1000) + (days * 24 * 60 * 60 * 1000));
    if(expires < currentTime) {
      validationError("Ban expires in the past");
    }
  }
  return {
    reason,
    expires,
    allBoards: Boolean(fields.allBoards),
  };
}

module.exports = {
  createPostRequest,
  loginRequest: auth.login,
  passwordChange: auth.passwordChange,
  createUser,
  createBan,
};