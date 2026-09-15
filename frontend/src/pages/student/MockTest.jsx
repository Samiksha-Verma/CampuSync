import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Calculator,
  Code2,
  Puzzle,
  Globe,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ListOrdered,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getQuestions, submitAttempt, getHistory, getCategoryStats } from '../../api/mocktest';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/cn';

const CATEGORY_META = {
  aptitude: { label: 'Aptitude', icon: Calculator, description: 'Quantitative reasoning, arithmetic, and data interpretation.' },
  coding: { label: 'Coding', icon: Code2, description: 'Trace code output, spot bugs, and reason about complexity across core CS topics.' },
  reasoning: { label: 'Reasoning', icon: Puzzle, description: 'Logical puzzles, sequences, and pattern recognition.' },
  'web-development': { label: 'Web Development', icon: Globe, description: 'HTML, CSS, JavaScript, and frontend framework fundamentals.' },
  backend: { label: 'Backend', icon: Server, description: 'APIs, databases, servers, and backend architecture basics.' },
};

// Question/option text for code-output questions embeds a real snippet as
// "<prose question>\n\n<code>" - split on the first blank line so the code renders
// in a monospace block instead of collapsing its newlines like plain prose would.
const splitCodeBlock = (text) => {
  const i = text.indexOf('\n\n');
  if (i === -1) return { prose: text, code: null };
  return { prose: text.slice(0, i), code: text.slice(i + 2) };
};

