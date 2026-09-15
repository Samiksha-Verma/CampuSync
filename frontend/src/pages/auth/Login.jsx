import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Users, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Logo } from '../../components/ui/Logo';
import { cn } from '../../lib/cn';

const ROLES = [
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'faculty', label: 'Faculty', icon: Users },
  { key: 'admin', label: 'Admin', icon: ShieldCheck },
];

export default function Login() {
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { studentLogin, facultyLogin, adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const identifierLabel = role === 'student' ? 'College ID' : 'Email address';
  const identifierPlaceholder = role === 'student' ? 'AEC/2023/005' : 'you@college.edu';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'student') {
        await studentLogin(identifier.trim(), password);
        navigate('/student');
      } else if (role === 'faculty') {
        await facultyLogin(identifier.trim(), password);
        navigate('/faculty');
      } else {
        await adminLogin(identifier.trim(), password);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-ink-800 px-12 py-14 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
          <Logo markSize={36} textClassName="text-xl text-white" />
        </div>
        <div className="relative max-w-sm">
          <h1 className="font-display text-3xl font-semibold leading-tight text-balance">
            Every opportunity your college posts, and the tools to land it.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-100">
            Events, internships, certifications, and an AI-backed resume review and mock interview kit — all in
            one place, updated the moment Faculty or Admin post something new.
          </p>
        </div>
        <p className="relative text-xs text-ink-300">A single-college career platform, built for one campus.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo markSize={36} textClassName="text-xl text-ink-800" />
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-800">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to pick up where you left off.</p>

          {successMessage ? (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-success-bg px-3.5 py-2.5 text-sm text-success">
              <CheckCircle2 size={16} className="shrink-0" /> {successMessage}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
            {ROLES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRole(key);
                  setError('');
                }}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all',
                  role === key ? 'bg-white text-forest-700 shadow-sm' : 'text-slate-500 hover:text-ink-700'
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Field label={identifierLabel} htmlFor="identifier">
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierPlaceholder}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            {error ? (
              <p className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</p>
            ) : null}

            <Button type="submit" loading={loading} className="mt-1 w-full justify-center" size="lg">
              Sign in
              {!loading ? <ArrowRight size={16} /> : null}
            </Button>
          </form>

          {role === 'student' ? (
            <p className="mt-5 text-center text-sm text-slate-500">
              New here?{' '}
              <Link to="/signup/student" className="font-medium text-forest-700 hover:text-forest-800">
                Create a student account
              </Link>
            </p>
          ) : role === 'faculty' ? (
            <p className="mt-5 text-center text-sm text-slate-500">
              New faculty member?{' '}
              <Link to="/signup/faculty" className="font-medium text-forest-700 hover:text-forest-800">
                Apply for an account
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
