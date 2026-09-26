import { useState } from 'react';
import { cn } from '../lib/cn';
import { avatarStyle, initialFor } from '../lib/avatarColor';

// Clearbit's logo API was shut down, so this uses Google's favicon service
// (no key needed). Swapping providers later only means changing this function.
const logoUrl = (domain) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

// Real logo when the company has a website and the image loads; otherwise the
// deterministic colored-initial avatar.
export const CompanyLogo = ({ name, website, className }) => {
  const [failedFor, setFailedFor] = useState(null);
  const showImage = Boolean(website) && failedFor !== website;
  const avatar = avatarStyle(name);

  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl',
        showImage ? 'border border-slate-200 bg-white p-1.5' : cn('text-base font-semibold', avatar.bg, avatar.text),
        className
      )}
    >
      {showImage ? (
        <img
          src={logoUrl(website)}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          onError={() => setFailedFor(website)}
        />
      ) : (
        initialFor(name)
      )}
    </div>
  );
};
