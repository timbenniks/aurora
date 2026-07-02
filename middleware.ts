import { middlewareMatcher } from "@/lib/auth/public-paths"

export { auth as middleware } from "@/auth"

export const config = {
  matcher: [...middlewareMatcher],
}
