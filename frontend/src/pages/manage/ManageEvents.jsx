import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { listEvents, createEvent, updateEvent, deleteEvent } from '../../api/events';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { EventCard } from '../../components/EventCard';

const EMPTY_FORM = {
  name: '',
  organizingClub: '',
  coordinatorName: '',
  contactInfo: '',
  description: '',
  eventDate: '',
  deadline: '',
  registrationLink: '',
  bannerImageFile: null,
  existingBannerImageUrl: '',
};

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function ManageEvents({ scope }) {
  const { user } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileInputRef = useRef(null);

  const { data: events = [], isLoading } = useQuery({ queryKey: ['events', 'all'], queryFn: () => listEvents(true) });

  const visible = scope === 'own' ? events.filter((e) => e.createdBy === user.id) : events;
  const sorted = [...visible].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const create = useMutation({
    mutationFn: (payload) => createEvent(payload),
    onSuccess: () => {
      invalidate();
      push('Event posted.', { variant: 'success' });
      setModalOpen(false);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not post that event.', { variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => updateEvent(id, payload),
    onSuccess: () => {
      invalidate();
      push('Event updated.', { variant: 'success' });
      setModalOpen(false);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not update that event.', { variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteEvent(id),
    onSuccess: () => {
      invalidate();
      push('Event removed.', { variant: 'success' });
      setPendingDelete(null);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not delete that event.', { variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setForm({
      name: event.name,
      organizingClub: event.organizingClub,
      coordinatorName: event.coordinatorName,
      contactInfo: event.contactInfo,
      description: event.description || '',
      eventDate: toDateInput(event.eventDate),
      deadline: toDateInput(event.deadline),
      registrationLink: event.registrationLink,
      bannerImageFile: null,
      existingBannerImageUrl: event.bannerImageUrl || '',
    });
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((f) => ({ ...f, bannerImageFile: file }));
  };

  // Local preview for a newly-picked file needs an object URL - derived during
  // render (not stored in state) so the effect below only ever revokes it, never
  // triggers another render.
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
        title={scope === 'own' ? 'Your Events' : 'All Events'}
        subtitle={scope === 'own' ? 'Create, edit, and manage the events you post.' : 'Every event posted across campus — edit or remove any of them.'}
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> New event
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={scope === 'own' ? "You haven't posted any events yet" : 'No events posted yet'}
          description="Post one to let students know what's coming up."
          action={<Button onClick={openCreate}><Plus size={16} /> New event</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              footer={
                <>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(event)}>
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(event)}>
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
        title={editing ? 'Edit event' : 'New event'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Post event'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Banner image" hint="Optional — shown at the top of the event card. Falls back to a gradient if skipped.">
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
                    Click to add a banner image
                  </span>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </Field>
          </div>
          <Field label="Event name" htmlFor="ev-name">
            <Input id="ev-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Organizing club" htmlFor="ev-club">
            <Input id="ev-club" required value={form.organizingClub} onChange={(e) => setForm({ ...form, organizingClub: e.target.value })} />
          </Field>
          <Field label="Coordinator name" htmlFor="ev-coord">
            <Input id="ev-coord" required value={form.coordinatorName} onChange={(e) => setForm({ ...form, coordinatorName: e.target.value })} />
          </Field>
          <Field label="Contact info" htmlFor="ev-contact">
            <Input id="ev-contact" required value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
          </Field>
          <Field label="Event date" htmlFor="ev-date" hint="When the event actually happens">
            <Input id="ev-date" type="date" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          </Field>
          <Field label="Registration deadline" htmlFor="ev-deadline" hint="Last day students can register">
            <Input id="ev-deadline" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Registration link" htmlFor="ev-link">
              <Input id="ev-link" type="url" required value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="ev-desc">
              <Textarea id="ev-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this event?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(pendingDelete._id)}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ink-800">{pendingDelete?.name}</span> will be permanently removed. Students
          will no longer see it.
        </p>
      </Modal>
    </div>
  );
}
