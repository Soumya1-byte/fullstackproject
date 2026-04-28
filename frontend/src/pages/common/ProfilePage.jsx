import { useEffect, useState } from 'react';
import { Save, ShieldCheck, UserCircle2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SectionCard from '../../components/ui/SectionCard';
import Textarea from '../../components/ui/Textarea';
import { userService } from '../../services/userService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

function statusCopy(status) {
  if (status === 'PENDING') return 'Your admin access request is pending review.';
  if (status === 'APPROVED') return 'Your request has been approved. Sign out and sign back in to use admin access.';
  if (status === 'DENIED') return 'Your last request was denied. You can update your reason and submit a new request.';
  return 'You can request admin access from here if you need to manage courses, forms, or analytics.';
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);
  const { pushToast } = useToast();
  const { updateUser, role } = useAuth();

  useEffect(() => {
    userService
      .me()
      .then((data) => {
        setProfile(data);
        setName(data?.name || '');
        setDepartmentId(data?.departmentId || '');
        setRequestMessage(data?.adminRequestMessage || '');
      })
      .catch(() => {
        setProfile(null);
      });
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateMe({ name, departmentId: departmentId || null });
      setProfile(updated);
      updateUser({ name: updated.name });
      pushToast('Profile updated', 'success');
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Could not update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onRequestAdminAccess = async () => {
    setRequesting(true);
    try {
      const updated = await userService.requestAdminAccess({ message: requestMessage });
      setProfile(updated);
      setRequestMessage(updated?.adminRequestMessage || '');
      pushToast('Admin access request submitted', 'success');
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Could not submit admin request', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const isStudent = role === 'student';
  const requestStatus = profile?.adminRequestStatus || 'NONE';
  const requestPending = requestStatus === 'PENDING';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Account</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Profile Settings</h1>
        <p className="max-w-2xl text-sm text-[var(--text-muted)]">Manage your account identity and role-linked profile details.</p>
      </header>

      <SectionCard title="Personal Information" subtitle="This profile is shared across your dashboard sessions">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Full Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Email</span>
            <Input value={profile?.email || ''} disabled />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Role</span>
            <Input value={profile?.role || ''} disabled />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Department ID (optional)</span>
            <Input value={departmentId || ''} onChange={(e) => setDepartmentId(e.target.value)} placeholder="Department reference" />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
          <p className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <UserCircle2 className="h-4 w-4" />
            Keep your profile updated for clearer team visibility.
          </p>
        </div>
      </SectionCard>

      {isStudent ? (
        <SectionCard title="Admin Access Request" subtitle="Ask for elevated access when you need to manage the admin portal">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Current Status</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{requestStatus}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{statusCopy(requestStatus)}</p>
              {profile?.adminRequestReviewedAt ? (
                <p className="mt-2 text-xs text-[var(--text-muted)]">Reviewed on {new Date(profile.adminRequestReviewedAt).toLocaleString()}</p>
              ) : null}
              {profile?.adminRequestDecisionNote ? (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Admin note: {profile.adminRequestDecisionNote}</p>
              ) : null}
            </div>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Why do you need admin access?</span>
              <Textarea
                rows={5}
                value={requestMessage}
                disabled={requestPending || requesting}
                onChange={(event) => setRequestMessage(event.target.value)}
                placeholder="Share why you need access to courses, forms, reports, or admin workflows"
              />
            </label>

            <div className="flex items-center gap-3">
              <Button type="button" onClick={onRequestAdminAccess} disabled={requestPending || requesting}>
                <ShieldCheck className="h-4 w-4" />
                {requesting ? 'Submitting...' : requestPending ? 'Request Pending' : 'Request Admin Access'}
              </Button>
              <p className="text-xs text-[var(--text-muted)]">Once approved, sign out and sign back in to enter the admin portal.</p>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
