import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Admin routes protection
  if (pathname.startsWith("/yonetim") && pathname !== "/yonetim/giris") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/yonetim/giris";
      return NextResponse.redirect(url);
    }

    // Check admin role in user metadata
    const role = user.user_metadata?.role;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/yonetim/giris";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated admins away from login page
  if (pathname === "/yonetim/giris" && user?.user_metadata?.role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/yonetim";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
