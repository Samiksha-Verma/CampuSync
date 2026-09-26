import { useState } from 'react';
import { Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPrefs, setPref } from '../../lib/prefs';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';

const Toggle = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] ${checked ? 'bg-forest-600' : 'bg-slate-200'}`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export default function Settings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(getPrefs());

  const update = (key, value) => setPrefs(setPref(key, value));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" subtitle="A few things you can control from here — the rest is managed by your college." />

      <Card className="mb-6">
        <CardHeader title="Notifications" subtitle="Applies to this browser." />
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
              <Radio size={15} />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-800">Real-time pop-ups</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Show a toast when a new event, opportunity, or certification is posted while you're on the site.
                The bell and unread count always stay up to date either way.
              </p>
            </div>
          </div>
          <Toggle checked={prefs.liveToasts} onChange={(v) => update('liveToasts', v)} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Account" subtitle="Managed by your college — reach out to Admin to change these." />
        <dl className="flex flex-col divide-y divide-slate-100">
          {[
            ['Name', user.name],
            ['College ID', user.collegeId],
            ['Email', user.email],
            ['Branch', user.branch],
            ['Year', user.year],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
              <dt className="shrink-0 text-slate-500">{label}</dt>
              <dd className="min-w-0 break-all text-right font-medium text-ink-800">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
