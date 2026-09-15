import { useId } from 'react';
import { cn } from '../../lib/cn';

// Icon mark: an open ~270deg ring (the ongoing campus/career journey - deliberately
// never closed into a full loop) reaching toward a small accent node sitting just
// past the gap (the opportunity being reached for). Colors are pulled straight from
// the app's own design tokens via CSS variables, not hardcoded - this stays in sync
// with the theme automatically if the palette ever shifts again.
export const LogoMark = ({ size = 32, className }) => {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CampuSync"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-forest-500)" />
          <stop offset="1" stopColor="var(--color-forest-800)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M24.5 16A8.5 8.5 0 1 1 16 7.5"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="23.8" cy="8.2" r="2.6" fill="var(--color-brass-500)" />
    </svg>
  );
};

export const Logo = ({ markSize = 32, textClassName, className }) => (
  <div className={cn('flex items-center gap-2.5', className)}>
    <LogoMark size={markSize} />
    <span className={cn('font-display font-semibold', textClassName)}>CampuSync</span>
  </div>
);
