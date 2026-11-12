const jwt = require("jsonwebtoken");

function validShopFromDestination(destination) {
  if (typeof destination !== "string") return undefined;
  try {
    const hostname = new URL(destination).hostname.toLowerCase();
    return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(hostname) ? hostname : undefined;
  } catch { return undefined; }
}

module.exports = {
  validShopFromDestination,
  getShopAccessToken: async function (shop, ctx, activeShops) {
    const accessToken = activeShops.get(shop);
    if (!accessToken) { ctx.status = 401; return undefined; }
    return accessToken;
  },
  getShop: function (ctx) {
    const authorization = ctx.get("Authorization");
    if (!authorization.startsWith("Bearer ")) return undefined;
    const token = jwt.decode(authorization.slice(7));
    return validShopFromDestination(token?.dest);
  },
};
