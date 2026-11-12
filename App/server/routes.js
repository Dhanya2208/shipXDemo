// require('dotenv').config();
const koaBody = require("koa-body");
const { verifyRequest } = require("@shopify/koa-shopify-auth");
const { registerWebhook } = require("@shopify/koa-shopify-webhooks");

const config = require("../config");
const setup = require("./handlers/setup");
const utilities = require("./utils/utilities");
const cacheFunctions = require("./cache/cache-functions");
const saveGdprWebhookRequest = require("./handlers/saveGdprWebhookRequest");

const { HOST, API_VERSION } = process.env;

module.exports = {
  getPublicAPIRoutes: function (router, handle) {
    // Health monitoring route
    router.get("/health", async (ctx) => {
      ctx.status = 200;
      ctx.body = "OK";
    });

    if (config.SCRIPT_TAG && config.SCRIPT_TAG.NAME && config.SCRIPT_TAG.URL) {
      //Allow script-tag without authentication
      router.get(`/${config.SCRIPT_TAG.NAME}`, async (ctx) => {
        ctx.set("Cache-Control", "public, max-age=300");
        await handle(ctx.req, ctx.res); //passed down to NextJS app without Auth
        ctx.respond = false;
      });
    }

    // Empty Cache
    router.delete("/api/cache/:myShopifyDomain/:pin", koaBody(), async (ctx) => {
      if (ctx.params.pin === "e$@bg01") {
        let result = await cacheFunctions.delete(ctx.params.myShopifyDomain);
        if (result) ctx.status = 200;
        else ctx.status = 500;
      } else {
        ctx.body = "Incorrect pin.";
        ctx.status = 401;
      }
    });
    // Get Cache
    router.get("/api/cache/:myShopifyDomain/:pin", koaBody(), async (ctx) => {
      if (ctx.params.pin === "e$@bg01") {
        let cache = await cacheFunctions.get(ctx.params.myShopifyDomain);
        cache = cache || "No cache";
        ctx.body = cache;
        ctx.status = 200;
      } else {
        ctx.body = "Incorrect pin.";
        ctx.status = 401;
      }
    });
  },

  getAuthenticatedAPIRoutes: function (router, ACTIVE_SHOPIFY_SHOPS) {
    //API - Get setup
    router.get("/api/setup", verifyRequest({ accessMode: "offline", returnHeader: true }), koaBody(), async (ctx) => {
      const shop = utilities.getShop(ctx);
      const accessToken = await utilities.getShopAccessToken(shop, ctx, ACTIVE_SHOPIFY_SHOPS);
      let setupData = await setup.getSetup(shop, accessToken);
      if (setupData) {
        ctx.status = 200;
        ctx.body = setupData;
      } else {
        ctx.status = 500;
      }
    }
    );
  },

  registerGdprWebhooks: function (router, webhook) {
    router.post("/webhooks/customers/redact", webhook, async (ctx) => {
      let isSaved = await saveGdprWebhookRequest(ctx.state.webhook, "customers/redact");
      if (isSaved) {
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    });
    router.post("/webhooks/shop/redact", webhook, async (ctx) => {
      console.log("Received shop/redact webhook: ", ctx.state.webhook);
      let isSaved = await saveGdprWebhookRequest(ctx.state.webhook, "shop/redact");
      if (isSaved) {
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    });
    router.post("/webhooks/customers/data-request", webhook, async (ctx) => {
      let isSaved = await saveGdprWebhookRequest(ctx.state.webhook, "customers/data_request");
      if (isSaved) {
        ctx.status = 200;
      } else {
        ctx.status = 500;
      }
    });
  },

  registerAppWebhooks: function (router, webhook, ACTIVE_SHOPIFY_SHOPS) {
    //App uninstalled webhook
    router.post("/webhooks/app/uninstalled", webhook, async (ctx) => {
      const shop = ctx.state.webhook.domain;
      delete ACTIVE_SHOPIFY_SHOPS[shop];
      ctx.status = 200;
    });
  },

  registerShopifyWebhooks: async function (accessToken, shop) {
    let registration = await registerWebhook({
      address: `${HOST}/webhooks/app/uninstalled`,
      topic: "APP_UNINSTALLED",
      accessToken,
      shop,
      apiVersion: API_VERSION,
    });
    if (registration.success)
      console.log("Successfully registered APP_UNINSTALLED webhook!");
    else
      console.log("Failed to register APP_UNINSTALLED webhook", JSON.stringify(registration.result));
  },
};
