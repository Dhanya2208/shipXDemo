const db = require('../utils/dynamodb');
const config = require('../../config');

const saveGdprWebhookRequest = async (webhook, requestType) => {
  let timestamp = new Date().getTime();
  let saveWebhookRequestParams = {
    TableName: config.GDPR_WEBHOOK_TABLENAME,
    Item: {
      myShopifyDomain: webhook.domain,
      requestTimeAndType: timestamp + '#' + requestType,
      request: webhook,
      createdAt: timestamp
    },
    ReturnValues: 'NONE'
  };
  try {
    await db.put(saveWebhookRequestParams);
    console.log('Succeffully saved Webhook request in DDB.');
    return true;
  } catch (error) {
    console.log('Error saving to Webhook request to table: ', error);
    return false;
  }
};

module.exports = saveGdprWebhookRequest;
