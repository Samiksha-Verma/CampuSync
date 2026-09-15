import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { studentSignup } from '../../api/auth';
import { getErrorMessage } from '../../lib/apiError';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Logo } from '../../components/ui/Logo';

export default function StudentSignup() {
  const [collegeId, setCollegeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await studentSignup(collegeId.trim(), email.trim(), password);
      navigate('/login', { state: { message: 'Account created — please log in.' } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo markSize={36} textClassName="text-xl text-ink-800" />
        </div>

        <h2 className="font-display text-2xl font-semibold text-ink-800">Create your student account</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Just three things to get started — you'll fill in your name and branch later from your Profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="College ID" htmlFor="collegeId" hint="Format: ABC/2023/005">
            <Input
              id="collegeId"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              placeholder="AEC/2023/005"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Email address" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password" htmlFor="password" hint="At least 6 characters">
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </Field>

          {error ? <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</p> : null}

          <Button type="submit" loading={loading} className="mt-1 w-full justify-center" size="lg">
            Create account
            {!loading ? <ArrowRight size={16} /> : null}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-forest-700 hover:text-forest-800">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
