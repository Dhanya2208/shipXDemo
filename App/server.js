require("dotenv").config();
require("@shopify/shopify-api/adapters/node");

const crypto = require("crypto");
const Koa = require("koa");
const next = require("next");
const Router = require("@koa/router");
const { koaBody } = require("koa-body");
const { shopifyApi, ApiVersion } = require("@shopify/shopify-api");

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecretKey = process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_API_SECRET;
const host = process.env.HOST;
const scopes = (process.env.SCOPES || "").split(",").map((scope) => scope.trim()).filter(Boolean);
const hostName = host ? new URL(host).hostname : "localhost";
const apiVersion = process.env.API_VERSION || ApiVersion.October26;
process.env.API_VERSION = apiVersion;

if (!apiKey || !apiSecretKey) throw new Error("SHOPIFY_API_KEY and SHOPIFY_API_SECRET_KEY must be set in .env.");
if (!host) throw new Error("HOST must be set in .env to the public HTTPS app URL.");

const shopify = shopifyApi({ apiKey, apiSecretKey, scopes, hostName, apiVersion, isEmbeddedApp: true });
const routes = require("./server/routes");
const port = Number(process.env.PORT) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const activeShops = new Map();

app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();

  router.get("/auth", async (ctx) => {
    const shop = shopify.utils.sanitizeShop(ctx.query.shop, true);
    if (!shop) ctx.throw(400, "A valid shop parameter is required.");
    await shopify.auth.begin({ shop, callbackPath: "/auth/callback", isOnline: false, rawRequest: ctx.req, rawResponse: ctx.res });
    ctx.respond = false;
  });

  router.get("/auth/callback", async (ctx) => {
    const { session } = await shopify.auth.callback({ rawRequest: ctx.req, rawResponse: ctx.res });
    activeShops.set(session.shop, session.accessToken);
    await routes.registerShopifyWebhooks(session.accessToken, session.shop);
    ctx.redirect(`/?shop=${encodeURIComponent(session.shop)}`);
  });

  router.post("/graphql", routes.authenticateRequest(activeShops, apiKey, apiSecretKey), async (ctx) => {
    const response = await fetch(`https://${ctx.state.shop}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ctx.state.accessToken },
      body: JSON.stringify(ctx.request.body || {}),
    });
    ctx.status = response.status;
    ctx.body = await response.json();
  });

  server.use(async (ctx, nextMiddleware) => {
    if (!ctx.path.startsWith("/webhooks/") || ctx.method !== "POST") return nextMiddleware();
    const chunks = [];
    for await (const chunk of ctx.req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    const received = Buffer.from(ctx.get("X-Shopify-Hmac-Sha256"));
    const expected = Buffer.from(crypto.createHmac("sha256", apiSecretKey).update(rawBody).digest("base64"));
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) ctx.throw(401, "Invalid webhook signature.");
    try { ctx.state.webhook = JSON.parse(rawBody.toString("utf8")); }
    catch { ctx.throw(400, "Invalid webhook JSON."); }
    await nextMiddleware();
  });

  server.use(async (ctx, nextMiddleware) => {
    if (ctx.path.startsWith("/webhooks/")) return nextMiddleware();
    return koaBody({ json: true, urlencoded: true })(ctx, nextMiddleware);
  });
  routes.getPublicAPIRoutes(router, handle);
  routes.getAuthenticatedAPIRoutes(router, activeShops, apiKey, apiSecretKey);
  routes.registerAppWebhooks(router, activeShops);
  routes.registerGdprWebhooks(router);
  server.use(router.routes());
  server.use(router.allowedMethods());
  server.use(async (ctx) => { await handle(ctx.req, ctx.res); ctx.respond = false; });
  server.listen(port, () => console.log(`> Ready on http://localhost:${port} (Shopify host: ${host})`));
}).catch((error) => { console.error("Failed to start app:", error); process.exit(1); });

