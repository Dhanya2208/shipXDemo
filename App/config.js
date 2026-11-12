const { HOST, MEMCACHE_ENABLED, REDISCACHE_ENABLED, CLOUDWATCH_LOGS_ENABLED } = process.env;

let _config = (module.exports = {
  SUBSCRIPTION_TOPICS: [
    { name: "ORDERS_CREATE", url: `${HOST}/webhooks/orders/create` },
    { name: "ORDERS_UPDATED", url: `${HOST}/webhooks/orders/updated` },
    { name: "ORDERS_CANCELLED", url: `${HOST}/webhooks/orders/cancelled` },
    { name: "SHOP_UPDATE", url: `${HOST}/webhooks/shop/updated` },
  ],
  GDPR_WEBHOOK_TABLENAME: undefined,
  SCRIPT_TAG: {
    NAME: "sample-script-tag.js",
    URL: `${HOST}/sample-script-tag.js`,
  },
  SNIPPET_FILE: {
    NAME: "sample-snippet",
    DIRECTORY: "/snippets/sample-snippet.liquid",
    THEME_RENDER_CODE: "{% render 'sample-snippet' %}",
  },
  CACHE: {
    APP_NAME: undefined,
    MEMCACHE_ENDPOINT: undefined,
    REDISCACHE_ENDPOINT: undefined,
  },
  CLOUDWATCH_LOG_GROUP_NAME: undefined,

  validateConfig: function () {
    const note = "Comment config.validateConfig() in server.js to ignore config validations.";
    if (!_config.GDPR_WEBHOOK_TABLENAME) {
      throw new Error(`GDPR_WEBHOOK_TABLENAME is not setup in config.js. ${note}`);
    }
    if ((MEMCACHE_ENABLED === "true" && !_config.CACHE.MEMCACHE_ENDPOINT) || !_config.CACHE.APP_NAME) {
      throw new Error(`CACHE.MEMCACHE_ENDPOINT or CACHE.APP_NAME is not setup in config. ${note}`);
    }
    if ((REDISCACHE_ENABLED === "true" && !_config.CACHE.REDISCACHE_ENDPOINT) || !_config.CACHE.APP_NAME) {
      throw new Error(`CACHE.REDISCACHE_ENABLED or CACHE.APP_NAME is not setup in config. ${note}`);
    }
    if (CLOUDWATCH_LOGS_ENABLED === "true" && !_config.CLOUDWATCH_LOG_GROUP_NAME) {
      throw new Error(`CLOUDWATCH_LOG_GROUP_NAME is not setup in config. ${note}`);
    }
  }
});
