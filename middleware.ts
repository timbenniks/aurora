export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    // Auth routes are handled by app/api/auth/[...nextauth]/route.ts only.
    // Running session middleware on OAuth callbacks can race PKCE cookie handling.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
