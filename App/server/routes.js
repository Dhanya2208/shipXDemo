const jwt = require("jsonwebtoken");
const config = require("../config");
const setup = require("./handlers/setup");
const utilities = require("./utils/utilities");
const cacheFunctions = require("./cache/cache-functions");
const saveGdprWebhookRequest = require("./handlers/saveGdprWebhookRequest");

const apiVersion = process.env.API_VERSION || "2026-10";

function authenticateRequest(activeShops, apiKey, apiSecretKey) {
  return async (ctx, next) => {
    const authorization = ctx.get("Authorization");
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) ctx.throw(401, "Missing Shopify ID token.");
    let claims;
    try { claims = jwt.verify(token, apiSecretKey, { algorithms: ["HS256"], audience: apiKey }); }
    catch { ctx.throw(401, "Invalid or expired Shopify ID token."); }
    const shop = utilities.validShopFromDestination(claims.dest);
    if (!shop || claims.iss !== `https://${shop}/admin`) ctx.throw(401, "Invalid Shopify token destination.");
    let accessToken = activeShops.get(shop);
    if (!accessToken) {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          subject_token: token,
          subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
          requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.access_token) ctx.throw(401, "Shopify token exchange failed.");
      accessToken = data.access_token;
      activeShops.set(shop, accessToken);
    }
    ctx.state.shop = shop;
    ctx.state.accessToken = accessToken;
    await next();
  };
}

module.exports = {
  authenticateRequest,
  getPublicAPIRoutes(router, handle) {
    router.get("/health", (ctx) => { ctx.status = 200; ctx.body = "OK"; });
    if (config.SCRIPT_TAG?.NAME) {
      router.get(`/${config.SCRIPT_TAG.NAME}`, async (ctx) => { ctx.set("Cache-Control", "public, max-age=300"); await handle(ctx.req, ctx.res); ctx.respond = false; });
    }
    router.delete("/api/cache/:shop/:pin", async (ctx) => {
      if (ctx.params.pin !== process.env.CACHE_ADMIN_PIN) ctx.throw(401, "Incorrect pin.");
      ctx.body = await cacheFunctions.delete(ctx.params.shop) ? "Cache cleared" : "Cache clear failed";
    });
    router.get("/api/cache/:shop/:pin", async (ctx) => {
      if (ctx.params.pin !== process.env.CACHE_ADMIN_PIN) ctx.throw(401, "Incorrect pin.");
      ctx.body = await cacheFunctions.get(ctx.params.shop) || "No cache";
    });
  },
  getAuthenticatedAPIRoutes(router, activeShops, apiKey, apiSecretKey) {
    router.get("/api/setup", authenticateRequest(activeShops, apiKey, apiSecretKey), async (ctx) => {
      ctx.body = await setup.getSetup(ctx.state.shop, ctx.state.accessToken);
    });
  },
  registerGdprWebhooks(router) {
    for (const [path, type] of [["/webhooks/customers/redact", "customers/redact"], ["/webhooks/shop/redact", "shop/redact"], ["/webhooks/customers/data-request", "customers/data_request"]]) {
      router.post(path, async (ctx) => { ctx.status = await saveGdprWebhookRequest(ctx.state.webhook, type) ? 200 : 500; });
    }
  },
  registerAppWebhooks(router, activeShops) {
    router.post("/webhooks/app/uninstalled", async (ctx) => { activeShops.delete(ctx.state.webhook.domain); ctx.status = 200; });
  },
  async registerShopifyWebhooks(accessToken, shop) {
    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
      body: JSON.stringify({ query: `mutation { webhookSubscriptionCreate(topic: APP_UNINSTALLED, webhookSubscription: {callbackUrl: "${process.env.HOST}/webhooks/app/uninstalled", format: JSON}) { userErrors { message } } }` }),
    });
    if (!response.ok) console.error("Shopify webhook registration failed:", await response.text());
  },
};
