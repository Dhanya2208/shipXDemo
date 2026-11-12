const { HOST, MEMCACHE_ENABLED, REDISCACHE_ENABLED, CLOUDWATCH_LOGS_ENABLED } = process.env;

const config = {
  SUBSCRIPTION_TOPICS: [
    { name: "ORDERS_CREATE", url: `${HOST}/webhooks/orders/create` },
    { name: "ORDERS_UPDATED", url: `${HOST}/webhooks/orders/updated` },
    { name: "ORDERS_CANCELLED", url: `${HOST}/webhooks/orders/cancelled` },
    { name: "SHOP_UPDATE", url: `${HOST}/webhooks/shop/updated` },
  ],
  GDPR_WEBHOOK_TABLENAME: undefined,
  SCRIPT_TAG: { NAME: "sample-script-tag.js", URL: `${HOST}/sample-script-tag.js` },
  SNIPPET_FILE: { NAME: "sample-snippet", DIRECTORY: "/snippets/sample-snippet.liquid", THEME_RENDER_CODE: "{% render 'sample-snippet' %}" },
  CACHE: { APP_NAME: undefined, MEMCACHE_ENDPOINT: undefined, REDISCACHE_ENDPOINT: undefined },
  CLOUDWATCH_LOG_GROUP_NAME: undefined,
  validateConfig() {
    const note = "Configure required values in config.js before enabling optional integrations.";
    if (!HOST) throw new Error(`HOST is missing from the environment. ${note}`);
    if (MEMCACHE_ENABLED === "true" && (!config.CACHE.APP_NAME || !config.CACHE.MEMCACHE_ENDPOINT)) throw new Error(`CACHE.APP_NAME and CACHE.MEMCACHE_ENDPOINT are required when Memcached is enabled. ${note}`);
    if (REDISCACHE_ENABLED === "true" && (!config.CACHE.APP_NAME || !config.CACHE.REDISCACHE_ENDPOINT)) throw new Error(`CACHE.APP_NAME and CACHE.REDISCACHE_ENDPOINT are required when Redis is enabled. ${note}`);
    if (CLOUDWATCH_LOGS_ENABLED === "true" && !config.CLOUDWATCH_LOG_GROUP_NAME) throw new Error(`CLOUDWATCH_LOG_GROUP_NAME is required when CloudWatch logging is enabled. ${note}`);
  },
};
module.exports = config;
