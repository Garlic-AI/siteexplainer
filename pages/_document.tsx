import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta
            name="description"
            content="Explain any confusing landing page in seconds."
          />
          <meta property="og:site_name" content="siteexplainer.com" />
          <meta
            property="og:description"
            content="Explain any confusing landing page in seconds."
          />
          <meta property="og:title" content="AI Landing Page Explainer" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="AI Landing Page Explainer" />
          <meta
            name="twitter:description"
            content="Explain any confusing landing page in seconds."
          />
          <meta
            property="og:image"
            content="https://siteexplainer.com/og-image.png"
          />
          <meta
            name="twitter:image"
            content="https://siteexplainer.com/og-image.png"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
