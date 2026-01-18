import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

/**
 * Skeleton for agent item in sidebar
 */
export function AgentItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

/**
 * Skeleton for list of agents in sidebar
 */
export function AgentsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <AgentItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for session item in sidebar
 */
export function SessionItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 ml-4">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

/**
 * Skeleton for list of sessions
 */
export function SessionsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <SessionItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a single message bubble in chat
 */
export function MessageBubbleSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={cn('space-y-2 max-w-[70%]', isUser ? 'items-end' : 'items-start')}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        {!isUser && <Skeleton className="h-4 w-64" />}
      </div>
    </div>
  );
}

/**
 * Skeleton for chat thread with multiple messages
 */
export function ChatThreadSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <MessageBubbleSkeleton isUser={false} />
      <MessageBubbleSkeleton isUser={true} />
      <MessageBubbleSkeleton isUser={false} />
    </div>
  );
}

/**
 * Skeleton for chat page header
 */
export function ChatHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex-1" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

/**
 * Full chat page skeleton
 */
export function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <ChatHeaderSkeleton />
      <div className="flex-1 overflow-hidden">
        <ChatThreadSkeleton />
      </div>
      <div className="flex-shrink-0 p-4 border-t border-border">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
