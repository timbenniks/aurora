import type { LaunchBrief } from "@/lib/aurora/types"
import { GitHubApiError, githubApiRequest } from "@/lib/github/client"
import { isDuplicateGitHubResource } from "@/lib/github/github-errors"

type GitHubMilestone = {
  number: number
  title: string
}

export type MilestoneMap = Map<string, number>

function milestoneKey(title: string): string {
  return title.trim().toLowerCase()
}

async function listMilestones(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubMilestone[]> {
  return githubApiRequest<GitHubMilestone[]>(
    `/repos/${owner}/${repo}/milestones?state=all&per_page=100`,
    token
  )
}

function addMilestoneToMap(
  map: MilestoneMap,
  milestone: LaunchBrief["milestones"][number],
  number: number
) {
  map.set(milestoneKey(milestone.title), number)
  map.set(milestoneKey(milestone.id), number)
}

export async function createMilestones(
  owner: string,
  repo: string,
  milestones: LaunchBrief["milestones"],
  token: string
): Promise<{ map: MilestoneMap; created: number; reused: number }> {
  const map: MilestoneMap = new Map()
  let created = 0
  let reused = 0

  const existing = await listMilestones(owner, repo, token)
  const existingByTitle = new Map(
    existing.map((entry) => [milestoneKey(entry.title), entry.number])
  )

  for (const milestone of milestones) {
    const titleKey = milestoneKey(milestone.title)
    const existingNumber = existingByTitle.get(titleKey)

    if (existingNumber !== undefined) {
      addMilestoneToMap(map, milestone, existingNumber)
      reused += 1
      continue
    }

    try {
      const result = await githubApiRequest<GitHubMilestone>(
        `/repos/${owner}/${repo}/milestones`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            title: milestone.title,
            description: milestone.description,
            state: "open",
          }),
        }
      )

      existingByTitle.set(titleKey, result.number)
      addMilestoneToMap(map, milestone, result.number)
      created += 1
    } catch (error) {
      if (error instanceof GitHubApiError && isDuplicateGitHubResource(error)) {
        const refreshed = await listMilestones(owner, repo, token)
        const found = refreshed.find(
          (entry) => milestoneKey(entry.title) === titleKey
        )

        if (found) {
          existingByTitle.set(titleKey, found.number)
          addMilestoneToMap(map, milestone, found.number)
          reused += 1
          continue
        }
      }

      throw error
    }
  }

  return { map, created, reused }
}

export function resolveMilestoneNumber(
  milestoneRef: string | undefined,
  briefMilestones: LaunchBrief["milestones"],
  milestoneMap: MilestoneMap
): number | undefined {
  if (!milestoneRef?.trim()) {
    return undefined
  }

  const direct = milestoneMap.get(milestoneKey(milestoneRef))
  if (direct !== undefined) {
    return direct
  }

  const match = briefMilestones.find(
    (entry) => entry.id === milestoneRef || entry.title === milestoneRef
  )

  if (!match) {
    return undefined
  }

  return milestoneMap.get(milestoneKey(match.title))
}
