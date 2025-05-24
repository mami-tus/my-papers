import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { usePapersByField } from '@/hooks/usePapersByField';
import { CreatePaperModal } from '@/components/CreatePaperModal';
import { SuggestPapersButton } from '@/components/SuggestPapersButton';
import { Toaster } from '@/components/ui/sonner';
import { PaperRelationshipFlow } from '@/components/PaperRelationshipFlow';

export default function FieldDetail() {
  // Get route parameters and state
  const { id: fieldId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get field name from navigation state
  const fieldName = location.state?.fieldName;

  // Fetch papers related to this field
  const {
    papers,
    isLoading: papersLoading,
    error: papersError,
  } = usePapersByField(fieldId);

  const isLoading = papersLoading;
  const error = papersError;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          An error occurred. Please return to the home screen.
        </div>
        <Button className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-2 -ml-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{fieldName}</h1>
        </div>
        <div className="flex gap-2">
          <SuggestPapersButton
            fieldId={Number(fieldId)}
            fieldName={fieldName || 'Field'}
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Paper
          </Button>
        </div>
      </div>

      {/* Papers list */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {papers && papers.length > 0 ? (
          papers.map((paper) => (
            <Card key={paper.id} className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="text-xl leading-tight">
                  {paper.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(paper.authors)
                    ? paper.authors.join(', ')
                    : paper.authors}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-muted-foreground">
                    Published:{' '}
                    {new Date(
                      paper.year || 0,
                      paper.month || 0,
                      paper.day || 0,
                    ).toLocaleDateString()}
                  </p>
                  {paper.doi && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`https://doi.org/${paper.doi}`, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Paper
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-muted/40 rounded-lg">
            <p className="text-muted-foreground">
              No papers yet. Use the "Add Paper" button to register one.
            </p>
          </div>
        )}
      </div> */}

      {/* Papers list */}
      <div className="w-full h-full">
        {papers && papers.length > 0 ? (
          <PaperRelationshipFlow papers={papers} />
        ) : (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <p className="text-muted-foreground">
              No papers yet. Use the "Add Paper" button to register one.
            </p>
          </div>
        )}
      </div>

      {/* Paper creation modal */}
      <CreatePaperModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        fieldId={fieldId || ''}
      />

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
