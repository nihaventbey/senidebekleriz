import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { applyAgentLinkHeaders } from "@/lib/agents/link-headers";
import { acceptsMarkdown, isMarkdownNegotiablePath } from "@/lib/agents/negotiation";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (acceptsMarkdown(request) && isMarkdownNegotiablePath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/agents/markdown";
    url.searchParams.set("path", pathname);
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Admin routes protection - only run Supabase auth on /yonetim routes to avoid burning CPU on public visits
  if (pathname.startsWith("/yonetim")) {
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

    if (pathname !== "/yonetim/giris") {
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
    } else if (user?.user_metadata?.role === "admin") {
      // Redirect authenticated admins away from login page
      const url = request.nextUrl.clone();
      url.pathname = "/yonetim";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/") {
    applyAgentLinkHeaders(response.headers);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|ads\\.txt|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
