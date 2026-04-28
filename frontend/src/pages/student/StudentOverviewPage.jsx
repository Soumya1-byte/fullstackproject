import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ClipboardList, Sparkles } from 'lucide-react';
import StatsCard from '../../components/charts/StatsCard';
import SectionCard from '../../components/ui/SectionCard';
import { courseService } from '../../services/courseService';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useAuth } from '../../hooks/useAuth';

export default function StudentOverviewPage() {
  const [courses, setCourses] = useState([]);
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const { bootstrapping, isAuthenticated } = useAuth();

  useEffect(() => {
    if (bootstrapping || !isAuthenticated) return undefined;

    let active = true;

    Promise.all([courseService.list(), formService.list(), responseService.myStatuses()])
      .then(([courseData, formData, submissionData]) => {
        if (!active) return;
        setCourses(courseData || []);
        setForms(formData || []);
        setSubmissions(submissionData || []);
      })
      .catch(() => {
        if (!active) return;
        setCourses([]);
        setForms([]);
        setSubmissions([]);
      });

    return () => {
      active = false;
    };
  }, [bootstrapping, isAuthenticated]);

  const pendingForms = useMemo(() => {
    const submittedFormIds = new Set(submissions.map((item) => String(item.formId)));
    return forms.filter((form) => !submittedFormIds.has(String(form._id))).length;
  }, [forms, submissions]);

  const progress = useMemo(() => {
    if (!forms.length) return 0;
    return Math.min(100, Math.round((submissions.length / forms.length) * 100));
  }, [forms.length, submissions.length]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Student Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Your Feedback Journey</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
          Track your participation and unlock richer insights by completing assigned feedback forms.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Assigned Courses" value={courses.length} icon={BookOpen} trend="+4.0%" />
        <StatsCard label="Submitted Feedback" value={submissions.length} icon={CheckCircle2} trend="+9.4%" />
        <StatsCard label="Pending Forms" value={pendingForms} icon={ClipboardList} trend="-5.2%" />
      </div>

      <SectionCard title="Participation Progress" subtitle="Complete all available feedback to unlock advanced class insights">
        <div className="space-y-4">
          <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--brand-700)] via-[var(--brand-500)] to-[var(--accent-500)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <p className="text-[var(--text-secondary)]">Completion</p>
            <p className="font-semibold text-[var(--text-primary)]">{progress}%</p>
          </div>
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-4 text-sm text-[var(--text-secondary)]">
            {progress >= 100
              ? 'Excellent progress. You have completed all active forms and unlocked complete insight visibility.'
              : `You have ${pendingForms} remaining form(s). Submit feedback to unlock complete analytics.`}
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
            <Sparkles className="h-4 w-4 text-[var(--brand-500)]" />
            Consistent submissions improve data quality and teaching outcomes.
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
