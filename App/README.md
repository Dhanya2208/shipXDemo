# Shopify app (Koa + Next.js)

This application runs on a current Node.js LTS runtime and uses Shopify's supported Node API library for OAuth and embedded app authentication.

## Requirements

- Node.js 22 LTS (20.9 or newer)
- npm 10 or newer
- A Shopify app in the Partner Dashboard, plus a public HTTPS URL for development (for example, a tunnel URL)

## Local setup

1. Copy `.env.example` to `.env` and fill in your app's Shopify client ID, client secret, public HTTPS host, and requested scopes. Keep `.env` private.
2. In your Shopify app settings, set the app URL to the value of `HOST` and add `<HOST>/auth/callback` as an allowed redirect URL.
3. Run `npm ci` to install the locked dependencies.
4. Run `npm run dev` and open/install the app through Shopify admin.

The server listens on port 3000 by default. Set `PORT` if your hosting service provides a port. The `/health` endpoint returns `OK` for service checks.

## Environment variables

Required: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET_KEY`, `HOST`, and `SCOPES` (comma-separated). `API_VERSION` defaults to Shopify's current stable API version included by the SDK.

AWS DynamoDB, CloudWatch, Memcached, and Redis support is optional. Keep the related `*_ENABLED` flags set to `false` for local development unless those services and their corresponding values are configured.

## Build and production

- `npm run build` creates the Next.js production build.
- `npm start` starts the Koa server in production mode.

Use the Node version declared in `.nvmrc`/the `engines` field and configure the same environment variables in your hosting platform. Never commit `.env` or production credentials.
