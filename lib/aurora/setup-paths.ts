import { DEFAULT_GENERATE_FILES } from "@/lib/aurora/types"

/** Paths Aurora expects for agent-ready repositories. */
export const AURORA_SETUP_PATHS = [...DEFAULT_GENERATE_FILES] as const

export type AuroraSetupPath = (typeof AURORA_SETUP_PATHS)[number]
