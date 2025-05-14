import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function useCreateField() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newField: { name: string }) => {
      const res = await client.api.fields.$post({
        json: newField,
      });
      if (!res.ok) {
        throw new Error('分野の作成に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
}
