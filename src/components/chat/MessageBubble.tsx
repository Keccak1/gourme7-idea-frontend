import type { FC } from 'react';
import { MessagePrimitive, ActionBarPrimitive } from '@assistant-ui/react';
import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
} from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCallDisplay } from './tool-displays';
import { useCurrentAgentName } from '@/stores/sessionStore';

/**
 * User message component
 */
export const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-3xl gap-y-2 py-4 mx-auto animate-message-appear">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-1">You</div>
          <div className="text-foreground">
            <MessagePrimitive.Content />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

/**
 * Assistant avatar with gradient
 */
const AssistantAvatar: FC = () => {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm transition-transform duration-200 hover:scale-105">
      <Bot className="w-4 h-4 text-white" />
    </div>
  );
};

/**
 * Assistant message component
 */
export const AssistantMessage: FC = () => {
  const agentName = useCurrentAgentName();

  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-3xl gap-y-2 py-4 mx-auto group animate-message-appear">
      <div className="flex items-start gap-3">
        {/* Assistant avatar */}
        <AssistantAvatar />

        {/* Message content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-1">{agentName ?? 'Agent'}</div>
          <div className="max-w-none">
            <MessagePrimitive.Content
              components={{
                Text: TextContent,
                tools: {
                  Fallback: ToolCallContent,
                },
              }}
            />
          </div>

          {/* Action bar */}
          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ActionBarPrimitive.Copy asChild>
              <CopyButton />
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

/**
 * Memoized markdown components for better performance and consistent styling
 */
const markdownComponents = memoizeMarkdownComponents({
  // Headings with proper spacing
  h1: ({ className, ...props }) => (
    <h1 className={cn('text-2xl font-bold mt-6 mb-3 first:mt-0', className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn('text-xl font-semibold mt-5 mb-2.5 first:mt-0', className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn('text-lg font-semibold mt-4 mb-2 first:mt-0', className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn('text-base font-semibold mt-4 mb-2 first:mt-0', className)} {...props} />
  ),
  h5: ({ className, ...props }) => (
    <h5 className={cn('text-sm font-semibold mt-3 mb-1.5 first:mt-0', className)} {...props} />
  ),
  h6: ({ className, ...props }) => (
    <h6 className={cn('text-sm font-medium mt-3 mb-1.5 first:mt-0', className)} {...props} />
  ),

  // Paragraphs with proper spacing
  p: ({ className, ...props }) => (
    <p className={cn('my-3 leading-relaxed first:mt-0 last:mb-0', className)} {...props} />
  ),

  // Links
  a: ({ className, ...props }) => (
    <a
      className={cn('text-primary underline underline-offset-2 hover:text-primary/80', className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),

  // Blockquotes
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn('border-l-4 border-muted-foreground/30 pl-4 my-4 italic text-muted-foreground', className)}
      {...props}
    />
  ),

  // Lists with proper spacing
  ul: ({ className, ...props }) => (
    <ul className={cn('my-3 ml-4 list-disc space-y-1.5 first:mt-0 last:mb-0', className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn('my-3 ml-4 list-decimal space-y-1.5 first:mt-0 last:mb-0', className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn('leading-relaxed', className)} {...props} />,

  // Horizontal rule
  hr: ({ className, ...props }) => <hr className={cn('my-6 border-border', className)} {...props} />,

  // Tables with full styling
  table: ({ className, ...props }) => (
    <div className="my-4 overflow-x-auto first:mt-0 last:mb-0">
      <table
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn('bg-muted/50', className)} {...props} />
  ),
  tbody: ({ className, ...props }) => <tbody className={className} {...props} />,
  tr: ({ className, ...props }) => (
    <tr className={cn('border-b border-border last:border-0', className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'px-3 py-2 text-left font-semibold text-foreground border border-border bg-muted/70',
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn('px-3 py-2 border border-border', className)} {...props} />
  ),

  // Inline code
  code: ({ className, ...props }) => (
    <code
      className={cn(
        'bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground',
        className
      )}
      {...props}
    />
  ),

  // Code blocks
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        'my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm font-mono first:mt-0 last:mb-0',
        className
      )}
      {...props}
    />
  ),

  // Strong/bold
  strong: ({ className, ...props }) => (
    <strong className={cn('font-semibold', className)} {...props} />
  ),

  // Emphasis/italic
  em: ({ className, ...props }) => <em className={cn('italic', className)} {...props} />,
});

/**
 * Text content component with streaming support
 * Shows a thinking indicator when text is empty (waiting for first token)
 */
const TextContent: FC<{ text: string }> = ({ text }) => {
  // Show thinking indicator when waiting for first token
  if (!text || text.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-typing-bounce" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-typing-bounce animation-delay-100" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-typing-bounce animation-delay-200" />
        </div>
      </div>
    );
  }

  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
      className="text-foreground leading-relaxed"
    />
  );
};

/**
 * Tool call content component
 * Renders tool calls with proper styling based on tool type
 * Uses assistant-ui's status prop to determine the execution state
 */
interface ToolCallContentProps {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: { type: 'running' | 'complete' | 'incomplete' | 'requires-action'; reason?: string; error?: unknown };
}

const ToolCallContent: FC<ToolCallContentProps> = ({ toolCallId, toolName, args, result, status }) => {
  // Map assistant-ui status to ToolCallDisplay state
  const getState = (): 'pending' | 'running' | 'completed' | 'error' => {
    switch (status.type) {
      case 'running':
        return 'running';
      case 'complete':
        return 'completed';
      case 'incomplete':
        // incomplete with reason 'error' should show error state
        if (status.reason === 'error') return 'error';
        return 'completed'; // cancelled or other reasons
      case 'requires-action':
        return 'running'; // waiting for user action
      default:
        return 'running';
    }
  };

  const isError = status.type === 'incomplete' && status.reason === 'error';

  return (
    <ToolCallDisplay
      toolCallId={toolCallId}
      toolName={toolName}
      args={args}
      state={getState()}
      result={result}
      isError={isError}
    />
  );
};

/**
 * Copy button component
 */
const CopyButton: FC<{ className?: string }> = ({ className }) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'h-8 w-8 p-0',
        'border border-input bg-background',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      <MessagePrimitive.If copied>
        <Check className="h-4 w-4 text-green-500" />
      </MessagePrimitive.If>
      <MessagePrimitive.If copied={false}>
        <Copy className="h-4 w-4" />
      </MessagePrimitive.If>
    </button>
  );
};

/**
 * Edit composer for user messages (when editing)
 */
export const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-3xl gap-y-2 py-4 mx-auto">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-muted-foreground mb-1">You (editing)</div>
          <div className="rounded-lg border border-primary bg-background p-3">
            <MessagePrimitive.Content />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

export { TextContent, ToolCallContent, CopyButton };
