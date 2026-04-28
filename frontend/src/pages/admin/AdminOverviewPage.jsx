import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Award, BookOpen, MessageSquare, Sparkles, TrendingUp } from 'lucide-react';
import StatsCard from '../../components/charts/StatsCard';
import SatisfactionPieChart from '../../components/charts/SatisfactionPieChart';
import RatingBarChart from '../../components/charts/RatingBarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';
import { analyticsService } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';
import { formService } from '../../services/formService';

export default function AdminOverviewPage() {
  const { dashboardSearchQuery = '' } = useOutletContext() || {};
  const [courses, setCourses] = useState([]);
  const [forms, setForms] = useState([]);
  const [overview, setOverview] = useState({ satisfaction: [], distribution: [], trends: [], suppressed: false });

  useEffect(() => {
    Promise.all([courseService.list(), formService.list(), analyticsService.overview()])
      .then(([courseData, formData, overviewData]) => {
        setCourses(courseData || []);
        setForms(formData || []);
        setOverview(overviewData || { satisfaction: [], distribution: [], trends: [], suppressed: false });
      })
      .catch(() => {
        setCourses([]);
        setForms([]);
        setOverview({ satisfaction: [], distribution: [], trends: [], suppressed: false });
      });
  }, []);

  const normalizedQuery = dashboardSearchQuery.trim().toLowerCase();

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) return courses;
    return courses.filter((course) =>
      [course.code, course.title, course.semester, course.department].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [courses, normalizedQuery]);

  const filteredForms = useMemo(() => {
    if (!normalizedQuery) return forms;
    return forms.filter((form) =>
      [form.title, form.status].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
    );
  }, [forms, normalizedQuery]);

  const totals = useMemo(() => {
    const totalResponses = (overview.distribution || []).reduce((sum, item) => sum + item.count, 0);
    const weighted = (overview.distribution || []).reduce((sum, item) => sum + Number(item.bucket) * item.count, 0);
    const avgRating = totalResponses ? (weighted / totalResponses).toFixed(2) : '0.00';

    return {
      totalCourses: filteredCourses.length,
      avgRating,
      totalResponses,
      publishedForms: filteredForms.filter((form) => form.status === 'PUBLISHED').length
    };
  }, [filteredCourses, filteredForms, overview]);

  const intelligence = useMemo(() => {
    const strongest = [...(overview.distribution || [])].sort((a, b) => b.count - a.count)[0];
    const weakest = [...(overview.distribution || [])].sort((a, b) => a.count - b.count)[0];

    return {
      excellence: strongest ? `Most frequent rating pattern is ${strongest.bucket}/5` : 'Not enough data yet',
      improvement: weakest ? `Lowest representation bucket is ${weakest.bucket}/5` : 'Waiting for response volume'
    };
  }, [overview.distribution]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Admin Command Center</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">Institution Performance Overview</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
          Monitor teaching quality, response participation, and satisfaction trends from one premium analytics workspace.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Courses" value={totals.totalCourses} icon={BookOpen} trend="+8.5%" />
        <StatsCard label="Avg Satisfaction" value={totals.avgRating} icon={TrendingUp} hint="Weighted by all captured ratings" trend="+2.1%" />
        <StatsCard label="Total Responses" value={totals.totalResponses} icon={MessageSquare} trend="+12.6%" />
        <StatsCard label="Published Forms" value={totals.publishedForms} icon={Award} trend="+3.2%" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <SectionCard title="Feedback Intelligence" subtitle="Auto-generated insights from current response behavior">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-500/15 to-emerald-400/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Areas of Excellence</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{intelligence.excellence}</p>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-500/15 to-amber-400/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Areas for Improvement</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{intelligence.improvement}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Priority Queue" subtitle="Courses to monitor this week">
          <div className="space-y-2">
            {filteredCourses.slice(0, 4).map((course) => (
              <div key={course._id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-card)] px-3 py-2.5">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{course.code}</p>
                <p className="text-xs text-[var(--text-muted)]">{course.title}</p>
              </div>
            ))}
            {!filteredCourses.length ? (
              <EmptyState
                icon={AlertTriangle}
                title={normalizedQuery ? 'No matching courses' : 'No course activity'}
                description={
                  normalizedQuery
                    ? 'Try a different course code, title, semester, or department.'
                    : 'Create or assign courses to begin tracking quality metrics.'
                }
              />
            ) : null}
          </div>
        </SectionCard>
      </section>

      {overview.suppressed ? (
        <EmptyState
          icon={Sparkles}
          title="Analytics Locked"
          description="Privacy threshold protection is active. Collect at least 5 responses to unlock visual analytics."
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          <SatisfactionPieChart data={overview.satisfaction || []} />
          <RatingBarChart data={overview.distribution || []} />
          <TrendLineChart data={overview.trends || []} />
        </section>
      )}
    </div>
  );
}
