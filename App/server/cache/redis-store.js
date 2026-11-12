const { createClient } = require("redis");
const config = require("../../config");
const client = createClient({ url: process.env.REDISCACHE_ENDPOINT });
client.on("error", (error) => console.error("Redis error:", error));
const connected = client.connect();
const keyFor = (key) => `${config.CACHE.APP_NAME || "shopify-app"}-${key}`;
module.exports = {
  async storeCallback(session) { await connected; await client.set(keyFor(session.id), JSON.stringify(session)); return true; },
  async loadCallback(id) { await connected; const value = await client.get(keyFor(id)); return value ? JSON.parse(value) : undefined; },
  async deleteCallback(id) { await connected; return (await client.del(keyFor(id))) > 0; },
};
