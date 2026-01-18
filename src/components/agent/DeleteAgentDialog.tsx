import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentControllerArchive,
  getAgentControllerFindAllQueryKey,
} from '@/api/endpoints/agents/agents';
import type { Agent } from '@/types/api';

interface DeleteAgentDialogProps {
  agent: Agent;
  children: React.ReactNode;
  onDeleted?: () => void;
}

export function DeleteAgentDialog({ agent, children, onDeleted }: DeleteAgentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const archiveAgent = useAgentControllerArchive();

  const handleDelete = async () => {
    try {
      await archiveAgent.mutateAsync({ id: agent.id });

      toast({
        title: 'Agent deleted',
        description: `Agent "${agent.name}" has been deleted.`,
      });

      // Invalidate agents list to refresh
      await queryClient.invalidateQueries({
        queryKey: getAgentControllerFindAllQueryKey(),
      });

      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete agent. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete agent &quot;{agent.name}&quot;? This action cannot be
            undone and all sessions associated with this agent will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveAgent.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={archiveAgent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {archiveAgent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
