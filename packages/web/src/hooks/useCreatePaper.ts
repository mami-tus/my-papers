import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';

interface CreatePaperData {
  doi: string; // 論文のDOI（Digital Object Identifier）
  fieldId: number;
}

export function useCreatePaper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaperData) => {
      const res = await client.api.papers.$post({
        json: {
          doi: data.doi,
          fieldId: data.fieldId,
        },
      });

      if (!res.ok) {
        throw new Error('論文の登録に失敗しました');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      // 成功時、論文リストのキャッシュを更新
      queryClient.invalidateQueries({
        queryKey: ['papers', String(variables.fieldId)],
      });
    },
  });
}
