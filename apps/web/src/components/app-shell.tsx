'use client';

import {
  Activity,
  BookOpen,
  FlaskConical,
  GitPullRequest,
  LayoutDashboard,
  ListChecks,
  PlayCircle,
  PlusCircle,
  Server,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { api } from '@/lib/api';
import { useResource, type Resource } from '@/hooks/use-resource';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        description: 'What is green, what broke, what needs review',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    heading: 'Tests',
    items: [
      {
        href: '/tests',
        label: 'All tests',
        description: 'Every saved test and what it checks',
        icon: ListChecks,
      },
      {
        href: '/intent',
        label: 'Describe a test',
        description: 'Turn a sentence into a test',
        icon: PlusCircle,
      },
    ],
  },
  {
    heading: 'Execution',
    items: [
      {
        href: '/runs',
        label: 'Runs',
        description: 'Every time a test was executed',
        icon: PlayCircle,
      },
      {
        href: '/traces',
        label: 'Traces',
        description: 'Step-by-step diary of every run',
        icon: Activity,
      },
    ],
  },
  {
    heading: 'Review',
    items: [
      {
        href: '/promotions',
        label: 'Suggested fixes',
        description: 'Accept or reject AI-created repairs',
        icon: GitPullRequest,
      },
    ],
  },
  {
    heading: 'Help',
    items: [
      {
        href: '/glossary',
        label: 'Glossary',
        description: 'Every term, explained simply',
        icon: BookOpen,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';

  return pathname === href || pathname.startsWith(`${href}/`);
}

function ConnectionStatus({
  health,
}: {
  health: Resource<{ status: string }>;
}) {
  const connected = health.data?.status === 'ok';
  const label = health.loading
    ? 'Checking API…'
    : connected
      ? 'API connected'
      : 'API unreachable';

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn(
          'size-2 rounded-full',
          health.loading
            ? 'bg-muted-foreground'
            : connected
              ? 'bg-emerald-400'
              : 'bg-red-400',
        )}
      />
      <Server className="size-3.5" />
      {label}
    </div>
  );
}

/**
 * The application chrome: a fixed sidebar on large screens, a horizontal
 * scroller on small ones, plus the API connection indicator.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const health = useResource<{ status: string }>(() => api.getLiveness(), {
    pollMs: 15000,
  });

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-border bg-card/40 px-3 py-4 lg:flex">
          <Link href="/" className="flex items-center gap-2.5 px-2 pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <FlaskConical className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">
                Hybrid Test Runner
              </span>
              <span className="block text-xs text-muted-foreground">
                Plain-English test reports
              </span>
            </span>
          </Link>

          <nav className="flex-1 space-y-5 overflow-y-auto pb-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading} className="space-y-1">
                <p className="px-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {group.heading}
                </p>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.description}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        active
                          ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border'
                          : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="space-y-2 border-t border-border px-2 pt-3">
            <ConnectionStatus health={health} />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {api.config.baseUrl.replace(/^https?:\/\//, '')}
              <br />
              tenant {api.config.tenantId.slice(0, 8)}… · actor{' '}
              {api.config.actorId}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <FlaskConical className="size-4" />
              </span>
              <span className="text-sm font-semibold">Hybrid Test Runner</span>
            </div>
            <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2">
              {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
                      active
                        ? 'border-border bg-card text-foreground'
                        : 'border-transparent text-muted-foreground',
                    )}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>

          <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Trace events explain every step in plain English — open a run to
                see what happened.
              </span>
              <Link
                href="/glossary"
                className="underline decoration-dotted underline-offset-2"
              >
                Glossary
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
