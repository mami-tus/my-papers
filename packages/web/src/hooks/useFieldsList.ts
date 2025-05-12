import { useQuery } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useFieldsList() {
  const fields = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const res = await client.api.fields.$get();
      return await res.json();
    },
  });

  return {
    fields: fields.data || [],
    isLoading: fields.isLoading,
    error: fields.error,
  };
}
