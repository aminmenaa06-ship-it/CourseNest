interface Props {
  className?: string;
  tone?: 'solid' | 'outline';
}

/** Small "PRO" pill used to mark Pro-only surfaces. */
export default function ProBadge({ className = '', tone = 'solid' }: Props) {
  const styles =
    tone === 'solid'
      ? 'bg-[var(--color-ink)] text-white border-transparent'
      : 'bg-transparent text-[var(--color-ink)] border-[var(--color-border-strong)]';
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${styles} ${className}`}
    >
      Pro
    </span>
  );
}
