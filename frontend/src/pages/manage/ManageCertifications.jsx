import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { listCertifications, createCertification, updateCertification, deleteCertification } from '../../api/certifications';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { CertificationCard } from '../../components/CertificationCard';

const EMPTY_FORM = {
  courseName: '',
  platform: '',
  companyName: '',
  deadline: '',
  externalLink: '',
  category: '',
  description: '',
  bannerImageFile: null,
  existingBannerImageUrl: '',
};

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function ManageCertifications({ scope }) {
  const { user } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileInputRef = useRef(null);

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['certifications', 'all'],
    queryFn: () => listCertifications({ includeExpired: true }),
  });

  const visible = scope === 'own' ? certifications.filter((c) => c.createdBy === user.id) : certifications;
  const sorted = [...visible].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['certifications'] });

  const create = useMutation({
    mutationFn: (payload) => createCertification(payload),
    onSuccess: () => {
      invalidate();
      push('Certification posted.', { variant: 'success' });
      setModalOpen(false);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not post that certification.', { variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => updateCertification(id, payload),
    onSuccess: () => {
      invalidate();
      push('Certification updated.', { variant: 'success' });
      setModalOpen(false);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not update that certification.', { variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteCertification(id),
    onSuccess: () => {
      invalidate();
      push('Certification removed.', { variant: 'success' });
      setPendingDelete(null);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not delete that certification.', { variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (cert) => {
    setEditing(cert);
    setForm({
      courseName: cert.courseName,
      platform: cert.platform,
      companyName: cert.companyName || '',
      deadline: toDateInput(cert.deadline),
      externalLink: cert.externalLink,
      category: cert.category || '',
      description: cert.description || '',
      bannerImageFile: null,
      existingBannerImageUrl: cert.bannerImageUrl || '',
    });
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((f) => ({ ...f, bannerImageFile: file }));
  };

  // Preview URL for a newly-picked file is derived during render; the effect only
  // revokes it on change/unmount, so it never sets state.
  const previewUrl = useMemo(
    () => (form.bannerImageFile ? URL.createObjectURL(form.bannerImageFile) : ''),
    [form.bannerImageFile]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayedImage = previewUrl || form.existingBannerImageUrl;

  const submit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars -- stripped out, never sent to the API
    const { existingBannerImageUrl: _existingBannerImageUrl, ...payload } = form;
    if (editing) update.mutate({ id: editing._id, payload });
    else create.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title={scope === 'own' ? 'Your Certifications' : 'All Certifications'}
        subtitle={scope === 'own' ? 'Create, edit, and manage the certifications you recommend.' : 'Every certification posted across campus — edit or remove any of them.'}
        action={<Button onClick={openCreate}><Plus size={16} /> New certification</Button>}
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Award}
          title={scope === 'own' ? "You haven't posted any certifications yet" : 'No certifications posted yet'}
          description="Recommend a course to help students build their profile."
          action={<Button onClick={openCreate}><Plus size={16} /> New certification</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((cert) => (
            <CertificationCard
              key={cert._id}
              certification={cert}
              footer={
                <>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(cert)}>
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(cert)}>
                    <Trash2 size={13} />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit certification' : 'New certification'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Post certification'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Course banner" hint="Optional — shown at the top of the course card. Falls back to a gradient if skipped.">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-forest-400"
              >
                {displayedImage ? (
                  <img src={displayedImage} alt="Banner preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-sm text-slate-400">
                    <ImagePlus size={20} />
                    Click to add a course banner
                  </span>
                )}
              </button>
              <input ref={fileInputRef} id="ct-banner" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </Field>
          </div>
          <Field label="Course name" htmlFor="ct-course">
            <Input id="ct-course" required value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} />
          </Field>
          <Field label="Platform" htmlFor="ct-platform">
            <Input id="ct-platform" required value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="Coursera, AWS Skill Builder…" />
          </Field>
          <Field label="Provider" htmlFor="ct-company">
            <Input id="ct-company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Google, IBM, Meta…" />
          </Field>
          <Field label="Category" htmlFor="ct-cat">
            <Input id="ct-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Cloud, Data, Security…" />
          </Field>
          <Field label="Enrollment deadline" htmlFor="ct-deadline">
            <Input id="ct-deadline" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Course link" htmlFor="ct-link">
            <Input id="ct-link" type="url" required value={form.externalLink} onChange={(e) => setForm({ ...form, externalLink: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="ct-desc">
              <Textarea id="ct-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this certification?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(pendingDelete._id)}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ink-800">{pendingDelete?.courseName}</span> will be permanently removed.
        </p>
      </Modal>
    </div>
  );
}
