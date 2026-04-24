import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertService } from '@/services/alert.service'
import { useAlertStore } from '@/stores/alertStore'
import { useEffect } from 'react'

export function useAlerts() {
  const setAlerts = useAlertStore((s) => s.setAlerts)

  const query = useQuery({
    queryKey:       ['alerts', 'open'],
    queryFn:        () => alertService.list({ status: 'OPEN', limit: 100 }),
    refetchInterval: 5_000,
  })

  useEffect(() => {
    if (query.data?.items) setAlerts(query.data.items)
  }, [query.data, setAlerts])

  return query
}

export function useDismissAlert() {
  const qc = useQueryClient()
  const dismiss = useAlertStore((s) => s.dismissAlert)
  return useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      alertService.dismiss(id, justification),
    onSuccess: (_, { id }) => {
      dismiss(id)
      qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
