import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nhiService } from '@/services/nhi.service'
import { useNHIStore } from '@/stores/nhiStore'

export function useNHIList() {
  const filters = useNHIStore((s) => s.inventoryFilters)
  return useQuery({
    queryKey: ['nhi-list', filters],
    queryFn:  () => nhiService.list(filters),
  })
}

export function useNHIDetail(id: string) {
  return useQuery({
    queryKey: ['nhi', id],
    queryFn:  () => nhiService.getById(id),
    enabled:  !!id,
  })
}

export function useArchiveNHI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => nhiService.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nhi-list'] }),
  })
}
