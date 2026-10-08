import { create } from "zustand"
import { persist } from "zustand/middleware"

import { SEED_EVENTS, SEED_UNITS } from "../data/seed"
import type { WorkflowEvent, WorkflowLog, WorkflowUnit } from "../types/workflow"

/** Local stand-in for the workflow backend. Only `workflow.api.ts` touches it. */
type State = { units: WorkflowUnit[]; events: WorkflowEvent[]; logs: WorkflowLog[] }

export const useWorkflowDb = create<State>()(
  persist(() => ({ units: SEED_UNITS, events: SEED_EVENTS, logs: [] as WorkflowLog[] }), { name: "tago-workflow-db", version: 3, migrate: () => ({ units: SEED_UNITS, events: SEED_EVENTS, logs: [] }) as State }),
)
