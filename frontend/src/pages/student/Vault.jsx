import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderLock, FileText, Upload, Download, Trash2, File } from 'lucide-react';
import { format } from 'date-fns';
import { uploadDocument, listDocuments, deleteDocument, downloadDocument } from '../../api/vault';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterChips } from '../../components/ui/FilterChips';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  { value: 'resume', label: 'Resume' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'internship_proof', label: 'Internship Proof' },
  { value: 'other', label: 'Other' },
];

const labelFor = (value) => CATEGORIES.find((c) => c.value === value)?.label || value;

export default function Vault() {
  const [filter, setFilter] = useState('all');
  const [uploadCategory, setUploadCategory] = useState('resume');
  const [pendingDelete, setPendingDelete] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { push } = useToast();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['vault-documents'],
    queryFn: () => listDocuments(),
  });

  const upload = useMutation({
    mutationFn: (file) => uploadDocument(file, uploadCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-documents'] });
      push('Document uploaded to your vault.', { variant: 'success' });
    },
    onError: (err) => push(err.response?.data?.message || 'Upload failed. Try a different file.', { variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-documents'] });
      push('Document removed.', { variant: 'success' });
      setPendingDelete(null);
    },
  });

  const [downloadingId, setDownloadingId] = useState(null);
  const handleDownload = async (doc) => {
    setDownloadingId(doc._id);
    try {
      await downloadDocument(doc._id, doc.fileName);
    } catch {
      push('Could not download that file. Try again.', { variant: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = '';
  };

  const filterOptions = [{ value: 'all', label: 'All' }, ...CATEGORIES];
  const filtered = filter === 'all' ? documents : documents.filter((d) => d.category === filter);

  return (
    <div>
      <PageHeader
        title="Document Vault"
        subtitle="Your resume, certificates, and offer letters — stored securely and ready to attach whenever you need them."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Category</label>
            <Select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="sm:w-56">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button onClick={() => fileInputRef.current?.click()} loading={upload.isPending}>
              <Upload size={16} />
              {upload.isPending ? 'Uploading…' : 'Upload document'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <FilterChips options={filterOptions} value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title={filter === 'all' ? 'Your vault is empty' : `No ${labelFor(filter).toLowerCase()} yet`}
          description="Upload your resume or certificates above — they'll stay here, ready to attach to applications or feed into the AI Resume Analyzer."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((doc) => (
            <Card key={doc._id} className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4 sm:flex-nowrap sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                {doc.fileType?.includes('pdf') ? <FileText size={18} /> : <File size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">{doc.fileName}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
              <Badge variant="neutral">{labelFor(doc.category)}</Badge>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(doc)}
                  loading={downloadingId === doc._id}
                  aria-label="Download"
                >
                  <Download size={14} />
                </Button>
                <Button size="sm" variant="danger" onClick={() => setPendingDelete(doc)} aria-label="Delete">
                  <Trash2 size={14} />
                </Button>
              </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this document?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(pendingDelete._id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <span className="font-medium text-ink-800">{pendingDelete?.fileName}</span> will be permanently removed
          from your vault. This can't be undone.
        </p>
      </Modal>
    </div>
  );
}
