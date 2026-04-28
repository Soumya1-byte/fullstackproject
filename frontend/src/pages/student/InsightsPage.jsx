import { useEffect, useState } from 'react';
import SatisfactionPieChart from '../../components/charts/SatisfactionPieChart';
import RatingBarChart from '../../components/charts/RatingBarChart';
import Card from '../../components/ui/Card';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useAuth } from '../../hooks/useAuth';

export default function InsightsPage() {
  const [forms, setForms] = useState([]);
  const [formId, setFormId] = useState('');
  const [insights, setInsights] = useState({ satisfaction: [], distribution: [], suppressed: false });
  const [errorMessage, setErrorMessage] = useState('');
  const { bootstrapping, isAuthenticated } = useAuth();

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return undefined;

    let active = true;

    formService
      .list()
      .then((data) => {
        if (!active) return;
        const list = data || [];
        setForms(list);
        setFormId(list[0]?._id || '');
      })
      .catch(() => {
        if (!active) return;
        setForms([]);
        setFormId('');
      });

    return () => {
      active = false;
    };
  }, [bootstrapping, isAuthenticated]);

  useEffect(() => {
    if (!formId) return;

    responseService
      .insights(formId)
      .then((data) => {
        setInsights(data || { satisfaction: [], distribution: [], suppressed: false });
        setErrorMessage('');
      })
      .catch((error) => {
        setInsights({ satisfaction: [], distribution: [], suppressed: false });
        setErrorMessage(error.response?.data?.error?.message || 'Insights unavailable for this form yet');
      });
  }, [formId]);

  return (
    <div className="space-y-4">
      <Card title="Insights by Form" subtitle="View aggregated class feedback after submission">
        <select
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
        >
          {!forms.length && <option value="">No forms assigned</option>}
          {forms.map((form) => (
            <option key={form._id} value={form._id}>
              {form.title}
            </option>
          ))}
        </select>
      </Card>

      {errorMessage ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          {errorMessage}
        </div>
      ) : insights.suppressed ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          Insights are hidden until at least 5 responses are collected.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <SatisfactionPieChart data={insights.satisfaction || []} />
          <RatingBarChart data={insights.distribution || []} />
        </div>
      )}
    </div>
  );
}
