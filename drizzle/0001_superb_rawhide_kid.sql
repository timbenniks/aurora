CREATE TYPE "public"."pr_state" AS ENUM('open', 'closed', 'merged');--> statement-breakpoint
CREATE TABLE "pr_index" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"github_pr_id" bigint NOT NULL,
	"pr_number" integer NOT NULL,
	"title" text NOT NULL,
	"state" "pr_state" DEFAULT 'open' NOT NULL,
	"branch" text,
	"author" text,
	"source_issue_number" integer,
	"agent_provider" text,
	"ci_status" text,
	"bugbot_status" text,
	"approval_status" text,
	"human_review_required" boolean,
	"merged_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_delivery_id" text NOT NULL,
	"event_name" text NOT NULL,
	"workspace_id" uuid,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_deliveries_github_delivery_id_unique" UNIQUE("github_delivery_id")
);
--> statement-breakpoint
ALTER TABLE "pr_index" ADD CONSTRAINT "pr_index_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pr_index_workspace_pr_number_idx" ON "pr_index" USING btree ("workspace_id","pr_number");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_index_github_pr_id_idx" ON "pr_index" USING btree ("github_pr_id");