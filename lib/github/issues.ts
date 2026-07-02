import type { GeneratedIssue } from "@/lib/aurora/types"
import type { LaunchBrief } from "@/lib/aurora/types"
import { githubApiRequest } from "@/lib/github/client"
import {
  resolveMilestoneNumber,
  type MilestoneMap,
} from "@/lib/github/milestones"

type GitHubIssue = {
  number: number
  title: string
  html_url: string
}

export type CreatedIssue = {
  number: number
  title: string
  url: string
  taskId: string
}

export async function createIssues(
  owner: string,
  repo: string,
  issues: GeneratedIssue[],
  briefMilestones: LaunchBrief["milestones"],
  milestoneMap: MilestoneMap,
  token: string
): Promise<CreatedIssue[]> {
  const created: CreatedIssue[] = []

  for (const issue of issues) {
    const milestone = resolveMilestoneNumber(
      issue.milestone,
      briefMilestones,
      milestoneMap
    )

    const body: Record<string, unknown> = {
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    }

    if (milestone !== undefined) {
      body.milestone = milestone
    }

    const result = await githubApiRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    )

    created.push({
      number: result.number,
      title: result.title,
      url: result.html_url,
      taskId: issue.taskId,
    })
  }

  return created
}
