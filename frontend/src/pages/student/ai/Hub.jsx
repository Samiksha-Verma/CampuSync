import { Link } from 'react-router-dom';
import {
  FileSearch,
  Mic,
  ClipboardCheck,
  Target,
  Sparkles,
  Bot,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  Users,
  Crosshair,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/cn';

const TOOLS = [
  {
    to: '/student/ai/resume-analyzer',
    icon: FileSearch,
    tint: 'bg-forest-50 text-forest-700',
    title: 'Resume Analyzer',
    description: 'Get an ATS compatibility score, missing keywords, and formatting feedback on your resume in seconds.',
    action: 'Start Analysis',
  },
  {
    to: '/student/ai/interview',
    icon: Mic,
    tint: 'bg-brass-100 text-brass-800',
    title: 'Mock Interview',
    description: 'A spoken interview tailored to your resume and target role. Answer out loud and get scored feedback.',
    action: 'Start Interview',
  },
  {
    to: '/student/mocktest',
    icon: ClipboardCheck,
    tint: 'bg-info-bg text-info',
    title: 'Mock Test',
    description: 'Timed aptitude and coding practice that mirrors campus placement rounds, with instant results.',
    action: 'Start Test',
  },
];

const STATS = [
  {
    icon: TrendingUp,
    tint: 'bg-success-bg text-success',
    value: '+27%',
    label: 'Average ATS score gain',
    note: 'after one round of resume revisions',
  },
  {
    icon: Users,
    tint: 'bg-forest-50 text-forest-700',
    value: '480+',
    label: 'Active students',
    note: 'using the AI tools each semester',
  },
  {
    icon: Crosshair,
    tint: 'bg-info-bg text-info',
    value: '92%',
    label: 'Skill-gap accuracy',
    note: 'matched against recruiter feedback',
  },
];

const actionClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-800';

export default function AiHub() {
  return (
    <div>
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brass-200 bg-brass-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brass-800">
          <Sparkles size={12} /> Beta Access
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink-800">AI Career Suite</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Accelerate your career growth with real-time feedback and intelligent simulations, built around what
          you're actually trying to do: land interviews, close skill gaps, and find the right opening.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ to, icon: Icon, tint, title, description, action }) => (
          <Card key={to} className="group flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', tint)}>
              <Icon size={22} strokeWidth={1.8} />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold text-ink-800">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
            <div className="mt-auto pt-6">
              <Link to={to} className={cn(actionClass, 'w-full')}>
                {action}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Card>
        ))}

        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-ink-800 p-6 text-white shadow-[0_8px_24px_rgba(17,15,32,0.25)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-forest-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-brass-500/15 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-forest-400 to-brass-400 text-ink-900">
                <Bot size={22} strokeWidth={1.9} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-800 bg-success" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-300">AI Companion</span>
          </div>

          <h3 className="relative mt-5 font-display text-lg font-semibold">AI Chat Assistant</h3>
          <p className="relative mt-1.5 text-sm leading-relaxed text-ink-100">
            Ask questions about careers, companies, or preparation strategies. Available 24/7 for your career
            guidance.
          </p>
          <div className="relative mt-auto pt-6">
            <Link
              to="/student/ai/chat"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-forest-50"
            >
              <MessageCircle size={15} />
              Chat Now
            </Link>
          </div>
        </div>
      </div>

      <Link
        to="/student/ai/recommendations"
        className="group mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(22,36,29,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-bg text-success">
          <Target size={22} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-ink-800">Opportunity Matches</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            See which open internships and jobs best fit your branch and skills, ranked and explained.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-medium text-forest-700">
          View Matches
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STATS.map(({ icon: Icon, tint, value, label, note }) => (
          <Card key={label} className="flex items-start gap-4 p-5">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tint)}>
              <Icon size={18} strokeWidth={1.9} />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold tabular-nums text-ink-800">{value}</p>
              <p className="mt-0.5 text-sm font-medium text-ink-700">{label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{note}</p>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">Illustrative figures for the beta, not live measurements.</p>
    </div>
  );
}
