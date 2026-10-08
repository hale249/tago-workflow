import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { WorkflowEvent, WorkflowUnit } from "../types/workflow"
import { workflowApi } from "./workflow.api"

export const workflowKeys = {
  all: ["workflow"] as const,
  units: () => [...workflowKeys.all, "units"] as const,
  unit: (id: string) => [...workflowKeys.all, "unit", id] as const,
  events: (unitId: string) => [...workflowKeys.all, "events", unitId] as const,
  event: (id: string) => [...workflowKeys.all, "event", id] as const,
  logs: (eventId: string) => [...workflowKeys.all, "logs", eventId] as const,
}

export const useUnits = () => useQuery({ queryKey: workflowKeys.units(), queryFn: workflowApi.listUnits })
export const useUnit = (id: string) => useQuery({ queryKey: workflowKeys.unit(id), queryFn: () => workflowApi.getUnit(id) })
export const useEvents = (unitId: string) => useQuery({ queryKey: workflowKeys.events(unitId), queryFn: () => workflowApi.listEvents(unitId) })
export const useEvent = (id: string) => useQuery({ queryKey: workflowKeys.event(id), queryFn: () => workflowApi.getEvent(id) })
export const useLogs = (eventId: string, live: boolean) =>
  useQuery({ queryKey: workflowKeys.logs(eventId), queryFn: () => workflowApi.listLogs(eventId), refetchInterval: live ? 400 : false })

function useWrite<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.all }) })
}
export const useSaveUnit = () => useWrite((v: Pick<WorkflowUnit, "name" | "description"> & { id?: string }) => workflowApi.saveUnit(v))
export const useDeleteUnit = () => useWrite((id: string) => workflowApi.deleteUnit(id))
export const useSaveEvent = () => useWrite((e: Omit<WorkflowEvent, "id" | "createdAt" | "updatedAt"> & { id?: string }) => workflowApi.saveEvent(e))
export const useDeleteEvent = () => useWrite((id: string) => workflowApi.deleteEvent(id))
export const useClearLogs = () => useWrite((eventId: string) => workflowApi.clearLogs(eventId))
export const useTestRun = () => useWrite((eventId: string) => workflowApi.testRun(eventId))
