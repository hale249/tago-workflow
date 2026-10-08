import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { WorkflowForm } from "../types/form"

/** Local stand-in for the forms backend (starts empty, like the reference workspace). */
export const useFormsDb = create<{ forms: WorkflowForm[] }>()(persist(() => ({ forms: [] as WorkflowForm[] }), { name: "tago-forms-db", version: 1 }))
