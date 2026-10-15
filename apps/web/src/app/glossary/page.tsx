'use client';

import { GLOSSARY, GLOSSARY_ORDER } from '@/lib/glossary';
import { PageHeader } from '@/components/states';
import { Mono } from '@/components/bits';

export default function GlossaryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help"
        title="Glossary"
        description="Every term used in this dashboard, explained in plain English. Hover the dotted words anywhere in the app for the same definitions."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {GLOSSARY_ORDER.map((key) => {
          const entry = GLOSSARY[key];
          return (
            <div
              key={key}
              className="rounded-xl border border-border bg-card p-4 space-y-1.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium">{entry.term}</h3>
                <span className="text-[11px] text-muted-foreground">
                  {entry.short}
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-pretty">
                {entry.explanation}
              </p>
              {'example' in entry && entry.example ? (
                <p className="text-xs text-muted-foreground/80">
                  <Mono>{entry.example}</Mono>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
