import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Pencil, Trash2 } from 'lucide-react';
import { listOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from '../../api/opportunities';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { OpportunityCard } from '../../components/OpportunityCard';

const ROLE_TYPES = ['Remote', 'Full-time', 'Internship'];

const EMPTY_FORM = {
  companyName: '',
  role: '',
  type: 'internship',
  roleType: 'Full-time',
  location: '',
  companyWebsite: '',
  eligibilityCriteria: '',
  skillsRequired: '',
  stipendOrSalary: '',
  deadline: '',
  applicationLink: '',
  description: '',
};

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function ManageOpportunities({ scope }) {
  const { user } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities', 'all'],
    queryFn: () => listOpportunities({ includeExpired: true }),
  });

  const visible = scope === 'own' ? opportunities.filter((o) => o.createdBy === user.id) : opportunities;
  const sorted = [...visible].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['opportunities'] });

  const toPayload = (f) => ({
    ...f,
    skillsRequired: f.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
  });

  const create = useMutation({
    mutationFn: (payload) => createOpportunity(toPayload(payload)),
    onSuccess: () => {
      invalidate();
      push('Opportunity posted.', { variant: 'success' });
      setModalOpen(false);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not post that opportunity.', { variant: 'error' }),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => updateOpportunity(id, toPayload(payload)),
    onSuccess: () => {
      invalidate();
      push('Opportunity updated.', { variant: 'success' });
      setModalOpen(false);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not update that opportunity.', { variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteOpportunity(id),
    onSuccess: () => {
      invalidate();
      push('Opportunity removed.', { variant: 'success' });
      setPendingDelete(null);
    },
    onError: (err) => push(err.response?.data?.message || 'Could not delete that opportunity.', { variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (opp) => {
    setEditing(opp);
    setForm({
      companyName: opp.companyName,
      role: opp.role,
      type: opp.type,
      roleType: opp.roleType || 'Full-time',
      location: opp.location || '',
      companyWebsite: opp.companyWebsite || '',
      eligibilityCriteria: opp.eligibilityCriteria || '',
      skillsRequired: (opp.skillsRequired || []).join(', '),
      stipendOrSalary: opp.stipendOrSalary || '',
      deadline: toDateInput(opp.deadline),
      applicationLink: opp.applicationLink,
      description: opp.description || '',
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
        title={scope === 'own' ? 'Your Internships & Jobs' : 'All Internships & Jobs'}
        subtitle={scope === 'own' ? 'Create, edit, and manage the openings you post.' : 'Every opening posted across campus — edit or remove any of them.'}
        action={<Button onClick={openCreate}><Plus size={16} /> New opening</Button>}
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={scope === 'own' ? "You haven't posted any openings yet" : 'No openings posted yet'}
          description="Post an internship or job to let students apply."
          action={<Button onClick={openCreate}><Plus size={16} /> New opening</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((opp) => (
            <OpportunityCard
              key={opp._id}
              opportunity={opp}
              footer={
                <>
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(opp)}>
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(opp)}>
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
        title={editing ? 'Edit opening' : 'New opening'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Post opening'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="op-company">
            <Input id="op-company" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </Field>
          <Field label="Role" htmlFor="op-role">
            <Input id="op-role" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Company website" htmlFor="op-website" hint="Optional — used to show the company logo. e.g. google.com">
              <Input id="op-website" value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="google.com or https://google.com" />
            </Field>
          </div>
          <Field label="Type" htmlFor="op-type">
            <Select id="op-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="internship">Internship</option>
              <option value="job">Job</option>
            </Select>
          </Field>
          <Field label="Role type" htmlFor="op-roletype" hint="Shown as a filter to students.">
            <Select id="op-roletype" value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value })}>
              {ROLE_TYPES.map((rt) => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </Select>
          </Field>
          <Field label="Location" htmlFor="op-location">
            <Input id="op-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru, or Remote" />
          </Field>
          <Field label="Stipend / salary" htmlFor="op-pay">
            <Input id="op-pay" value={form.stipendOrSalary} onChange={(e) => setForm({ ...form, stipendOrSalary: e.target.value })} placeholder="e.g. ₹25,000/month" />
          </Field>
          <Field label="Application deadline" htmlFor="op-deadline">
            <Input id="op-deadline" type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Application link" htmlFor="op-link">
            <Input id="op-link" type="url" required value={form.applicationLink} onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Eligibility criteria" htmlFor="op-elig">
              <Input id="op-elig" value={form.eligibilityCriteria} onChange={(e) => setForm({ ...form, eligibilityCriteria: e.target.value })} placeholder="e.g. 3rd/4th year CS" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Skills required" htmlFor="op-skills" hint="Comma-separated.">
              <Input id="op-skills" value={form.skillsRequired} onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })} placeholder="Node.js, React, SQL" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="op-desc">
              <Textarea id="op-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this opening?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(pendingDelete._id)}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ink-800">{pendingDelete?.role}</span> at {pendingDelete?.companyName} will
          be permanently removed.
        </p>
      </Modal>
    </div>
  );
}
