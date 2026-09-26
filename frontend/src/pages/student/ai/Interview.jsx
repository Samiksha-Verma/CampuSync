import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Upload,
  FileText,
  AlertTriangle,
  Volume2,
  Loader2,
  Send,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  startInterviewFile,
  startInterviewDocument,
  getNextInterviewQuestion,
  getInterviewSummary,
} from '../../../api/ai';
import { listDocuments } from '../../../api/vault';
import { useTextToSpeech, useSpeechToText } from '../../../lib/speech';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Input';
import { AiLoading } from '../../../components/ui/AiLoading';
import { ScoreBar } from '../../../components/ui/ScoreBar';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../lib/cn';

const ASK_ROLE_QUESTION = "Great, let's get started. What role are you interviewing for today?";

const START_LOADING = ['Reading your resume…', 'Mapping your skills to the role…', 'Preparing your first question…'];
const NEXT_LOADING = ['Thinking of a good follow-up…'];
const SUMMARY_LOADING = ['Reviewing the whole interview…', 'Scoring clarity and relevance…', 'Writing up feedback…'];

function StatusPill({ phase, sttSupported }) {
  const config = {
    'ai-speaking': { icon: Volume2, label: 'AI is speaking…', tone: 'bg-forest-50 text-forest-700' },
    listening: { icon: Mic, label: 'Listening…', tone: 'bg-danger-bg text-danger' },
    processing: { icon: Loader2, label: 'Processing…', tone: 'bg-slate-100 text-slate-600' },
    idle: {
      icon: sttSupported ? Mic : MicOff,
      label: sttSupported ? 'Your turn' : 'Your turn — type your answer',
      tone: 'bg-slate-100 text-slate-600',
    },
  }[phase];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium', config.tone)}>
      <Icon size={15} className={phase === 'listening' ? 'animate-pulse' : phase === 'processing' ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}

export default function Interview() {
  const [stage, setStage] = useState('setup'); // setup | ask-role | interview | summary
  const [resumeInput, setResumeInput] = useState(null); // { file, fileName } | { documentId, fileName }
  const [role, setRole] = useState('');
  const [candidateSummary, setCandidateSummary] = useState('');
  const [skillAreas, setSkillAreas] = useState([]);
  const [history, setHistory] = useState([]); // [{ question, area, answer }]
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentArea, setCurrentArea] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalTarget, setTotalTarget] = useState(9);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [turnPhase, setTurnPhase] = useState('idle'); // ai-speaking | listening | processing | idle

  const fileInputRef = useRef(null);

  const { data: vaultResumes = [] } = useQuery({
    queryKey: ['vault-documents', 'resume'],
    queryFn: () => listDocuments('resume'),
  });

  const tts = useTextToSpeech();

  const commitAnswer = (rawText) => {
    const cleaned = (rawText || '').trim();
    tts.cancel();

    if (stage === 'ask-role') {
      if (!cleaned) return; // need an actual role to proceed
      setTurnPhase('processing');
      setRole(cleaned);
      setTypedAnswer('');
      start.mutate(cleaned);
      return;
    }

    if (stage === 'interview') {
      setTurnPhase('processing');
      setTypedAnswer('');
      const updatedHistory = [...history, { question: currentQuestion, area: currentArea, answer: cleaned }];
      setHistory(updatedHistory);
      setCurrentQuestion('');
      next.mutate(updatedHistory);
    }
  };

  const stt = useSpeechToText(commitAnswer);

  const start = useMutation({
    mutationFn: (roleArg) =>
      resumeInput.file
        ? startInterviewFile(resumeInput.file, roleArg)
        : startInterviewDocument(resumeInput.documentId, roleArg),
    onSuccess: (data) => {
      setCandidateSummary(data.candidateSummary);
      setSkillAreas(data.skillAreas);
      setCurrentQuestion(data.question);
      setCurrentArea(data.questionArea);
      setQuestionNumber(data.questionNumber);
      setTotalTarget(data.totalTarget);
      setStage('interview');
    },
  });

  const summary = useMutation({
    mutationFn: (finalHistory) => getInterviewSummary({ role, candidateSummary, history: finalHistory }),
  });

  const next = useMutation({
    mutationFn: (updatedHistory) => getNextInterviewQuestion({ role, candidateSummary, skillAreas, history: updatedHistory }),
    onSuccess: (data, updatedHistory) => {
      if (data.isComplete) {
        setStage('summary');
        summary.mutate(updatedHistory);
      } else {
        setCurrentQuestion(data.question);
        setCurrentArea(data.questionArea);
        setQuestionNumber(data.questionNumber);
      }
    },
  });

  const speakThenListen = (text) => {
    setTurnPhase('ai-speaking');
    tts.speak(text, {
      onEnd: () => {
        if (stt.supported && !stt.permissionDenied) {
          setTurnPhase('listening');
          stt.start();
        } else {
          setTurnPhase('idle');
        }
      },
    });
  };

  useEffect(() => {
    if (stage === 'ask-role') speakThenListen(ASK_ROLE_QUESTION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (stage === 'interview' && currentQuestion) speakThenListen(currentQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, stage]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResumeInput({ file, fileName: file.name });
    setStage('ask-role');
  };

  const handleFromVault = (doc) => {
    setResumeInput({ documentId: doc._id, fileName: doc.fileName });
    setStage('ask-role');
  };

  const handleTypedSubmit = () => {
    if (!typedAnswer.trim()) return;
    if (stt.isListening) stt.cancel();
    commitAnswer(typedAnswer);
  };

  const handleDoneAnswering = () => {
    stt.stop(); // triggers commitAnswer via the hook's finalize path
  };

  const restart = () => {
    tts.cancel();
    stt.cancel();
    setStage('setup');
    setResumeInput(null);
    setRole('');
    setCandidateSummary('');
    setSkillAreas([]);
    setHistory([]);
    setCurrentQuestion('');
    setCurrentArea('');
    setQuestionNumber(0);
    setTypedAnswer('');
    setTurnPhase('idle');
    start.reset();
    next.reset();
    summary.reset();
  };

  // If listening was interrupted by an unsupported browser or a denied mic
  // permission, don't keep showing "Listening…" / the "Done answering" button for a
  // mic that isn't actually capturing anything - fall back to the idle/typed state.
  const voiceInputActive = stt.supported && !stt.permissionDenied;
  const effectivePhase = turnPhase === 'listening' && !voiceInputActive ? 'idle' : turnPhase;
  const awaitingAnswer = (stage === 'ask-role' || stage === 'interview') && effectivePhase !== 'processing';

  // Transcript panel: every completed Q&A pair, plus the question in progress (and
  // the student's answer as it's being captured, live).
  const transcriptEntries = [
    ...history.flatMap((h) => [
      { who: 'ai', text: h.question },
      { who: 'student', text: h.answer || '(no answer given)' },
    ]),
    ...(stage === 'ask-role' ? [{ who: 'ai', text: ASK_ROLE_QUESTION }] : []),
    ...(role && stage !== 'ask-role' ? [{ who: 'student', text: role, roleAnswer: true }] : []),
    ...(currentQuestion ? [{ who: 'ai', text: currentQuestion }] : []),
    ...(turnPhase === 'listening' && stt.transcript ? [{ who: 'student', text: stt.transcript, interim: true }] : []),
  ];

  return (
    <div>
      <Link to="/student/ai" className="-mt-2 mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-500 sm:mt-0 sm:mb-5 sm:min-h-0 hover:text-ink-700">
        <ArrowLeft size={14} /> AI Tools
      </Link>

      <div className="mb-6 flex items-start gap-3 sm:mb-7 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
          <Mic size={20} strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl">Voice Mock Interview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload your resume, tell the interviewer what role you're going for, and answer out loud — Groq
            tailors every question to your background and scores the whole interview at the end.
          </p>
        </div>
      </div>

      {stage === 'setup' ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload a PDF resume
            </Button>

            {vaultResumes.length > 0 ? (
              <>
                <p className="text-xs uppercase tracking-wider text-slate-400">or use one from your vault</p>
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

      {stage !== 'setup' ? (
        <>
          {!stt.supported || stt.permissionDenied ? (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-brass-50 px-3.5 py-2.5 text-sm text-brass-800">
              <AlertTriangle size={15} className="shrink-0" />
              {stt.permissionDenied
                ? 'Microphone access was denied — type your answers instead.'
                : "Voice input isn't supported in this browser — type your answers instead."}
            </div>
          ) : null}

          {resumeInput ? (
            <p className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-400">
              <span className="flex min-w-0 max-w-full items-center gap-1.5"><FileText size={13} className="shrink-0" /><span className="truncate">{resumeInput.fileName}</span></span>
              {stage === 'interview' ? (
                <>
                  <span className="mx-1">·</span>
                  Question {questionNumber} of {totalTarget}
                  {currentArea ? (
                    <>
                      <span className="mx-1">·</span>
                      <Badge variant="forest">{currentArea}</Badge>
                    </>
                  ) : null}
                </>
              ) : null}
            </p>
          ) : null}

          {(stage === 'ask-role' || stage === 'interview') && !start.isError && !next.isError ? (
            <Card className="mb-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <StatusPill phase={effectivePhase} sttSupported={voiceInputActive} />
                {effectivePhase === 'listening' && stt.isSilenceWarning ? (
                  <span className="text-xs font-medium text-brass-700">Still there? Wrapping up in a moment…</span>
                ) : null}
              </div>

              <div className="flex max-h-[45dvh] flex-col gap-3 overflow-y-auto rounded-lg bg-slate-50 p-3 sm:max-h-80 sm:p-4">
                {transcriptEntries.map((entry, i) => (
                  <div key={i} className={cn('flex', entry.who === 'ai' ? 'justify-start' : 'justify-end')}>
                    <div
                      className={cn(
                        'max-w-[88%] break-words rounded-xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[85%]',
                        entry.who === 'ai' ? 'bg-white text-ink-800 shadow-sm' : 'bg-forest-600 text-white',
                        entry.interim && 'opacity-70'
                      )}
                    >
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>

              {effectivePhase === 'listening' ? (
                <div className="mt-3 flex justify-center">
                  <Button size="sm" variant="secondary" onClick={handleDoneAnswering}>
                    Done answering
                  </Button>
                </div>
              ) : null}

              {awaitingAnswer ? (
                <div className="mt-4 flex gap-2">
                  <Textarea
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTypedSubmit();
                      }
                    }}
                    placeholder={stt.supported && !stt.permissionDenied ? 'Or type your answer instead…' : 'Type your answer…'}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleTypedSubmit} disabled={!typedAnswer.trim()} aria-label="Send answer">
                    <Send size={15} />
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : null}

          {start.isPending ? <AiLoading messages={START_LOADING} /> : null}
          {next.isPending ? <AiLoading messages={NEXT_LOADING} /> : null}

          {start.isError || next.isError ? (
            <Card className="border-danger/30 bg-danger-bg/40">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-ink-800">Something went wrong</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {(start.error || next.error)?.response?.data?.message || 'Please try again.'}
                  </p>
                  <Button size="sm" variant="secondary" className="mt-3" onClick={restart}>
                    Start over
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </>
      ) : null}

      {stage === 'summary' ? (
        <>
          {summary.isPending ? <AiLoading messages={SUMMARY_LOADING} /> : null}

          {summary.isError ? (
            <Card className="border-danger/30 bg-danger-bg/40">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-medium text-ink-800">Couldn't generate the summary</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {summary.error?.response?.data?.message || 'Please try again.'}
                  </p>
                  <Button size="sm" variant="secondary" className="mt-3" onClick={() => summary.mutate(history)}>
                    Try again
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {summary.data ? (
            <div className="flex flex-col gap-4">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-success">
                    <CheckCircle2 size={16} /> Interview complete — {history.length} questions across{' '}
                    {new Set(history.map((h) => h.area).filter(Boolean)).size} skill areas
                  </div>
                  <Button size="sm" variant="secondary" onClick={restart}>
                    <RotateCcw size={14} /> New interview
                  </Button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <ScoreBar label="Clarity" score={summary.data.overallClarityScore} />
                  <ScoreBar label="Relevance" score={summary.data.overallRelevanceScore} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{summary.data.summary}</p>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <h3 className="mb-3 font-display text-base font-semibold text-ink-800">What worked</h3>
                  <ul className="flex flex-col gap-2.5">
                    {summary.data.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Try this next time</h3>
                  <ul className="flex flex-col gap-2.5">
                    {summary.data.improvementSuggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card>
                <h3 className="mb-3 font-display text-base font-semibold text-ink-800">By skill area</h3>
                <div className="flex flex-col gap-3">
                  {summary.data.areaBreakdown.map((a, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <Badge variant="forest" className="w-fit">{a.area}</Badge>
                      <p className="text-sm text-slate-600">{a.performance}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Full transcript</h3>
                <div className="flex flex-col gap-4">
                  {history.map((h, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Q{i + 1} · {h.area || 'General'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink-800">{h.question}</p>
                      <p className="mt-1 text-sm text-slate-600">{h.answer || '(no answer given)'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
