"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query"
import { useToast } from "@/components/app/Toast"
import { api, ApiError, type One, type Page, type Query } from "./client"

/** Query keys are `[path, query]`, so `invalidate("/vehicles")` refreshes every view of vehicles. */
const keyOf = (path: string, query?: Query): QueryKey => [path, query ?? {}]

/** GET one resource (`{ data }` unwrapped) or any other JSON shape with `unwrap: false`. */
export function useResource<T>(
  path: string | null,
  query?: Query,
  options: { enabled?: boolean; refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: keyOf(path ?? "", query),
    queryFn: async () => (await api<One<T>>(path!, { query })).data,
    enabled: path !== null && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
  })
}

/** GET a response whose useful part is not under `data` (slots, passport, create-then-pay results). */
export function useRaw<T>(path: string | null, query?: Query, enabled = true) {
  return useQuery({
    queryKey: keyOf(path ?? "", query),
    queryFn: () => api<T>(path!, { query }),
    enabled: path !== null && enabled,
  })
}

/** A cursor-paged list: `items` grows as `loadMore()` is called. */
export function useList<T>(
  path: string | null,
  query?: Query,
  options: { enabled?: boolean; refetchInterval?: number } = {},
) {
  const result = useInfiniteQuery({
    queryKey: [...keyOf(path ?? "", query), "list"],
    queryFn: ({ pageParam }) =>
      api<Page<T>>(path!, { query: { ...query, cursor: pageParam } }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.meta?.next_cursor ?? undefined,
    enabled: path !== null && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
  })
  return {
    ...result,
    items: result.data?.pages.flatMap((page) => page.data) ?? [],
    hasMore: result.hasNextPage,
    loadMore: () => result.fetchNextPage(),
    loadingMore: result.isFetchingNextPage,
  }
}

/** A list whose response is `{ data: [...] }` with no paging. */
export function useItems<T>(
  path: string | null,
  query?: Query,
  options: { enabled?: boolean; refetchInterval?: number } = {},
) {
  const result = useResource<T[]>(path, query, options)
  return { ...result, items: result.data ?? [] }
}

type ActionOptions<Result> = {
  /** Paths whose cached views are refreshed after success. */
  invalidate?: string[]
  /** A message to show on success (or a function of the result). */
  success?: string | ((result: Result) => string)
  onSuccess?: (result: Result) => void
}

/**
 * A write (POST/PATCH/DELETE): shows the API's own error message in a toast if it fails, a success
 * message if it works, and refreshes what changed. Call `run(vars)`; `error` holds the `ApiError`
 * so forms can put field messages under their inputs.
 */
export function useAction<Vars, Result = unknown>(
  action: (vars: Vars) => Promise<Result>,
  options: ActionOptions<Result> = {},
) {
  const client = useQueryClient()
  const notify = useToast()

  const mutation = useMutation<Result, ApiError, Vars>({
    mutationFn: action,
    onSuccess: async (result) => {
      await Promise.all(
        (options.invalidate ?? []).map((path) =>
          client.invalidateQueries({ queryKey: [path] }),
        ),
      )
      if (options.success) {
        notify(
          typeof options.success === "function"
            ? options.success(result)
            : options.success,
        )
      }
      options.onSuccess?.(result)
    },
    onError: (error) => {
      // Field-level problems are shown beside the inputs; everything else is a toast.
      if (error.code !== "validation_failed") notify(error.message, "error")
    },
  })

  return {
    run: mutation.mutate,
    runAsync: mutation.mutateAsync,
    pending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

/** The first problem for a field from the last failed action. */
export const fieldError = (error: ApiError | null, name: string) =>
  error?.code === "validation_failed" ? error.field(name) : undefined
