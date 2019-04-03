const config = require("../../config/config");
const libs = require("../../libs");

function validationError(message) {
  throw { status: 400, message };
}

function post(fields, files = [], isThread = false) {
  // Check field existence
  if(!fields) validationError("Got no fields");
  if(isThread) {
    if(config.posts.threads.requireContent) {
      if(!fields.content) validationError("Threads must have content");
    }
    if(config.posts.threads.requireSubject) {
      if(!fields.subject) validationError("Threads must have a subject");
    }
    if(config.posts.threads.requireFiles) {
      if(!files || files.length < 1) validationError("Threads must have files");
    }
  } else {
    if(config.posts.replies.requireContentOrFiles) {
      if(!fields.content && (!files || files.length < 0)) {
        validationError("Replies must have content or files");
      }
    }
    // Replies shouldn't have a subject
    fields.subject = null;
  }

  // Length check before processing
  let lengthError;
  libs.validation.lengthCheck(fields.name, config.posts.maxNameLength, "Name");
  libs.validation.lengthCheck(fields.subject, config.posts.maxSubjectLength, "Subject");
  libs.validation.lengthCheck(fields.content, config.posts.maxContentLength, "Content");
  if(lengthError) validationError(lengthError);

  // Sanitize, format
  if(files) {
    files.forEach((file) => file.originalName = libs.validation.sanitize(file.originalName));
  }
  const name = libs.validation.formatNameContent(
    libs.validation.sanitize(fields.name),
    config.posts.tripAlgorithm, config.posts.tripSalt
  ) || config.posts.defaultName || "Anonymous";
  const subject = libs.validation.sanitize(fields.subject);
  const content = libs.validation.formatPostContent(libs.validation.sanitize(fields.content));

  return {
    name, subject, content, files
  };
}

function login(fields) {
  const requiredMessage = "Username and password required";
  if(!fields) validationError(requiredMessage);
  if(!fields.username || !fields.password) validationError(requiredMessage);
  return {
    username: fields.username,
    password: fields.password,
  };
}

function passwordChange(fields) {
  if(!fields) {
    validationError("New password, confirmation password and current password required");
  }

  if(!fields.newPassword || typeof fields.newPassword !== "string") {
    validationError("New password required");
  }
  if(!fields.confirmationPassword || typeof fields.confirmationPassword !== "string") {
    validationError("Confirmation password required");
  }
  if(!fields.currentPassword || typeof fields.currentPassword !== "string") {
    validationError("Current password required");
  }
  if(fields.newPassword.length < 8) {
    validationError("Passwords must be over 8 characters");
  }
  if(fields.newPassword !== fields.confirmationPassword) {
    validationError("New password and confirmation do not match");
  }
  return {
    newPassword: fields.newPassword,
    confirmationPassword: fields.confirmationPassword,
    currentPassword: fields.currentPassword,
  };
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

module.exports = {
  post,
  login,
  passwordChange,
  createUser,
};