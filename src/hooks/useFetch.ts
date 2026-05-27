import { useState, useEffect, useCallback, useRef } from 'react'

interface UseFetchState<T> {
  data: T
  loading: boolean
  error: string | null
}

export function useFetch<T>(fetchFn: () => Promise<T>, deps: unknown[] = [], fallback: T) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: fallback,
    loading: true,
    error: null,
  })

  const mountedRef = useRef(true)

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetchFn()
      if (mountedRef.current) setState({ data, loading: false, error: null })
    } catch (error) {
      if (mountedRef.current) setState({ data: fallback, loading: false, error: (error as Error).message })
    }
  }, deps)

  useEffect(() => {
    mountedRef.current = true
    refetch()
    return () => { mountedRef.current = false }
  }, [refetch])

  return { ...state, refetch }
}
