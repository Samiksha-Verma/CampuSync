import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Send, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../../api/ai';
import { cn } from '../../../lib/cn';
import { formatChatText } from '../../../lib/formatChatText';

const SUGGESTIONS = [
  'How do I make my resume stand out for internships?',
  'What should I say when asked "tell me about yourself"?',
  'How many certifications should I be doing per semester?',
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  const send = useMutation({
    mutationFn: ({ message, history }) => sendChatMessage(message, history),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, send.isPending]);

  const submit = (text) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    const history = messages;
    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    send.mutate(
      { message: trimmed, history },
      {
        onSuccess: (reply) => setMessages((prev) => [...prev, { role: 'assistant', content: reply }]),
        onError: () =>
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: "I couldn't reach the AI service just now — mind trying that again?", error: true },
          ]),
      }
    );
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-8.5rem)] flex-col">
      <Link to="/student/ai" className="-mt-2 mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-500 sm:mt-0 sm:mb-5 sm:min-h-0 hover:text-ink-700">
        <ArrowLeft size={14} /> AI Tools
      </Link>

      <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
          <MessageCircle size={20} strokeWidth={1.9} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl">Chat Assistant</h1>
          <p className="mt-1 text-sm text-slate-500">Resume advice, interview prep, elective picks — ask away.</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(22,36,29,0.04)]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-50 text-forest-600">
                <Sparkles size={18} strokeWidth={1.75} />
              </div>
              <p className="max-w-xs text-sm text-slate-500">
                Ask anything about careers, applications, or how to use CampuSync — try one of these:
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-ink-700 transition-colors hover:border-forest-300 hover:bg-forest-50/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'rounded-br-md bg-forest-700 text-white'
                        : m.error
                        ? 'rounded-bl-md bg-danger-bg text-danger'
                        : 'rounded-bl-md bg-slate-100 text-ink-800'
                    )}
                  >
                    {m.role === 'assistant' && !m.error ? formatChatText(m.content) : m.content}
                  </div>
                </div>
              ))}
              {send.isPending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2.5 border-t border-slate-100 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-base text-ink-800 placeholder:text-slate-400 transition-colors sm:text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-700 text-white transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
