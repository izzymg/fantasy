const Users = require("../db/Users");

module.exports = {
  requireModOfBoard(board) {
    return async function(ctx, next) {
      const user = await Users.getUser(ctx.session.username);
      const authorized = await Users.canUserModerate(ctx.session.username, board);
      ctx.assert(user && authorized > 0, 403, "You don't have permission to do that");
      ctx.state.authLevel = authorized;
      return await next();
    };
  },
};