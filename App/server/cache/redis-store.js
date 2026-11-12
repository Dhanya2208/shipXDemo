const redis = require("redis");
const client = redis.createClient(process.env.REDISCACHE_ENDPOINT, {
  no_ready_check: true
});
const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const config = require('../../config');

client.on("error", function (error) {
  console.error(error);
});

module.exports = {
  /*
  The storeCallback takes in the Session, and sets a stringified version of it on the redis store
  This callback is used for BOTH saving new Sessions and updating existing Sessions.
  If the session can be stored, return true
  Otherwise, return false
*/
  storeCallback: async (session) => {
    console.log("storeCallback", session);
    try {
      // Inside our try, we use the `setAsync` method to save our session.
      // This method returns a boolean (true is successful, false if not)
      return await setAsync(config.CACHE.APP_NAME + '-' + session.id, JSON.stringify(session));

    } catch (err) {
      // throw errors, and handle them gracefully in your application
      console.log('Error saving to redis', err);
      throw new Error(err)
    }
  },

  /*
    The loadCallback takes in the id, and uses the getAsync method to access the session data
     If a stored session exists, it's parsed and returned
     Otherwise, return undefined
  */
  loadCallback: async (id) => {
    try {
      // Inside our try, we use `getAsync` to access the method by id
      // If we receive data back, we parse and return it
      // If not, we return `undefined`
      let reply = await getAsync(config.CACHE.APP_NAME + '-' + id);
      if (reply) {
        return JSON.parse(reply);
      } else {
        return undefined
      }
    } catch (err) {
      console.log('Error reading  redis', err);
      throw new Error(err)
    }
  },

  /*
    The deleteCallback takes in the id, and uses the redis `del` method to delete it from the store
    If the session can be deleted, return true
    Otherwise, return false
  */
  deleteCallback: async (id) => {
    try {
      // Inside our try, we use the `delAsync` method to delete our session.
      // This method returns a boolean (true is successful, false if not)
      return await delAsync(config.CACHE.APP_NAME + '-' + id)
    } catch (err) {
      console.log('Error deleting in redis', err);
      throw new Error(err)
    }
  }
}

