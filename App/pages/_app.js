import Head from "next/head";
import App from "next/app";

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <Head>
          <meta name="shopify-api-key" content={process.env.API_KEY || ""} />
          <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }
}

export default MyApp;
