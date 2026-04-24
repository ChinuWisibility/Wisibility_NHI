import { create } from 'zustand'

interface Breadcrumb {
  label: string
  href?: string
}

interface UIState {
  sidebarOpen:  boolean
  activeModal:  string | null
  breadcrumbs:  Breadcrumb[]
  toggleSidebar: () => void
  openModal:    (id: string) => void
  closeModal:   () => void
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen:  true,
  activeModal:  null,
  breadcrumbs:  [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal:     (id) => set({ activeModal: id }),
  closeModal:    () => set({ activeModal: null }),
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}))
