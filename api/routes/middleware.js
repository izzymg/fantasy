const usersDb = require("../../db/users");
const sessionsDb = require("../../db/sessions");
module.exports = {
  requireModOfBoard(board) {
    return async function(ctx, next) {
      const session = await sessionsDb.getSession(ctx.cookies.get("id"));
      if(session) {
        const [user, authorized] = await Promise.all([
          usersDb.getUser(session.username),
          usersDb.canUserModerate(session.username, board)
        ]);
        if(authorized > 0 && user) {
          return await next();
        }
      }
      ctx.throw(403, "You don't have permission to do that.");
    };
  },
};