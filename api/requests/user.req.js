const coBody = require("co-body");
const REQUIRED_MESSAGE = "Username required";

async function create(ctx) {
  const fields = await coBody.json(ctx, { strict: true });
  ctx.assert(fields && typeof fields.username === "string", 400, REQUIRED_MESSAGE);
  fields.username = fields.username.trim();
  // Trim and check again
  ctx.assert(fields.username, 400, REQUIRED_MESSAGE);
  ctx.assert(fields.username.length < 15, 400, "Username can't be over 15 characters");
  ctx.assert(
    !/[^a-zA-Z0-9_]+/g.test(fields.username),
    400, "Username may only contain letters, numbers or underscores"
  );
  return {
    username: fields.username,
    isAdmin: Boolean(fields.isAdmin === true),
  };
}

module.exports = {
  create,
};