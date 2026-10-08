import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { RecordData, RecordItem, RecordQuery, TableConfig, TableTemplate } from "../types/table"
import { tablesApi } from "./tables.api"

export const tableKeys = {
  all: ["tables"] as const,
  workGroups: () => [...tableKeys.all, "work-groups"] as const,
  users: () => [...tableKeys.all, "users"] as const,
  list: () => [...tableKeys.all, "list"] as const,
  counts: () => [...tableKeys.all, "counts"] as const,
  detail: (id: string) => [...tableKeys.all, "detail", id] as const,
  records: (tableId: string) => [...tableKeys.all, "records", tableId] as const,
  recordList: (tableId: string, q: RecordQuery) => [...tableKeys.records(tableId), "list", q] as const,
  record: (tableId: string, id: string) => [...tableKeys.records(tableId), "detail", id] as const,
  comments: (recordId: string) => [...tableKeys.all, "comments", recordId] as const,
}

export const workGroupsQuery = () => queryOptions({ queryKey: tableKeys.workGroups(), queryFn: tablesApi.listWorkGroups })
export const usersQuery = () => queryOptions({ queryKey: tableKeys.users(), queryFn: tablesApi.listUsers, staleTime: Infinity })
export const tablesListQuery = () => queryOptions({ queryKey: tableKeys.list(), queryFn: tablesApi.listTables })
export const tableQuery = (id: string) => queryOptions({ queryKey: tableKeys.detail(id), queryFn: () => tablesApi.getTable(id) })
export const recordsQuery = (tableId: string, q: RecordQuery = {}) =>
  queryOptions({ queryKey: tableKeys.recordList(tableId, q), queryFn: () => tablesApi.listRecords(tableId, q), placeholderData: (prev) => prev })
export const recordQuery = (tableId: string, id: string) =>
  queryOptions({ queryKey: tableKeys.record(tableId, id), queryFn: () => tablesApi.getRecord(tableId, id) })

export const useWorkGroups = () => useQuery(workGroupsQuery())
export const useWorkspaceUsers = () => useQuery(usersQuery())
export const useTables = () => useQuery(tablesListQuery())
export const useRecordCounts = () => useQuery({ queryKey: tableKeys.counts(), queryFn: tablesApi.recordCounts })
export const useTable = (id: string) => useQuery(tableQuery(id))
export const useRecords = (tableId: string, q: RecordQuery = {}) => useQuery(recordsQuery(tableId, q))
export const useRecord = (tableId: string, id: string) => useQuery(recordQuery(tableId, id))
export const useComments = (recordId: string) =>
  useQuery({ queryKey: tableKeys.comments(recordId), queryFn: () => tablesApi.listComments(recordId) })

/** Any write invalidates the whole "tables" tree — cheap with a local store, always consistent. */
function useInvalidatingMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.all }) })
}

export const useCreateWorkGroup = () => useInvalidatingMutation((v: { name: string; description?: string }) => tablesApi.createWorkGroup(v))
export const useCreateTable = () =>
  useInvalidatingMutation((v: { name: string; description?: string; workGroupId: string; template: TableTemplate }) => tablesApi.createTable(v))
export const useUpdateTable = (id: string) =>
  useInvalidatingMutation((patch: { name?: string; description?: string; workGroupId?: string; icon?: string; iconColor?: string; config?: TableConfig }) => tablesApi.updateTable(id, patch))
export const useWorkspaceTeams = () => useQuery({ queryKey: [...tableKeys.all, "teams"], queryFn: tablesApi.listTeams, staleTime: Infinity })
export const useDeleteTable = () => useInvalidatingMutation((id: string) => tablesApi.deleteTable(id))

export const useCreateRecord = (tableId: string) =>
  useInvalidatingMutation(({ data, items }: { data: RecordData; items?: RecordItem[] }) => tablesApi.createRecord(tableId, data, items))
export const useUpdateRecord = (tableId: string) =>
  useInvalidatingMutation(({ id, patch, items }: { id: string; patch: RecordData; items?: RecordItem[] }) => tablesApi.updateRecord(tableId, id, patch, items))
export const useDeleteRecords = (tableId: string) => useInvalidatingMutation((ids: string[]) => tablesApi.deleteRecords(tableId, ids))

export const useCreateComment = (recordId: string) => useInvalidatingMutation((content: string) => tablesApi.createComment(recordId, content))
export const useUpdateComment = () => useInvalidatingMutation(({ id, content }: { id: string; content: string }) => tablesApi.updateComment(id, content))
export const useDeleteComment = () => useInvalidatingMutation((id: string) => tablesApi.deleteComment(id))
