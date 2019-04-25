// Generic route middleware

const models = require("../models");
module.exports = {
  requireIpCanPost(boardUid) {
    return async function(ctx) {
      // Check user IP cooldown
      const cd = await models.ip.getCooldown(ctx.ip, boardUid);
      ctx.assert(
        !cd || cd < Date.now(), 400,
        `You must wait ${Math.floor((cd - Date.now()) / 1000)} seconds before posting again`
      );

      // Check user ban status
      const ban = await models.ban.getByBoard(ctx.ip, boardUid);
      ctx.assert(!ban || ban.expires && ban.expires < new Date(Date.now()), 403, "You are banned");
      // Ban must have expired
      if(ban) {
        await models.ban.remove(ban.uid);
      }
    };
  },
  requireBoardModerator(boardUid) {
    return async function(ctx) {
      const session = await models.session.get(ctx.cookies.get("id"));
      if(session) {
        const canModerate = await models.user.canModerateBoard(boardUid, session.username);
        if(canModerate === true) {
          ctx.state.session = session;
          return;
        }
      }
      ctx.throw(403, "You don't have permission to do that");
    };
  },
  requireLogin() {
    return async function(ctx) {
      const session = await models.session.get(ctx.cookies.get("id"));
      if(session && session.username) {
        ctx.state.session = session;
        return;
      }
      ctx.throw(403, "You don't have permission to do that");
    };
  },
  requireAdmin() {
    return async function(ctx) {
      const session = await models.session.get(ctx.cookies.get("id"));
      if(session) {
        const isAdmin = await models.user.isAdmin(session.username);
        if(isAdmin === true) {
          ctx.state.session = session;
          return;
        }
      }
      ctx.throw(403, "You don't have permission to do that");
    };
  },
};