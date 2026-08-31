'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/employees', label: 'Employees' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[--color-border] bg-[--color-surface]">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          ACME <span className="text-[--color-ink-muted]">Compensation</span>
        </Link>

        <nav className="flex gap-1">
          {LINKS.map((link) => {
            const active = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-[--color-accent-soft] font-medium text-[--color-accent]'
                    : 'text-[--color-ink-muted] hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Single-persona brief: the session user is fixed, not authenticated.
            Shown so the audit story is honest rather than absent. */}
        <div className="ml-auto text-xs text-[--color-ink-muted]">
          Signed in as <span className="font-medium text-[--color-ink]">Priya Raman</span> · HR Manager
        </div>
      </div>
    </header>
  );
}