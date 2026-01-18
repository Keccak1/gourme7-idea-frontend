import { useState } from 'react';
import { Wallet, ChevronDown, Loader2, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWalletControllerFindAll } from '@/api/endpoints/wallets/wallets';
import { customInstance } from '@/api/axios-instance';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { WalletListResponseDto, WalletListResponseDtoDataItem } from '@/api/schemas';

interface AgentWalletSelectorProps {
  agentId: string;
  agentName: string;
  currentWalletId?: string | null;
  currentWalletAddress?: string | null;
}

// Helper to shorten address
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// API call to update agent wallet
async function updateAgentWallet(agentId: string, walletId: string | null): Promise<void> {
  await customInstance(`/agents/${agentId}/wallet`, {
    method: 'PATCH',
    body: JSON.stringify({ walletId }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export function AgentWalletSelector({
  agentId,
  agentName,
  currentWalletId,
  currentWalletAddress,
}: AgentWalletSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<WalletListResponseDtoDataItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all wallets
  const { data: walletsData, isLoading: isLoadingWallets } = useWalletControllerFindAll(undefined, {
    query: {
      enabled: isOpen,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletsResponse = (walletsData as any)?.data as WalletListResponseDto | undefined;
  const wallets = walletsResponse?.data ?? [];

  // Filter available wallets (not assigned to other agents OR currently assigned to this agent)
  const availableWallets = wallets.filter(
    (wallet) => wallet.agentId === null || wallet.agentId === agentId
  );

  // Find current wallet details
  const currentWallet = wallets.find((w) => w.id === currentWalletId);

  const handleSelectWallet = (wallet: WalletListResponseDtoDataItem) => {
    if (wallet.id === currentWalletId) {
      // Already selected, do nothing
      setIsOpen(false);
      return;
    }
    setPendingWallet(wallet);
    setIsRemoving(false);
    setConfirmDialogOpen(true);
    setIsOpen(false);
  };

  const handleRemoveWallet = () => {
    setPendingWallet(null);
    setIsRemoving(true);
    setConfirmDialogOpen(true);
    setIsOpen(false);
  };

  const handleConfirmChange = async () => {
    setIsUpdating(true);
    try {
      const walletIdToSet = isRemoving ? null : pendingWallet?.id ?? null;
      await updateAgentWallet(agentId, walletIdToSet);

      // Invalidate agent query to refresh data
      await queryClient.invalidateQueries({
        queryKey: [`/agents/${agentId}`],
      });

      // Also invalidate wallets to update agentId references
      await queryClient.invalidateQueries({
        queryKey: ['/wallets'],
      });

      toast({
        title: isRemoving ? 'Wallet removed' : 'Wallet assigned',
        description: isRemoving
          ? `Wallet has been removed from agent "${agentName}".`
          : `Wallet "${pendingWallet?.name}" has been assigned to agent "${agentName}".`,
      });
    } catch (error) {
      console.error('Failed to update wallet:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update wallet assignment. Please try again.',
      });
    } finally {
      setIsUpdating(false);
      setConfirmDialogOpen(false);
      setPendingWallet(null);
      setIsRemoving(false);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8"
            disabled={isUpdating}
          >
            <Wallet className="h-3.5 w-3.5" />
            {currentWalletAddress ? (
              <span className="font-mono text-xs">
                {shortenAddress(currentWalletAddress)}
              </span>
            ) : (
              <span className="text-muted-foreground">No wallet</span>
            )}
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Select Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isLoadingWallets ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : availableWallets.length > 0 ? (
            <>
              {availableWallets.map((wallet) => (
                <DropdownMenuItem
                  key={wallet.id}
                  onClick={() => handleSelectWallet(wallet)}
                  className={cn(
                    'flex items-center justify-between cursor-pointer',
                    wallet.id === currentWalletId && 'bg-accent'
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{wallet.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {shortenAddress(wallet.address)}
                    </span>
                  </div>
                  {wallet.id === currentWalletId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No available wallets
            </div>
          )}

          {currentWalletId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRemoveWallet}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <X className="h-4 w-4 mr-2" />
                Remove wallet
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRemoving ? 'Remove wallet from agent?' : 'Change agent wallet?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRemoving ? (
                <>
                  Are you sure you want to remove the wallet from agent "{agentName}"?
                  <br />
                  <br />
                  <span className="text-muted-foreground text-xs">
                    Note: This change will be logged for audit purposes.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to assign wallet "{pendingWallet?.name}" to agent "{agentName}"?
                  {currentWallet && (
                    <>
                      <br />
                      <br />
                      Current wallet "{currentWallet.name}" will be unassigned.
                    </>
                  )}
                  <br />
                  <br />
                  <span className="text-muted-foreground text-xs">
                    Note: This change will be logged for audit purposes.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChange}
              disabled={isUpdating}
              className={cn(
                isRemoving && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRemoving ? 'Removing...' : 'Assigning...'}
                </>
              ) : (
                isRemoving ? 'Remove wallet' : 'Assign wallet'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
