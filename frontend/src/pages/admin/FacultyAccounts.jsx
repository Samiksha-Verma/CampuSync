import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getFacultyRequests, approveFacultyRequest, rejectFacultyRequest } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FilterChips } from '../../components/ui/FilterChips';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Field, Textarea } from '../../components/ui/Input';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function FacultyAccounts() {
  const [status, setStatus] = useState('pending');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const { push } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['faculty-requests', status],
    queryFn: () => getFacultyRequests(status),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['faculty-requests'] });

  const approve = useMutation({
    mutationFn: (id) => approveFacultyRequest(id),
    onSuccess: (faculty) => {
      invalidate();
      push(`${faculty.name} approved — confirmation email sent.`, { variant: 'success' });
    },
    onError: (err) => push(err.response?.data?.message || 'Could not approve this request.', { variant: 'error' }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }) => rejectFacultyRequest(id, reason),
    onSuccess: (faculty) => {
      invalidate();
      push(`${faculty.name}'s application was rejected.`, { variant: 'success' });
      setRejecting(null);
      setReason('');
    },
    onError: (err) => push(err.response?.data?.message || 'Could not reject this request.', { variant: 'error' }),
  });

  return (
    <div>
      <PageHeader
        title="Faculty Accounts"
        subtitle="Review self-signup applications — approve to let them log in, or reject with an optional reason."
      />

      <div className="mb-6">
        <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </div>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === 'pending' ? 'No pending applications' : `No ${status} applications`}
          description={
            status === 'pending'
              ? "You're all caught up — new Faculty signups will show up here for review."
              : 'Nothing to show in this view yet.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Card key={r._id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <p className="text-sm font-medium text-ink-800">{r.name}</p>
                  {r.department ? <Badge variant="neutral">{r.department}</Badge> : null}
                </div>
                <p className="mt-0.5 break-all text-sm text-slate-500">{r.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={12} /> Applied {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </p>
                {r.status === 'rejected' && r.rejectionReason ? (
                  <p className="mt-2 rounded-lg bg-danger-bg px-3 py-1.5 text-xs text-danger">Reason: {r.rejectionReason}</p>
                ) : null}
              </div>

              {r.status === 'pending' ? (
                <div className="flex shrink-0 gap-2 max-sm:[&>button]:flex-1">
                  <Button size="sm" variant="danger" onClick={() => setRejecting(r)}>
                    <XCircle size={14} /> Reject
                  </Button>
                  <Button size="sm" loading={approve.isPending} onClick={() => approve.mutate(r._id)}>
                    <CheckCircle2 size={14} /> Approve
                  </Button>
                </div>
              ) : (
                <Badge variant={r.status === 'active' ? 'success' : 'danger'} className="shrink-0 self-start capitalize sm:self-auto">
                  {r.status === 'active' ? 'Approved' : 'Rejected'}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!rejecting}
        onClose={() => { setRejecting(null); setReason(''); }}
        title="Reject this application?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejecting(null); setReason(''); }}>
              Cancel
            </Button>
            <Button variant="danger" loading={reject.isPending} onClick={() => reject.mutate({ id: rejecting._id, reason })}>
              Reject
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          <span className="font-medium text-ink-800">{rejecting?.name}</span> won't be able to log in. They can
          re-apply with the same email later if you give them a reason to fix.
        </p>
        <Field label="Reason" hint="Optional — shown to the applicant if they try to log in.">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Could not verify department affiliation" />
        </Field>
      </Modal>
    </div>
  );
}
