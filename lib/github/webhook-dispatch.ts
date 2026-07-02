import { handleCheckRunWebhook } from "@/lib/github/webhook-handlers/check-run"
import { handleIssueCommentWebhook } from "@/lib/github/webhook-handlers/issue-comment"
import { handleIssuesWebhook } from "@/lib/github/webhook-handlers/issues"
import { handlePullRequestWebhook } from "@/lib/github/webhook-handlers/pull-request"
import { handlePushWebhook } from "@/lib/github/webhook-handlers/push"

export async function dispatchGitHubWebhook(
  eventName: string,
  payload: unknown
): Promise<{ ok: boolean; result?: unknown }> {
  switch (eventName) {
    case "ping":
      return { ok: true, result: { message: "pong" } }

    case "issues":
      return {
        ok: true,
        result: await handleIssuesWebhook(payload as Parameters<typeof handleIssuesWebhook>[0]),
      }

    case "pull_request":
      return {
        ok: true,
        result: await handlePullRequestWebhook(
          payload as Parameters<typeof handlePullRequestWebhook>[0]
        ),
      }

    case "push":
      return {
        ok: true,
        result: await handlePushWebhook(payload as Parameters<typeof handlePushWebhook>[0]),
      }

    case "check_run":
      return {
        ok: true,
        result: await handleCheckRunWebhook(
          payload as Parameters<typeof handleCheckRunWebhook>[0]
        ),
      }

    case "check_suite":
      return { ok: true, result: { skipped: "handled_by_check_run" } }

    case "issue_comment":
      return {
        ok: true,
        result: await handleIssueCommentWebhook(
          payload as Parameters<typeof handleIssueCommentWebhook>[0]
        ),
      }

    default:
      return { ok: true, result: { skipped: eventName } }
  }
}
