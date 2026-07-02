import { LAUNCH_BRIEF_SCHEMA_VERSION, DEFAULT_GENERATE_FILES } from "@/lib/aurora/types"

/** Minimal valid launch brief for manual testing and future fixtures. */
export const exampleLaunchBrief = {
  schema_version: LAUNCH_BRIEF_SCHEMA_VERSION,
  project: {
    name: "TinyInvoices",
    repo_name: "tinyinvoices",
    description: "A simple invoice app for freelancers.",
    visibility: "private" as const,
    project_type: "web_app" as const,
  },
  product: {
    problem: "Freelancers need a simple way to create and send invoices.",
    target_users: ["solo freelancers", "small agencies"],
    mvp_goal: "Create, manage, and export invoices as PDFs.",
    mvp_scope: [
      "Create clients",
      "Create invoices",
      "Export invoices as PDFs",
    ],
    non_goals: [
      "Payments",
      "Accounting integrations",
      "Multi-language support",
    ],
  },
  technical: {
    stack: {
      framework: "nextjs",
      language: "typescript",
      package_manager: "npm",
      styling: "tailwind_v4",
      ui: "shadcn_ui",
      database: "postgres",
      orm: "drizzle",
      auth: "authjs",
      deployment: "vercel",
    },
    validation_commands: ["npm run typecheck", "npm run lint", "npm run build"],
    risk_areas: ["authentication", "database_mutations", "pdf_generation"],
  },
  workflow: {
    preset: "safe_default" as const,
    default_branch: "main",
    agent_provider: "cursor" as const,
    agent_command: "/agent build",
    approval_policy: "safe_default",
    max_files_without_human_review: 10,
  },
  files: {
    generate: [...DEFAULT_GENERATE_FILES],
  },
  milestones: [
    {
      id: "milestone-001",
      title: "Project foundation",
      description:
        "Create the initial project skeleton and workflow foundation.",
    },
  ],
  tasks: [
    {
      id: "task-001",
      title: "Set up the project skeleton",
      milestone: "Project foundation",
      type: "setup" as const,
      priority: "high" as const,
      risk: "low" as const,
      goal: "Create the initial app structure, tooling, and baseline UI shell.",
      context:
        "The project uses Next.js, TypeScript, Tailwind CSS v4, shadcn/ui, and npm.",
      acceptance_criteria: [
        "Create the initial Next.js app structure.",
        "Add a basic home page.",
        "Add a shared layout.",
        "Ensure the app builds successfully.",
      ],
      likely_files: ["app/layout.tsx", "app/page.tsx", "package.json"],
      constraints: [
        "Do not add authentication yet.",
        "Do not add database persistence yet.",
      ],
      validation: ["npm run typecheck", "npm run lint", "npm run build"],
      labels: [
        "aurora:agent-task",
        "type:setup",
        "risk:low",
        "priority:high",
      ],
      agent_kickoff: {
        command: "/agent build",
        prompt:
          "Build this issue as a small focused PR. Implement only the initial project skeleton and baseline UI shell.",
        expected_pr_size: "small",
        human_review_required: false,
      },
    },
  ],
}
