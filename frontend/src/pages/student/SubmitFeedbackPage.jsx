import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Send, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';
import Select from '../../components/ui/Select';
import QuestionRenderer from '../../components/feedback/QuestionRenderer';
import { formService } from '../../services/formService';
import { responseService } from '../../services/responseService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export default function SubmitFeedbackPage() {
  const [forms, setForms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { pushToast } = useToast();
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
        setSelected(list[0] || null);
      })
      .catch(() => {
        if (!active) return;
        setForms([]);
        setSelected(null);
      });

    return () => {
      active = false;
    };
  }, [bootstrapping, isAuthenticated]);

  const totalQuestions = selected?.questions?.length || 0;
  const answeredCount = useMemo(() => {
    if (!selected?.questions?.length) return 0;
    return selected.questions.filter((q) => answers[q.questionId] !== undefined && answers[q.questionId] !== '').length;
  }, [answers, selected?.questions]);

  const completion = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const onSubmit = async () => {
    if (!selected) return;
    const payload = {
      answers: selected.questions.map((q) => ({ questionId: q.questionId, value: answers[q.questionId] }))
    };

    try {
      await responseService.submit(selected._id, payload);
      setSubmitted(true);
      pushToast('Feedback submitted anonymously', 'success');
    } catch (error) {
      pushToast(error.response?.data?.error?.message || 'Submission failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Anonymous Feedback</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Share Constructive Course Feedback</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">Your identity stays hidden while your verified feedback drives measurable improvement.</p>
      </header>

      <SectionCard title="Feedback Session" subtitle="Select a form and track submission completion in real time">
        <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Select Form</label>
            <Select
              value={selected?._id || ''}
              onChange={(e) => {
                setSelected(forms.find((f) => f._id === e.target.value) || null);
                setAnswers({});
                setSubmitted(false);
              }}
            >
              {!forms.length && <option value="">No available forms</option>}
              {forms.map((form) => (
                <option key={form._id} value={form._id}>
                  {form.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-elevated)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Progress</p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/65 dark:bg-slate-800/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-700)] to-[var(--accent-500)]"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.28 }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {answeredCount} / {totalQuestions} answered ({completion}%)
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <ClipboardList className="h-3.5 w-3.5" />
              Complete all sections before submission.
            </p>
          </div>
        </div>
      </SectionCard>

      {!forms.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No assigned forms"
          description="No published forms are currently assigned to your profile."
        />
      ) : (
        <SectionCard title={selected?.title || 'Feedback Form'} subtitle="Provide thoughtful, specific feedback for better teaching outcomes">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-300/35 bg-gradient-to-br from-emerald-500/15 to-emerald-400/5 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              <p className="inline-flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Submission successful
              </p>
              <p className="mt-1">Thanks for your input. Your response has been recorded anonymously.</p>
            </div>
          ) : null}

          <div className="space-y-4">
            {selected?.questions?.map((q, index) => (
              <motion.div
                key={q.questionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] p-5"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Question {index + 1}</p>
                <p className="mb-4 text-base font-semibold leading-relaxed text-[var(--text-primary)]">{q.label}</p>
                <QuestionRenderer
                  question={q}
                  value={answers[q.questionId]}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, [q.questionId]: value }))}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="h-4 w-4" />
              Anonymous but verified submission.
            </p>
            <Button onClick={onSubmit} type="button" disabled={!selected || !selected.questions?.length} className="group">
              <Send className="h-4 w-4 transition group-hover:translate-x-0.5" />
              Submit Feedback
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
