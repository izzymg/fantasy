const coBody = require("co-body");
const requiredMessage = "Username and password required";

async function loginRequest(ctx) {
  const fields = await coBody.json(ctx, { strict: true });
  ctx.assert(fields && fields.username && fields.password, 400, requiredMessage);
  return {
    username: fields.username,
    password: fields.password,
  };
}

async function passwordChange(ctx) {
  const fields = await coBody.json(ctx, { strict: true });

  ctx.assert(fields, 400, "New password, confirmation password and current password required");

  ctx.assert(
    fields.newPassword && typeof fields.newPassword === "string",
    400, "New password required"
  );
  ctx.assert(
    fields.confirmationPassword && typeof fields.confirmationPassword === "string",
    400, "Confirmation password required"
  );
  ctx.assert(
    fields.currentPassword && typeof fields.currentPassword === "string",
    400, "Current password required"
  );
  ctx.assert(fields.newPassword.length >= 8, 400, "Passwords must be 8 or more characters");
  ctx.assert(
    fields.newPassword === fields.confirmationPassword,
    400, "New password and confirmation do not match"
  );
  return {
    newPassword: fields.newPassword,
    confirmationPassword: fields.confirmationPassword,
    currentPassword: fields.currentPassword,
  };
}

module.exports = {
  loginRequest,
  passwordChange
};