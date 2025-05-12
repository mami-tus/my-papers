import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useFieldsList } from '../hooks/useFieldsList';
import { CreateFieldModal } from '../components/CreateFieldModal';

export default function Home() {
  const { fields, isLoading, error } = useFieldsList();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">Error occurred</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">my-papers</h1>
        <button
          type="button"
          className="px-4 py-2 bg-primary text-primary-foreground rounded flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusCircle className="w-4 h-4" />
          Add Field
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(fields) && fields.length > 0 ? (
          fields.map((field) => (
            <button
              key={field.id}
              type="button"
              className="border border-border rounded-lg p-6 hover:shadow-md transition cursor-pointer bg-card text-card-foreground"
              onClick={() =>
                alert(`Field ID: ${field.id} will navigate to detail page`)
              }
            >
              <h2 className="text-xl font-semibold">{field.name}</h2>
            </button>
          ))
        ) : (
          <p className="col-span-3 text-center py-8 text-muted-foreground">
            No research fields yet. Create one with "Add Research Field" button.
          </p>
        )}
      </div>

      <CreateFieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
