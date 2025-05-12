import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateField } from '../hooks/useCreateField';

interface CreateFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFieldModal({ isOpen, onClose }: CreateFieldModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useCreateField();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Field name is required');
      return;
    }
    mutate(
      { name },
      {
        onSuccess: () => {
          onClose();
          setName('');
          setError(null);
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : 'An unexpected error occurred',
          );
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground rounded-lg p-6 w-full max-w-md shadow-lg border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Field</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Field Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="e.g., Machine Learning"
              maxLength={100}
            />
          </div>

          {error && (
            <div className="mb-4 text-destructive text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
