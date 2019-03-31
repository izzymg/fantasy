// Generic route middleware

const models = require("../models");

function requireBoardModerator(boardUid) {
  return async function(ctx, next) {
    const session = await models.session.get(ctx.cookies.get("id"));
    if(session) {
      const canModerate = await models.user.canModerateBoard(boardUid, session.username);
      if(canModerate === true) return await next();
    }
    ctx.throw(403, "You don't have permission to do that");
  };
}

module.exports = {
  requireBoardModerator,
};