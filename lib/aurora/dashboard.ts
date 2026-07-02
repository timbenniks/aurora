import { auth } from "@/auth"
import {
  listWorkspacesForUser,
  type WorkspaceListItem,
} from "@/lib/aurora/workspaces"

export type DashboardWorkspaces = {
  signedIn: boolean
  workspaces: WorkspaceListItem[]
}

export async function getDashboardWorkspaces(): Promise<DashboardWorkspaces> {
  const session = await auth()

  if (!session?.githubUserId) {
    return { signedIn: false, workspaces: [] }
  }

  const workspaces = await listWorkspacesForUser(session.githubUserId)

  return { signedIn: true, workspaces }
}
