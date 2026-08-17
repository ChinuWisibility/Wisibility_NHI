import { create } from 'zustand'

interface Breadcrumb {
  label: string
  href?: string
}

interface UIState {
  sidebarOpen:  boolean
  activeModal:  string | null
  breadcrumbs:  Breadcrumb[]
  theme:        'dark' | 'light'
  toggleSidebar: () => void
  openModal:    (id: string) => void
  closeModal:   () => void
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void
  toggleTheme:   () => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen:  true,
  activeModal:  null,
  breadcrumbs:  [],
  theme:        (localStorage.getItem('theme') as 'dark' | 'light') || 'light',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal:     (id) => set({ activeModal: id }),
  closeModal:    () => set({ activeModal: null }),
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      return { theme: newTheme }
    }),
}))
