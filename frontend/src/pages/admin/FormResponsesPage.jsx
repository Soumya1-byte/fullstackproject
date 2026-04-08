import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';

function renderValue(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function FormResponsesPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [forms, setForms] = useState([]);
  const [formId, setFormId] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    formService
      .list()
      .then((data) => {
        const list = data || [];
        setForms(list);
        if (list.length) setFormId(list[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!formId) return;
    setLoading(true);
    responseService
      .listForForm(formId)
      .then((data) => setResponses(data || []))
      .catch(() => setResponses([]))
      .finally(() => setLoading(false));
  }, [formId]);

  const avgAnswerCount = useMemo(() => {
    if (!responses.length) return 0;
    return (responses.reduce((sum, item) => sum + (item.answers?.length || 0), 0) / responses.length).toFixed(1);
  }, [responses]);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredForms = useMemo(() => {
    if (!normalizedQuery) return forms;
    return forms.filter((form) => String(form.title || '').toLowerCase().includes(normalizedQuery));
  }, [forms, normalizedQuery]);

  useEffect(() => {
    if (!filteredForms.length) {
      setFormId('');
      setResponses([]);
      return;
    }

    if (!filteredForms.some((form) => form._id === formId)) {
      setFormId(filteredForms[0]._id);
    }
  }, [filteredForms, formId]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Response Explorer</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Detailed Form Responses</h1>
        <p className="max-w-2xl text-sm text-[var(--text-muted)]">Inspect submission depth, answer quality, and timeline for each published form.</p>
      </header>

      <SectionCard title="Filter Responses" subtitle="Choose form to inspect response details">
        <Select value={formId} onChange={(e) => setFormId(e.target.value)}>
          {!filteredForms.length && <option value="">{normalizedQuery ? 'No matching forms' : 'No forms available'}</option>}
          {filteredForms.map((form) => (
            <option key={form._id} value={form._id}>
              {form.title}
            </option>
          ))}
        </Select>
      </SectionCard>

      <SectionCard title="Response Summary" subtitle="Submission quality and volume snapshot">
        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Total Responses</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{responses.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Avg Answers / Response</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{avgAnswerCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Latest Submission</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                {responses[0]?.submittedAt ? new Date(responses[0].submittedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Answer-Level Data" subtitle="Inspect each submission payload">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : responses.length === 0 ? (
          <EmptyState title="No responses captured" description="Publish the form and ask enrolled students to submit feedback." />
        ) : (
          <div className="space-y-3">
            {responses.map((response, index) => (
              <div key={response._id || index} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
                <p className="text-xs text-[var(--text-muted)]">Submitted: {new Date(response.submittedAt).toLocaleString()}</p>
                <div className="mt-3 space-y-2">
                  {(response.answers || []).map((answer) => (
                    <div key={answer.questionId} className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-3 py-2 text-sm">
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">{answer.questionId}</p>
                      <p className="font-medium text-[var(--text-primary)]">{renderValue(answer.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
