import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { discoveryService } from '@/services/discovery.service'
import { useConnectorStore } from '@/stores/connectorStore'

export function useConnectors() {
  const setConnectors = useConnectorStore((s) => s.setConnectors)
  return useQuery({
    queryKey: ['connectors'],
    queryFn:  async () => {
      const list = await discoveryService.listConnectors()
      setConnectors(list)
      return list
    },
  })
}

export function useTriggerDiscovery() {
  const qc          = useQueryClient()
  const setActiveRun = useConnectorStore((s) => s.setActiveRun)
  return useMutation({
    mutationFn: (connectors: Parameters<typeof discoveryService.trigger>[0]) =>
      discoveryService.trigger(connectors),
    onSuccess: ({ runId }) => {
      setActiveRun(runId)
      qc.invalidateQueries({ queryKey: ['discovery-runs'] })
      qc.invalidateQueries({ queryKey: ['connectors'] })
      qc.invalidateQueries({ queryKey: ['nhi-summary'] })
    },
  })
}

export function useDiscoveryRuns() {
  return useQuery({
    queryKey: ['discovery-runs'],
    queryFn:  () => discoveryService.listRuns(),
  })
}

export function useTestConnector() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => discoveryService.testConnector(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connectors'] })
      qc.invalidateQueries({ queryKey: ['connector'] })
    },
  })
}
