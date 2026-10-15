'use client';

import { Check, ChevronRight, Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * A styled native <details>. Used for "technical details" so the interesting,
 * plain-English content stays visible and the jargon stays tucked away.
 */
export function Disclosure({
  summary,
  children,
  className,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className={cn(
        'group rounded-lg border border-border bg-muted/30',
        className,
      )}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
        {summary}
      </summary>
      <div className="border-t border-border/70 px-3 py-2.5 text-xs">
        {children}
      </div>
    </details>
  );
}

/** Inline monospace token (selectors, ids, values). */
export function Mono({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em] break-all text-foreground/90',
        className,
      )}
    >
      {children}
    </code>
  );
}

/** Copy-to-clipboard button that confirms inline (no toast dependency). */
export function CopyButton({
  value,
  label = 'Copy',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
      title={`${label}: ${value}`}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Label above a value, used in the detail grids. */
export function Field({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

/** A short error/`actionTaken` string in a scrollable mono block. */
export function RawBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <pre
      className={cn(
        'max-h-56 overflow-auto rounded-lg border border-border bg-background/60 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-muted-foreground',
        className,
      )}
    >
      {children}
    </pre>
  );
}
