import { memo } from "react";
import Script from "next/script";

function GoogleAnalytics() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-D4SNMY9VJP"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-D4SNMY9VJP');
        `}
      </Script>
    </>
  );
}

export default memo(GoogleAnalytics);
