var path = require('path');
const fs = require('fs');
const API_VERSION = process.env.API_VERSION || "2026-10";

const config = require('../../config');

let _addSnippetUtil = module.exports = {
  addSnippet: async function (shopifyDomain, accessToken, activeThemeId, snippet) {
    const response = await fetch(`https://${shopifyDomain}/admin/api/${API_VERSION}/themes/${activeThemeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: `snippets/${config.SNIPPET_FILE.NAME}.liquid`,
          value: snippet
        }
      })
    });
    return response;
  },

  readSnippetFile: function () {
    let appDir = path.dirname(require.main.filename);
    return new Promise((resolve, reject) => {
      fs.readFile(appDir + config.SNIPPET_FILE.DIRECTORY, 'utf8', (err, data) => {
        return err ? resolve(undefined) : resolve(data)
      });
    });
  },

  isSnippetAvailable: async function (shopifyDomain, accessToken, activeThemeId) {
    const response = await fetch(`https://${shopifyDomain}/admin/api/${API_VERSION}/themes/${activeThemeId}/assets.json?asset[key]=snippets/${config.SNIPPET_FILE.NAME}.liquid`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    return response.status === 200;
  },

  getTheme: async function (shopifyDomain, accessToken, activeThemeId) {
    const response = await fetch(`https://${shopifyDomain}/admin/api/${API_VERSION}/themes/${activeThemeId}/assets.json?asset[key]=layout/theme.liquid`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    return response.status === 200 ? await response.json() : undefined;
  },

  registerSnippetInTheme: async function (shopifyDomain, accessToken, activeThemeId, themeValue) {
    if (themeValue.includes(config.SNIPPET_FILE.THEME_RENDER_CODE)) {
      console.log('Snippet already registered in them.liquid');
    } else {
      console.log('Registering Snippet in them.liquid');
      let modifiedThemeValue = _addSnippetUtil.getModifiedThemeValue(themeValue);
      if (modifiedThemeValue) {
        const response = await fetch(`https://${shopifyDomain}/admin/api/${API_VERSION}/themes/${activeThemeId}/assets.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            asset: {
              key: `layout/theme.liquid`,
              value: modifiedThemeValue
            }
          })
        });
        console.log('Theme value modified', response.status);
      }
    }
  },

  getModifiedThemeValue: function (theme) {
    // Find index of </body> tag
    // add snippet render code before </body> tag
    let modifiedThemeValue = '';
    let bodyTagIndex = theme.indexOf('</body>');
    if (bodyTagIndex > 1)
      modifiedThemeValue = [theme.slice(0, bodyTagIndex), config.SNIPPET_FILE.THEME_RENDER_CODE + '\n', theme.slice(bodyTagIndex)].join('');
    return modifiedThemeValue;
  },

  getActiveThemeId: async function (shopifyDomain, accessToken) {
    let activeThemeId;
    const response = await fetch(`https://${shopifyDomain}/admin/api/${API_VERSION}/themes.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    if (response.status === 200) {
      const storeThemes = await response.json();
      if (storeThemes && storeThemes.themes && storeThemes.themes.length > 0) {
        activeThemeId = storeThemes.themes[0].id;
        if (storeThemes.themes && storeThemes.themes.length > 1) { //More than one theme found. "role" :"main" is the active theme 
          let activeTheme = storeThemes.themes.find(a => a.role === 'main');
          if (activeTheme)
            activeThemeId = activeTheme.id;
        }
      }
    }
    return activeThemeId;
  }

}



