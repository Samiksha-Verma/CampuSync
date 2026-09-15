import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Pencil, Trash2 } from 'lucide-react';
import { listEvents, createEvent, updateEvent, deleteEvent } from '../../api/events';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { deadlineMeta } from '../../lib/deadline';

const EMPTY_FORM = {
  name: '',
  organizingClub: '',
  coordinatorName: '',
  contactInfo: '',
  description: '',
  deadline: '',
  registrationLink: '',
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
      deadline: toDateInput(event.deadline),
      registrationLink: event.registrationLink,
    });
    setModalOpen(true);
  };

  const submit = (e) => {
    e.preventDefault();
    if (editing) update.mutate({ id: editing._id, payload: form });
    else create.mutate(form);
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
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((event) => {
            const dl = deadlineMeta(event.deadline);
            return (
              <Card key={event._id} className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <CalendarDays size={18} strokeWidth={1.9} />
                  </div>
                  <Badge variant={dl.variant}>{dl.label}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink-800">{event.name}</h3>
                <p className="mt-0.5 text-sm font-medium text-forest-700">{event.organizingClub}</p>
                {event.description ? <p className="mt-2.5 line-clamp-2 text-sm text-slate-500">{event.description}</p> : null}
                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(event)}>
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(event)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </Card>
            );
          })}
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
          <Field label="Registration deadline" htmlFor="ev-deadline">
            <Input id="ev-deadline" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Registration link" htmlFor="ev-link">
            <Input id="ev-link" type="url" required value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} />
          </Field>
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
