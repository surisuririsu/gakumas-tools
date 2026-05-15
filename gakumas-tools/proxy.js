import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request) {
  // Strip leaked upstream port. Our reverse proxy forwards X-Forwarded-Port
  // as the internal Node port (3000) rather than 443. Since Next.js 16.2.5
  // expanded the proxy matcher to .rsc / segment-prefetch transport
  // variants, next-intl now fires locale redirects on RSC prefetches and
  // bakes that port into the absolute Location URL, sending the App Router
  // client to gktools.ris.moe:3000.
  const proto = request.headers.get("x-forwarded-proto");
  const port = request.headers.get("x-forwarded-port");
  if (
    port &&
    ((proto === "https" && port !== "443") ||
      (proto === "http" && port !== "80"))
  ) {
    request.headers.delete("x-forwarded-port");
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
