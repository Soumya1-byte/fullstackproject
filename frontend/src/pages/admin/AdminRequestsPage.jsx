import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import SectionCard from '../../components/ui/SectionCard';
import Textarea from '../../components/ui/Textarea';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { userService } from '../../services/userService';

const PRIMARY_ADMIN_EMAIL = 'soumya.mishra.7812@gmail.com';

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'APPROVED' || normalized === 'DENIED' || normalized === 'PENDING') {
    return normalized;
  }
  return 'NONE';
}

function formatDate(value) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString();
}

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);
  const tone =
    normalizedStatus === 'APPROVED'
      ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-700'
      : normalizedStatus === 'DENIED'
        ? 'border-rose-300/40 bg-rose-500/10 text-rose-700'
        : 'border-amber-300/40 bg-amber-500/10 text-amber-700';

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{normalizedStatus}</span>;
}

export default function AdminRequestsPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [requests, setRequests] = useState([]);
  const [decisionNotes, setDecisionNotes] = useState({});
  const [processingId, setProcessingId] = useState('');
  const { user } = useAuth();
  const { pushToast } = useToast();
  const isPrimaryAdmin = user?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL;

  const loadRequests = async () => {
    const data = await userService.listAdminRequests();
    setRequests(data || []);
  };

  useEffect(() => {
    loadRequests().catch(() => {
      setRequests([]);
    });
  }, []);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    if (!normalizedQuery) return requests;
    return requests.filter((request) =>
      [
        request.name,
        request.email,
        normalizeStatus(request.adminRequestStatus),
        request.role,
        request.adminRequestMessage,
        request.adminRequestDecisionNote
      ]
        .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [requests, normalizedQuery]);

  const pendingCount = useMemo(() => requests.filter((request) => normalizeStatus(request.adminRequestStatus) === 'PENDING').length, [requests]);

  const onReview = async (userId, decision) => {
    setProcessingId(userId);
    try {
      await userService.reviewAdminRequest(userId, { decision, note: decisionNotes[userId] || '' });
      pushToast(`Request ${decision === 'APPROVED' ? 'approved' : 'denied'}`, 'success');
      await loadRequests();
    } catch (error) {
      pushToast(getErrorMessage(error, 'Could not review request'), 'error');
    } finally {
      setProcessingId('');
    }
  };

  const onDemote = async (userId) => {
    setProcessingId(userId);
    try {
      await userService.demoteAdmin(userId, { note: decisionNotes[userId] || 'Admin access removed by primary admin' });
      pushToast('Admin access removed', 'success');
      await loadRequests();
    } catch (error) {
      pushToast(getErrorMessage(error, 'Could not remove admin access'), 'error');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Admin Access</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">My Admins</h1>
        <p className="max-w-2xl text-sm text-[var(--text-muted)]">
          Review student requests for elevated access and decide who can join the admin workspace.
        </p>
      </header>

      <SectionCard
        title="Admin Request Queue"
        subtitle={`${pendingCount} pending request(s) waiting for review`}
        action={
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
            <CheckCheck className="h-4 w-4 text-[var(--brand-500)]" />
            Decisions update account access immediately for the next login.
          </div>
        }
      >
        {!filteredRequests.length ? (
          <EmptyState
            icon={ShieldAlert}
            title={normalizedQuery ? 'No matching admin requests' : 'No admin requests yet'}
            description={
              normalizedQuery
                ? 'Try a different student name, email, or request status.'
                : 'Student admin access requests will appear here as soon as they are submitted.'
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const requestId = request._id || request.id;
              const normalizedStatus = normalizeStatus(request.adminRequestStatus);
              const isPending = normalizedStatus === 'PENDING';
              const isApprovedAdmin = normalizedStatus === 'APPROVED' && String(request.role || '').toUpperCase() === 'ADMIN';
              const isBusy = processingId === requestId;
              const canDemote = isPrimaryAdmin && isApprovedAdmin && request.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL;

              return (
                <div key={requestId} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[var(--text-primary)]">{request.name}</p>
                        <StatusBadge status={normalizedStatus} />
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">{request.email}</p>
                      <p className="text-xs text-[var(--text-muted)]">Requested on {formatDate(request.adminRequestRequestedAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-2 text-xs text-[var(--text-muted)]">
                      Current role: <span className="font-semibold text-[var(--text-primary)]">{request.role}</span>
                    </div>
                  </div>

                  {isPending ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" onClick={() => onReview(requestId, 'APPROVED')} disabled={isBusy || !requestId}>
                        <ShieldCheck className="h-4 w-4" />
                        {isBusy ? 'Saving...' : 'Approve'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => onReview(requestId, 'DENIED')} disabled={isBusy || !requestId}>
                        <ShieldX className="h-4 w-4" />
                        {isBusy ? 'Saving...' : 'Deny'}
                      </Button>
                    </div>
                  ) : null}

                  {canDemote ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => onDemote(requestId)} disabled={isBusy || !requestId}>
                        <ShieldX className="h-4 w-4" />
                        {isBusy ? 'Saving...' : 'Remove as Admin'}
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Student Message</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {request.adminRequestMessage || 'No reason was included with this request.'}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Decision Note</span>
                        <Textarea
                          rows={4}
                          disabled={(!isPending && !canDemote) || isBusy}
                          placeholder={canDemote ? 'Add a short note for removing admin access' : 'Add a short decision note'}
                          value={decisionNotes[requestId] || ''}
                          onChange={(event) => setDecisionNotes((prev) => ({ ...prev, [requestId]: event.target.value }))}
                        />
                      </label>

                      {request.adminRequestReviewedAt ? (
                        <p className="text-xs text-[var(--text-muted)]">Last reviewed on {formatDate(request.adminRequestReviewedAt)}</p>
                      ) : null}
                      {request.adminRequestDecisionNote ? (
                        <p className="text-xs text-[var(--text-secondary)]">Saved note: {request.adminRequestDecisionNote}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
