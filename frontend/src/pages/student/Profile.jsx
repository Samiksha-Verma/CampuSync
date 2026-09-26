import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Link2, X, Plus } from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';

export default function Profile() {
  const { user, updateStudentAccount } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);
  const [form, setForm] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [identity, setIdentity] = useState({ name: user.name || '', branch: user.branch || '', year: user.year || '' });
  const [savingIdentity, setSavingIdentity] = useState(false);

  const saveIdentity = async () => {
    setSavingIdentity(true);
    try {
      await updateStudentAccount({
        name: identity.name.trim(),
        branch: identity.branch.trim(),
        year: identity.year ? Number(identity.year) : undefined,
      });
      push('Profile updated.', { variant: 'success' });
    } catch (err) {
      push(err.response?.data?.message || 'Could not save your details. Try again.', { variant: 'error' });
    } finally {
      setSavingIdentity(false);
    }
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: () => getProfile(user.id),
  });

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone || '',
        college: profile.college || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: (updates) => updateProfile(user.id, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', user.id], updated);
      push('Profile updated.', { variant: 'success' });
    },
    onError: () => push('Could not save your profile. Try again.', { variant: 'error' }),
  });

  const avatar = useMutation({
    mutationFn: (file) => uploadAvatar(user.id, file),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', user.id], updated);
      push('Photo updated.', { variant: 'success' });
    },
    onError: () => push('Could not upload that image. Try a different file.', { variant: 'error' }),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) avatar.mutate(file);
    e.target.value = '';
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput('');
  };

  const removeSkill = (s) => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  if (isLoading || !form) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="Profile" subtitle="How Faculty, Admin, and the AI tools see you — keep it current for sharper recommendations." />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-forest-100 text-2xl font-semibold text-forest-700">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={user.name || user.collegeId} className="h-full w-full object-cover" />
              ) : (
                (user.name || user.collegeId || '?').slice(0, 1).toUpperCase()
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center sm:h-8 sm:w-8 justify-center rounded-full border-2 border-white bg-forest-700 text-white shadow-sm transition-colors hover:bg-forest-800"
              aria-label="Change photo"
            >
              {avatar.isPending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="mt-4 text-sm text-slate-500">{user.collegeId}</p>
          <p className="text-xs text-slate-400">{user.email}</p>

          <div className="mt-5 flex w-full flex-col gap-3 text-left">
            <Field label="Name">
              <Input
                value={identity.name}
                onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                placeholder="Your full name"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Branch">
                <Input
                  value={identity.branch}
                  onChange={(e) => setIdentity({ ...identity, branch: e.target.value })}
                  placeholder="Computer Science"
                />
              </Field>
              <Field label="Year">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={identity.year}
                  onChange={(e) => setIdentity({ ...identity, year: e.target.value })}
                />
              </Field>
            </div>
            <Button size="sm" loading={savingIdentity} onClick={saveIdentity}>
              Save
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="About you" subtitle="Shown to Faculty/Admin and used by AI Tools for better matches." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 90000 00000" />
              </Field>
              <Field label="College">
                <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="Aravali Engineering College" />
              </Field>
              <Field label="LinkedIn">
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/you"
                />
              </Field>
              <Field label="GitHub">
                <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="github.com/you" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Bio" hint="A couple of sentences — what you're building or looking for.">
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Skills" subtitle="Feeds directly into AI Tools' opportunity matching." />
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-sm font-medium text-forest-700">
                  {s}
                  <button onClick={() => removeSkill(s)} className="-my-1.5 -mr-2 flex h-9 w-9 items-center justify-center rounded-full text-forest-400 hover:text-forest-700" aria-label={`Remove ${s}`}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill and press Enter"
                className="max-w-xs"
              />
              <Button variant="secondary" size="sm" onClick={addSkill}>
                <Plus size={14} /> Add
              </Button>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              {form.linkedin ? (
                <span className="flex items-center gap-1"><Link2 size={13} /> LinkedIn linked</span>
              ) : null}
              {form.github ? (
                <span className="flex items-center gap-1"><Link2 size={13} /> GitHub linked</span>
              ) : null}
            </div>
            <Button className="w-full sm:w-auto" loading={save.isPending} onClick={() => save.mutate(form)}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
