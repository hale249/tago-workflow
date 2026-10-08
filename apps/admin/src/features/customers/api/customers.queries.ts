import { queryOptions, useQuery } from "@tanstack/react-query"

import { customersApi } from "./customers.api"

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
}

export const customersListQuery = () =>
  queryOptions({ queryKey: customerKeys.list(), queryFn: customersApi.list })

export const useCustomers = () => useQuery(customersListQuery())
