import { create } from 'zustand'
import type { NHI, NHIListParams } from '@/types/nhi.types'

interface NHIState {
  selectedNHI:      NHI | null
  inventoryFilters: NHIListParams
  sortColumn:       string
  sortDirection:    'asc' | 'desc'
  setSelectedNHI:   (nhi: NHI | null) => void
  setFilters:       (filters: Partial<NHIListParams>) => void
  resetFilters:     () => void
  setSort:          (column: string, direction: 'asc' | 'desc') => void
}

const defaultFilters: NHIListParams = { page: 1, limit: 50 }

export const useNHIStore = create<NHIState>()((set) => ({
  selectedNHI:      null,
  inventoryFilters: defaultFilters,
  sortColumn:       'riskScore',
  sortDirection:    'desc',

  setSelectedNHI: (nhi) => set({ selectedNHI: nhi }),

  setFilters: (filters) =>
    set((state) => ({
      inventoryFilters: { ...state.inventoryFilters, ...filters, page: 1 },
    })),

  resetFilters: () => set({ inventoryFilters: defaultFilters }),

  setSort: (column, direction) =>
    set({ sortColumn: column, sortDirection: direction }),
}))
