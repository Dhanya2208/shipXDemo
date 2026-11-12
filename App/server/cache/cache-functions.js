const memcache = require('./memcache');
const LRU = require('lru-cache');
var simpleCache = new LRU(100);

module.exports = {
  get: (key) => {
    return new Promise((resolve, reject) => {
      let isMemcacheEnabled = (process.env.MEMCACHE_ENABLED && process.env.MEMCACHE_ENABLED === 'true') ? true : false;
      if (isMemcacheEnabled) {
        memcache.getItem(key).then(data => {
          resolve(data ? JSON.parse(data) : undefined);
        },
          error => {
            resolve(undefined);
          });
      } else {
        let data = simpleCache.get(key);
        resolve(data ? JSON.parse(data) : undefined);
      }
    });
  },
  set: (key, value) => {
    return new Promise((resolve, reject) => {
      let isMemcacheEnabled = (process.env.MEMCACHE_ENABLED && process.env.MEMCACHE_ENABLED === 'true') ? true : false;
      if (isMemcacheEnabled) {
        memcache.setItem(key, JSON.stringify(value)).then(response => {
          resolve(true);
        },
          error => {
            resolve(false);
          });
      } else {
        resolve(simpleCache.set(key, JSON.stringify(value)));
      }
    });
  },
  delete: (key) => {
    return new Promise((resolve, reject) => {
      let isMemcacheEnabled = (process.env.MEMCACHE_ENABLED && process.env.MEMCACHE_ENABLED === 'true') ? true : false;
      if (isMemcacheEnabled) {
        memcache.deleteItem(key).then(response => {
          resolve(true);
        },
          error => {
            resolve(false);
          })
      } else
        resolve(simpleCache.del(key));
    });
  }
}