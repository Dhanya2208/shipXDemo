const cache = new Map();
const memcache = require("./memcache");
module.exports = {
  async get(key) {
    if (process.env.MEMCACHE_ENABLED === "true") { try { return await memcache.getItem(key); } catch { return undefined; } }
    return cache.get(key);
  },
  async set(key, value) {
    if (process.env.MEMCACHE_ENABLED === "true") { try { await memcache.setItem(key, value); return true; } catch { return false; } }
    cache.set(key, value); return true;
  },
  async delete(key) {
    if (process.env.MEMCACHE_ENABLED === "true") { try { await memcache.deleteItem(key); return true; } catch { return false; } }
    return cache.delete(key);
  },
};
