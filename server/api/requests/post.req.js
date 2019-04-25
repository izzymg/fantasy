const libs = require("../libs");
const config = require("../../config/config");

const libMultipart = libs.multipart({
  checkMimetype: true,
  maxFileSize: config.posts.maxFileSize,
  maxFiles: config.posts.maxFiles,
  md5: config.posts.md5,
  tempDirectory: config.posts.tmpDir,
});

async function create(ctx, parent) {

  const { fields, files, } = await libMultipart(ctx.req);

  // Check field existence
  if(!fields) ctx.throw(400, "Got no fields");
  if(parent == 0) {
    if(config.posts.threads.requireContent) {
      if(!fields.content) ctx.throw(400, "Threads must have content");
    }
    if(config.posts.threads.requireSubject) {
      if(!fields.subject) ctx.throw(400, "Threads must have a subject");
    }
    if(config.posts.threads.requireFiles) {
      if(!files || files.length < 1) ctx.throw(400, "Threads must have files");
    }
  } else {
    if(config.posts.replies.requireContentOrFiles) {
      if(!fields.content && (!files || files.length < 0)) {
        ctx.throw(400, "Replies must have content or files");
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
  if(lengthError) ctx.throw(400, lengthError);

  // Sanitize and format
  if(files) {
    files.forEach((file) => {
      // Truncate filenames
      file.info.originalName = file.info.originalName.substr(0, 100);
      file.info.originalName = libs.validation.sanitize(file.info.originalName);
    });
  }
  const name = libs.validation.formatNameContent(
    libs.validation.sanitize(fields.name),
    config.posts.tripAlgorithm, config.posts.tripSalt
  ) || config.posts.defaultName || "Anonymous";
  const subject = libs.validation.sanitize(fields.subject);
  const content = libs.validation.formatPostContent(libs.validation.sanitize(fields.content));
  const lastBump = parent == 0 ? new Date(Date.now()) : null;
  const ip = ctx.ip;

  return { post: { name, subject, content, parent, lastBump, ip, }, files, };
}

module.exports = {
  create,
};