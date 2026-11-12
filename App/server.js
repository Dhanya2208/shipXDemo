const dotenv = require("dotenv");
dotenv.config();

require("isomorphic-fetch");
const Koa = require("koa");
const next = require("next");
const Router = require("koa-router");
const { verifyRequest } = require("@shopify/koa-shopify-auth");
const { default: createShopifyAuth } = require("@shopify/koa-shopify-auth");
const { receiveWebhook } = require("@shopify/koa-shopify-webhooks");
const { default: Shopify, ApiVersion } = require("@shopify/shopify-api");

const routes = require("./server/routes");
const config = require("./config");

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.April21,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: getSessionStorage(),
});

const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      accessMode: "offline",
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.state.shopify;
        ACTIVE_SHOPIFY_SHOPS[shop] = accessToken; //Storing temporarily, access token will be stored to db on saveSetup

        console.log("accessToken", accessToken);
        //Webhook registration
        await routes.registerShopifyWebhooks(accessToken, shop);

        ctx.redirect(`/?shop=${shop}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.get("/", async (ctx) => {
    const shop = ctx.query.shop;
    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  const webhook = receiveWebhook({ secret: Shopify.Context.API_SECRET_KEY });

  routes.getPublicAPIRoutes(router, handle);
  routes.getAuthenticatedAPIRoutes(router, ACTIVE_SHOPIFY_SHOPS);
  routes.registerAppWebhooks(router, webhook, ACTIVE_SHOPIFY_SHOPS);
  routes.registerGdprWebhooks(router, webhook);

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", verifyRequest(), handleRequest); // Everything else must have sessions

  // config.validateConfig();  // Comment to ignore config validations.

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> HOST -> ${process.env.HOST}`);
  });
});

function getSessionStorage() {
  let redisStore;
  let sessionStorage;
  if (
    process.env.REDISCACHE_ENABLED === "true" &&
    config.CACHE.REDISCACHE_ENDPOINT
  ) {
    redisStore = require("./server/cache/redis-store");
    sessionStorage = new Shopify.Session.CustomSessionStorage(
      redisStore.storeCallback,
      redisStore.loadCallback,
      redisStore.deleteCallback
    );
  } else sessionStorage = new Shopify.Session.MemorySessionStorage();
  return sessionStorage;
}
