const coBody = require("co-body");
const libs = require("../common/libs");
const REQUIRED_MESSAGE = "Reason for ban required";

async function create(ctx) {
  const fields = await coBody.json(ctx, { strict: true, });
  ctx.assert(fields, 400, REQUIRED_MESSAGE);
  const hours = Number(fields.hours) || 0;
  const days = Number(fields.days) || 0;
  const reason = libs.validation.sanitize(fields.reason);
  ctx.assert(reason, 400, REQUIRED_MESSAGE);
  let expires = null;
  if(hours || days) {
    const currentTime = Date.now();
    expires = new Date(currentTime + (hours * 60 * 60 * 1000) + (days * 24 * 60 * 60 * 1000));
    ctx.assert(expires > currentTime, 400, "Ban expires in the past");
  }
  return {
    reason,
    expires,
    allBoards: Boolean(fields.allBoards),
    ip: ctx.ip,
    
  };
}

module.exports = {
  create,
};