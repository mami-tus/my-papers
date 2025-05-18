import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function useSuggestPapers() {
  return useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await client.api.fields[':id'].papers.suggest.$post({
        param: { id: fieldId },
      });

      if (!res.ok) {
        throw new Error('Failed to suggest related papers');
      }

      const data = await res.json();
      return data;
    },
  });
}
