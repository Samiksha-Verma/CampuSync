import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Target, AlertTriangle, ExternalLink } from 'lucide-react';
import { getRecommendations } from '../../../api/ai';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { AiLoading } from '../../../components/ui/AiLoading';
import { ScoreBar } from '../../../components/ui/ScoreBar';

const LOADING_MESSAGES = ['Reading your profile…', 'Scanning open opportunities…', 'Ranking your best matches…'];

export default function Recommendations() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: getRecommendations,
    retry: false,
  });

  return (
    <div>
      <Link to="/student/ai" className="-mt-2 mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-500 sm:mt-0 sm:mb-5 sm:min-h-0 hover:text-ink-700">
        <ArrowLeft size={14} /> AI Tools
      </Link>

      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
          <Target size={20} strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl">Opportunity Matches</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ranked against your branch and skills from your profile — the closer the match, the higher it lands.
          </p>
        </div>
      </div>

      {isLoading ? <AiLoading messages={LOADING_MESSAGES} /> : null}

      {isError ? (
        <Card className="border-danger/30 bg-danger-bg/40">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-sm text-slate-600">
              {error?.response?.data?.message || "Couldn't generate matches right now. Try again shortly."}
            </p>
          </div>
        </Card>
      ) : null}

      {data && data.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No confident matches right now"
          description="Either nothing's open yet, or your profile doesn't have enough to match against — add your branch and skills in Profile for sharper recommendations."
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="flex flex-col gap-4">
          {data.map((rec) => (
            <Card key={rec.opportunityId}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-ink-800">{rec.role}</h3>
                  <p className="mt-0.5 text-sm font-medium text-forest-700">{rec.companyName}</p>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{rec.reason}</p>
                </div>
                <div className="w-full shrink-0 sm:w-40">
                  <ScoreBar label="Match" score={rec.matchScore} />
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <Link to="/student/opportunities">
                  <Button size="sm" variant="secondary">
                    View in Internships & Jobs <ExternalLink size={14} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
