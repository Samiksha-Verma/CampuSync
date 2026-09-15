import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';

export default function StaffProfile() {
  const { user, role } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);
  const [form, setForm] = useState(null);

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile', user.id], queryFn: () => getProfile(user.id) });

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone || '',
        college: profile.college || '',
        linkedin: profile.linkedin || '',
        bio: profile.bio || '',
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

  if (isLoading || !form) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="Profile" subtitle="How students see you when you post content." />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-forest-100 text-2xl font-semibold text-forest-700">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name?.slice(0, 1).toUpperCase()
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-forest-700 text-white shadow-sm transition-colors hover:bg-forest-800"
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
          <h2 className="mt-4 font-display text-lg font-semibold text-ink-800">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          <p className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-500">{role}</p>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Contact & bio" subtitle="Shown to students alongside what you post." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 90000 00000" />
              </Field>
              <Field label="College / department">
                <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="Aravali Engineering College" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="LinkedIn">
                  <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/you" />
                </Field>
              </div>
            </div>
            <div className="mt-4">
              <Field label="Bio">
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
              </Field>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button loading={save.isPending} onClick={() => save.mutate(form)}>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
