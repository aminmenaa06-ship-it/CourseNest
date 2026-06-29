// Minimal line icons (currentColor, 1.6 stroke) — replaces emoji for a cleaner look.
interface P {
  size?: number;
  className?: string;
}
const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

export const UploadIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M5 20h14" />
  </svg>
);

export const DownloadIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 4v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

export const PlusIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const CalendarIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <path d="M8 3v3M16 3v3" />
  </svg>
);

export const CheckIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m5 12 4.5 4.5L19 7" />
  </svg>
);

export const ArrowRight = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

export const ArrowLeft = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M19 12H5" />
    <path d="m11 19-7-7 7-7" />
  </svg>
);

export const RefreshIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const LockIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export const PlusCircle = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);
