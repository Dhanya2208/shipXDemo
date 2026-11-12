const config = require("../../config");

module.exports = {
  getShopifyDetailsQuery: `{
    scriptTags(first: 1) {
      edges {
        node {
          id
          src
        }
      }
    }
    webhookSubscriptions(first:5) {
      edges {
        node {
          topic
        }
      }
    }
    currentAppInstallation {
      app {
        title
      }
      activeSubscriptions {
        id
        name
        status
        createdAt
        currentPeriodEnd
        lineItems {
          id
          plan {
            pricingDetails {
              __typename
              ... on AppRecurringPricing {
                interval
              }
            }
          }
        }
      }
    }
    shop {
      myshopifyDomain
      email
      contactEmail
      name
      description
      url
      currencyCode
      plan {
        displayName
        partnerDevelopment
      }
    }
    locations(first:1) {
      edges {
        node {
          address {
            address1
            address2
            city
            province
            country
            zip
            countryCode
            phone
          }
        }
      }
    }
  }`,

  getScriptTagCreateMutation: function () {
    return `mutation {
      scriptTagCreate(input: {src: "${config.SCRIPT_TAG.URL}", displayScope: ALL}) {
        userErrors {
          field
          message
        }
        scriptTag {
          id
          src
        }
      }
    }`;
  },

  getWebhookSubscriptionCreateMutation: function (unSubscribedWebhookTopics) {
    let query = "";
    unSubscribedWebhookTopics.forEach((topic, index) => {
      query += `whsc${index}:webhookSubscriptionCreate(topic: ${topic.name}, webhookSubscription: { callbackUrl: "${topic.url}"}) {
        userErrors {
          field
          message
        }
        webhookSubscription {
          id
          topic
          callbackUrl
        }
      }`;
    });
    return `mutation {
      ${query}
    }`;
  },
};
