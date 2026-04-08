import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { formService } from '../../services/formService';
import apiClient from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';

export default function ReportExportPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const { pushToast } = useToast();

  useEffect(() => {
    formService.list().then((data) => {
      setForms(data || []);
      if (data?.length) setSelectedFormId(data[0]._id);
    });
  }, []);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredForms = useMemo(() => {
    if (!normalizedQuery) return forms;
    return forms.filter((form) =>
      [form.title, form.status].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [forms, normalizedQuery]);

  useEffect(() => {
    if (!filteredForms.length) {
      setSelectedFormId('');
      return;
    }

    if (!filteredForms.some((form) => form._id === selectedFormId)) {
      setSelectedFormId(filteredForms[0]._id);
    }
  }, [filteredForms, selectedFormId]);

  const fileBase = useMemo(() => 'feedback-report', []);

  const downloadFile = async (url, fileName) => {
    const response = await apiClient.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const exportCsv = async () => {
    if (!selectedFormId) return;
    try {
      await downloadFile(`/analytics/forms/${selectedFormId}/export.csv`, `${fileBase}-${selectedFormId}.csv`);
      pushToast('CSV exported', 'success');
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'CSV export failed', 'error');
    }
  };

  const exportPdf = async () => {
    if (!selectedFormId) return;
    try {
      await downloadFile(`/analytics/forms/${selectedFormId}/export.pdf`, `${fileBase}-${selectedFormId}.pdf`);
      pushToast('PDF export started', 'info');
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'PDF export failed', 'error');
    }
  };

  return (
    <Card title="Export Reports" subtitle="Download feedback analytics">
      <div className="space-y-3">
        <select
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          value={selectedFormId}
          onChange={(e) => setSelectedFormId(e.target.value)}
        >
          {!filteredForms.length && <option value="">{normalizedQuery ? 'No matching forms' : 'No forms available'}</option>}
          {filteredForms.map((form) => (
            <option key={form._id} value={form._id}>
              {form.title}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <Button type="button" onClick={exportCsv} disabled={!selectedFormId}>
            Export CSV
          </Button>
          <Button type="button" variant="secondary" onClick={exportPdf} disabled={!selectedFormId}>
            Export PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
