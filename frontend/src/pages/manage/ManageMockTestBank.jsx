import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ListChecks, CheckCircle2 } from 'lucide-react';
import { createQuestion } from '../../api/mocktest';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea, Select } from '../../components/ui/Input';
import { cn } from '../../lib/cn';

const EMPTY_FORM = {
  category: 'aptitude',
  questionText: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  difficulty: 'medium',
};

export default function ManageMockTestBank() {
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const create = useMutation({
    mutationFn: (payload) => createQuestion(payload),
    onSuccess: () => {
      push('Question added to the bank.', { variant: 'success' });
      setForm(EMPTY_FORM);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not add that question.', { variant: 'error' }),
  });

  const setOption = (i, value) =>
    setForm((f) => ({ ...f, options: f.options.map((o, oi) => (oi === i ? value : o)) }));

  const canSubmit = form.questionText.trim() && form.options.every((o) => o.trim());

  const submit = (e) => {
    e.preventDefault();
    create.mutate(form);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Mock Test Bank"
        subtitle="Add questions for students' practice tests. Questions can't be listed or edited after adding — the bank only exposes creation, by design, so students can never see the answer key."
      />

      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="q-cat">
              <Select id="q-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="aptitude">Aptitude</option>
                <option value="coding">Coding</option>
                <option value="reasoning">Reasoning</option>
                <option value="web-development">Web Development</option>
                <option value="backend">Backend</option>
              </Select>
            </Field>
            <Field label="Difficulty" htmlFor="q-diff">
              <Select id="q-diff" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </Field>
          </div>

          <Field label="Question" htmlFor="q-text">
            <Textarea id="q-text" required rows={2} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Options — select the correct one</p>
            <div className="flex flex-col gap-2.5">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, correctOptionIndex: i })}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                      form.correctOptionIndex === i
                        ? 'border-success bg-success-bg text-success'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    )}
                    aria-label={`Mark option ${String.fromCharCode(65 + i)} correct`}
                  >
                    {form.correctOptionIndex === i ? <CheckCircle2 size={16} /> : String.fromCharCode(65 + i)}
                  </button>
                  <Input
                    required
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="mt-2 self-start" disabled={!canSubmit} loading={create.isPending}>
            <ListChecks size={16} /> Add to bank
          </Button>
        </form>
      </Card>
    </div>
  );
}
