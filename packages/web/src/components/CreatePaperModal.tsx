import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreatePaper } from '@/hooks/useCreatePaper';

const formSchema = z.object({
  doi: z.string().min(1, 'DOI is required'),
});

interface CreatePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
}

export function CreatePaperModal({
  isOpen,
  onClose,
  fieldId,
}: CreatePaperModalProps) {
  const { mutate, isPending } = useCreatePaper();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doi: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(
      {
        doi: values.doi,
        fieldId: Number.parseInt(fieldId, 10),
      },
      {
        onSuccess: () => {
          onClose();
          form.reset();
        },
        onError: (err: Error) => {
          console.error('Paper creation failed:', err);
          form.setError('root', {
            message: err.message || 'Failed to save paper',
          });
        },
      },
    );
  }

  // Reset form when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      form.clearErrors();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Paper</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="doi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DOI *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="10.xxxx/xxxxx" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground">
              <p>Enter a DOI to automatically fetch paper information.</p>
              <p>Example DOI: 10.1000/xyz123</p>
            </div>

            {form.formState.errors.root && (
              <div className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
