import { useState } from 'react';
import { Wallet, Plus, Trash2, Eye, RefreshCw, AlertCircle, Coins } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  useWalletControllerFindAll,
  useWalletControllerCreate,
  useWalletControllerDelete,
  useWalletControllerGetAssets,
  getWalletControllerFindAllQueryKey,
} from '@/api/endpoints/wallets/wallets';
import type {
  WalletListResponseDto,
  WalletListResponseDtoDataItem,
  WalletAssetsResponseDto,
} from '@/api/schemas';
import { toast } from '@/hooks/use-toast';

// Helper to shorten address
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Wallet Table Component
function WalletsTable({
  wallets,
  onDelete,
  onViewAssets,
}: {
  wallets: WalletListResponseDtoDataItem[];
  onDelete: (wallet: WalletListResponseDtoDataItem) => void;
  onViewAssets: (wallet: WalletListResponseDtoDataItem) => void;
}) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Name
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Address
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Type
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((wallet) => (
            <tr key={wallet.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-medium">{wallet.name}</td>
              <td className="p-4 align-middle">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {shortenAddress(wallet.address)}
                </code>
              </td>
              <td className="p-4 align-middle">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {wallet.type}
                </span>
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onViewAssets(wallet)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Assets</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(wallet)}
                    disabled={wallet.agentId !== null}
                    title={
                      wallet.agentId ? 'Cannot delete wallet assigned to agent' : 'Delete wallet'
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Create Wallet Form Component
function CreateWalletForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const queryClient = useQueryClient();
  const createMutation = useWalletControllerCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createMutation.mutateAsync({
        data: { name, address, privateKey },
      });

      if (response.status === 201) {
        toast({
          title: 'Wallet created',
          description: `Wallet "${name}" has been created successfully.`,
        });
        setOpen(false);
        setName('');
        setAddress('');
        setPrivateKey('');
        queryClient.invalidateQueries({ queryKey: getWalletControllerFindAllQueryKey() });
        onSuccess();
      } else if (response.status === 409) {
        toast({
          variant: 'destructive',
          title: 'Wallet already exists',
          description: 'A wallet with this address already exists.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create wallet. Please check your input.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add DEV Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add DEV Wallet</DialogTitle>
            <DialogDescription>
              Create a development wallet with private key stored in database. For local development
              only!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Development Wallet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                pattern="^0x[a-fA-F0-9]{40}$"
                title="Valid Ethereum address (0x followed by 40 hex characters)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                required
                pattern="^0x[a-fA-F0-9]{64}$"
                title="Valid private key (0x followed by 64 hex characters)"
              />
              <p className="text-xs text-muted-foreground">
                Warning: Private key will be stored in database. Use only for development!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Wallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Assets Dialog Component
function AssetsDialog({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletListResponseDtoDataItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError, refetch } = useWalletControllerGetAssets(
    wallet?.id ?? '',
    { network: 'base' },
    {
      query: {
        enabled: !!wallet && open,
      },
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assets = (data as any)?.data as WalletAssetsResponseDto | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Assets: {wallet?.name}
          </DialogTitle>
          <DialogDescription>
            {wallet && (
              <code className="text-xs">
                {shortenAddress(wallet.address)} on {assets?.network ?? 'base'}
              </code>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load assets</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : assets?.tokens && assets.tokens.length > 0 ? (
            <div className="space-y-2">
              {assets.tokens.map((token) => (
                <div
                  key={token.address}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">{token.balanceFormatted}</p>
                    {token.usdValue !== null && (
                      <p className="text-xs text-muted-foreground">${token.usdValue.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
              {assets.totalUsdValue !== null && (
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <span className="font-medium">Total Value</span>
                  <span className="font-mono font-bold">${assets.totalUsdValue.toFixed(2)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tokens found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({
  wallet,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  wallet: WalletListResponseDtoDataItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete wallet "{wallet?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Main Page Component
export function WalletsPage() {
  const [selectedWallet, setSelectedWallet] = useState<WalletListResponseDtoDataItem | null>(null);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<WalletListResponseDtoDataItem | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useWalletControllerFindAll();
  const deleteMutation = useWalletControllerDelete();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletsResponse = (data as any)?.data as WalletListResponseDto | undefined;
  const wallets = walletsResponse?.data ?? [];

  const handleViewAssets = (wallet: WalletListResponseDtoDataItem) => {
    setSelectedWallet(wallet);
    setAssetsDialogOpen(true);
  };

  const handleDeleteClick = (wallet: WalletListResponseDtoDataItem) => {
    setWalletToDelete(wallet);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!walletToDelete) return;

    try {
      const response = await deleteMutation.mutateAsync({ id: walletToDelete.id });

      if (response.status === 200) {
        toast({
          title: 'Wallet deleted',
          description: `Wallet "${walletToDelete.name}" has been deleted.`,
        });
        queryClient.invalidateQueries({ queryKey: getWalletControllerFindAllQueryKey() });
      } else if (response.status === 409) {
        toast({
          variant: 'destructive',
          title: 'Cannot delete wallet',
          description: 'This wallet is assigned to an agent.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete wallet.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete wallet.',
      });
    } finally {
      setDeleteDialogOpen(false);
      setWalletToDelete(null);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Wallets</CardTitle>
                <CardDescription>Manage your development wallets</CardDescription>
              </div>
            </div>
            <CreateWalletForm onSuccess={() => {}} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">Failed to load wallets</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Make sure the backend is running
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          ) : wallets.length > 0 ? (
            <WalletsTable
              wallets={wallets}
              onDelete={handleDeleteClick}
              onViewAssets={handleViewAssets}
            />
          ) : (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium">No wallets yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add a DEV wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets Dialog */}
      <AssetsDialog
        wallet={selectedWallet}
        open={assetsDialogOpen}
        onOpenChange={setAssetsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        wallet={walletToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
