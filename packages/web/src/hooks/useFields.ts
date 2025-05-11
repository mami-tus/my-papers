import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useFields() {
  const queryClient = useQueryClient();

  // 一覧取得
  const fields = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const res = await client.api.fields.$get();
      return await res.json();
    },
  });

  // 新規作成（後で使う）
  const createField = useMutation({
    mutationFn: async (newField: { name: string; description?: string }) => {
      const res = await client.api.fields.$post({
        json: newField,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });

  return {
    fields: fields.data || [],
    isLoading: fields.isLoading,
    error: fields.error,
    createField,
  };
}
