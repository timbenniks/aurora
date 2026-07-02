ALTER TABLE "task_index" ADD COLUMN "cursor_agent_id" text;--> statement-breakpoint
ALTER TABLE "task_index" ADD COLUMN "cursor_run_id" text;--> statement-breakpoint
ALTER TABLE "task_index" ADD COLUMN "cursor_run_status" text;--> statement-breakpoint
ALTER TABLE "task_index" ADD COLUMN "cursor_agent_url" text;--> statement-breakpoint
ALTER TABLE "task_index" ADD COLUMN "cursor_launched_at" timestamp with time zone;