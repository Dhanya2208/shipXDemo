var Ecad = require('ecad');
var Memcached = require('memcached');
const logs = require('../utils/aws-logs');
const config = require('../../config');

var _memcache = module.exports = {
  setItem: function (key, data) {
    return new Promise((resolve, reject) => {
      _memcache.getConnectionEndPoint().then(connectTo => {
        var memcached = new Memcached(connectTo);
        let memcacheExpiryInSeconds = process.env.MEMCACHE_TTL ? Number(process.env.MEMCACHE_TTL) : 86400;
        let memcacheKey = `${config.CACHE.APP_NAME}-${key}`;
        memcached.set(memcacheKey, JSON.stringify(data), memcacheExpiryInSeconds, function (err) {
          if (err) {
            let logData = {
              error: err,
              type: 'set-item'
            };
            logs.awsLog('Memcache-Error', JSON.stringify(logData));
            reject(err);
          } else
            resolve('Successfully set the mem cache');
        });
      },
        error => {
          reject(error);
        });
    });
  },

  getItem: function (key) {
    return new Promise((resolve, reject) => {
      _memcache.getConnectionEndPoint().then(connectTo => {
        var memcached = new Memcached(connectTo);
        let memcacheKey = `slots-${key}`;
        memcached.get(memcacheKey, function (err, data) {
          if (err) {
            let logData = {
              error: err,
              type: 'get-item'
            };
            logs.awsLog('Memcache-Error', JSON.stringify(logData));
            reject(err);
          } else
            resolve(data ? JSON.parse(data) : undefined);
        });
      },
        error => {
          reject(error);
        });

    });
  },

  deleteItem: function (key) {
    return new Promise((resolve, reject) => {
      _memcache.getConnectionEndPoint().then(connectTo => {
        var memcached = new Memcached(connectTo);
        let memcacheKey = `slots-${key}`;
        memcached.del(memcacheKey, function (err, data) {
          if (err) {
            let logData = {
              error: err,
              type: 'del-item'
            };
            logs.awsLog('Memcache-Error', JSON.stringify(logData));
            reject(err);
          } else
            resolve('Successfully deleted the cache');
        });
      },
        error => {
          reject(error);
        });

    });
  },

  getConnectionEndPoint: function () {
    return new Promise((resolve, reject) => {
      let endpoints = process.env.MEMCACHE_ENDPOINT;
      let client = new Ecad({ endpoints: endpoints, timeout: 500, retries: 1 });
      client.fetch(function (err, hosts) {
        if (err) {
          let logData = {
            error: err,
            type: 'connection-error'
          };
          logs.awsLog('Memcache-Error', JSON.stringify(logData));
          reject(err);
        } else {
          let connectTo = hosts[parseInt(Math.random() * hosts.length)];
          resolve(connectTo);
        }
      });
    });
  }
}
