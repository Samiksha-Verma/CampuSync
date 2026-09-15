import { Link } from 'react-router-dom';
import { FileSearch, MessageCircle, Mic, Target, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';

const TOOLS = [
  {
    to: '/student/ai/resume-analyzer',
    icon: FileSearch,
    title: 'Resume Analyzer',
    description: 'Get an ATS compatibility score, missing keywords, and formatting feedback on your resume.',
  },
  {
    to: '/student/ai/chat',
    icon: MessageCircle,
    title: 'Chat Assistant',
    description: 'Ask about resume advice, interview prep, electives, or how to use CampuSync — get quick, practical answers.',
  },
  {
    to: '/student/ai/interview',
    icon: Mic,
    title: 'Voice Mock Interview',
    description: 'A spoken interview tailored to your resume and target role — answer out loud, get scored feedback at the end.',
  },
  {
    to: '/student/ai/recommendations',
    icon: Target,
    title: 'Opportunity Matches',
    description: 'See which open internships and jobs best fit your branch and skills, ranked and explained.',
  },
];

export default function AiHub() {
  return (
    <div>
      <PageHeader
        title="AI Tools"
        subtitle="Groq-powered tools built around what you're actually trying to do — land interviews, close skill gaps, find the right opening."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to}>
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                <Icon size={20} strokeWidth={1.9} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-800">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{description}</p>
              <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-forest-700">
                Open tool
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
