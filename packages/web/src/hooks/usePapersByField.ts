import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function usePapersByField(fieldId?: string) {
  const query = useQuery({
    queryKey: ['papers', fieldId],
    queryFn: async () => {
      if (!fieldId) {
        throw new Error('Field ID is required');
      }

      const res = await client.api.fields[':id'].papers.$get({
        param: { id: fieldId },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch papers');
      }

      return res.json();
    },

    enabled: !!fieldId,
  });

  return {
    papers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
