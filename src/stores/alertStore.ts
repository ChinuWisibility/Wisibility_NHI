import { create } from 'zustand'
import type { Alert } from '@/types/alert.types'

interface AlertState {
  activeAlerts: Alert[]
  alertCount:   number
  hasUnread:    boolean
  setAlerts:    (alerts: Alert[]) => void
  markRead:     () => void
  dismissAlert: (alertId: string) => void
}

export const useAlertStore = create<AlertState>()((set) => ({
  activeAlerts: [],
  alertCount:   0,
  hasUnread:    false,

  setAlerts: (alerts) =>
    set({ activeAlerts: alerts, alertCount: alerts.length, hasUnread: alerts.length > 0 }),

  markRead: () => set({ hasUnread: false }),

  dismissAlert: (alertId) =>
    set((state) => {
      const filtered = state.activeAlerts.filter((a) => a.alertId !== alertId)
      return { activeAlerts: filtered, alertCount: filtered.length }
    }),
}))
