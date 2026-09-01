import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIZE_ROUTE_PREFIX = "/prize";

function getHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isPrizeHost(hostname: string) {
  return hostname === "prize.sofis3d.art" || hostname === "prize.localhost";
}

export function proxy(request: NextRequest) {
  const hostname = getHostname(request);

  if (!isPrizeHost(hostname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (
    url.pathname === PRIZE_ROUTE_PREFIX ||
    url.pathname.startsWith(`${PRIZE_ROUTE_PREFIX}/`)
  ) {
    url.pathname = url.pathname.slice(PRIZE_ROUTE_PREFIX.length) || "/";
    return NextResponse.redirect(url);
  }

  url.pathname =
    url.pathname === "/" ? PRIZE_ROUTE_PREFIX : `${PRIZE_ROUTE_PREFIX}${url.pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
