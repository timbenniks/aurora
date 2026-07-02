import Image from "next/image"
import { redirect } from "next/navigation"

import { auth, signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/")
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-3">
        <Image
          priority
          alt="Aurora"
          className="h-auto w-full max-w-sm"
          height={181}
          src="/aurora.png"
          width={543}
        />
        <p className="text-lg text-muted-foreground">
          Tim&apos;s token furnace
        </p>
      </div>

      <form
        action={async () => {
          "use server"
          await signIn("github", { redirectTo: "/" })
        }}
      >
        <Button size="lg" type="submit">
          Sign in with GitHub
        </Button>
      </form>
    </main>
  )
}
