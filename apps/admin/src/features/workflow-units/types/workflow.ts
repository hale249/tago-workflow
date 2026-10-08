export type TriggerType = "ACTIVE_TABLE" | "SCHEDULE" | "WEBHOOK" | "FORM"

export type WorkflowStep = {
  id: string
  name: string
  type: string
  config: Record<string, unknown>
  /** Upstream step ids; "start-node" is the trigger. */
  depends_on: string[]
  position: { x: number; y: number }
}

/** Edge leaving a branch port (e.g. condition "true", email "on_open"); plain edges live in `depends_on` only. */
export type WorkflowEdge = { source: string; target: string; label: string }

export type WorkflowUnit = { id: string; name: string; description: string; createdAt: string; updatedAt: string }

export type WorkflowEvent = {
  id: string
  unitId: string
  name: string
  active: boolean
  trigger: { type: TriggerType; params: Record<string, string> }
  startPosition: { x: number; y: number }
  steps: WorkflowStep[]
  /** Branch labels for dependencies (YAML `edges`), keyed by source + target. */
  edges?: WorkflowEdge[]
  createdAt: string
  updatedAt: string
}

export type LogLevel = "debug" | "info" | "warn" | "error"
export type WorkflowLog = { id: string; eventId: string; at: string; level: LogLevel; stepId?: string; message: string }
