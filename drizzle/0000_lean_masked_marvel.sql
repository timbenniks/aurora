CREATE TYPE "public"."account_type" AS ENUM('User', 'Organization');--> statement-breakpoint
CREATE TYPE "public"."created_from" AS ENUM('launch_brief', 'existing_repo', 'imported');--> statement-breakpoint
CREATE TYPE "public"."issue_state" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "github_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_installation_id" bigint NOT NULL,
	"account_login" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_installations_github_installation_id_unique" UNIQUE("github_installation_id")
);
--> statement-breakpoint
CREATE TABLE "task_index" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"github_issue_id" bigint,
	"issue_number" integer NOT NULL,
	"title" text NOT NULL,
	"state" "issue_state" DEFAULT 'open' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"risk" text,
	"priority" text,
	"milestone" text,
	"labels_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_pr_number" integer,
	"agent_command" text,
	"agent_prompt" text,
	"task_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_user_id" bigint NOT NULL,
	"github_login" text NOT NULL,
	"name" text,
	"email" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_user_id_unique" UNIQUE("github_user_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"has_agents_md" boolean DEFAULT false NOT NULL,
	"has_bugbot_md" boolean DEFAULT false NOT NULL,
	"has_approval_policy" boolean DEFAULT false NOT NULL,
	"has_cursor_rules" boolean DEFAULT false NOT NULL,
	"has_routing_policy" boolean DEFAULT false NOT NULL,
	"has_issue_template" boolean DEFAULT false NOT NULL,
	"has_pr_template" boolean DEFAULT false NOT NULL,
	"has_validation_workflow" boolean DEFAULT false NOT NULL,
	"open_agent_tasks" integer DEFAULT 0 NOT NULL,
	"active_agent_tasks" integer DEFAULT 0 NOT NULL,
	"open_agent_prs" integer DEFAULT 0 NOT NULL,
	"blocked_prs" integer DEFAULT 0 NOT NULL,
	"merged_agent_prs" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_status_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_installation_id" uuid NOT NULL,
	"github_repo_id" bigint NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"full_name" text NOT NULL,
	"default_branch" text NOT NULL,
	"visibility" text NOT NULL,
	"project_type" text NOT NULL,
	"workflow_preset" text NOT NULL,
	"created_from" "created_from" NOT NULL,
	"enabled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_scanned_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_index" ADD CONSTRAINT "task_index_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_status" ADD CONSTRAINT "workspace_status_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_github_installation_id_github_installations_id_fk" FOREIGN KEY ("github_installation_id") REFERENCES "public"."github_installations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "task_index_workspace_issue_idx" ON "task_index" USING btree ("workspace_id","issue_number");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_github_repo_id_idx" ON "workspaces" USING btree ("github_repo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_owner_repo_idx" ON "workspaces" USING btree ("owner","repo");