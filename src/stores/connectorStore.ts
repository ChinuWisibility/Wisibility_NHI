import { create } from 'zustand'
import type { ConnectorConfig, DiscoveryRun } from '@/types/connector.types'

interface ConnectorState {
  connectors:        ConnectorConfig[]
  activeRunId:       string | null
  lastDiscoveryRun?: DiscoveryRun
  setConnectors:     (connectors: ConnectorConfig[]) => void
  setActiveRun:      (runId: string | null) => void
  setLastRun:        (run: DiscoveryRun) => void
}

export const useConnectorStore = create<ConnectorState>()((set) => ({
  connectors:    [],
  activeRunId:   null,

  setConnectors: (connectors) => set({ connectors }),
  setActiveRun:  (runId) => set({ activeRunId: runId }),
  setLastRun:    (run) => set({ lastDiscoveryRun: run }),
}))
