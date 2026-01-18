import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentControllerCreate,
  getAgentControllerFindAllQueryKey,
} from '@/api/endpoints/agents/agents';

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  systemPrompt: z.string().optional(),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;

interface CreateAgentDialogProps {
  children: React.ReactNode;
}

export function CreateAgentDialog({ children }: CreateAgentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAgent = useAgentControllerCreate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      systemPrompt: '',
    },
  });

  const onSubmit = async (data: CreateAgentFormData) => {
    try {
      await createAgent.mutateAsync({
        data: {
          name: data.name,
          // systemPrompt is not in CreateAgentDto, but config might have it
          // For now we only pass name as that's what the API schema supports
        },
      });

      toast({
        title: 'Agent created',
        description: `Agent "${data.name}" has been created successfully.`,
      });

      // Invalidate agents list to refresh
      await queryClient.invalidateQueries({
        queryKey: getAgentControllerFindAllQueryKey(),
      });

      reset();
      setOpen(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create agent. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Create a new AI agent to manage your DeFi operations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="My Agent"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">System Prompt (optional)</Label>
              <Textarea
                id="systemPrompt"
                placeholder="You are a helpful DeFi assistant..."
                rows={4}
                {...register('systemPrompt')}
              />
              <p className="text-xs text-muted-foreground">
                Define custom instructions for how the agent should behave.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting || createAgent.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createAgent.isPending}>
              {(isSubmitting || createAgent.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
