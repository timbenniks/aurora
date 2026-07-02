/** Whether UI and API routes require a signed-in GitHub session. */
export function isAuthRequired(): boolean {
  const flag = process.env.AUTH_REQUIRED?.trim().toLowerCase()

  if (flag === "true") {
    return true
  }

  if (flag === "false") {
    return false
  }

  return process.env.VERCEL_ENV === "production"
}
