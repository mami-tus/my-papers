import { PlusCircle } from 'lucide-react';
import { useFields } from '../hooks/useFields';

export default function Home() {
  const { fields, isLoading, error } = useFields();

  if (isLoading) return <div className="p-8">読み込み中...</div>;
  if (error) return <div className="p-8">エラーが発生しました</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Research Map</h1>
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2"
          onClick={() => alert('分野追加ダイアログを実装予定')}
        >
          <PlusCircle className="w-4 h-4" />
          Add Research Field
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(fields) && fields.length > 0 ? (
          fields.map((field) => (
            <button
              key={field.id}
              type="button"
              className="border rounded-lg p-6 hover:shadow-md transition cursor-pointer"
              onClick={() =>
                alert(`分野ID: ${field.id} の詳細ページへ移動予定`)
              }
            >
              <h2 className="text-xl font-semibold">{field.name}</h2>
            </button>
          ))
        ) : (
          <p className="col-span-3 text-center py-8 text-gray-500">
            研究分野がまだありません。「新しい分野を追加」から作成してください。
          </p>
        )}
      </div>
    </div>
  );
}
