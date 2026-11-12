require("isomorphic-fetch");

const config = require("../../config");
const graphQL = require("../utils/graphQL");
const addSnippetUtil = require("../utils/addSnippetUtil");

const { API_VERSION } = process.env;

let _setup = (module.exports = {
  getSetup: async function (shop, accessToken) {
    if (shop && accessToken) {
      const shopifyQuery = JSON.stringify({
        query: graphQL.getShopifyDetailsQuery,
      });
      const shopifyQueryResponse = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: shopifyQuery,
      }
      );
      const shopifyQueryResponseJson = await shopifyQueryResponse.json();
      if (shopifyQueryResponseJson) {
        // nee mattum ipo keela pona
        await _setup.mutateScriptTags(accessToken, shop, shopifyQueryResponseJson.data);
        await _setup.mutateWebhookSubscriptions(accessToken, shop, shopifyQueryResponseJson.data);
        await _setup.addSnippetFile(accessToken, shop);
        //Fetch setup from dynamodb, merge & format it with shopify setup, add to cache & return
        return shopifyQueryResponseJson.data;
      }
      return undefined;
    }
    return undefined;
  },

  mutateScriptTags: async function (accessToken, shop, shopifySetup) {
    if (config.SCRIPT_TAG && config.SCRIPT_TAG.NAME && config.SCRIPT_TAG.URL) {
      if (shopifySetup.scriptTags.edges.length && shopifySetup.scriptTags.edges[0].node) {
        console.log("shopifySetup.scriptTags.edges", shopifySetup.scriptTags.edges);
        console.log("Script tag already registered");
      } else {
        console.log("Creating ScriptTag Mutation");
        const scriptTagMutation = JSON.stringify({
          query: graphQL.getScriptTagCreateMutation(),
        });
        const scriptTagMutationResponse = await fetch(
          `https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: scriptTagMutation,
        }
        );
        const scriptTagJson = await scriptTagMutationResponse.json();
        console.log("Shopify ScriptTag Mutation response: ", JSON.stringify(scriptTagJson.data, 0, 2));
      }
    }
  },

  mutateWebhookSubscriptions: async function (accessToken, shop, shopifySetup) {
    if (config.SUBSCRIPTION_TOPICS && config.SUBSCRIPTION_TOPICS.length) {
      let unSubscribedWebhookTopics = config.SUBSCRIPTION_TOPICS.filter((topic) => {
        if (shopifySetup.webhookSubscriptions && shopifySetup.webhookSubscriptions.edges && shopifySetup.webhookSubscriptions.edges.length &&
          shopifySetup.webhookSubscriptions.edges.find((edge) => edge.node && edge.node.topic && edge.node.topic === topic.name))
          return false;
        else return true;
      }
      );
      if (unSubscribedWebhookTopics && unSubscribedWebhookTopics.length) {
        console.log("Creating Webhooks Mutation");
        let webhookSubscriptionMutation = JSON.stringify({
          query: graphQL.getWebhookSubscriptionCreateMutation(unSubscribedWebhookTopics),
        });
        const webhookSubscriptionMutationResponse = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: webhookSubscriptionMutation,
        }
        );
        const webhookSubscriptionJson = await webhookSubscriptionMutationResponse.json();
        console.log("Shopify Webhooks Mutation response: ", JSON.stringify(webhookSubscriptionJson.data, 0, 2));
      } else console.log("Webhooks already registered");
    }
  },

  addSnippetFile: async function (accessToken, shop) {
    if (config.SNIPPET_FILE.NAME && config.SNIPPET_FILE.DIRECTORY && config.SNIPPET_FILE.THEME_RENDER_CODE) {
      // Get active theme, there may be more than 1
      // Check if our snipper file is available in snippets assets
      // If snippet is not available read it and add to assets
      // If snippet added to assets successfully check get theme
      // Check if snippet rendering code is added to theme.liquid file else modify and add it to theme.liquid
      try {
        const activeThemeId = await addSnippetUtil.getActiveThemeId(shop, accessToken);
        if (activeThemeId) {
          const isSnippetAvailable = await addSnippetUtil.isSnippetAvailable(shop, accessToken, activeThemeId);
          if (!isSnippetAvailable) {
            console.log("Snippet not available");
            const snippet = await addSnippetUtil.readSnippetFile();
            if (snippet) {
              const addSnippetResponse = await addSnippetUtil.addSnippet(shop, accessToken, activeThemeId, snippet);
              if (addSnippetResponse.status === 200) {
                console.log("Successfully added snippet");
                let theme = await addSnippetUtil.getTheme(shop, accessToken, activeThemeId);
                if (theme && theme.asset && theme.asset.value) {
                  await addSnippetUtil.registerSnippetInTheme(shop, accessToken, activeThemeId, theme.asset.value);
                }
              }
            }
          } else console.log("Snippet is available already");
        }
      } catch (err) {
        console.log("Error while adding snippet to theme");
      }
    }
  },
});
