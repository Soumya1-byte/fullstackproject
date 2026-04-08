import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { formService } from '../../services/formService';
import { analyticsService } from '../../services/analyticsService';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

export default function FormsListPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [forms, setForms] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  const loadForms = async () => {
    const list = await formService.list();
    setForms(list || []);

    const summaryPairs = await Promise.all(
      (list || []).map(async (form) => {
        try {
          const summary = await analyticsService.summary(form._id);
          return [form._id, summary];
        } catch {
          return [form._id, { responseCount: 0, avgRating: null }];
        }
      })
    );

    setSummaries(Object.fromEntries(summaryPairs));
  };

  useEffect(() => {
    loadForms().finally(() => setLoading(false));
  }, []);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredForms = useMemo(() => {
    if (!normalizedQuery) return forms;
    return forms.filter((form) =>
      [form.title, form.status].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [forms, normalizedQuery]);

  const handlePublish = async (formId) => {
    setActionLoadingId(formId);
    try {
      await formService.publish(formId);
      pushToast('Form published', 'success');
      await loadForms();
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Could not publish form', 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleClose = async (formId) => {
    setActionLoadingId(formId);
    try {
      await formService.close(formId);
      pushToast('Form closed', 'success');
      await loadForms();
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Could not close form', 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <Card title="Feedback Forms">
      <div className="space-y-2">
        {loading && [1, 2, 3].map((item) => <Skeleton key={item} className="h-16" />)}
        {!loading && filteredForms.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            {normalizedQuery ? 'No forms match the current search.' : 'No forms yet. Start from Form Builder to create your first feedback workflow.'}
          </div>
        )}
        {!loading &&
          filteredForms.map((form) => (
            <div key={form._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{form.title}</p>
                <p className="text-sm text-slate-500">
                  {form.questions?.length || 0} questions • {summaries[form._id]?.responseCount ?? 0} responses • Avg:{' '}
                  {summaries[form._id]?.avgRating ?? 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{form.status}</Badge>
                {form.status === 'DRAFT' ? (
                  <Button
                    type="button"
                    className="px-3 py-1 text-xs"
                    onClick={() => handlePublish(form._id)}
                    disabled={actionLoadingId === form._id}
                  >
                    Publish
                  </Button>
                ) : null}
                {form.status === 'PUBLISHED' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-1 text-xs"
                    onClick={() => handleClose(form._id)}
                    disabled={actionLoadingId === form._id}
                  >
                    Close
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}
