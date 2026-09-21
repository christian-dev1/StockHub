import { useQuery } from '@tanstack/react-query';
import { getSystemHealth } from '../../system.module';

export const systemHealthQueryKey = ['system', 'health'] as const;

export function useSystemHealth() {
  return useQuery({
    queryKey: systemHealthQueryKey,
    queryFn: ({ signal }) => getSystemHealth(signal),
    refetchInterval: 60_000,
  });
}
