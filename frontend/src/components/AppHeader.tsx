import Link from 'next/link';
import { ReactNode } from 'react';

interface AppHeaderProps {
  activeView: 'council' | 'profile';
  actions?: ReactNode;
  onOpenHistory?: () => void;
}

function navClassName(isActive: boolean): string {
  if (isActive) {
    return 'px-3 py-1.5 text-sm text-[var(--text)] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg shadow-sm font-medium';
  }
  return 'px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] bg-transparent hover:bg-[var(--bg-elevated)] border border-transparent rounded-lg transition-colors cursor-pointer';
}

export default function AppHeader({ activeView, actions, onOpenHistory }: AppHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3 flex items-center justify-between z-20">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
            <h1
              className="text-lg font-normal text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Carlos Council
            </h1>
          </div>
          <span className="text-[var(--text-muted)] text-sm hidden sm:inline">
            Strategic Advisory Board
          </span>
        </div>

        <nav className="flex items-center gap-1.5">
          <Link href="/" className={navClassName(activeView === 'council')}>
            Council
          </Link>
          <Link href="/profile" className={navClassName(activeView === 'profile')}>
            Business Dossier
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="hidden sm:inline">History</span>
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}
