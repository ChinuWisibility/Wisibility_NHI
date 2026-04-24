import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postureService } from '@/services/posture.service'

export function usePostureReport() {
  return useQuery({
    queryKey: ['posture-report'],
    queryFn:  () => postureService.getReport(),
  })
}

export function usePostureIssues(params?: Parameters<typeof postureService.listIssues>[0]) {
  return useQuery({
    queryKey: ['posture-issues', params],
    queryFn:  () => postureService.listIssues(params),
  })
}

export function useRemediateIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (issueId: string) => postureService.remediate(issueId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['posture-issues'] }),
  })
}
