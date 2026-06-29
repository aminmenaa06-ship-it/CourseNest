import { useEffect, useState } from 'react';

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  suffix?: string;
  ariaLabel?: string;
  /** Message shown when the field is left empty. */
  emptyMessage?: string;
}

/**
 * A numeric field that lets you actually clear it. Native number inputs (and the
 * usual `Number(e.target.value)` pattern) snap an empty field back to 0, which
 * makes editing painful. Here the field can be empty — it shows a quiet error and
 * simply doesn't push a value up until you type a valid one.
 */
export default function NumberInput({
  value,
  onChange,
  min,
  max,
  className = '',
  suffix,
  ariaLabel,
  emptyMessage = 'Enter a value',
}: Props) {
  const [text, setText] = useState<string>(String(value));

  // Reflect external value changes (e.g. an auto-recalculated study load),
  // but never overwrite a field the user has intentionally cleared.
  useEffect(() => {
    if (text.trim() === '') return;
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const empty = text.trim() === '';
  const num = Number(text);
  const tooLow = min != null && num < min;
  const tooHigh = max != null && num > max;
  const invalid = empty || Number.isNaN(num) || tooLow || tooHigh;

  const message = empty
    ? emptyMessage
    : Number.isNaN(num)
      ? 'Enter a number'
      : tooLow
        ? `Must be at least ${min}`
        : tooHigh
          ? `Must be ${max} or less`
          : '';

  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          aria-label={ariaLabel}
          aria-invalid={invalid}
          className={`input ${suffix ? 'pr-12' : ''} ${
            invalid ? '!border-[#dc2626] focus:!border-[#dc2626] focus:!shadow-[0_0_0_3px_rgba(220,38,38,0.12)]' : ''
          }`}
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return; // digits + one dot only
            setText(raw);
            const parsed = Number(raw);
            if (
              raw.trim() !== '' &&
              !Number.isNaN(parsed) &&
              (min == null || parsed >= min) &&
              (max == null || parsed <= max)
            ) {
              onChange(parsed);
            }
          }}
          onBlur={() => {
            if (!invalid) setText(String(num)); // normalise e.g. "2." → "2"
          }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {invalid && <p className="text-xs text-[#dc2626] mt-1">{message}</p>}
    </div>
  );
}
