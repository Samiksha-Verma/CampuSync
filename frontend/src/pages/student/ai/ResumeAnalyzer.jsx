import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileSearch,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { analyzeResumeFile, analyzeResumeDocument } from '../../../api/ai';
import { listDocuments } from '../../../api/vault';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { AiLoading } from '../../../components/ui/AiLoading';
import { ScoreBar } from '../../../components/ui/ScoreBar';
import { Badge } from '../../../components/ui/Badge';

const LOADING_MESSAGES = [
  'Reading your resume…',
  'Checking ATS compatibility…',
  'Comparing against role keywords…',
  'Reviewing formatting and structure…',
];

export default function ResumeAnalyzer() {
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const { data: vaultResumes = [] } = useQuery({
    queryKey: ['vault-documents', 'resume'],
    queryFn: () => listDocuments('resume'),
  });

  const analyze = useMutation({
    mutationFn: (arg) => (arg.file ? analyzeResumeFile(arg.file) : analyzeResumeDocument(arg.documentId)),
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    analyze.mutate({ file });
  };

  const handleFromVault = (doc) => {
    setFileName(doc.fileName);
    analyze.mutate({ documentId: doc._id });
  };

  const analysis = analyze.data;

  return (
    <div>
      <Link to="/student/ai" className="-mt-2 mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-500 sm:mt-0 sm:mb-5 sm:min-h-0 hover:text-ink-700">
        <ArrowLeft size={14} /> AI Tools
      </Link>

      <div className="mb-6 flex items-start gap-3 sm:mb-7 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
          <FileSearch size={20} strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl">Resume Analyzer</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload a PDF resume, or pick one already in your vault — Groq scores it for ATS compatibility and
            points out exactly what to fix.
          </p>
        </div>
      </div>

      {!analyze.isPending && !analysis ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload a PDF resume
            </Button>

            {vaultResumes.length > 0 ? (
              <>
                <p className="text-xs uppercase tracking-wider text-slate-400">or analyze one from your vault</p>
                <div className="flex w-full max-w-sm flex-col gap-2">
                  {vaultResumes.map((doc) => (
                    <button
                      key={doc._id}
                      onClick={() => handleFromVault(doc)}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-sm transition-colors hover:border-forest-300 hover:bg-forest-50/50"
                    >
                      <FileText size={16} className="shrink-0 text-slate-400" />
                      <span className="truncate text-ink-700">{doc.fileName}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </Card>
      ) : null}

      {analyze.isPending ? <AiLoading messages={LOADING_MESSAGES} /> : null}

      {analyze.isError ? (
        <Card className="border-danger/30 bg-danger-bg/40">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-ink-800">Couldn't analyze that resume</p>
              <p className="mt-1 text-sm text-slate-600">
                {analyze.error?.response?.data?.message || 'Something went wrong. Try again, or use a different PDF.'}
              </p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => analyze.reset()}>
                Try again
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {analysis ? (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Analyzed</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-ink-800">
                  <FileText size={14} className="shrink-0 text-slate-400" /> <span className="min-w-0 break-all">{fileName}</span>
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => { analyze.reset(); setFileName(''); }}>
                Analyze another
              </Button>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <ScoreBar label="ATS Compatibility Score" score={analysis.atsScore} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-800">
                <CheckCircle2 size={16} className="text-success" /> Keywords found
              </h3>
              {analysis.keywordsFound?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywordsFound.map((k) => (
                    <Badge key={k} variant="success">{k}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No strong keywords detected yet.</p>
              )}
            </Card>

            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-800">
                <TrendingUp size={16} className="text-warning" /> Keywords missing
              </h3>
              {analysis.keywordsMissing?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywordsMissing.map((k) => (
                    <Badge key={k} variant="warning">{k}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No obvious gaps — your keyword coverage looks solid.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-800">
                <ThumbsUp size={16} className="text-success" /> Strengths
              </h3>
              {analysis.strengths?.length ? (
                <ul className="flex flex-col gap-2.5">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nothing stood out as a clear strength yet.</p>
              )}
            </Card>

            <Card>
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-800">
                <ThumbsDown size={16} className="text-danger" /> Areas to improve
              </h3>
              {analysis.weaknesses?.length ? (
                <ul className="flex flex-col gap-2.5">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No significant issues found.</p>
              )}
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Formatting feedback</h3>
            {analysis.formattingFeedback?.length ? (
              <ul className="flex flex-col gap-2.5">
                {analysis.formattingFeedback.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-500" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Formatting looks clean — nothing to flag.</p>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
