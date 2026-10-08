import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { FormType, WorkflowForm } from "../types/form"
import { formsApi } from "./forms.api"

export const formKeys = { all: ["workflow-forms"] as const, list: () => [...formKeys.all, "list"] as const, detail: (id: string) => [...formKeys.all, id] as const }
export const formsListQuery = () => ({ queryKey: formKeys.list(), queryFn: formsApi.list })
export const useForms = () => useQuery(formsListQuery())
export const useForm = (id: string) => useQuery({ queryKey: formKeys.detail(id), queryFn: () => formsApi.get(id) })

function useWrite<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: formKeys.all }) })
}
export const useCreateForm = () => useWrite((v: { name: string; description: string; formType: FormType }) => formsApi.create(v))
export const useUpdateForm = (id: string) => useWrite((p: Partial<Pick<WorkflowForm, "name" | "description" | "formType" | "config">>) => formsApi.update(id, p))
export const useDeleteForm = () => useWrite((id: string) => formsApi.remove(id))
