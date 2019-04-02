// Generic route middleware

const models = require("../models");
module.exports = {
  requireBoardModerator(boardUid) {
    return async function(ctx, next) {
      const session = await models.session.get(ctx.cookies.get("id"));
      if(session) {
        const canModerate = await models.user.canModerateBoard(boardUid, session.username);
        if(canModerate === true) {
          ctx.state.session = session;
          return await next();
        }
      }
      ctx.throw(403, "You don't have permission to do that");
    };
  },
  requireLogin() {
    return async function(ctx, next) {
      const session = await models.session.get(ctx.cookies.get("id"));
      if(session && session.username) {
        ctx.state.session = session;
        return await next();
      }
      ctx.throw(403, "You don't have permission to do that");
    };
  },
  requireAdmin() {
    return async function(ctx, next) {
      const session = await models.session.get(ctx.cookies.get("id"));
      if(session) {
        const isAdmin = await models.user.isAdmin(session.username);
        if(isAdmin === true) {
          ctx.state.session = session;
          return await next();
        }
      }
      ctx.throw(403, "You don't have permission to do that");
    };
  },
};