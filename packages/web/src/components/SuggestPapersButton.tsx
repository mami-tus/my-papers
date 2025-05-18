import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, Plus, ExternalLink, Check, Sparkles } from 'lucide-react';
import { useSuggestPapers } from '@/hooks/useSuggestPapers';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from './ui/card';
import { useCreatePaper } from '@/hooks/useCreatePaper';
import { toast } from '@/lib/utils';

interface SuggestPapersButtonProps {
  fieldId: number;
  fieldName: string;
}

export function SuggestPapersButton({
  fieldId,
  fieldName,
}: SuggestPapersButtonProps) {
  const [open, setOpen] = useState(false);
  const [registeredDois, setRegisteredDois] = useState<string[]>([]);
  const { mutate, isPending, data, error } = useSuggestPapers();
  const createPaper = useCreatePaper();

  const handleSuggest = () => {
    setRegisteredDois([]);
    mutate(String(fieldId));
  };

  // Register paper function
  const handleRegisterPaper = (doi: string) => {
    createPaper.mutate(
      { doi, fieldId },
      {
        onSuccess: () => {
          setRegisteredDois((prev) => [...prev, doi]);
          toast({
            title: 'Paper registered',
            description: 'The paper has been added to your collection',
          });
        },
        onError: (error) => {
          toast({
            title: 'Registration failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  // Type-safe handling of response data
  const responseData = data;
  const suggestedPapers = responseData?.suggestedPapers || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" onClick={handleSuggest}>
          <Sparkles className="h-4 w-4 text-blue-500" />
          AI Suggested Papers
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[90vw] sm:max-w-[900px] overflow-y-auto"
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Suggested Papers for {fieldName}
          </SheetTitle>
          <SheetDescription>
            Papers recommended by AI based on your collection
          </SheetDescription>
        </SheetHeader>

        {isPending && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">
              AI is searching for related papers...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            <p className="font-medium">An error occurred</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        )}

        {data && !isPending && suggestedPapers.length > 0 && (
          <div className="grid gap-4 mt-4 pr-4">
            {suggestedPapers.map((paper) => (
              <Card key={paper.doi} className="hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="text-xl leading-tight">
                    {paper.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(paper.authors) && paper.authors
                      ? paper.authors.join(', ')
                      : 'Unknown authors'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-muted-foreground">
                      {paper.year
                        ? `Published: ${new Date(
                            paper.year,
                            paper.month || 0,
                            paper.day || 1,
                          ).toLocaleDateString()}`
                        : 'Publication date unknown'}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
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

                  {registeredDois.includes(paper.doi) ? (
                    <Button variant="ghost" size="sm" disabled>
                      <Check className="h-4 w-4 mr-1" />
                      Added
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRegisterPaper(paper.doi)}
                      disabled={createPaper.isPending}
                    >
                      {createPaper.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Add Paper
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {data && !isPending && suggestedPapers.length === 0 && (
          <div className="p-4 bg-muted/40 text-muted-foreground rounded-lg mt-4">
            <p>
              No related papers found. Try adding more papers to your
              collection.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
