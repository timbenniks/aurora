import { signIn, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { mobileCtaClass } from "@/lib/aurora/layout"
import { cn } from "@/lib/utils"

export function SignInButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("github", { redirectTo: "/settings" })
      }}
    >
      <Button className={cn(mobileCtaClass, className)} type="submit">
        Sign in with GitHub
      </Button>
    </form>
  )
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/settings" })
      }}
    >
      <Button
        className={cn(mobileCtaClass, className)}
        type="submit"
        variant="outline"
      >
        Sign out
      </Button>
    </form>
  )
}