// A handful of options are single-line code fragments (array literals, a `return`
// statement) rather than prose - render those in monospace so they're readable.
const isCodeOption = (text) => /return |=>|console\.log|^\[/.test(text);

const TEST_LENGTH = 10;
const SECONDS_PER_QUESTION = 75;

const formatClock = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function MockTest() {
  const [stage, setStage] = useState('select'); // select | active | results
  const [category, setCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const submittedRef = useRef(false);

  const { data: history = [] } = useQuery({
    queryKey: ['mocktest-history'],
    queryFn: () => getHistory(),
    enabled: stage === 'select',
  });

  const { data: categoryStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['mocktest-categories'],
    queryFn: getCategoryStats,
    enabled: stage === 'select',
  });

  const loadQuestions = useMutation({
    mutationFn: (cat) => getQuestions(cat, TEST_LENGTH),
    onSuccess: (qs) => {
      if (qs.length === 0) return;
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setCurrent(0);
      setSecondsLeft(qs.length * SECONDS_PER_QUESTION);
      setStartedAt(Date.now());
      submittedRef.current = false;
      setStage('active');
    },
  });

  const startCategory = (cat) => {
    setCategory(cat);
    loadQuestions.mutate(cat);
  };

  const submit = useMutation({
    mutationFn: (payload) => submitAttempt(payload),
    onSuccess: ({ attempt, results }) => {
      setResult({ attempt, results });
      setStage('results');
    },
    // Without this, a failed submit leaves submittedRef stuck true forever - the
    // timer-race guard it exists for was only ever meant to block a second attempt
    // while one is in flight or has already succeeded, not to permanently lock out
    // retries after a real failure (network blip, backend restart, etc).
    onError: () => {
      submittedRef.current = false;
    },
  });

  const doSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
    submit.mutate({
      category,
      questions: questions.map((q) => q._id),
      answers,
      timeTakenSeconds,
    });
  };

  useEffect(() => {
    if (stage !== 'active') return;
    if (secondsLeft <= 0) {
      doSubmit();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => prev.map((a, i) => (i === current ? optionIndex : a)));
  };

  const answeredCount = useMemo(() => answers.filter((a) => a !== -1).length, [answers]);
  const urgent = secondsLeft <= 60;

  const resetToSelect = () => {
    setStage('select');
    setCategory(null);
    setQuestions([]);
    setAnswers([]);
    setResult(null);
  };

  if (stage === 'select') {
    return (
      <div>
        <PageHeader
          title="Mock Test"
          subtitle="Timed practice sets, scored instantly — pick a category and see exactly where you stand."
        />

        {statsLoading ? (
          <ListSkeleton count={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryStats.map((stat) => {
              const meta = CATEGORY_META[stat.category] || { label: stat.category, icon: ListOrdered, description: '' };
              const length = Math.min(TEST_LENGTH, stat.count);
              const minutes = Math.round((length * SECONDS_PER_QUESTION) / 60);
              const available = stat.count > 0;
              const isLoadingThis = loadQuestions.isPending && category === stat.category;

              return (
                <Card key={stat.category} className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <meta.icon size={20} strokeWidth={1.9} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink-800">{meta.label}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-500">{meta.description}</p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ListOrdered size={13} /> {length} question{length === 1 ? '' : 's'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> ~{minutes} min
                    </span>
                  </div>

                  <Button
                    className="mt-5 w-full"
                    disabled={!available}
                    loading={isLoadingThis}
                    onClick={() => startCategory(stat.category)}
                  >
                    {available ? (
                      <>
                        Start Test <ArrowRight size={14} />
                      </>
                    ) : (
                      'Coming soon'
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {loadQuestions.isError ? (
          <p className="mt-4 text-sm text-danger">
            {loadQuestions.error?.response?.data?.message ||
              "Couldn't load questions — check your connection and try again."}
          </p>
        ) : null}

        {history.length > 0 ? (
          <div className="mt-8">
            <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Recent attempts</h3>
            <div className="flex flex-col gap-2.5">
              {history.slice(0, 5).map((a) => (
                <Card key={a._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="neutral">{CATEGORY_META[a.category]?.label || a.category}</Badge>
                    <p className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(a.completedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums text-ink-800">
                    {a.score}/{a.totalQuestions}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (stage === 'active') {
    const q = questions[current];
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">{CATEGORY_META[category]?.label || category}</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-ink-800">
              Question {current + 1} of {questions.length}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-sm font-semibold tabular-nums',
              urgent ? 'bg-danger-bg text-danger' : 'bg-slate-100 text-ink-700'
            )}
          >
            <Clock size={14} /> {formatClock(secondsLeft)}
          </div>
        </div>

        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-forest-600 transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        <Card>
          {(() => {
            const { prose, code } = splitCodeBlock(q.questionText);
            return (
              <>
                <p className="font-display text-lg leading-snug text-ink-800">{prose}</p>
                {code ? (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs leading-relaxed text-ink-700">
                    {code}
                  </pre>
                ) : null}
              </>
            );
          })()}
          <div className="mt-5 flex flex-col gap-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                  answers[current] === i
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    answers[current] === i ? 'border-forest-600 bg-forest-600 text-white' : 'border-slate-300 text-slate-400'
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={isCodeOption(opt) ? 'font-mono text-xs' : ''}>{opt}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-5 flex items-center justify-between">
          <Button variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
            Previous
          </Button>
          <p className="text-sm text-slate-400">{answeredCount} of {questions.length} answered</p>
          {current < questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => c + 1)}>Next</Button>
          ) : (
            <Button onClick={doSubmit} loading={submit.isPending}>
              Submit test
            </Button>
          )}
        </div>
        {submit.isError ? (
          <p className="mt-3 text-right text-sm text-danger">
            {submit.error?.response?.data?.message || "Couldn't submit your test — check your connection and try again."}
          </p>
        ) : null}
      </div>
    );
  }

  // stage === 'results'
  const { attempt, results } = result;
  const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="mb-6 text-center">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {CATEGORY_META[attempt.category]?.label || attempt.category} · results
        </p>
        <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink-800">
          {attempt.score}<span className="text-2xl text-slate-400">/{attempt.totalQuestions}</span>
        </p>
        <p className="mt-1.5 text-sm text-slate-500">{pct}% correct · {formatClock(attempt.timeTakenSeconds)} taken</p>
        <Button variant="secondary" className="mt-5" onClick={resetToSelect}>
          <RotateCcw size={14} /> Take another test
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        {results.map((r, i) => (
          <Card key={r.questionId} className={cn('border-l-4', r.isCorrect ? 'border-l-success' : 'border-l-danger')}>
            <div className="flex items-start gap-3">
              {r.isCorrect ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
              ) : (
                <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />
              )}
              <div className="min-w-0 flex-1">
                {(() => {
                  const { prose, code } = splitCodeBlock(r.questionText || '');
                  return (
                    <>
                      <p className="text-sm font-medium text-ink-800">
                        {i + 1}. {prose}
                      </p>
                      {code ? (
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs leading-relaxed text-ink-700">
                          {code}
                        </pre>
                      ) : null}
                    </>
                  );
                })()}
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {r.options?.map((opt, oi) => (
                    <div
                      key={oi}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-sm',
                        oi === r.correctOptionIndex
                          ? 'bg-success-bg text-success'
                          : oi === r.selectedOption
                          ? 'bg-danger-bg text-danger'
                          : 'text-slate-500'
                      )}
                    >
                      <span className={isCodeOption(opt) ? 'font-mono text-xs' : ''}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </span>
                      {oi === r.correctOptionIndex ? ' — correct answer' : ''}
                      {oi === r.selectedOption && oi !== r.correctOptionIndex ? ' — your answer' : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
