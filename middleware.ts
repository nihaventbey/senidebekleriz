import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/yonetim")) {
    const cookieHeader = request.headers.get("cookie") || "";
    const hasSession =
      cookieHeader.includes("sb-") && cookieHeader.includes("auth-token");

    if (!hasSession && pathname !== "/yonetim/giris") {
      const url = request.nextUrl.clone();
      url.pathname = "/yonetim/giris";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
