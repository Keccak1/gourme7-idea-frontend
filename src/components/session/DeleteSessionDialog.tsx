import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
import { customInstance, ApiError } from '@/api/axios-instance';
import type { Session } from '@/types/api';

interface DeleteSessionDialogProps {
  session: Session;
  agentId: string;
  children: React.ReactNode;
  onDeleted?: () => void;
}

// Manual delete function since it's not yet in generated API
async function deleteSession(sessionId: string) {
  return customInstance<{ data: { success: boolean }; status: number }>(`/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export function DeleteSessionDialog({
  session,
  agentId,
  children,
  onDeleted,
}: DeleteSessionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteSessionMutation = useMutation({
    mutationFn: () => deleteSession(session.id),
    onSuccess: async () => {
      toast({
        title: 'Session deleted',
        description: 'The session has been deleted successfully.',
      });

      // Invalidate sessions list to refresh
      await queryClient.invalidateQueries({
        queryKey: ['agents', agentId, 'sessions'],
      });

      onDeleted?.();
    },
    onError: (error) => {
      console.error('Failed to delete session:', error);

      let description = 'Failed to delete session. Please try again.';

      if (error instanceof ApiError) {
        if (error.status === 409) {
          description = 'Cannot delete session while streaming is active. Please wait for it to complete.';
        } else if (error.status === 404) {
          description = 'Session not found. It may have already been deleted.';
        } else {
          description = error.message;
        }
      }

      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async () => {
    await deleteSessionMutation.mutateAsync();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this session? This action cannot be undone and all
            conversation history will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSessionMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSessionMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
