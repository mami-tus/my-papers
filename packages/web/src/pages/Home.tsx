import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useFieldsList } from '../hooks/useFieldsList';
import { CreateFieldModal } from '../components/CreateFieldModal';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { fields, isLoading, error } = useFieldsList();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">Error occurred</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">my-papers</h1>
        <Button onClick={() => setIsModalOpen(true)} size="default">
          <PlusCircle className="w-4 h-4" />
          Add Field
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(fields) && fields.length > 0 ? (
          fields.map((field) => (
            <Button
              key={field.id}
              variant="secondary"
              className="w-full h-24 text-xl font-semibold"
              onClick={() =>
                navigate(`/fields/${field.id}`, {
                  state: { fieldName: field.name },
                })
              }
            >
              {field.name}
            </Button>
          ))
        ) : (
          <p className="col-span-3 text-center py-8 text-muted-foreground">
            No research fields yet. Create one with "Add Field" button.
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
