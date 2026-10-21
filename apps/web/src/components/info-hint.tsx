'use client';

import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GLOSSARY, type GlossaryKey } from '@/lib/glossary';
import { cn } from '@/lib/utils';

/**
 * Inline explanation of a piece of jargon. Hovering (or focusing) the dotted
 * term reveals a plain-English definition, so non-technical readers never have
 * to leave the page to understand what a word means.
 */
export function InfoHint({
  text,
  title,
  children,
  className,
  side = 'top',
}: {
  text: string;
  title?: string;
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className={cn(
              'cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              className,
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-sm">
        <span className="block">
          {title ? <strong className="mb-0.5 block">{title}</strong> : null}
          {text}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** `InfoHint` backed by the shared glossary, so wording stays consistent. */
export function GlossaryHint({
  term,
  children,
  className,
  showIcon = false,
  side = 'top',
}: {
  term: GlossaryKey;
  children?: ReactNode;
  className?: string;
  showIcon?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  const entry = GLOSSARY[term];

  return (
    <InfoHint
      text={entry.explanation}
      title={entry.term}
      side={side}
      className={className}
    >
      {children ?? (
        <span className="inline-flex items-center gap-1">
          {entry.term}
          {showIcon ? <HelpCircle className="size-3.5 opacity-70" /> : null}
        </span>
      )}
    </InfoHint>
  );
}

/** Standalone help icon that reveals some text. */
export function HelpDot({
  text,
  title,
  side = 'top',
}: {
  text: string;
  title?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <InfoHint
      text={text}
      title={title}
      side={side}
      className="decoration-transparent"
    >
      <HelpCircle className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
    </InfoHint>
  );
}
