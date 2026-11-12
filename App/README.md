### DEV AND PROD SETUP

1. Use Node 12.18
2. npm i
3. Run Ngrok: ngrok http 3000
4. Copy the https ngrok URL to .env file's HOST property.
5. Open new terminal (Node 12.18) instance leaving ngrok running.
6. In new terminal, npm run dev
7. To test unauthenticated API's use Postman locally.
8. To test UI go to Shopify Partners account.
9. If a test app not available, create a new one (public app). Also, add nav menu.
10. If new app, set .env's SHOPIFY_API_KEY and SHOPIFY_API_SECRET_KEY.
11. In the App setup, set APP URL as the ngrok URL
12. In the App setup, set whitelisted redirection URLs as <ngrok_url>/auth/callback
13. Install App to test store
14. Continue with dev.
15. Whenever ngrok session ends, update .env HOST, App Setup URLs in Partners Page.

### SETUP CONFIG.JS FILE

- Comment config.validateConfig() in server.js to ignore config validations

SUBSCRIPTION_TOPICS (Optional)-

- Setup this if your app needs to listen for events from shopify.
- Refer https://shopify.dev/docs/admin-api/graphql/reference/events/webhooksubscriptiontopic for list of webhook events.
- If SUBSCRIPTION_TOPICS array is setup it will be automatically registered to app users account while getSetup call.

GDPR_WEBHOOK_TABLENAME -

- Create a table in DynamoDB with name as "AppNameWebhookRequests" and save it here.
- Refer https://shopify.dev/tutorials/add-gdpr-webhooks-to-your-app to know more about mandatory GDPR.

SCRIPT_TAG (Optional)-

- Use this option when your app needs to run a script on storefront.
- Scripts will be automatically registered to app users account while getSetup call.
- Also create a route in getPublicAPIRoutes function to serve this script to storefront.
- Place script file inside public/<yourscriptfile.js>
- Provide below details for script,
  - NAME - Provide the script file name here with .js extension
  - URL - <HOST><yourscriptfile.js>

SNIPPET_FILE (Optional)-

- Use this option when your app needs to run a snippet on storefront.
- Snippets will be automatically registered to app users account while getSetup call.
- Provide below details of snippet file,
  - NAME
  - DIRECTORY - From root path of project
  - THEME_RENDER_CODE - This code will be added next to body tag in theme.liquid file.

CACHE-

- ElasiCache in AWS supports both Memcache and Redis cache. We use Redis cache for maintaining session storage of shopify.
  And for our caching we use simple LRU cache & memcache.
- Storefront calls must be cached. And when load balancer is used it is must to use MEMCACHE.
- Also use REDISCACHE_ENABLED and MEMCACHE_ENABLED from environment.
- When MEMCACHE_ENABLED from environment is false, simple cache will be used.
- When REDISCACHE_ENABLED from environment is false, shopify default MemorySessionStorage will be used.
- Provide below details for CACHE,
  - APP_NAME - Used to differentiate key values when multiple apps use same cache endpoint
  - MEMCACHE_ENDPOINT - Create endpoint from ElastiCache service AWS
  - REDISCACHE_ENDPOINT - Create endpoint from ElastiCache service AWS

CLOUDWATCH_LOG_GROUP_NAME (Optional)-

- If you app uses MEMCACHE you must create a new cloudwatch loggroup and setup the logroup name here.
- Also create metric filters in cloudwatch to notify error alerts.
- CLOUDWATCH_LOGS_ENABLED from environment must be set to true.


### AWS Elastic Beanstalk
### Hosting
SlickPOS BCP Documentation - https://docs.google.com/document/d/1DDbK-f1tz5bIp854yKWEgqL0gp0BqCaJqGErjeQjEx0
1. For hosting application to elastic beanstalk refer AWS Beanstalk section in SlickPOS BCP Documentation.
2. For enabling https in AWS EB refer  Route 53 for https in shopify apps in SlickPOS BCP Documentation.
### Deploying to production
Archive the project files excluding node_modules folder, .config, .git and .gitignore files. Include .ebextensions folder.
Deploy the compressed archive in the environment with "Upload and Deploy".
If there is any env config update in the project, update the same in production server.