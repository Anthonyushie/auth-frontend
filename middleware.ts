import { NextRequest, NextResponse } from "next/server";

const MOBILE_UA =
  /Android|iPhone|iPad|iPod|Mobile|Phone|BlackBerry|IEMobile|Opera Mini|webOS/i;

function blockedHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Tynk — Desktop only</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, sans-serif; background: #fff; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { width: 100%; max-width: 28rem; border: 1px solid #e7e5e4; background: #fafaf9; border-radius: 12px; padding: 32px; text-align: center; }
  .kicker { font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #a8a29e; margin: 16px 0 0; }
  h1 { font-size: 22px; letter-spacing: -0.02em; margin: 8px 0 0; }
  p { font-size: 14px; line-height: 1.6; color: #78716c; margin: 8px 0 0; }
  @media (prefers-color-scheme: dark) {
    body { background: #0c0a09; color: #fafaf9; }
    .card { border-color: #292524; background: #1c1917; }
    p { color: #a8a29e; }
  }
</style>
</head>
<body>
  <div class="card">
    <p class="kicker">Desktop only</p>
    <h1>Please visit Tynk on a computer</h1>
    <p>This publication is designed for desktop browsers only and isn&apos;t available on phones or tablets &mdash; even with &ldquo;Desktop site&rdquo; turned on.</p>
  </div>
</body>
</html>`;
}

export function middleware(request: NextRequest) {
  // Sec-CH-UA-Mobile stays "?1" on Chrome Android even when "Desktop site" is
  // checked, while the User-Agent string is spoofed to Windows. So the hint is
  // the reliable server-side signal; UA tokens are a fallback for normal (non-spoofed) mobile mode.
  const chMobile = request.headers.get("sec-ch-ua-mobile");
  const ua = request.headers.get("user-agent") ?? "";
  const isHintMobile = chMobile !== null && chMobile.includes("?1");
  const isUaMobile = MOBILE_UA.test(ua);

  if (isHintMobile || isUaMobile) {
    return new Response(blockedHtml(), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  // Ask Chromium to send the Client Hint on subsequent navigations.
  const res = NextResponse.next();
  res.headers.set("Accept-CH", "Sec-CH-UA-Mobile, Sec-CH-UA-Platform");
  res.headers.set("Critical-CH", "Sec-CH-UA-Mobile");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)",
  ],
};
