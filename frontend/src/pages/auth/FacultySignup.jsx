import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { facultySignup } from '../../api/auth';
import { getErrorMessage } from '../../lib/apiError';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Logo } from '../../components/ui/Logo';

export default function FacultySignup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await facultySignup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        department: form.department.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brass-100 text-brass-800">
            <Clock size={22} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink-800">Application submitted</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Your account is awaiting Admin approval. You'll be able to log in as soon as it's approved — you'll get
            an email confirming it.
          </p>
          <Button variant="secondary" className="mt-6 w-full justify-center" size="lg" onClick={() => navigate('/login')}>
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo markSize={36} textClassName="text-xl text-ink-800" />
        </div>

        <h2 className="font-display text-2xl font-semibold text-ink-800">Apply for a Faculty account</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Submitted applications are reviewed by an Admin before you can log in.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="Full name" htmlFor="name">
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Meera Iyer"
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Email address" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="meera.iyer@college.edu"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Department" htmlFor="department" hint="Optional">
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Computer Science"
            />
          </Field>
          <Field label="Password" htmlFor="password" hint="At least 6 characters">
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>

          {error ? <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</p> : null}

          <Button type="submit" loading={loading} className="mt-1 w-full justify-center" size="lg">
            Submit application
            {!loading ? <ArrowRight size={16} /> : null}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already approved?{' '}
          <Link to="/login" className="font-medium text-forest-700 hover:text-forest-800">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
