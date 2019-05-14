const coBody = require("co-body");
const libs = require("../libs");
const REQUIRED_MESSAGE = "Expected board uid and title";

async function create(ctx) {
  const fields = await coBody.json(ctx, { strict: true, });
  ctx.assert(fields, 400, REQUIRED_MESSAGE);
  const uid = fields.uid;
  const title = fields.title;
  const createdAt = new Date(Date.now());

  ctx.assert(uid && title, 400, REQUIRED_MESSAGE);
  let lenError = libs.validation.lengthCheck(title, 250, "Board title");
  lenError = libs.validation.lengthCheck(title, 20, "Board UID");
  ctx.assert(!lenError, 400, lenError);

  const board = {
    uid,
    title,
    createdAt,
  };
  if(typeof fields.sfw !== "undefined") {
    board.sfw = fields.sfw;
  }
  if(typeof fields.cooldown !== "undefined") {
    board.cooldown = fields.cooldown;
  }
  if(typeof fields.maxThreads !== "undefined") {
    board.maxThreads = fields.maxThreads;
  }
  if(typeof fields.fileLimit !== "undefined") {
    board.fileLimit = fields.fileLimit;
  }
  if(typeof fields.bumpLimit !== "undefined") {
    board.bumpLimit = fields.bumpLimit;
  }
  if(typeof fields.about !== "undefined") {
    board.about = fields.about;
  }
  return board;
}

module.exports = {
  create,
};