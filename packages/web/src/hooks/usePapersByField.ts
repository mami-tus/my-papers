import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function usePapersByField(fieldId?: string) {
  const query = useQuery({
    queryKey: ['papers', fieldId],
    queryFn: async () => {
      if (!fieldId) {
        throw new Error('Field ID is required');
      }

      console.log('Requesting URL for fieldId:', fieldId);
      const res = await client.api.fields[':id'].papers.$get({
        param: { id: fieldId },
      });
      console.log('Response status:', res.status);

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
