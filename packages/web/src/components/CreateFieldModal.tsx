import { useCreateField } from '../hooks/useCreateField';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
});

interface CreateFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFieldModal({ isOpen, onClose }: CreateFieldModalProps) {
  const { mutate, isPending } = useCreateField();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(
      { name: values.name },
      {
        onSuccess: () => {
          onClose();
          form.reset();
        },
        onError: (err) => {
          form.setError('name', {
            message:
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred',
          });
        },
      },
    );
  }

  // モーダルが閉じるときにフォームをリセットする
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // モーダルが閉じられたときの処理
      form.reset();
      form.clearErrors();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Field</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Machine Learning"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
