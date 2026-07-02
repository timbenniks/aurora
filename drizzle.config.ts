import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { defineConfig } from "drizzle-kit"

function loadLocalEnv() {
  const root = process.cwd()

  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file)

    if (existsSync(path)) {
      process.loadEnvFile(path)
    }
  }
}

loadLocalEnv()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local or run: vercel env pull"
  )
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
