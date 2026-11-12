
const jwt = require("jsonwebtoken");

module.exports = {
  getShopAccessToken: async function (shop, ctx, ACTIVE_SHOPIFY_SHOPS) {
    let accessToken = ACTIVE_SHOPIFY_SHOPS[shop];
    // Implement cache here
    // if (!accessToken) {
    //   accessToken = await getAccessToken(shop, cache);
    // }
    if (!accessToken) {
      ctx.redirect(`/auth?shop=${shop}`);
      return;
    }
    else {
      return accessToken;
    }
  },

  getShop: function (ctx) {
    const bearer = ctx.request && ctx.request.header ? ctx.request.header.authorization : undefined;
    if (bearer) {
      const token = bearer.split(" ")[1];
      if (token) {
        const decoded = jwt.decode(token);
        if (decoded && decoded.dest) {
          const shop = new URL(decoded.dest).host;
          return shop;
        }
      }
    }
    return undefined;
  }
}