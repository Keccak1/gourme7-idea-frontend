import { useState, type FC } from 'react';
import { AlertTriangle, Clock, Check, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToolCallDisplay } from './tool-displays';
import {
  useApprovalControllerApprove,
  useApprovalControllerReject,
} from '@/api/endpoints/approvals/approvals';

interface ApprovalData {
  id: string;
  toolCall: {
    type: 'tool-call';
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  };
  summary: string;
  expiresAt: string;
}

interface ApprovalDialogProps {
  approval: ApprovalData | null;
  onClose: () => void;
  onApproved?: () => void;
  onRejected?: () => void;
}

/**
 * Calculate time remaining until expiration
 */
const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  }
  return `${seconds}s remaining`;
};

/**
 * ApprovalDialog component
 * Shows a dialog when a tool call requires user approval before execution
 */
export const ApprovalDialog: FC<ApprovalDialogProps> = ({
  approval,
  onClose,
  onApproved,
  onRejected,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useApprovalControllerApprove();
  const rejectMutation = useApprovalControllerReject();

  const handleApprove = async () => {
    if (!approval) return;

    setIsProcessing(true);
    setError(null);

    try {
      await approveMutation.mutateAsync({ id: approval.id });
      onApproved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approval) return;

    setIsProcessing(true);
    setError(null);

    try {
      await rejectMutation.mutateAsync({ id: approval.id });
      onRejected?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
      setIsProcessing(false);
    }
  };

  if (!approval) return null;

  const isExpired = new Date(approval.expiresAt) <= new Date();
  const timeRemaining = getTimeRemaining(approval.expiresAt);

  return (
    <Dialog open={!!approval} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Action Requires Approval
          </DialogTitle>
          <DialogDescription>
            The AI agent wants to perform the following action. Please review and approve or reject.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="py-2">
          <p className="text-sm text-foreground">{approval.summary}</p>
        </div>

        {/* Tool call details */}
        <div className="border rounded-lg p-2 bg-muted/30">
          <ToolCallDisplay
            toolCallId={approval.toolCall.toolCallId}
            toolName={approval.toolCall.toolName}
            args={approval.toolCall.args}
            state="pending"
          />
        </div>

        {/* Expiration warning */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={isExpired ? 'text-red-500' : 'text-muted-foreground'}>
            {timeRemaining}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReject} disabled={isProcessing || isExpired}>
            {isProcessing && rejectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing || isExpired}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing && approveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalDialog;
export type { ApprovalData, ApprovalDialogProps };
