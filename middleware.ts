import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup", "/forgotPassword"];
const ADMIN_PATHS = ["/admin", "/manage-survey"];

function normalize(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("firebaseToken")?.value || null;
  const role = request.cookies.get("userRole")?.value || "user";
  const pathname = normalize(request.nextUrl.pathname);

  console.log("🧠 MIDDLEWARE AUTH CHECK", {
    path: pathname,
    tokenExists: !!token,
    roleFromCookie: role,
  });

  // 1️⃣ Ignore Next.js internals & static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // 2️⃣ AUTH PAGES (login, signup, forgot password)
  if (AUTH_PAGES.includes(pathname)) {
    // ❌ logged-in users should NOT see login/signup
    if (token) {
      const redirectTo = role === "admin" ? "/admin" : "/home";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    // ✅ logged-out users CAN access auth pages
    return NextResponse.next();
  }

  // 3️⃣ NOT LOGGED IN → block all other pages
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4️⃣ ADMIN-ONLY PAGES
  if (
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 5️⃣ Everything else
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|assets|api).*)"],
};
