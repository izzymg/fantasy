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
      if(!fields.content || (!files || files.length < 0)) {
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
  files.forEach((file) => file.originalName = libs.validation.sanitize(file.originalName));
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

module.exports = {
  post
};