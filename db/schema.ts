import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const accountTypeEnum = pgEnum("account_type", ["User", "Organization"])

export const createdFromEnum = pgEnum("created_from", [
  "launch_brief",
  "existing_repo",
  "imported",
])

export const issueStateEnum = pgEnum("issue_state", ["open", "closed"])

export const prStateEnum = pgEnum("pr_state", ["open", "closed", "merged"])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  githubUserId: bigint("github_user_id", { mode: "number" }).notNull().unique(),
  githubLogin: text("github_login").notNull(),
  name: text("name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const githubInstallations = pgTable(
  "github_installations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    githubInstallationId: bigint("github_installation_id", { mode: "number" })
      .notNull()
      .unique(),
    accountLogin: text("account_login").notNull(),
    accountType: accountTypeEnum("account_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
)

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubInstallationId: uuid("github_installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "restrict" }),
    githubRepoId: bigint("github_repo_id", { mode: "number" }).notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    fullName: text("full_name").notNull(),
    defaultBranch: text("default_branch").notNull(),
    visibility: text("visibility").notNull(),
    projectType: text("project_type").notNull(),
    workflowPreset: text("workflow_preset").notNull(),
    createdFrom: createdFromEnum("created_from").notNull(),
    enabledAt: timestamp("enabled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspaces_github_repo_id_idx").on(table.githubRepoId),
    uniqueIndex("workspaces_owner_repo_idx").on(table.owner, table.repo),
  ]
)

export const workspaceStatus = pgTable(
  "workspace_status",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" })
      .unique(),
    readinessScore: integer("readiness_score").notNull().default(0),
    hasAgentsMd: boolean("has_agents_md").notNull().default(false),
    hasBugbotMd: boolean("has_bugbot_md").notNull().default(false),
    hasApprovalPolicy: boolean("has_approval_policy").notNull().default(false),
    hasCursorRules: boolean("has_cursor_rules").notNull().default(false),
    hasRoutingPolicy: boolean("has_routing_policy").notNull().default(false),
    hasIssueTemplate: boolean("has_issue_template").notNull().default(false),
    hasPrTemplate: boolean("has_pr_template").notNull().default(false),
    hasValidationWorkflow: boolean("has_validation_workflow")
      .notNull()
      .default(false),
    openAgentTasks: integer("open_agent_tasks").notNull().default(0),
    activeAgentTasks: integer("active_agent_tasks").notNull().default(0),
    openAgentPrs: integer("open_agent_prs").notNull().default(0),
    blockedPrs: integer("blocked_prs").notNull().default(0),
    mergedAgentPrs: integer("merged_agent_prs").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
)

export const taskIndex = pgTable(
  "task_index",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    githubIssueId: bigint("github_issue_id", { mode: "number" }),
    issueNumber: integer("issue_number").notNull(),
    title: text("title").notNull(),
    state: issueStateEnum("state").notNull().default("open"),
    status: text("status").notNull().default("open"),
    risk: text("risk"),
    priority: text("priority"),
    milestone: text("milestone"),
    labelsJson: jsonb("labels_json").$type<string[]>().notNull().default([]),
    linkedPrNumber: integer("linked_pr_number"),
    agentCommand: text("agent_command"),
    agentPrompt: text("agent_prompt"),
    taskId: text("task_id"),
    cursorAgentId: text("cursor_agent_id"),
    cursorRunId: text("cursor_run_id"),
    cursorRunStatus: text("cursor_run_status"),
    cursorAgentUrl: text("cursor_agent_url"),
    cursorLaunchedAt: timestamp("cursor_launched_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("task_index_workspace_issue_idx").on(
      table.workspaceId,
      table.issueNumber
    ),
  ]
)

export const prIndex = pgTable(
  "pr_index",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    githubPrId: bigint("github_pr_id", { mode: "number" }).notNull(),
    prNumber: integer("pr_number").notNull(),
    title: text("title").notNull(),
    state: prStateEnum("state").notNull().default("open"),
    branch: text("branch"),
    author: text("author"),
    sourceIssueNumber: integer("source_issue_number"),
    agentProvider: text("agent_provider"),
    ciStatus: text("ci_status"),
    bugbotStatus: text("bugbot_status"),
    approvalStatus: text("approval_status"),
    humanReviewRequired: boolean("human_review_required"),
    mergedAt: timestamp("merged_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pr_index_workspace_pr_number_idx").on(
      table.workspaceId,
      table.prNumber
    ),
    uniqueIndex("pr_index_github_pr_id_idx").on(table.githubPrId),
    index("pr_index_workspace_state_idx").on(table.workspaceId, table.state),
    index("pr_index_status_idx").on(table.approvalStatus, table.ciStatus),
  ]
)

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    githubDeliveryId: text("github_delivery_id").notNull().unique(),
    eventName: text("event_name").notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    payloadHash: text("payload_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
)

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  installation: one(githubInstallations, {
    fields: [workspaces.githubInstallationId],
    references: [githubInstallations.id],
  }),
  status: one(workspaceStatus, {
    fields: [workspaces.id],
    references: [workspaceStatus.workspaceId],
  }),
  tasks: many(taskIndex),
  pullRequests: many(prIndex),
}))

export const workspaceStatusRelations = relations(workspaceStatus, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceStatus.workspaceId],
    references: [workspaces.id],
  }),
}))

export const taskIndexRelations = relations(taskIndex, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [taskIndex.workspaceId],
    references: [workspaces.id],
  }),
}))

export const prIndexRelations = relations(prIndex, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [prIndex.workspaceId],
    references: [workspaces.id],
  }),
}))

export const webhookDeliveriesRelations = relations(
  webhookDeliveries,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [webhookDeliveries.workspaceId],
      references: [workspaces.id],
    }),
  })
)
