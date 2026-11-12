const path = require("path");

module.exports = {
  env: { API_KEY: process.env.SHOPIFY_API_KEY || "" },
  turbopack: { root: path.resolve(__dirname) },
};
