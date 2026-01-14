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

  console.log("MIDDLEWARE AUTH CHECK", {
    path: pathname,
    tokenExists: !!token,
    roleFromCookie: role,
  });

  // Token validation: check if token exists and is not expired
  if (token) {
    try {
      // Decode JWT token to check expiration (basic validation)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const now = Math.floor(Date.now() / 1000);
        
        // If token is expired, clear it and treat as no token
        if (payload.exp && payload.exp < now) {
          console.log("Token expired, clearing...");
          const response = NextResponse.redirect(new URL("/login", request.url));
          response.cookies.set("firebaseToken", "", { maxAge: 0, path: "/" });
          response.cookies.set("userRole", "", { maxAge: 0, path: "/" });
          return response;
        }
      }
    } catch (error) {
      console.error("Token validation error:", error);
      // Invalid token format, clear and redirect
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("firebaseToken", "", { maxAge: 0, path: "/" });
      response.cookies.set("userRole", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (AUTH_PAGES.includes(pathname)) {
   
    if (token) {
      const redirectTo = role === "admin" ? "/admin" : "/home";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    
    return NextResponse.next();
  }

  
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|assets|api).*)"],
};
